const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const getCustomerAuthToken = () => {
  return localStorage.getItem('customer_token');
};

const reviewApi = {
  /**
   * Get customer's reviews
   */
  async getMyReviews() {
    try {
      const token = getCustomerAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/reviews/my-reviews`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get reviews');
      }
      return data;
    } catch (error) {
      console.error('Error getting reviews:', error);
      throw error;
    }
  },

  /**
   * Get pending reviews (orders without reviews)
   */
  async getPendingReviews() {
    try {
      const token = getCustomerAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/reviews/pending`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get pending reviews');
      }
      return data;
    } catch (error) {
      console.error('Error getting pending reviews:', error);
      throw error;
    }
  },

  /**
   * Submit a review
   */
  async submitReview(reviewData) {
    try {
      const token = getCustomerAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reviewData)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit review');
      }
      return data;
    } catch (error) {
      console.error('Error submitting review:', error);
      throw error;
    }
  },

  /**
   * Update a review
   */
  async updateReview(reviewId, reviewData) {
    try {
      const token = getCustomerAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reviewData)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update review');
      }
      return data;
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  },

  /**
   * Delete a review
   */
  async deleteReview(reviewId) {
    try {
      const token = getCustomerAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete review');
      }
      return data;
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  }
};

export default reviewApi;

