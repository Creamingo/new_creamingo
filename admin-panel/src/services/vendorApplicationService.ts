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
  created_at: string;
  updated_at: string;
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
  const slug = (slugOrIds || '').split(',')[0].trim();
  return CATEGORY_LABELS[slug] || slug || '—';
}

interface ListParams {
  status?: string;
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

  async update(id: number, data: { status?: VendorApplicationStatus; admin_notes?: string }): Promise<VendorApplication> {
    const res = await apiClient.patch<VendorApplication>(`/vendor-applications/${id}`, data);
    return (res as any).data!;
  }
}

export default new VendorApplicationService();
