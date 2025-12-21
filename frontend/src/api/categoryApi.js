// API service for category-related operations
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class CategoryApi {
  // Fetch category by slug
  async getCategoryBySlug(slug) {
    try {
      // Use the same slug for both frontend and backend
      const response = await fetch(`${API_BASE_URL}/categories/${slug}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching category:', error);
      throw error;
    }
  }

  // Fetch subcategory by category and subcategory slugs
  async getSubcategoryBySlug(categorySlug, subCategorySlug) {
    try {
      // Use the same slug for both frontend and backend
      const response = await fetch(`${API_BASE_URL}/categories/${categorySlug}/${subCategorySlug}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching subcategory:', error);
      throw error;
    }
  }

  // Fetch products for a category
  async getCategoryProducts(categorySlug, options = {}) {
    try {
      const { subCategorySlug, sortBy, page = 1, limit = 20 } = options;
      
      let url = `${API_BASE_URL}/products`;
      const params = new URLSearchParams({
        category: categorySlug,
        page: page.toString(),
        limit: limit.toString(),
      });

      if (subCategorySlug) {
        params.append('subcategory', subCategorySlug);
      }

      if (sortBy) {
        params.append('sort', sortBy);
      }

      url += `?${params.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching category products:', error);
      throw error;
    }
  }

  // Fetch all categories (for navigation)
  async getAllCategories() {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  // Fetch subcategories for a category
  async getSubcategories(categorySlug) {
    try {
      // Special handling for categories that return both category and subcategories in one call
      const specialCategories = ['kids-cake-collection', 'crowd-favorite-cakes', 'love-relationship-cakes', 'milestone-year-cakes', 'flowers', 'sweets-dry-fruits', 'small-treats-desserts'];
      
      if (specialCategories.includes(categorySlug)) {
        // For these categories, use the main category endpoint which returns subcategories
        const response = await fetch(`${API_BASE_URL}/categories/${categorySlug}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
      } else {
        // For other categories, use the subcategories endpoint
        const response = await fetch(`${API_BASE_URL}/categories/${categorySlug}/subcategories`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const categoryApi = new CategoryApi();
export default categoryApi;
