import { signJwt } from '../utils/jwt';
import { hashPassword, verifyPassword } from '../utils/hash';
import { nanoid } from 'nanoid';
import { z } from 'zod';

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['player', 'admin']),
  username: z.string().min(2).max(32).optional(),
  displayName: z.string().min(2).max(64).optional()
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const register = async (c: any) => {
  const data = await c.req.json();
  const parse = RegisterSchema.safeParse(data);
  if (!parse.success) return c.json({ error: parse.error.flatten() }, 400);
  const { email, password, role, username, displayName } = parse.data;
  const userId = nanoid();
  const passwordHash = await hashPassword(password);
  // Check if email exists
  const { results: exists } = await c.env.DB.prepare('SELECT * FROM User WHERE email = ?').bind(email).all();
  if (exists.length) return c.json({ error: 'Email already registered' }, 400);
  await c.env.DB.prepare(
    'INSERT INTO User (id, email, passwordHash, role, username, displayName, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)' +
    ''
  ).bind(userId, email, passwordHash, role, username ?? null, displayName ?? null, new Date().toISOString()).run();
  if (role === 'player') {
    await c.env.DB.prepare('INSERT INTO PlayerProfile (userId) VALUES (?)').bind(userId).run();
  }
  return c.json({ message: 'Registered successfully' });
};

export const login = async (c: any) => {
  const data = await c.req.json();
  const parse = LoginSchema.safeParse(data);
  if (!parse.success) return c.json({ error: parse.error.flatten() }, 400);
  const { email, password } = parse.data;
  const { results } = await c.env.DB.prepare('SELECT * FROM User WHERE email = ?').bind(email).all();
  if (!results.length) return c.json({ error: 'Invalid credentials' }, 401);
  const user = results[0];
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return c.json({ error: 'Invalid credentials' }, 401);
  const token = await signJwt({ id: user.id, role: user.role, email: user.email }, c.env.JWT_SECRET);
  return c.json({
    token,
    user: { id: user.id, role: user.role, email: user.email, username: user.username, displayName: user.displayName }
  });
};

export const me = async (c: any) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const { results } = await c.env.DB.prepare('SELECT * FROM User WHERE id = ?').bind(user.id).all();
  if (!results.length) return c.json({ error: 'User not found' }, 404);
  const dbUser = results[0];
  let playerProfile = null;
  if (dbUser.role === 'player') {
    const { results: profiles } = await c.env.DB.prepare('SELECT * FROM PlayerProfile WHERE userId = ?').bind(dbUser.id).all();
    if (profiles.length) {
      playerProfile = profiles[0];
      if (playerProfile.social) playerProfile.social = JSON.parse(playerProfile.social);
      if (playerProfile.achievements) playerProfile.achievements = JSON.parse(playerProfile.achievements);
    }
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