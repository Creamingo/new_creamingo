/**
 * Hook for easy notification integration
 * Use this hook in components to trigger notifications
 */

import { useCallback } from 'react';
import notificationService, { NotificationType, NotificationModule } from '../services/notificationService';

export const useNotifications = () => {
  const notify = useCallback((
    type: NotificationType,
    title: string,
    message: string,
    module: NotificationModule,
    data?: Record<string, any>,
    link?: string
  ) => {
    notificationService.addNotification({
      type,
      title,
      message,
      module,
      data,
      link,
    });
  }, []);

  // Convenience methods for common notification types
  const notifyOrderCreated = useCallback((orderNumber: string, orderId: string) => {
    notificationService.notifyOrderCreated(orderNumber, orderId);
  }, []);

  const notifyOrderStatusChanged = useCallback((
    orderNumber: string,
    oldStatus: string,
    newStatus: string,
    orderId: string
  ) => {
    notificationService.notifyOrderStatusChanged(orderNumber, oldStatus, newStatus, orderId);
  }, []);

  const notifyPaymentReceived = useCallback((orderNumber: string, amount: number, orderId: string) => {
    notificationService.notifyPaymentReceived(orderNumber, amount, orderId);
  }, []);

  const notifyDeliveryAssigned = useCallback((orderNumber: string, deliveryBoyName: string, orderId: string) => {
    notificationService.notifyDeliveryAssigned(orderNumber, deliveryBoyName, orderId);
  }, []);

  const notifyDeliveryStatusChanged = useCallback((orderNumber: string, status: string, orderId: string) => {
    notificationService.notifyDeliveryStatusChanged(orderNumber, status, orderId);
  }, []);

  const notifyLowStock = useCallback((productName: string, currentStock: number, productId: string) => {
    notificationService.notifyLowStock(productName, currentStock, productId);
  }, []);

  return {
    notify,
    notifyOrderCreated,
    notifyOrderStatusChanged,
    notifyPaymentReceived,
    notifyDeliveryAssigned,
    notifyDeliveryStatusChanged,
    notifyLowStock,
  };
};
