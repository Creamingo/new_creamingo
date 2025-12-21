/**
 * Dashboard Service
 * Handles all dashboard-related API calls
 */

import orderService from './orderService';
import { customerService } from './customerService';
import productService from './productService';

export interface DashboardStats {
  totalOrders: number;
  totalSales: number;
  totalCustomers: number;
  totalProducts: number;
  ordersToday: number;
  salesToday: number;
  newCustomersToday: number;
  lowStockProducts: number;
}

export interface TodayStats {
  ordersToday: number;
  salesToday: number;
  newCustomersToday: number;
}

class DashboardService {
  /**
   * Get comprehensive dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Fetch all stats in parallel
      // Use a very large period (36500 days ≈ 100 years) to get all-time stats for dashboard
      const statsPromises: Promise<any>[] = [
        orderService.getOrderStats(36500), // All-time stats
        productService.getProducts({ limit: 1, page: 1 }),
        this.getTodayStats(),
        this.getLowStockProductsCount()
      ];
      
      // Try to fetch customer stats, but handle permission errors gracefully
      const customerStatsPromise = customerService.getCustomerStats().catch((error: any) => {
        // If access denied (403), user is likely a delivery boy
        if (error?.message?.includes('Access denied') || error?.message?.includes('403')) {
          return { data: { total_customers: 0 } };
        }
        throw error; // Re-throw other errors
      });
      
      statsPromises.splice(1, 0, customerStatsPromise);
      
      const results = await Promise.all(statsPromises);
      const [orderStats, customerStatsResponse, productsResponse, todayStats, lowStockCount] = results;

      const customerStats = customerStatsResponse?.data || { total_customers: 0 };
      const totalProducts = productsResponse.pagination?.total || 0;

      return {
        totalOrders: orderStats.total,
        totalSales: orderStats.totalRevenue || 0,
        totalCustomers: customerStats?.total_customers || 0,
        totalProducts: totalProducts,
        ordersToday: todayStats.ordersToday,
        salesToday: todayStats.salesToday,
        newCustomersToday: todayStats.newCustomersToday,
        lowStockProducts: lowStockCount
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return zeros on error
      return {
        totalOrders: 0,
        totalSales: 0,
        totalCustomers: 0,
        totalProducts: 0,
        ordersToday: 0,
        salesToday: 0,
        newCustomersToday: 0,
        lowStockProducts: 0
      };
    }
  }

  /**
   * Get today's statistics
   */
  async getTodayStats(skipCustomers: boolean = false): Promise<TodayStats> {
    try {
      // Get orders created today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const todayEnd = tomorrow.toISOString().split('T')[0];

      // Fetch orders for today using order service
      const ordersResponse = await orderService.getOrders({ 
        limit: 1000, 
        page: 1,
        date_from: todayStart,
        date_to: todayEnd
      });
      
      let ordersToday = 0;
      let salesToday = 0;
      
      if (ordersResponse.orders && ordersResponse.orders.length > 0) {
        // Filter orders that were created today (more precise filtering)
        const todayStartTime = today.getTime();
        const todayEndTime = tomorrow.getTime();
        
        const todayOrders = ordersResponse.orders.filter((order: any) => {
          const orderDate = new Date(order.createdAt || order.created_at);
          const orderTime = orderDate.getTime();
          return orderTime >= todayStartTime && orderTime < todayEndTime;
        });
        
        ordersToday = todayOrders.length;
        salesToday = todayOrders.reduce((sum: number, order: any) => {
          return sum + (parseFloat(order.total || order.total_amount || 0));
        }, 0);
      }

      // Get new customers today by checking customer creation date
      // Handle permission errors gracefully (for delivery boys)
      let newCustomersToday = 0;
      try {
        const todayDateStr = today.toISOString().split('T')[0];
        // Query customers created today - this would ideally be a backend endpoint
        const allCustomersResponse = await customerService.getCustomers({ limit: 1000, page: 1 });
        if (allCustomersResponse.data && Array.isArray(allCustomersResponse.data)) {
          newCustomersToday = allCustomersResponse.data.filter((customer: any) => {
            const createdDate = new Date(customer.createdAt || customer.created_at);
            return createdDate.toISOString().split('T')[0] === todayDateStr;
          }).length;
        }
      } catch (err: any) {
        // If access denied, user is likely a delivery boy - just return 0
        if (err?.message?.includes('Access denied') || err?.message?.includes('403')) {
          newCustomersToday = 0;
        } else {
          console.warn('Could not fetch new customers today:', err);
        }
      }

      return {
        ordersToday,
        salesToday,
        newCustomersToday
      };
    } catch (error) {
      console.error('Error fetching today stats:', error);
      return {
        ordersToday: 0,
        salesToday: 0,
        newCustomersToday: 0
      };
    }
  }

  /**
   * Get count of low stock products
   */
  async getLowStockProductsCount(threshold: number = 10): Promise<number> {
    try {
      // Fetch all products
      const productsResponse = await productService.getProducts({ limit: 1000, page: 1 });
      
      if (!productsResponse.products || productsResponse.products.length === 0) {
        return 0;
      }

      // Count products with low stock
      let lowStockCount = 0;

      // Check each product's variants for low stock
      for (const product of productsResponse.products) {
        if (product.variants && product.variants.length > 0) {
          // Check if any variant has low stock
          const hasLowStock = product.variants.some(
            (variant: any) => (variant.stock_quantity || variant.stock || 0) < threshold
          );
          if (hasLowStock) {
            lowStockCount++;
          }
        } else {
          // If no variants, check product stock if available
          if ((product.stock || 0) < threshold) {
            lowStockCount++;
          }
        }
      }

      return lowStockCount;
    } catch (error) {
      console.error('Error fetching low stock products count:', error);
      return 0;
    }
  }
}

// Create singleton instance
const dashboardService = new DashboardService();

export default dashboardService;

