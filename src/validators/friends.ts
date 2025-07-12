import { z } from 'zod';

export const sendFriendRequestSchema = z.object({
  receiverId: z.string()
});

export const respondToFriendRequestSchema = z.object({
  requestId: z.string(),
  action: z.enum(['accept', 'reject', 'cancel'])
});

export const removeFriendSchema = z.object({
  friendId: z.string()
}); 