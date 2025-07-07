import { z } from 'zod';

export const createTeamSchema = z.object({
  name: z.string().min(2),
  tag: z.string().min(2).max(8).optional(),
  bio: z.string().optional(),
  logoUrl: z.string().optional(),
  region: z.string().optional(),
  matchesPlayed: z.number().optional(),
  wins: z.number().optional()
});

export const invitePlayerSchema = z.object({
  userEmail: z.string().email()
}); 