import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import * as tournamentController from '../controllers/tournamentController';
import { jwtAuth } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';
import { createTournamentSchema, updateTournamentSchema, registerTeamSchema, matchResultSchema, approveTournamentSchema } from '../validators/tournament';

const tournaments = new Hono();

// POST /tournaments
// GET /tournaments/:id
// PUT /tournaments/:id
// DELETE /tournaments/:id
// GET /tournaments
// POST /tournaments/:id/register
// POST /tournaments/:id/bracket
// PUT /tournaments/:id/matches/:matchId
// DELETE /tournaments/:id/withdraw
// POST /tournaments/:id/approve
// GET /tournaments/:id/registered-teams

tournaments.post('/', jwtAuth, roleGuard('admin', 'tournament_organizer'), zValidator('json', createTournamentSchema), tournamentController.createTournament);

tournaments.put('/:id', jwtAuth, roleGuard('admin'), zValidator('json', updateTournamentSchema), tournamentController.updateTournament);

tournaments.get('/', tournamentController.listTournaments);
tournaments.get('/:id', tournamentController.getTournament);

tournaments.post('/:id/register', jwtAuth, zValidator('json', registerTeamSchema), tournamentController.registerTeam);
tournaments.delete('/:id/withdraw', jwtAuth, tournamentController.withdrawRegistration);

tournaments.post('/:id/approve', jwtAuth, roleGuard('admin'), zValidator('json', approveTournamentSchema), tournamentController.approveTournament);

tournaments.get('/:id/registered-teams', tournamentController.getRegisteredTeams);

tournaments.post('/:id/bracket', jwtAuth, roleGuard('admin'), tournamentController.createBracket);

tournaments.put('/:id/matches/:matchId', jwtAuth, roleGuard('admin'), zValidator('json', matchResultSchema), tournamentController.updateMatch);

tournaments.delete('/:id', jwtAuth, roleGuard('admin'), tournamentController.deleteTournament);

export default tournaments; 