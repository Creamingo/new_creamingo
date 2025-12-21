/**
 * Admin Notification Service
 * Manages notifications for admin panel with context-aware filtering
 */

// Note: apiClient imported for future backend integration
// import apiClient from './api';

export interface AdminNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  module: NotificationModule;
  data?: Record<string, any>;
  time: string;
  timestamp: number;
  unread: boolean;
  link?: string; // Optional link to navigate to relevant page
}

export type NotificationType = 
  | 'order_new'
  | 'order_status_changed'
  | 'order_cancelled'
  | 'payment_received'
  | 'payment_failed'
  | 'delivery_assigned'
  | 'delivery_status_changed'
  | 'delivery_completed'
  | 'low_stock'
  | 'product_added'
  | 'product_updated'
  | 'customer_registered'
  | 'promo_code_created'
  | 'deal_created'
  | 'system_alert';

export type NotificationModule = 
  | 'orders'
  | 'delivery'
  | 'payments'
  | 'products'
  | 'customers'
  | 'promo_codes'
  | 'deals'
  | 'system'
  | 'all';

interface NotificationFilters {
  module?: NotificationModule;
  type?: NotificationType;
  unreadOnly?: boolean;
  limit?: number;
}

class AdminNotificationService {
  private storageKey = 'admin_notifications';
  private maxNotifications = 100; // Keep last 100 notifications

  /**
   * Get all notifications with optional filters
   */
  getNotifications(filters: NotificationFilters = {}): AdminNotification[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return [];

      let notifications: AdminNotification[] = JSON.parse(stored);

      // Filter by module
      if (filters.module && filters.module !== 'all') {
        notifications = notifications.filter(n => n.module === filters.module);
      }

      // Filter by type
      if (filters.type) {
        notifications = notifications.filter(n => n.type === filters.type);
      }

      // Filter by unread
      if (filters.unreadOnly) {
        notifications = notifications.filter(n => n.unread);
      }

      // Sort by timestamp (newest first)
      notifications.sort((a, b) => b.timestamp - a.timestamp);

      // Limit results
      if (filters.limit) {
        notifications = notifications.slice(0, filters.limit);
      }

      return notifications;
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  /**
   * Get unread count
   */
  getUnreadCount(module?: NotificationModule): number {
    const filters: NotificationFilters = { unreadOnly: true };
    if (module) filters.module = module;
    return this.getNotifications(filters).length;
  }

  /**
   * Add a new notification
   */
  addNotification(notification: Omit<AdminNotification, 'id' | 'timestamp' | 'time' | 'unread'>): void {
    try {
      const notifications = this.getNotifications();
      
      const newNotification: AdminNotification = {
        ...notification,
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        time: this.formatTime(Date.now()),
        unread: true,
      };

      // Add to beginning
      notifications.unshift(newNotification);

      // Keep only last maxNotifications
      if (notifications.length > this.maxNotifications) {
        notifications.splice(this.maxNotifications);
      }

      localStorage.setItem(this.storageKey, JSON.stringify(notifications));

      // Dispatch event for real-time updates
      window.dispatchEvent(new CustomEvent('adminNotificationUpdate'));
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): void {
    try {
      const notifications = this.getNotifications();
      const updated = notifications.map(n =>
        n.id === notificationId ? { ...n, unread: false } : n
      );
      localStorage.setItem(this.storageKey, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('adminNotificationUpdate'));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  /**
   * Mark all as read
   */
  markAllAsRead(module?: NotificationModule): void {
    try {
      const notifications = this.getNotifications();
      const updated = notifications.map(n => {
        if (module && module !== 'all' && n.module !== module) {
          return n;
        }
        return { ...n, unread: false };
      });
      localStorage.setItem(this.storageKey, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('adminNotificationUpdate'));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }

  /**
   * Delete notification
   */
  deleteNotification(notificationId: string): void {
    try {
      const notifications = this.getNotifications();
      const updated = notifications.filter(n => n.id !== notificationId);
      localStorage.setItem(this.storageKey, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('adminNotificationUpdate'));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    try {
      localStorage.removeItem(this.storageKey);
      window.dispatchEvent(new CustomEvent('adminNotificationUpdate'));
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  /**
   * Format timestamp to relative time
   */
  private formatTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;

    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: timestamp < now - 365 * 24 * 60 * 60 * 1000 ? 'numeric' : undefined,
    });
  }

  /**
   * Helper methods to create notifications for common events
   */
  notifyOrderCreated(orderNumber: string, orderId: string): void {
    this.addNotification({
      type: 'order_new',
      title: 'New Order Received',
      message: `Order #${orderNumber} has been placed`,
      module: 'orders',
      data: { orderId, orderNumber },
      link: `/orders?order=${orderId}`,
    });
  }

  notifyOrderStatusChanged(orderNumber: string, oldStatus: string, newStatus: string, orderId: string): void {
    this.addNotification({
      type: 'order_status_changed',
      title: 'Order Status Updated',
      message: `Order #${orderNumber} changed from ${oldStatus} to ${newStatus}`,
      module: 'orders',
      data: { orderId, orderNumber, oldStatus, newStatus },
      link: `/orders?order=${orderId}`,
    });
  }

  notifyPaymentReceived(orderNumber: string, amount: number, orderId: string): void {
    this.addNotification({
      type: 'payment_received',
      title: 'Payment Received',
      message: `Payment of ₹${amount.toFixed(2)} received for order #${orderNumber}`,
      module: 'payments',
      data: { orderId, orderNumber, amount },
      link: `/payments?order=${orderId}`,
    });
  }

  notifyDeliveryAssigned(orderNumber: string, deliveryBoyName: string, orderId: string): void {
    this.addNotification({
      type: 'delivery_assigned',
      title: 'Delivery Assigned',
      message: `Order #${orderNumber} assigned to ${deliveryBoyName}`,
      module: 'delivery',
      data: { orderId, orderNumber, deliveryBoyName },
      link: `/delivery?order=${orderId}`,
    });
  }

  notifyDeliveryStatusChanged(orderNumber: string, status: string, orderId: string): void {
    this.addNotification({
      type: 'delivery_status_changed',
      title: 'Delivery Status Updated',
      message: `Order #${orderNumber} delivery status: ${status}`,
      module: 'delivery',
      data: { orderId, orderNumber, status },
      link: `/delivery?order=${orderId}`,
    });
  }

  notifyLowStock(productName: string, currentStock: number, productId: string): void {
    this.addNotification({
      type: 'low_stock',
      title: 'Low Stock Alert',
      message: `${productName} is running low (${currentStock} remaining)`,
      module: 'products',
      data: { productId, productName, currentStock },
      link: `/products?product=${productId}`,
    });
  }
}

// Export singleton instance
const notificationService = new AdminNotificationService();
export default notificationService;
