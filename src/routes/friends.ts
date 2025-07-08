import { Hono } from 'hono';
import { nanoid } from 'nanoid';
import { jwtAuth } from '../middleware/auth';

const friends = new Hono();

// Send friend request
friends.post('/request', jwtAuth, async (c: any) => {
  const { friendId } = await c.req.json();
  const userId = c.get('user').id;
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

// List friends
friends.get('/', jwtAuth, async (c: any) => {
  const userId = c.get('user').id;
  const { results } = await c.env.DB.prepare('SELECT * FROM Friend WHERE (userId = ? OR friendId = ?) AND status = ?')
    .bind(userId, userId, 'accepted').all();
  return c.json({ status: true, data: results });
});

// Set account public/private
friends.put('/privacy', jwtAuth, async (c: any) => {
  const { isPublic } = await c.req.json();
  const userId = c.get('user').id;
  await c.env.DB.prepare('UPDATE User SET isPublic = ? WHERE id = ?').bind(isPublic ? 1 : 0, userId).run();
  return c.json({ status: true, message: 'Privacy updated' });
});

export default friends; 