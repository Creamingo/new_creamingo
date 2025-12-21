import apiClient from './api';
import { AddOnProduct, CreateAddOnProductData, UpdateAddOnProductData } from '../types/addOn';

class AddOnProductService {
  async getAllAddOnProducts(categoryId?: number): Promise<{ success: boolean; data: { products: AddOnProduct[] } }> {
    try {
      const endpoint = categoryId 
        ? `/add-on-products/category/${categoryId}`
        : `/add-on-products`;
        
      const response = await apiClient.get<{ products: AddOnProduct[] }>(endpoint, false);
      return { success: true, data: response.data! };
    } catch (error) {
      console.error('Error fetching add-on products:', error);
      throw error;
    }
  }

  async getAddOnProductById(id: number): Promise<{ success: boolean; data: { product: AddOnProduct } }> {
    try {
      const response = await apiClient.get<{ product: AddOnProduct }>(`/add-on-products/${id}`, false);
      return { success: true, data: response.data! };
    } catch (error) {
      console.error('Error fetching add-on product:', error);
      throw error;
    }
  }

  async createAddOnProduct(data: CreateAddOnProductData): Promise<{ success: boolean; data: { product: AddOnProduct } }> {
    try {
      const response = await apiClient.post<{ product: AddOnProduct }>('/add-on-products', data);
      return { success: true, data: response.data! };
    } catch (error) {
      console.error('Error creating add-on product:', error);
      throw error;
    }
  }

  async updateAddOnProduct(id: number, data: UpdateAddOnProductData): Promise<{ success: boolean; data: { product: AddOnProduct } }> {
    try {
      const response = await apiClient.put<{ product: AddOnProduct }>(`/add-on-products/${id}`, data);
      return { success: true, data: response.data! };
    } catch (error) {
      console.error('Error updating add-on product:', error);
      throw error;
    }
  }

  async deleteAddOnProduct(id: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.delete(`/add-on-products/${id}`);
      return { success: true, message: response.message || 'Product deleted successfully' };
    } catch (error) {
      console.error('Error deleting add-on product:', error);
      throw error;
    }
  }
}

const addOnProductService = new AddOnProductService();
export default addOnProductService;
