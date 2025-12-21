const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class LoveAndRelationshipCakesAPI {
  async getLoveAndRelationshipCakes() {
    try {
      const response = await fetch(`${API_BASE_URL}/categories/love-relationship-cakes`, {
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
      console.error('Error fetching love and relationship cakes:', error);
      throw error;
    }
  }
}

const loveAndRelationshipCakesAPI = new LoveAndRelationshipCakesAPI();
export default loveAndRelationshipCakesAPI;
