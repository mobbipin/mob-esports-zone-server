import { z } from 'zod';

export const updatePlayerSchema = z.object({
  bio: z.string().optional(),
  region: z.string().optional(),
  gameId: z.string().optional()
}); 