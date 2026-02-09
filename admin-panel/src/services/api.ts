/**
 * API Client Service
 * Centralized service for making HTTP requests to the backend API
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
// Log once to verify which API base URL is used in this build.
console.info('[api] Using API base URL:', API_BASE_URL);

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  requireAuth?: boolean;
  _retry?: boolean;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.loadToken();
  }

  /**
   * Load token from localStorage
   */
  private loadToken(): void {
    this.token = localStorage.getItem('auth_token');
  }

  /**
   * Set authentication token
   */
  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  /**
   * Clear authentication token
   */
  clearToken(): void {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  /**
   * Get authentication headers
   */
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async refreshAccessToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success || !data?.data?.token) {
        return false;
      }

      this.setToken(data.data.token);
      if (data.data.refresh_token) {
        localStorage.setItem('refresh_token', data.data.refresh_token);
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Make HTTP request
   */
  private async request<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      requireAuth = true,
      _retry = false
    } = options;

    // Check if authentication is required
    if (requireAuth && !this.token) {
      throw new Error('Authentication required');
    }

    const url = `${this.baseURL}${endpoint}`;
    const requestHeaders = {
      ...this.getAuthHeaders(),
      ...headers,
    };

    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json().catch(() => ({}));

      // Handle authentication errors
      if (response.status === 401) {
        if (requireAuth && !_retry) {
          const refreshed = await this.refreshAccessToken();
          if (refreshed) {
            return this.request<T>(endpoint, { ...options, _retry: true });
          }
        }

        this.clearToken();
        localStorage.removeItem('refresh_token');
        // Use the specific error message from the backend instead of generic message
        throw new Error(data.message || 'Authentication failed');
      }

      // Handle other HTTP errors
      if (!response.ok) {
        const backendError = data?.error ? ` - ${data.error}` : '';
        const backendDetails = data?.details ? ` (${JSON.stringify(data.details)})` : '';
        const message = data.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(`${message}${backendError}${backendDetails}`);
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, requireAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', requireAuth });
  }

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, data?: any, requireAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body: data, requireAuth });
  }

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, data?: any, requireAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body: data, requireAuth });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, requireAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', requireAuth });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(endpoint: string, data?: any, requireAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PATCH', body: data, requireAuth });
  }

  /**
   * GET request that returns a Blob (for PDF downloads, etc.)
   */
  async getBlob(endpoint: string, requireAuth: boolean = true): Promise<Blob> {
    // Check if authentication is required
    if (requireAuth && !this.token) {
      throw new Error('Authentication required');
    }

    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {};
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (response.status === 401) {
        this.clearToken();
        throw new Error('Authentication failed');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to download file' }));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Blob Download Error:', error);
      throw error;
    }
  }

  /**
   * Upload file
   */
  async uploadFile(endpoint: string, file: File, requireAuth: boolean = true): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('image', file);

    return this.uploadFormData(endpoint, formData, requireAuth);
  }

  /**
   * Upload FormData with auth + refresh support
   */
  async uploadFormData(endpoint: string, formData: FormData, requireAuth: boolean = true, _retry: boolean = false): Promise<ApiResponse> {
    if (requireAuth && !this.token) {
      throw new Error('Authentication required');
    }

    const headers: Record<string, string> = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        if (requireAuth && !_retry) {
          const refreshed = await this.refreshAccessToken();
          if (refreshed) {
            return this.uploadFormData(endpoint, formData, requireAuth, true);
          }
        }

        this.clearToken();
        localStorage.removeItem('refresh_token');
        throw new Error(data.message || 'Authentication failed');
      }

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('File Upload Error:', error);
      throw error;
    }
  }
}

// Create singleton instance
const apiClient = new ApiClient(API_BASE_URL);

export default apiClient;

// Export types
export type { ApiResponse, RequestOptions };
