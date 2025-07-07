import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { jwtAuth } from '../middleware/auth';
import { z } from 'zod';

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  displayName: z.string().min(2).max(64).optional(),
  username: z.string().min(2).max(32).optional(),
});

const users = new Hono();

users.put('/:id', jwtAuth, zValidator('json', updateUserSchema), async (c: any) => {
  const { id } = c.req.param();
  const data = await c.req.json();
  const fields = [];
  const values = [];
  for (const key in data) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
  }
  if (!fields.length) return c.json({ status: false, error: 'No fields to update' }, 400);
  values.push(id);
  const sql = `UPDATE User SET ${fields.join(', ')} WHERE id = ?`;
  await c.env.DB.prepare(sql).bind(...values).run();
  return c.json({ status: true, message: 'User updated' });
});

export default users; 