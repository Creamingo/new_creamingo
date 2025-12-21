import apiClient from './api';

export interface DeliveryWalletSummary {
  balance: number;
  todayEarnings: number;
  weekEarnings: number;
  monthEarnings: number;
  completedDeliveries: number;
}

export type DeliveryWalletTransactionType = 'earning' | 'bonus' | 'penalty' | 'payout';

export interface DeliveryWalletTransactionMeta {
  baseFee?: number;
  percentFee?: number;
  distanceIncentive?: number;
  orderTotal?: number;
  deliveredAt?: string | null;
  [key: string]: any;
}

export interface DeliveryWalletTransaction {
  id: number;
  orderId: number | null;
  type: DeliveryWalletTransactionType;
  amount: number;
  meta: DeliveryWalletTransactionMeta | null;
  createdAt: string;
}

export interface DeliveryWalletTransactionsResponse {
  transactions: DeliveryWalletTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class DeliveryWalletService {
  async getSummary(): Promise<DeliveryWalletSummary> {
    const response = await apiClient.get<{ 
      balance: number;
      todayEarnings: number;
      weekEarnings: number;
      monthEarnings: number;
      completedDeliveries: number;
    }>('/delivery-wallet/summary');

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch delivery wallet summary');
    }

    return response.data;
  }

  async getTransactions(params: {
    page?: number;
    limit?: number;
    type?: DeliveryWalletTransactionType;
  } = {}): Promise<DeliveryWalletTransactionsResponse> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));
    if (params.type) query.append('type', params.type);

    const endpoint = `/delivery-wallet/transactions${query.toString() ? `?${query.toString()}` : ''}`;

    const response = await apiClient.get<{
      transactions: DeliveryWalletTransaction[];
      pagination: DeliveryWalletTransactionsResponse['pagination'];
    }>(endpoint);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch delivery wallet transactions');
    }

    return response.data;
  }
}

const deliveryWalletService = new DeliveryWalletService();
export default deliveryWalletService;

