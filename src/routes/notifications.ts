import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import * as notificationController from '../controllers/notificationController';
import { jwtAuth } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';

const notifications = new Hono();

// GET /notifications
// POST /notifications/mark-read
// POST /notifications/mark-all-read
// POST /notifications/admin-message
// GET /notifications/unread-count

notifications.get('/', jwtAuth, notificationController.getNotifications);
notifications.post('/mark-read', jwtAuth, notificationController.markNotificationRead);
notifications.post('/mark-all-read', jwtAuth, notificationController.markAllNotificationsRead);
notifications.post('/admin-message', jwtAuth, roleGuard('admin'), notificationController.sendAdminMessage);
notifications.get('/unread-count', jwtAuth, notificationController.getUnreadCount);

export default notifications; 