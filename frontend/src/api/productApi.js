const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const CATEGORY_SLUG_ALIASES = {
  'cakes-for-any-occasion': 'cakes-for-occasion'
};

const normalizeCategorySlug = (slug) => (
  CATEGORY_SLUG_ALIASES[slug] || slug
);

class ProductAPI {
  /**
   * Get products by category and subcategory
   * @param {string} categorySlug - Category slug (e.g., 'cakes-for-occasion')
   * @param {string} subCategorySlug - Subcategory slug (e.g., 'birthday')
   * @param {Object} options - Additional options like sorting, pagination
   * @returns {Promise<Object>} Object containing products and pagination info
   */
  async getProductsByCategory(categorySlug, subCategorySlug = null, options = {}) {
    try {
      const normalizedCategorySlug = normalizeCategorySlug(categorySlug);

      let url = `${API_BASE_URL}/products`;
      const params = new URLSearchParams();

      // Resolve filters from URL slugs on the server (DB subcategory ids differ per environment;
      // hardcoded maps were wrong for production Flowers / Sweets / Small Treats, etc.)
      if (normalizedCategorySlug) {
        params.append('category_slug', normalizedCategorySlug);
      }
      if (subCategorySlug) {
        params.append('subcategory_slug', subCategorySlug);
      }
      
      // Add other query parameters
      if (options.sortBy) {
        // Map frontend sort options to backend sort options
        const sortMap = {
          'popularity': 'created_at',
          'price-low': 'base_price',
          'price-high': 'base_price',
          'rating': 'created_at',
          'newest': 'created_at'
        };
        params.append('sort_by', sortMap[options.sortBy] || 'created_at');
        if (options.sortBy === 'price-high') {
          params.append('sort_order', 'DESC');
        } else {
          params.append('sort_order', 'ASC');
        }
      }
      
      if (options.limit) params.append('limit', options.limit);
      if (options.page) params.append('page', options.page);
      if (options.minPrice) params.append('minPrice', options.minPrice);
      if (options.maxPrice) params.append('maxPrice', options.maxPrice);
      
      // Always add is_active=true to get only active products
      params.append('is_active', 'true');
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
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
      console.error('Error fetching products by category:', error);
      throw error;
    }
  }

  /**
   * Get all products with optional filtering
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Object containing products and pagination info
   */
  async getAllProducts(filters = {}) {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null) {
          params.append(key, filters[key]);
        }
      });

      const url = `${API_BASE_URL}/products${params.toString() ? `?${params.toString()}` : ''}`;

      const response = await fetch(url, {
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
      console.error('Error fetching all products:', error);
      throw error;
    }
  }

  /**
   * Get a single product by ID
   * @param {number} productId - Product ID
   * @returns {Promise<Object>} Product object
   */
  async getProductById(productId) {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
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
      console.error('Error fetching product by ID:', error);
      throw error;
    }
  }

  /**
   * Get a single product by slug (SEO-friendly URLs)
   * @param {string} slug - Product slug
   * @returns {Promise<Object>} Product object with full details
   */
  async getProductBySlug(slug) {
    try {
      const response = await fetch(`${API_BASE_URL}/products/slug/${slug}`, {
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
      console.error('Error fetching product by slug:', error);
      throw error;
    }
  }

  /**
   * Get related products for a given product
   * @param {number} productId - Product ID
   * @param {number} limit - Number of related products to fetch
   * @returns {Promise<Object>} Object containing related products
   */
  async getRelatedProducts(productId, limit = 6) {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${productId}/related?limit=${limit}`, {
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
      console.error('Error fetching related products:', error);
      throw error;
    }
  }

  /**
   * Get product reviews with pagination
   * @param {number} productId - Product ID
   * @param {number} page - Page number
   * @param {number} limit - Number of reviews per page
   * @returns {Promise<Object>} Object containing reviews and pagination info
   */
  async getProductReviews(productId, page = 1, limit = 10) {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${productId}/reviews?page=${page}&limit=${limit}`, {
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
      console.error('Error fetching product reviews:', error);
      throw error;
    }
  }

  /**
   * Submit a public product review (pending approval)
   * @param {number} productId
   * @param {Object} payload - { customer_name, customer_email, ratings:{...}, review_title, review_text, image_url }
   */
  async submitProductReview(productId, payload) {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error submitting product review:', error);
      throw error;
    }
  }

  /**
   * Search products by query
   * @param {string} query - Search query
   * @param {Object} options - Additional search options
   * @returns {Promise<Object>} Object containing search results
   */
  async searchProducts(query, options = {}) {
    try {
      const params = new URLSearchParams();
      params.append('q', query);
      
      Object.keys(options).forEach(key => {
        if (options[key] !== undefined && options[key] !== null) {
          params.append(key, options[key]);
        }
      });

      const response = await fetch(`${API_BASE_URL}/products/search?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        let errorData = {};
        try {
          errorData = await response.json();
        } catch (parseError) {
          errorData = { message: `HTTP error! status: ${response.status}` };
        }

        // Fallback to basic search endpoint if advanced search fails
        if (response.status >= 500) {
          const fallbackParams = new URLSearchParams();
          fallbackParams.append('search', query);

          Object.keys(options).forEach(key => {
            if (options[key] !== undefined && options[key] !== null) {
              fallbackParams.append(key, options[key]);
            }
          });

          const fallbackResponse = await fetch(`${API_BASE_URL}/products?${fallbackParams.toString()}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!fallbackResponse.ok) {
            let fallbackErrorData = {};
            try {
              fallbackErrorData = await fallbackResponse.json();
            } catch (fallbackParseError) {
              fallbackErrorData = { message: `HTTP error! status: ${fallbackResponse.status}` };
            }
            throw new Error(fallbackErrorData.message || `HTTP error! status: ${fallbackResponse.status}`);
          }

          return await fallbackResponse.json();
        }

        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }

  /**
   * Get search autocomplete suggestions (products, flavors, categories)
   * @param {string} query - Search query (minimum 2 characters)
   * @returns {Promise<Object>} Object containing products, flavors, and categories
   */
  async getSearchAutocomplete(query) {
    try {
      if (!query || query.trim().length < 2) {
        return {
          success: true,
          data: {
            products: [],
            flavors: [],
            categories: []
          }
        };
      }

      const response = await fetch(`${API_BASE_URL}/products/search/autocomplete?q=${encodeURIComponent(query.trim())}`, {
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
      console.error('Error fetching autocomplete suggestions:', error);
      throw error;
    }
  }

  /**
   * Search products by occasion and flavor combination
   * @param {string} occasion - Occasion name (e.g., 'Birthday', 'Anniversary')
   * @param {string} flavor - Flavor name (e.g., 'Chocolate', 'Red Velvet')
   * @param {Object} options - Additional search options
   * @returns {Promise<Array>} Array of products matching the criteria
   */
  async searchProductsByOccasionAndFlavor(occasion, flavor, options = {}) {
    try {
      const params = new URLSearchParams();
      params.append('occasion', occasion);
      params.append('flavor', flavor);
      
      Object.keys(options).forEach(key => {
        if (options[key] !== undefined && options[key] !== null) {
          params.append(key, options[key]);
        }
      });

      const response = await fetch(`${API_BASE_URL}/products/search-by-occasion-flavor?${params.toString()}`, {
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
      console.error('Error searching products by occasion and flavor:', error);
      throw error;
    }
  }

  /**
   * Add product to wishlist
   * @param {number} productId - Product ID
   * @returns {Promise<Object>} Success response
   */
  async addToWishlist(productId) {
    try {
      const response = await fetch(`${API_BASE_URL}/wishlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      throw error;
    }
  }

  /**
   * Remove product from wishlist
   * @param {number} productId - Product ID
   * @returns {Promise<Object>} Success response
   */
  async removeFromWishlist(productId) {
    try {
      const response = await fetch(`${API_BASE_URL}/wishlist/${productId}`, {
        method: 'DELETE',
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
      console.error('Error removing from wishlist:', error);
      throw error;
    }
  }

  /**
   * Get user's wishlist
   * @returns {Promise<Object>} Object containing wishlist products
   */
  async getWishlist() {
    try {
      const response = await fetch(`${API_BASE_URL}/wishlist`, {
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
      console.error('Error fetching wishlist:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const productApi = new ProductAPI();
export default productApi;