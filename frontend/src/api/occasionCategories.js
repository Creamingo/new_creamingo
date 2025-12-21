const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class OccasionCategoryAPI {
  async getOccasionCategories() {
    try {
      const response = await fetch(`${API_BASE_URL}/categories/cakes-for-occasion`, {
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
      return data;
    } catch (error) {
      console.error('Error fetching occasion categories:', error);
      throw error;
    }
  }
}

const occasionCategoryAPI = new OccasionCategoryAPI();
export default occasionCategoryAPI;
