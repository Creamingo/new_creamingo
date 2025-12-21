const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export interface WeightTierMapping {
  id: number;
  weight: string;
  available_tiers: number[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateWeightTierMappingData {
  weight: string;
  available_tiers: number[];
}

export interface UpdateWeightTierMappingData {
  available_tiers: number[];
}

class WeightTierService {
  /**
   * Get all weight-tier mappings
   */
  async getWeightTierMappings(): Promise<{ success: boolean; data: { mappings: WeightTierMapping[]; total: number } }> {
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

      return await response.json();
    } catch (error) {
      console.error('Error fetching weight-tier mappings:', error);
      throw error;
    }
  }

  /**
   * Get weight-tier mapping by weight
   */
  async getWeightTierMappingByWeight(weight: string): Promise<{ success: boolean; data: { mapping: WeightTierMapping } }> {
    try {
      const response = await fetch(`${API_BASE_URL}/weight-tier-mappings/weight/${encodeURIComponent(weight)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching weight-tier mapping:', error);
      throw error;
    }
  }

  /**
   * Create new weight-tier mapping
   */
  async createWeightTierMapping(data: CreateWeightTierMappingData): Promise<{ success: boolean; data: { mapping: WeightTierMapping } }> {
    try {
      const response = await fetch(`${API_BASE_URL}/weight-tier-mappings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating weight-tier mapping:', error);
      throw error;
    }
  }

  /**
   * Update weight-tier mapping
   */
  async updateWeightTierMapping(id: number, data: UpdateWeightTierMappingData): Promise<{ success: boolean; data: { mapping: WeightTierMapping } }> {
    try {
      const response = await fetch(`${API_BASE_URL}/weight-tier-mappings/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating weight-tier mapping:', error);
      throw error;
    }
  }

  /**
   * Delete weight-tier mapping (soft delete)
   */
  async deleteWeightTierMapping(id: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/weight-tier-mappings/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting weight-tier mapping:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const weightTierService = new WeightTierService();
export default weightTierService;
