import { Hono } from 'hono';
import { nanoid } from 'nanoid';
import { jwtAuth } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';

const notifications = new Hono();

// Get notifications for current user
notifications.get('/', jwtAuth, async (c: any) => {
  const userId = c.get('user').id;
  const { results } = await c.env.DB.prepare('SELECT * FROM Notification WHERE userId = ? ORDER BY createdAt DESC').bind(userId).all();
  return c.json({ status: true, data: results });
});

// Mark notification as read
notifications.put('/:id/read', jwtAuth, async (c: any) => {
  const { id } = c.req.param();
  await c.env.DB.prepare('UPDATE Notification SET isRead = 1 WHERE id = ?').bind(id).run();
  return c.json({ status: true, message: 'Notification marked as read' });
});

// Admin: create notification (single or bulk)
notifications.post('/', jwtAuth, roleGuard('admin'), async (c: any) => {
  const { userId, type, content, link, bulk } = await c.req.json();
  const createdAt = new Date().toISOString();
  if (bulk) {
    // Send to all users
    const { results: users } = await c.env.DB.prepare('SELECT id FROM User').all();
    for (const user of users) {
      const id = nanoid();
      await c.env.DB.prepare('INSERT INTO Notification (id, userId, type, content, link, createdAt) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(id, user.id, type, content, link ?? null, createdAt).run();
    }
    return c.json({ status: true, message: 'Bulk notification sent' });
  } else {
    const id = nanoid();
    await c.env.DB.prepare('INSERT INTO Notification (id, userId, type, content, link, createdAt) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(id, userId, type, content, link ?? null, createdAt).run();
    return c.json({ status: true, message: 'Notification sent' });
  }
});

export default notifications; 