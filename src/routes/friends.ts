import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import * as friendsController from '../controllers/friendsController';
import { jwtAuth } from '../middleware/auth';
import { sendFriendRequestSchema, respondToFriendRequestSchema, removeFriendSchema } from '../validators/friends';

const friends = new Hono();

// POST /friends/request
// POST /friends/respond
// GET /friends/requests
// GET /friends
// DELETE /friends/remove

friends.post('/request', jwtAuth, zValidator('json', sendFriendRequestSchema), friendsController.sendFriendRequest);
friends.post('/respond', jwtAuth, zValidator('json', respondToFriendRequestSchema), friendsController.respondToFriendRequest);
friends.get('/requests', jwtAuth, friendsController.getFriendRequests);
friends.get('/', jwtAuth, friendsController.getFriends);
friends.delete('/remove', jwtAuth, zValidator('json', removeFriendSchema), friendsController.removeFriend);

export default friends; 