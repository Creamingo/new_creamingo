const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class PinCodeAPI {
  /**
   * Check if a PIN code is available for delivery
   * @param {string} pinCode - 6-digit PIN code
   * @returns {Promise<Object>} Object containing availability status and delivery info
   */
  async checkPinCodeAvailability(pinCode) {
    try {
      // Validate PIN code format
      if (!pinCode || !/^\d{6}$/.test(pinCode)) {
        throw new Error('Invalid PIN code format. Must be exactly 6 digits.');
      }

      const url = `${API_BASE_URL}/delivery-pin-codes/check/${pinCode}`;
      
      console.log('PinCode API URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('PinCode Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('PinCode API Response:', data);
      
      if (data.success) {
        return {
          available: data.available,
          message: data.message,
          data: data.data
        };
      } else {
        throw new Error(data.message || 'Failed to check PIN code availability');
      }
    } catch (error) {
      console.error('Error checking PIN code availability:', error);
      throw error;
    }
  }

  /**
   * Get delivery information for a PIN code
   * @param {string} pinCode - 6-digit PIN code
   * @returns {Promise<Object>} Delivery information including charge, locality, and product availability
   */
  async getDeliveryInfo(pinCode) {
    try {
      const result = await this.checkPinCodeAvailability(pinCode);
      
      if (result.available && result.data) {
        return {
          pinCode: result.data.pinCode,
          deliveryCharge: result.data.deliveryCharge,
          locality: result.data.locality,
          status: result.data.status,
          productAvailability: result.data.productAvailability || null
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting delivery info:', error);
      throw error;
    }
  }

  /**
   * Get product availability for a PIN code
   * @param {string} pinCode - 6-digit PIN code
   * @returns {Promise<Object|null>} Product availability statistics
   */
  async getProductAvailability(pinCode) {
    try {
      const result = await this.checkPinCodeAvailability(pinCode);
      
      if (result.available && result.data && result.data.productAvailability) {
        return result.data.productAvailability;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting product availability:', error);
      throw error;
    }
  }

  /**
   * Validate PIN code format
   * @param {string} pinCode - PIN code to validate
   * @returns {boolean} True if valid format
   */
  validatePinCodeFormat(pinCode) {
    return /^\d{6}$/.test(pinCode);
  }

  /**
   * Format PIN code for display (adds space after 3 digits)
   * @param {string} pinCode - PIN code to format
   * @returns {string} Formatted PIN code
   */
  formatPinCode(pinCode) {
    if (pinCode.length >= 3) {
      return pinCode.slice(0, 3) + ' ' + pinCode.slice(3);
    }
    return pinCode;
  }
}

// Create and export a singleton instance
const pinCodeAPI = new PinCodeAPI();
export default pinCodeAPI;
