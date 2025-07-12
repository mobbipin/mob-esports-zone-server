import { nanoid } from 'nanoid';
import { z } from 'zod';

const PostSchema = z.object({
  title: z.string().min(2),
  content: z.string().min(2),
  imageUrl: z.string().url().or(z.literal('')).optional().transform(val => val === '' ? undefined : val)
});

const LikePostSchema = z.object({
  postId: z.string()
});

const ApprovePostSchema = z.object({
  isApproved: z.boolean(),
  approvedBy: z.string()
});

export const createPost = async (c: any) => {
  const data = await c.req.json();
  const parse = PostSchema.safeParse(data);
  if (!parse.success) return c.json({ status: false, error: parse.error.flatten() }, 400);
  const { title, content, imageUrl } = parse.data;
  const id = nanoid();
  const user = c.get('user');
  const createdAt = new Date().toISOString();
  
  // Check if user is admin or tournament organizer
  if (user.role !== 'admin' && user.role !== 'tournament_organizer') {
    return c.json({ status: false, error: 'Unauthorized to create posts' }, 403);
  }
  
  // Posts from tournament organizers need admin approval
  const isApproved = user.role === 'admin';
  const approvedBy = user.role === 'admin' ? user.id : null;
  const approvedAt = user.role === 'admin' ? createdAt : null;
  
  await c.env.DB.prepare(
    'INSERT INTO Post (id, title, content, imageUrl, createdBy, createdAt, isApproved, approvedBy, approvedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, title, content, imageUrl ?? null, user.id, createdAt, isApproved ? 1 : 0, approvedBy, approvedAt).run();
  
  return c.json({ status: true, data: { id }, message: 'Post created' });
};

export const listPosts = async (c: any) => {
  const { limit, admin, page = '1', approved } = c.req.query();
  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = limit ? parseInt(limit as string, 10) : 10;
  const offset = (pageNum - 1) * limitNum;
  
  let sql = 'SELECT p.*, u.username as authorName, u.displayName as authorDisplayName';
  let params: any[] = [];
  
  // Join with User table to get author info
  sql += ' FROM Post p LEFT JOIN User u ON p.createdBy = u.id WHERE 1=1';
  
  // Filter by approval status
  if (approved === 'true') {
    sql += ' AND p.isApproved = 1';
  } else if (approved === 'false') {
    sql += ' AND p.isApproved = 0';
  }
  
  // For non-admin users, only show approved posts
  if (!admin) {
    sql += ' AND p.isApproved = 1';
  }
  
  sql += ' ORDER BY p.createdAt DESC';
  
  if (limit) {
    sql += ' LIMIT ? OFFSET ?';
    params.push(limitNum, offset);
  }
  
  const { results } = await c.env.DB.prepare(sql).bind(...params).all();
  
  if (admin) return c.json({ status: true, data: results });
  
  // Only return id, title, imageUrl as thumbnail, createdAt for /posts?limit=3
  const posts = results.map((p: any) => ({ 
    id: p.id, 
    title: p.title, 
    thumbnail: p.imageUrl, 
    createdAt: p.createdAt,
    likes: p.likes || 0,
    authorName: p.authorName || p.authorDisplayName
  }));
  
  return c.json({ status: true, data: posts });
};

export const getPost = async (c: any) => {
  const { id } = c.req.param();
  const user = c.get('user');
  
  let sql = 'SELECT p.*, u.username as authorName, u.displayName as authorDisplayName FROM Post p LEFT JOIN User u ON p.createdBy = u.id WHERE p.id = ?';
  let params = [id];
  
  // For non-admin users, only show approved posts
  if (!user || user.role !== 'admin') {
    sql += ' AND p.isApproved = 1';
  }
  
  const { results } = await c.env.DB.prepare(sql).bind(...params).all();
  if (!results.length) return c.json({ status: false, error: 'Post not found' }, 404);
  
  const post = results[0];
  
  // Check if user has liked this post
  let userLiked = false;
  if (user) {
    const { results: likeCheck } = await c.env.DB.prepare(
      'SELECT * FROM PostLikes WHERE postId = ? AND userId = ?'
    ).bind(id, user.id).all();
    userLiked = likeCheck.length > 0;
  }
  
  return c.json({ 
    status: true, 
    data: {
      ...post,
      userLiked,
      likes: post.likes || 0
    }
  });
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
  await c.env.DB.prepare('DELETE FROM PostLikes WHERE postId = ?').bind(id).run();
  return c.json({ status: true, message: 'Post deleted' });
};

export const likePost = async (c: any) => {
  const data = await c.req.json();
  const parse = LikePostSchema.safeParse(data);
  if (!parse.success) return c.json({ status: false, error: parse.error.flatten() }, 400);
  
  const { postId } = parse.data;
  const user = c.get('user');
  
  // Check if post exists and is approved
  const { results: post } = await c.env.DB.prepare('SELECT * FROM Post WHERE id = ? AND isApproved = 1').bind(postId).all();
  if (!post.length) {
    return c.json({ status: false, error: 'Post not found or not approved' }, 404);
  }
  
  // Check if user already liked the post
  const { results: existingLike } = await c.env.DB.prepare(
    'SELECT * FROM PostLikes WHERE postId = ? AND userId = ?'
  ).bind(postId, user.id).all();
  
  if (existingLike.length > 0) {
    return c.json({ status: false, error: 'Post already liked' }, 400);
  }
  
  // Add like
  await c.env.DB.prepare(
    'INSERT INTO PostLikes (postId, userId, createdAt) VALUES (?, ?, ?)'
  ).bind(postId, user.id, new Date().toISOString()).run();
  
  // Update post like count
  await c.env.DB.prepare(
    'UPDATE Post SET likes = likes + 1 WHERE id = ?'
  ).bind(postId).run();
  
  return c.json({ status: true, message: 'Post liked' });
};

export const unlikePost = async (c: any) => {
  const data = await c.req.json();
  const parse = LikePostSchema.safeParse(data);
  if (!parse.success) return c.json({ status: false, error: parse.error.flatten() }, 400);
  
  const { postId } = parse.data;
  const user = c.get('user');
  
  // Remove like
  const { results } = await c.env.DB.prepare(
    'DELETE FROM PostLikes WHERE postId = ? AND userId = ?'
  ).bind(postId, user.id).run();
  
  if (results.changes === 0) {
    return c.json({ status: false, error: 'Post not liked' }, 400);
  }
  
  // Update post like count
  await c.env.DB.prepare(
    'UPDATE Post SET likes = likes - 1 WHERE id = ?'
  ).bind(postId).run();
  
  return c.json({ status: true, message: 'Post unliked' });
};

export const approvePost = async (c: any) => {
  const { id } = c.req.param();
  const data = await c.req.json();
  const parse = ApprovePostSchema.safeParse(data);
  if (!parse.success) return c.json({ status: false, error: parse.error.flatten() }, 400);
  
  const { isApproved } = parse.data;
  const user = c.get('user');
  
  if (user.role !== 'admin') {
    return c.json({ status: false, error: 'Unauthorized' }, 403);
  }
  
  const now = new Date().toISOString();
  await c.env.DB.prepare(
    'UPDATE Post SET isApproved = ?, approvedBy = ?, approvedAt = ? WHERE id = ?'
  ).bind(isApproved ? 1 : 0, user.id, now, id).run();
  
  return c.json({ status: true, message: `Post ${isApproved ? 'approved' : 'rejected'}` });
}; 