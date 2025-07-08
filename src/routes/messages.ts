import { Hono } from 'hono';
import { jwtAuth } from '../middleware/auth';
import * as messageController from '../controllers/messageController';

const messages = new Hono();

messages.post('/', jwtAuth, messageController.sendMessage);
messages.get('/inbox', jwtAuth, messageController.getInbox);
messages.get('/sent', jwtAuth, messageController.getSent);
messages.put('/:id/read', jwtAuth, messageController.markRead);
// Tournament group chat: admin can send, captains/members can view
messages.get('/tournament-group', jwtAuth, messageController.getTournamentGroupMessages);

export default messages; 