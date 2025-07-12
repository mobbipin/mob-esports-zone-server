import { nanoid } from 'nanoid';
import { z } from 'zod';

const SendFriendRequestSchema = z.object({
  receiverId: z.string()
});

const RespondToFriendRequestSchema = z.object({
  requestId: z.string(),
  action: z.enum(['accept', 'reject', 'cancel'])
});

const RemoveFriendSchema = z.object({
  friendId: z.string()
});

export const sendFriendRequest = async (c: any) => {
  const data = await c.req.json();
  const parse = SendFriendRequestSchema.safeParse(data);
  if (!parse.success) return c.json({ status: false, error: parse.error.flatten() }, 400);
  
  const { receiverId } = parse.data;
  const user = c.get('user');
  
  if (receiverId === user.id) {
    return c.json({ status: false, error: 'Cannot send friend request to yourself' }, 400);
  }
  
  // Check if receiver exists
  const { results: receiver } = await c.env.DB.prepare('SELECT * FROM User WHERE id = ? AND isDeleted = 0').bind(receiverId).all();
  if (!receiver.length) {
    return c.json({ status: false, error: 'User not found' }, 404);
  }
  
  // Check if friend request already exists
  const { results: existingRequest } = await c.env.DB.prepare(
    'SELECT * FROM FriendRequest WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)'
  ).bind(user.id, receiverId, receiverId, user.id).all();
  
  if (existingRequest.length > 0) {
    return c.json({ status: false, error: 'Friend request already exists' }, 400);
  }
  
  // Create friend request
  const requestId = nanoid();
  const now = new Date().toISOString();
  
  await c.env.DB.prepare(
    'INSERT INTO FriendRequest (id, senderId, receiverId, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(requestId, user.id, receiverId, 'pending', now, now).run();
  
  // Create notification for receiver
  const notificationId = nanoid();
  await c.env.DB.prepare(
    'INSERT INTO Notification (id, userId, type, title, message, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(notificationId, receiverId, 'friend_request', 'New Friend Request', `${user.username || user.displayName} sent you a friend request`, now).run();
  
  return c.json({ status: true, message: 'Friend request sent' });
};

export const respondToFriendRequest = async (c: any) => {
  const data = await c.req.json();
  const parse = RespondToFriendRequestSchema.safeParse(data);
  if (!parse.success) return c.json({ status: false, error: parse.error.flatten() }, 400);
  
  const { requestId, action } = parse.data;
  const user = c.get('user');
  
  // Get the friend request
  const { results: request } = await c.env.DB.prepare(
    'SELECT * FROM FriendRequest WHERE id = ?'
  ).bind(requestId).all();
  
  if (!request.length) {
    return c.json({ status: false, error: 'Friend request not found' }, 404);
  }
  
  const friendRequest = request[0];
  
  // Check if user is authorized to respond to this request
  if (action === 'cancel' && friendRequest.senderId !== user.id) {
    return c.json({ status: false, error: 'Only the sender can cancel a friend request' }, 403);
  }
  
  if ((action === 'accept' || action === 'reject') && friendRequest.receiverId !== user.id) {
    return c.json({ status: false, error: 'Only the receiver can accept or reject a friend request' }, 403);
  }
  
  const now = new Date().toISOString();
  
  if (action === 'accept') {
    // Update friend request status
    await c.env.DB.prepare(
      'UPDATE FriendRequest SET status = ?, updatedAt = ? WHERE id = ?'
    ).bind('accepted', now, requestId).run();
    
    // Create notification for sender
    const notificationId = nanoid();
    await c.env.DB.prepare(
      'INSERT INTO Notification (id, userId, type, title, message, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(notificationId, friendRequest.senderId, 'friend_request_accepted', 'Friend Request Accepted', `${user.username || user.displayName} accepted your friend request`, now).run();
    
    return c.json({ status: true, message: 'Friend request accepted' });
  } else if (action === 'reject') {
    // Update friend request status
    await c.env.DB.prepare(
      'UPDATE FriendRequest SET status = ?, updatedAt = ? WHERE id = ?'
    ).bind('rejected', now, requestId).run();
    
    return c.json({ status: true, message: 'Friend request rejected' });
  } else if (action === 'cancel') {
    // Update friend request status
    await c.env.DB.prepare(
      'UPDATE FriendRequest SET status = ?, updatedAt = ? WHERE id = ?'
    ).bind('cancelled', now, requestId).run();
    
    return c.json({ status: true, message: 'Friend request cancelled' });
  }
  
  return c.json({ status: false, error: 'Invalid action' }, 400);
};

export const getFriendRequests = async (c: any) => {
  const user = c.get('user');
  
  // Get incoming friend requests
  const { results: incomingRequests } = await c.env.DB.prepare(`
    SELECT fr.*, u.username, u.displayName, u.avatar
    FROM FriendRequest fr
    JOIN User u ON fr.senderId = u.id
    WHERE fr.receiverId = ? AND fr.status = 'pending'
    ORDER BY fr.createdAt DESC
  `).bind(user.id).all();
  
  // Get outgoing friend requests
  const { results: outgoingRequests } = await c.env.DB.prepare(`
    SELECT fr.*, u.username, u.displayName, u.avatar
    FROM FriendRequest fr
    JOIN User u ON fr.receiverId = u.id
    WHERE fr.senderId = ? AND fr.status = 'pending'
    ORDER BY fr.createdAt DESC
  `).bind(user.id).all();
  
  return c.json({
    status: true,
    data: {
      incoming: incomingRequests,
      outgoing: outgoingRequests
    }
  });
};

export const getFriends = async (c: any) => {
  const user = c.get('user');
  
  // Get accepted friend requests (both directions)
  const { results: friends } = await c.env.DB.prepare(`
    SELECT 
      CASE 
        WHEN fr.senderId = ? THEN fr.receiverId
        ELSE fr.senderId
      END as friendId,
      u.username,
      u.displayName,
      u.avatar,
      fr.createdAt as friendshipDate
    FROM FriendRequest fr
    JOIN User u ON (
      CASE 
        WHEN fr.senderId = ? THEN fr.receiverId
        ELSE fr.senderId
      END = u.id
    )
    WHERE (fr.senderId = ? OR fr.receiverId = ?) AND fr.status = 'accepted'
    ORDER BY fr.createdAt DESC
  `).bind(user.id, user.id, user.id, user.id).all();
  
  return c.json({ status: true, data: friends });
};

export const removeFriend = async (c: any) => {
  const data = await c.req.json();
  const parse = RemoveFriendSchema.safeParse(data);
  if (!parse.success) return c.json({ status: false, error: parse.error.flatten() }, 400);
  
  const { friendId } = parse.data;
  const user = c.get('user');
  
  // Find and delete the friend request
  const { results } = await c.env.DB.prepare(
    'DELETE FROM FriendRequest WHERE ((senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)) AND status = "accepted"'
  ).bind(user.id, friendId, friendId, user.id).run();
  
  if (results.changes === 0) {
    return c.json({ status: false, error: 'Friendship not found' }, 404);
  }
  
  return c.json({ status: true, message: 'Friend removed' });
}; 