import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import * as teamController from '../controllers/teamController';
import { jwtAuth } from '../middleware/auth';
import { createTeamSchema, invitePlayerSchema } from '../validators/team';

const teams = new Hono();

// POST /teams
// GET /teams/my
// GET /teams/:id
// PUT /teams/:id
// DELETE /teams/:id
// POST /teams/:id/invite
// POST /teams/:id/accept

teams.post('/', jwtAuth, zValidator('json', createTeamSchema), teamController.createTeam);
teams.get('/my', jwtAuth, teamController.getMyTeam); // get my team
teams.get('/:id', teamController.getTeamById); // get team by id
teams.put('/:id', jwtAuth, zValidator('json', createTeamSchema), teamController.updateTeam);
teams.delete('/:id', jwtAuth, teamController.deleteTeam);
teams.post('/:id/invite', jwtAuth, zValidator('json', invitePlayerSchema), teamController.invitePlayer);
// List invites for a team (owner/captain)
teams.get('/:id/invites', jwtAuth, teamController.getTeamInvites);
// List invites for the current user
teams.get('/invites/user', jwtAuth, teamController.getUserInvites);
// Accept/reject invite by inviteId
teams.post('/invite/:inviteId/accept', jwtAuth, teamController.acceptInvite);
teams.post('/invite/:inviteId/reject', jwtAuth, teamController.rejectInvite);
teams.post('/:id/accept', jwtAuth, teamController.acceptInvite);
teams.delete('/:id/leave', jwtAuth, teamController.deleteTeam); // leave team

export default teams; 