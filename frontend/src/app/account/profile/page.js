'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, User } from 'lucide-react';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { useCustomerAuth } from '../../../contexts/CustomerAuthContext';
import customerAuthApi from '../../../api/customerAuthApi';
import { useToast } from '../../../contexts/ToastContext';

function ProfilePageContent() {
  const router = useRouter();
  const { customer, updateProfile, isLoading: authLoading } = useCustomerAuth();
  const { showSuccess, showError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'India',
      landmark: ''
    }
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || {
          street: '',
          city: '',
          state: '',
          zip_code: '',
          country: 'India',
          landmark: ''
        }
      });
    }
  }, [customer]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [name]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      await updateProfile(formData);
      showSuccess('Profile Updated', 'Your profile has been updated successfully');
      router.push('/account');
    } catch (error) {
      console.error('Error updating profile:', error);
      showError('Update Failed', error.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-pink-600 dark:text-pink-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Back Button - Ultra Compact */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors mb-3 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-inter text-xs font-medium">Back to Account</span>
        </button>

        {/* Page Header - Ultra Compact */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="p-1.5 bg-gradient-to-br from-pink-500 to-rose-500 dark:from-pink-600 dark:to-rose-600 rounded-lg shadow-sm">
              <User className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-poppins text-xl font-bold text-gray-900 dark:text-gray-100">
              Edit Profile
            </h1>
          </div>
          <p className="font-inter text-xs text-gray-600 dark:text-gray-400 ml-9">
            Update your personal information and delivery address
          </p>
        </div>

        {/* Profile Form - Ultra Compact */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          {/* Personal Information - Ultra Compact Section */}
          <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-pink-50/50 to-rose-50/50 dark:from-pink-900/20 dark:to-rose-900/20">
            <h2 className="font-poppins text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <div className="w-0.5 h-4 bg-gradient-to-b from-pink-500 to-rose-500 dark:from-pink-400 dark:to-rose-400 rounded-full"></div>
              Personal Information
            </h2>
          </div>
          
          <div className="p-4 space-y-2.5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <div>
                <label className="block font-inter text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400 focus:border-transparent font-inter text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-white dark:hover:bg-gray-600 transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>

              <div>
                <label className="block font-inter text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                  className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400 focus:border-transparent font-inter text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-white dark:hover:bg-gray-600 transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-inter text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email <span className="text-red-500 dark:text-red-400">*</span>
                <span className="ml-1.5 text-xs text-gray-400 dark:text-gray-500 font-normal">(Cannot be changed)</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled
                className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 font-inter text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Delivery Address - Ultra Compact Section */}
          <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/20">
            <h2 className="font-poppins text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <div className="w-0.5 h-4 bg-gradient-to-b from-blue-500 to-indigo-500 dark:from-blue-400 dark:to-indigo-400 rounded-full"></div>
              Delivery Address
            </h2>
          </div>
          
          <div className="p-4 space-y-2.5">
            <div>
              <label className="block font-inter text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Street Address <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                type="text"
                name="street"
                value={formData.address.street}
                onChange={handleAddressChange}
                required
                className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400 focus:border-transparent font-inter text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-white dark:hover:bg-gray-600 transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <div>
                <label className="block font-inter text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Landmark <span className="text-xs text-gray-400 dark:text-gray-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  name="landmark"
                  value={formData.address.landmark}
                  onChange={handleAddressChange}
                  placeholder="Near..."
                  className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400 focus:border-transparent font-inter text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-white dark:hover:bg-gray-600 transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>

              <div>
                <label className="block font-inter text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  City <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.address.city}
                  onChange={handleAddressChange}
                  required
                  className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400 focus:border-transparent font-inter text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-white dark:hover:bg-gray-600 transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <div>
                <label className="block font-inter text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  State <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.address.state}
                  onChange={handleAddressChange}
                  required
                  className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400 focus:border-transparent font-inter text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-white dark:hover:bg-gray-600 transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>

              <div>
                <label className="block font-inter text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  PIN Code <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="zip_code"
                  value={formData.address.zip_code}
                  onChange={handleAddressChange}
                  required
                  pattern="[0-9]{6}"
                  maxLength={6}
                  className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400 focus:border-transparent font-inter text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-white dark:hover:bg-gray-600 transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-inter text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Country
              </label>
              <input
                type="text"
                name="country"
                value={formData.address.country}
                onChange={handleAddressChange}
                className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400 focus:border-transparent font-inter text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-white dark:hover:bg-gray-600 transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>
          </div>

          {/* Action Buttons - Ultra Compact */}
          <div className="flex items-center justify-end gap-2.5 px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-inter text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-pink-500 to-rose-500 dark:from-pink-600 dark:to-rose-600 text-white rounded-lg font-inter text-xs font-medium hover:from-pink-600 hover:to-rose-600 dark:hover:from-pink-500 dark:hover:to-rose-500 transition-all duration-300 shadow-sm hover:shadow-md dark:shadow-lg dark:shadow-black/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfilePageContent />
    </ProtectedRoute>
  );
}

