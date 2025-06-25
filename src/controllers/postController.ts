import { getDb } from '../db/drizzle';
import { Post } from '../db/models';
import { nanoid } from 'nanoid';

export const createPost = async (c: any) => {
  const db = getDb(c.env);
  const { title, content, imageUrl } = await c.req.json();
  const id = nanoid();
  const createdBy = c.get('user').id;
  await db.insert(Post).values({ id, title, content, imageUrl, createdBy, createdAt: new Date().toISOString() });
  return c.json({ id, message: 'Post created' });
};

export const listPosts = async (c: any) => {
  const db = getDb(c.env);
  const { limit, admin } = c.req.query();
  let q = db.select().from(Post);
  if (limit) q = q.limit(Number(limit));
  const posts: any[] = await q.all();
  if (admin) return c.json(posts);
  // Only return id, title, imageUrl as thumbnail, createdAt for /posts?limit=3
  return c.json(posts.map((p: any) => ({ id: p.id, title: p.title, thumbnail: p.imageUrl, createdAt: p.createdAt })));
};

export const getPost = async (c: any) => {
  const db = getDb(c.env);
  const { id } = c.req.param();
  const post = await db.select().from(Post).where(Post.id.eq(id)).get();
  if (!post) return c.json({ error: 'Post not found' }, 404);
  return c.json(post);
};

export const updatePost = async (c: any) => {
  const db = getDb(c.env);
  const { id } = c.req.param();
  const body = await c.req.json();
  await db.update(Post).set(body).where(Post.id.eq(id));
  return c.json({ message: 'Post updated' });
};

export const deletePost = async (c: any) => {
  const db = getDb(c.env);
  const { id } = c.req.param();
  await db.delete(Post).where(Post.id.eq(id));
  return c.json({ message: 'Post deleted' });
}; 