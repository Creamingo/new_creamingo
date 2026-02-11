import apiClient from './api';

export interface Deal {
  id: number;
  deal_title: string;
  product_id: number;
  variant_id?: number | null;
  threshold_amount: number;
  deal_price: number;
  max_quantity_per_order: number;
  priority: number;
  is_active: boolean;
  description?: string | null;
  created_at: string;
  updated_at: string;
  product?: {
    id: number;
    name: string;
    image_url: string;
    base_price: number;
    base_weight?: string;
    variant_weight?: string | null;
    is_active: boolean;
  } | null;
}

export interface CreateDealData {
  deal_title: string;
  product_id: number;
  variant_id?: number | null;
  threshold_amount: number;
  deal_price?: number;
  max_quantity_per_order?: number;
  priority?: number;
  is_active?: boolean;
  description?: string;
}

export interface UpdateDealData {
  deal_title?: string;
  product_id?: number;
  variant_id?: number | null;
  threshold_amount?: number;
  deal_price?: number;
  max_quantity_per_order?: number;
  priority?: number;
  is_active?: boolean;
  description?: string;
}

export interface DealPriority {
  id: number;
  priority: number;
}

class DealService {
  /**
   * Get all deals (admin)
   */
  async getDeals(): Promise<{ success: boolean; data: Deal[] }> {
    const response = await apiClient.get<Deal[]>('/deals');
    return {
      success: response.success,
      data: response.data || []
    };
  }

  /**
   * Get a single deal by ID
   */
  async getDeal(id: number): Promise<{ success: boolean; data: Deal }> {
    const response = await apiClient.get<Deal>(`/deals/${id}`);
    if (!response.data) {
      throw new Error('Deal not found');
    }
    return {
      success: response.success,
      data: response.data
    };
  }

  /**
   * Create a new deal
   */
  async createDeal(data: CreateDealData): Promise<{ success: boolean; data: Deal; message?: string }> {
    const response = await apiClient.post<Deal>('/deals', data);
    if (!response.data) {
      throw new Error(response.message || 'Failed to create deal');
    }
    return {
      success: response.success,
      data: response.data,
      message: response.message
    };
  }

  /**
   * Update a deal
   */
  async updateDeal(id: number, data: UpdateDealData): Promise<{ success: boolean; data: Deal; message?: string }> {
    const response = await apiClient.put<Deal>(`/deals/${id}`, data);
    if (!response.data) {
      throw new Error(response.message || 'Failed to update deal');
    }
    return {
      success: response.success,
      data: response.data,
      message: response.message
    };
  }

  /**
   * Delete a deal
   */
  async deleteDeal(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/deals/${id}`);
    return {
      success: response.success,
      message: response.message || 'Deal deleted successfully'
    };
  }

  /**
   * Toggle deal active status
   */
  async toggleDealStatus(id: number): Promise<{ success: boolean; message: string; data?: { id: number; is_active: boolean } }> {
    const response = await apiClient.patch<{ id: number; is_active: boolean }>(`/deals/${id}/toggle`);
    return {
      success: response.success,
      message: response.message || 'Status updated successfully',
      data: response.data
    };
  }

  /**
   * Update deal priorities (for reordering)
   */
  async updateDealPriorities(priorities: DealPriority[]): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put('/deals/priorities/update', { priorities });
    return {
      success: response.success,
      message: response.message || 'Priorities updated successfully'
    };
  }

  /**
   * Get deal analytics
   */
  async getDealAnalytics(params?: {
    deal_id?: number;
    date_from?: string;
    date_to?: string;
    event_type?: string;
  }): Promise<{ success: boolean; data: any[] }> {
    const queryParams = new URLSearchParams();
    if (params?.deal_id) queryParams.append('deal_id', params.deal_id.toString());
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    if (params?.event_type) queryParams.append('event_type', params.event_type);

    const response = await apiClient.get<any[]>(`/deals/analytics?${queryParams.toString()}`);
    return {
      success: response.success,
      data: response.data || []
    };
  }

  /**
   * Get deal performance summary
   */
  async getDealPerformance(dealId: number): Promise<{ success: boolean; data: any }> {
    const response = await apiClient.get<any>(`/deals/performance/${dealId}`);
    return {
      success: response.success,
      data: response.data
    };
  }

  /**
   * Get all deals performance summary
   */
  async getAllDealsPerformance(params?: {
    date_from?: string;
    date_to?: string;
  }): Promise<{ success: boolean; data: any[] }> {
    const queryParams = new URLSearchParams();
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);

    const response = await apiClient.get<any[]>(`/deals/performance?${queryParams.toString()}`);
    return {
      success: response.success,
      data: response.data || []
    };
  }

  /**
   * Get deal analytics time series
   */
  async getDealAnalyticsTimeSeries(params?: {
    deal_id?: number;
    date_from?: string;
    date_to?: string;
  }): Promise<{ success: boolean; data: Array<{ date: string; views: number; clicks: number; adds: number; redemptions: number; revenue: number; orders: number }> }> {
    const queryParams = new URLSearchParams();
    if (params?.deal_id) queryParams.append('deal_id', params.deal_id.toString());
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);

    const response = await apiClient.get<any[]>(`/deals/analytics/timeseries?${queryParams.toString()}`);
    return {
      success: response.success,
      data: response.data || []
    };
  }

  /**
   * Track deal event (public endpoint)
   */
  async trackDealEvent(data: {
    deal_id: number;
    event_type: 'view' | 'click' | 'add_to_cart' | 'purchase';
    customer_id?: number;
    cart_value?: number;
  }): Promise<{ success: boolean }> {
    const response = await apiClient.post('/deals/track', data);
    return {
      success: response.success
    };
  }

  /**
   * Backfill historical orders into deal analytics
   */
  async backfillHistoricalOrders(params: {
    date_from?: string;
    date_to?: string;
    dry_run?: boolean;
  }): Promise<{
    success: boolean;
    message: string;
    data: {
      processed: number;
      dealsFound: number;
      eventsCreated: number;
      dealsProcessed?: Array<{
        deal_id: number;
        redemptions: number;
        revenue: number;
      }>;
    };
  }> {
    const response = await apiClient.post('/deals/backfill', params);
    return {
      success: response.success,
      message: response.message || '',
      data: response.data || {
        processed: 0,
        dealsFound: 0,
        eventsCreated: 0
      }
    };
  }
}

const dealService = new DealService();
export default dealService;

