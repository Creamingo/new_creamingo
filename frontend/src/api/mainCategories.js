import logger from '../utils/logger';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class MainCategoriesAPI {
  /**
   * Fetch all main categories from the backend
   * @returns {Promise<Array>} Array of all main categories
   */
  async getAllMainCategories() {
    try {
      // Add cache-busting parameter to ensure fresh data
      const timestamp = Date.now();
      const url = `${API_BASE_URL}/categories/all-main?t=${timestamp}`;
      
      logger.log('API URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
      });

      logger.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      logger.log('API Response:', data);
      
      if (data.success) {
        return data.data.categories;
      } else {
        throw new Error(data.message || 'Failed to fetch main categories');
      }
    } catch (error) {
      console.error('Error fetching main categories:', error);
      // Return empty array on error to prevent app crashes
      return [];
    }
  }

  /**
   * Fetch featured categories from the backend (legacy method for backward compatibility)
   * @param {string} deviceType - 'desktop' or 'mobile' to filter by device visibility
   * @returns {Promise<Array>} Array of featured categories
   */
  async getFeaturedCategories(deviceType = null) {
    try {
      let url = `${API_BASE_URL}/featured-categories`;
      
      // Add device type filter if specified
      if (deviceType) {
        url += `?device_type=${deviceType}`;
      }
      
      logger.log('API URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      logger.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      logger.log('API Response:', data);
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to fetch featured categories');
      }
    } catch (error) {
      console.error('Error fetching featured categories:', error);
      // Return empty array on error to prevent app crashes
      return [];
    }
  }

  /**
   * Fetch featured categories for desktop view (max 7 items)
   * @returns {Promise<Array>} Array of featured categories for desktop
   */
  async getFeaturedCategoriesForDesktop() {
    return this.getFeaturedCategories('desktop');
  }

  /**
   * Fetch featured categories for mobile view (max 6 items)
   * @returns {Promise<Array>} Array of featured categories for mobile
   */
  async getFeaturedCategoriesForMobile() {
    return this.getFeaturedCategories('mobile');
  }

  /**
   * Get device type based on screen width
   * @returns {string} 'desktop' or 'mobile'
   */
  getDeviceType() {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024 ? 'desktop' : 'mobile';
    }
    return 'desktop'; // Default to desktop for SSR
  }

  /**
   * Fetch main categories based on current device type
   * @returns {Promise<Array>} Array of main categories for current device
   */
  async getMainCategoriesForCurrentDevice() {
    // Use the new method to get all main categories
    return this.getAllMainCategories();
  }
}

// Create and export a singleton instance
const mainCategoriesAPI = new MainCategoriesAPI();
export default mainCategoriesAPI;
