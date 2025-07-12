import { z } from 'zod';

export const createTournamentSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  game: z.string().min(2),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  maxTeams: z.number().min(2),
  prizePool: z.number().optional(),
  entryFee: z.number().optional(),
  rules: z.string().optional(),
  status: z.enum(['upcoming', 'registration', 'ongoing', 'completed']).optional(),
  imageUrl: z.string().optional(),
  bannerUrl: z.string().optional(),
  type: z.enum(['solo', 'duo', 'squad']).default('squad'),
  isApproved: z.boolean().optional()
});

export const registerTeamSchema = z.object({
  teamId: z.string().optional(), // Optional for solo tournaments
  userId: z.string().optional(), // For solo tournaments
  selectedPlayers: z.array(z.string()).optional() // For squad tournaments
});

export const updateTournamentSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  game: z.string().min(2).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  maxTeams: z.number().min(2).optional(),
  prizePool: z.number().optional(),
  entryFee: z.number().optional(),
  rules: z.string().optional(),
  status: z.enum(['upcoming', 'registration', 'ongoing', 'completed']).optional(),
  imageUrl: z.string().optional(),
  tournamentType: z.enum(['solo', 'duo', 'squad']).optional(),
  isApproved: z.boolean().optional()
});

export const matchResultSchema = z.object({
  winnerId: z.string(),
  score1: z.number(),
  score2: z.number()
});

export const approveTournamentSchema = z.object({
  isApproved: z.boolean(),
  approvedBy: z.string()
}); 