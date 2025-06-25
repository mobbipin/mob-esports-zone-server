import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['player', 'admin']),
  username: z.string().min(2).max(32).optional(),
  displayName: z.string().min(2).max(64).optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
}); 