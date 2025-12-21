import apiClient from './api';

export interface DeliveryPinCode {
  id: string;
  pinCode: string;
  deliveryCharge: number;
  locality: string;
  status: 'active' | 'inactive';
  orderIndex: number;
  createdAt: string;
}

export interface DeliveryPinCodeStats {
  total: number;
  active: number;
  inactive: number;
  averageCharge: number;
}

export interface DeliveryPinCodeFilters {
  status?: 'all' | 'active' | 'inactive';
  search?: string;
  page?: number;
  limit?: number;
}

export interface DeliveryPinCodeResponse {
  pinCodes: DeliveryPinCode[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface CreatePinCodeData {
  pinCode: string;
  deliveryCharge: number;
  locality: string;
  status: 'active' | 'inactive';
}

export interface UpdatePinCodeData {
  pinCode: string;
  deliveryCharge: number;
  locality: string;
  status: 'active' | 'inactive';
}

export interface PinCodeOrderUpdate {
  id: string;
  orderIndex: number;
}

class DeliveryPinCodeService {

  // Get all delivery PIN codes with filtering and pagination
  async getDeliveryPinCodes(filters: DeliveryPinCodeFilters = {}): Promise<DeliveryPinCodeResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }
      
      if (filters.search) {
        params.append('search', filters.search);
      }
      
      if (filters.page) {
        params.append('page', filters.page.toString());
      }
      
      if (filters.limit) {
        params.append('limit', filters.limit.toString());
      }

      const endpoint = `/delivery-pin-codes${params.toString() ? `?${params.toString()}` : ''}`;
      const result = await apiClient.get<DeliveryPinCodeResponse>(endpoint);
      
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Failed to fetch delivery PIN codes');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching delivery PIN codes:', error);
      throw error;
    }
  }

  // Get delivery PIN code statistics
  async getDeliveryPinCodeStats(): Promise<DeliveryPinCodeStats> {
    try {
      const result = await apiClient.get<DeliveryPinCodeStats>('/delivery-pin-codes/stats');
      
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Failed to fetch delivery PIN code statistics');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching delivery PIN code statistics:', error);
      throw error;
    }
  }

  // Create a new delivery PIN code
  async createDeliveryPinCode(data: CreatePinCodeData): Promise<DeliveryPinCode> {
    try {
      const result = await apiClient.post<DeliveryPinCode>('/delivery-pin-codes', data);
      
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Failed to create delivery PIN code');
      }

      return result.data;
    } catch (error) {
      console.error('Error creating delivery PIN code:', error);
      throw error;
    }
  }

  // Update a delivery PIN code
  async updateDeliveryPinCode(id: string, data: UpdatePinCodeData): Promise<DeliveryPinCode> {
    try {
      const result = await apiClient.put<DeliveryPinCode>(`/delivery-pin-codes/${id}`, data);
      
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Failed to update delivery PIN code');
      }

      return result.data;
    } catch (error) {
      console.error('Error updating delivery PIN code:', error);
      throw error;
    }
  }

  // Delete a delivery PIN code
  async deleteDeliveryPinCode(id: string): Promise<void> {
    try {
      const result = await apiClient.delete(`/delivery-pin-codes/${id}`);
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to delete delivery PIN code');
      }
    } catch (error) {
      console.error('Error deleting delivery PIN code:', error);
      throw error;
    }
  }

  // Toggle PIN code status
  async togglePinCodeStatus(id: string): Promise<{ id: string; status: 'active' | 'inactive' }> {
    try {
      const result = await apiClient.patch<{ id: string; status: 'active' | 'inactive' }>(`/delivery-pin-codes/${id}/toggle-status`);
      
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Failed to toggle PIN code status');
      }

      return result.data;
    } catch (error) {
      console.error('Error toggling PIN code status:', error);
      throw error;
    }
  }

  // Export PIN codes to CSV
  async exportPinCodesToCSV(): Promise<void> {
    try {
      const result = await apiClient.get<DeliveryPinCodeResponse>('/delivery-pin-codes');
      
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Failed to fetch PIN codes for export');
      }

      // Helper function to properly escape CSV values
      const escapeCsvValue = (value: string): string => {
        // If value contains comma, newline, or quote, wrap in quotes and escape internal quotes
        if (value.includes(',') || value.includes('\n') || value.includes('"')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      };

      // Generate CSV content with proper escaping
      const csvContent = [
        ['PIN Code', 'Delivery Charge', 'Locality', 'Status', 'Created At'],
        ...result.data.pinCodes.map((pc: DeliveryPinCode) => [
          pc.pinCode,
          pc.deliveryCharge.toString(),
          escapeCsvValue(pc.locality), // Properly escape locality with commas
          pc.status,
          pc.createdAt
        ])
      ].map(row => row.join(',')).join('\n');

      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `delivery-pin-codes-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting PIN codes to CSV:', error);
      throw error;
    }
  }

  // Download CSV template
  downloadTemplate(): void {
    // Helper function to properly escape CSV values
    const escapeCsvValue = (value: string): string => {
      // If value contains comma, newline, or quote, wrap in quotes and escape internal quotes
      if (value.includes(',') || value.includes('\n') || value.includes('"')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csvContent = [
      ['PIN Code', 'Delivery Charge', 'Locality', 'Status'],
      ['110001', '50', escapeCsvValue('Connaught Place, New Delhi'), 'active'],
      ['400001', '75', escapeCsvValue('Fort, Mumbai'), 'active'],
      ['560001', '60', escapeCsvValue('Bangalore City, Bangalore'), 'inactive'],
      ['700001', '55', escapeCsvValue('BBD Bagh, Kolkata'), 'active'],
      ['600001', '70', escapeCsvValue('Chennai Central, Chennai'), 'active']
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'delivery-pin-codes-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  // Parse CSV file and upload PIN codes
  async parseAndUploadCSV(file: File): Promise<{ success: number; failed: number; errors: string[] }> {
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('CSV file must contain at least a header row and one data row');
      }

      // Parse header row
      const headers = this.parseCSVLine(lines[0]);
      const expectedHeaders = ['PIN Code', 'Delivery Charge', 'Locality', 'Status'];
      
      // Validate headers
      const headerMap: { [key: string]: number } = {};
      expectedHeaders.forEach(expectedHeader => {
        const index = headers.findIndex(header => 
          header.toLowerCase().trim() === expectedHeader.toLowerCase()
        );
        if (index === -1) {
          throw new Error(`Missing required column: ${expectedHeader}`);
        }
        headerMap[expectedHeader.toLowerCase()] = index;
      });

      // Parse data rows
      const csvData = [];
      for (let i = 1; i < lines.length; i++) {
        const values = this.parseCSVLine(lines[i]);
        
        if (values.length === 0) continue; // Skip empty rows
        
        csvData.push({
          pinCode: values[headerMap['pin code']]?.trim(),
          deliveryCharge: values[headerMap['delivery charge']]?.trim(),
          locality: values[headerMap['locality']]?.trim(),
          status: values[headerMap['status']]?.trim() || 'active'
        });
      }

      if (csvData.length === 0) {
        throw new Error('No valid data rows found in CSV file');
      }

      // Upload to backend
      const result = await apiClient.post<{ success: number; failed: number; errors: string[] }>('/delivery-pin-codes/bulk-upload', { csvData });
      
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Failed to upload CSV data');
      }

      return result.data;
    } catch (error) {
      console.error('Error parsing CSV:', error);
      throw error;
    }
  }

  // Update PIN code order
  async updateDeliveryPinCodeOrder(pinCodeOrders: PinCodeOrderUpdate[]): Promise<{ updatedCount: number }> {
    try {
      const result = await apiClient.patch<{ updatedCount: number }>('/delivery-pin-codes/update-order', {
        pinCodeOrders
      });
      
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Failed to update PIN code order');
      }

      return result.data;
    } catch (error) {
      console.error('Error updating PIN code order:', error);
      throw error;
    }
  }

  // Helper function to parse CSV line with proper handling of quoted values
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i += 2;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current);
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }

    // Add the last field
    result.push(current);
    return result;
  }
}

export const deliveryPinCodeService = new DeliveryPinCodeService();
