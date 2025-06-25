import { getDb } from '../db/drizzle';
import { PlayerProfile, User } from '../db/models';
import { eq } from 'drizzle-orm';

export const getPlayer = async (c: any) => {
  const db = getDb(c.env);
  const { id } = c.req.param();
  const player = await db.select().from(PlayerProfile).where(eq(PlayerProfile.userId, id)).get();
  if (!player) return c.json({ error: 'Player not found' }, 404);
  if (player.social) player.social = JSON.parse(player.social);
  if (player.achievements) player.achievements = JSON.parse(player.achievements);
  return c.json(player);
};

export const updatePlayer = async (c: any) => {
  const db = getDb(c.env);
  const { id } = c.req.param();
  const body = await c.req.json();
  if (body.social) body.social = JSON.stringify(body.social);
  if (body.achievements) body.achievements = JSON.stringify(body.achievements);
  await db.update(PlayerProfile).set(body).where(eq(PlayerProfile.userId, id));
  return c.json({ message: 'Profile updated' });
};

export const listPlayers = async (c: any) => {
  const db = getDb(c.env);
  const players = await db.select().from(PlayerProfile).all();
  for (const p of players) {
    if (p.social) p.social = JSON.parse(p.social);
    if (p.achievements) p.achievements = JSON.parse(p.achievements);
  }
  return c.json(players);
}; 