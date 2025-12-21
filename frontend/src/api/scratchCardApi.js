const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Get auth token from localStorage
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('customer_token');
  }
  return null;
};

const scratchCardApi = {
  // Get available scratch cards
  async getScratchCards(params = {}) {
    try {
      const token = getAuthToken();
      const queryString = new URLSearchParams(params).toString();
      const url = `${API_BASE_URL}/scratch-cards${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      const data = await response.json();
      if (!response.ok) {
        const errorMessage = data.message || 'Failed to get scratch cards';
        // Don't log authentication errors as they're expected in some scenarios
        if (response.status === 401 || errorMessage.includes('token') || errorMessage.includes('Authentication') || errorMessage.includes('Access denied')) {
          throw new Error(errorMessage);
        }
        console.error('Get scratch cards error:', errorMessage);
        throw new Error(errorMessage);
      }
      return data;
    } catch (error) {
      // Only log non-authentication errors
      if (!error.message.includes('token') && !error.message.includes('Authentication') && !error.message.includes('Access denied')) {
        console.error('Get scratch cards error:', error);
      }
      throw error;
    }
  },

  // Reveal scratch card
  async revealScratchCard(scratchCardId) {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/scratch-cards/reveal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ scratchCardId })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to reveal scratch card');
      }
      return data;
    } catch (error) {
      console.error('Reveal scratch card error:', error);
      throw error;
    }
  },

  // Credit scratch card (after delivery confirmation)
  async creditScratchCard(scratchCardId) {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/scratch-cards/credit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ scratchCardId })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to credit scratch card');
      }
      return data;
    } catch (error) {
      console.error('Credit scratch card error:', error);
      throw error;
    }
  },
};

export default scratchCardApi;

