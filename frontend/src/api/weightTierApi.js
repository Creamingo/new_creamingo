const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class WeightTierAPI {
  /**
   * Get weight-tier mapping by weight
   * @param {string} weight - Weight string (e.g., '1kg', '500 g')
   * @returns {Promise<Object>} Object containing available tiers
   */
  async getWeightTierMapping(weight) {
    try {
      const response = await fetch(`${API_BASE_URL}/weight-tier-mappings/weight/${encodeURIComponent(weight)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // If not found, return null instead of throwing error
        if (response.status === 404) {
          return null;
        }
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data.mapping : null;
    } catch (error) {
      console.error('Error fetching weight-tier mapping:', error);
      return null;
    }
  }

  /**
   * Get all weight-tier mappings (for admin use)
   * @returns {Promise<Object>} Object containing all mappings
   */
  async getAllWeightTierMappings() {
    try {
      const response = await fetch(`${API_BASE_URL}/weight-tier-mappings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data.mappings : [];
    } catch (error) {
      console.error('Error fetching all weight-tier mappings:', error);
      return [];
    }
  }
}

// Create and export a singleton instance
const weightTierApi = new WeightTierAPI();
export default weightTierApi;
