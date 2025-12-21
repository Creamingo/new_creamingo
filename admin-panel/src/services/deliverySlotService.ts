import apiClient from './api';

// Types
export interface DeliverySlot {
  id: number;
  slotName: string;
  startTime: string;
  endTime: string;
  maxOrders: number; // Keep for backward compatibility, but will be managed per date
  isActive: boolean;
  displayOrder: number;
  displayOrderLimit: number; // Keep for backward compatibility, but will be managed per date
  availabilityThresholdHigh: number; // Keep for backward compatibility, but will be managed per date
  availabilityThresholdMedium: number; // Keep for backward compatibility, but will be managed per date
  createdAt: string;
  updatedAt: string;
}

export interface DeliverySlotAvailability {
  id: number;
  slotId: number;
  slotName: string;
  startTime: string;
  endTime: string;
  deliveryDate: string;
  availableOrders: number;
  isAvailable: boolean;
  maxOrders: number;
  displayOrderLimit: number;
  availabilityThresholdHigh: number;
  availabilityThresholdMedium: number;
}

export interface DeliverySlotStats {
  totalSlots: number;
  activeSlots: number;
  inactiveSlots: number;
  avgMaxOrders: number;
}

export interface CreateDeliverySlotData {
  slotName: string;
  startTime: string;
  endTime: string;
  isActive?: boolean;
  displayOrder?: number;
  // Note: maxOrders, displayOrderLimit, availabilityThresholdHigh, availabilityThresholdMedium
  // are now managed per date in the delivery_slot_availability table
}

export interface UpdateDeliverySlotData {
  slotName?: string;
  startTime?: string;
  endTime?: string;
  isActive?: boolean;
  displayOrder?: number;
  // Note: maxOrders, displayOrderLimit, availabilityThresholdHigh, availabilityThresholdMedium
  // are now managed per date in the delivery_slot_availability table
}

export interface UpdateSlotAvailabilityData {
  slotId: number;
  deliveryDate: string;
  maxOrders?: number;
  availableOrders: number;
  isAvailable: boolean;
}

class DeliverySlotService {
  // Get all delivery slots
  async getDeliverySlots(isActive?: boolean): Promise<DeliverySlot[]> {
    const params = new URLSearchParams();
    if (isActive !== undefined) {
      params.append('isActive', isActive.toString());
    }
    
    const response = await apiClient.get(`/delivery-slots?${params.toString()}`, false);
    return response.data;
  }

  // Get delivery slot by ID
  async getDeliverySlotById(id: number): Promise<DeliverySlot> {
    const response = await apiClient.get(`/delivery-slots/${id}`, false);
    return response.data;
  }

  // Create new delivery slot
  async createDeliverySlot(data: CreateDeliverySlotData): Promise<DeliverySlot> {
    const response = await apiClient.post('/delivery-slots', data);
    return response.data;
  }

  // Update delivery slot
  async updateDeliverySlot(id: number, data: UpdateDeliverySlotData): Promise<DeliverySlot> {
    const response = await apiClient.put(`/delivery-slots/${id}`, data);
    return response.data;
  }

  // Delete delivery slot
  async deleteDeliverySlot(id: number): Promise<void> {
    await apiClient.delete(`/delivery-slots/${id}`);
  }

  // Toggle slot status
  async toggleSlotStatus(id: number): Promise<void> {
    await apiClient.patch(`/delivery-slots/${id}/toggle-status`);
  }

  // Get slot availability for date range
  async getSlotAvailability(startDate: string, endDate: string): Promise<DeliverySlotAvailability[]> {
    const params = new URLSearchParams({
      startDate,
      endDate
    });
    
    console.log(`🌐 Service: Making API call to /delivery-slots/availability/range?${params.toString()}`);
    const response = await apiClient.get(`/delivery-slots/availability/range?${params.toString()}`, false);
    console.log('📡 Service: Raw API response:', response);
    console.log('📊 Service: Response data:', response.data);
    console.log('🎯 Service: Extracted data:', response.data);
    
    return response.data; // API returns the array directly in response.data
  }

  // Update slot availability
  async updateSlotAvailability(data: UpdateSlotAvailabilityData): Promise<void> {
    await apiClient.put('/delivery-slots/availability', data);
  }

  // Decrement available orders when online order is received
  async decrementAvailableOrders(slotId: number, deliveryDate: string, quantity: number = 1): Promise<void> {
    await apiClient.post('/delivery-slots/availability/decrement', {
      slotId,
      deliveryDate,
      quantity
    }, false); // Public endpoint, no auth required
  }

  // Get delivery slot statistics
  async getDeliverySlotStats(): Promise<DeliverySlotStats> {
    const response = await apiClient.get('/delivery-slots/stats');
    return response.data;
  }

  // Utility functions
  formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  formatTimeRange(startTime: string, endTime: string): string {
    return `${this.formatTime(startTime)} - ${this.formatTime(endTime)}`;
  }

  getSlotIcon(slotName: string): string {
    const name = slotName.toLowerCase();
    if (name.includes('morning')) return '🌅';
    if (name.includes('afternoon')) return '☀️';
    if (name.includes('evening')) return '🌙';
    if (name.includes('night')) return '🌃';
    return '🕐';
  }

  getAvailabilityStatus(availableOrders: number, maxOrders: number, isAvailable: boolean): {
    status: 'available' | 'low' | 'full' | 'unavailable';
    text: string;
    color: string;
  } {
    if (!isAvailable) {
      return {
        status: 'unavailable',
        text: 'Unavailable',
        color: 'text-gray-500'
      };
    }

    const percentage = (availableOrders / maxOrders) * 100;
    
    if (percentage >= 50) {
      return {
        status: 'available',
        text: 'Available',
        color: 'text-green-600'
      };
    } else if (percentage >= 20) {
      return {
        status: 'low',
        text: `${availableOrders} slots left`,
        color: 'text-yellow-600'
      };
    } else {
      return {
        status: 'full',
        text: 'Full',
        color: 'text-red-600'
      };
    }
  }

  // Validate slot data
  validateSlotData(data: CreateDeliverySlotData | UpdateDeliverySlotData): string[] {
    const errors: string[] = [];

    if ('slotName' in data && data.slotName) {
      if (data.slotName.trim().length < 2) {
        errors.push('Slot name must be at least 2 characters long');
      }
      if (data.slotName.trim().length > 50) {
        errors.push('Slot name must be less than 50 characters');
      }
    }

    if ('startTime' in data && data.startTime) {
      if (!this.isValidTime(data.startTime)) {
        errors.push('Start time must be in HH:MM:SS format');
      }
    }

    if ('endTime' in data && data.endTime) {
      if (!this.isValidTime(data.endTime)) {
        errors.push('End time must be in HH:MM:SS format');
      }
    }

    if ('startTime' in data && 'endTime' in data && data.startTime && data.endTime) {
      if (this.isValidTime(data.startTime) && this.isValidTime(data.endTime)) {
        if (data.startTime >= data.endTime) {
          errors.push('End time must be after start time');
        }
      }
    }

    if ('maxOrders' in data && data.maxOrders !== undefined && data.maxOrders !== null) {
      if (data.maxOrders < 1) {
        errors.push('Max orders must be at least 1');
      }
      if (data.maxOrders > 1000) {
        errors.push('Max orders must be less than 1000');
      }
    }

    return errors;
  }

  private isValidTime(time: string): boolean {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  // Generate default slots
  generateDefaultSlots(): CreateDeliverySlotData[] {
    return [
      {
        slotName: 'Morning',
        startTime: '09:00:00',
        endTime: '12:00:00',
        isActive: true,
        displayOrder: 1
      },
      {
        slotName: 'Afternoon',
        startTime: '12:00:00',
        endTime: '17:00:00',
        isActive: true,
        displayOrder: 2
      },
      {
        slotName: 'Evening',
        startTime: '17:00:00',
        endTime: '21:00:00',
        isActive: true,
        displayOrder: 3
      }
    ];
  }
}

const deliverySlotService = new DeliverySlotService();
export default deliverySlotService;
