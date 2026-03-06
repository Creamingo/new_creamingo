import React, { useState, useEffect } from 'react';
import { BarChart3, MessageCircle, TrendingUp, AlertCircle, Calendar, Loader2, Eye, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal, ModalFooter } from '../components/ui/Modal';
import chatbotService, { AnalyticsSummary, ChatSession } from '../services/chatbotService';
import { useToastContext } from '../contexts/ToastContext';

export const ChatAnalytics: React.FC = () => {
  const [from, setFrom] = useState(() => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [viewingSession, setViewingSession] = useState<{ session_id: string; messages: { role: string; content: string; created_at: string; is_fallback?: boolean }[] } | null>(null);
  const { showError } = useToastContext();

  const loadSummary = async () => {
    try {
      const data = await chatbotService.getAnalyticsSummary(from, to);
      setSummary(data);
    } catch (e) {
      showError('Failed to load summary');
    }
  };

  const loadSessions = async (page = 1) => {
    try {
      const { data, pagination: p } = await chatbotService.getSessions(from, to, page, pagination.limit);
      setSessions(data);
      setPagination((prev) => ({ ...prev, ...p }));
    } catch (e) {
      showError('Failed to load sessions');
    }
  };

  useEffect(() => {
    setPagination((p) => ({ ...p, page: 1 }));
  }, [from, to]);

  useEffect(() => {
    setLoading(true);
    loadSummary().finally(() => setLoading(false));
  }, [from, to]);

  useEffect(() => {
    setLoading(true);
    loadSessions(pagination.page).finally(() => setLoading(false));
  }, [from, to, pagination.page]);

  const openSession = async (sessionId: string) => {
    try {
      const data = await chatbotService.getSessionMessages(sessionId);
      setViewingSession({
        session_id: data.session_id,
        messages: data.messages.map((m) => ({ role: m.role, content: m.content, created_at: m.created_at, is_fallback: m.is_fallback }))
      });
    } catch (e) {
      showError('Failed to load conversation');
    }
  };

  if (loading && !summary) {
    return (
      <div className="p-4 lg:p-6 flex justify-center items-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-8 h-8 text-pink-500" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chat Analytics</h1>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded border border-gray-300 dark:border-gray-600 px-2 py-1 text-sm bg-white dark:bg-gray-800" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">to</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded border border-gray-300 dark:border-gray-600 px-2 py-1 text-sm bg-white dark:bg-gray-800" />
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                <MessageCircle className="w-4 h-4" /> Conversations
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{summary.totalConversations}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                <TrendingUp className="w-4 h-4" /> Total messages
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{summary.totalMessages}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                <AlertCircle className="w-4 h-4" /> Fallback rate
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{summary.fallbackRate}%</p>
            </CardContent>
          </Card>
        </div>
      )}

      {summary && summary.topUnmatched && summary.topUnmatched.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Top unmatched queries (add these as FAQs?)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {summary.topUnmatched.slice(0, 10).map((u, i) => (
                <li key={i} className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300 truncate max-w-md">&quot;{u.query}&quot;</span>
                  <span className="text-gray-500">{u.count}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent conversations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2">Session</th>
                  <th className="text-left py-2">Started</th>
                  <th className="text-left py-2">Messages</th>
                  <th className="text-left py-2">Had fallback</th>
                  <th className="text-right py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 font-mono text-xs truncate max-w-[120px]">{s.session_id}</td>
                    <td className="py-2 text-gray-600 dark:text-gray-400">{new Date(s.started_at).toLocaleString()}</td>
                    <td className="py-2">{s.message_count}</td>
                    <td className="py-2">{s.had_fallback ? 'Yes' : 'No'}</td>
                    <td className="py-2 text-right">
                      <Button variant="secondary" size="sm" onClick={() => openSession(s.session_id)} className="flex items-center gap-1 ml-auto">
                        <Eye className="w-3 h-3" /> View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button variant="secondary" size="sm" disabled={pagination.page <= 1} onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}>Prev</Button>
              <span className="py-1 px-2">Page {pagination.page} of {pagination.pages}</span>
              <Button variant="secondary" size="sm" disabled={pagination.page >= pagination.pages} onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}>Next</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {viewingSession && (
        <Modal isOpen={true} onClose={() => setViewingSession(null)} title={`Conversation ${viewingSession.session_id.slice(0, 8)}...`}>
          <div className="max-h-[60vh] overflow-y-auto space-y-2">
            {viewingSession.messages.map((m, i) => (
              <div key={i} className={`rounded-lg p-3 text-sm ${m.role === 'user' ? 'bg-pink-50 dark:bg-pink-900/20 ml-8' : 'bg-gray-100 dark:bg-gray-800 mr-8'}`}>
                <span className="font-medium text-xs text-gray-500">{m.role} · {new Date(m.created_at).toLocaleString()}{m.is_fallback ? ' (fallback)' : ''}</span>
                <p className="mt-1 whitespace-pre-wrap">{m.content}</p>
              </div>
            ))}
          </div>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setViewingSession(null)}>Close</Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
};
