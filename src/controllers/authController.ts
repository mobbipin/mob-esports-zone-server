import { signJwt } from '../utils/jwt';
import { hashPassword, verifyPassword } from '../utils/hash';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { randomBytes } from 'crypto';

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['player', 'admin', 'tournament_organizer']),
  username: z.string().min(2).max(32).optional(),
  displayName: z.string().min(2).max(64).optional(),
  adminCode: z.string().optional(),
  organizerCode: z.string().optional()
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const ForgotPasswordSchema = z.object({
  email: z.string().email()
});

const ResetPasswordSchema = z.object({
  token: z.string(),
  otp: z.string().length(6),
  newPassword: z.string().min(6)
});

const VerifyEmailSchema = z.object({
  token: z.string()
});

const ResendVerificationSchema = z.object({
  email: z.string().email()
});

const DeleteAccountSchema = z.object({
  password: z.string()
});

// Helper function to generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper function to send email (placeholder - implement with nodemailer)
const sendEmail = async (to: string, subject: string, content: string) => {
  // TODO: Implement with nodemailer
  console.log(`Email to ${to}: ${subject} - ${content}`);
  return true;
};

export const register = async (c: any) => {
  const data = await c.req.json();
  const parse = RegisterSchema.safeParse(data);
  if (!parse.success) return c.json({ status: false, error: parse.error.flatten() }, 400);
  
  const { email, password, role, username, displayName, adminCode, organizerCode } = parse.data;
  
  if (role === 'admin') {
    const validAdminCode = c.env.ADMIN_REGISTRATION_CODE || 'MOB_ADMIN_2024';
    if (adminCode !== validAdminCode) {
      return c.json({ status: false, error: 'Invalid admin registration code' }, 400);
    }
  }
  
  if (role === 'tournament_organizer') {
    const validOrganizerCode = c.env.ORGANIZER_REGISTRATION_CODE || 'MOB_ORGANIZER_2024';
    if (organizerCode !== validOrganizerCode) {
      return c.json({ status: false, error: 'Invalid organizer registration code' }, 400);
    }
  }
  
  const userId = nanoid();
  const passwordHash = await hashPassword(password);
  const emailVerificationToken = nanoid(32);
  
  const { results: exists } = await c.env.DB.prepare('SELECT * FROM User WHERE email = ?').bind(email).all();
  if (exists.length) return c.json({ status: false, error: 'Email already registered' }, 400);
  
  await c.env.DB.prepare(
    'INSERT INTO User (id, email, passwordHash, role, username, displayName, createdAt, emailVerificationToken) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(userId, email, passwordHash, role, username ?? null, displayName ?? null, new Date().toISOString(), emailVerificationToken).run();
  
  if (role === 'player') {
    await c.env.DB.prepare('INSERT INTO PlayerProfile (userId) VALUES (?)').bind(userId).run();
  }
  
  // Send verification email
  const verificationUrl = `${c.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${emailVerificationToken}`;
  await sendEmail(email, 'Verify Your Email', `Please click this link to verify your email: ${verificationUrl}`);
  
  return c.json({ status: true, message: 'Registered successfully. Please check your email to verify your account.' });
};

export const login = async (c: any) => {
  const data = await c.req.json();
  const parse = LoginSchema.safeParse(data);
  if (!parse.success) return c.json({ status: false, error: parse.error.flatten() }, 400);
  
  const { email, password } = parse.data;
  
  console.log('Login attempt for email:', email);
  
  const { results } = await c.env.DB.prepare('SELECT * FROM User WHERE email = ? AND isDeleted = 0').bind(email).all();
  
  console.log('Database results:', results.length, results.length > 0 ? 'User found' : 'User not found');
  
  if (!results.length) return c.json({ status: false, error: 'Invalid credentials' }, 401);
  
  const user = results[0];
  
  console.log('User found:', { id: user.id, email: user.email, role: user.role });
  
  const valid = await verifyPassword(password, user.passwordHash);
  
  console.log('Password verification result:', valid);
  
  if (!valid) return c.json({ status: false, error: 'Invalid credentials' }, 401);
  
  if (user.banned === 1) {
    return c.json({ status: false, banned: true, error: 'You are banned. If this was a mistake, mail admin@esportszone.mobbysc.com' }, 403);
  }
  
  // Check email verification for players and tournament organizers
  if ((user.role === 'player' || user.role === 'tournament_organizer') && !user.emailVerified) {
    return c.json({ status: false, error: 'Please verify your email before logging in' }, 403);
  }
  
  const token = await signJwt({ id: user.id, role: user.role, email: user.email }, c.env.JWT_SECRET);
  return c.json({
    status: true,
    data: {
      token,
      user: { 
        id: user.id, 
        role: user.role, 
        email: user.email, 
        username: user.username, 
        displayName: user.displayName, 
        banned: user.banned,
        emailVerified: user.emailVerified
      }
    }
  });
};

export const verifyEmail = async (c: any) => {
  const data = await c.req.json();
  const parse = VerifyEmailSchema.safeParse(data);
  if (!parse.success) return c.json({ status: false, error: parse.error.flatten() }, 400);
  
  const { token } = parse.data;
  
  const { results } = await c.env.DB.prepare('SELECT * FROM User WHERE emailVerificationToken = ?').bind(token).all();
  if (!results.length) return c.json({ status: false, error: 'Invalid verification token' }, 400);
  
  const user = results[0];
  
  await c.env.DB.prepare('UPDATE User SET emailVerified = 1, emailVerificationToken = NULL WHERE id = ?').bind(user.id).run();
  
  return c.json({ status: true, message: 'Email verified successfully' });
};

export const resendVerification = async (c: any) => {
  const data = await c.req.json();
  const parse = ResendVerificationSchema.safeParse(data);
  if (!parse.success) return c.json({ status: false, error: parse.error.flatten() }, 400);
  
  const { email } = parse.data;
  
  const { results } = await c.env.DB.prepare('SELECT * FROM User WHERE email = ?').bind(email).all();
  if (!results.length) return c.json({ status: false, error: 'User not found' }, 404);
  
  const user = results[0];
  if (user.emailVerified) return c.json({ status: false, error: 'Email already verified' }, 400);
  
  const emailVerificationToken = nanoid(32);
  await c.env.DB.prepare('UPDATE User SET emailVerificationToken = ? WHERE id = ?').bind(emailVerificationToken, user.id).run();
  
  const verificationUrl = `${c.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${emailVerificationToken}`;
  await sendEmail(email, 'Verify Your Email', `Please click this link to verify your email: ${verificationUrl}`);
  
  return c.json({ status: true, message: 'Verification email sent' });
};

export const forgotPassword = async (c: any) => {
  const data = await c.req.json();
  const parse = ForgotPasswordSchema.safeParse(data);
  if (!parse.success) return c.json({ status: false, error: parse.error.flatten() }, 400);
  
  const { email } = parse.data;
  
  const { results } = await c.env.DB.prepare('SELECT * FROM User WHERE email = ? AND isDeleted = 0').bind(email).all();
  if (!results.length) return c.json({ status: false, error: 'User not found' }, 404);
  
  const user = results[0];
  const token = nanoid(32);
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes
  
  await c.env.DB.prepare('INSERT INTO PasswordReset (id, userId, token, otp, expiresAt, createdAt) VALUES (?, ?, ?, ?, ?, ?)').bind(
    nanoid(), user.id, token, otp, expiresAt, new Date().toISOString()
  ).run();
  
  await sendEmail(email, 'Password Reset', `Your OTP is: ${otp}. This will expire in 15 minutes.`);
  
  return c.json({ status: true, message: 'Password reset email sent', data: { token } });
};

export const resetPassword = async (c: any) => {
  const data = await c.req.json();
  const parse = ResetPasswordSchema.safeParse(data);
  if (!parse.success) return c.json({ status: false, error: parse.error.flatten() }, 400);
  
  const { token, otp, newPassword } = parse.data;
  
  const { results } = await c.env.DB.prepare('SELECT * FROM PasswordReset WHERE token = ? AND otp = ? AND expiresAt > ?').bind(
    token, otp, new Date().toISOString()
  ).all();
  
  if (!results.length) return c.json({ status: false, error: 'Invalid or expired token/OTP' }, 400);
  
  const resetRecord = results[0];
  const passwordHash = await hashPassword(newPassword);
  
  await c.env.DB.prepare('UPDATE User SET passwordHash = ? WHERE id = ?').bind(passwordHash, resetRecord.userId).run();
  await c.env.DB.prepare('DELETE FROM PasswordReset WHERE id = ?').bind(resetRecord.id).run();
  
  return c.json({ status: true, message: 'Password reset successfully' });
};

export const deleteAccount = async (c: any) => {
  const user = c.get('user');
  if (!user) return c.json({ status: false, error: 'Unauthorized' }, 401);
  
  const data = await c.req.json();
  const parse = DeleteAccountSchema.safeParse(data);
  if (!parse.success) return c.json({ status: false, error: parse.error.flatten() }, 400);
  
  const { password } = parse.data;
  
  const { results } = await c.env.DB.prepare('SELECT * FROM User WHERE id = ?').bind(user.id).all();
  if (!results.length) return c.json({ status: false, error: 'User not found' }, 404);
  
  const dbUser = results[0];
  const valid = await verifyPassword(password, dbUser.passwordHash);
  if (!valid) return c.json({ status: false, error: 'Invalid password' }, 400);
  
  // Soft delete
  await c.env.DB.prepare('UPDATE User SET isDeleted = 1, deletedAt = ? WHERE id = ?').bind(
    new Date().toISOString(), user.id
  ).run();
  
  return c.json({ status: true, message: 'Account deleted successfully' });
};

export const me = async (c: any) => {
  const user = c.get('user');
  if (!user) return c.json({ status: false, error: 'Unauthorized' }, 401);
  
  const { results } = await c.env.DB.prepare('SELECT * FROM User WHERE id = ? AND isDeleted = 0').bind(user.id).all();
  if (!results.length) return c.json({ status: false, error: 'User not found' }, 404);
  
  const dbUser = results[0];
  let playerProfile = null;
  let teamId = null;
  
  if (dbUser.role === 'player') {
    const { results: profiles } = await c.env.DB.prepare('SELECT * FROM PlayerProfile WHERE userId = ?').bind(dbUser.id).all();
    if (profiles.length) {
      playerProfile = profiles[0];
      if (playerProfile.social) playerProfile.social = JSON.parse(playerProfile.social);
      if (playerProfile.achievements) playerProfile.achievements = JSON.parse(playerProfile.achievements);
    }
    
    // Get user's team
    const { results: teamMemberships } = await c.env.DB.prepare('SELECT teamId FROM TeamMembership WHERE userId = ?').bind(dbUser.id).all();
    if (teamMemberships.length) {
      teamId = teamMemberships[0].teamId;
    }
  }
  
  return c.json({
    status: true,
    data: {
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      username: dbUser.username,
      displayName: dbUser.displayName,
      teamId,
      playerProfile,
      banned: dbUser.banned,
      emailVerified: dbUser.emailVerified
    }
  });
}; 