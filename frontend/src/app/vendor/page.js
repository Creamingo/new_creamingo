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
  ChevronDown
} from 'lucide-react';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import MobileFooter from '../../components/MobileFooter';
import { submitVendorApplication } from '../../api/vendorApi';

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
    vendor_category: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
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

  // Prefill from logged-in customer
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleCategorySelect = (value) => {
    setFormData((prev) => ({ ...prev, vendor_category: value }));
    setIsCategoryDropdownOpen(false);
    setError('');
    if (validationErrors.vendor_category) {
      setValidationErrors((prev) => ({ ...prev, vendor_category: undefined }));
    }
  };

  const selectedCategoryLabel = VENDOR_CATEGORY_OPTIONS.find((o) => o.value === formData.vendor_category)?.label ?? VENDOR_CATEGORY_OPTIONS[0].label;

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
    if (!formData.vendor_category || !validValues.includes(formData.vendor_category)) {
      err.vendor_category = 'Please select what you want to sell';
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
      await submitVendorApplication({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        shop_name: formData.shop_name.trim() || undefined,
        category_ids: formData.vendor_category ? [formData.vendor_category] : []
      });
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
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                We&apos;ll review your details and get back to you within 24 hours. No commitment until you&apos;re ready.
              </p>
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

          {/* Hero */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 mb-4">
              <Store className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Sell on Creamingo
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Join our marketplace — apply in under 2 minutes. We&apos;ll get back within 24 hours.
            </p>
          </div>

          {/* Trust line */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-pink-500" />
              ~2 min
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-pink-500" />
              No commitment
            </span>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-2xl p-6 sm:p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact */}
              <div>
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-pink-500" />
                  Your details
                </h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="vendor-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                      className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition ${
                        validationErrors.name ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'
                      }`}
                    />
                    {validationErrors.name && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.name}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="vendor-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                      className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition ${
                        validationErrors.email ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'
                      }`}
                    />
                    {validationErrors.email && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.email}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="vendor-phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone *
                    </label>
                    <input
                      id="vendor-phone"
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="10-digit mobile number"
                      className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition ${
                        validationErrors.phone ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'
                      }`}
                    />
                    {validationErrors.phone && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* What do you want to sell */}
              <div>
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Store className="w-4 h-4 text-pink-500" />
                  What do you want to sell? *
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Select the category that best describes your products.
                </p>
                <div className="relative" ref={categoryDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                    className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-700 text-left flex items-center justify-between focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition hover:border-pink-300 dark:hover:border-pink-600 ${
                      validationErrors.vendor_category ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'
                    } ${!formData.vendor_category ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}
                  >
                    <span>{selectedCategoryLabel}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform flex-shrink-0 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isCategoryDropdownOpen && (
                    <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-xl dark:shadow-black/30 border-2 border-pink-200 dark:border-pink-800 overflow-hidden">
                      {VENDOR_CATEGORY_OPTIONS.filter((o) => o.value !== '').map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleCategorySelect(option.value)}
                          className={`w-full px-4 py-3 text-left hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors flex items-center gap-2 ${
                            formData.vendor_category === option.value
                              ? 'bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 font-medium'
                              : 'text-gray-900 dark:text-gray-100'
                          }`}
                        >
                          {formData.vendor_category === option.value && (
                            <CheckCircle2 className="w-4 h-4 text-pink-600 dark:text-pink-400 flex-shrink-0" />
                          )}
                          <span>{option.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {validationErrors.vendor_category && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{validationErrors.vendor_category}</p>
                )}
              </div>

              {/* Shop name (optional) */}
              <div>
                <label htmlFor="vendor-shop" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Shop or brand name <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  id="vendor-shop"
                  name="shop_name"
                  type="text"
                  value={formData.shop_name}
                  onChange={handleInputChange}
                  placeholder="e.g. Sweet Corner"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition"
                />
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                By submitting, you agree to be contacted by Creamingo about selling on our platform. We won’t share your details with third parties.
              </p>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl font-semibold bg-pink-500 hover:bg-pink-600 disabled:opacity-60 disabled:cursor-not-allowed text-white transition-colors flex items-center justify-center gap-2"
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
