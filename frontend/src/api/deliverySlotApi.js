// API service for delivery slot operations
import { apiRequest } from '../utils/apiClient';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class DeliverySlotApi {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Helper method to handle API responses
  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  // Get all delivery slots
  async getDeliverySlots() {
    try {
      const response = await fetch(`${this.baseURL}/delivery-slots`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching delivery slots:', error);
      throw error;
    }
  }

  // Get delivery slots availability for a specific date range
  async getSlotAvailability(startDate, endDate) {
    try {
      const params = new URLSearchParams({
        startDate: startDate,
        endDate: endDate
      });
      
      const response = await fetch(`${this.baseURL}/delivery-slots/availability/range?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching slot availability:', error);
      throw error;
    }
  }

  // Get delivery slots for a specific date
  async getSlotsForDate(date) {
    try {
      // Get real availability data from backend for the specific date
      const response = await this.getSlotAvailability(date, date);
      
      if (response.success) {
        // Return the availability data directly
        return {
          success: true,
          data: response.data
        };
      }
      
      return response;
    } catch (error) {
      console.error('Error fetching slots for date:', error);
      throw error;
    }
  }

      // Check if delivery is available for a specific date and slot
      async checkDeliveryAvailability(date, slotId, pinCode) {
        try {
          // For now, simulate availability check
          // In a real implementation, you'd have a proper endpoint for this
          return {
            success: true,
            data: {
              isAvailable: true,
              availableOrders: Math.floor(Math.random() * 10) + 1,
              message: 'Delivery available'
            }
          };
        } catch (error) {
          console.error('Error checking delivery availability:', error);
          throw error;
        }
      }

      // Decrement available orders when an online order is placed
      async decrementAvailableOrders(slotId, deliveryDate, quantity = 1) {
        try {
          const response = await apiRequest('/delivery-slots/availability/decrement', {
            method: 'POST',
            body: JSON.stringify({
              slotId,
              deliveryDate,
              quantity
            })
          });

          return await this.handleResponse(response);
        } catch (error) {
          console.error('Error decrementing available orders:', error);
          throw error;
        }
      }
}

// Create and export a singleton instance
const deliverySlotApi = new DeliverySlotApi();
export default deliverySlotApi;
