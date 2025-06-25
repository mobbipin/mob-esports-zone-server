import { getDb } from '../db/drizzle';
import { User, PlayerProfile } from '../db/models';
import { signJwt, verifyJwt } from '../utils/jwt';
import { hashPassword, verifyPassword } from '../utils/hash';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';

export const register = async (c: any) => {
  const db = getDb(c.env);
  const { email, password, role, username, displayName } = await c.req.json();
  const userId = nanoid();
  const passwordHash = await hashPassword(password);
  // Check if email exists
  const exists = await db.select().from(User).where(eq(User.email, email)).get();
  if (exists) return c.json({ error: 'Email already registered' }, 400);
  await db.insert(User).values({
    id: userId,
    email,
    passwordHash,
    role,
    username,
    displayName,
    createdAt: new Date().toISOString()
  });
  if (role === 'player') {
    await db.insert(PlayerProfile).values({ userId });
  }
  return c.json({ message: 'Registered successfully' });
};

export const login = async (c: any) => {
  const db = getDb(c.env);
  const { email, password } = await c.req.json();
  const user = await db.select().from(User).where(eq(User.email, email)).get();
  if (!user) return c.json({ error: 'Invalid credentials' }, 401);
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return c.json({ error: 'Invalid credentials' }, 401);
  const token = await signJwt({ id: user.id, role: user.role, email: user.email }, c.env.JWT_SECRET);
  return c.json({
    token,
    user: { id: user.id, role: user.role, email: user.email, username: user.username, displayName: user.displayName }
  });
};

export const me = async (c: any) => {
  const db = getDb(c.env);
  const user = c.get('user');
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const dbUser = await db.select().from(User).where(eq(User.id, user.id)).get();
  if (!dbUser) return c.json({ error: 'User not found' }, 404);
  let playerProfile = null;
  if (dbUser.role === 'player') {
    playerProfile = await db.select().from(PlayerProfile).where(eq(PlayerProfile.userId, dbUser.id)).get();
    if (playerProfile && playerProfile.social) playerProfile.social = JSON.parse(playerProfile.social);
    if (playerProfile && playerProfile.achievements) playerProfile.achievements = JSON.parse(playerProfile.achievements);
  }
  return c.json({
    id: dbUser.id,
    email: dbUser.email,
    role: dbUser.role,
    username: dbUser.username,
    displayName: dbUser.displayName,
    playerProfile
  });
}; 