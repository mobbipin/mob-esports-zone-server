import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { registerSchema, loginSchema, verifyEmailSchema, forgotPasswordSchema, resetPasswordSchema, resendVerificationSchema } from '../validators/auth';
import * as authController from '../controllers/authController';
import { jwtAuth } from '../middleware/auth';

const auth = new Hono();

// POST /auth/register
// POST /auth/login
// GET /auth/me
// POST /auth/verify-email
// POST /auth/resend-verification
// POST /auth/forgot-password
// POST /auth/reset-password
// DELETE /auth/delete-account

auth.post('/register', zValidator('json', registerSchema), authController.register);
auth.post('/login', zValidator('json', loginSchema), authController.login);
auth.get('/me', jwtAuth, authController.me);

auth.post('/verify-email', zValidator('json', verifyEmailSchema), authController.verifyEmail);
auth.post('/resend-verification', zValidator('json', resendVerificationSchema), authController.resendVerification);
auth.post('/resend-verification-user', jwtAuth, authController.resendVerificationForUser);

auth.post('/forgot-password', zValidator('json', forgotPasswordSchema), authController.forgotPassword);
auth.post('/reset-password', zValidator('json', resetPasswordSchema), authController.resetPassword);
auth.put('/update', jwtAuth, authController.updateUser);

auth.delete('/delete-account', jwtAuth, authController.deleteAccount);

// Admin routes for tournament organizer approval
auth.get('/pending-organizers', jwtAuth, authController.getPendingOrganizers);
auth.post('/approve-organizer', jwtAuth, authController.approveOrganizer);
auth.post('/unapprove-organizer', jwtAuth, authController.unapproveOrganizer);

export default auth; 