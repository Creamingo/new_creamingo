/**
 * Order Slot Manager
 * Handles automatic decrementing of delivery slot availability when orders are placed
 */

import deliverySlotApi from '../api/deliverySlotApi';

class OrderSlotManager {
  /**
   * Decrement available orders when an online order is placed
   * @param {Object} orderData - Order information
   * @param {number} orderData.deliverySlotId - ID of the selected delivery slot
   * @param {string} orderData.deliveryDate - Delivery date (YYYY-MM-DD format)
   * @param {number} orderData.quantity - Number of items ordered (default: 1)
   * @returns {Promise<Object>} Result of the decrement operation
   */
  static async handleOrderPlacement(orderData) {
    try {
      const { deliverySlotId, deliveryDate, quantity = 1 } = orderData;
      
      // Format date if provided
      const formattedDate = deliveryDate ? OrderSlotManager.formatDeliveryDate(deliveryDate) : null;
      
      if (!deliverySlotId || !formattedDate) {
        console.warn('OrderSlotManager: Missing delivery slot information', {
          deliverySlotId,
          deliveryDate,
          formattedDate
        });
        return { success: false, message: 'Missing delivery slot information' };
      }

      console.log(`OrderSlotManager: Decrementing ${quantity} order(s) for slot ${deliverySlotId} on ${formattedDate}`);
      
      const result = await deliverySlotApi.decrementAvailableOrders(
        deliverySlotId,
        formattedDate,
        quantity
      );

      if (result.success) {
        console.log('OrderSlotManager: Successfully decremented available orders', result.data);
        return {
          success: true,
          message: 'Available orders updated successfully',
          data: result.data
        };
      } else {
        console.error('OrderSlotManager: Failed to decrement available orders', result.message);
        return {
          success: false,
          message: result.message || 'Failed to update available orders'
        };
      }
    } catch (error) {
      console.error('OrderSlotManager: Error handling order placement:', error);
      return {
        success: false,
        message: 'Failed to update delivery slot availability',
        error: error.message
      };
    }
  }

  /**
   * Increment available orders when an order is cancelled or refunded
   * @param {Object} orderData - Order information
   * @param {number} orderData.deliverySlotId - ID of the delivery slot
   * @param {string} orderData.deliveryDate - Delivery date (YYYY-MM-DD format)
   * @param {number} orderData.quantity - Number of items to restore (default: 1)
   * @returns {Promise<Object>} Result of the increment operation
   */
  static async handleOrderCancellation(orderData) {
    try {
      const { deliverySlotId, deliveryDate, quantity = 1 } = orderData;
      
      if (!deliverySlotId || !deliveryDate) {
        console.warn('OrderSlotManager: Missing delivery slot information for cancellation');
        return { success: false, message: 'Missing delivery slot information' };
      }

      console.log(`OrderSlotManager: Restoring ${quantity} order(s) for slot ${deliverySlotId} on ${deliveryDate}`);
      
      // For cancellation, we need to increment the available orders
      // This would require a separate endpoint or we can use the existing update endpoint
      // For now, we'll log this and suggest manual adjustment in admin panel
      console.log('OrderSlotManager: Order cancellation detected - please manually adjust availability in admin panel');
      
      return {
        success: true,
        message: 'Order cancellation logged - please manually adjust availability in admin panel',
        requiresManualAdjustment: true
      };
    } catch (error) {
      console.error('OrderSlotManager: Error handling order cancellation:', error);
      return {
        success: false,
        message: 'Failed to handle order cancellation',
        error: error.message
      };
    }
  }

  /**
   * Format delivery date for API calls
   * @param {Date|string|null|undefined} date - Date to format
   * @returns {string|null} Formatted date string (YYYY-MM-DD) or null if invalid
   */
  static formatDeliveryDate(date) {
    // Handle null or undefined
    if (date === null || date === undefined) {
      return null;
    }
    
    // Handle string dates
    if (typeof date === 'string') {
      // If it's already in YYYY-MM-DD format, return as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
      }
      // Try to parse and format
      const parsed = new Date(date);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }
      return null;
    }
    
    // Handle Date objects
    if (date instanceof Date) {
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return null;
      }
      return date.toISOString().split('T')[0];
    }
    
    // Invalid format - return null instead of throwing
    console.warn('OrderSlotManager: Invalid date format', date);
    return null;
  }
}

export default OrderSlotManager;
