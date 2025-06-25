import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { registerSchema, loginSchema } from '../validators/auth';
import * as authController from '../controllers/authController';
import { jwtAuth } from '../middleware/auth';

const auth = new Hono();

// POST /auth/register
// POST /auth/login
// GET /auth/me

auth.post('/register', zValidator('json', registerSchema), authController.register);
auth.post('/login', zValidator('json', loginSchema), authController.login);
auth.get('/me', jwtAuth, authController.me);

export default auth; 