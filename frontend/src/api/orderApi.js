const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const orderApi = {
  /**
   * Create a new order
   * @param {Object} orderData - Order data including customer info, items, delivery details
   */
  async createOrder(orderData) {
    try {
      // Use customer_token (the correct key for customer authentication)
      const token = localStorage.getItem('customer_token');
      
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();
      if (!response.ok) {
        // Extract more detailed error information
        const errorMessage = data.message || data.error || 'Failed to create order';
        const errorDetails = data.details || data.errors || null;
        const fullError = errorDetails 
          ? `${errorMessage}: ${JSON.stringify(errorDetails)}`
          : errorMessage;
        throw new Error(fullError);
      }
      return data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  /**
   * Create or get customer
   * @param {Object} customerData - Customer information
   */
  async createCustomer(customerData) {
    try {
      const response = await fetch(`${API_BASE_URL}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(customerData)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create customer');
      }
      return data.data;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  },

  /**
   * Get customer by email or phone
   */
  async getCustomer(email, phone) {
    try {
      const queryParams = new URLSearchParams();
      if (email) queryParams.append('email', email);
      if (phone) queryParams.append('phone', phone);

      const response = await fetch(`${API_BASE_URL}/customers?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get customer');
      }
      return data.data;
    } catch (error) {
      console.error('Error getting customer:', error);
      throw error;
    }
  },

  /**
   * Get customer's orders (requires authentication)
   * @param {Object} params - Optional query parameters
   */
  async getMyOrders(params = {}) {
    try {
      // Use customer_token (the correct key for customer authentication)
      const token = localStorage.getItem('customer_token');
      
      if (!token) {
        throw new Error('Authentication required');
      }

      // Add timestamp to prevent caching
      const queryParams = new URLSearchParams({ ...params, _t: Date.now() });
      const response = await fetch(`${API_BASE_URL}/orders/my-orders?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get orders');
      }
      return data.data || data;
    } catch (error) {
      console.error('Error getting orders:', error);
      throw error;
    }
  },

  /**
   * Get order by order number (requires authentication)
   * @param {String} orderNumber - Order number to fetch
   */
  async getOrderByNumber(orderNumber) {
    try {
      const token = localStorage.getItem('customer_token');
      
      if (!token) {
        throw new Error('Authentication required');
      }

      // Fetch all orders and filter by order number
      const queryParams = new URLSearchParams({ limit: 100, _t: Date.now() });
      const response = await fetch(`${API_BASE_URL}/orders/my-orders?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get orders');
      }
      
      const orders = (data.data?.orders || data.orders || data || []);
      const order = orders.find(o => o.order_number === orderNumber);
      
      if (!order) {
        throw new Error('Order not found');
      }
      
      return order;
    } catch (error) {
      // Only log non-authentication errors
      if (error.message !== 'Authentication required' && !error.message.includes('token') && !error.message.includes('Authentication')) {
        console.error('Error getting order by number:', error);
      }
      throw error;
    }
  }
};

export default orderApi;

