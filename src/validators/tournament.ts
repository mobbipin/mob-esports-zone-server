import { z } from 'zod';

export const createTournamentSchema = z.object({
  name: z.string().min(2),
  type: z.string(),
  date: z.string(),
  maxTeams: z.number().optional(),
  rules: z.string().optional(),
  bannerUrl: z.string().url().optional(),
  prizePool: z.string().optional(),
  isOnline: z.boolean().optional(),
  mapPool: z.array(z.string()).optional(),
  registrationDeadline: z.string().optional(),
  contactDiscord: z.string().url().optional()
});

export const registerTeamSchema = z.object({
  teamId: z.string()
});

export const matchResultSchema = z.object({
  scoreA: z.number(),
  scoreB: z.number(),
  winnerId: z.string(),
  round: z.string().optional(),
  map: z.string().optional(),
  format: z.string().optional(),
  matchTime: z.string().optional(),
  maxPoints: z.number().optional()
}); 