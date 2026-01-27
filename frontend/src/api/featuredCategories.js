import logger from '../utils/logger';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const FEATURED_CATEGORIES_CACHE_TTL_MS = 5 * 60 * 1000;
const MAIN_CATEGORIES_CACHE_TTL_MS = 10 * 60 * 1000;
const featuredCategoriesCache = new Map();
const featuredCategoriesInFlight = new Map();

class MainCategoriesAPI {
  /**
   * Fetch all main categories from the backend
   * @returns {Promise<Array>} Array of all main categories
   */
  async getAllMainCategories({ forceRefresh = false } = {}) {
    try {
      const cacheKey = 'all-main';
      const now = Date.now();
      const cachedEntry = featuredCategoriesCache.get(cacheKey);
      if (!forceRefresh && cachedEntry && now - cachedEntry.cachedAt < MAIN_CATEGORIES_CACHE_TTL_MS) {
        logger.log('Main categories cache hit:', cacheKey);
        return cachedEntry.data;
      }
      if (!forceRefresh && featuredCategoriesInFlight.has(cacheKey)) {
        logger.log('Main categories cache in-flight:', cacheKey);
        return featuredCategoriesInFlight.get(cacheKey);
      }
      logger.log('Main categories cache miss:', cacheKey);

      const url = `${API_BASE_URL}/categories/all-main`;
      
      logger.log('API URL:', url);

      const inFlight = fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then(async (response) => {
          logger.log('Response status:', response.status);

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          logger.log('API Response:', data);
          
          if (data.success) {
            const payload = data.data.categories;
            featuredCategoriesCache.set(cacheKey, { data: payload, cachedAt: Date.now() });
            return payload;
          }

          throw new Error(data.message || 'Failed to fetch main categories');
        })
        .finally(() => {
          featuredCategoriesInFlight.delete(cacheKey);
        });

      featuredCategoriesInFlight.set(cacheKey, inFlight);
      return inFlight;
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
  async getFeaturedCategories(deviceType = null, { forceRefresh = false } = {}) {
    try {
      const cacheKey = deviceType || 'all';
      const now = Date.now();
      const cachedEntry = featuredCategoriesCache.get(cacheKey);
      if (!forceRefresh && cachedEntry && now - cachedEntry.cachedAt < FEATURED_CATEGORIES_CACHE_TTL_MS) {
        logger.log('Featured categories cache hit:', cacheKey);
        return cachedEntry.data;
      }
      if (!forceRefresh && featuredCategoriesInFlight.has(cacheKey)) {
        logger.log('Featured categories cache in-flight:', cacheKey);
        return featuredCategoriesInFlight.get(cacheKey);
      }
      logger.log('Featured categories cache miss:', cacheKey);

      let url = `${API_BASE_URL}/featured-categories`;
      
      // Add device type filter if specified
      if (deviceType) {
        url += `?device_type=${deviceType}`;
      }
      
      logger.log('API URL:', url);

      const inFlight = fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then(async (response) => {
          logger.log('Response status:', response.status);

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          logger.log('API Response:', data);
          
          if (data.success) {
            const payload = data.data;
            featuredCategoriesCache.set(cacheKey, { data: payload, cachedAt: Date.now() });
            return payload;
          }

          throw new Error(data.message || 'Failed to fetch featured categories');
        })
        .finally(() => {
          featuredCategoriesInFlight.delete(cacheKey);
        });

      featuredCategoriesInFlight.set(cacheKey, inFlight);
      return inFlight;
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
   * Fetch featured categories based on current device type
   * @returns {Promise<Array>} Array of featured categories for current device
   */
  async getFeaturedCategoriesForCurrentDevice() {
    // Use the new method to get all main categories
    return this.getAllMainCategories();
  }
}

// Create and export a singleton instance
const mainCategoriesAPI = new MainCategoriesAPI();
export default mainCategoriesAPI;
