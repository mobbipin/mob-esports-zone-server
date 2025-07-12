import { Hono } from 'hono';
import { jwtAuth } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';
import {
  createPendingTournament,
  createPendingPost,
  listPendingTournaments,
  listPendingPosts,
  reviewPendingTournament,
  reviewPendingPost,
  deletePendingTournament,
  deletePendingPost,
  getOrganizerTournaments,
  getOrganizerPosts,
  updatePendingTournament,
  updatePendingPost
} from '../controllers/pendingController';

const pending = new Hono();

// Organizer routes
pending.post('/tournaments', jwtAuth, roleGuard('tournament_organizer'), createPendingTournament);
pending.post('/posts', jwtAuth, roleGuard('tournament_organizer'), createPendingPost);
pending.get('/tournaments', jwtAuth, listPendingTournaments);
pending.get('/posts', jwtAuth, listPendingPosts);
pending.get('/organizer/tournaments', jwtAuth, roleGuard('tournament_organizer'), getOrganizerTournaments);
pending.get('/organizer/posts', jwtAuth, roleGuard('tournament_organizer'), getOrganizerPosts);
pending.put('/tournaments/:id', jwtAuth, roleGuard('tournament_organizer'), updatePendingTournament);
pending.put('/posts/:id', jwtAuth, roleGuard('tournament_organizer'), updatePendingPost);
pending.delete('/tournaments/:id', jwtAuth, deletePendingTournament);
pending.delete('/posts/:id', jwtAuth, deletePendingPost);

// Admin routes
pending.put('/tournaments/:id/review', jwtAuth, roleGuard('admin'), reviewPendingTournament);
pending.put('/posts/:id/review', jwtAuth, roleGuard('admin'), reviewPendingPost);

export default pending; 