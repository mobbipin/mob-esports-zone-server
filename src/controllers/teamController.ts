import { getDb } from '../db/drizzle';
import { Team, TeamMembership, User } from '../db/models';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';

export const createTeam = async (c: any) => {
  const db = getDb(c.env);
  const { name, tag, bio, logoUrl, region } = await c.req.json();
  const user = c.get('user');
  const id = nanoid();
  await db.insert(Team).values({ id, name, tag, bio, logoUrl, region, ownerId: user.id });
  await db.insert(TeamMembership).values({ userId: user.id, teamId: id, role: 'owner' });
  return c.json({ id, message: 'Team created' });
};

export const getTeam = async (c: any) => {
  const db = getDb(c.env);
  const { id } = c.req.param();
  let team;
  if (id === 'my') {
    const user = c.get('user');
    team = await db.select().from(Team).where(eq(Team.ownerId, user.id)).get();
  } else {
    team = await db.select().from(Team).where(eq(Team.id, id)).get();
  }
  if (!team) return c.json({ error: 'Team not found' }, 404);
  // Get members
  const members = await db.select().from(TeamMembership).where(eq(TeamMembership.teamId, team.id)).all();
  return c.json({ ...team, members });
};

export const updateTeam = async (c: any) => {
  const db = getDb(c.env);
  const { id } = c.req.param();
  const body = await c.req.json();
  await db.update(Team).set(body).where(eq(Team.id, id));
  return c.json({ message: 'Team updated' });
};

export const deleteTeam = async (c: any) => {
  const db = getDb(c.env);
  const { id } = c.req.param();
  await db.delete(Team).where(eq(Team.id, id));
  await db.delete(TeamMembership).where(eq(TeamMembership.teamId, id));
  return c.json({ message: 'Team deleted' });
};

export const invitePlayer = async (c: any) => {
  // TODO: Implement invite logic (e.g., send notification or add to pending invites)
  return c.json({ message: 'Player invited (stub)' });
};

export const acceptInvite = async (c: any) => {
  // TODO: Implement accept invite logic (e.g., add to TeamMembership)
  return c.json({ message: 'Joined team (stub)' });
}; 