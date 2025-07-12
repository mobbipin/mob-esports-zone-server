import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import * as postController from '../controllers/postController';
import { jwtAuth } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';
import { createPostSchema, updatePostSchema, likePostSchema, unlikePostSchema, approvePostSchema } from '../validators/posts';

const posts = new Hono();

// POST /posts
// GET /posts
// GET /posts/:id
// PUT /posts/:id
// DELETE /posts/:id
// POST /posts/like
// POST /posts/unlike
// POST /posts/:id/approve

posts.post('/', jwtAuth, roleGuard(['admin', 'tournament_organizer']), zValidator('json', createPostSchema), postController.createPost);
posts.get('/', postController.listPosts);
posts.get('/:id', postController.getPost);
posts.put('/:id', jwtAuth, roleGuard('admin'), zValidator('json', updatePostSchema), postController.updatePost);
posts.delete('/:id', jwtAuth, roleGuard('admin'), postController.deletePost);

posts.post('/like', jwtAuth, zValidator('json', likePostSchema), postController.likePost);
posts.post('/unlike', jwtAuth, zValidator('json', unlikePostSchema), postController.unlikePost);

posts.post('/:id/approve', jwtAuth, roleGuard('admin'), zValidator('json', approvePostSchema), postController.approvePost);

export default posts; 