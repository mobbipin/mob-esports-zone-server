import { getDb } from '../db/drizzle';
import { Tournament, Registration, Match, Team } from '../db/models';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';

export const createTournament = async (c: any) => {
  const db = getDb(c.env);
  const body = await c.req.json();
  const id = nanoid();
  if (body.mapPool) body.mapPool = JSON.stringify(body.mapPool);
  await db.insert(Tournament).values({ ...body, id });
  return c.json({ id, message: 'Tournament created' });
};

export const getTournament = async (c: any) => {
  const db = getDb(c.env);
  const { id } = c.req.param();
  const t = await (db.select().from(Tournament).where(eq(Tournament.id, id)) as any).get();
  if (!t) return c.json({ error: 'Tournament not found' }, 404);
  if (t.mapPool) t.mapPool = JSON.parse(t.mapPool);
  // Get registered teams
  const regs = await (db.select().from(Registration).where(eq(Registration.tournamentId, id)) as any).all();
  const teams = [];
  for (const r of regs) {
    const team = await (db.select().from(Team).where(eq(Team.id, r.teamId)) as any).get();
    if (team) teams.push(team);
  }
  return c.json({ ...t, registeredTeams: teams });
};

export const updateTournament = async (c: any) => {
  const db = getDb(c.env);
  const { id } = c.req.param();
  const body = await c.req.json();
  if (body.mapPool) body.mapPool = JSON.stringify(body.mapPool);
  await (db.update(Tournament).set(body).where(eq(Tournament.id, id)) as any).run();
  return c.json({ message: 'Tournament updated' });
};

export const deleteTournament = async (c: any) => {
  const db = getDb(c.env);
  const { id } = c.req.param();
  await (db.delete(Tournament).where(eq(Tournament.id, id)) as any).run();
  return c.json({ message: 'Tournament deleted' });
};

export const listTournaments = async (c: any) => {
  const db = getDb(c.env);
  const { status } = c.req.query();
  let q = db.select().from(Tournament);
  if (status) q = q.where(eq(Tournament.status, status));
  const tournaments = await (q as any).all();
  for (const t of tournaments) if (t.mapPool) t.mapPool = JSON.parse(t.mapPool);
  return c.json(tournaments);
};

export const registerTeam = async (c: any) => {
  const db = getDb(c.env);
  const { id } = c.req.param();
  const { teamId } = await c.req.json();
  await db.insert(Registration).values({ teamId, tournamentId: id });
  return c.json({ message: 'Team registered' });
};

export const getParticipants = async (c: any) => {
  const db = getDb(c.env);
  const { id } = c.req.param();
  const regs = await (db.select().from(Registration).where(eq(Registration.tournamentId, id)) as any).all();
  const teams = [];
  for (const r of regs) {
    const team = await (db.select().from(Team).where(eq(Team.id, r.teamId)) as any).get();
    if (team) teams.push(team);
  }
  return c.json(teams);
};

export const getBracket = async (c: any) => {
  const db = getDb(c.env);
  const { id } = c.req.param();
  const matches = await (db.select().from(Match).where(eq(Match.tournamentId, id)) as any).all();
  return c.json(matches);
};

export const postMatchResult = async (c: any) => {
  const db = getDb(c.env);
  const { id, matchId } = c.req.param();
  const body = await c.req.json();
  await (db.update(Match).set(body).where(eq(Match.id, matchId)) as any).run();
  return c.json({ message: 'Match result updated' });
}; 