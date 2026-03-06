import React, { useState, useEffect } from 'react';
import { Store, Loader2, Eye, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal, ModalFooter } from '../components/ui/Modal';
import vendorApplicationService, {
  VendorApplication,
  VendorApplicationStatus,
  getCategoryLabel
} from '../services/vendorApplicationService';
import { useToastContext } from '../contexts/ToastContext';

const STATUS_OPTIONS: VendorApplicationStatus[] = ['pending', 'contacted', 'approved', 'rejected'];

export const VendorApplications: React.FC = () => {
  const [applications, setApplications] = useState<VendorApplication[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<VendorApplication | null>(null);
  const [updating, setUpdating] = useState<VendorApplication | null>(null);
  const [updateStatus, setUpdateStatus] = useState<VendorApplicationStatus>('pending');
  const [updateNotes, setUpdateNotes] = useState('');
  const { showError, showSuccess } = useToastContext();

  const load = async (page = 1) => {
    try {
      setLoading(true);
      const { data, pagination: p } = await vendorApplicationService.list({
        status: statusFilter || undefined,
        page,
        limit: pagination.limit
      });
      setApplications(data);
      setPagination((prev) => ({ ...prev, ...p }));
    } catch (e) {
      showError('Failed to load vendor applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPagination((p) => ({ ...p, page: 1 }));
  }, [statusFilter]);

  useEffect(() => {
    load(pagination.page);
  }, [statusFilter, pagination.page]);

  const openUpdate = (app: VendorApplication) => {
    setUpdating(app);
    setUpdateStatus(app.status);
    setUpdateNotes(app.admin_notes || '');
  };

  const submitUpdate = async () => {
    if (!updating) return;
    try {
      await vendorApplicationService.update(updating.id, { status: updateStatus, admin_notes: updateNotes });
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
        <Button variant="secondary" size="sm" onClick={() => load(pagination.page)} className="flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
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
                    <td colSpan={6} className="py-8 text-center text-gray-500">No applications found.</td>
                  </tr>
                ) : (
                  applications.map((app) => (
                    <tr key={app.id} className="border-b border-gray-100 dark:border-gray-800">
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

      {viewing && (
        <Modal isOpen={true} onClose={() => setViewing(null)} title={`Vendor: ${viewing.name}`}>
          <div className="space-y-3 text-sm">
            <p><span className="text-gray-500">Email:</span> <a href={`mailto:${viewing.email}`} className="text-pink-600 dark:text-pink-400">{viewing.email}</a></p>
            <p><span className="text-gray-500">Phone:</span> <a href={`tel:${viewing.phone}`}>{viewing.phone}</a></p>
            <p><span className="text-gray-500">Shop name:</span> {viewing.shop_name || '—'}</p>
            <p><span className="text-gray-500">Category:</span> {getCategoryLabel(viewing.category_ids)}</p>
            <p><span className="text-gray-500">Status:</span> {viewing.status.replace('_', ' ')}</p>
            <p><span className="text-gray-500">Applied:</span> {new Date(viewing.created_at).toLocaleString()}</p>
            {viewing.admin_notes && (
              <p><span className="text-gray-500">Admin notes:</span><br /><span className="whitespace-pre-wrap">{viewing.admin_notes}</span></p>
            )}
          </div>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setViewing(null)}>Close</Button>
            <Button onClick={() => { openUpdate(viewing); setViewing(null); }}>Update status</Button>
          </ModalFooter>
        </Modal>
      )}

      {updating && (
        <Modal isOpen={true} onClose={() => setUpdating(null)} title={`Update application #${updating.id}`}>
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
