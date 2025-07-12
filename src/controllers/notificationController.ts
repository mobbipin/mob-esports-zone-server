import { nanoid } from 'nanoid';
import { z } from 'zod';

const SendAdminMessageSchema = z.object({
  teamId: z.string(),
  title: z.string().min(1),
  message: z.string().min(1)
});

const MarkNotificationReadSchema = z.object({
  notificationId: z.string()
});

export const getNotifications = async (c: any) => {
  const user = c.get('user');
  
  const { results: notifications } = await c.env.DB.prepare(`
    SELECT * FROM Notification 
    WHERE userId = ? 
    ORDER BY createdAt DESC 
    LIMIT 50
  `).bind(user.id).all();
  
  return c.json({ status: true, data: notifications });
};

export const markNotificationRead = async (c: any) => {
  const data = await c.req.json();
  const parse = MarkNotificationReadSchema.safeParse(data);
  if (!parse.success) return c.json({ status: false, error: parse.error.flatten() }, 400);
  
  const { notificationId } = parse.data;
  const user = c.get('user');
  
  const { results } = await c.env.DB.prepare(
    'UPDATE Notification SET isRead = 1 WHERE id = ? AND userId = ?'
  ).bind(notificationId, user.id).run();
  
  if (results.changes === 0) {
    return c.json({ status: false, error: 'Notification not found' }, 404);
  }
  
  return c.json({ status: true, message: 'Notification marked as read' });
};

export const markAllNotificationsRead = async (c: any) => {
  const user = c.get('user');
  
  await c.env.DB.prepare(
    'UPDATE Notification SET isRead = 1 WHERE userId = ?'
  ).bind(user.id).run();
  
  return c.json({ status: true, message: 'All notifications marked as read' });
};

export const sendAdminMessage = async (c: any) => {
  const data = await c.req.json();
  const parse = SendAdminMessageSchema.safeParse(data);
  if (!parse.success) return c.json({ status: false, error: parse.error.flatten() }, 400);
  
  const { teamId, title, message } = parse.data;
  const user = c.get('user');
  
  if (user.role !== 'admin') {
    return c.json({ status: false, error: 'Unauthorized' }, 403);
  }
  
  // Get team captain
  const { results: teamCaptain } = await c.env.DB.prepare(`
    SELECT tm.userId, u.username, u.displayName
    FROM TeamMembership tm
    JOIN User u ON tm.userId = u.id
    WHERE tm.teamId = ? AND tm.role = 'owner'
  `).bind(teamId).all();
  
  if (!teamCaptain.length) {
    return c.json({ status: false, error: 'Team captain not found' }, 404);
  }
  
  const captain = teamCaptain[0];
  
  // Create notification for team captain
  const notificationId = nanoid();
  const now = new Date().toISOString();
  
  await c.env.DB.prepare(
    'INSERT INTO Notification (id, userId, type, title, message, createdAt, data) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(notificationId, captain.userId, 'admin_message', title, message, now, JSON.stringify({ teamId, fromAdmin: user.id })).run();
  
  return c.json({ status: true, message: 'Message sent to team captain' });
};

export const getUnreadCount = async (c: any) => {
  const user = c.get('user');
  
  const { results } = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM Notification WHERE userId = ? AND isRead = 0'
  ).bind(user.id).all();
  
  return c.json({ status: true, data: { count: results[0].count } });
}; 