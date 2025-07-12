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

// Tournament Organizers
admin.get('/pending-organizers', jwtAuth, roleGuard('admin'), async (c: any) => {
  const { results } = await c.env.DB.prepare(`
    SELECT id, email, username, displayName, createdAt, emailVerified 
    FROM User 
    WHERE role = 'tournament_organizer' AND isApproved = 0 AND isDeleted = 0
    ORDER BY createdAt DESC
  `).all();
  return c.json({ status: true, data: results });
});

admin.post('/approve-organizer/:id', jwtAuth, roleGuard('admin'), async (c: any) => {
  const organizerId = c.req.param('id');
  const adminUser = c.get('user');
  
  const { results } = await c.env.DB.prepare('SELECT * FROM User WHERE id = ? AND role = "tournament_organizer"').bind(organizerId).all();
  if (!results.length) {
    return c.json({ status: false, error: 'Organizer not found' }, 404);
  }
  
  await c.env.DB.prepare(`
    UPDATE User 
    SET isApproved = 1, approvedBy = ?, approvedAt = ? 
    WHERE id = ?
  `).bind(adminUser.id, new Date().toISOString(), organizerId).run();
  
  return c.json({ status: true, message: 'Organizer approved successfully' });
});

admin.post('/reject-organizer/:id', jwtAuth, roleGuard('admin'), async (c: any) => {
  const organizerId = c.req.param('id');
  
  const { results } = await c.env.DB.prepare('SELECT * FROM User WHERE id = ? AND role = "tournament_organizer"').bind(organizerId).all();
  if (!results.length) {
    return c.json({ status: false, error: 'Organizer not found' }, 404);
  }
  
  await c.env.DB.prepare('DELETE FROM User WHERE id = ?').bind(organizerId).run();
  
  return c.json({ status: true, message: 'Organizer rejected and account deleted' });
});

// Pending Content Management
admin.get('/pending-tournaments', jwtAuth, roleGuard('admin'), async (c: any) => {
  const { results } = await c.env.DB.prepare(`
    SELECT t.*, u.username as organizerName, u.displayName as organizerDisplayName, u.email as organizerEmail
    FROM Tournament t 
    LEFT JOIN User u ON t.createdBy = u.id
    WHERE t.isApproved = 0 AND t.isDeleted = 0
    ORDER BY t.createdAt DESC
  `).all();
  return c.json({ status: true, data: results });
});

admin.post('/approve-tournament/:id', jwtAuth, roleGuard('admin'), async (c: any) => {
  const tournamentId = c.req.param('id');
  const adminUser = c.get('user');
  
  const { results } = await c.env.DB.prepare('SELECT * FROM Tournament WHERE id = ? AND isApproved = 0').bind(tournamentId).all();
  if (!results.length) {
    return c.json({ status: false, error: 'Tournament not found or already approved' }, 404);
  }
  
  await c.env.DB.prepare(`
    UPDATE Tournament 
    SET isApproved = 1, approvedBy = ?, approvedAt = ? 
    WHERE id = ?
  `).bind(adminUser.id, new Date().toISOString(), tournamentId).run();
  
  return c.json({ status: true, message: 'Tournament approved successfully' });
});

admin.post('/reject-tournament/:id', jwtAuth, roleGuard('admin'), async (c: any) => {
  const tournamentId = c.req.param('id');
  
  const { results } = await c.env.DB.prepare('SELECT * FROM Tournament WHERE id = ? AND isApproved = 0').bind(tournamentId).all();
  if (!results.length) {
    return c.json({ status: false, error: 'Tournament not found or already approved' }, 404);
  }
  
  await c.env.DB.prepare('DELETE FROM Tournament WHERE id = ?').bind(tournamentId).run();
  
  return c.json({ status: true, message: 'Tournament rejected and deleted' });
});

admin.get('/pending-posts', jwtAuth, roleGuard('admin'), async (c: any) => {
  const { results } = await c.env.DB.prepare(`
    SELECT p.*, u.username as organizerName, u.displayName as organizerDisplayName, u.email as organizerEmail
    FROM Post p 
    LEFT JOIN User u ON p.createdBy = u.id
    WHERE p.isApproved = 0 AND p.isDeleted = 0
    ORDER BY p.createdAt DESC
  `).all();
  return c.json({ status: true, data: results });
});

admin.post('/approve-post/:id', jwtAuth, roleGuard('admin'), async (c: any) => {
  const postId = c.req.param('id');
  const adminUser = c.get('user');
  
  const { results } = await c.env.DB.prepare('SELECT * FROM Post WHERE id = ? AND isApproved = 0').bind(postId).all();
  if (!results.length) {
    return c.json({ status: false, error: 'Post not found or already approved' }, 404);
  }
  
  await c.env.DB.prepare(`
    UPDATE Post 
    SET isApproved = 1, approvedBy = ?, approvedAt = ? 
    WHERE id = ?
  `).bind(adminUser.id, new Date().toISOString(), postId).run();
  
  return c.json({ status: true, message: 'Post approved successfully' });
});

admin.post('/reject-post/:id', jwtAuth, roleGuard('admin'), async (c: any) => {
  const postId = c.req.param('id');
  
  const { results } = await c.env.DB.prepare('SELECT * FROM Post WHERE id = ? AND isApproved = 0').bind(postId).all();
  if (!results.length) {
    return c.json({ status: false, error: 'Post not found or already approved' }, 404);
  }
  
  await c.env.DB.prepare('DELETE FROM Post WHERE id = ?').bind(postId).run();
  
  return c.json({ status: true, message: 'Post rejected and deleted' });
});

export default admin; 