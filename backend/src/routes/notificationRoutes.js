const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { customerAuthMiddleware } = require('../middleware/customerAuth');

// Get user notifications
router.get('/', customerAuthMiddleware, notificationController.getNotifications);

// Get unread count
router.get('/unread-count', customerAuthMiddleware, notificationController.getUnreadCount);

// Mark notification as read
router.post('/mark-read', customerAuthMiddleware, notificationController.markAsRead);

// Mark all as read
router.post('/mark-all-read', customerAuthMiddleware, notificationController.markAllAsRead);

// Delete notification
router.delete('/:notificationId', customerAuthMiddleware, notificationController.deleteNotification);

module.exports = router;

