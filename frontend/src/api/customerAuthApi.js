const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Token storage keys
const TOKEN_KEY = 'customer_token';
const CUSTOMER_DATA_KEY = 'customer_data';

const customerAuthApi = {
  /**
   * Register a new customer
   * @param {Object} customerData - Registration data (name, email, password, phone, address)
   */
  async register(customerData) {
    try {
      const response = await fetch(`${API_BASE_URL}/customer-auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(customerData)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Store token and customer data
      if (data.data && data.data.token) {
        this.setToken(data.data.token);
        this.setCustomerData(data.data.customer);
      }

      return data.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  /**
   * Login customer
   * @param {Object} credentials - Login credentials (email, password)
   */
  async login(credentials) {
    try {
      const response = await fetch(`${API_BASE_URL}/customer-auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store token and customer data
      if (data.data && data.data.token) {
        this.setToken(data.data.token);
        this.setCustomerData(data.data.customer);
        
        if (credentials.rememberMe) {
          localStorage.setItem('remember_me', 'true');
        }
      }

      return data.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  /**
   * Get current customer (requires authentication)
   */
  async getCurrentCustomer() {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No token found');
      }

      const response = await fetch(`${API_BASE_URL}/customer-auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        // Token might be invalid, clear it
        if (response.status === 401) {
          this.clearToken();
          this.clearCustomerData();
        }
        // Create error with message from API
        const error = new Error(data.message || 'Failed to get customer');
        // Mark token expiration errors for silent handling
        if (data.message === 'Token expired.') {
          error.isTokenExpired = true;
        }
        throw error;
      }

      // Update stored customer data
      if (data.data) {
        this.setCustomerData(data.data);
      }

      return data.data;
    } catch (error) {
      // Only log non-token-expiration errors
      if (!error.isTokenExpired) {
        console.error('Get current customer error:', error);
      }
      throw error;
    }
  },

  /**
   * Update customer profile
   * @param {Object} profileData - Profile data to update
   */
  async updateProfile(profileData) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No token found');
      }

      const response = await fetch(`${API_BASE_URL}/customer-auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      // Update stored customer data
      if (data.data) {
        this.setCustomerData(data.data);
      }

      return data.data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },

  /**
   * Change password
   * @param {Object} passwordData - Password change data (currentPassword, newPassword)
   */
  async changePassword(passwordData) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No token found');
      }

      const response = await fetch(`${API_BASE_URL}/customer-auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(passwordData)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password');
      }

      return data;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  },

  /**
   * Logout customer
   */
  async logout() {
    try {
      const token = this.getToken();
      if (token) {
        // Call logout endpoint (optional, but good practice)
        try {
          await fetch(`${API_BASE_URL}/customer-auth/logout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
        } catch (error) {
          // Ignore errors on logout endpoint
          console.warn('Logout endpoint error:', error);
        }
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local storage
      this.clearToken();
      this.clearCustomerData();
      localStorage.removeItem('remember_me');
    }
  },

  // Token management methods
  setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  getToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  // Customer data management methods
  setCustomerData(customer) {
    localStorage.setItem(CUSTOMER_DATA_KEY, JSON.stringify(customer));
  },

  getCustomerData() {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(CUSTOMER_DATA_KEY);
    return data ? JSON.parse(data) : null;
  },

  clearCustomerData() {
    localStorage.removeItem(CUSTOMER_DATA_KEY);
  },

  // Check if customer is authenticated
  isAuthenticated() {
    return !!this.getToken();
  }
};

export default customerAuthApi;

