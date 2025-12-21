/**
 * Order Service
 * Handles order API calls
 */

import apiClient from './api';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  product_image?: string | null;
  quantity: number;
  price: number;
  weight?: string;
  flavor_id?: number | null;
  flavor_name?: string | null;
  product_subcategory_name?: string | null;
  tier?: string | null;
  variant_name?: string | null;
  cake_message?: string | null;
}

export interface Order {
  id: string;
  orderId?: string;
  order_number?: string;
  displayId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method?: string;
  deliveryAddress: string;
  deliveryDate: string;
  deliveryTime: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderStats {
  total: number;
  pending: number;
  confirmed: number;
  preparing: number;
  ready: number;
  delivered: number;
  cancelled: number;
  totalRevenue: number;
  averageOrderValue?: number;
}

export interface CreateOrderData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: Omit<OrderItem, 'id'>[];
  deliveryAddress: string;
  deliveryDate: string;
  deliveryTime: string;
  notes?: string;
}

export interface UpdateOrderData {
  status?: Order['status'];
  paymentStatus?: Order['paymentStatus'];
  notes?: string;
}

export interface OrderFilters {
  page?: number;
  limit?: number;
  status?: string;
  customer_id?: string;
  date_from?: string;
  date_to?: string;
  delivery_date?: string;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export interface OrderService {
  getOrders: (filters?: OrderFilters) => Promise<{ orders: Order[]; total: number; page: number; limit: number }>;
  getOrder: (id: string) => Promise<Order>;
  createOrder: (data: CreateOrderData) => Promise<Order>;
  updateOrder: (id: string, data: UpdateOrderData) => Promise<Order>;
  deleteOrder: (id: string) => Promise<void>;
  getOrderStats: () => Promise<OrderStats>;
}

class OrderServiceImpl implements OrderService {
  /**
   * Get all orders with pagination and filters
   */
  async getOrders(filters: OrderFilters = {}): Promise<{ orders: Order[]; total: number; page: number; limit: number }> {
    try {
      const params = new URLSearchParams();
      
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.status) params.append('status', filters.status);
      if (filters.customer_id) params.append('customer_id', filters.customer_id);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
      if (filters.delivery_date) params.append('delivery_date', filters.delivery_date);
      if (filters.sort_by) params.append('sort_by', filters.sort_by);
      if (filters.sort_order) params.append('sort_order', filters.sort_order);

      const url = `/orders${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiClient.get<any>(url);
      
      if (response.success && response.data) {
        // Process orders to ensure items have proper field mapping
        const orders = (response.data.orders || []).map((order: any) => {
          // Ensure items have product_image field properly mapped
          if (order.items && Array.isArray(order.items)) {
            order.items = order.items.map((item: any) => ({
              id: item.id?.toString() || '',
              productId: item.product_id?.toString() || item.productId?.toString() || '',
              productName: item.product_name || item.productName || '',
              // Prioritize product_image from backend, then check other fields
              product_image: item.product_image || item.image_url || item.productImage || item.image || null,
              quantity: item.quantity || 0,
              price: parseFloat(item.price || 0),
              weight: item.variant_weight || item.product_base_weight || item.weight || null,
              flavor_id: item.flavor_id || null,
              flavor_name: item.flavor_name || null,
              product_subcategory_name: item.product_subcategory_name || null,
              tier: item.tier || null,
              cake_message: item.cake_message || null,
              variant_name: item.variant_name || null
            }));
          } else {
            order.items = [];
          }
          return order;
        });

        return {
          orders: orders,
          total: response.data.total || 0,
          page: response.data.page || 1,
          limit: response.data.limit || 10
        };
      } else {
        throw new Error(response.message || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Get orders error:', error);
      throw error;
    }
  }

  /**
   * Get order by ID
   */
  async getOrder(id: string): Promise<Order> {
    try {
      const response = await apiClient.get<{ order: any }>(`/orders/${id}`);
      
      if (response.success && response.data) {
        // Backend returns { order: ... }, so extract the order
        const orderData = response.data.order || response.data;
        
        // Parse items if they're a JSON string (PostgreSQL json_agg returns JSON)
        let items = orderData.items;
        if (typeof items === 'string') {
          try {
            items = JSON.parse(items);
          } catch (e) {
            console.error('Failed to parse items JSON:', e);
            items = [];
          }
        }
        
        // Ensure items have product_image field properly mapped
        if (items && Array.isArray(items)) {
          orderData.items = items.map((item: any) => ({
            id: item.id?.toString() || '',
            productId: item.product_id?.toString() || item.productId?.toString() || '',
            productName: item.product_name || item.productName || '',
            // Prioritize product_image from backend, then check other fields
            product_image: item.product_image || item.image_url || item.productImage || item.image || null,
            quantity: item.quantity || 0,
            price: parseFloat(item.price || 0),
            weight: item.variant_weight || item.product_base_weight || item.weight || null,
            flavor_id: item.flavor_id || null,
            flavor_name: item.flavor_name || null,
            product_subcategory_name: item.product_subcategory_name || null,
            tier: item.tier || null,
            cake_message: item.cake_message || null,
            variant_name: item.variant_name || null
          }));
        } else {
          orderData.items = [];
        }
        
        return orderData as Order;
      } else {
        throw new Error(response.message || 'Failed to fetch order');
      }
    } catch (error) {
      console.error('Get order error:', error);
      throw error;
    }
  }

  /**
   * Create new order
   */
  async createOrder(data: CreateOrderData): Promise<Order> {
    try {
      const response = await apiClient.post<Order>('/orders', data);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('Create order error:', error);
      throw error;
    }
  }

  /**
   * Update order
   */
  async updateOrder(id: string, data: UpdateOrderData): Promise<Order> {
    try {
      const response = await apiClient.put<any>(`/orders/${id}`, data);
      
      if (response.success && response.data) {
        // Handle both direct order object and nested data.order
        const orderData = response.data.order || response.data;
        return orderData;
      } else {
        throw new Error(response.message || 'Failed to update order');
      }
    } catch (error) {
      console.error('Update order error:', error);
      throw error;
    }
  }

  /**
   * Delete order
   */
  async deleteOrder(id: string): Promise<void> {
    try {
      const response = await apiClient.delete(`/orders/${id}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete order');
      }
    } catch (error) {
      console.error('Delete order error:', error);
      throw error;
    }
  }

  /**
   * Download invoice for an order (Admin)
   * @param orderNumber - Order number to generate invoice for
   */
  async downloadInvoice(orderNumber: string): Promise<Blob> {
    try {
      const response = await apiClient.getBlob(`/orders/invoice/admin/${orderNumber}`);
      return response;
    } catch (error) {
      console.error('Download invoice error:', error);
      throw error;
    }
  }

  /**
   * Get order statistics
   * @param period - Number of days to look back (default: 30). Use a very large number (e.g., 36500) for all-time stats
   */
  async getOrderStats(period?: number): Promise<OrderStats> {
    try {
      const params = period ? `?period=${period}` : '';
      const response = await apiClient.get<any>(`/orders/stats${params}`);
      
      if (response.success && response.data) {
        const stats = response.data.stats || response.data;
        return {
          total: parseInt(stats.total_orders || 0),
          pending: parseInt(stats.pending_orders || 0),
          confirmed: parseInt(stats.confirmed_orders || 0),
          preparing: parseInt(stats.preparing_orders || 0),
          ready: parseInt(stats.ready_orders || 0),
          delivered: parseInt(stats.delivered_orders || 0),
          cancelled: parseInt(stats.cancelled_orders || 0),
          totalRevenue: parseFloat(stats.total_revenue || 0),
          averageOrderValue: parseFloat(stats.average_order_value || 0)
        };
      } else {
        throw new Error(response.message || 'Failed to fetch order statistics');
      }
    } catch (error) {
      console.error('Get order stats error:', error);
      throw error;
    }
  }
}

// Create singleton instance
const orderService = new OrderServiceImpl();

export default orderService;
