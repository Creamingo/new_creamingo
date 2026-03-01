/**
 * Authentication Service
 * Handles authentication-related API calls
 */

import apiClient from './api';

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'staff' | 'bakery_production' | 'delivery_boy';
  avatar?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refresh_token?: string;
}

export interface AuthService {
  login: (credentials: LoginCredentials) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<User>;
  updateProfile: (data: Partial<User>) => Promise<User>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

class AuthServiceImpl implements AuthService {
  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<{ user: User; token: string; refresh_token?: string }>('/auth/login', credentials, false);
      
      if (response.success && response.data) {
        // Store token and user data
        apiClient.setToken(response.data.token);
        localStorage.setItem('user_data', JSON.stringify(response.data.user));
        if (response.data.refresh_token) {
          localStorage.setItem('refresh_token', response.data.refresh_token);
        }
        
        if (credentials.rememberMe) {
          localStorage.setItem('remember_me', 'true');
        }
        
        return response.data;
      } else {
        // Pass through the exact error message from the backend
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      // Re-throw the error to preserve the original message
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      // Call logout endpoint
      const refreshToken = localStorage.getItem('refresh_token');
      await apiClient.post('/auth/logout', { refreshToken });
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with local cleanup even if API call fails
    } finally {
      // Clear local data
      apiClient.clearToken();
      localStorage.removeItem('user_data');
      localStorage.removeItem('remember_me');
      localStorage.removeItem('refresh_token');
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get<User>('/auth/me');
      
      if (response.success && response.data) {
        // Update stored user data
        localStorage.setItem('user_data', JSON.stringify(response.data));
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get user data');
      }
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      const response = await apiClient.put<User>('/auth/profile', data);
      
      if (response.success && response.data) {
        // Update stored user data
        localStorage.setItem('user_data', JSON.stringify(response.data));
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const response = await apiClient.put('/auth/change-password', {
        currentPassword,
        newPassword
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    return !!(token && userData);
  }

  /**
   * Get stored user data
   */
  getStoredUser(): User | null {
    try {
      const userData = localStorage.getItem('user_data');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing stored user data:', error);
      return null;
    }
  }

  /**
   * Clear authentication token (public method)
   */
  clearToken(): void {
    apiClient.clearToken();
    localStorage.removeItem('user_data');
    localStorage.removeItem('remember_me');
    localStorage.removeItem('refresh_token');
  }
}

// Create singleton instance
const authService = new AuthServiceImpl();

export default authService;
