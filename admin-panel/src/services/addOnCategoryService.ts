import apiClient from './api';
import { AddOnCategory, CreateAddOnCategoryData, UpdateAddOnCategoryData } from '../types/addOn';

class AddOnCategoryService {
  async getAllAddOnCategories(): Promise<{ success: boolean; data: { categories: AddOnCategory[] } }> {
    try {
      const response = await apiClient.get<{ categories: AddOnCategory[] }>('/add-on-categories', false);
      return { success: true, data: response.data! };
    } catch (error) {
      console.error('Error fetching add-on categories:', error);
      throw error;
    }
  }

  async getAddOnCategoryById(id: number): Promise<{ success: boolean; data: { category: AddOnCategory } }> {
    try {
      const response = await apiClient.get<{ category: AddOnCategory }>(`/add-on-categories/${id}`, false);
      return { success: true, data: response.data! };
    } catch (error) {
      console.error('Error fetching add-on category:', error);
      throw error;
    }
  }

  async createAddOnCategory(data: CreateAddOnCategoryData): Promise<{ success: boolean; data: { category: AddOnCategory } }> {
    try {
      const response = await apiClient.post<{ category: AddOnCategory }>('/add-on-categories', data);
      return { success: true, data: response.data! };
    } catch (error) {
      console.error('Error creating add-on category:', error);
      throw error;
    }
  }

  async updateAddOnCategory(id: number, data: UpdateAddOnCategoryData): Promise<{ success: boolean; data: { category: AddOnCategory } }> {
    try {
      const response = await apiClient.put<{ category: AddOnCategory }>(`/add-on-categories/${id}`, data);
      return { success: true, data: response.data! };
    } catch (error) {
      console.error('Error updating add-on category:', error);
      throw error;
    }
  }

  async deleteAddOnCategory(id: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.delete(`/add-on-categories/${id}`);
      return { success: true, message: response.message || 'Category deleted successfully' };
    } catch (error) {
      console.error('Error deleting add-on category:', error);
      throw error;
    }
  }
}

const addOnCategoryService = new AddOnCategoryService();
export default addOnCategoryService;
