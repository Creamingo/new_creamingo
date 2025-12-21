const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Get auth token from localStorage
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('customer_token');
  }
  return null;
};

const notificationApi = {
  // Get user notifications
  async getNotifications(limit = 50, unreadOnly = false) {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/notifications?limit=${limit}&unreadOnly=${unreadOnly}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get notifications');
      }
      return data;
    } catch (error) {
      console.error('Get notifications error:', error);
      throw error;
    }
  },

  // Get unread count
  async getUnreadCount() {
    try {
      const token = getAuthToken();
      if (!token) {
        return { success: true, count: 0 };
      }

      const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get unread count');
      }
      return data;
    } catch (error) {
      console.error('Get unread count error:', error);
      return { success: true, count: 0 };
    }
  },

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/notifications/mark-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notificationId })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to mark notification as read');
      }
      return data;
    } catch (error) {
      console.error('Mark notification as read error:', error);
      throw error;
    }
  },

  // Mark all as read
  async markAllAsRead() {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to mark all as read');
      }
      return data;
    } catch (error) {
      console.error('Mark all as read error:', error);
      throw error;
    }
  },

  // Delete notification
  async deleteNotification(notificationId) {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete notification');
      }
      return data;
    } catch (error) {
      console.error('Delete notification error:', error);
      throw error;
    }
  }
};

export default notificationApi;

