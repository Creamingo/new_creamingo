import { User } from '../types';
import apiClient from './api';

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
  // Get all users
  async getUsers(): Promise<UsersResponse> {
    try {
      const response = await apiClient.get<User[]>('/users');
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch users');
      }
      return response as UsersResponse;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // Get single user by ID
  async getUserById(id: string): Promise<UserResponse> {
    try {
      const response = await apiClient.get<User>(`/users/${id}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch user');
      }
      return response as UserResponse;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  // Create new user
  async createUser(userData: CreateUserData): Promise<UserResponse> {
    try {
      const response = await apiClient.post<User>('/users', userData);
      if (!response.success) {
        throw new Error(response.message || 'Failed to create user');
      }
      return response as UserResponse;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Update user
  async updateUser(id: string, userData: UpdateUserData): Promise<UserResponse> {
    try {
      const response = await apiClient.put<User>(`/users/${id}`, userData);
      if (!response.success) {
        throw new Error(response.message || 'Failed to update user');
      }
      return response as UserResponse;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Delete user
  async deleteUser(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiClient.delete(`/users/${id}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete user');
      }
      return response as { success: boolean; message?: string };
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Toggle user active status
  async toggleUserStatus(id: string, isActive: boolean): Promise<UserResponse> {
    try {
      const response = await apiClient.patch<User>(`/users/${id}/status`, { is_active: isActive });
      if (!response.success) {
        throw new Error(response.message || 'Failed to update user status');
      }
      return response as UserResponse;
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }

  // Change user password
  async changePassword(id: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiClient.patch(`/users/${id}/password`, { password: newPassword });
      if (!response.success) {
        throw new Error(response.message || 'Failed to change password');
      }
      return response as { success: boolean; message?: string };
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  // Update user order
  async updateUserOrder(userOrders: UserOrderUpdate[]): Promise<{ updatedCount: number }> {
    try {
      const response = await apiClient.patch<{ updatedCount: number }>('/users/update-order', { userOrders });
      if (!response.success) {
        throw new Error(response.message || 'Failed to update user order');
      }
      return response.data || { updatedCount: 0 };
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
      const response = await apiClient.get<{
        total: number;
        active: number;
        inactive: number;
        superAdmins: number;
        staff: number;
      }>('/users/stats');
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch user statistics');
      }
      return response as {
        success: boolean;
        data: {
          total: number;
          active: number;
          inactive: number;
          superAdmins: number;
          staff: number;
        };
      };
    } catch (error) {
      console.error('Error fetching user statistics:', error);
      throw error;
    }
  }
}

export const userService = new UserService();
