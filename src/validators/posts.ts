import { z } from 'zod';

export const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  imageUrl: z.string().url().optional()
});

export const updatePostSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  imageUrl: z.string().url().optional()
});

export const approvePostSchema = z.object({
  isApproved: z.boolean(),
  approvedBy: z.string()
});

export const likePostSchema = z.object({
  postId: z.string()
});

export const unlikePostSchema = z.object({
  postId: z.string()
}); 