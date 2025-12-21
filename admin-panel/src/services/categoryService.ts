/**
 * Category Service
 * Handles all category and subcategory-related API calls
 */

import apiClient from './api';
import { Category, Subcategory } from '../types';

export interface CategoryResponse {
  categories: Category[];
}

export interface SubcategoryResponse {
  subcategories: Subcategory[];
}

export interface SingleCategoryResponse {
  category: Category;
}

export interface SingleSubcategoryResponse {
  subcategory: Subcategory;
}

class CategoryService {
  /**
   * Get all categories
   */
  async getCategories(): Promise<CategoryResponse> {
    const response = await apiClient.get<CategoryResponse>('/categories', false);
    return response.data!;
  }

  /**
   * Get single category by ID
   */
  async getCategory(id: string | number): Promise<SingleCategoryResponse> {
    const response = await apiClient.get<SingleCategoryResponse>(`/categories/${id}`, false);
    return response.data!;
  }

  /**
   * Get all subcategories
   */
  async getSubcategories(categoryId?: string | number): Promise<SubcategoryResponse> {
    const endpoint = categoryId ? `/subcategories?category_id=${categoryId}` : '/subcategories';
    const response = await apiClient.get<SubcategoryResponse>(endpoint, false);
    return response.data!;
  }

  /**
   * Get subcategories for a specific category
   */
  async getSubcategoriesByCategory(categoryId: string | number): Promise<SubcategoryResponse> {
    const response = await apiClient.get<SubcategoryResponse>(`/subcategories?category_id=${categoryId}`, false);
    return response.data!;
  }

  /**
   * Get single subcategory by ID
   */
  async getSubcategory(id: string | number): Promise<SingleSubcategoryResponse> {
    const response = await apiClient.get<SingleSubcategoryResponse>(`/subcategories/${id}`, false);
    return response.data!;
  }

  /**
   * Create a new category
   */
  async createCategory(categoryData: Partial<Category>): Promise<SingleCategoryResponse> {
    const response = await apiClient.post<SingleCategoryResponse>('/categories', categoryData);
    return response.data!;
  }

  /**
   * Update an existing category
   */
  async updateCategory(id: string | number, categoryData: Partial<Category>): Promise<SingleCategoryResponse> {
    const response = await apiClient.put<SingleCategoryResponse>(`/categories/${id}`, categoryData);
    return response.data!;
  }

  /**
   * Delete a category
   */
  async deleteCategory(id: string | number): Promise<void> {
    await apiClient.delete(`/categories/${id}`);
  }

  /**
   * Create a new subcategory
   */
  async createSubcategory(subcategoryData: Partial<Subcategory>): Promise<SingleSubcategoryResponse> {
    const response = await apiClient.post<SingleSubcategoryResponse>('/subcategories', subcategoryData);
    return response.data!;
  }

  /**
   * Update an existing subcategory
   */
  async updateSubcategory(id: string | number, subcategoryData: Partial<Subcategory>): Promise<SingleSubcategoryResponse> {
    const response = await apiClient.put<SingleSubcategoryResponse>(`/subcategories/${id}`, subcategoryData);
    return response.data!;
  }

  /**
   * Delete a subcategory
   */
  async deleteSubcategory(id: string | number): Promise<void> {
    await apiClient.delete(`/subcategories/${id}`);
  }

  /**
   * Update category order (bulk update)
   */
  async updateCategoryOrder(categories: Array<{id: string | number, order_index: number}>): Promise<void> {
    await apiClient.put('/categories/order/update', { categories });
  }

  /**
   * Update subcategory order (bulk update)
   */
  async updateSubcategoryOrder(subcategories: Array<{id: string | number, order_index: number}>): Promise<void> {
    await apiClient.put('/subcategories/order/update', { subcategories });
  }
}

// Create singleton instance
const categoryService = new CategoryService();

export default categoryService;
