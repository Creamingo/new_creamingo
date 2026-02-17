import React, { useState, useEffect } from 'react';
import { MessageCircle, List, FileText, Plus, Edit, Trash2, Loader2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal, ModalFooter } from '../components/ui/Modal';
import chatbotService, { ChatbotIntent, ChatbotFaq, CreateIntentData, CreateFaqData } from '../services/chatbotService';
import { useToastContext } from '../contexts/ToastContext';

type Tab = 'intents' | 'faqs';

export const ChatbotAnswers: React.FC = () => {
  const [tab, setTab] = useState<Tab>('intents');
  const [intents, setIntents] = useState<ChatbotIntent[]>([]);
  const [faqs, setFaqs] = useState<ChatbotFaq[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIntent, setEditingIntent] = useState<ChatbotIntent | null>(null);
  const [editingFaq, setEditingFaq] = useState<ChatbotFaq | null>(null);
  const [formIntent, setFormIntent] = useState<CreateIntentData>({ name: '', keywords: [], reply: '', sort_order: 0, is_active: true });
  const [formFaq, setFormFaq] = useState<CreateFaqData>({ keywords: '', response: '', sort_order: 0, is_active: true });
  const [keywordsStr, setKeywordsStr] = useState('');
  const [quickRepliesStr, setQuickRepliesStr] = useState('');
  const [saving, setSaving] = useState(false);
  const { showSuccess, showError } = useToastContext();

  const loadIntents = async () => {
    try {
      const data = await chatbotService.getIntents();
      setIntents(data);
    } catch (e) {
      showError('Failed to load intents');
    }
  };

  const loadFaqs = async () => {
    try {
      const data = await chatbotService.getFaqs();
      setFaqs(data);
    } catch (e) {
      showError('Failed to load FAQs');
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadIntents(), loadFaqs()]).finally(() => setLoading(false));
  }, []);

  const openAddIntent = () => {
    setEditingIntent(null);
    setFormIntent({ name: '', keywords: [], reply: '', link_text: null, link_href: null, quick_replies: null, sort_order: intents.length, is_active: true });
    setKeywordsStr('');
    setQuickRepliesStr('');
    setModalOpen(true);
  };

  const openEditIntent = (i: ChatbotIntent) => {
    setEditingIntent(i);
    setFormIntent({
      name: i.name,
      keywords: i.keywords || [],
      reply: i.reply,
      link_text: i.link_text,
      link_href: i.link_href,
      quick_replies: i.quick_replies || null,
      sort_order: i.sort_order,
      is_active: !!i.is_active
    });
    setKeywordsStr(Array.isArray(i.keywords) ? i.keywords.join(', ') : '');
    setQuickRepliesStr(Array.isArray(i.quick_replies) ? i.quick_replies.join(', ') : '');
    setModalOpen(true);
  };

  const openAddFaq = () => {
    setEditingFaq(null);
    setFormFaq({ keywords: '', response: '', link_text: null, link_href: null, sort_order: faqs.length, is_active: true });
    setModalOpen(true);
  };

  const openEditFaq = (f: ChatbotFaq) => {
    setEditingFaq(f);
    setFormFaq({
      keywords: f.keywords,
      response: f.response,
      link_text: f.link_text,
      link_href: f.link_href,
      sort_order: f.sort_order,
      is_active: !!f.is_active
    });
    setModalOpen(true);
  };

  const saveIntent = async () => {
    const keywords = keywordsStr.split(',').map((k) => k.trim()).filter(Boolean);
    const quickReplies = quickRepliesStr.split(',').map((k) => k.trim()).filter(Boolean);
    setSaving(true);
    try {
      if (editingIntent) {
        await chatbotService.updateIntent(editingIntent.id, {
          name: formIntent.name,
          keywords,
          reply: formIntent.reply,
          link_text: formIntent.link_text || null,
          link_href: formIntent.link_href || null,
          quick_replies: quickReplies.length ? quickReplies : null,
          sort_order: formIntent.sort_order,
          is_active: formIntent.is_active
        });
        showSuccess('Intent updated');
      } else {
        await chatbotService.createIntent({
          name: formIntent.name,
          keywords,
          reply: formIntent.reply,
          link_text: formIntent.link_text || null,
          link_href: formIntent.link_href || null,
          quick_replies: quickReplies.length ? quickReplies : null,
          sort_order: formIntent.sort_order,
          is_active: formIntent.is_active
        });
        showSuccess('Intent created');
      }
      setModalOpen(false);
      await loadIntents();
    } catch (e) {
      showError('Failed to save intent');
    } finally {
      setSaving(false);
    }
  };

  const saveFaq = async () => {
    setSaving(true);
    try {
      if (editingFaq) {
        await chatbotService.updateFaq(editingFaq.id, {
          keywords: formFaq.keywords,
          response: formFaq.response,
          link_text: formFaq.link_text || null,
          link_href: formFaq.link_href || null,
          sort_order: formFaq.sort_order,
          is_active: formFaq.is_active
        });
        showSuccess('FAQ updated');
      } else {
        await chatbotService.createFaq({
          keywords: formFaq.keywords,
          response: formFaq.response,
          link_text: formFaq.link_text || null,
          link_href: formFaq.link_href || null,
          sort_order: formFaq.sort_order,
          is_active: formFaq.is_active
        });
        showSuccess('FAQ created');
      }
      setModalOpen(false);
      await loadFaqs();
    } catch (e) {
      showError('Failed to save FAQ');
    } finally {
      setSaving(false);
    }
  };

  const deleteIntent = async (id: number) => {
    if (!window.confirm('Delete this intent?')) return;
    try {
      await chatbotService.deleteIntent(id);
      showSuccess('Intent deleted');
      await loadIntents();
    } catch (e) {
      showError('Failed to delete intent');
    }
  };

  const deleteFaq = async (id: number) => {
    if (!window.confirm('Delete this FAQ?')) return;
    try {
      await chatbotService.deleteFaq(id);
      showSuccess('FAQ deleted');
      await loadFaqs();
    } catch (e) {
      showError('Failed to delete FAQ');
    }
  };

  const isIntentModal = editingIntent !== null || (modalOpen && tab === 'intents' && editingFaq === null && !editingIntent && Object.keys(formIntent).length > 0);
  const isFaqModal = editingFaq !== null || (modalOpen && tab === 'faqs' && editingIntent === null);

  return (
    <div className="p-4 lg:p-6">
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="w-8 h-8 text-pink-500" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chatbot Answers</h1>
      </div>

      <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setTab('intents')}
          className={`px-4 py-2 font-medium flex items-center gap-2 ${tab === 'intents' ? 'border-b-2 border-pink-500 text-pink-600' : 'text-gray-600 dark:text-gray-400'}`}
        >
          <List className="w-4 h-4" /> Intents
        </button>
        <button
          type="button"
          onClick={() => setTab('faqs')}
          className={`px-4 py-2 font-medium flex items-center gap-2 ${tab === 'faqs' ? 'border-b-2 border-pink-500 text-pink-600' : 'text-gray-600 dark:text-gray-400'}`}
        >
          <FileText className="w-4 h-4" /> FAQs
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-pink-500" /></div>
      ) : (
        <>
          {tab === 'intents' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Intents</CardTitle>
                <Button onClick={openAddIntent} className="flex items-center gap-2"><Plus className="w-4 h-4" /> Add Intent</Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-2">Name</th>
                        <th className="text-left py-2">Keywords</th>
                        <th className="text-left py-2">Reply (preview)</th>
                        <th className="text-left py-2">Order</th>
                        <th className="text-right py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {intents.map((i) => (
                        <tr key={i.id} className="border-b border-gray-100 dark:border-gray-800">
                          <td className="py-2 font-medium">{i.name}</td>
                          <td className="py-2 text-gray-600 dark:text-gray-400">{(i.keywords || []).slice(0, 3).join(', ')}...</td>
                          <td className="py-2 max-w-xs truncate">{i.reply?.slice(0, 60)}...</td>
                          <td className="py-2">{i.sort_order}</td>
                          <td className="py-2 text-right">
                            <button type="button" onClick={() => openEditIntent(i)} className="p-1 text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded"><Edit className="w-4 h-4 inline" /></button>
                            <button type="button" onClick={() => deleteIntent(i.id)} className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded ml-1"><Trash2 className="w-4 h-4 inline" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {tab === 'faqs' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>FAQs</CardTitle>
                <Button onClick={openAddFaq} className="flex items-center gap-2"><Plus className="w-4 h-4" /> Add FAQ</Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-2">Keywords</th>
                        <th className="text-left py-2">Response (preview)</th>
                        <th className="text-left py-2">Order</th>
                        <th className="text-right py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {faqs.map((f) => (
                        <tr key={f.id} className="border-b border-gray-100 dark:border-gray-800">
                          <td className="py-2 font-medium max-w-xs truncate">{f.keywords}</td>
                          <td className="py-2 text-gray-600 dark:text-gray-400 max-w-md truncate">{f.response?.slice(0, 80)}...</td>
                          <td className="py-2">{f.sort_order}</td>
                          <td className="py-2 text-right">
                            <button type="button" onClick={() => openEditFaq(f)} className="p-1 text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded"><Edit className="w-4 h-4 inline" /></button>
                            <button type="button" onClick={() => deleteFaq(f.id)} className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded ml-1"><Trash2 className="w-4 h-4 inline" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Intent modal */}
      {modalOpen && tab === 'intents' && (
        <Modal isOpen={true} onClose={() => setModalOpen(false)} title={editingIntent ? 'Edit Intent' : 'Add Intent'}>
          <div className="space-y-3">
            <Input label="Name" value={formIntent.name} onChange={(e) => setFormIntent((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Track Order" />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Keywords (comma-separated)</label>
              <input type="text" value={keywordsStr} onChange={(e) => setKeywordsStr(e.target.value)} className="w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800" placeholder="track order, order status" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reply</label>
              <textarea value={formIntent.reply} onChange={(e) => setFormIntent((p) => ({ ...p, reply: e.target.value }))} rows={4} className="w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800" placeholder="Bot reply text. Use **bold** for emphasis." />
            </div>
            <Input label="Link text" value={formIntent.link_text || ''} onChange={(e) => setFormIntent((p) => ({ ...p, link_text: e.target.value || null }))} placeholder="e.g. Track Order" />
            <Input label="Link href" value={formIntent.link_href || ''} onChange={(e) => setFormIntent((p) => ({ ...p, link_href: e.target.value || null }))} placeholder="e.g. /track-order" />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quick reply buttons (comma-separated)</label>
              <input type="text" value={quickRepliesStr} onChange={(e) => setQuickRepliesStr(e.target.value)} className="w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800" placeholder="Browse Cakes, Track Order" />
            </div>
            <Input label="Sort order" type="number" value={String(formIntent.sort_order)} onChange={(e) => setFormIntent((p) => ({ ...p, sort_order: parseInt(e.target.value, 10) || 0 }))} />
          </div>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={saveIntent} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}</Button>
          </ModalFooter>
        </Modal>
      )}

      {/* FAQ modal */}
      {modalOpen && tab === 'faqs' && (
        <Modal isOpen={true} onClose={() => setModalOpen(false)} title={editingFaq ? 'Edit FAQ' : 'Add FAQ'}>
          <div className="space-y-3">
            <Input label="Keywords (phrase for matching)" value={formFaq.keywords} onChange={(e) => setFormFaq((p) => ({ ...p, keywords: e.target.value }))} placeholder="e.g. delivery charges cost" />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Response</label>
              <textarea value={formFaq.response} onChange={(e) => setFormFaq((p) => ({ ...p, response: e.target.value }))} rows={4} className="w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800" />
            </div>
            <Input label="Link text" value={formFaq.link_text || ''} onChange={(e) => setFormFaq((p) => ({ ...p, link_text: e.target.value || null }))} />
            <Input label="Link href" value={formFaq.link_href || ''} onChange={(e) => setFormFaq((p) => ({ ...p, link_href: e.target.value || null }))} placeholder="/faq" />
            <Input label="Sort order" type="number" value={String(formFaq.sort_order)} onChange={(e) => setFormFaq((p) => ({ ...p, sort_order: parseInt(e.target.value, 10) || 0 }))} />
          </div>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={saveFaq} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}</Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
};
