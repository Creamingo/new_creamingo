import React, { useState, useEffect } from 'react';
import { Ticket as TicketIcon, Loader2, Eye, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal, ModalFooter } from '../components/ui/Modal';
import ticketService, { SupportTicket, TicketMessage } from '../services/ticketService';
import { useToastContext } from '../contexts/ToastContext';

const STATUS_OPTIONS: SupportTicket['status'][] = ['open', 'in_progress', 'resolved', 'closed'];

export const Tickets: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [viewingTicket, setViewingTicket] = useState<{ ticket: SupportTicket; messages: TicketMessage[] } | null>(null);
  const [updatingTicket, setUpdatingTicket] = useState<SupportTicket | null>(null);
  const [updateStatus, setUpdateStatus] = useState<SupportTicket['status']>('open');
  const [updateNotes, setUpdateNotes] = useState('');
  const { showError, showSuccess } = useToastContext();

  const loadTickets = async (page = 1) => {
    try {
      setLoading(true);
      const { data, pagination: p } = await ticketService.list({
        status: statusFilter || undefined,
        page,
        limit: pagination.limit
      });
      setTickets(data);
      setPagination((prev) => ({ ...prev, ...p }));
    } catch (e) {
      showError('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPagination((p) => ({ ...p, page: 1 }));
  }, [statusFilter]);

  useEffect(() => {
    loadTickets(pagination.page);
  }, [statusFilter, pagination.page]);

  const openConversation = async (ticket: SupportTicket) => {
    try {
      const messages = await ticketService.getMessages(ticket.id);
      setViewingTicket({ ticket, messages });
    } catch (e) {
      showError('Failed to load conversation');
    }
  };

  const openUpdate = (ticket: SupportTicket) => {
    setUpdatingTicket(ticket);
    setUpdateStatus(ticket.status);
    setUpdateNotes(ticket.admin_notes || '');
  };

  const submitUpdate = async () => {
    if (!updatingTicket) return;
    try {
      await ticketService.update(updatingTicket.id, { status: updateStatus, admin_notes: updateNotes });
      showSuccess('Ticket updated');
      setUpdatingTicket(null);
      loadTickets(pagination.page);
    } catch (e) {
      showError('Failed to update ticket');
    }
  };

  if (loading && tickets.length === 0) {
    return (
      <div className="p-4 lg:p-6 flex justify-center items-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="flex items-center gap-2 mb-6">
        <TicketIcon className="w-8 h-8 text-pink-500" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Support Tickets</h1>
      </div>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
        Tickets are created when customers use Help &rarr; Raise Ticket. Use this list to respond promptly.
      </p>

      <div className="flex flex-wrap gap-4 mb-6">
        <label className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded border border-gray-300 dark:border-gray-600 px-2 py-1 text-sm bg-white dark:bg-gray-800"
          >
            <option value="">All</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </label>
        <Button variant="secondary" size="sm" onClick={() => loadTickets(pagination.page)} className="flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ticket list</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2">Ticket</th>
                  <th className="text-left py-2">Subject</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Created</th>
                  <th className="text-right py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">No tickets found.</td>
                  </tr>
                ) : (
                  tickets.map((t) => (
                    <tr key={t.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-2 font-mono font-medium">{t.ticket_number}</td>
                      <td className="py-2 text-gray-700 dark:text-gray-300 truncate max-w-[200px]" title={t.subject || ''}>{t.subject || '—'}</td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          t.status === 'open' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200' :
                          t.status === 'in_progress' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200' :
                          t.status === 'resolved' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' :
                          'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}>
                          {t.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">{new Date(t.created_at).toLocaleString()}</td>
                      <td className="py-2 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="secondary" size="sm" onClick={() => openConversation(t)} className="flex items-center gap-1">
                            <Eye className="w-3 h-3" /> View
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => openUpdate(t)}>Update</Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
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

      {viewingTicket && (
        <Modal isOpen={true} onClose={() => setViewingTicket(null)} title={`Ticket ${viewingTicket.ticket.ticket_number}`}>
          <p className="text-xs text-gray-500 mb-2">Subject: {viewingTicket.ticket.subject || '—'} · Status: {viewingTicket.ticket.status}</p>
          <div className="max-h-[60vh] overflow-y-auto space-y-2">
            {viewingTicket.messages.map((m, i) => (
              <div key={i} className={`rounded-lg p-3 text-sm ${m.role === 'user' ? 'bg-pink-50 dark:bg-pink-900/20 ml-8' : 'bg-gray-100 dark:bg-gray-800 mr-8'}`}>
                <span className="font-medium text-xs text-gray-500">{m.role} · {new Date(m.created_at).toLocaleString()}{m.is_fallback ? ' (fallback)' : ''}</span>
                <p className="mt-1 whitespace-pre-wrap">{m.content}</p>
              </div>
            ))}
          </div>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setViewingTicket(null)}>Close</Button>
            <Button onClick={() => { openUpdate(viewingTicket.ticket); setViewingTicket(null); }}>Update status</Button>
          </ModalFooter>
        </Modal>
      )}

      {updatingTicket && (
        <Modal isOpen={true} onClose={() => setUpdatingTicket(null)} title={`Update ${updatingTicket.ticket_number}`}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                value={updateStatus}
                onChange={(e) => setUpdateStatus(e.target.value as SupportTicket['status'])}
                className="w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Admin notes (internal)</label>
              <textarea
                value={updateNotes}
                onChange={(e) => setUpdateNotes(e.target.value)}
                rows={3}
                className="w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800"
                placeholder="Notes for team..."
              />
            </div>
          </div>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setUpdatingTicket(null)}>Cancel</Button>
            <Button onClick={submitUpdate}>Save</Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
};
