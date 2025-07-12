import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['player', 'admin', 'tournament_organizer']),
  username: z.string().min(2).max(32).optional(),
  displayName: z.string().min(2).max(64).optional(),
  adminCode: z.string().optional(),
  organizerCode: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const verifyEmailSchema = z.object({
  token: z.string()
});

export const forgotPasswordSchema = z.object({
  email: z.string().email()
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  otp: z.string().length(6),
  newPassword: z.string().min(6)
});

export const resendVerificationSchema = z.object({
  email: z.string().email()
}); 