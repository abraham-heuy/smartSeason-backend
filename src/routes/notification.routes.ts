import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();
const notificationController = new NotificationController();

// All notification routes require authentication
router.use(authMiddleware);

// User's own notifications
router.get('/', notificationController.getMyNotifications.bind(notificationController));

// Mark single notification as read
router.patch('/:id/read', notificationController.markAsRead.bind(notificationController));

// Mark all user's notifications as read
router.patch('/read-all', notificationController.markAllAsRead.bind(notificationController));

// Delete a notification
router.delete('/:id', notificationController.deleteNotification.bind(notificationController));

// Admin only: send notifications to one or more users
router.post('/send', requireRole(['admin']), notificationController.sendNotification.bind(notificationController));

export default router;