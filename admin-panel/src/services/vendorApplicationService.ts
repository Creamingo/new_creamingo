import apiClient from './api';

export type VendorApplicationStatus = 'pending' | 'contacted' | 'approved' | 'rejected';

export interface VendorApplication {
  id: number;
  name: string;
  email: string;
  phone: string;
  shop_name: string | null;
  category_ids: string;
  customer_id: number | null;
  status: VendorApplicationStatus;
  admin_notes: string | null;
  contact_preference?: 'phone' | 'whatsapp' | 'email';
  city?: string | null;
  pincode?: string | null;
  gst_number?: string | null;
  shop_document_url?: string | null;
  id_document_url?: string | null;
  document_checklist?: DocumentChecklist | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentChecklist {
  id_received?: boolean;
  shop_received?: boolean;
  gst_verified?: boolean;
}

export interface VendorApplicationCounts {
  pending: number;
  contacted: number;
  approved: number;
  rejected: number;
  total: number;
}

export interface VendorEmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  cake_bakery: 'Cake and Bakery Related',
  flowers: 'Flowers and Related',
  sweets: 'Sweets and Related',
  dry_fruits: 'Dry Fruits and Related',
  gifting: 'Gifting Items and Related',
  plants: 'Plants and Related'
};

export function getCategoryLabel(slugOrIds: string): string {
  if (!slugOrIds || !String(slugOrIds).trim()) return '—';
  const slugs = String(slugOrIds).split(',').map((s) => s.trim()).filter(Boolean);
  const labels = slugs.map((slug) => CATEGORY_LABELS[slug] || slug);
  return labels.length ? labels.join(', ') : '—';
}

interface ListParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface ListResponse {
  data: VendorApplication[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

class VendorApplicationService {
  async list(params?: ListParams): Promise<ListResponse> {
    const search = new URLSearchParams();
    if (params?.status) search.append('status', params.status);
    if (params?.search?.trim()) search.append('search', params.search.trim());
    if (params?.page != null) search.append('page', String(params.page));
    if (params?.limit != null) search.append('limit', String(params.limit));
    const res = await apiClient.get<VendorApplication[]>(`/vendor-applications?${search.toString()}`);
    const data = (res as any).data ?? [];
    const pagination = (res as any).pagination ?? { page: 1, limit: 20, total: 0, pages: 0 };
    return { data, pagination };
  }

  async getById(id: number): Promise<VendorApplication> {
    const res = await apiClient.get<VendorApplication>(`/vendor-applications/${id}`);
    return (res as any).data!;
  }

  async update(id: number, data: { status?: VendorApplicationStatus; admin_notes?: string; document_checklist?: DocumentChecklist }): Promise<VendorApplication> {
    const res = await apiClient.patch<VendorApplication>(`/vendor-applications/${id}`, data);
    return (res as any).data!;
  }

  async getCounts(): Promise<VendorApplicationCounts> {
    const res = await apiClient.get<VendorApplicationCounts>('/vendor-applications/counts');
    return (res as any).data!;
  }

  async getEmailTemplates(): Promise<VendorEmailTemplate[]> {
    const res = await apiClient.get<VendorEmailTemplate[]>('/vendor-applications/email-templates');
    return (res as any).data ?? [];
  }

  async sendEmail(id: number, payload: { template_id?: string; subject: string; body: string }): Promise<void> {
    await apiClient.post(`/vendor-applications/${id}/send-email`, payload);
  }

  async bulkUpdateStatus(ids: number[], status: VendorApplicationStatus): Promise<{ updated: number }> {
    const res = await apiClient.post<{ updated: number }>('/vendor-applications/bulk-status', { ids, status });
    return (res as any).data ?? { updated: ids.length };
  }

  async exportCsv(params?: { status?: string; search?: string; limit?: number }): Promise<Blob> {
    const base = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    const search = new URLSearchParams();
    if (params?.status) search.append('status', params.status);
    if (params?.search?.trim()) search.append('search', params.search.trim());
    if (params?.limit != null) search.append('limit', String(params.limit));
    const url = `${base}/vendor-applications/export?${search.toString()}`;
    const token = localStorage.getItem('auth_token');
    const response = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!response.ok) throw new Error('Export failed');
    return response.blob();
  }

  async getFunnelAnalytics(): Promise<{ byStatus: VendorApplicationCounts; byDay: { date: string; pending: number; contacted: number; approved: number; rejected: number }[] }> {
    const res = await apiClient.get<any>('/vendor-applications/analytics/funnel');
    return (res as any).data ?? { byStatus: { pending: 0, contacted: 0, approved: 0, rejected: 0, total: 0 }, byDay: [] };
  }
}

export default new VendorApplicationService();
