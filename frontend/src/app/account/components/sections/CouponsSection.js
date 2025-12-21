'use client';

import { useState, useEffect } from 'react';
import { Tag, Copy, CheckCircle, Calendar, XCircle } from 'lucide-react';
import SectionHeader from '../shared/SectionHeader';
import EmptyState from '../shared/EmptyState';
import promoCodeApi from '../../../../api/promoCodeApi';

export default function CouponsSection({ onBadgeUpdate }) {
  const [activeTab, setActiveTab] = useState('active');
  const [copiedCode, setCopiedCode] = useState(null);
  const [coupons, setCoupons] = useState({
    active: [],
    used: [],
    expired: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCoupons();
  }, []);

  useEffect(() => {
    if (onBadgeUpdate) {
      const activeCount = coupons.active.length;
      onBadgeUpdate(activeCount > 0 ? activeCount : null);
    }
  }, [coupons.active.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCoupons = async () => {
    try {
      setIsLoading(true);
      // Fetch all promo codes (both active and inactive)
      const allPromoCodes = await promoCodeApi.getPromoCodes(false);
      
      // Categorize coupons based on status and validity
      const now = new Date();
      const categorized = {
        active: [],
        used: [],
        expired: []
      };

      allPromoCodes.forEach(coupon => {
        const validUntil = new Date(coupon.valid_until);
        
        if (coupon.status === 'expired' || now > validUntil) {
          categorized.expired.push(coupon);
        } else if (coupon.status === 'used') {
          categorized.used.push(coupon);
        } else if (coupon.status === 'active' && now <= validUntil) {
          categorized.active.push(coupon);
        }
      });

      setCoupons(categorized);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      // Keep empty state on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const tabs = [
    { id: 'active', label: 'Active', count: coupons.active.length, color: 'green' },
    { id: 'used', label: 'Used', count: coupons.used.length, color: 'yellow' },
    { id: 'expired', label: 'Expired', count: coupons.expired.length, color: 'red' }
  ];

  const getCurrentCoupons = () => {
    return coupons[activeTab] || [];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatDiscount = (coupon) => {
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}% OFF`;
    }
    return `₹${coupon.discount_value} OFF`;
  };

  return (
    <>
      <SectionHeader 
        title="Coupons" 
        description="Manage your promo codes and discounts"
      />

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200 overflow-x-hidden">
        <div className="flex lg:inline-flex gap-0 lg:gap-2 w-screen lg:w-auto -ml-5 lg:ml-0 -mr-5 lg:mr-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 lg:flex-none px-2 lg:px-4 py-2 font-inter text-sm font-medium border-b-2 transition-colors text-center ${
                activeTab === tab.id
                  ? `border-${tab.color}-500 text-${tab.color}-600`
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="flex items-center justify-center gap-1.5 lg:gap-2">
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`px-1.5 lg:px-2 py-0.5 rounded-full text-xs bg-${tab.color}-100 text-${tab.color}-700`}>
                    {tab.count}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Coupons List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
        </div>
      ) : getCurrentCoupons().length === 0 ? (
        <EmptyState
          icon={Tag}
          title={`No ${tabs.find(t => t.id === activeTab)?.label} Coupons`}
          description={
            activeTab === 'active'
              ? "You don't have any active coupons at the moment"
              : activeTab === 'used'
              ? "You haven't used any coupons yet"
              : "You don't have any expired coupons"
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {getCurrentCoupons().map((coupon) => (
            <div
              key={coupon.id}
              className={`bg-gradient-to-br ${
                activeTab === 'active'
                  ? 'from-green-50 to-emerald-50 border-green-200'
                  : activeTab === 'used'
                  ? 'from-yellow-50 to-amber-50 border-yellow-200'
                  : 'from-red-50 to-pink-50 border-red-200'
              } rounded-xl border-2 p-3 lg:p-6 hover:shadow-lg transition-all duration-200`}
            >
              <div className="flex items-start justify-between mb-2 lg:mb-4">
                <div className="flex items-center gap-2 lg:gap-3">
                  <div className={`w-8 h-8 lg:w-12 lg:h-12 rounded-lg bg-gradient-to-br ${
                    activeTab === 'active'
                      ? 'from-green-500 to-emerald-500'
                      : activeTab === 'used'
                      ? 'from-yellow-500 to-amber-500'
                      : 'from-red-500 to-pink-500'
                  } flex items-center justify-center shadow-sm`}>
                    <Tag className="w-4 h-4 lg:w-6 lg:h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-poppins text-sm lg:text-lg font-bold text-gray-900 mb-0.5 lg:mb-1">
                      {coupon.code}
                    </h3>
                    <p className="font-inter text-xs lg:text-sm text-gray-600">
                      {formatDiscount(coupon)}
                    </p>
                  </div>
                </div>

                {activeTab === 'active' && (
                  <button
                    onClick={() => handleCopyCode(coupon.code)}
                    className="p-1.5 lg:p-2 bg-white rounded-lg hover:bg-gray-50 transition-colors border border-gray-200 flex-shrink-0"
                    title="Copy Code"
                  >
                    {copiedCode === coupon.code ? (
                      <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 lg:w-5 lg:h-5 text-gray-600" />
                    )}
                  </button>
                )}
              </div>

              <div className="space-y-1 lg:space-y-2">
                <div className="flex items-center gap-1.5 lg:gap-2 text-[10px] lg:text-xs text-gray-600">
                  <Calendar className="w-3 h-3 lg:w-4 lg:h-4" />
                  <span>
                    Valid until {formatDate(coupon.valid_until)}
                  </span>
                </div>
                {coupon.description && (
                  <p className="font-inter text-xs lg:text-sm text-gray-700">
                    {coupon.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

