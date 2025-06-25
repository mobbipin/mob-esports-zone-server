import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import * as playerController from '../controllers/playerController';
import { jwtAuth } from '../middleware/auth';
import { updatePlayerSchema } from '../validators/player';

const players = new Hono();

// GET /players/:id
// PUT /players/:id
// GET /players

players.get('/:id', jwtAuth, playerController.getPlayer);
players.put('/:id', jwtAuth, zValidator('json', updatePlayerSchema), playerController.updatePlayer);
players.get('/', jwtAuth, playerController.listPlayers);

export default players; 