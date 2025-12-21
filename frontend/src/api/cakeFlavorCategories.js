const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class CakeFlavorCategoryAPI {
  /**
   * Get the "Pick a Cake by Flavor" category with its subcategories
   * @returns {Promise<Object>} Object containing category and subcategories data
   */
  async getCakeFlavorCategory() {
    try {
      const response = await fetch(`${API_BASE_URL}/categories/cakes-by-flavor/subcategories`, {
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
      console.error('Error fetching cake flavor category:', error);
      throw error;
    }
  }

  /**
   * Get all categories (fallback method)
   * @returns {Promise<Object>} Object containing all categories
   */
  async getAllCategories() {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`, {
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
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  /**
   * Get subcategories for a specific category
   * @param {number} categoryId - Category ID
   * @returns {Promise<Object>} Object containing subcategories
   */
  async getSubcategoriesByCategory(categoryId) {
    try {
      const response = await fetch(`${API_BASE_URL}/categories/${categoryId}?include_subcategories=true`, {
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
      console.error('Error fetching subcategories:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const cakeFlavorCategoryAPI = new CakeFlavorCategoryAPI();
export default cakeFlavorCategoryAPI;
