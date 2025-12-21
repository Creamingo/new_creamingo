const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Frontend tracking service for promo code events
 * Tracks views, applications, and abandons on the client side
 */
const promoCodeTrackingApi = {
  /**
   * Track promo code view event
   * @param {string} code - Promo code
   * @param {object} metadata - Additional metadata (optional)
   */
  async trackView(code, metadata = {}) {
    try {
      // This is a fire-and-forget call - don't block UI
      fetch(`${API_BASE_URL}/promo-codes/${code}/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: code.toUpperCase(),
          event_type: 'view',
          ...metadata
        })
      }).catch(err => {
        // Silently fail - analytics shouldn't break the app
        console.debug('Failed to track promo code view:', err);
      });
    } catch (error) {
      // Silently fail
      console.debug('Error tracking promo code view:', error);
    }
  },

  /**
   * Track promo code application event (when user applies code to cart)
   * @param {string} code - Promo code
   * @param {number} cartValue - Current cart value
   * @param {object} metadata - Additional metadata (optional)
   */
  async trackApply(code, cartValue, metadata = {}) {
    try {
      fetch(`${API_BASE_URL}/promo-codes/${code}/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: code.toUpperCase(),
          event_type: 'apply',
          cart_value: cartValue,
          ...metadata
        })
      }).catch(err => {
        console.debug('Failed to track promo code application:', err);
      });
    } catch (error) {
      console.debug('Error tracking promo code application:', error);
    }
  },

  /**
   * Track promo code abandon event (when user removes code or abandons cart)
   * @param {string} code - Promo code
   * @param {number} cartValue - Current cart value
   * @param {object} metadata - Additional metadata (optional)
   */
  async trackAbandon(code, cartValue, metadata = {}) {
    try {
      fetch(`${API_BASE_URL}/promo-codes/${code}/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: code.toUpperCase(),
          event_type: 'abandon',
          cart_value: cartValue,
          ...metadata
        })
      }).catch(err => {
        console.debug('Failed to track promo code abandon:', err);
      });
    } catch (error) {
      console.debug('Error tracking promo code abandon:', error);
    }
  }
};

export default promoCodeTrackingApi;
