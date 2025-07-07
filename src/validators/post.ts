import { z } from 'zod';

export const createPostSchema = z.object({
  title: z.string().min(2),
  content: z.string().min(2),
  imageUrl: z.string().optional().or(z.literal('')).or(z.null())
}); 