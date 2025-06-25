import { nanoid } from 'nanoid';
import { z } from 'zod';

const TournamentSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  game: z.string().min(2),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  maxTeams: z.number().min(2),
  prizePool: z.number().optional(),
  entryFee: z.number().optional(),
  rules: z.string().optional(),
  status: z.enum(['upcoming', 'registration', 'ongoing', 'completed']).optional()
});

const MatchSchema = z.object({
  team1Id: z.string(),
  team2Id: z.string(),
  round: z.number(),
  matchNumber: z.number(),
  winnerId: z.string().optional()
});

export const createTournament = async (c: any) => {
  const data = await c.req.json();
  const parse = TournamentSchema.safeParse(data);
  if (!parse.success) return c.json({ status: false, error: parse.error.flatten() }, 400);
  const { name, description, game, startDate, endDate, maxTeams, prizePool, entryFee, rules } = parse.data;
  const id = nanoid();
  await c.env.DB.prepare(
    'INSERT INTO Tournament (id, name, description, game, startDate, endDate, maxTeams, prizePool, entryFee, rules, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, name, description ?? null, game, startDate, endDate, maxTeams, prizePool ?? null, entryFee ?? null, rules ?? null, 'upcoming').run();
  return c.json({ status: true, data: { id }, message: 'Tournament created' });
};

export const listTournaments = async (c: any) => {
  const { status, page = '1', limit = '10' } = c.req.query();
  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = parseInt(limit as string, 10) || 10;
  const offset = (pageNum - 1) * limitNum;
  let sql = 'SELECT * FROM Tournament';
  let params: any[] = [];
  if (status) {
    sql += ' WHERE status = ?';
    params.push(status);
  }
  sql += ' ORDER BY startDate DESC LIMIT ? OFFSET ?';
  params.push(limitNum, offset);
  const { results } = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json({ status: true, data: results });
};

export const getTournament = async (c: any) => {
  const { id } = c.req.param();
  const { results } = await c.env.DB.prepare('SELECT * FROM Tournament WHERE id = ?').bind(id).all();
  if (!results.length) return c.json({ status: false, error: 'Tournament not found' }, 404);
  const tournament = results[0];
  // Get registered teams
  const { results: teams } = await c.env.DB.prepare('SELECT * FROM TournamentRegistration WHERE tournamentId = ?').bind(id).all();
  // Get matches
  const { results: matches } = await c.env.DB.prepare('SELECT * FROM Match WHERE tournamentId = ? ORDER BY round, matchNumber').bind(id).all();
  return c.json({ status: true, data: { ...tournament, teams, matches } });
};

export const updateTournament = async (c: any) => {
  const { id } = c.req.param();
  const data = await c.req.json();
  const parse = TournamentSchema.partial().safeParse(data);
  if (!parse.success) return c.json({ status: false, error: parse.error.flatten() }, 400);
  const fields = [];
  const values = [];
  for (const key in parse.data) {
    if ((parse.data as any)[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push((parse.data as any)[key]);
    }
  }
  if (!fields.length) return c.json({ status: false, error: 'No fields to update' }, 400);
  values.push(id);
  const sql = `UPDATE Tournament SET ${fields.join(', ')} WHERE id = ?`;
  await c.env.DB.prepare(sql).bind(...values).run();
  return c.json({ status: true, message: 'Tournament updated' });
};

export const deleteTournament = async (c: any) => {
  const { id } = c.req.param();
  await c.env.DB.prepare('DELETE FROM Tournament WHERE id = ?').bind(id).run();
  await c.env.DB.prepare('DELETE FROM TournamentRegistration WHERE tournamentId = ?').bind(id).run();
  await c.env.DB.prepare('DELETE FROM Match WHERE tournamentId = ?').bind(id).run();
  return c.json({ status: true, message: 'Tournament deleted' });
};

export const registerTeam = async (c: any) => {
  const { id } = c.req.param();
  const { teamId } = await c.req.json();
  await c.env.DB.prepare(
    'INSERT INTO TournamentRegistration (tournamentId, teamId, registeredAt) VALUES (?, ?, ?)'
  ).bind(id, teamId, new Date().toISOString()).run();
  return c.json({ status: true, message: 'Team registered' });
};

export const createBracket = async (c: any) => {
  const { id } = c.req.param();
  // Get registered teams
  const { results: teams } = await c.env.DB.prepare('SELECT * FROM TournamentRegistration WHERE tournamentId = ?').bind(id).all();
  if (teams.length < 2) return c.json({ status: false, error: 'Need at least 2 teams' }, 400);
  // Generate bracket matches (simple single elimination)
  const rounds = Math.ceil(Math.log2(teams.length));
  let matchNumber = 1;
  for (let round = 1; round <= rounds; round++) {
    const matchesInRound = Math.ceil(teams.length / Math.pow(2, round));
    for (let i = 0; i < matchesInRound; i++) {
      const matchId = nanoid();
      const team1Index = i * 2;
      const team2Index = i * 2 + 1;
      const team1Id = teams[team1Index]?.teamId || null;
      const team2Id = teams[team2Index]?.teamId || null;
      await c.env.DB.prepare(
        'INSERT INTO Match (id, tournamentId, team1Id, team2Id, round, matchNumber) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(matchId, id, team1Id, team2Id, round, matchNumber).run();
      matchNumber++;
    }
  }
  return c.json({ status: true, message: 'Bracket created' });
};

export const updateMatch = async (c: any) => {
  const { id } = c.req.param();
  const data = await c.req.json();
  const parse = MatchSchema.partial().safeParse(data);
  if (!parse.success) return c.json({ status: false, error: parse.error.flatten() }, 400);
  const fields = [];
  const values = [];
  for (const key in parse.data) {
    if ((parse.data as any)[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push((parse.data as any)[key]);
    }
  }
  if (!fields.length) return c.json({ status: false, error: 'No fields to update' }, 400);
  values.push(id);
  const sql = `UPDATE Match SET ${fields.join(', ')} WHERE id = ?`;
  await c.env.DB.prepare(sql).bind(...values).run();
  return c.json({ status: true, message: 'Match updated' });
}; 