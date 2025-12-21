const { query } = require('../config/db');

// Create a notification
const createNotification = async (customerId, type, title, message, data = {}) => {
  try {
    const result = await query(
      `INSERT INTO notifications 
       (customer_id, type, title, message, data, is_read, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 0, datetime('now'), datetime('now'))`,
      [customerId, type, title, message, JSON.stringify(data)]
    );

    return {
      success: true,
      notificationId: result.lastID
    };
  } catch (error) {
    console.error('Create notification error:', error);
    return { success: false, message: error.message };
  }
};

// Get user notifications
const getUserNotifications = async (customerId, limit = 50, unreadOnly = false) => {
  try {
    let sql = `SELECT * FROM notifications WHERE customer_id = ?`;
    const params = [customerId];

    if (unreadOnly) {
      sql += ' AND is_read = 0';
    }

    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const result = await query(sql, params);

    const notifications = result.rows.map(row => ({
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      data: row.data ? JSON.parse(row.data) : {},
      isRead: row.is_read === 1,
      createdAt: row.created_at
    }));

    return {
      success: true,
      notifications
    };
  } catch (error) {
    console.error('Get user notifications error:', error);
    return { success: false, message: error.message };
  }
};

// Mark notification as read
const markAsRead = async (notificationId, customerId) => {
  try {
    await query(
      'UPDATE notifications SET is_read = 1, updated_at = datetime("now") WHERE id = ? AND customer_id = ?',
      [notificationId, customerId]
    );

    return { success: true };
  } catch (error) {
    console.error('Mark notification as read error:', error);
    return { success: false, message: error.message };
  }
};

// Mark all as read
const markAllAsRead = async (customerId) => {
  try {
    await query(
      'UPDATE notifications SET is_read = 1, updated_at = datetime("now") WHERE customer_id = ? AND is_read = 0',
      [customerId]
    );

    return { success: true };
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    return { success: false, message: error.message };
  }
};

// Get unread count
const getUnreadCount = async (customerId) => {
  try {
    const result = await query(
      'SELECT COUNT(*) as count FROM notifications WHERE customer_id = ? AND is_read = 0',
      [customerId]
    );

    return {
      success: true,
      count: result.rows[0].count || 0
    };
  } catch (error) {
    console.error('Get unread count error:', error);
    return { success: false, message: error.message };
  }
};

// Delete notification
const deleteNotification = async (notificationId, customerId) => {
  try {
    await query(
      'DELETE FROM notifications WHERE id = ? AND customer_id = ?',
      [notificationId, customerId]
    );

    return { success: true };
  } catch (error) {
    console.error('Delete notification error:', error);
    return { success: false, message: error.message };
  }
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification
};

