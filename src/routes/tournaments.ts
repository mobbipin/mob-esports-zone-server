import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import * as tournamentController from '../controllers/tournamentController';
import { jwtAuth } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';
import { createTournamentSchema, registerTeamSchema, matchResultSchema } from '../validators/tournament';

const tournaments = new Hono();

// POST /tournaments
// GET /tournaments/:id
// PUT /tournaments/:id
// DELETE /tournaments/:id
// GET /tournaments
// POST /tournaments/:id/register
// GET /tournaments/:id/participants
// GET /tournaments/:id/bracket
// POST /tournaments/:id/match-result

tournaments.post('/', jwtAuth, roleGuard('admin'), zValidator('json', createTournamentSchema), tournamentController.createTournament);
tournaments.get('/:id', tournamentController.getTournament);
tournaments.put('/:id', jwtAuth, roleGuard('admin'), zValidator('json', createTournamentSchema), tournamentController.updateTournament);
tournaments.delete('/:id', jwtAuth, roleGuard('admin'), tournamentController.deleteTournament);
tournaments.get('/', tournamentController.listTournaments);
tournaments.post('/:id/register', jwtAuth, zValidator('json', registerTeamSchema), tournamentController.registerTeam);
tournaments.get('/:id/participants', tournamentController.getParticipants);
tournaments.get('/:id/bracket', tournamentController.getBracket);
tournaments.post('/:id/match-result', jwtAuth, roleGuard('admin'), zValidator('json', matchResultSchema), tournamentController.postMatchResult);
tournaments.get('/:id/matches', tournamentController.getBracket); // for admin bracket management

tournaments.post('/:id/matches/:matchId', jwtAuth, roleGuard('admin'), zValidator('json', matchResultSchema), tournamentController.postMatchResult);

export default tournaments; 