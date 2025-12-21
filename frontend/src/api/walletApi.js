const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Get auth token from localStorage
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('customer_token');
  }
  return null;
};

const walletApi = {
  // Get wallet balance
  async getBalance() {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/wallet/balance`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get wallet balance');
      }
      return data;
    } catch (error) {
      console.error('Get wallet balance error:', error);
      throw error;
    }
  },

  // Get wallet transactions
  async getTransactions(params = {}) {
    try {
      const token = getAuthToken();
      const queryString = new URLSearchParams(params).toString();
      const url = `${API_BASE_URL}/wallet/transactions${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get wallet transactions');
      }
      return data;
    } catch (error) {
      console.error('Get wallet transactions error:', error);
      throw error;
    }
  },

  // Credit welcome bonus
  async creditWelcomeBonus() {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/wallet/welcome-bonus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to credit welcome bonus');
      }
      return data;
    } catch (error) {
      console.error('Credit welcome bonus error:', error);
      throw error;
    }
  },

  // Get wallet statistics
  async getStats() {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/wallet/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get wallet stats');
      }
      return data;
    } catch (error) {
      console.error('Get wallet stats error:', error);
      throw error;
    }
  },
};

export default walletApi;

