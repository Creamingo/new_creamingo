const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export interface DeliveryOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  deliveryDate: string;
  deliveryTime: string;
  status: 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  specialInstructions?: string;
  deliveryPhotoUrl?: string;
  deliveredAt?: string;
  total: number;
  paymentStatus: string;
  items: string[];
  itemsCount?: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface DeliveryStats {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  totalEarnings: number;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

class DeliveryService {
  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Get delivery orders for a specific delivery boy
  async getDeliveryOrders(deliveryBoyId: string, filters?: { status?: string; date?: string }): Promise<DeliveryOrder[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.date) params.append('date', filters.date);

      const url = `${API_BASE_URL}/delivery/orders/${deliveryBoyId}${params.toString() ? `?${params.toString()}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching delivery orders:', error);
      throw error;
    }
  }

  // Update delivery order status
  async updateDeliveryStatus(
    orderId: string, 
    status: DeliveryOrder['status'], 
    options?: {
      deliveryPhotoUrl?: string;
      coordinates?: { lat: number; lng: number };
      otpCode?: string;
    }
  ): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/delivery/orders/${orderId}/status`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          status,
          ...options
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to update delivery status');
      }
    } catch (error) {
      console.error('Error updating delivery status:', error);
      throw error;
    }
  }

  // Track delivery location
  async trackDeliveryLocation(orderId: string, location: LocationData): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/delivery/orders/${orderId}/track`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(location)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to track location');
      }
    } catch (error) {
      console.error('Error tracking location:', error);
      throw error;
    }
  }

  // Get delivery statistics
  async getDeliveryStats(deliveryBoyId: string, date?: string): Promise<DeliveryStats> {
    try {
      const params = new URLSearchParams();
      if (date) params.append('date', date);

      const url = `${API_BASE_URL}/delivery/stats/${deliveryBoyId}${params.toString() ? `?${params.toString()}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data || {
        totalOrders: 0,
        completedOrders: 0,
        pendingOrders: 0,
        totalEarnings: 0
      };
    } catch (error) {
      console.error('Error fetching delivery stats:', error);
      throw error;
    }
  }

  // Create delivery order (admin function)
  async createDeliveryOrder(orderData: {
    orderId: string;
    deliveryBoyId: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    deliveryDate: string;
    deliveryTime: string;
    priority?: 'low' | 'medium' | 'high';
    specialInstructions?: string;
    coordinates?: { lat: number; lng: number };
    totalAmount?: number;
    itemsCount?: number;
  }): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/delivery/orders`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to create delivery order');
      }

      return result.deliveryOrderId;
    } catch (error) {
      console.error('Error creating delivery order:', error);
      throw error;
    }
  }

  // Get current location using browser geolocation API
  async getCurrentLocation(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  // Calculate distance between two coordinates (Haversine formula)
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  // Format time for display
  formatTime(timeString: string): string {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  // Format date for display
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Get available delivery boys
  async getAvailableDeliveryBoys(): Promise<Array<{ id: number; name: string; email: string; role: string; isActive: boolean }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/delivery/available-delivery-boys`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching available delivery boys:', error);
      throw error;
    }
  }

  // Get order assignment information
  async getOrderAssignment(orderId: string): Promise<{
    deliveryOrderId: number;
    deliveryBoyId: number;
    deliveryBoyName: string;
    deliveryBoyEmail: string;
    deliveryStatus: string;
    priority: string;
    assignedAt: string;
  } | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/delivery/order-assignment/${orderId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data || null;
    } catch (error) {
      console.error('Error fetching order assignment:', error);
      throw error;
    }
  }

  // Assign order to delivery boy (wrapper around createDeliveryOrder)
  async assignOrderToDeliveryBoy(
    orderId: string,
    deliveryBoyId: string,
    orderData: {
      customerName: string;
      customerPhone: string;
      customerAddress: string;
      deliveryDate: string;
      deliveryTime: string;
      priority?: 'low' | 'medium' | 'high';
      specialInstructions?: string;
      coordinates?: { lat: number; lng: number };
      totalAmount?: number;
      itemsCount?: number;
    }
  ): Promise<string> {
    try {
      return await this.createDeliveryOrder({
        orderId,
        deliveryBoyId,
        ...orderData
      });
    } catch (error) {
      console.error('Error assigning order to delivery boy:', error);
      throw error;
    }
  }

  // Bulk assign multiple orders to a delivery boy
  async bulkAssignOrders(
    orderIds: string[],
    deliveryBoyId: string,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      assigned: string[];
      updated: string[];
      failed: Array<{ orderId: string; reason: string }>;
    };
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/delivery/bulk-assign`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          orderIds,
          deliveryBoyId,
          priority
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error bulk assigning orders:', error);
      throw error;
    }
  }

  // Reassign order to a different delivery boy
  async reassignOrder(
    orderId: string,
    deliveryBoyId: string,
    reason?: string
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      orderId: string;
      oldDeliveryBoyId: number;
      newDeliveryBoyId: number;
    };
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/delivery/reassign/${orderId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          deliveryBoyId,
          reason
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error reassigning order:', error);
      throw error;
    }
  }

  // Get delivery boy workload
  async getDeliveryBoyWorkload(): Promise<Array<{
    deliveryBoyId: number;
    deliveryBoyName: string;
    deliveryBoyEmail: string;
    contactNumber?: string;
    totalOrders: number;
    assignedCount: number;
    pickedUpCount: number;
    inTransitCount: number;
    deliveredCount: number;
  }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/delivery/workload`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching delivery boy workload:', error);
      throw error;
    }
  }

  // Get assignment history for an order
  async getAssignmentHistory(orderId: string): Promise<Array<{
    id: number;
    orderId: string;
    oldDeliveryBoyId: number | null;
    oldDeliveryBoyName: string;
    newDeliveryBoyId: number;
    newDeliveryBoyName: string;
    reason: string;
    createdAt: string;
  }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/delivery/assignment-history/${orderId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching assignment history:', error);
      throw error;
    }
  }
}

export const deliveryService = new DeliveryService();
