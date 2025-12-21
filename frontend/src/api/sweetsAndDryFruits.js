const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class SweetsAndDryFruitsAPI {
  async getSweetsAndDryFruits() {
    try {
      const response = await fetch(`${API_BASE_URL}/categories/sweets-dry-fruits`, {
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
      console.error('Error fetching sweets and dry fruits:', error);
      throw error;
    }
  }
}

const sweetsAndDryFruitsAPI = new SweetsAndDryFruitsAPI();
export default sweetsAndDryFruitsAPI;
