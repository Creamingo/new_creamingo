import apiClient, { ApiResponse } from './api';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
    // Optional precise map location captured from frontend
    location?: {
      lat?: number;
      lng?: number;
      accuracy?: number | null;
      source?: string | null;
    } | null;
  };
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerStats {
  total_customers: number;
  active_customers: number;
  new_this_month: number;
  vip_customers: number;
}

export interface CustomerFilters {
  page?: number;
  limit?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export interface CustomerOrder {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  delivery_date: string;
  delivery_time: string;
  payment_method: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerData {
  name: string;
  email: string;
  phone: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
    location?: {
      lat?: number;
      lng?: number;
      accuracy?: number | null;
      source?: string | null;
    } | null;
  };
}

export interface UpdateCustomerData {
  name?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
    location?: {
      lat?: number;
      lng?: number;
      accuracy?: number | null;
      source?: string | null;
    } | null;
  };
}

// Using ApiResponse from api.ts

class CustomerService {
  // Get all customers with pagination and filters
  async getCustomers(filters: CustomerFilters = {}): Promise<ApiResponse<Customer[]>> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.sort_order) params.append('sort_order', filters.sort_order);

    const response = await apiClient.get(`/customers?${params.toString()}`);
    
    if (!response.data) {
      throw new Error('No data received from API');
    }
    
    // Map backend field names to frontend field names
    const mappedData = response.data.map((customer: any) => ({
      ...customer,
      totalOrders: customer.total_orders || 0,
      totalSpent: customer.total_spent || 0,
      lastOrderDate: customer.last_order_date,
      createdAt: customer.created_at,
      updatedAt: customer.updated_at,
      address: customer.address ? (typeof customer.address === 'string' ? JSON.parse(customer.address) : customer.address) : undefined
    }));

    return {
      success: response.success,
      data: mappedData,
      message: response.message,
      pagination: response.pagination
    };
  }

  // Get single customer
  async getCustomer(id: string): Promise<ApiResponse<Customer>> {
    const response = await apiClient.get(`/customers/${id}`);
    
    if (!response.data) {
      throw new Error('No data received from API');
    }
    
    // Map backend field names to frontend field names
    const customer = response.data;
    const mappedCustomer = {
      ...customer,
      totalOrders: customer.total_orders || 0,
      totalSpent: customer.total_spent || 0,
      lastOrderDate: customer.last_order_date,
      createdAt: customer.created_at,
      updatedAt: customer.updated_at,
      address: customer.address ? (typeof customer.address === 'string' ? JSON.parse(customer.address) : customer.address) : undefined
    };

    return {
      success: response.success,
      data: mappedCustomer,
      message: response.message
    };
  }

  // Create new customer
  async createCustomer(customerData: CreateCustomerData): Promise<ApiResponse<Customer>> {
    const response = await apiClient.post('/customers', customerData);
    
    if (!response.data) {
      throw new Error('No data received from API');
    }
    
    // Map backend field names to frontend field names
    const customer = response.data;
    const mappedCustomer = {
      ...customer,
      totalOrders: customer.total_orders || 0,
      totalSpent: customer.total_spent || 0,
      lastOrderDate: customer.last_order_date,
      createdAt: customer.created_at,
      updatedAt: customer.updated_at,
      address: customer.address ? (typeof customer.address === 'string' ? JSON.parse(customer.address) : customer.address) : undefined
    };

    return {
      success: response.success,
      data: mappedCustomer,
      message: response.message
    };
  }

  // Update customer
  async updateCustomer(id: string, customerData: UpdateCustomerData): Promise<ApiResponse<Customer>> {
    const response = await apiClient.put(`/customers/${id}`, customerData);
    
    if (!response.data) {
      throw new Error('No data received from API');
    }
    
    // Map backend field names to frontend field names
    const customer = response.data;
    const mappedCustomer = {
      ...customer,
      totalOrders: customer.total_orders || 0,
      totalSpent: customer.total_spent || 0,
      lastOrderDate: customer.last_order_date,
      createdAt: customer.created_at,
      updatedAt: customer.updated_at,
      address: customer.address ? (typeof customer.address === 'string' ? JSON.parse(customer.address) : customer.address) : undefined
    };

    return {
      success: response.success,
      data: mappedCustomer,
      message: response.message
    };
  }

  // Delete customer
  async deleteCustomer(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete(`/customers/${id}`);
    return {
      success: response.success,
      message: response.message
    };
  }

  // Get customer statistics
  async getCustomerStats(): Promise<ApiResponse<CustomerStats>> {
    const response = await apiClient.get('/customers/stats');
    if (!response.data) {
      throw new Error('No data received from API');
    }
    return {
      success: response.success,
      data: response.data,
      message: response.message
    };
  }

  // Get customer orders
  async getCustomerOrders(id: string, page: number = 1, limit: number = 10): Promise<ApiResponse<CustomerOrder[]>> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response = await apiClient.get(`/customers/${id}/orders?${params.toString()}`);
    if (!response.data) {
      throw new Error('No data received from API');
    }
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      pagination: response.pagination
    };
  }

  // Get customer wallet transactions
  async getCustomerWalletTransactions(id: string, page: number = 1, limit: number = 50): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response = await apiClient.get(`/customers/${id}/wallet-transactions?${params.toString()}`);
    if (!response.data) {
      throw new Error('No data received from API');
    }
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      pagination: response.pagination
    };
  }

  // Get customer referrals
  async getCustomerReferrals(id: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/customers/${id}/referrals`);
    if (!response.data) {
      throw new Error('No data received from API');
    }
    return {
      success: response.success,
      data: response.data,
      message: response.message
    };
  }

  // Get customer scratch cards
  async getCustomerScratchCards(id: string, page: number = 1, limit: number = 50): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response = await apiClient.get(`/customers/${id}/scratch-cards?${params.toString()}`);
    if (!response.data) {
      throw new Error('No data received from API');
    }
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      pagination: response.pagination
    };
  }

  // Get customer tier info
  async getCustomerTierInfo(id: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/customers/${id}/tier-info`);
    if (!response.data) {
      throw new Error('No data received from API');
    }
    return {
      success: response.success,
      data: response.data,
      message: response.message
    };
  }
}

export const customerService = new CustomerService();
