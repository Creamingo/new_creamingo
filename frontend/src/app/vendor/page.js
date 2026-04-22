'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Store,
  User,
  Mail,
  Phone,
  ArrowLeft,
  CheckCircle2,
  Shield,
  Clock,
  AlertCircle,
  Loader2,
  ChevronDown,
  Save,
  FileUp,
  X
} from 'lucide-react';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import MobileFooter from '../../components/MobileFooter';
import { submitVendorApplication, uploadVendorDocument, getApplicationStatus } from '../../api/vendorApi';

const DRAFT_KEY = 'creamingo_vendor_draft';
const LAST_APPLICATION_ID_KEY = 'creamingo_vendor_last_application_id';

const VENDOR_CATEGORY_OPTIONS = [
  { value: '', label: 'Select what you want to sell…' },
  { value: 'cake_bakery', label: 'Cake and Bakery Related' },
  { value: 'flowers', label: 'Flowers and Related' },
  { value: 'sweets', label: 'Sweets and Related' },
  { value: 'dry_fruits', label: 'Dry Fruits and Related' },
  { value: 'gifting', label: 'Gifting Items and Related' },
  { value: 'plants', label: 'Plants and Related' }
];

export default function VendorPage() {
  const router = useRouter();
  const { customer, isAuthenticated, isLoading: authLoading } = useCustomerAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    shop_name: '',
    vendor_categories: [],
    city: '',
    pincode: '',
    contact_preference: 'phone',
    gst_number: '',
    shop_document_url: '',
    id_document_url: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submittedApplicationId, setSubmittedApplicationId] = useState(null);
  const [submittedContactPreference, setSubmittedContactPreference] = useState('phone');
  const [validationErrors, setValidationErrors] = useState({});
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [uploadingShopDoc, setUploadingShopDoc] = useState(false);
  const [uploadingIdDoc, setUploadingIdDoc] = useState(false);
  const [lastApplicationStatus, setLastApplicationStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const categoryDropdownRef = useRef(null);

  // Close category dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    if (isCategoryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCategoryDropdownOpen]);

  // Restore draft from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          setFormData((prev) => ({
            ...prev,
            name: parsed.name ?? prev.name,
            email: parsed.email ?? prev.email,
            phone: parsed.phone ?? prev.phone,
            shop_name: parsed.shop_name ?? prev.shop_name,
            vendor_categories: Array.isArray(parsed.vendor_categories) ? parsed.vendor_categories : prev.vendor_categories,
            city: parsed.city ?? prev.city,
            pincode: parsed.pincode ?? prev.pincode,
            contact_preference: parsed.contact_preference ?? prev.contact_preference,
            gst_number: parsed.gst_number ?? prev.gst_number,
            shop_document_url: parsed.shop_document_url ?? prev.shop_document_url,
            id_document_url: parsed.id_document_url ?? prev.id_document_url
          }));
        }
      }
    } catch (_) {}
  }, []);

  // On load: if we have a last application id, fetch its status (or clear and show form)
  useEffect(() => {
    if (typeof window === 'undefined') {
      setStatusLoading(false);
      return;
    }
    const lastId = localStorage.getItem(LAST_APPLICATION_ID_KEY);
    if (!lastId || lastId.trim() === '') {
      setStatusLoading(false);
      return;
    }
    getApplicationStatus(lastId.trim())
      .then((data) => {
        setLastApplicationStatus({
          application_id: data.application_id,
          status: data.status || 'pending',
          updated_at: data.updated_at
        });
      })
      .catch(() => {
        try {
          localStorage.removeItem(LAST_APPLICATION_ID_KEY);
        } catch (_) {}
        setLastApplicationStatus(null);
      })
      .finally(() => setStatusLoading(false));
  }, []);

  // Prefill from logged-in customer (after draft restore)
  useEffect(() => {
    if (!authLoading && isAuthenticated && customer) {
      setFormData((prev) => ({
        ...prev,
        name: customer.name || prev.name,
        email: customer.email || prev.email,
        phone: customer.phone || prev.phone
      }));
    }
  }, [authLoading, isAuthenticated, customer]);

  // Auto-save draft every 30s when form has content
  useEffect(() => {
    const hasContent = formData.name?.trim() || formData.email?.trim() || formData.phone?.trim() || formData.vendor_categories?.length;
    if (!hasContent) return;
    const t = setInterval(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 2000);
      } catch (_) {}
    }, 30000);
    return () => clearInterval(t);
  }, [formData]);

  const saveDraft = () => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2000);
    } catch (_) {}
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
      setFormData({
        name: '',
        email: '',
        phone: '',
        shop_name: '',
        vendor_categories: [],
        city: '',
        pincode: '',
        contact_preference: 'phone',
        gst_number: '',
        shop_document_url: '',
        id_document_url: ''
      });
      setDraftSaved(false);
    } catch (_) {}
  };

  const handleDocUpload = async (field, file) => {
    if (!file) return;
    const setUploading = field === 'shop_document_url' ? setUploadingShopDoc : setUploadingIdDoc;
    setUploading(true);
    try {
      const res = await uploadVendorDocument(file);
      if (res.data?.url) {
        setFormData((prev) => ({ ...prev, [field]: res.data.url }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const toggleCategory = (value) => {
    setFormData((prev) => {
      const arr = prev.vendor_categories.includes(value)
        ? prev.vendor_categories.filter((v) => v !== value)
        : [...prev.vendor_categories, value];
      return { ...prev, vendor_categories: arr };
    });
    setError('');
    if (validationErrors.vendor_categories) {
      setValidationErrors((prev) => ({ ...prev, vendor_categories: undefined }));
    }
  };

  const openCategoryDropdown = () => setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
  const selectedCategoryLabels = formData.vendor_categories
    .map((v) => VENDOR_CATEGORY_OPTIONS.find((o) => o.value === v)?.label)
    .filter(Boolean);
  const selectedSummary = selectedCategoryLabels.length ? selectedCategoryLabels.join(', ') : 'Select categories…';

  const validate = () => {
    const err = {};
    if (!formData.name?.trim() || formData.name.trim().length < 2) {
      err.name = 'Name must be at least 2 characters';
    }
    if (!formData.email?.trim()) {
      err.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      err.email = 'Please enter a valid email';
    }
    const phoneDigits = String(formData.phone || '').replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      err.phone = 'Please enter a valid 10-digit phone number';
    }
    const validValues = VENDOR_CATEGORY_OPTIONS.map((o) => o.value).filter(Boolean);
    if (!formData.vendor_categories?.length || !formData.vendor_categories.every((v) => validValues.includes(v))) {
      err.vendor_categories = 'Please select at least one category you want to sell';
    }
    setValidationErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const res = await submitVendorApplication({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        shop_name: formData.shop_name.trim() || undefined,
        category_ids: formData.vendor_categories || [],
        contact_preference: formData.contact_preference,
        city: formData.city.trim() || undefined,
        pincode: formData.pincode.trim() || undefined,
        gst_number: formData.gst_number?.trim() || undefined,
        shop_document_url: formData.shop_document_url || undefined,
        id_document_url: formData.id_document_url || undefined
      });
      try {
        localStorage.removeItem(DRAFT_KEY);
        if (res.application_id != null) {
          localStorage.setItem(LAST_APPLICATION_ID_KEY, String(res.application_id));
        }
      } catch (_) {}
      setSubmittedApplicationId(res.application_id ?? null);
      setSubmittedContactPreference(formData.contact_preference);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md text-center">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-2xl p-8 sm:p-10">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Application received
              </h1>
              {submittedApplicationId != null && (
                <p className="text-sm font-mono font-medium text-pink-600 dark:text-pink-400 mb-2">
                  Application ID: VA-{submittedApplicationId}
                </p>
              )}
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                We&apos;ll review your details and get back to you within 24 hours. No commitment until you&apos;re ready.
              </p>
              <ul className="text-left text-sm text-gray-600 dark:text-gray-400 mb-4 space-y-1 list-disc list-inside">
                <li>Check your email for a confirmation</li>
                <li>Keep your {submittedContactPreference === 'whatsapp' ? 'WhatsApp' : submittedContactPreference === 'email' ? 'inbox' : 'phone'} free — we&apos;ll reach you there first</li>
                <li>We&apos;ll contact you within 24 hours</li>
              </ul>
              <button
                type="button"
                onClick={() => router.push('/')}
                className="w-full py-3 px-4 rounded-xl font-semibold bg-pink-500 hover:bg-pink-600 text-white transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </main>
        <Footer />
        <MobileFooter />
      </div>
    );
  }

  // Loading last application status on mount
  if (statusLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
            <p className="text-gray-600 dark:text-gray-400 text-sm">Checking your application…</p>
          </div>
        </main>
        <Footer />
        <MobileFooter />
      </div>
    );
  }

  // Status view: user has a previous application; show status and actions
  if (lastApplicationStatus) {
    const statusLabel =
      lastApplicationStatus.status === 'approved'
        ? 'Approved'
        : lastApplicationStatus.status === 'rejected'
          ? 'Rejected'
          : 'Under review';
    const statusColor =
      lastApplicationStatus.status === 'approved'
        ? 'text-green-600 dark:text-green-400'
        : lastApplicationStatus.status === 'rejected'
          ? 'text-red-600 dark:text-red-400'
          : 'text-amber-600 dark:text-amber-400';

    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md text-center">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-2xl p-8 sm:p-10">
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Your application
              </h1>
              <p className="text-sm font-mono font-medium text-pink-600 dark:text-pink-400 mb-4">
                VA-{lastApplicationStatus.application_id}
              </p>
              <p className={`font-semibold ${statusColor} mb-6`}>{statusLabel}</p>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="w-full py-3 px-4 rounded-xl font-semibold bg-pink-500 hover:bg-pink-600 text-white transition-colors"
                >
                  Back to Home
                </button>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      localStorage.removeItem(LAST_APPLICATION_ID_KEY);
                    } catch (_) {}
                    setLastApplicationStatus(null);
                  }}
                  className="w-full py-3 px-4 rounded-xl font-semibold border-2 border-pink-500 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors"
                >
                  Submit a new application
                </button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
        <MobileFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex flex-col">
      <Header />

      <main className="flex-1 px-4 py-8 sm:py-12">
        <div className="max-w-xl mx-auto">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-medium">Back</span>
          </button>

          {/* Hero — icon beside title, compact */}
          <div className="mb-5">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 flex-shrink-0">
                <Store className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                Sell on Creamingo
              </h1>
            </div>
            <p className="text-center text-gray-600 dark:text-gray-400 text-sm mb-3">
              Join our marketplace — apply in under 2 minutes. We&apos;ll get back within 24 hours.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-pink-500" />
                ~2 min
              </span>
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-pink-500" />
                No commitment
              </span>
            </div>
            {/* Stats */}
            <div className="mt-4 flex flex-wrap justify-center gap-6 sm:gap-10">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-pink-600 dark:text-pink-400">500+</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Sellers on board</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-pink-600 dark:text-pink-400">24h</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Response time</div>
              </div>
            </div>
          </div>

          {/* Testimonials */}
          <div className="mb-6 rounded-2xl bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">What sellers say</h3>
            <div className="space-y-3">
              <blockquote className="text-sm text-gray-600 dark:text-gray-400 italic">&ldquo;Got approved in a day. Sales picked up within a week.&rdquo; <span className="not-italic text-gray-500">— Priya, Cakes</span></blockquote>
              <blockquote className="text-sm text-gray-600 dark:text-gray-400 italic">&ldquo;Simple process, no hidden fees. Happy to be on Creamingo.&rdquo; <span className="not-italic text-gray-500">— Rahul, Gifts</span></blockquote>
            </div>
          </div>

          {/* Progress: 3 steps */}
          {(() => {
            const hasDetails = formData.name?.trim().length >= 2 && formData.email?.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email?.trim()) && String(formData.phone || '').replace(/\D/g, '').length >= 10;
            const hasCategory = Array.isArray(formData.vendor_categories) && formData.vendor_categories.length > 0;
            const step = hasDetails && hasCategory ? 3 : hasDetails ? 2 : 1;
            return (
              <div className="mb-6">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                  <span>Step {step} of 3</span>
                  <span>Your details → Category → Submit</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <div className="h-full rounded-full bg-pink-500 transition-all" style={{ width: `${(step / 3) * 100}%` }} />
                </div>
              </div>
            );
          })()}

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-2xl border border-gray-100 dark:border-gray-700 p-5 sm:p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Contact */}
              <div className="pb-3 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2.5 flex items-center gap-2">
                  <User className="w-4 h-4 text-pink-500" />
                  Your details
                </h2>
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label htmlFor="vendor-name" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Full name *
                      </label>
                      <input
                        id="vendor-name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Your name"
                        className={`w-full px-3 py-2.5 text-sm rounded-lg border bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400 outline-none transition ${
                          validationErrors.name ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'
                        }`}
                      />
                      {validationErrors.name && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{validationErrors.name}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="vendor-email" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Email *
                      </label>
                      <input
                        id="vendor-email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="you@example.com"
                        className={`w-full px-3 py-2.5 text-sm rounded-lg border bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400 outline-none transition ${
                          validationErrors.email ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'
                        }`}
                      />
                      {validationErrors.email && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{validationErrors.email}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="vendor-phone" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Phone *
                      </label>
                      <input
                        id="vendor-phone"
                        name="phone"
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="10-digit number"
                        className={`w-full px-3 py-2.5 text-sm rounded-lg border bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400 outline-none transition ${
                          validationErrors.phone ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'
                        }`}
                      />
                      {validationErrors.phone && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{validationErrors.phone}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                      How should we reach you first? *
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 'phone', label: 'Phone' },
                        { value: 'whatsapp', label: 'WhatsApp' },
                        { value: 'email', label: 'Email' }
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleInputChange({ target: { name: 'contact_preference', value: opt.value } })}
                          className={`px-3 py-2 text-sm rounded-lg border transition ${
                            formData.contact_preference === opt.value
                              ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300'
                              : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:border-pink-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* What do you want to sell (multi-select) */}
              <div className="pb-3 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                  <Store className="w-4 h-4 text-pink-500" />
                  What do you want to sell? *
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Select one or more categories that describe your products.
                </p>
                <div className="relative" ref={categoryDropdownRef}>
                  <button
                    type="button"
                    onClick={openCategoryDropdown}
                    className={`w-full px-3 py-2.5 text-sm rounded-lg border bg-gray-50 dark:bg-gray-700/50 text-left flex items-center justify-between focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400 outline-none transition hover:border-pink-300 dark:hover:border-pink-600 ${
                      validationErrors.vendor_categories ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'
                    } ${!selectedCategoryLabels.length ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}
                  >
                    <span className="truncate">{selectedSummary}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform flex-shrink-0 ml-2 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isCategoryDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-xl dark:shadow-black/30 border border-pink-200 dark:border-pink-800 overflow-hidden">
                      {VENDOR_CATEGORY_OPTIONS.filter((o) => o.value !== '').map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => toggleCategory(option.value)}
                          className={`w-full px-3 py-2.5 text-sm text-left hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors flex items-center gap-2 ${
                            formData.vendor_categories.includes(option.value)
                              ? 'bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 font-medium'
                              : 'text-gray-900 dark:text-gray-100'
                          }`}
                        >
                          {formData.vendor_categories.includes(option.value) && (
                            <CheckCircle2 className="w-4 h-4 text-pink-600 dark:text-pink-400 flex-shrink-0" />
                          )}
                          <span>{option.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {validationErrors.vendor_categories && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{validationErrors.vendor_categories}</p>
                )}
              </div>

              {/* City & Pincode */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="vendor-city" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    City <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    id="vendor-city"
                    name="city"
                    type="text"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="e.g. Mumbai"
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400 outline-none transition"
                  />
                </div>
                <div>
                  <label htmlFor="vendor-pincode" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Pincode <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    id="vendor-pincode"
                    name="pincode"
                    type="text"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    placeholder="e.g. 400001"
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400 outline-none transition"
                  />
                </div>
              </div>

              {/* Shop name (optional) */}
              <div>
                <label htmlFor="vendor-shop" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Shop or brand name <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  id="vendor-shop"
                  name="shop_name"
                  type="text"
                  value={formData.shop_name}
                  onChange={handleInputChange}
                  placeholder="e.g. Sweet Corner"
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400 outline-none transition"
                />
              </div>

              {/* GST (optional) */}
              <div>
                <label htmlFor="vendor-gst" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  GST number <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  id="vendor-gst"
                  name="gst_number"
                  type="text"
                  value={formData.gst_number}
                  onChange={handleInputChange}
                  placeholder="e.g. 27XXXXX1234X1ZX"
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400 outline-none transition"
                />
              </div>

              {/* Optional doc upload (shop / ID) */}
              <div className="space-y-3 pb-3 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                  <FileUp className="w-3.5 h-3.5" />
                  Documents <span className="font-normal text-gray-400">(optional)</span>
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Shop / business proof</label>
                    <input
                      type="file"
                      accept=".pdf,image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      id="shop-doc"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleDocUpload('shop_document_url', f); e.target.value = ''; }}
                    />
                    <label htmlFor="shop-doc" className="flex items-center gap-2 cursor-pointer text-sm text-pink-600 dark:text-pink-400 hover:underline">
                      {uploadingShopDoc ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
                      {formData.shop_document_url ? 'Replace file' : 'Upload'}
                    </label>
                    {formData.shop_document_url && (
                      <p className="mt-1 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Attached
                        <button type="button" onClick={() => setFormData((p) => ({ ...p, shop_document_url: '' }))} className="ml-1 text-red-500 hover:underline"><X className="w-3.5 h-3.5 inline" /></button>
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">ID proof</label>
                    <input
                      type="file"
                      accept=".pdf,image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      id="id-doc"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleDocUpload('id_document_url', f); e.target.value = ''; }}
                    />
                    <label htmlFor="id-doc" className="flex items-center gap-2 cursor-pointer text-sm text-pink-600 dark:text-pink-400 hover:underline">
                      {uploadingIdDoc ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
                      {formData.id_document_url ? 'Replace file' : 'Upload'}
                    </label>
                    {formData.id_document_url && (
                      <p className="mt-1 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Attached
                        <button type="button" onClick={() => setFormData((p) => ({ ...p, id_document_url: '' }))} className="ml-1 text-red-500 hover:underline"><X className="w-3.5 h-3.5 inline" /></button>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={saveDraft}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                >
                  <Save className="w-4 h-4" />
                  {draftSaved ? 'Saved' : 'Save draft'}
                </button>
                <button type="button" onClick={clearDraft} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  Clear draft
                </button>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                By submitting, you agree to be contacted by Creamingo about selling on our platform. We won’t share your details with third parties.
              </p>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-pink-500 hover:bg-pink-600 disabled:opacity-60 disabled:cursor-not-allowed text-white transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  'Submit application'
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
      <MobileFooter />
    </div>
  );
}
