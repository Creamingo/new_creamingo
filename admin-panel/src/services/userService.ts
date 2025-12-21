import { User } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: 'super_admin' | 'admin' | 'staff' | 'bakery_production' | 'delivery_boy';
  is_active?: boolean;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
  role?: 'super_admin' | 'admin' | 'staff' | 'bakery_production';
  is_active?: boolean;
}

export interface UserOrderUpdate {
  id: string;
  orderIndex: number;
}

export interface UserResponse {
  success: boolean;
  data: User;
  message?: string;
}

export interface UsersResponse {
  success: boolean;
  data: User[];
  count: number;
  message?: string;
}

class UserService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Get all users
  async getUsers(): Promise<UsersResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch users');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // Get single user by ID
  async getUserById(id: string): Promise<UserResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch user');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  // Create new user
  async createUser(userData: CreateUserData): Promise<UserResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create user');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Update user
  async updateUser(id: string, userData: UpdateUserData): Promise<UserResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Delete user
  async deleteUser(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete user');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Toggle user active status
  async toggleUserStatus(id: string, isActive: boolean): Promise<UserResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${id}/status`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ is_active: isActive })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }

  // Change user password
  async changePassword(id: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${id}/password`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ password: newPassword })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to change password');
      }

      return await response.json();
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  // Update user order
  async updateUserOrder(userOrders: UserOrderUpdate[]): Promise<{ updatedCount: number }> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/update-order`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ userOrders })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user order');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error updating user order:', error);
      throw error;
    }
  }

  // Get user statistics
  async getUserStats(): Promise<{
    success: boolean;
    data: {
      total: number;
      active: number;
      inactive: number;
      superAdmins: number;
      staff: number;
    };
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch user statistics');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user statistics:', error);
      throw error;
    }
  }
}

export const userService = new UserService();
