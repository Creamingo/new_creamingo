/**
 * Product Service
 * Handles all product-related API calls
 */

import apiClient from './api';
import { Product, ProductVariant } from '../types';

export interface ProductFilters {
  page?: number;
  limit?: number;
  category_id?: number;
  subcategory_id?: number;
  is_active?: boolean;
  is_featured?: boolean;
  search?: string;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export interface CreateProductData {
  name: string;
  description: string;
  short_description?: string;
  category_id?: number; // Legacy field for backward compatibility
  subcategory_id?: number; // Legacy field for backward compatibility
  // New multi-category fields
  category_ids?: number[];
  subcategory_ids?: number[];
  primary_category_id?: number;
  primary_subcategory_id?: number;
  available_flavor_ids?: number[];
  primary_flavor_id?: number;
  base_price: number;
  base_weight: string;
  discount_percent?: number;
  image_url?: string;
  is_active?: boolean;
  is_featured?: boolean;
  is_top_product?: boolean;
  is_bestseller?: boolean;
  allergens?: string[];
  ingredients?: string[];
  preparation_time?: number;
  serving_size?: string;
  variations?: Array<{weight: string, price: number, discount_percent: number}>;
  gallery_images?: string[];
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  short_description?: string;
  category_id?: number; // Legacy field for backward compatibility
  subcategory_id?: number; // Legacy field for backward compatibility
  // New multi-category fields
  category_ids?: number[];
  subcategory_ids?: number[];
  primary_category_id?: number;
  primary_subcategory_id?: number;
  available_flavor_ids?: number[];
  primary_flavor_id?: number;
  base_price?: number;
  base_weight?: string;
  discount_percent?: number;
  image_url?: string;
  is_active?: boolean;
  is_featured?: boolean;
  is_top_product?: boolean;
  is_bestseller?: boolean;
  allergens?: string[];
  ingredients?: string[];
  preparation_time?: number;
  serving_size?: string;
  variations?: Array<{weight: string, price: number, discount_percent: number}>;
  gallery_images?: string[];
}

export interface CreateVariantData {
  name: string;
  weight: string;
  price: number;
  discount_percent?: number;
  stock_quantity?: number;
  is_available?: boolean;
}

export interface UpdateVariantData {
  name?: string;
  weight?: string;
  price?: number;
  discount_percent?: number;
  stock_quantity?: number;
  is_available?: boolean;
}

export interface ProductsResponse {
  products: Product[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export interface ProductResponse {
  product: Product;
}

export interface VariantsResponse {
  variants: ProductVariant[];
}

export interface VariantResponse {
  variant: ProductVariant;
}

class ProductService {
  /**
   * Get all products with filters and pagination
   */
  async getProducts(filters: ProductFilters = {}): Promise<ProductsResponse> {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const endpoint = `/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<ProductsResponse>(endpoint, false);
    return response.data!;
  }

  /**
   * Get single product by ID
   */
  async getProduct(id: string | number): Promise<ProductResponse> {
    const response = await apiClient.get<ProductResponse>(`/products/${id}`, false);
    return response.data!;
  }

  /**
   * Create new product
   */
  async createProduct(productData: CreateProductData): Promise<ProductResponse> {
    const response = await apiClient.post<ProductResponse>('/products', productData);
    return response.data!;
  }

  /**
   * Update product
   */
  async updateProduct(id: string | number, productData: UpdateProductData): Promise<ProductResponse> {
    const response = await apiClient.put<ProductResponse>(`/products/${id}`, productData);
    return response.data!;
  }

  /**
   * Delete product
   */
  async deleteProduct(id: string | number): Promise<void> {
    await apiClient.delete(`/products/${id}`);
  }

  /**
   * Toggle top product status
   */
  async toggleTopProduct(id: string | number): Promise<ProductResponse> {
    const response = await apiClient.put<ProductResponse>(`/products/${id}/toggle-top`);
    return response.data!;
  }

  /**
   * Toggle bestseller status
   */
  async toggleBestseller(id: string | number): Promise<ProductResponse> {
    const response = await apiClient.put<ProductResponse>(`/products/${id}/toggle-bestseller`);
    return response.data!;
  }

  /**
   * Toggle featured status
   */
  async toggleFeatured(id: string | number): Promise<ProductResponse> {
    const response = await apiClient.put<ProductResponse>(`/products/${id}/toggle-featured`);
    return response.data!;
  }

  /**
   * Toggle active status
   */
  async toggleActive(id: string | number): Promise<ProductResponse> {
    const response = await apiClient.put<ProductResponse>(`/products/${id}/toggle-active`);
    return response.data!;
  }

  /**
   * Get top products
   */
  async getTopProducts(limit: number = 10): Promise<{ products: Product[]; count: number }> {
    const response = await apiClient.get<{ products: Product[]; count: number }>(`/products/top?limit=${limit}`, false);
    return response.data!;
  }

  /**
   * Get bestsellers
   */
  async getBestsellers(limit: number = 10): Promise<{ products: Product[]; count: number }> {
    const response = await apiClient.get<{ products: Product[]; count: number }>(`/products/bestsellers?limit=${limit}`, false);
    return response.data!;
  }

  /**
   * Get product variants
   */
  async getProductVariants(productId: string | number): Promise<VariantsResponse> {
    const response = await apiClient.get<VariantsResponse>(`/products/${productId}/variants`);
    return response.data!;
  }

  /**
   * Create product variant
   */
  async createProductVariant(productId: string | number, variantData: CreateVariantData): Promise<VariantResponse> {
    const response = await apiClient.post<VariantResponse>(`/products/${productId}/variants`, variantData);
    return response.data!;
  }

  /**
   * Update product variant
   */
  async updateProductVariant(productId: string | number, variantId: string | number, variantData: UpdateVariantData): Promise<VariantResponse> {
    const response = await apiClient.put<VariantResponse>(`/products/${productId}/variants/${variantId}`, variantData);
    return response.data!;
  }

  /**
   * Delete product variant
   */
  async deleteProductVariant(productId: string | number, variantId: string | number): Promise<void> {
    await apiClient.delete(`/products/${productId}/variants/${variantId}`);
  }

  /**
   * Calculate discounted price
   */
  calculateDiscountedPrice(basePrice: number | null | undefined, discountPercent: number | null | undefined): number {
    if (basePrice === null || basePrice === undefined || isNaN(basePrice)) {
      return 0;
    }
    if (discountPercent === null || discountPercent === undefined || isNaN(discountPercent) || discountPercent <= 0) {
      return basePrice;
    }
    return basePrice * (1 - discountPercent / 100);
  }

  /**
   * Format discount display
   */
  formatDiscountDisplay(discountPercent: number | null | undefined): string {
    if (discountPercent === null || discountPercent === undefined || isNaN(discountPercent) || discountPercent <= 0) {
      return '';
    }
    return `${discountPercent}% OFF`;
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number | string | null | undefined, currencySymbol: string = '₹'): string {
    if (amount === null || amount === undefined || amount === '') {
      return `${currencySymbol}0.00`;
    }

    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (Number.isNaN(numAmount)) {
      return `${currencySymbol}0.00`;
    }

    return `${currencySymbol}${numAmount.toFixed(2)}`;
  }

  /**
   * Add product to multiple categories
   */
  async addProductToCategories(id: string | number, categoryIds: number[], primaryCategoryId?: number): Promise<ProductResponse> {
    const response = await apiClient.post<ProductResponse>(`/products/${id}/categories`, {
      category_ids: categoryIds,
      primary_category_id: primaryCategoryId
    });
    return response.data!;
  }

  /**
   * Remove product from a category
   */
  async removeProductFromCategory(id: string | number, categoryId: number): Promise<ProductResponse> {
    const response = await apiClient.delete<ProductResponse>(`/products/${id}/categories/${categoryId}`);
    return response.data!;
  }

  /**
   * Set primary category for a product
   */
  async setPrimaryCategory(id: string | number, categoryId: number): Promise<ProductResponse> {
    const response = await apiClient.put<ProductResponse>(`/products/${id}/categories/primary`, {
      category_id: categoryId
    });
    return response.data!;
  }

  /**
   * Add product to multiple subcategories
   */
  async addProductToSubcategories(id: string | number, subcategoryIds: number[], primarySubcategoryId?: number): Promise<ProductResponse> {
    const response = await apiClient.post<ProductResponse>(`/products/${id}/subcategories`, {
      subcategory_ids: subcategoryIds,
      primary_subcategory_id: primarySubcategoryId
    });
    return response.data!;
  }

  /**
   * Remove product from a subcategory
   */
  async removeProductFromSubcategory(id: string | number, subcategoryId: number): Promise<ProductResponse> {
    const response = await apiClient.delete<ProductResponse>(`/products/${id}/subcategories/${subcategoryId}`);
    return response.data!;
  }

  /**
   * Set primary subcategory for a product
   */
  async setPrimarySubcategory(id: string | number, subcategoryId: number): Promise<ProductResponse> {
    const response = await apiClient.put<ProductResponse>(`/products/${id}/subcategories/primary`, {
      subcategory_id: subcategoryId
    });
    return response.data!;
  }
}

// Create singleton instance
const productService = new ProductService();

export default productService;
