import apiClient from './api';

export interface SupportTicket {
  id: number;
  ticket_number: string;
  session_id: string;
  customer_id: number | null;
  subject: string | null;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: number;
  role: string;
  content: string;
  created_at: string;
  is_fallback: boolean;
}

class TicketService {
  async list(params?: { status?: string; page?: number; limit?: number }): Promise<{
    data: SupportTicket[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    const search = new URLSearchParams();
    if (params?.status) search.append('status', params.status);
    if (params?.page != null) search.append('page', String(params.page));
    if (params?.limit != null) search.append('limit', String(params.limit));
    const res = await apiClient.get<SupportTicket[]>(`/tickets?${search.toString()}`);
    const pagination = (res as any).pagination || { page: 1, limit: 20, total: 0, pages: 0 };
    return { data: res.data || [], pagination };
  }

  async getOne(id: number): Promise<SupportTicket> {
    const res = await apiClient.get<SupportTicket>(`/tickets/${id}`);
    return res.data!;
  }

  async getMessages(id: number): Promise<TicketMessage[]> {
    const res = await apiClient.get<TicketMessage[]>(`/tickets/${id}/messages`);
    return res.data || [];
  }

  async update(id: number, data: { status?: SupportTicket['status']; admin_notes?: string }): Promise<SupportTicket> {
    const res = await apiClient.patch<SupportTicket>(`/tickets/${id}`, data);
    return res.data!;
  }
}

export default new TicketService();
