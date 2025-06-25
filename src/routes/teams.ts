import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import * as teamController from '../controllers/teamController';
import { jwtAuth } from '../middleware/auth';
import { createTeamSchema, invitePlayerSchema } from '../validators/team';

const teams = new Hono();

// POST /teams
// GET /teams/:id
// PUT /teams/:id
// DELETE /teams/:id
// POST /teams/:id/invite
// POST /teams/:id/accept

teams.post('/', jwtAuth, zValidator('json', createTeamSchema), teamController.createTeam);
teams.get('/my', jwtAuth, teamController.getTeam); // get my team
teams.get('/:id', teamController.getTeam);
teams.put('/:id', jwtAuth, zValidator('json', createTeamSchema), teamController.updateTeam);
teams.delete('/:id', jwtAuth, teamController.deleteTeam);
teams.post('/:id/invite', jwtAuth, zValidator('json', invitePlayerSchema), teamController.invitePlayer);
teams.post('/:id/accept', jwtAuth, teamController.acceptInvite);
teams.delete('/:id/leave', jwtAuth, teamController.deleteTeam); // leave team

export default teams; 