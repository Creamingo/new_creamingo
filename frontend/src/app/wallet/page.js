'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  TrendingDown
} from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import MobileFooter from '../../components/MobileFooter';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useWallet } from '../../contexts/WalletContext';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import walletApi from '../../api/walletApi';
import { useToast } from '../../contexts/ToastContext';
import ScratchCard from '../../components/ScratchCard';
import scratchCardApi from '../../api/scratchCardApi';
import ReferAndEarn from '../../components/ReferAndEarn';
import NotificationCenter from '../../components/NotificationCenter';
import { useNotifications } from '../../contexts/NotificationContext';
import { Bell } from 'lucide-react';
import { formatPrice } from '../../utils/priceFormatter';

function WalletPageContent() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useCustomerAuth();
  const { balance, totalEarned, totalSpent, fetchBalance } = useWallet();
  const { showError } = useToast();
  const { isNotificationCenterOpen, openNotificationCenter, closeNotificationCenter, unreadCount } = useNotifications();
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, credit, debit
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [scratchCards, setScratchCards] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // overview, transactions, scratchCards, referEarn

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated) return;
    fetchTransactions();
    fetchStats();
    fetchScratchCards();
  }, [filter, isAuthenticated, isAuthLoading]);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
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
      showError('Error', 'Failed to load transactions');
      console.error('Fetch transactions error:', err);
    } finally {
      setIsLoading(false);
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
      const response = await scratchCardApi.getScratchCards();
      if (response.success) {
        setScratchCards(response.data.scratchCards);
      }
    } catch (err) {
      console.error('Fetch scratch cards error:', err);
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

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 overflow-x-hidden w-full max-w-full">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 lg:pt-12 pb-24 lg:pb-8 w-full">
        {/* Header with Notification Button */}
        <div className="flex items-center justify-between mb-6 lg:mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white tracking-tight">Wallet</h1>
          <button
            onClick={openNotificationCenter}
            className="relative bg-gray-100 dark:bg-gray-800 rounded-full p-2.5 text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-600 text-white text-xs font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-800">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Wallet Overview Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-6 lg:mb-8"
        >
          <div className="bg-gradient-to-br from-pink-600 via-rose-600 to-pink-700 rounded-3xl p-4 sm:p-5 lg:p-6 shadow-xl dark:shadow-2xl dark:shadow-black/30 overflow-hidden">
            {/* Background Pattern - Reduced opacity */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full -ml-24 -mb-24"></div>
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-pink-100 text-xs font-medium mb-2">Available Balance</p>
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-1 tracking-tight tabular-nums">
                    {formatPrice(balance)}
                  </h1>
                </div>
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <Wallet className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-white/20 my-4"></div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/20 rounded-xl p-3 sm:p-4 border border-white/30">
                  <p className="text-pink-100 text-xs font-medium mb-1">Total Earned</p>
                  <p className="text-white text-lg sm:text-xl font-semibold tabular-nums">{formatPrice(totalEarned)}</p>
                </div>
                <div className="bg-white/20 rounded-xl p-3 sm:p-4 border border-white/30">
                  <p className="text-pink-100 text-xs font-medium mb-1">Total Spent</p>
                  <p className="text-white text-lg sm:text-xl font-semibold tabular-nums">{formatPrice(totalSpent)}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Refer & Earn Card - Below Available Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 lg:mb-8"
        >
          <ReferAndEarn 
            compact={true} 
            onReferNowClick={() => setActiveTab('referEarn')}
          />
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-4 sm:p-6"
        >
          {/* Scrollable tabs container for mobile */}
          <div className="mb-6">
            <div className="overflow-x-auto scrollbar-hide -mx-4 sm:mx-0 px-4 sm:px-0 w-full">
              <div className="flex items-center gap-2 sm:gap-3 min-w-max sm:min-w-0">
                {[
                  { id: 'overview', label: 'Overview', icon: Wallet },
                  { id: 'transactions', label: 'Transactions', icon: Receipt },
                  { id: 'scratchCards', label: 'Scratch Cards', icon: Gift },
                  { id: 'referEarn', label: 'Refer & Earn', icon: Users }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 sm:px-5 py-3 rounded-xl transition-all whitespace-nowrap flex-shrink-0 min-h-[44px] ${
                        activeTab === tab.id
                          ? 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 font-semibold shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm sm:text-base font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
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
                <h3 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 lg:mb-6">Recent Transactions</h3>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-pink-600 animate-spin" />
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400">No transactions yet</p>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 lg:p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="space-y-3">
                      {transactions.slice(0, 5).map((tx) => (
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
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No transactions found</p>
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
              <div className="mb-6 lg:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-2">
                  <Gift className="w-6 h-6" />
                  Your Cashback Rewards
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Scratch and reveal cashback rewards from your completed orders
                </p>
              </div>

              {scratchCards.length === 0 ? (
                <div className="text-center py-12 lg:py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <Gift className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-2 font-medium">No cashback rewards yet</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Scratch cards will appear here after your orders are delivered
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
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

          {/* Refer & Earn Tab */}
          {activeTab === 'referEarn' && (
            <div>
              <ReferAndEarn />
            </div>
          )}
        </motion.div>
        </div>

        <Footer />
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

