const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const dealApi = {
  /**
   * Get active deals based on cart amount
   * @param {number} cartAmount - Current cart subtotal
   */
  async getActiveDeals(cartAmount = 0) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/deals/active?cart_amount=${cartAmount}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch deals');
      }
      return data.data || { eligible_deals: [], next_deal: null, cart_amount: cartAmount };
    } catch (error) {
      console.error('Error fetching active deals:', error);
      throw error;
    }
  }
};

export default dealApi;

