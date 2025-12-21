const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class AddOnAPI {
  // Get all add-on categories
  async getAddOnCategories() {
    try {
      const response = await fetch(`${API_BASE_URL}/add-on-categories`, {
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
      return data.success ? data.data.categories : [];
    } catch (error) {
      console.error('Error fetching add-on categories:', error);
      return [];
    }
  }

  // Get all add-on products (optionally filtered by category)
  async getAddOnProducts(categoryId = null) {
    try {
      const url = categoryId 
        ? `${API_BASE_URL}/add-on-products/category/${categoryId}`
        : `${API_BASE_URL}/add-on-products`;
        
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
      return data.success ? data.data.products : [];
    } catch (error) {
      console.error('Error fetching add-on products:', error);
      return [];
    }
  }

  // Get add-on product by ID
  async getAddOnProductById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/add-on-products/${id}`, {
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
      return data.success ? data.data.product : null;
    } catch (error) {
      console.error('Error fetching add-on product:', error);
      return null;
    }
  }

  // Add product to combo (requires authentication)
  async addToCombo(cartItemId, addOnProductId, quantity = 1) {
    try {
      const token = localStorage.getItem('customer_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/combos/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          cartItemId: cartItemId,
          addOnProductId: addOnProductId,
          quantity: quantity
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data.selections : [];
    } catch (error) {
      console.error('Error adding to combo:', error);
      throw error;
    }
  }

  // Get combo selections for a cart item
  async getComboSelections(cartItemId) {
    try {
      const token = localStorage.getItem('customer_token');
      if (!token) {
        return [];
      }

      const response = await fetch(`${API_BASE_URL}/combos/cart-item/${cartItemId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data.selections : [];
    } catch (error) {
      console.error('Error fetching combo selections:', error);
      return [];
    }
  }

  // Get combo summary with total price
  async getComboSummary(cartItemId) {
    try {
      const token = localStorage.getItem('customer_token');
      if (!token) {
        return { selections: [], totalPrice: 0, itemCount: 0 };
      }

      const response = await fetch(`${API_BASE_URL}/combos/cart-item/${cartItemId}/summary`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { selections: [], totalPrice: 0, itemCount: 0 };
        }
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : { selections: [], totalPrice: 0, itemCount: 0 };
    } catch (error) {
      console.error('Error fetching combo summary:', error);
      return { selections: [], totalPrice: 0, itemCount: 0 };
    }
  }

  // Update combo selection quantity
  async updateComboQuantity(selectionId, quantity) {
    try {
      const token = localStorage.getItem('customer_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/combos/${selectionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error updating combo quantity:', error);
      throw error;
    }
  }

  // Remove product from combo
  async removeFromCombo(selectionId) {
    try {
      const token = localStorage.getItem('customer_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/combos/${selectionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error removing from combo:', error);
      throw error;
    }
  }

  // Clear all combo selections
  async clearComboSelections(cartItemId) {
    try {
      const token = localStorage.getItem('customer_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/combos/cart-item/${cartItemId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error clearing combo selections:', error);
      throw error;
    }
  }
}

const addOnApi = new AddOnAPI();
export default addOnApi;
