import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { jwtAuth } from '../middleware/auth';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { sendVerificationEmail } from '../utils/email';

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  displayName: z.string().min(2).max(64).optional(),
  username: z.string().min(2).max(32).optional(),
});

const users = new Hono();

users.put('/:id', jwtAuth, zValidator('json', updateUserSchema), async (c: any) => {
  const { id } = c.req.param();
  const user = c.get('user');
  const data = await c.req.json();
  
  // Check if user is updating their own profile
  if (user.id !== id) {
    return c.json({ status: false, error: 'Unauthorized to update other users' }, 403);
  }
  
  // If email is being changed, require email verification
  if (data.email && data.email !== user.email) {
    // Generate new verification token
    const emailVerificationToken = nanoid(32);
    
    // Update user with new email and reset verification status
    await c.env.DB.prepare(
      'UPDATE User SET email = ?, emailVerified = 0, emailVerificationToken = ? WHERE id = ?'
    ).bind(data.email, emailVerificationToken, id).run();
    
    // Send verification email
    const verificationUrl = `${c.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${emailVerificationToken}`;
    const emailSent = await sendVerificationEmail(data.email, verificationUrl);
    
    if (!emailSent) {
      return c.json({ status: false, error: 'Failed to send verification email. Please try again.' }, 500);
    }
    
    return c.json({ 
      status: true, 
      message: 'Email updated. Please check your new email for verification.',
      requiresVerification: true
    });
  }
  
  // For other fields, update normally
  const fields = [];
  const values = [];
  for (const key in data) {
    if (data[key] !== undefined && key !== 'email') { // Skip email as it's handled above
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
  }
  
  if (fields.length > 0) {
    values.push(id);
    const sql = `UPDATE User SET ${fields.join(', ')} WHERE id = ?`;
    await c.env.DB.prepare(sql).bind(...values).run();
  }
  
  return c.json({ status: true, message: 'User updated' });
});

export default users; 