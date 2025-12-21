const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const settingsApi = {
  /**
   * Get all settings
   */
  async getSettings() {
    try {
      const response = await fetch(`${API_BASE_URL}/settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch settings');
      }
      return data.data?.settings || {};
    } catch (error) {
      console.error('Error fetching settings:', error);
      throw error;
    }
  },

  /**
   * Get a specific setting by key
   */
  async getSetting(key) {
    try {
      const response = await fetch(`${API_BASE_URL}/settings/${key}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch setting');
      }
      
      // Parse the value if it's JSON
      try {
        return JSON.parse(data.data?.setting?.value || 'null');
      } catch {
        return data.data?.setting?.value;
      }
    } catch (error) {
      console.error('Error fetching setting:', error);
      throw error;
    }
  },

  /**
   * Get free delivery threshold with caching
   */
  async getFreeDeliveryThreshold() {
    try {
      const settings = await this.getSettings();
      const threshold = settings.free_delivery_threshold;
      return threshold ? parseFloat(threshold) : 1500; // Default to 1500 if not set
    } catch (error) {
      console.error('Error fetching free delivery threshold:', error);
      return 1500; // Return default on error
    }
  }
};

export default settingsApi;

