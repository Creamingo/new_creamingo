import apiClient from './api';

export interface ChatbotIntent {
  id: number;
  name: string;
  keywords: string[];
  reply: string;
  link_text: string | null;
  link_href: string | null;
  quick_replies: string[] | null;
  sort_order: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface ChatbotFaq {
  id: number;
  keywords: string;
  response: string;
  link_text: string | null;
  link_href: string | null;
  sort_order: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface CreateIntentData {
  name: string;
  keywords: string[];
  reply: string;
  link_text?: string | null;
  link_href?: string | null;
  quick_replies?: string[] | null;
  sort_order?: number;
  is_active?: boolean;
}

export interface UpdateIntentData {
  name?: string;
  keywords?: string[];
  reply?: string;
  link_text?: string | null;
  link_href?: string | null;
  quick_replies?: string[] | null;
  sort_order?: number;
  is_active?: boolean;
}

export interface CreateFaqData {
  keywords: string;
  response: string;
  link_text?: string | null;
  link_href?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export interface UpdateFaqData {
  keywords?: string;
  response?: string;
  link_text?: string | null;
  link_href?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export interface AnalyticsSummary {
  from: string;
  to: string;
  totalConversations: number;
  totalMessages: number;
  fallbackRate: number;
  messagesByDay: { day: string; count: number }[];
  topIntents: { intent_id: number; count: number }[];
  topUnmatched: { query: string; count: number }[];
}

export interface ChatSession {
  id: number;
  session_id: string;
  customer_id: number | null;
  started_at: string;
  ended_at: string | null;
  message_count: number;
  had_fallback: boolean;
}

export interface SessionMessages {
  session_id: string;
  started_at: string;
  messages: { id: number; role: string; content: string; intent_id: number | null; faq_id: number | null; is_fallback: boolean; created_at: string }[];
}

class ChatbotService {
  async getIntents(): Promise<ChatbotIntent[]> {
    const res = await apiClient.get<ChatbotIntent[]>('/chat/config/intents');
    return res.data || [];
  }

  async createIntent(data: CreateIntentData): Promise<{ id: number }> {
    const res = await apiClient.post<{ id: number }>('/chat/config/intents', data);
    return res.data!;
  }

  async updateIntent(id: number, data: UpdateIntentData): Promise<void> {
    await apiClient.put(`/chat/config/intents/${id}`, data);
  }

  async deleteIntent(id: number): Promise<void> {
    await apiClient.delete(`/chat/config/intents/${id}`);
  }

  async getFaqs(): Promise<ChatbotFaq[]> {
    const res = await apiClient.get<ChatbotFaq[]>('/chat/config/faqs');
    return res.data || [];
  }

  async createFaq(data: CreateFaqData): Promise<{ id: number }> {
    const res = await apiClient.post<{ id: number }>('/chat/config/faqs', data);
    return res.data!;
  }

  async updateFaq(id: number, data: UpdateFaqData): Promise<void> {
    await apiClient.put(`/chat/config/faqs/${id}`, data);
  }

  async deleteFaq(id: number): Promise<void> {
    await apiClient.delete(`/chat/config/faqs/${id}`);
  }

  async getAnalyticsSummary(from?: string, to?: string): Promise<AnalyticsSummary> {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const res = await apiClient.get<AnalyticsSummary>(`/chat/analytics/summary?${params.toString()}`);
    return res.data!;
  }

  async getSessions(from?: string, to?: string, page = 1, limit = 20): Promise<{ data: ChatSession[]; pagination: { page: number; limit: number; total: number; pages: number } }> {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    params.append('page', String(page));
    params.append('limit', String(limit));
    const res = await apiClient.get<ChatSession[]>(`/chat/analytics/sessions?${params.toString()}`);
    const pagination = (res as any).pagination || { page: 1, limit: 20, total: 0, pages: 0 };
    return { data: res.data || [], pagination };
  }

  async getSessionMessages(sessionId: string): Promise<SessionMessages> {
    const res = await apiClient.get<SessionMessages>(`/chat/analytics/sessions/${encodeURIComponent(sessionId)}/messages`);
    return res.data!;
  }
}

export default new ChatbotService();
