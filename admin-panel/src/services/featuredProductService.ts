/**
 * Featured Products Service
 * Handles featured products API calls
 */

import apiClient from './api';

export interface FeaturedProduct {
  id: number;
  product_id: number;
  section: 'top_products' | 'bestsellers';
  display_order: number;
  is_active: boolean;
  is_featured: boolean;
  is_top_product: boolean;
  is_bestseller: boolean;
  created_at: string;
  updated_at: string;
  product_name: string;
  product_image: string;
  product_description: string;
  product_price: number;
  product_weight?: string;
  product_discount_percent?: number;
  product_discounted_price?: number;
  product_is_active: boolean;
  product_is_featured: boolean;
  product_is_top_product: boolean;
  product_is_bestseller: boolean;
  product_slug: string;
  category_id?: number;
  subcategory_id?: number;
  category_name?: string;
  subcategory_name?: string;
  variants?: Array<{
    id: number;
    name: string;
    weight: string;
    price: number;
    discount_percent?: number;
    discounted_price?: number;
    stock_quantity: number;
    is_available: boolean;
  }>;
  gallery_images?: string[];
  product?: {
    id: number;
    name: string;
    description: string;
    image_url: string;
    base_price: number;
    is_active: boolean;
    slug: string;
  };
}

export interface AvailableProduct {
  id: number;
  name: string;
  description: string;
  image_url: string;
  base_price: number;
  is_active: boolean;
  slug: string;
}

export interface CreateFeaturedProductData {
  product_id: number;
  section: 'top_products' | 'bestsellers';
  display_order: number;
  is_active?: boolean;
}

export interface UpdateFeaturedProductData {
  display_order?: number;
  is_active?: boolean;
}

export interface SectionStats {
  top_products: { total: number; active: number };
  bestsellers: { total: number; active: number };
}

export interface FeaturedProductService {
  getFeaturedProducts: (section?: string) => Promise<FeaturedProduct[]>;
  getFeaturedProduct: (id: number) => Promise<FeaturedProduct>;
  createFeaturedProduct: (data: CreateFeaturedProductData) => Promise<FeaturedProduct>;
  updateFeaturedProduct: (id: number, data: UpdateFeaturedProductData) => Promise<FeaturedProduct>;
  deleteFeaturedProduct: (id: number) => Promise<void>;
  getAvailableProducts: (section?: string) => Promise<AvailableProduct[]>;
  getSectionStats: () => Promise<SectionStats>;
  updateFeaturedProductOrder: (products: Array<{id: number, display_order: number}>) => Promise<{ success: boolean; message?: string }>;
  toggleFeaturedStatus: (id: number) => Promise<{ success: boolean; message?: string; featured_product?: any }>;
  toggleTopProductStatus: (id: number) => Promise<{ success: boolean; message?: string; featured_product?: any }>;
  toggleBestsellerStatus: (id: number) => Promise<{ success: boolean; message?: string; featured_product?: any }>;
  toggleActiveStatus: (id: number) => Promise<{ success: boolean; message?: string; featured_product?: any }>;
}

class FeaturedProductServiceImpl implements FeaturedProductService {
  /**
   * Get all featured products for a specific section
   */
  async getFeaturedProducts(section?: string): Promise<FeaturedProduct[]> {
    try {
      const url = section ? `/featured-products?section=${section}` : '/featured-products';
      const response = await apiClient.get<any[]>(url);
      
      if (response.success && response.data) {
        // Transform API data to match component interface
        return response.data.map(item => ({
          id: item.id,
          product_id: item.product_id,
          section: item.section,
          display_order: item.display_order,
          is_active: item.is_active,
          is_featured: item.is_featured || false,
          is_top_product: item.is_top_product || false,
          is_bestseller: item.is_bestseller || false,
          created_at: item.created_at,
          updated_at: item.updated_at,
          product_name: item.product_name || 'Unknown Product',
          product_image: item.product_image || '',
          product_description: item.product_description || '',
          product_price: item.product_price || 0,
          product_weight: item.product_weight,
          product_discount_percent: item.product_discount_percent,
          product_discounted_price: item.product_discounted_price,
          product_is_active: item.product_is_active || false,
          product_is_featured: item.product_is_featured || false,
          product_is_top_product: item.product_is_top_product || false,
          product_is_bestseller: item.product_is_bestseller || false,
          product_slug: item.product_slug || item.product_name?.toLowerCase().replace(/\s+/g, '-') || 'unknown',
          category_id: item.category_id,
          subcategory_id: item.subcategory_id,
          category_name: item.category_name,
          subcategory_name: item.subcategory_name,
          variants: item.variants || [],
          gallery_images: item.gallery_images || [],
          product: item.product
        }));
      } else {
        throw new Error(response.message || 'Failed to fetch featured products');
      }
    } catch (error) {
      console.error('Get featured products error:', error);
      throw error;
    }
  }

  /**
   * Get featured product by ID
   */
  async getFeaturedProduct(id: number): Promise<FeaturedProduct> {
    try {
      const response = await apiClient.get<FeaturedProduct>(`/featured-products/${id}`);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch featured product');
      }
    } catch (error) {
      console.error('Get featured product error:', error);
      throw error;
    }
  }

  /**
   * Create new featured product
   */
  async createFeaturedProduct(data: CreateFeaturedProductData): Promise<FeaturedProduct> {
    try {
      const response = await apiClient.post<FeaturedProduct>('/featured-products', data);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create featured product');
      }
    } catch (error) {
      console.error('Create featured product error:', error);
      throw error;
    }
  }

  /**
   * Update featured product
   */
  async updateFeaturedProduct(id: number, data: UpdateFeaturedProductData): Promise<FeaturedProduct> {
    try {
      const response = await apiClient.put<FeaturedProduct>(`/featured-products/${id}`, data);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update featured product');
      }
    } catch (error) {
      console.error('Update featured product error:', error);
      throw error;
    }
  }

  /**
   * Delete featured product
   */
  async deleteFeaturedProduct(id: number): Promise<void> {
    try {
      const response = await apiClient.delete(`/featured-products/${id}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete featured product');
      }
    } catch (error) {
      console.error('Delete featured product error:', error);
      throw error;
    }
  }

  /**
   * Get available products for featuring
   */
  async getAvailableProducts(section?: string): Promise<AvailableProduct[]> {
    try {
      const url = section ? `/featured-products/available?section=${section}` : '/featured-products/available';
      const response = await apiClient.get<any[]>(url);
      
      if (response.success && response.data) {
        // Transform API data to match component interface
        return response.data.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          image_url: item.image_url,
          base_price: item.base_price,
          is_active: item.is_active,
          slug: item.slug || item.name?.toLowerCase().replace(/\s+/g, '-') || 'unknown'
        }));
      } else {
        throw new Error(response.message || 'Failed to fetch available products');
      }
    } catch (error) {
      console.error('Get available products error:', error);
      throw error;
    }
  }

  /**
   * Get section statistics
   */
  async getSectionStats(): Promise<SectionStats> {
    try {
      const response = await apiClient.get<SectionStats>('/featured-products/stats');
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch section statistics');
      }
    } catch (error) {
      console.error('Get section stats error:', error);
      throw error;
    }
  }

  /**
   * Update featured product order for drag-and-drop reordering
   */
  async updateFeaturedProductOrder(products: Array<{id: number, display_order: number}>): Promise<{ success: boolean; message?: string }> {
    return await apiClient.put('/featured-products/order/update', { products });
  }

  /**
   * Toggle featured status
   */
  async toggleFeaturedStatus(id: number): Promise<{ success: boolean; message?: string; featured_product?: any }> {
    return await apiClient.put(`/featured-products/${id}/toggle-featured`);
  }

  /**
   * Toggle top product status
   */
  async toggleTopProductStatus(id: number): Promise<{ success: boolean; message?: string; featured_product?: any }> {
    return await apiClient.put(`/featured-products/${id}/toggle-top-product`);
  }

  /**
   * Toggle bestseller status
   */
  async toggleBestsellerStatus(id: number): Promise<{ success: boolean; message?: string; featured_product?: any }> {
    return await apiClient.put(`/featured-products/${id}/toggle-bestseller`);
  }

  /**
   * Toggle active status
   */
  async toggleActiveStatus(id: number): Promise<{ success: boolean; message?: string; featured_product?: any }> {
    return await apiClient.put(`/featured-products/${id}/toggle-active`);
  }
}

// Create singleton instance
const featuredProductService = new FeaturedProductServiceImpl();

export default featuredProductService;
