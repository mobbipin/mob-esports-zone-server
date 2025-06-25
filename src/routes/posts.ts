import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import * as postController from '../controllers/postController';
import { jwtAuth } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';
import { createPostSchema } from '../validators/post';

const posts = new Hono();

// POST /posts
// GET /posts
// GET /posts/:id
// PUT /posts/:id
// DELETE /posts/:id

posts.post('/', jwtAuth, roleGuard('admin'), zValidator('json', createPostSchema), postController.createPost);
posts.get('/', postController.listPosts);
posts.get('/:id', postController.getPost);
posts.put('/:id', jwtAuth, roleGuard('admin'), zValidator('json', createPostSchema), postController.updatePost);
posts.delete('/:id', jwtAuth, roleGuard('admin'), postController.deletePost);

export default posts; 