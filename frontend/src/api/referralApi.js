const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Get auth token from localStorage
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('customer_token');
  }
  return null;
};

const referralApi = {
  // Get referral info and stats (requires authentication)
  async getReferralInfo() {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/referrals/info`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get referral info');
      }
      return data;
    } catch (error) {
      console.error('Get referral info error:', error);
      throw error;
    }
  },

  // Get milestone progress (requires authentication)
  async getMilestoneProgress() {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/referrals/milestones`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get milestone progress');
      }
      return data;
    } catch (error) {
      console.error('Get milestone progress error:', error);
      throw error;
    }
  },

  // Send referral email (requires authentication)
  async sendReferralEmail(email) {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/referrals/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send referral email');
      }
      return data;
    } catch (error) {
      console.error('Send referral email error:', error);
      throw error;
    }
  },

  // Get tier progress (requires authentication)
  async getTierProgress() {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/referrals/tier`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get tier progress');
      }
      return data;
    } catch (error) {
      console.error('Get tier progress error:', error);
      throw error;
    }
  },

  // Get leaderboard
  async getLeaderboard(limit = 50, period = 'all') {
    try {
      const response = await fetch(`${API_BASE_URL}/referrals/leaderboard?limit=${limit}&period=${period}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get leaderboard');
      }
      return data;
    } catch (error) {
      console.error('Get leaderboard error:', error);
      throw error;
    }
  },

  // Get user leaderboard position
  async getUserLeaderboardPosition() {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/referrals/leaderboard/position`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get leaderboard position');
      }
      return data;
    } catch (error) {
      console.error('Get user leaderboard position error:', error);
      throw error;
    }
  },

  // Get referral analytics
  async getReferralAnalytics(period = '30') {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/referrals/analytics?period=${period}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get analytics');
      }
      return data;
    } catch (error) {
      console.error('Get referral analytics error:', error);
      throw error;
    }
  },

  // Validate referral code (public endpoint, used during signup)
  async validateReferralCode(referralCode) {
    try {
      const response = await fetch(`${API_BASE_URL}/referrals/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ referralCode })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Invalid referral code');
      }
      return data;
    } catch (error) {
      console.error('Validate referral code error:', error);
      throw error;
    }
  }
};

export default referralApi;

