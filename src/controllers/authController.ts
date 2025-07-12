import { signJwt } from '../utils/jwt';
import { hashPassword, verifyPassword } from '../utils/hash';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email';

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
  
  // Tournament organizers can register freely but need admin approval
  // No registration code required for tournament organizers
  
  const userId = nanoid();
  const passwordHash = await hashPassword(password);
  const emailVerificationToken = nanoid(32);
  
  const { results: exists } = await c.env.DB.prepare('SELECT * FROM User WHERE email = ?').bind(email).all();
  if (exists.length) return c.json({ status: false, error: 'Email already registered' }, 400);
  
  // Set approval status based on role
  const isApproved = role === 'admin' ? 1 : 0; // Admins are auto-approved, others need approval
  
  await c.env.DB.prepare(
    'INSERT INTO User (id, email, passwordHash, role, username, displayName, createdAt, emailVerificationToken, isApproved) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(userId, email, passwordHash, role, username ?? null, displayName ?? null, new Date().toISOString(), emailVerificationToken, isApproved).run();
  
  if (role === 'player') {
    await c.env.DB.prepare('INSERT INTO PlayerProfile (userId) VALUES (?)').bind(userId).run();
  }
  
  // Send verification email
  const verificationUrl = `${c.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${emailVerificationToken}`;
  const emailSent = await sendVerificationEmail(email, verificationUrl);
  
  if (!emailSent) {
    console.error('Failed to send verification email to:', email);
    return c.json({ status: false, error: 'Registration successful but failed to send verification email. Please contact support.' }, 500);
  }
  
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
  
  // Email verification is no longer required for login
  // Users can browse the app but need verification for team/tournament actions
  
  // Tournament organizers can login but will be restricted in activities
  // No need to block login here - let them login and handle restrictions in specific endpoints
  
  const token = await signJwt({ 
    id: user.id, 
    role: user.role, 
    email: user.email,
    emailVerified: Boolean(user.emailVerified),
    isApproved: Boolean(user.isApproved)
  }, c.env.JWT_SECRET);
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
        emailVerified: user.emailVerified,
        isApproved: user.isApproved
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
  const emailSent = await sendVerificationEmail(email, verificationUrl);
  
  if (!emailSent) {
    console.error('Failed to send verification email to:', email);
    return c.json({ status: false, error: 'Failed to send verification email. Please try again later.' }, 500);
  }
  
  return c.json({ status: true, message: 'Verification email sent' });
};

export const resendVerificationForUser = async (c: any) => {
  const user = c.get('user');
  
  if (user.emailVerified) return c.json({ status: false, error: 'Email already verified' }, 400);
  
  const emailVerificationToken = nanoid(32);
  await c.env.DB.prepare('UPDATE User SET emailVerificationToken = ? WHERE id = ?').bind(emailVerificationToken, user.id).run();
  
  const verificationUrl = `${c.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${emailVerificationToken}`;
  const emailSent = await sendVerificationEmail(user.email, verificationUrl);
  
  if (!emailSent) {
    console.error('Failed to send verification email to:', user.email);
    return c.json({ status: false, error: 'Failed to send verification email. Please try again later.' }, 500);
  }
  
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
  
  await sendPasswordResetEmail(email, otp);
  
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
      emailVerified: dbUser.emailVerified,
      isApproved: dbUser.isApproved
    }
  });
};

const PlayerUpdateSchema = z.object({
  username: z.string().min(2),
  email: z.string().email(),
  avatar: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  gameUsername: z.string().min(2).max(64).optional(),
  region: z.string().optional(),
  rank: z.string().optional(),
});

const OrganizerAdminUpdateSchema = z.object({
  username: z.string().min(2),
  email: z.string().email(),
  avatar: z.string().url().optional(),
});

export const updateUser = async (c: any) => {
  const data = await c.req.json();
  const user = c.get('user');

  try {
    let parse;
    if (user.role === 'player') {
      parse = PlayerUpdateSchema.safeParse(data);
    } else {
      parse = OrganizerAdminUpdateSchema.safeParse(data);
    }
    if (!parse.success) {
      return c.json({ status: false, error: parse.error.flatten() }, 400);
    }
    // Only destructure fields that exist for the role
    const { username, email, avatar } = parse.data;
    // For player, also get bio, gameUsername, region, rank
    const bio = user.role === 'player' ? (parse.data as any).bio : undefined;
    const gameUsername = user.role === 'player' ? (parse.data as any).gameUsername : undefined;
    const region = user.role === 'player' ? (parse.data as any).region : undefined;
    const rank = user.role === 'player' ? (parse.data as any).rank : undefined;

    // Check if email is being changed
    if (email && email !== user.email) {
      // Check if new email already exists
      const { results: existingUser } = await c.env.DB.prepare(
        'SELECT id FROM User WHERE email = ? AND id != ?'
      ).bind(email, user.id).all();
      if (existingUser.length > 0) {
        return c.json({ status: false, error: 'Email already exists' }, 400);
      }
      // For email change, require email verification
      // For tournament organizers, also reset approval status
      if (user.role === 'tournament_organizer') {
        await c.env.DB.prepare(
          'UPDATE User SET email = ?, emailVerified = 0, isApproved = 0 WHERE id = ?'
        ).bind(email, user.id).run();
      } else {
        await c.env.DB.prepare(
          'UPDATE User SET email = ?, emailVerified = 0 WHERE id = ?'
        ).bind(email, user.id).run();
      }
      // Generate verification URL
      const verificationToken = nanoid();
      const verificationUrl = `${c.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
      // Store verification token
      await c.env.DB.prepare(
        'UPDATE User SET emailVerificationToken = ? WHERE id = ?'
      ).bind(verificationToken, user.id).run();
      // Send email verification
      await sendVerificationEmail(email, verificationUrl);
      // Send notification about approval status reset for organizers
      if (user.role === 'tournament_organizer') {
        await c.env.DB.prepare(
          'INSERT INTO Notification (id, userId, type, title, message, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(
          nanoid(), user.id, 'email_change_approval_reset',
          'Email Changed - Re-approval Required',
          'Your email has been changed. Your tournament organizer approval status has been reset. Please verify your new email and reapply for approval.',
          new Date().toISOString()
        ).run();
      }
      return c.json({
        status: true,
        message: user.role === 'tournament_organizer'
          ? 'Email updated. Please check your email for verification. Your approval status has been reset and you will need to reapply.'
          : 'Email updated. Please check your email for verification.'
      });
    }

    // If email is not changed, do not touch emailVerified
    // Build update query based on user role
    let updateFields = [];
    let updateValues = [];
    updateFields.push('username = ?');
    updateValues.push(username);
    if (avatar) {
      updateFields.push('avatar = ?');
      updateValues.push(avatar);
    }
    // Only update email if it is not changed (to allow username/avatar update)
    if (email === user.email) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (user.role === 'player') {
      if (bio) {
        updateFields.push('bio = ?');
        updateValues.push(bio);
      }
      if (gameUsername) {
        updateFields.push('gameUsername = ?');
        updateValues.push(gameUsername);
      }
      if (region) {
        updateFields.push('region = ?');
        updateValues.push(region);
      }
      if (rank) {
        updateFields.push('rank = ?');
        updateValues.push(rank);
      }
    }
    updateValues.push(user.id);
    await c.env.DB.prepare(
      `UPDATE User SET ${updateFields.join(', ')} WHERE id = ?`
    ).bind(...updateValues).run();
    return c.json({ status: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    return c.json({ status: false, error: 'Failed to update profile' }, 500);
  }
};

export const approveOrganizer = async (c: any) => {
  const admin = c.get('user');
  if (admin.role !== 'admin') {
    return c.json({ status: false, error: 'Unauthorized' }, 403);
  }
  
  const { organizerId } = await c.req.json();
  if (!organizerId) {
    return c.json({ status: false, error: 'Organizer ID is required' }, 400);
  }
  
  // Check if user exists and is a tournament organizer
  const { results } = await c.env.DB.prepare('SELECT * FROM User WHERE id = ? AND role = ?').bind(organizerId, 'tournament_organizer').all();
  if (!results.length) {
    return c.json({ status: false, error: 'Tournament organizer not found' }, 404);
  }
  
  const organizer = results[0];
  if (organizer.isApproved) {
    return c.json({ status: false, error: 'Organizer is already approved' }, 400);
  }
  
  // Approve the organizer
  await c.env.DB.prepare('UPDATE User SET isApproved = 1, approvedBy = ?, approvedAt = ? WHERE id = ?').bind(
    admin.id, new Date().toISOString(), organizerId
  ).run();
  
  return c.json({ status: true, message: 'Tournament organizer approved successfully' });
};

export const unapproveOrganizer = async (c: any) => {
  const data = await c.req.json();
  const admin = c.get('user');
  
  if (admin.role !== 'admin') {
    return c.json({ status: false, error: 'Unauthorized' }, 403);
  }
  
  try {
    const { organizerId } = data;
    
    // Get organizer details first
    const { results: organizer } = await c.env.DB.prepare(
      'SELECT * FROM User WHERE id = ? AND role = ?'
    ).bind(organizerId, 'tournament_organizer').all();
    
    if (!organizer.length) {
      return c.json({ status: false, error: 'Tournament organizer not found' }, 404);
    }
    
    // Unapprove the organizer
    await c.env.DB.prepare(
      'UPDATE User SET isApproved = 0 WHERE id = ?'
    ).bind(organizerId).run();
    
    // Send notification to organizer
    await c.env.DB.prepare(
      'INSERT INTO Notification (id, userId, type, title, message, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(
      nanoid(), organizerId, 'organizer_unapproved', 
      'Organizer License Cancelled', 
      'Your tournament organizer license has been cancelled. Please reapply if you wish to continue organizing tournaments.', 
      new Date().toISOString()
    ).run();
    
    return c.json({ status: true, message: 'Organizer unapproved successfully' });
    
  } catch (error) {
    console.error('Error unapproving organizer:', error);
    return c.json({ status: false, error: 'Failed to unapprove organizer' }, 500);
  }
};

export const getPendingOrganizers = async (c: any) => {
  const admin = c.get('user');
  if (admin.role !== 'admin') {
    return c.json({ status: false, error: 'Unauthorized' }, 403);
  }
  
  const { results } = await c.env.DB.prepare(
    'SELECT id, email, username, displayName, createdAt FROM User WHERE role = ? AND isApproved = 0 AND isDeleted = 0 ORDER BY createdAt DESC'
  ).bind('tournament_organizer').all();
  
  return c.json({ status: true, data: results });
}; 