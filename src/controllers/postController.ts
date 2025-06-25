import { nanoid } from 'nanoid';
import { z } from 'zod';

const PostSchema = z.object({
  title: z.string().min(2),
  content: z.string().min(2),
  imageUrl: z.string().url().optional()
});

export const createPost = async (c: any) => {
  const data = await c.req.json();
  const parse = PostSchema.safeParse(data);
  if (!parse.success) return c.json({ status: false, error: parse.error.flatten() }, 400);
  const { title, content, imageUrl } = parse.data;
  const id = nanoid();
  const createdBy = c.get('user').id;
  await c.env.DB.prepare(
    'INSERT INTO Post (id, title, content, imageUrl, createdBy, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, title, content, imageUrl ?? null, createdBy, new Date().toISOString()).run();
  return c.json({ status: true, data: { id }, message: 'Post created' });
};

export const listPosts = async (c: any) => {
  const { limit, admin, page = '1' } = c.req.query();
  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = limit ? parseInt(limit as string, 10) : 10;
  const offset = (pageNum - 1) * limitNum;
  let sql = 'SELECT * FROM Post';
  let params: any[] = [];
  if (limit) {
    sql += ' LIMIT ? OFFSET ?';
    params.push(limitNum, offset);
  }
  const { results } = await c.env.DB.prepare(sql).bind(...params).all();
  if (admin) return c.json({ status: true, data: results });
  // Only return id, title, imageUrl as thumbnail, createdAt for /posts?limit=3
  const posts = results.map((p: any) => ({ id: p.id, title: p.title, thumbnail: p.imageUrl, createdAt: p.createdAt }));
  return c.json({ status: true, data: posts });
};

export const getPost = async (c: any) => {
  const { id } = c.req.param();
  const { results } = await c.env.DB.prepare('SELECT * FROM Post WHERE id = ?').bind(id).all();
  if (!results.length) return c.json({ status: false, error: 'Post not found' }, 404);
  return c.json({ status: true, data: results[0] });
};

export const updatePost = async (c: any) => {
  const { id } = c.req.param();
  const data = await c.req.json();
  const parse = PostSchema.partial().safeParse(data);
  if (!parse.success) return c.json({ status: false, error: parse.error.flatten() }, 400);
  const fields = [];
  const values = [];
  for (const key in parse.data) {
    if ((parse.data as any)[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push((parse.data as any)[key]);
    }
  }
  if (!fields.length) return c.json({ status: false, error: 'No fields to update' }, 400);
  values.push(id);
  const sql = `UPDATE Post SET ${fields.join(', ')} WHERE id = ?`;
  await c.env.DB.prepare(sql).bind(...values).run();
  return c.json({ status: true, message: 'Post updated' });
};

export const deletePost = async (c: any) => {
  const { id } = c.req.param();
  await c.env.DB.prepare('DELETE FROM Post WHERE id = ?').bind(id).run();
  return c.json({ status: true, message: 'Post deleted' });
}; 