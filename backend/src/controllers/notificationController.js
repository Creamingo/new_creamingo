const notificationService = require('../services/notificationService');

// Get user notifications
const getNotifications = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const { limit = 50, unreadOnly = false } = req.query;

    const result = await notificationService.getUserNotifications(
      customerId,
      parseInt(limit),
      unreadOnly === 'true'
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      data: result.notifications
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get unread count
const getUnreadCount = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const result = await notificationService.getUnreadCount(customerId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      count: result.count
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const { notificationId } = req.body;

    if (!notificationId) {
      return res.status(400).json({
        success: false,
        message: 'Notification ID is required'
      });
    }

    const result = await notificationService.markAsRead(notificationId, customerId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Mark all as read
const markAllAsRead = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const result = await notificationService.markAllAsRead(customerId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const { notificationId } = req.params;

    if (!notificationId) {
      return res.status(400).json({
        success: false,
        message: 'Notification ID is required'
      });
    }

    const result = await notificationService.deleteNotification(notificationId, customerId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
};

