import { Hono } from 'hono';
import { jwtAuth } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';
// import controllers as needed

const admin = new Hono();

// Users
admin.get('/users', jwtAuth, roleGuard('admin'), async (c) => {
  // TODO: List users
});
admin.put('/users/:id/ban', jwtAuth, roleGuard('admin'), async (c: any) => {
  const userId = c.req.param('id');
  const { results } = await c.env.DB.prepare('SELECT * FROM User WHERE id = ?').bind(userId).all();
  if (!results.length) {
    return c.json({ success: false, error: 'User not found' }, 404);
  }
  await c.env.DB.prepare('UPDATE User SET banned = 1 WHERE id = ?').bind(userId).run();
  return c.json({ success: true, message: 'User banned' });
});
admin.put('/users/:id/unban', jwtAuth, roleGuard('admin'), async (c: any) => {
  const userId = c.req.param('id');
  const { results } = await c.env.DB.prepare('SELECT * FROM User WHERE id = ?').bind(userId).all();
  if (!results.length) {
    return c.json({ success: false, error: 'User not found' }, 404);
  }
  await c.env.DB.prepare('UPDATE User SET banned = 0 WHERE id = ?').bind(userId).run();
  return c.json({ success: true, message: 'User unbanned' });
});

// Teams
admin.get('/teams', jwtAuth, roleGuard('admin'), async (c) => {
  // TODO: List teams
});
admin.delete('/teams/:id', jwtAuth, roleGuard('admin'), async (c) => {
  // TODO: Delete team
});

export default admin; 