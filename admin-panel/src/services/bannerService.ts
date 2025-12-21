import apiClient from './api';

export interface Banner {
  id: number;
  title: string;
  subtitle: string;
  button_text: string;
  button_url: string;
  image_url: string;
  is_active: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface CreateBannerData {
  title: string;
  subtitle?: string;
  button_text?: string;
  button_url?: string;
  image_url: string;
  is_active?: boolean;
  order_index?: number;
}

export interface UpdateBannerData {
  title?: string;
  subtitle?: string;
  button_text?: string;
  button_url?: string;
  image_url?: string;
  is_active?: boolean;
  order_index?: number;
}

export interface BannerResponse {
  success: boolean;
  message?: string;
  data?: {
    banner: Banner;
  };
}

export interface BannersResponse {
  success: boolean;
  data?: {
    banners: Banner[];
  };
}

export interface BannerAnalyticsTrend {
  date: string;
  views: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr: string;
}

export interface BannerAnalytics {
  banner_id: number;
  views: number;
  clicks: number;
  ctr: number;
  conversions?: number;
  revenue?: number;
  lastViewed?: string | null;
  period?: number;
  trends?: BannerAnalyticsTrend[];
}

export interface BannerAnalyticsResponse {
  success: boolean;
  data?: BannerAnalytics;
  message?: string;
}

class BannerService {
  // Get all banners
  async getBanners(isActive?: boolean): Promise<BannersResponse> {
    const params = new URLSearchParams();
    if (isActive !== undefined) {
      params.append('is_active', isActive.toString());
    }
    
    const queryString = params.toString();
    const endpoint = queryString ? `/banners?${queryString}` : '/banners';
    
    return await apiClient.get(endpoint);
  }

  // Get single banner
  async getBanner(id: number): Promise<BannerResponse> {
    return await apiClient.get(`/banners/${id}`);
  }

  // Create banner
  async createBanner(data: CreateBannerData): Promise<BannerResponse> {
    return await apiClient.post('/banners', data);
  }

  // Update banner
  async updateBanner(id: number, data: UpdateBannerData): Promise<BannerResponse> {
    return await apiClient.put(`/banners/${id}`, data);
  }

  // Delete banner
  async deleteBanner(id: number): Promise<{ success: boolean; message?: string }> {
    return await apiClient.delete(`/banners/${id}`);
  }

  // Toggle banner status
  async toggleBannerStatus(id: number): Promise<BannerResponse> {
    return await apiClient.patch(`/banners/${id}/toggle`);
  }

  // Update banner order (bulk update)
  async updateBannerOrder(banners: Array<{id: number, order_index: number}>): Promise<{ success: boolean; message?: string }> {
    return await apiClient.put('/banners/order/update', { banners });
  }

  // Get banner analytics
  async getBannerAnalytics(id: number, period: number = 30): Promise<BannerAnalyticsResponse> {
    return await apiClient.get(`/banners/${id}/analytics?period=${period}`);
  }

  // Track banner view (optional - for frontend tracking)
  async trackBannerView(id: number, customerId?: number): Promise<{ success: boolean; message?: string }> {
    return await apiClient.post(`/banners/${id}/track/view`, { customer_id: customerId });
  }

  // Track banner click (optional - for frontend tracking)
  async trackBannerClick(id: number, customerId?: number): Promise<{ success: boolean; message?: string }> {
    return await apiClient.post(`/banners/${id}/track/click`, { customer_id: customerId });
  }

  // Track banner conversion
  async trackBannerConversion(id: number, customerId: number, revenue: number): Promise<{ success: boolean; message?: string }> {
    return await apiClient.post(`/banners/${id}/track/conversion`, { customer_id: customerId, revenue });
  }
}

const bannerService = new BannerService();
export default bannerService;
