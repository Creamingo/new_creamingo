const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class WishlistAPI {
  /**
   * Get authentication token
   */
  getAuthToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('customer_token');
    }
    return null;
  }

  /**
   * Handle API response
   */
  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: `HTTP error! status: ${response.status}`
      }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  }

  /**
   * Get user's wishlist
   */
  async getWishlist() {
    try {
      const token = this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/wishlist`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      throw error;
    }
  }

  /**
   * Add product to wishlist
   * @param {number} productId - Product ID
   */
  async addToWishlist(productId) {
    try {
      const token = this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/wishlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId })
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      throw error;
    }
  }

  /**
   * Remove product from wishlist
   * @param {number} productId - Product ID
   */
  async removeFromWishlist(productId) {
    try {
      const token = this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/wishlist/${productId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      throw error;
    }
  }

  /**
   * Check if product is in wishlist
   * @param {number} productId - Product ID
   */
  async checkWishlist(productId) {
    try {
      const token = this.getAuthToken();
      if (!token) {
        return { success: true, isInWishlist: false };
      }

      const response = await fetch(`${API_BASE_URL}/wishlist/check/${productId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error checking wishlist:', error);
      return { success: true, isInWishlist: false };
    }
  }

  /**
   * Get wishlist count
   */
  async getWishlistCount() {
    try {
      const token = this.getAuthToken();
      if (!token) {
        return { success: true, count: 0 };
      }

      const response = await fetch(`${API_BASE_URL}/wishlist/count`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching wishlist count:', error);
      return { success: true, count: 0 };
    }
  }

  /**
   * Clear entire wishlist
   */
  async clearWishlist() {
    try {
      const token = this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/wishlist`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const wishlistApi = new WishlistAPI();
export default wishlistApi;

