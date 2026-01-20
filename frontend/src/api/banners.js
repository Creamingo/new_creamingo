import logger from '../utils/logger';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class BannersAPI {
  /**
   * Fetch banners from the backend
   * @param {boolean} activeOnly - If true, only fetch active banners
   * @returns {Promise<Array>} Array of banners
   */
  async getBanners(activeOnly = true) {
    try {
      let url = `${API_BASE_URL}/banners/public`;
      
      // Add active filter if specified
      if (activeOnly) {
        url += `?is_active=true`;
      }
      
      logger.log('Banners API URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      logger.log('Banners Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      logger.log('Banners API Response:', data);
      
      if (data.success) {
        return data.data.banners || [];
      } else {
        throw new Error(data.message || 'Failed to fetch banners');
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
      // Return empty array on error to prevent app crashes
      return [];
    }
  }

  /**
   * Fetch all banners (including inactive ones)
   * @returns {Promise<Array>} Array of all banners
   */
  async getAllBanners() {
    return this.getBanners(false);
  }

  /**
   * Fetch only active banners
   * @returns {Promise<Array>} Array of active banners
   */
  async getActiveBanners() {
    return this.getBanners(true);
  }

  /**
   * Track banner view
   * @param {number} bannerId - Banner ID
   * @param {number} customerId - Optional customer ID
   * @returns {Promise<Object>} Response object
   */
  async trackView(bannerId, customerId = null) {
    try {
      const response = await fetch(`${API_BASE_URL}/banners/${bannerId}/track/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customer_id: customerId }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error tracking banner view:', error);
      // Fail silently - don't break user experience
      return { success: false };
    }
  }

  /**
   * Track banner click
   * @param {number} bannerId - Banner ID
   * @param {number} customerId - Optional customer ID
   * @returns {Promise<Object>} Response object
   */
  async trackClick(bannerId, customerId = null) {
    try {
      const response = await fetch(`${API_BASE_URL}/banners/${bannerId}/track/click`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customer_id: customerId }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error tracking banner click:', error);
      // Fail silently - don't break user experience
      return { success: false };
    }
  }
}

// Create and export a singleton instance
const bannersAPI = new BannersAPI();
export default bannersAPI;
