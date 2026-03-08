import React, { useState, useEffect, useMemo } from 'react';
import { Store, Loader2, Eye, RefreshCw, Search, Phone, Mail, MessageCircle, LayoutGrid, List, Send, Download, BarChart2, FileText, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal, ModalFooter } from '../components/ui/Modal';
import vendorApplicationService, {
  VendorApplication,
  VendorApplicationStatus,
  VendorEmailTemplate,
  DocumentChecklist,
  getCategoryLabel
} from '../services/vendorApplicationService';
import { useToastContext } from '../contexts/ToastContext';

const STATUS_OPTIONS: VendorApplicationStatus[] = ['pending', 'contacted', 'approved', 'rejected'];

// Build full URL for vendor document (backend serves /gallery at root, not under /api)
function getDocumentUrl(url: string | null | undefined): string {
  if (!url || !String(url).trim()) return '';
  const s = String(url).trim();
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  const apiUrl = process.env.REACT_APP_API_URL || '';
  const base = apiUrl.replace(/\/api\/?$/, '') || 'http://localhost:5000';
  return s.startsWith('/') ? `${base}${s}` : `${base}/${s}`;
}

// Read optional URL from application (handles snake_case or any casing from API/MySQL)
function getAppDocUrl(app: VendorApplication, field: 'shop_document_url' | 'id_document_url'): string | null | undefined {
  const raw = app as unknown as Record<string, unknown>;
  const keys = [field, field.toLowerCase(), field.toUpperCase()];
  for (const k of keys) {
    const v = raw[k];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  return null;
}
const KANBAN_COLUMNS: { status: VendorApplicationStatus; label: string; color: string }[] = [
  { status: 'pending', label: 'Pending', color: 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800' },
  { status: 'contacted', label: 'Contacted', color: 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' },
  { status: 'approved', label: 'Approved', color: 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800' },
  { status: 'rejected', label: 'Rejected', color: 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600' }
];

export const VendorApplications: React.FC = () => {
  const [applications, setApplications] = useState<VendorApplication[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<VendorApplication | null>(null);
  const [updating, setUpdating] = useState<VendorApplication | null>(null);
  const [updateStatus, setUpdateStatus] = useState<VendorApplicationStatus>('pending');
  const [updateNotes, setUpdateNotes] = useState('');
  const [updateChecklist, setUpdateChecklist] = useState<DocumentChecklist>({ id_received: false, shop_received: false, gst_verified: false });
  const [sendEmailApp, setSendEmailApp] = useState<VendorApplication | null>(null);
  const [emailTemplates, setEmailTemplates] = useState<VendorEmailTemplate[]>([]);
  const [sendSubject, setSendSubject] = useState('');
  const [sendBody, setSendBody] = useState('');
  const [sendTemplateId, setSendTemplateId] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<VendorApplicationStatus>('contacted');
  const [bulkApplying, setBulkApplying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [funnel, setFunnel] = useState<{ byStatus: { pending: number; contacted: number; approved: number; rejected: number; total: number }; byDay: { date: string; pending: number; contacted: number; approved: number; rejected: number }[] } | null>(null);
  const { showError, showSuccess } = useToastContext();

  const applicationsByStatus = useMemo(() => {
    const map: Record<VendorApplicationStatus, VendorApplication[]> = { pending: [], contacted: [], approved: [], rejected: [] };
    applications.forEach((app) => {
      if (map[app.status]) map[app.status].push(app);
    });
    return map;
  }, [applications]);

  const load = async (page = 1) => {
    try {
      setLoading(true);
      const limit = viewMode === 'kanban' ? 100 : pagination.limit;
      const { data, pagination: p } = await vendorApplicationService.list({
        status: statusFilter || undefined,
        search: searchQuery || undefined,
        page,
        limit
      });
      setApplications(data);
      setPagination((prev) => ({ ...prev, ...p, limit }));
    } catch (e) {
      showError('Failed to load vendor applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPagination((p) => ({ ...p, page: 1 }));
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    load(pagination.page);
  }, [statusFilter, searchQuery, pagination.page, viewMode]);

  useEffect(() => {
    vendorApplicationService.getFunnelAnalytics().then(setFunnel).catch(() => setFunnel(null));
  }, [applications.length]);

  const applySearch = () => setSearchQuery(searchInput.trim());

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === applications.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(applications.map((a) => a.id)));
  };

  const applyBulkStatus = async () => {
    if (selectedIds.size === 0) return;
    setBulkApplying(true);
    try {
      const res = await vendorApplicationService.bulkUpdateStatus(Array.from(selectedIds), bulkStatus);
      showSuccess(`Updated ${res.updated} application(s) to ${bulkStatus}`);
      setSelectedIds(new Set());
      load(pagination.page);
      vendorApplicationService.getFunnelAnalytics().then(setFunnel);
    } catch {
      showError('Bulk update failed');
    } finally {
      setBulkApplying(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await vendorApplicationService.exportCsv({ status: statusFilter || undefined, search: searchQuery || undefined, limit: 2000 });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vendor-applications-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showSuccess('Export downloaded');
    } catch {
      showError('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const openSendEmail = async (app: VendorApplication) => {
    setSendEmailApp(app);
    setSendSubject('');
    setSendBody('');
    setSendTemplateId('');
    try {
      const t = await vendorApplicationService.getEmailTemplates();
      setEmailTemplates(t);
      if (t.length) {
        const t0 = t[0];
        setSendTemplateId(t0.id);
        setSendSubject((t0.subject || '').replace(/\{\{name\}\}/g, app.name || ''));
        setSendBody((t0.body || '').replace(/\{\{name\}\}/g, app.name || '').replace(/\{\{email\}\}/g, app.email || ''));
      }
    } catch {
      setEmailTemplates([]);
    }
  };

  const onTemplateSelect = (templateId: string) => {
    setSendTemplateId(templateId);
    const t = emailTemplates.find((x) => x.id === templateId);
    if (t) {
      setSendSubject((t.subject || '').replace(/\{\{name\}\}/g, sendEmailApp?.name || ''));
      setSendBody((t.body || '').replace(/\{\{name\}\}/g, sendEmailApp?.name || '').replace(/\{\{email\}\}/g, sendEmailApp?.email || ''));
    }
  };

  const submitSendEmail = async () => {
    if (!sendEmailApp || !sendSubject.trim() || !sendBody.trim()) {
      showError('Subject and body are required');
      return;
    }
    setSendingEmail(true);
    try {
      await vendorApplicationService.sendEmail(sendEmailApp.id, { template_id: sendTemplateId || undefined, subject: sendSubject.trim(), body: sendBody.trim() });
      showSuccess('Email sent');
      setSendEmailApp(null);
    } catch {
      showError('Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  const openUpdate = (app: VendorApplication) => {
    setUpdating(app);
    setUpdateStatus(app.status);
    setUpdateNotes(app.admin_notes || '');
    const raw = app.document_checklist;
    const c = raw == null ? {} : typeof raw === 'string' ? (() => { try { return JSON.parse(raw); } catch { return {}; } })() : (raw as DocumentChecklist);
    setUpdateChecklist({ id_received: !!c.id_received, shop_received: !!c.shop_received, gst_verified: !!c.gst_verified });
  };

  const submitUpdate = async () => {
    if (!updating) return;
    try {
      await vendorApplicationService.update(updating.id, { status: updateStatus, admin_notes: updateNotes, document_checklist: updateChecklist });
      showSuccess('Application updated');
      setUpdating(null);
      load(pagination.page);
      if (viewing?.id === updating.id) setViewing(null);
    } catch (e) {
      showError('Failed to update application');
    }
  };

  if (loading && applications.length === 0) {
    return (
      <div className="p-4 lg:p-6 flex justify-center items-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="flex items-center gap-2 mb-6">
        <Store className="w-8 h-8 text-pink-500" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vendor Applications</h1>
      </div>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
        Applications from the &quot;Become a Vendor&quot; form. Notifications are sent to team.creamingo@gmail.com.
      </p>

      {funnel && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-pink-500" />
              Funnel
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <div className="flex gap-4">
              <span className="text-sm"><span className="font-semibold text-amber-600">{funnel.byStatus.pending}</span> Pending</span>
              <span className="text-sm"><span className="font-semibold text-blue-600">{funnel.byStatus.contacted}</span> Contacted</span>
              <span className="text-sm"><span className="font-semibold text-green-600">{funnel.byStatus.approved}</span> Approved</span>
              <span className="text-sm"><span className="font-semibold text-gray-600">{funnel.byStatus.rejected}</span> Rejected</span>
              <span className="text-sm text-gray-500">Total: {funnel.byStatus.total}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applySearch()}
            placeholder="Search name, email, phone..."
            className="rounded border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-sm bg-white dark:bg-gray-800 flex-1"
          />
          <Button variant="secondary" size="sm" onClick={applySearch}>Search</Button>
        </div>
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
        <Button variant="secondary" size="sm" onClick={() => load(pagination.page)} className="flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> Refresh
        </Button>
        <Button variant="secondary" size="sm" onClick={handleExport} disabled={exporting} className="flex items-center gap-1">
          {exporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />} Export CSV
        </Button>
        <div className="flex gap-1">
          <Button variant={viewMode === 'table' ? 'primary' : 'secondary'} size="sm" onClick={() => setViewMode('table')} className="flex items-center gap-1">
            <List className="w-3 h-3" /> Table
          </Button>
          <Button variant={viewMode === 'kanban' ? 'primary' : 'secondary'} size="sm" onClick={() => setViewMode('kanban')} className="flex items-center gap-1">
            <LayoutGrid className="w-3 h-3" /> Pipeline
          </Button>
        </div>
      </div>

      {selectedIds.size > 0 && viewMode === 'table' && (
        <div className="mb-4 p-3 rounded-lg bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value as VendorApplicationStatus)}
            className="rounded border border-gray-300 dark:border-gray-600 px-2 py-1 text-sm bg-white dark:bg-gray-800"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>Mark as {s.replace('_', ' ')}</option>
            ))}
          </select>
          <Button size="sm" onClick={applyBulkStatus} disabled={bulkApplying}>
            {bulkApplying ? 'Applying…' : 'Apply'}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setSelectedIds(new Set())}>Clear</Button>
        </div>
      )}

      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {KANBAN_COLUMNS.map((col) => (
            <div key={col.status} className={`rounded-xl border-2 ${col.color} p-3 min-h-[200px]`}>
              <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-2 flex items-center justify-between">
                {col.label}
                <span className="font-normal text-gray-500">{applicationsByStatus[col.status].length}</span>
              </h3>
              <div className="space-y-2">
                {applicationsByStatus[col.status].map((app) => (
                  <div
                    key={app.id}
                    className="bg-white dark:bg-gray-800 rounded-lg p-2.5 shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer hover:shadow-md transition"
                    onClick={() => setViewing(app)}
                  >
                    <p className="font-mono text-xs font-medium text-pink-600 dark:text-pink-400 mb-0.5">VA-{app.id}</p>
                    <p className="font-medium text-sm truncate">{app.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{app.email}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{getCategoryLabel(app.category_ids)}</p>
                    <div className="flex gap-1 mt-2">
                      <Button variant="secondary" size="sm" className="text-xs" onClick={(e) => { e.stopPropagation(); setViewing(app); }}>View</Button>
                      <Button variant="secondary" size="sm" className="text-xs" onClick={(e) => { e.stopPropagation(); openUpdate(app); }}>Update</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="w-10 py-2">
                    <input type="checkbox" checked={applications.length > 0 && selectedIds.size === applications.length} onChange={selectAll} className="rounded" />
                  </th>
                  <th className="text-left py-2">Application ID</th>
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">Email / Phone</th>
                  <th className="text-left py-2">Category</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Created</th>
                  <th className="text-right py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-500">No applications found.</td>
                  </tr>
                ) : (
                  applications.map((app) => (
                    <tr key={app.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-2">
                        <input type="checkbox" checked={selectedIds.has(app.id)} onChange={() => toggleSelect(app.id)} className="rounded" />
                      </td>
                      <td className="py-2 font-mono text-sm font-medium text-pink-600 dark:text-pink-400">VA-{app.id}</td>
                      <td className="py-2 font-medium">{app.name}</td>
                      <td className="py-2 text-gray-700 dark:text-gray-300">
                        <a href={`mailto:${app.email}`} className="text-pink-600 dark:text-pink-400 hover:underline">{app.email}</a>
                        <br />
                        <a href={`tel:${app.phone}`} className="text-gray-600 dark:text-gray-400">{app.phone}</a>
                      </td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">{getCategoryLabel(app.category_ids)}</td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          app.status === 'pending' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200' :
                          app.status === 'contacted' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200' :
                          app.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' :
                          'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}>
                          {app.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">{new Date(app.created_at).toLocaleString()}</td>
                      <td className="py-2 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="secondary" size="sm" onClick={() => setViewing(app)} className="flex items-center gap-1">
                            <Eye className="w-3 h-3" /> View
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => openUpdate(app)}>Update</Button>
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
      )}

      {viewing && (
        <Modal isOpen={true} onClose={() => setViewing(null)} title={`Vendor: ${viewing.name}`}>
          <div className="space-y-4">
            <p className="font-mono text-sm font-semibold text-pink-600 dark:text-pink-400">Application ID: VA-{viewing.id}</p>
            <div className="flex flex-wrap gap-2">
              <a href={`tel:${viewing.phone}`} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800/50 text-sm font-medium">
                <Phone className="w-4 h-4" /> Call
              </a>
              <a href={`mailto:${viewing.email}`} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800/50 text-sm font-medium">
                <Mail className="w-4 h-4" /> Email
              </a>
              <a href={`https://wa.me/${viewing.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-200 dark:hover:bg-emerald-800/50 text-sm font-medium">
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">Email:</span> <a href={`mailto:${viewing.email}`} className="text-pink-600 dark:text-pink-400">{viewing.email}</a></p>
              <p><span className="text-gray-500">Phone:</span> <a href={`tel:${viewing.phone}`}>{viewing.phone}</a></p>
              <p><span className="text-gray-500">Reach first:</span> {(viewing.contact_preference || 'phone').replace('_', ' ')}</p>
              {(viewing.city || viewing.pincode) && (
                <p><span className="text-gray-500">Location:</span> {[viewing.city, viewing.pincode].filter(Boolean).join(' · ') || '—'}</p>
              )}
              <p><span className="text-gray-500">Shop name:</span> {viewing.shop_name || '—'}</p>
              {viewing.gst_number && <p><span className="text-gray-500">GST:</span> {viewing.gst_number}</p>}
              <p><span className="text-gray-500">Category:</span> {getCategoryLabel(viewing.category_ids)}</p>
              <p><span className="text-gray-500">Status:</span> {viewing.status.replace('_', ' ')}</p>
              <p><span className="text-gray-500">Applied:</span> {new Date(viewing.created_at).toLocaleString()}</p>
            </div>

            {/* Attachments / Documents – same prominence as document checklist */}
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-pink-500" />
                Attachments
              </p>
              {(() => {
                const shopUrl = getAppDocUrl(viewing, 'shop_document_url');
                const idUrl = getAppDocUrl(viewing, 'id_document_url');
                if (shopUrl || idUrl) {
                  return (
                    <div className="flex flex-wrap gap-3">
                      {shopUrl && (
                        <a
                          href={getDocumentUrl(shopUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600"
                        >
                          <FileText className="w-4 h-4 text-pink-500" />
                          Shop / business proof
                          <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                        </a>
                      )}
                      {idUrl && (
                        <a
                          href={getDocumentUrl(idUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600"
                        >
                          <FileText className="w-4 h-4 text-pink-500" />
                          ID proof
                          <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                        </a>
                      )}
                    </div>
                  );
                }
                return <p className="text-sm text-gray-500 dark:text-gray-400">No documents uploaded.</p>;
              })()}
            </div>
            {(() => {
              const checklist = viewing.document_checklist == null ? null : typeof viewing.document_checklist === 'string' ? (() => { try { return JSON.parse(viewing.document_checklist); } catch { return null; } })() : viewing.document_checklist;
              return checklist && typeof checklist === 'object' ? (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-2">Document checklist (admin)</p>
                  <ul className="text-sm space-y-1">
                    <li className={checklist.id_received ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>ID received: {checklist.id_received ? 'Yes' : 'No'}</li>
                    <li className={checklist.shop_received ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>Shop doc received: {checklist.shop_received ? 'Yes' : 'No'}</li>
                    <li className={checklist.gst_verified ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>GST verified: {checklist.gst_verified ? 'Yes' : 'No'}</li>
                  </ul>
                </div>
              ) : null;
            })()}
            {viewing.admin_notes && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="text-gray-500 text-sm font-medium mb-1">Admin notes</p>
                <p className="text-sm whitespace-pre-wrap bg-gray-50 dark:bg-gray-800 p-2 rounded">{viewing.admin_notes}</p>
              </div>
            )}
          </div>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setViewing(null)}>Close</Button>
            <Button variant="secondary" onClick={() => openSendEmail(viewing)} className="flex items-center gap-1">
              <Send className="w-3 h-3" /> Send email
            </Button>
            <Button onClick={() => { openUpdate(viewing); setViewing(null); }}>Update status & notes</Button>
          </ModalFooter>
        </Modal>
      )}

      {sendEmailApp && (
        <Modal isOpen={true} onClose={() => setSendEmailApp(null)} title={`Send email to ${sendEmailApp.name}`}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Template</label>
              <select
                value={sendTemplateId}
                onChange={(e) => onTemplateSelect(e.target.value)}
                className="w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800"
              >
                <option value="">Custom</option>
                {emailTemplates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject *</label>
              <input
                type="text"
                value={sendSubject}
                onChange={(e) => setSendSubject(e.target.value)}
                className="w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800"
                placeholder="Email subject"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Body (HTML ok) *</label>
              <textarea
                value={sendBody}
                onChange={(e) => setSendBody(e.target.value)}
                rows={6}
                className="w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 font-mono text-sm"
                placeholder="Email body..."
              />
            </div>
          </div>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setSendEmailApp(null)}>Cancel</Button>
            <Button onClick={submitSendEmail} disabled={sendingEmail || !sendSubject.trim() || !sendBody.trim()}>
              {sendingEmail ? 'Sending…' : 'Send email'}
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {updating && (
        <Modal isOpen={true} onClose={() => setUpdating(null)} title={`Update application VA-${updating.id}`}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                value={updateStatus}
                onChange={(e) => setUpdateStatus(e.target.value as VendorApplicationStatus)}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Document checklist</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={updateChecklist.id_received} onChange={(e) => setUpdateChecklist((c) => ({ ...c, id_received: e.target.checked }))} className="rounded" />
                  <span className="text-sm">ID received</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={updateChecklist.shop_received} onChange={(e) => setUpdateChecklist((c) => ({ ...c, shop_received: e.target.checked }))} className="rounded" />
                  <span className="text-sm">Shop doc received</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={updateChecklist.gst_verified} onChange={(e) => setUpdateChecklist((c) => ({ ...c, gst_verified: e.target.checked }))} className="rounded" />
                  <span className="text-sm">GST verified</span>
                </label>
              </div>
            </div>
          </div>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setUpdating(null)}>Cancel</Button>
            <Button onClick={submitUpdate}>Save</Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
};
