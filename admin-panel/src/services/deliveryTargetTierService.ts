import apiClient from './api';

export interface DeliveryTargetTier {
  id: number;
  minOrders: number;
  maxOrders: number | null;
  bonusAmount: number;
  tierName: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DeliveryTargetTierCreate {
  minOrders: number;
  maxOrders?: number | null;
  bonusAmount: number;
  tierName?: string | null;
  isActive?: boolean;
  displayOrder?: number;
}

export interface DailyProgress {
  completedCount: number;
  tiers: Omit<DeliveryTargetTier, 'isActive' | 'createdAt' | 'updatedAt'>[];
  currentTier: Omit<DeliveryTargetTier, 'isActive' | 'createdAt' | 'updatedAt'> | null;
  nextTier: Omit<DeliveryTargetTier, 'isActive' | 'createdAt' | 'updatedAt'> | null;
  bonusAlreadyCredited: boolean;
}

class DeliveryTargetTierService {
  // Admin: Get all tiers
  async getTargetTiers(): Promise<DeliveryTargetTier[]> {
    const response = await apiClient.get<DeliveryTargetTier[]>('/delivery-target-tiers/admin');
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch target tiers');
    }
    return response.data;
  }

  // Public: Get active tiers (for delivery boys)
  async getActiveTargetTiers(): Promise<Omit<DeliveryTargetTier, 'isActive' | 'createdAt' | 'updatedAt'>[]> {
    const response = await apiClient.get<Omit<DeliveryTargetTier, 'isActive' | 'createdAt' | 'updatedAt'>[]>('/delivery-target-tiers/active');
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch active target tiers');
    }
    return response.data;
  }

  // Get daily progress for delivery boy
  async getDailyProgress(): Promise<DailyProgress> {
    const response = await apiClient.get<DailyProgress>('/delivery-target-tiers/progress');
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch daily progress');
    }
    return response.data;
  }

  // Admin: Create tier
  async createTier(data: DeliveryTargetTierCreate): Promise<{ id: number }> {
    const response = await apiClient.post<{ id: number }>('/delivery-target-tiers/admin', data);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create target tier');
    }
    return response.data;
  }

  // Admin: Update tier
  async updateTier(id: number, data: DeliveryTargetTierCreate): Promise<void> {
    const response = await apiClient.put(`/delivery-target-tiers/admin/${id}`, { id, ...data });
    if (!response.success) {
      throw new Error(response.message || 'Failed to update target tier');
    }
  }

  // Admin: Delete tier
  async deleteTier(id: number): Promise<void> {
    const response = await apiClient.delete(`/delivery-target-tiers/admin/${id}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete target tier');
    }
  }
}

const deliveryTargetTierService = new DeliveryTargetTierService();
export default deliveryTargetTierService;
