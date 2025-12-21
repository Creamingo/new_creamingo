/**
 * Payment Service
 * Handles payment API calls
 * Payments are derived from orders since payment information is stored with orders
 */

import apiClient, { ApiResponse } from './api';
import { Payment } from '../types';

export interface PaymentFilters {
  page?: number;
  limit?: number;
  status?: 'pending' | 'completed' | 'failed' | 'refunded' | 'all';
  method?: 'card' | 'cash' | 'upi' | 'wallet' | 'all';
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export interface PaymentStats {
  total_amount: number;
  completed_amount: number;
  completed_count: number;
  pending_count: number;
  failed_count: number;
  refunded_count: number;
  today_count: number;
  today_amount: number;
  total_payments: number;
}

class PaymentService {
  /**
   * Get all payments with pagination and filters
   * Payments are derived from orders
   */
  async getPayments(filters: PaymentFilters = {}): Promise<ApiResponse<Payment[]>> {
    try {
      const params = new URLSearchParams();
      
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
      if (filters.sort_by) params.append('sort_by', filters.sort_by);
      if (filters.sort_order) params.append('sort_order', filters.sort_order);

      // Fetch orders with payment information
      const response = await apiClient.get(`/orders?${params.toString()}`);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch payments');
      }

      // Handle response structure from orders API
      const orders = response.data.orders || [];
      const total = response.data.total || 0;
      
      let payments: Payment[] = orders.map((order: any) => {
        // Map payment_status to Payment status
        let paymentStatus: Payment['status'] = 'pending';
        if (order.payment_status === 'paid') {
          paymentStatus = 'completed';
        } else if (order.payment_status === 'failed') {
          paymentStatus = 'failed';
        } else if (order.payment_status === 'refunded') {
          paymentStatus = 'refunded';
        } else {
          paymentStatus = 'pending';
        }

        // Map payment_method to Payment method
        let paymentMethod: Payment['method'] = 'cash';
        const method = (order.payment_method || 'cash').toLowerCase();
        if (['card', 'cash', 'upi', 'wallet'].includes(method)) {
          paymentMethod = method as Payment['method'];
        }

        return {
          id: `PAY-${order.id}`,
          orderId: order.order_number || order.orderId || `ORD-${order.id}`,
          amount: parseFloat(order.total_amount || order.total || 0),
          method: paymentMethod,
          status: paymentStatus,
          transactionId: order.transaction_id || order.transactionId || undefined,
          createdAt: order.created_at || order.createdAt
        };
      });

      // Apply payment-specific filters
      if (filters.status && filters.status !== 'all') {
        payments = payments.filter(p => {
          if (filters.status === 'completed') return p.status === 'completed';
          if (filters.status === 'pending') return p.status === 'pending';
          if (filters.status === 'failed') return p.status === 'failed';
          if (filters.status === 'refunded') return p.status === 'refunded';
          return true;
        });
      }

      if (filters.method && filters.method !== 'all') {
        payments = payments.filter(p => p.method === filters.method);
      }

      if (filters.amount_min !== undefined) {
        payments = payments.filter(p => p.amount >= filters.amount_min!);
      }

      if (filters.amount_max !== undefined) {
        payments = payments.filter(p => p.amount <= filters.amount_max!);
      }

      return {
        success: true,
        data: payments,
        pagination: {
          total: total,
          page: response.data.page || filters.page || 1,
          limit: response.data.limit || filters.limit || 10,
          pages: Math.ceil(total / (response.data.limit || filters.limit || 10))
        }
      };
    } catch (error: any) {
      console.error('Get payments error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch payments',
        data: []
      };
    }
  }

  /**
   * Get payment by ID
   */
  async getPayment(id: string): Promise<ApiResponse<Payment>> {
    try {
      // Extract order ID from payment ID (PAY-123 -> 123)
      const orderId = id.replace('PAY-', '');
      
      const response = await apiClient.get(`/orders/${orderId}`);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch payment');
      }

      const order = response.data;
      
      // Map order to payment
      let paymentStatus: Payment['status'] = 'pending';
      if (order.payment_status === 'paid') {
        paymentStatus = 'completed';
      } else if (order.payment_status === 'failed') {
        paymentStatus = 'failed';
      } else if (order.payment_status === 'refunded') {
        paymentStatus = 'refunded';
      }

      let paymentMethod: Payment['method'] = 'cash';
      const method = (order.payment_method || 'cash').toLowerCase();
      if (['card', 'cash', 'upi', 'wallet'].includes(method)) {
        paymentMethod = method as Payment['method'];
      }

      const payment: Payment = {
        id: `PAY-${order.id}`,
        orderId: order.order_number || order.orderId || `ORD-${order.id}`,
        amount: parseFloat(order.total_amount || order.total || 0),
        method: paymentMethod,
        status: paymentStatus,
        transactionId: order.transaction_id || order.transactionId || undefined,
        createdAt: order.created_at || order.createdAt
      };

      return {
        success: true,
        data: payment
      };
    } catch (error: any) {
      console.error('Get payment error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch payment'
      };
    }
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats(filters?: { date_from?: string; date_to?: string }): Promise<ApiResponse<PaymentStats>> {
    try {
      const params = new URLSearchParams();
      if (filters?.date_from) params.append('date_from', filters.date_from);
      if (filters?.date_to) params.append('date_to', filters.date_to);
      params.append('limit', '10000'); // Get all orders for stats calculation

      const response = await apiClient.get(`/orders?${params.toString()}`);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch payment stats');
      }

      // Handle response structure from orders API
      const orders = response.data.orders || [];
      
      // Calculate stats
      const stats: PaymentStats = {
        total_amount: 0,
        completed_amount: 0,
        completed_count: 0,
        pending_count: 0,
        failed_count: 0,
        refunded_count: 0,
        today_count: 0,
        today_amount: 0,
        total_payments: orders.length
      };

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      orders.forEach((order: any) => {
        const amount = parseFloat(order.total_amount || order.total || 0);
        const paymentStatus = order.payment_status || 'pending';
        const createdAt = new Date(order.created_at || order.createdAt);
        createdAt.setHours(0, 0, 0, 0);

        stats.total_amount += amount;

        if (paymentStatus === 'paid') {
          stats.completed_count++;
          stats.completed_amount += amount;
        } else if (paymentStatus === 'failed') {
          stats.failed_count++;
        } else if (paymentStatus === 'refunded') {
          stats.refunded_count++;
        } else {
          stats.pending_count++;
        }

        // Today's payments
        if (createdAt.getTime() === today.getTime()) {
          stats.today_count++;
          stats.today_amount += amount;
        }
      });

      return {
        success: true,
        data: stats
      };
    } catch (error: any) {
      console.error('Get payment stats error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch payment stats',
        data: {
          total_amount: 0,
          completed_amount: 0,
          completed_count: 0,
          pending_count: 0,
          failed_count: 0,
          refunded_count: 0,
          today_count: 0,
          today_amount: 0,
          total_payments: 0
        }
      };
    }
  }

  /**
   * Update payment status (via order update)
   */
  async updatePaymentStatus(paymentId: string, status: Payment['status']): Promise<ApiResponse<Payment>> {
    try {
      // Extract order ID from payment ID
      const orderId = paymentId.replace('PAY-', '');
      
      // Map Payment status to order payment_status
      let orderPaymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' = 'pending';
      if (status === 'completed') {
        orderPaymentStatus = 'paid';
      } else if (status === 'failed') {
        orderPaymentStatus = 'failed';
      } else if (status === 'refunded') {
        orderPaymentStatus = 'refunded';
      }

      const response = await apiClient.put(`/orders/${orderId}`, {
        paymentStatus: orderPaymentStatus
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update payment status');
      }

      const order = response.data;
      
      // Map back to Payment
      let paymentStatus: Payment['status'] = 'pending';
      if (order.payment_status === 'paid') {
        paymentStatus = 'completed';
      } else if (order.payment_status === 'failed') {
        paymentStatus = 'failed';
      } else if (order.payment_status === 'refunded') {
        paymentStatus = 'refunded';
      }

      let paymentMethod: Payment['method'] = 'cash';
      const method = (order.payment_method || 'cash').toLowerCase();
      if (['card', 'cash', 'upi', 'wallet'].includes(method)) {
        paymentMethod = method as Payment['method'];
      }

      const payment: Payment = {
        id: `PAY-${order.id}`,
        orderId: order.order_number || order.orderId || `ORD-${order.id}`,
        amount: parseFloat(order.total_amount || order.total || 0),
        method: paymentMethod,
        status: paymentStatus,
        transactionId: order.transaction_id || order.transactionId || undefined,
        createdAt: order.created_at || order.createdAt
      };

      return {
        success: true,
        data: payment
      };
    } catch (error: any) {
      console.error('Update payment status error:', error);
      return {
        success: false,
        message: error.message || 'Failed to update payment status'
      };
    }
  }
}

export const paymentService = new PaymentService();
export default paymentService;
