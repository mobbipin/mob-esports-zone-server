import { Hono } from 'hono';
import { jwtAuth } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';
// import controllers as needed

const admin = new Hono();

// Users
admin.get('/users', jwtAuth, roleGuard('admin'), async (c) => {
  // TODO: List users
});
admin.put('/users/:id/ban', jwtAuth, roleGuard('admin'), async (c) => {
  // TODO: Ban user
});

// Teams
admin.get('/teams', jwtAuth, roleGuard('admin'), async (c) => {
  // TODO: List teams
});
admin.delete('/teams/:id', jwtAuth, roleGuard('admin'), async (c) => {
  // TODO: Delete team
});

export default admin; 