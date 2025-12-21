import apiClient from './api';

export interface PromoCode {
  id: number;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  usage_limit: number | null;
  used_count: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  status: 'active' | 'inactive' | 'expired' | 'deleted';
  created_at: string;
  updated_at: string;
}

export interface CreatePromoCodeData {
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount?: number;
  max_discount_amount?: number | null;
  usage_limit?: number | null;
  valid_from: string;
  valid_until: string;
  is_active?: boolean;
}

export interface UpdatePromoCodeData {
  description?: string;
  discount_type?: 'percentage' | 'fixed';
  discount_value?: number;
  min_order_amount?: number;
  max_discount_amount?: number | null;
  usage_limit?: number | null;
  valid_from?: string;
  valid_until?: string;
  is_active?: boolean;
}

class PromoCodeService {
  /**
   * Get all promo codes
   */
  async getPromoCodes(activeOnly: boolean = false, includeDeleted: boolean = false): Promise<{ success: boolean; data: PromoCode[] }> {
    // For admin panel, we want all codes by default (activeOnly = false)
    const params = new URLSearchParams();
    params.append('active_only', activeOnly ? 'true' : 'false');
    if (includeDeleted) {
      params.append('include_deleted', 'true');
    }
    const response = await apiClient.get<PromoCode[]>(`/promo-codes?${params.toString()}`);
    return {
      success: response.success,
      data: response.data || []
    };
  }

  /**
   * Get a single promo code by ID
   */
  async getPromoCode(id: number): Promise<{ success: boolean; data: PromoCode }> {
    const response = await apiClient.get<PromoCode>(`/promo-codes/${id}`);
    if (!response.data) {
      throw new Error('Promo code not found');
    }
    return {
      success: response.success,
      data: response.data
    };
  }

  /**
   * Create a new promo code
   */
  async createPromoCode(data: CreatePromoCodeData): Promise<{ success: boolean; data: PromoCode }> {
    const response = await apiClient.post<PromoCode>('/promo-codes', data);
    if (!response.data) {
      throw new Error('Failed to create promo code');
    }
    return {
      success: response.success,
      data: response.data
    };
  }

  /**
   * Update a promo code
   */
  async updatePromoCode(id: number, data: UpdatePromoCodeData): Promise<{ success: boolean; data: PromoCode }> {
    const response = await apiClient.put<PromoCode>(`/promo-codes/${id}`, data);
    if (!response.data) {
      throw new Error('Failed to update promo code');
    }
    return {
      success: response.success,
      data: response.data
    };
  }

  /**
   * Validate a promo code
   */
  async validatePromoCode(code: string, orderAmount: number): Promise<{ success: boolean; data: any }> {
    const response = await apiClient.post('/promo-codes/validate', { code, order_amount: orderAmount });
    return {
      success: response.success,
      data: response.data || null
    };
  }

  /**
   * Update promo code status (for soft delete and status management)
   * Status can be: 'active', 'inactive', 'expired', 'deleted'
   */
  async updatePromoCodeStatus(id: number, status: 'active' | 'inactive' | 'expired' | 'deleted'): Promise<{ success: boolean; message: string; data?: { id: number; status: string } }> {
    const response = await apiClient.patch<{ id: number; status: string }>(`/promo-codes/${id}/status`, { status });
    return {
      success: response.success,
      message: response.message || 'Status updated successfully',
      data: response.data
    };
  }

  /**
   * Get analytics overview for all promo codes
   */
  async getAnalyticsOverview(): Promise<{ success: boolean; data: any }> {
    const response = await apiClient.get('/promo-codes/analytics/overview');
    return {
      success: response.success,
      data: response.data || null
    };
  }

  /**
   * Get analytics for a specific promo code
   */
  async getAnalytics(id: number, dateFrom?: string, dateTo?: string): Promise<{ success: boolean; data: any }> {
    const params = new URLSearchParams();
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);
    const queryString = params.toString();
    const response = await apiClient.get(`/promo-codes/${id}/analytics${queryString ? `?${queryString}` : ''}`);
    return {
      success: response.success,
      data: response.data || null
    };
  }

  /**
   * Get time series analytics for promo codes
   */
  async getTimeSeriesAnalytics(promoCodeId?: number, dateFrom?: string, dateTo?: string): Promise<{ success: boolean; data: any[] }> {
    const params = new URLSearchParams();
    if (promoCodeId) params.append('promo_code_id', promoCodeId.toString());
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);
    const queryString = params.toString();
    const response = await apiClient.get(`/promo-codes/analytics/time-series${queryString ? `?${queryString}` : ''}`);
    return {
      success: response.success,
      data: response.data || []
    };
  }

  /**
   * Run analytics migration to create tables
   */
  async runAnalyticsMigration(): Promise<{ success: boolean; message: string; data?: any }> {
    const response = await apiClient.post('/promo-codes/analytics/migrate');
    return {
      success: response.success,
      message: response.message || 'Migration completed',
      data: response.data
    };
  }

  /**
   * Backfill historical analytics data from orders
   */
  async backfillAnalytics(): Promise<{ success: boolean; message: string; data?: any }> {
    const response = await apiClient.post('/promo-codes/analytics/backfill');
    return {
      success: response.success,
      message: response.message || 'Backfill completed',
      data: response.data
    };
  }
}

const promoCodeService = new PromoCodeService();
export default promoCodeService;

