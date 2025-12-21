const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const promoCodeApi = {
  /**
   * Get all active promo codes
   */
  async getPromoCodes(activeOnly = true) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/promo-codes?active_only=${activeOnly}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch promo codes');
      }
      return data.data || [];
    } catch (error) {
      console.error('Error fetching promo codes:', error);
      throw error;
    }
  },

  /**
   * Validate and apply promo code
   * @param {string} code - Promo code
   * @param {number} orderAmount - Order subtotal amount
   */
  async validatePromoCode(code, orderAmount = 0) {
    try {
      // Validate input
      if (!code || typeof code !== 'string' || code.trim().length === 0) {
        throw new Error('Please enter a promo code');
      }

      const response = await fetch(`${API_BASE_URL}/promo-codes/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: code.toUpperCase().trim(),
          order_amount: orderAmount
        })
      });

      const data = await response.json();
      if (!response.ok) {
        // Extract error message from response
        const errorMessage = data.message || data.error || 'Invalid promo code';
        throw new Error(errorMessage);
      }
      
      // Validate response data structure
      if (!data.data) {
        throw new Error('Invalid response from server');
      }
      
      return data.data;
    } catch (error) {
      // Re-throw with a more user-friendly message if it's a network error
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        const networkError = new Error('Unable to connect to server. Please check your internet connection.');
        networkError.name = 'NetworkError';
        throw networkError;
      }
      // Re-throw the original error if it already has a message
      if (error.message) {
        // Only log to console if it's not a user-facing validation error
        if (!error.message.includes('Invalid promo code') && !error.message.includes('expired') && !error.message.includes('minimum')) {
          console.error('Error validating promo code:', error);
        }
        throw error;
      }
      // Default fallback
      throw new Error('Invalid promo code. Please try again.');
    }
  }
};

export default promoCodeApi;

