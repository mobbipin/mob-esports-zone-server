import { Hono } from 'hono';
import { nanoid } from 'nanoid';
import { jwtAuth } from '../middleware/auth';

const friends = new Hono();

// Send friend request (prevent duplicates)
friends.post('/request', jwtAuth, async (c: any) => {
  const { friendId } = await c.req.json();
  const userId = c.get('user').id;
  if (userId === friendId) return c.json({ status: false, error: 'Cannot add yourself as a friend' }, 400);
  // Check for existing request (pending or accepted)
  const { results } = await c.env.DB.prepare('SELECT * FROM Friend WHERE ((userId = ? AND friendId = ?) OR (userId = ? AND friendId = ?)) AND status IN ("pending", "accepted")')
    .bind(userId, friendId, friendId, userId).all();
  if (results.length) {
    return c.json({ status: false, error: 'Friend request already exists or you are already friends' }, 400);
  }
  const id = nanoid();
  const createdAt = new Date().toISOString();
  await c.env.DB.prepare('INSERT INTO Friend (id, userId, friendId, status, createdAt) VALUES (?, ?, ?, ?, ?)')
    .bind(id, userId, friendId, 'pending', createdAt).run();
  return c.json({ status: true, message: 'Friend request sent' });
});

// Accept friend request
friends.put('/:id/accept', jwtAuth, async (c: any) => {
  const { id } = c.req.param();
  await c.env.DB.prepare('UPDATE Friend SET status = ? WHERE id = ?').bind('accepted', id).run();
  return c.json({ status: true, message: 'Friend request accepted' });
});

// Reject friend request
friends.put('/:id/reject', jwtAuth, async (c: any) => {
  const { id } = c.req.param();
  await c.env.DB.prepare('UPDATE Friend SET status = ? WHERE id = ?').bind('rejected', id).run();
  return c.json({ status: true, message: 'Friend request rejected' });
});

// List friends and all friend requests (sent and received), include user info
friends.get('/', jwtAuth, async (c: any) => {
  const userId = c.get('user').id;
  const { results } = await c.env.DB.prepare(`
    SELECT Friend.*, 
      U1.displayName as userDisplayName, U1.username as userUsername, U1.avatar as userAvatar,
      U2.displayName as friendDisplayName, U2.username as friendUsername, U2.avatar as friendAvatar, U2.banned as friendBanned
    FROM Friend
    LEFT JOIN User U1 ON Friend.userId = U1.id
    LEFT JOIN User U2 ON Friend.friendId = U2.id
    WHERE Friend.userId = ? OR Friend.friendId = ?
  `).bind(userId, userId).all();
  return c.json({ status: true, data: results });
});

// Cancel friend request (delete or set status to rejected)
friends.delete('/:id/cancel', jwtAuth, async (c: any) => {
  const { id } = c.req.param();
  await c.env.DB.prepare('UPDATE Friend SET status = ? WHERE id = ?').bind('rejected', id).run();
  return c.json({ status: true, message: 'Friend request canceled' });
});

// Set account public/private
friends.put('/privacy', jwtAuth, async (c: any) => {
  const { isPublic } = await c.req.json();
  const userId = c.get('user').id;
  await c.env.DB.prepare('UPDATE User SET isPublic = ? WHERE id = ?').bind(isPublic ? 1 : 0, userId).run();
  return c.json({ status: true, message: 'Privacy updated' });
});

export default friends; 