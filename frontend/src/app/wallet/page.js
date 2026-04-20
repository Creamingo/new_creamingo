'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  TrendingUp, 
  CreditCard, 
  MinusCircle,
  Filter,
  Loader2,
  Calendar,
  Receipt,
  Gift,
  Users,
  Activity,
  TrendingDown,
  ChevronRight,
  Tag,
  Sparkles
} from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import MobileFooter from '../../components/MobileFooter';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useWallet } from '../../contexts/WalletContext';
import { useCart } from '../../contexts/CartContext';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import walletApi from '../../api/walletApi';
import { useToast } from '../../contexts/ToastContext';
import ScratchCard from '../../components/ScratchCard';
import scratchCardApi from '../../api/scratchCardApi';
import promoCodeApi from '../../api/promoCodeApi';
import NotificationCenter from '../../components/NotificationCenter';
import { useNotifications } from '../../contexts/NotificationContext';
import { Bell } from 'lucide-react';
import { formatPrice } from '../../utils/priceFormatter';

function WalletPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: isAuthLoading } = useCustomerAuth();
  const { getItemCount, isInitialized: isCartInitialized } = useCart();
  const { balance, totalEarned, totalSpent, fetchBalance } = useWallet();
  const { showError, showInfo } = useToast();
  const { isNotificationCenterOpen, openNotificationCenter, closeNotificationCenter, unreadCount } = useNotifications();
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, credit, debit
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [scratchCards, setScratchCards] = useState([]);
  const [couponCount, setCouponCount] = useState(0);
  const [isScratchCardsLoading, setIsScratchCardsLoading] = useState(true);
  const [isCouponsLoading, setIsCouponsLoading] = useState(true);
  const [hasLoadedTransactions, setHasLoadedTransactions] = useState(false);
  const [hasLoadedScratchCards, setHasLoadedScratchCards] = useState(false);
  const [hasLoadedCoupons, setHasLoadedCoupons] = useState(false);
  const [transactionsError, setTransactionsError] = useState('');
  const [scratchCardsError, setScratchCardsError] = useState('');
  const [couponsError, setCouponsError] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // overview, transactions, scratchCards
  const [tabsSectionEl, setTabsSectionEl] = useState(null);

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated) return;
    fetchTransactions();
    fetchStats();
    fetchScratchCards();
    fetchCouponCount();
  }, [filter, isAuthenticated, isAuthLoading]);

  useEffect(() => {
    const requestedView = searchParams?.get('view');
    if (requestedView === 'referEarn') {
      router.replace('/wallet/refer-earn');
      return;
    }
    const allowedViews = new Set(['overview', 'transactions', 'scratchCards']);
    if (requestedView && allowedViews.has(requestedView)) {
      setActiveTab(requestedView);
      requestAnimationFrame(() => {
        tabsSectionEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [searchParams, tabsSectionEl, router]);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      setTransactionsError('');
      const params = {
        page: 1,
        limit: 20,
        ...(filter !== 'all' && { type: filter })
      };
      const response = await walletApi.getTransactions(params);
      if (response.success) {
        setTransactions(response.data.transactions);
        setHasMore(response.data.pagination.totalPages > 1);
      }
    } catch (err) {
      setTransactionsError('Unable to load wallet transactions right now.');
      showError('Error', 'Failed to load transactions');
      console.error('Fetch transactions error:', err);
    } finally {
      setIsLoading(false);
      setHasLoadedTransactions(true);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await walletApi.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Fetch stats error:', err);
    }
  };

  const fetchScratchCards = async () => {
    try {
      setIsScratchCardsLoading(true);
      setScratchCardsError('');
      const response = await scratchCardApi.getScratchCards();
      if (response.success) {
        setScratchCards(response.data.scratchCards);
      }
    } catch (err) {
      setScratchCardsError('Unable to load scratch cards right now.');
      console.error('Fetch scratch cards error:', err);
    } finally {
      setIsScratchCardsLoading(false);
      setHasLoadedScratchCards(true);
    }
  };

  const fetchCouponCount = async () => {
    try {
      setIsCouponsLoading(true);
      setCouponsError('');
      const coupons = await promoCodeApi.getPromoCodes(true);
      setCouponCount(Array.isArray(coupons) ? coupons.length : 0);
    } catch (err) {
      setCouponCount(0);
      setCouponsError('Unable to load coupons right now.');
      console.error('Fetch coupons error:', err);
    } finally {
      setIsCouponsLoading(false);
      setHasLoadedCoupons(true);
    }
  };

  const handleScratchCardRevealed = (scratchCardId, amount) => {
    setScratchCards(prev => prev.map(card => 
      card.id === scratchCardId 
        ? { ...card, status: 'revealed', amount }
        : card
    ));
  };

  const handleScratchCardCredited = async (scratchCardId) => {
    await fetchScratchCards();
    await fetchBalance();
  };

  const formatDate = (dateString) => {
    // Backend now sends dates in ISO format (already converted to IST)
    const date = new Date(dateString);
    
    // Format in IST
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTransactionIcon = (type) => {
    return type === 'credit' ? (
      <CreditCard className="w-5 h-5 text-emerald-500" />
    ) : (
      <MinusCircle className="w-5 h-5 text-red-500" />
    );
  };

  const getTransactionTypeLabel = (transactionType) => {
    const labels = {
      welcome_bonus: 'Welcome Bonus',
      order_cashback: 'Order Cashback',
      referral_bonus: 'Referral Bonus',
      birthday_bonus: 'Birthday Bonus',
      review_reward: 'Review Reward',
      festival_offer: 'Festival Offer',
      order_redemption: 'Order Redemption',
      order_refund: 'Order Refund',
      opening_balance: 'Opening Balance'
    };
    return labels[transactionType] || transactionType;
  };

  const trackWalletEvent = (eventName, payload = {}) => {
    if (typeof window === 'undefined') return;
    const data = { event: eventName, section: 'wallet', ...payload, t: Date.now() };
    try {
      window.dispatchEvent(new CustomEvent('creamingo:wallet', { detail: data }));
    } catch {
      // Ignore analytics failure
    }
    try {
      if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, payload);
      }
    } catch {
      // Ignore analytics failure
    }
    try {
      if (Array.isArray(window.dataLayer)) {
        window.dataLayer.push(data);
      }
    } catch {
      // Ignore analytics failure
    }
  };

  const navigateWalletSection = (nextTab, trackingPayload = {}) => {
    setActiveTab(nextTab);
    router.push(`/wallet?view=${nextTab}`, { scroll: false });
    trackWalletEvent('wallet_section_navigate', { target: nextTab, ...trackingPayload });
    requestAnimationFrame(() => {
      tabsSectionEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const cartItemCount = isCartInitialized ? getItemCount() : 0;
  const pendingScratchCount = scratchCards.filter((card) => card.status === 'pending').length;
  const unlockablePendingAmount = scratchCards
    .filter((card) => card.status === 'pending')
    .reduce((sum, card) => sum + Number(card.amount || 0), 0);
  const pendingUnlockOrders = pendingScratchCount > 0 ? pendingScratchCount : 0;
  const pendingRewardAmount = scratchCards
    .filter((card) => card.status === 'revealed')
    .reduce((sum, card) => sum + Number(card.amount || 0), 0);
  const showPendingRewardsModule = pendingRewardAmount > 0 || pendingUnlockOrders > 0;
  const scratchCountBadge = pendingScratchCount > 0 ? `${pendingScratchCount} new` : null;
  const couponsCountBadge = couponCount > 0 ? `${couponCount} available` : null;
  const shouldShowMyWalletSkeleton = !hasLoadedTransactions || !hasLoadedScratchCards || !hasLoadedCoupons;

  const handleOffersAndCoupons = () => {
    trackWalletEvent('wallet_menu_click', { item: 'offers_coupons' });
    if (!isCouponsLoading && couponCount === 0) {
      showInfo('No coupons available', 'No active coupons in your account right now.');
    }
    router.push('/account?view=coupons&source=wallet');
  };

  const handleRetryWalletData = () => {
    trackWalletEvent('wallet_retry_clicked', { source: 'wallet_page' });
    fetchTransactions();
    fetchScratchCards();
    fetchCouponCount();
    fetchStats();
    fetchBalance();
  };

  const myWalletItems = [
    { id: 'transactions', label: 'Transaction History', icon: Receipt, action: () => {
      navigateWalletSection('transactions', { item: 'transaction_history' });
    }, badge: null },
    { id: 'scratch-cards', label: 'Rewards & Scratch Cards', icon: Gift, action: () => {
      navigateWalletSection('scratchCards', { item: 'scratch_cards' });
    }, badge: scratchCountBadge },
    { id: 'refer-earn', label: 'Refer & Earn Rewards', icon: Users, action: () => {
      trackWalletEvent('wallet_menu_click', { item: 'refer_earn_redirect' });
      router.push('/wallet/refer-earn');
    }, badge: null },
    { id: 'offers-coupons', label: 'Offers & Coupons', icon: Tag, action: handleOffersAndCoupons, badge: couponsCountBadge },
    { id: 'one-rupee-deals', label: '₹1 Deals offers', icon: Sparkles, action: () => {
      trackWalletEvent('wallet_menu_click', { item: 'one_rupee_deals' });
      router.push('/account?view=coupons&source=wallet');
    } }
  ];

  const cashbackWays = [
    {
      id: 'orders',
      title: 'Place eligible orders',
      description: 'Complete orders to unlock cashback and scratch rewards.',
      icon: Receipt,
      actionLabel: 'Shop now',
      action: () => router.push('/')
    },
    {
      id: 'promo-codes',
      title: 'Use promo codes',
      description: 'Apply active coupons in cart to save more on every order.',
      icon: Tag,
      actionLabel: 'View coupons',
      action: () => router.push('/account?view=coupons&source=wallet')
    },
    {
      id: 'refer-earn',
      title: 'Refer & Earn',
      description: 'Invite friends and earn wallet rewards after their first order.',
      icon: Users,
      actionLabel: 'Refer now',
      action: () => router.push('/wallet/refer-earn')
    },
    {
      id: 'scratch-cards',
      title: 'Scratch cards',
      description: 'Reveal and credit cashback rewards after order delivery.',
      icon: Gift,
      actionLabel: 'Open scratch cards',
      action: () => navigateWalletSection('scratchCards', { source: 'cashback_ways' })
    },
    {
      id: 'special-campaigns',
      title: 'Special campaigns',
      description: 'Keep an eye on seasonal and festival cashback opportunities.',
      icon: Sparkles,
      actionLabel: null,
      action: null
    }
  ];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 overflow-x-hidden w-full max-w-full">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 lg:pt-12 pb-24 lg:pb-8 w-full">
        {/* Header with Notification Button */}
        <div className="flex items-center justify-between mb-4 lg:mb-5">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white tracking-tight">Wallet</h1>
          <button
            onClick={openNotificationCenter}
            className="relative bg-gray-100 dark:bg-gray-800 rounded-full p-2 text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-600 text-white text-xs font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-800">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Wallet Overview Card - Compact P0 layout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-6 lg:mb-8"
        >
          {hasLoadedTransactions ? (
            <div className="rounded-3xl border border-pink-200/80 dark:border-pink-900/50 bg-gradient-to-br from-pink-50 via-white to-rose-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-700 p-3.5 sm:p-4 lg:p-5 shadow-lg dark:shadow-xl dark:shadow-black/20">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">Wallet Balance</p>
                  <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mt-0.5 tracking-tight tabular-nums">
                    {formatPrice(balance)}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Available to use on orders
                  </p>
                </div>
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center border border-pink-200 dark:border-pink-800">
                  <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600 dark:text-pink-300" />
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-pink-100 dark:border-gray-700 flex items-center flex-wrap gap-x-3 gap-y-1.5 text-sm sm:text-base">
                <div className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold tabular-nums">
                  <TrendingUp className="w-4 h-4" />
                  <span>Earned {formatPrice(totalEarned)}</span>
                </div>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <div className="inline-flex items-center gap-1.5 text-red-600 dark:text-red-400 font-semibold tabular-nums">
                  <TrendingDown className="w-4 h-4" />
                  <span>Spent {formatPrice(totalSpent)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-pink-200/80 dark:border-pink-900/50 bg-white dark:bg-gray-800 p-3.5 sm:p-4 lg:p-5 shadow-lg dark:shadow-xl dark:shadow-black/20 animate-pulse">
              <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-9 w-32 bg-gray-200 dark:bg-gray-700 rounded mt-2.5" />
              <div className="h-3 w-44 bg-gray-200 dark:bg-gray-700 rounded mt-2.5" />
              <div className="h-px bg-gray-200 dark:bg-gray-700 my-3" />
              <div className="flex items-center gap-3">
                <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
          )}
        </motion.div>

        {/* Wallet Growth Steps - compact guidance strip */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-5 lg:mb-6"
        >
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'step-order', title: 'Place Order', subtitle: 'Complete eligible orders', icon: Receipt },
              { id: 'step-scratch', title: 'Scratch Card', subtitle: 'Reveal cashback rewards', icon: Gift },
              { id: 'step-credit', title: 'Get Cashback', subtitle: 'Auto-credited after delivery', icon: Wallet }
            ].map((step) => {
              const StepIcon = step.icon;
              return (
                <div
                  key={step.id}
                  className="rounded-xl border border-pink-100 dark:border-pink-900/40 bg-white dark:bg-gray-800 px-2.5 py-2.5 text-center shadow-sm"
                >
                  <div className="mx-auto mb-1.5 w-7 h-7 rounded-full bg-pink-50 dark:bg-pink-900/25 border border-pink-100 dark:border-pink-800/40 flex items-center justify-center">
                    <StepIcon className="w-3.5 h-3.5 text-pink-600 dark:text-pink-300" />
                  </div>
                  <p className="text-[11px] sm:text-xs font-semibold text-gray-900 dark:text-gray-100 leading-tight">{step.title}</p>
                  <p className="mt-0.5 text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 leading-tight">{step.subtitle}</p>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Pending Rewards Module - P2 */}
        {showPendingRewardsModule && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.07 }}
            className="mb-5 lg:mb-6"
          >
            <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 px-4 py-3.5">
              {cartItemCount > 0 ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm sm:text-base font-semibold text-amber-900 dark:text-amber-200">
                      You have {cartItemCount} item{cartItemCount > 1 ? 's' : ''} pending in cart.
                    </p>
                    <button
                      onClick={() => router.push('/cart')}
                      className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-amber-800 dark:text-amber-200 hover:text-amber-900 dark:hover:text-amber-100 transition-colors whitespace-nowrap"
                    >
                      <span>Cart</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300 mt-1">
                    Complete your order to unlock wallet cashback rewards.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm sm:text-base font-semibold text-amber-900 dark:text-amber-200">
                    {pendingRewardAmount > 0 ? formatPrice(pendingRewardAmount) : formatPrice(unlockablePendingAmount)} pending
                  </p>
                  <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300 mt-1">
                    Keep ordering to unlock and credit more wallet rewards.
                  </p>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* My Wallet - P0 list layout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mb-6 lg:mb-8 bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <div className="px-4 sm:px-5 py-3.5 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white tracking-tight">
              My Wallet
            </h2>
          </div>
          {(transactionsError || scratchCardsError || couponsError) && (
            <div className="px-4 sm:px-5 py-3 bg-red-50/70 dark:bg-red-900/10 border-b border-red-100 dark:border-red-900/30">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs sm:text-sm text-red-700 dark:text-red-300">
                  Some wallet details could not be loaded.
                </p>
                <button
                  onClick={handleRetryWalletData}
                  className="text-xs font-semibold text-red-700 dark:text-red-300 hover:underline"
                >
                  Retry
                </button>
              </div>
            </div>
          )}
          <div>
            {shouldShowMyWalletSkeleton ? (
              <div className="px-4 sm:px-5 py-4 space-y-3">
                {[1, 2, 3].map((row) => (
                  <div key={row} className="animate-pulse flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    <div className="ml-auto h-3 w-3 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                ))}
              </div>
            ) : (
              myWalletItems.map((item, index) => {
                const ItemIcon = item.icon;
                const isLast = index === myWalletItems.length - 1;
                const isReferAndEarn = item.id === 'refer-earn';
                return (
                  <button
                    key={item.id}
                    onClick={item.action}
                    aria-label={item.label}
                    title={item.label}
                    className={`w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 min-h-[52px] active:scale-[0.995] transition-all relative ${
                      isReferAndEarn
                        ? 'bg-pink-50/70 dark:bg-pink-900/15 hover:bg-pink-100/70 dark:hover:bg-pink-900/25'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/40'
                    }`}
                  >
                    {!isLast && (
                      <div className="absolute left-4 sm:left-5 right-4 sm:right-5 bottom-0 h-px bg-gray-200 dark:bg-gray-700" />
                    )}
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isReferAndEarn
                          ? 'bg-pink-100 dark:bg-pink-900/35 border border-pink-200 dark:border-pink-800'
                          : 'bg-gray-100 dark:bg-gray-700'
                      }`}
                    >
                      <ItemIcon
                        className={`w-[18px] h-[18px] ${
                          isReferAndEarn
                            ? 'text-pink-600 dark:text-pink-300'
                            : 'text-gray-700 dark:text-gray-200'
                        }`}
                      />
                    </div>
                    <span
                      className={`flex-1 text-left text-sm sm:text-base font-medium ${
                        isReferAndEarn
                          ? 'text-pink-700 dark:text-pink-300'
                          : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {item.label}
                    </span>
                    {isReferAndEarn && (
                      <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300">
                        Earn cashback
                      </span>
                    )}
                    {item.badge && (
                      <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300">
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  </button>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          ref={setTabsSectionEl}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-4 sm:p-6"
        >
          {/* Segment tabs: all options visible (no horizontal scroll) */}
          <div className="mb-6">
            <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-gray-100 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-700">
              {[
                { id: 'overview', label: 'Overview', icon: Wallet },
                { id: 'transactions', label: 'Transactions', icon: Receipt },
                { id: 'scratchCards', label: 'Scratch Cards', icon: Gift }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => navigateWalletSection(tab.id, { source: 'tab_click' })}
                    className={`min-h-[52px] rounded-xl px-2.5 py-2 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 transition-all ${
                      isActive
                        ? 'bg-white dark:bg-gray-800 text-pink-600 dark:text-pink-400 font-semibold shadow-sm ring-1 ring-pink-200/80 dark:ring-pink-800/50'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5 flex-shrink-0" />
                    <span className="text-[11px] sm:text-sm font-medium leading-tight text-center">
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6 lg:space-y-8">
              {/* Stats Cards */}
              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                  <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-xl p-5 lg:p-6 border border-pink-200 dark:border-pink-800 shadow-md">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Earned</p>
                      <TrendingUp className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                    </div>
                    <p className="text-2xl lg:text-3xl font-bold text-pink-600 dark:text-pink-400 tabular-nums">{formatPrice(stats.totalEarned)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl p-5 lg:p-6 border border-emerald-200 dark:border-emerald-800 shadow-md">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Spent</p>
                      <TrendingDown className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-2xl lg:text-3xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatPrice(stats.totalSpent)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-5 lg:p-6 border border-blue-200 dark:border-blue-800 shadow-md">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Transactions</p>
                      <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-2xl lg:text-3xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">{stats.totalTransactions}</p>
                  </div>
                </div>
              )}

              {/* Recent Transactions Preview */}
              <div>
                <div className="flex items-center justify-between gap-3 mb-4 lg:mb-6">
                  <h3 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-gray-100">Recent Transactions</h3>
                  <button
                    onClick={() => {
                      trackWalletEvent('wallet_view_all_transactions_clicked', { source: 'overview_preview' });
                      navigateWalletSection('transactions', { source: 'overview_preview' });
                    }}
                    className="text-sm font-semibold text-pink-600 dark:text-pink-400 hover:underline"
                  >
                    View all
                  </button>
                </div>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-pink-600 animate-spin" />
                  </div>
                ) : transactionsError ? (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center border border-red-200 dark:border-red-900/40">
                    <p className="text-sm text-red-700 dark:text-red-300 mb-3">{transactionsError}</p>
                    <button
                      onClick={fetchTransactions}
                      className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-700 dark:text-gray-200 font-medium">No transactions yet</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your wallet activity will appear here once you start ordering.</p>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 lg:p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="space-y-3">
                      {transactions.slice(0, 2).map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              tx.type === 'credit' 
                                ? 'bg-emerald-100 dark:bg-emerald-900/30' 
                                : 'bg-red-100 dark:bg-red-900/30'
                            }`}>
                              {getTransactionIcon(tx.type)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-relaxed">{getTransactionTypeLabel(tx.transactionType)}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{formatDate(tx.createdAt)}</p>
                            </div>
                          </div>
                          <p className={`text-sm font-bold tabular-nums ${tx.type === 'credit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            {tx.type === 'credit' ? '+' : '-'}{formatPrice(tx.amount)}
                          </p>
                        </div>
                      ))}
                    </div>
                    {transactions.length > 2 && (
                      <button
                        onClick={() => {
                          trackWalletEvent('wallet_view_all_transactions_clicked', { source: 'overview_footer' });
                          navigateWalletSection('transactions', { source: 'overview_footer' });
                        }}
                        className="mt-4 w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                      >
                        View all transactions
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div>
              {/* Header - Stack on mobile, side-by-side on desktop */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Receipt className="w-5 h-5 sm:w-6 sm:h-6" />
                  Transaction History
                </h2>
            
                {/* Filter Buttons - Better organized for mobile */}
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-xl p-1.5 w-full sm:w-auto">
                  {['all', 'credit', 'debit'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all min-h-[44px] ${
                        filter === f
                          ? 'bg-white dark:bg-gray-600 text-pink-600 dark:text-pink-400 shadow-sm border border-pink-200 dark:border-pink-800'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 border border-transparent'
                      }`}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

          {/* Transactions List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-pink-600 animate-spin" />
            </div>
          ) : transactionsError ? (
            <div className="text-center py-12 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-900/30">
              <p className="text-red-700 dark:text-red-300 font-medium mb-3">{transactionsError}</p>
              <button
                onClick={fetchTransactions}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-700 dark:text-gray-200 font-medium">No transactions found</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Credits and spends will show up here after your first order.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-4 lg:p-5 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                      tx.type === 'credit' 
                        ? 'bg-emerald-100 dark:bg-emerald-900/30' 
                        : 'bg-red-100 dark:bg-red-900/30'
                    }`}>
                      {getTransactionIcon(tx.type)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100 leading-relaxed">
                        {getTransactionTypeLabel(tx.transactionType)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {tx.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {formatDate(tx.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg lg:text-xl font-bold tabular-nums ${
                      tx.type === 'credit' 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {tx.type === 'credit' ? '+' : '-'}{formatPrice(tx.amount)}
                    </p>
                    {tx.status !== 'completed' && (
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium mt-1.5 inline-block ${
                        tx.status === 'pending' 
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                      }`}>
                        {tx.status}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          </div>
          )}

          {/* Scratch Cards Tab */}
          {activeTab === 'scratchCards' && (
            <div>
              <div className="mb-4 lg:mb-5 rounded-2xl border border-pink-200/70 dark:border-pink-800/40 bg-gradient-to-r from-pink-50/80 via-white to-purple-50/70 dark:from-pink-900/15 dark:via-gray-800 dark:to-purple-900/20 p-3.5 sm:p-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2.5 mb-1.5">
                  <span className="w-9 h-9 rounded-xl bg-white dark:bg-gray-800 border border-pink-200 dark:border-pink-800 flex items-center justify-center shadow-sm">
                    <Gift className="w-4.5 h-4.5 text-pink-600 dark:text-pink-300" />
                  </span>
                  Your Cashback Rewards
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-snug">
                  Scratch cards unlock wallet cashback from your delivered orders.
                </p>
              </div>

              {isScratchCardsLoading ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5 lg:gap-4">
                  {[1, 2, 3, 4].map((skeleton) => (
                    <div key={skeleton} className="animate-pulse rounded-3xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-3 h-48" />
                  ))}
                </div>
              ) : scratchCardsError ? (
                <div className="text-center py-12 lg:py-16 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-900/30">
                  <p className="text-red-700 dark:text-red-300 mb-3 font-medium">{scratchCardsError}</p>
                  <button
                    onClick={fetchScratchCards}
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : scratchCards.length === 0 ? (
                <div className="text-center py-12 lg:py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <Gift className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-700 dark:text-gray-200 mb-2 font-medium">No scratch cards yet</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Complete eligible orders to unlock rewards and scratch cards.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5 lg:gap-4">
                  {scratchCards.map((card) => (
                    <ScratchCard
                      key={card.id}
                      scratchCard={card}
                      onRevealed={handleScratchCardRevealed}
                      onCredited={handleScratchCardCredited}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

        </motion.div>

        {/* Cashback Education Section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
          className="mt-6 lg:mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-4 sm:p-5 lg:p-6"
        >
          <div className="mb-4">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              More ways to earn cashback
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Explore these simple actions to grow your wallet rewards faster.
            </p>
          </div>

          <div className="space-y-2.5">
            {cashbackWays.map((way) => {
              const WayIcon = way.icon;
              return (
                <div
                  key={way.id}
                  className="rounded-xl border border-pink-100/80 dark:border-pink-900/40 bg-gradient-to-r from-pink-50/60 to-white dark:from-gray-800 dark:to-gray-800 px-3.5 py-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-700 border border-pink-100 dark:border-pink-800/40 flex items-center justify-center flex-shrink-0">
                      <WayIcon className="w-4 h-4 text-pink-600 dark:text-pink-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                        {way.title}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">
                        {way.description}
                      </p>
                    </div>
                    {way.action && way.actionLabel && (
                      <button
                        onClick={way.action}
                        className="text-xs sm:text-sm font-semibold text-pink-600 dark:text-pink-300 hover:text-pink-700 dark:hover:text-pink-200 whitespace-nowrap transition-colors"
                      >
                        {way.actionLabel}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
        </div>

        {/* Website Footer - Visually hidden but kept in DOM for SEO */}
        <div className="sr-only">
          <Footer />
        </div>
        <div className="lg:hidden">
          <MobileFooter walletAmount={balance} />
        </div>
        
        {/* Notification Center */}
        <NotificationCenter
          isOpen={isNotificationCenterOpen}
          onClose={closeNotificationCenter}
        />
      </div>
    </>
  );
}

export default function WalletPage() {
  return (
    <ProtectedRoute>
      <WalletPageContent />
    </ProtectedRoute>
  );
}

