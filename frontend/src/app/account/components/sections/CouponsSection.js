'use client';

import { useState, useEffect } from 'react';
import { Tag, Copy, CheckCircle, Calendar, XCircle } from 'lucide-react';
import SectionHeader from '../shared/SectionHeader';
import EmptyState from '../shared/EmptyState';
import promoCodeApi from '../../../../api/promoCodeApi';
import dealApi from '../../../../api/dealApi';
import { formatPrice } from '../../../../utils/priceFormatter';

export default function CouponsSection({ onBadgeUpdate, initialTab = 'active' }) {
  const [activeTab, setActiveTab] = useState('active');
  const [copiedCode, setCopiedCode] = useState(null);
  const [oneRupeeDeals, setOneRupeeDeals] = useState([]);
  const [coupons, setCoupons] = useState({
    active: [],
    used: [],
    expired: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isDealsLoading, setIsDealsLoading] = useState(true);

  useEffect(() => {
    fetchCoupons();
    fetchOneRupeeDeals();
  }, []);

  useEffect(() => {
    const allowedTabs = new Set(['active', 'used', 'expired', 'deals']);
    if (initialTab && allowedTabs.has(initialTab)) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

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

  const fetchOneRupeeDeals = async () => {
    try {
      setIsDealsLoading(true);
      const response = await dealApi.getActiveDeals(0);
      const normalizedDeals = (response?.eligible_deals || [])
        .filter((deal) => deal?.deal_id)
        .sort((a, b) => Number(a.threshold || 0) - Number(b.threshold || 0));
      setOneRupeeDeals(normalizedDeals);
    } catch (error) {
      console.error('Error fetching ₹1 deals:', error);
      setOneRupeeDeals([]);
    } finally {
      setIsDealsLoading(false);
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
    { id: 'active', label: 'Active', count: coupons.active.length },
    { id: 'used', label: 'Used', count: coupons.used.length },
    { id: 'expired', label: 'Expired', count: coupons.expired.length },
    { id: 'deals', label: '₹1 Deals', count: oneRupeeDeals.length }
  ];

  const getCurrentCoupons = () => {
    return [...(coupons[activeTab] || [])].sort((a, b) => {
      const discountA = Number(a.discount_value || 0);
      const discountB = Number(b.discount_value || 0);
      if (discountA !== discountB) return discountA - discountB;
      return a.code.localeCompare(b.code);
    });
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

  const getDiscountHeadline = (coupon) => {
    if (coupon.discount_type === 'percentage') {
      return `Save ${coupon.discount_value}%`;
    }
    return `Flat ₹${coupon.discount_value} off`;
  };

  const getUsageCount = (coupon) => {
    const rawCount = coupon.times_used ?? coupon.usage_count ?? coupon.used_count;
    if (rawCount === undefined || rawCount === null) {
      return coupon.status === 'used' ? 1 : 0;
    }
    const parsed = Number(rawCount);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  };

  const getSavedAmount = (coupon) => {
    const directSaved = coupon.total_saved ?? coupon.saved_amount ?? coupon.total_discount_saved;
    if (directSaved !== undefined && directSaved !== null) {
      const parsed = Number(directSaved);
      return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
    }

    // Fallback estimation only for fixed-value discounts when explicit savings are unavailable
    if (coupon.discount_type === 'fixed') {
      return getUsageCount(coupon) * Number(coupon.discount_value || 0);
    }

    return 0;
  };

  const getUsageLabel = (coupon) => {
    const count = getUsageCount(coupon);
    if (count === 0) return "You haven't used this promo yet";
    if (count === 1) return 'You have used this promo 1 time';
    return `You have used this promo ${count} times`;
  };

  const getEligibilityText = (coupon) => {
    const minOrderAmount = Number(coupon.min_order_amount || 0);
    if (Number.isFinite(minOrderAmount) && minOrderAmount > 0) {
      return `On orders above ₹${Math.round(minOrderAmount)}`;
    }
    return 'Applicable on eligible orders';
  };

  const tabStyleMap = {
    active: {
      tab: 'text-emerald-700 border-emerald-500 bg-white shadow-sm',
      badge: 'bg-emerald-100 text-emerald-700',
      card: 'border-emerald-200 bg-gray-50 dark:bg-gray-800/80',
      headline: 'text-emerald-700',
      icon: 'text-emerald-600',
      codeBg: 'bg-emerald-100/80 text-emerald-800 border-emerald-200'
    },
    used: {
      tab: 'text-amber-700 border-amber-500 bg-white shadow-sm',
      badge: 'bg-amber-100 text-amber-700',
      card: 'border-amber-200 bg-gray-50 dark:bg-gray-800/80',
      headline: 'text-amber-700',
      icon: 'text-amber-600',
      codeBg: 'bg-amber-100/80 text-amber-800 border-amber-200'
    },
    expired: {
      tab: 'text-rose-700 border-rose-500 bg-white shadow-sm',
      badge: 'bg-rose-100 text-rose-700',
      card: 'border-rose-200 bg-gray-50 dark:bg-gray-800/80',
      headline: 'text-rose-700',
      icon: 'text-rose-600',
      codeBg: 'bg-rose-100/80 text-rose-800 border-rose-200'
    },
    deals: {
      tab: 'text-violet-700 border-violet-500 bg-white shadow-sm',
      badge: 'bg-violet-100 text-violet-700',
      card: 'border-violet-200 bg-gray-50 dark:bg-gray-800/80',
      headline: 'text-violet-700',
      icon: 'text-violet-600',
      codeBg: 'bg-violet-100/80 text-violet-800 border-violet-200'
    }
  };

  const usedCouponsSummary = coupons.used
    .map((coupon) => ({
      id: coupon.id,
      code: coupon.code,
      usageCount: getUsageCount(coupon),
      savedAmount: getSavedAmount(coupon)
    }))
    .sort((a, b) => b.savedAmount - a.savedAmount);

  const totalUsedSavings = usedCouponsSummary.reduce((sum, item) => sum + item.savedAmount, 0);

  return (
    <>
      <SectionHeader 
        title={activeTab === 'deals' ? 'Deals' : 'Coupons'} 
        description="Manage your promo codes and discounts"
      />

      {/* Tabs */}
      <div className="mb-5">
        <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-gray-100 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-2.5 py-2 rounded-lg border font-inter text-sm font-medium transition-all text-center ${
                activeTab === tab.id
                  ? tabStyleMap[tab.id].tab
                  : 'border-transparent text-gray-600 dark:text-gray-300 bg-transparent hover:bg-white/70 dark:hover:bg-gray-700/50'
              }`}
            >
              <span className="flex items-center justify-center gap-1.5 lg:gap-2">
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`px-1.5 lg:px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? tabStyleMap[tab.id].badge : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'}`}>
                    {tab.count}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Coupons List */}
      {(activeTab === 'deals' ? isDealsLoading : isLoading) ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
        </div>
      ) : activeTab === 'deals' ? (
        oneRupeeDeals.length === 0 ? (
          <EmptyState
            icon={Tag}
            title="No ₹1 deals running"
            description="No active ₹1 deals are configured right now."
          />
        ) : (
          <div className="space-y-3.5">
            {oneRupeeDeals.map((deal) => (
              <div
                key={deal.deal_id}
                className="relative overflow-hidden rounded-2xl border border-violet-200/90 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 dark:from-violet-900/20 dark:via-gray-800 dark:to-fuchsia-900/20 p-3.5 lg:p-4 shadow-sm transition-all"
              >
                <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-violet-200/35 dark:bg-violet-700/20 blur-2xl pointer-events-none" />
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400" />

                <div className="relative flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-poppins text-lg lg:text-xl font-bold leading-tight tracking-tight text-violet-700 dark:text-violet-300">
                      {deal.deal_title || deal.product?.name || '₹1 Deal'}
                    </p>
                    <p className="mt-1 font-inter text-[13px] lg:text-sm font-medium text-gray-700 dark:text-gray-200 leading-tight">
                      Unlock on orders above {formatPrice(deal.threshold || 0)}
                    </p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-200 dark:bg-violet-900/40 dark:text-violet-200 dark:border-violet-700 text-[11px] font-semibold shadow-sm">
                    ₹1 Deal
                  </span>
                </div>

                <div className="mt-2.5 flex items-center justify-between gap-2.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border text-[11px] font-semibold tracking-wide bg-violet-100/80 text-violet-800 border-violet-200 dark:bg-violet-900/35 dark:text-violet-200 dark:border-violet-700">
                    <Tag className="w-3 h-3" />
                    {deal.product?.name || 'Offer item'}
                  </span>
                  <div className="text-[13px] text-gray-700 dark:text-gray-200 font-semibold leading-tight">
                    Get for {formatPrice(deal.deal_price || 1)}
                  </div>
                </div>

                <p className="mt-2 font-inter text-[13px] text-gray-800 dark:text-gray-100 leading-snug">
                  {deal.description || 'Add eligible cart value to unlock this running ₹1 deal.'}
                </p>
              </div>
            ))}
          </div>
        )
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
        <div className="space-y-3">
          {activeTab === 'used' && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/45 p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-amber-800">Used Coupons Savings</p>
                <p className="text-sm font-bold text-amber-700">Saved {formatDiscount({ discount_type: 'fixed', discount_value: totalUsedSavings }).replace(' OFF', '')}</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-amber-700 border-b border-amber-200">
                      <th className="py-1.5 font-semibold">Code</th>
                      <th className="py-1.5 font-semibold text-center">Used</th>
                      <th className="py-1.5 font-semibold text-right">Saved</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usedCouponsSummary.map((item) => (
                      <tr key={item.id} className="border-b border-amber-100 last:border-b-0">
                        <td className="py-1.5 font-semibold text-gray-800 dark:text-gray-200">{item.code}</td>
                        <td className="py-1.5 text-center text-gray-700 dark:text-gray-300">{item.usageCount}</td>
                        <td className="py-1.5 text-right text-amber-700 font-semibold">₹{Math.round(item.savedAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {getCurrentCoupons().map((coupon) => (
            <div
              key={coupon.id}
              className={`rounded-xl border p-2.5 lg:p-3 transition-colors ${tabStyleMap[activeTab].card}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className={`font-poppins text-lg lg:text-xl font-bold leading-tight tracking-tight ${tabStyleMap[activeTab].headline}`}>
                    {getDiscountHeadline(coupon)}
                  </p>
                  <p className="mt-0.5 font-inter text-xs lg:text-sm font-medium text-gray-700 dark:text-gray-200">
                    {getEligibilityText(coupon)}
                  </p>
                </div>

                {activeTab === 'active' ? (
                  <button
                    onClick={() => handleCopyCode(coupon.code)}
                    className="p-1.5 bg-white/90 dark:bg-gray-800 rounded-lg hover:bg-white transition-colors border border-gray-200 dark:border-gray-700 flex-shrink-0"
                    title="Copy Code"
                  >
                    {copiedCode === coupon.code ? (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
                    )}
                  </button>
                ) : (
                  <div className="p-1.5 bg-white/80 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <XCircle className={`w-3.5 h-3.5 ${tabStyleMap[activeTab].icon}`} />
                  </div>
                )}
              </div>

              <div className="mt-2 flex items-center justify-between gap-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-semibold tracking-wide ${tabStyleMap[activeTab].codeBg}`}>
                  <Tag className="w-3 h-3" />
                  {coupon.code}
                </span>
                <div className="flex items-center gap-1 text-[11px] text-gray-600 dark:text-gray-300">
                  <Calendar className="w-3 h-3" />
                  <span>Valid until {formatDate(coupon.valid_until)}</span>
                </div>
              </div>

              <p className="mt-1.5 font-inter text-xs lg:text-sm text-gray-800 dark:text-gray-100 leading-snug">
                {getUsageLabel(coupon)}
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

