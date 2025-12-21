'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Share2, 
  Copy, 
  Check, 
  Users, 
  TrendingUp, 
  Gift, 
  MessageCircle, 
  Mail, 
  Link2,
  Loader2,
  Sparkles,
  Trophy,
  BarChart3,
  Award,
  Crown,
  TrendingDown,
  Activity
} from 'lucide-react';
import referralApi from '../api/referralApi';
import { useToast } from '../contexts/ToastContext';
import { formatPrice } from '../utils/priceFormatter';

const ReferAndEarn = ({ compact = false, onReferNowClick }) => {
  const { showSuccess, showError } = useToast();
  const [referralData, setReferralData] = useState(null);
  const [milestoneData, setMilestoneData] = useState(null);
  const [tierData, setTierData] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [userRank, setUserRank] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [shareMethod, setShareMethod] = useState(null);
  const [activeSection, setActiveSection] = useState('overview'); // overview, tier, leaderboard, analytics

  useEffect(() => {
    fetchReferralInfo();
    fetchMilestoneProgress();
    fetchTierProgress();
    fetchLeaderboard();
    fetchUserRank();
    fetchAnalytics();
  }, []);

  const fetchReferralInfo = async () => {
    try {
      setLoading(true);
      const response = await referralApi.getReferralInfo();
      if (response.success) {
        setReferralData(response.data);
      } else {
        console.error('Referral API response not successful:', response);
        setReferralData(null);
      }
    } catch (error) {
      console.error('Fetch referral info error:', error);
      setReferralData(null);
      // Don't show error toast on initial load to avoid spam
      if (referralData !== null) {
        showError('Error', error.message || 'Failed to load referral information');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMilestoneProgress = async () => {
    try {
      const response = await referralApi.getMilestoneProgress();
      if (response.success) {
        setMilestoneData(response.data);
      }
    } catch (error) {
      console.error('Fetch milestone progress error:', error);
      // Silently fail - milestones are optional
    }
  };

  const fetchTierProgress = async () => {
    try {
      const response = await referralApi.getTierProgress();
      if (response.success) {
        setTierData(response.data);
      }
    } catch (error) {
      console.error('Fetch tier progress error:', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await referralApi.getLeaderboard(20, 'all');
      if (response.success) {
        setLeaderboardData(response.data);
      }
    } catch (error) {
      console.error('Fetch leaderboard error:', error);
    }
  };

  const fetchUserRank = async () => {
    try {
      const response = await referralApi.getUserLeaderboardPosition();
      if (response.success) {
        setUserRank(response.data);
      }
    } catch (error) {
      console.error('Fetch user rank error:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await referralApi.getReferralAnalytics('30');
      if (response.success) {
        setAnalyticsData(response.data);
      }
    } catch (error) {
      console.error('Fetch analytics error:', error);
    }
  };

  const getReferralLink = () => {
    if (!referralData?.referralCode) return '';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/signup?ref=${referralData.referralCode}`;
  };

  const copyToClipboard = async () => {
    const link = getReferralLink();
    if (!link) return;

    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      showSuccess('Copied!', 'Referral link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      showError('Error', 'Failed to copy link');
    }
  };

  const shareViaWhatsApp = () => {
    const link = getReferralLink();
    const message = encodeURIComponent(
      `🎉 Join Creamingo and get ₹50 welcome bonus + ₹25 extra when you use my referral code!\n\nUse code: ${referralData?.referralCode}\n\nSign up here: ${link}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
    setShareMethod('whatsapp');
    setTimeout(() => setShareMethod(null), 2000);
  };

  const shareViaSMS = () => {
    const link = getReferralLink();
    const message = encodeURIComponent(
      `Join Creamingo and get ₹50 welcome bonus + ₹25 extra! Use my referral code: ${referralData?.referralCode}. Sign up: ${link}`
    );
    window.open(`sms:?body=${message}`, '_blank');
    setShareMethod('sms');
    setTimeout(() => setShareMethod(null), 2000);
  };

  const shareViaEmail = () => {
    const link = getReferralLink();
    const subject = encodeURIComponent('Join Creamingo with my referral code!');
    const body = encodeURIComponent(
      `Hi!\n\nI'm inviting you to join Creamingo! When you sign up using my referral code, you'll get:\n\n✨ ₹50 Welcome Bonus\n✨ ₹25 Extra Bonus\n\nUse my referral code: ${referralData?.referralCode}\n\nSign up here: ${link}\n\nI'll also get ₹50 when you complete your first order!\n\nThanks!`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    setShareMethod('email');
    setTimeout(() => setShareMethod(null), 2000);
  };

  const copyReferralCode = async () => {
    if (!referralData?.referralCode) return;

    try {
      await navigator.clipboard.writeText(referralData.referralCode);
      showSuccess('Copied!', 'Referral code copied to clipboard');
    } catch (error) {
      showError('Error', 'Failed to copy code');
    }
  };

  const referralLink = getReferralLink();

  if (compact) {
    // Compact version matching the screenshot style - always visible
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
              Refer & Earn
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Invite your friends to Creamingo and earn wallet money
            </p>
            <button
              onClick={() => {
                if (onReferNowClick) {
                  onReferNowClick();
                } else if (referralData?.referralCode) {
                  copyReferralCode();
                }
              }}
              disabled={loading}
              className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm transition-all shadow-sm hover:shadow-md"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </span>
              ) : (
                'Refer now'
              )}
            </button>
          </div>
          <div className="hidden sm:block flex-shrink-0">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 rounded-2xl flex items-center justify-center">
                <div className="relative">
                  <Gift className="w-12 h-12 sm:w-14 sm:h-14 text-pink-500 dark:text-pink-400" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                    <Users className="w-3 h-3 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full version - show loading/error states
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-pink-600 animate-spin" />
      </div>
    );
  }

  if (!referralData) {
    return (
      <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-xl p-6 border border-pink-200 dark:border-pink-800">
        <div className="text-center py-8">
          <Gift className="w-12 h-12 text-pink-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Unable to load referral information. Please try refreshing the page.
          </p>
          <button
            onClick={fetchReferralInfo}
            className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Full version
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 dark:from-pink-900/30 dark:via-rose-900/20 dark:to-pink-900/30 rounded-2xl p-6 border-2 border-pink-200 dark:border-pink-800 shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center shadow-lg">
            <Gift className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Refer & Earn
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Share with friends and earn rewards!
            </p>
          </div>
        </div>
        <div className="relative">
          <Sparkles className="w-6 h-6 text-pink-500 animate-pulse" />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-pink-200 dark:border-pink-700">
        {[
          { id: 'overview', label: 'Overview', icon: Gift },
          { id: 'tier', label: 'Tier', icon: Crown },
          { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors border-b-2 ${
                activeSection === tab.id
                  ? 'border-pink-600 text-pink-600 dark:text-pink-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Overview Section */}
      {activeSection === 'overview' && (
        <>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-3 border border-pink-200 dark:border-pink-700">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Referrals</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {referralData.totalReferrals || 0}
          </p>
        </div>
        <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-3 border border-pink-200 dark:border-pink-700">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Completed</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {referralData.completedReferrals || 0}
          </p>
        </div>
        <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-3 border border-pink-200 dark:border-pink-700">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Earned</p>
          <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
            {formatPrice(referralData.totalEarnings || 0)}
          </p>
        </div>
        <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-3 border border-pink-200 dark:border-pink-700">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Pending</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {formatPrice(referralData.pendingEarnings || 0)}
          </p>
        </div>
      </div>

      {/* Referral Code Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-pink-300 dark:border-pink-700 mb-6">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Your Referral Code
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-pink-50 dark:bg-pink-900/20 rounded-lg px-4 py-3">
            <p className="font-mono font-bold text-lg text-pink-600 dark:text-pink-400 text-center">
              {referralData.referralCode}
            </p>
          </div>
          <button
            onClick={copyReferralCode}
            className="px-4 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Copy
          </button>
        </div>
      </div>

      {/* Referral Link Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-pink-200 dark:border-pink-700 mb-6">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Your Referral Link
        </p>
        <div className="flex items-center gap-2 w-full overflow-hidden">
          <div className="flex-1 min-w-0 bg-gray-50 dark:bg-gray-900 rounded-lg px-3 sm:px-4 py-2.5 border border-gray-200 dark:border-gray-700 overflow-hidden">
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate font-mono break-all">
              {referralLink}
            </p>
          </div>
          <button
            onClick={copyToClipboard}
            className={`px-3 sm:px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ${
              copied
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                : 'bg-pink-600 hover:bg-pink-700 text-white'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span className="hidden sm:inline">Copied!</span>
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4" />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Share Buttons */}
      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Share via
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={shareViaWhatsApp}
            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
              shareMethod === 'whatsapp'
                ? 'bg-green-500 border-green-600 text-white'
                : 'bg-white dark:bg-gray-800 border-green-300 dark:border-green-700 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
            }`}
          >
            <MessageCircle className="w-6 h-6" />
            <span className="text-xs font-medium">WhatsApp</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={shareViaSMS}
            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
              shareMethod === 'sms'
                ? 'bg-blue-500 border-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
            }`}
          >
            <MessageCircle className="w-6 h-6" />
            <span className="text-xs font-medium">SMS</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={shareViaEmail}
            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
              shareMethod === 'email'
                ? 'bg-purple-500 border-purple-600 text-white'
                : 'bg-white dark:bg-gray-800 border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
            }`}
          >
            <Mail className="w-6 h-6" />
            <span className="text-xs font-medium">Email</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={copyToClipboard}
            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
              copied
                ? 'bg-emerald-500 border-emerald-600 text-white'
                : 'bg-white dark:bg-gray-800 border-pink-300 dark:border-pink-700 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-6 h-6" />
                <span className="text-xs font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Link2 className="w-6 h-6" />
                <span className="text-xs font-medium">Copy Link</span>
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Milestones Section */}
      {milestoneData && (
        <div className="mt-6 pt-6 border-t border-pink-200 dark:border-pink-700">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-600" />
              Milestones & Rewards
            </h4>
            {milestoneData.totalMilestoneBonuses > 0 && (
              <span className="text-sm font-semibold text-pink-600 dark:text-pink-400">
                Earned: {formatPrice(milestoneData.totalMilestoneBonuses)}
              </span>
            )}
          </div>

          {/* Next Milestone */}
          {milestoneData.nextMilestone && (
            <div className="mb-6 p-4 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-xl border border-pink-200 dark:border-pink-700">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Next Milestone: {milestoneData.nextMilestone.name}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {milestoneData.nextMilestone.description}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-pink-600 dark:text-pink-400">
                    ₹{milestoneData.nextMilestone.bonus}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Reward</p>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                  <span>
                    {milestoneData.completedReferrals} / {milestoneData.nextMilestone.referrals} referrals
                  </span>
                  <span>{milestoneData.nextMilestone.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${milestoneData.nextMilestone.progress}%` }}
                    transition={{ duration: 0.5 }}
                    className="bg-gradient-to-r from-pink-500 to-rose-500 h-2.5 rounded-full"
                  />
                </div>
              </div>
            </div>
          )}

          {/* All Milestones */}
          <div className="space-y-3">
            {milestoneData.milestones.map((milestone, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border-2 ${
                  milestone.isAchieved
                    ? 'bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-300 dark:border-emerald-700'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {milestone.isAchieved ? (
                      <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                        <Check className="w-6 h-6 text-white" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <Gift className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className={`font-semibold ${milestone.isAchieved ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-900 dark:text-white'}`}>
                        {milestone.name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {milestone.referrals} referrals • {milestone.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${milestone.isAchieved ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                      ₹{milestone.bonus}
                    </p>
                  </div>
                </div>
                {!milestone.isAchieved && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>{milestone.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div
                        className="bg-gradient-to-r from-pink-400 to-rose-400 h-1.5 rounded-full transition-all"
                        style={{ width: `${milestone.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* How it Works */}
      <div className="mt-6 pt-6 border-t border-pink-200 dark:border-pink-700">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-pink-600" />
          How it Works
        </h4>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-start gap-2">
            <span className="font-bold text-pink-600">1.</span>
            <span>Share your referral code or link with friends</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-pink-600">2.</span>
            <span>They sign up using your code and get ₹50 welcome bonus + ₹25 extra</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-pink-600">3.</span>
            <span>When they complete their first order, you get ₹50 in your wallet!</span>
          </div>
        </div>
      </div>

      {/* Recent Referrals */}
      {referralData.recentReferrals && referralData.recentReferrals.length > 0 && (
        <div className="mt-6 pt-6 border-t border-pink-200 dark:border-pink-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-pink-600" />
            Recent Referrals
          </h4>
          <div className="space-y-2">
            {referralData.recentReferrals.slice(0, 5).map((referral, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {referral.referee_name || referral.referee_email || 'Anonymous'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(referral.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      referral.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : referral.status === 'credited'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}
                  >
                    {referral.status}
                  </span>
                  {referral.referrer_bonus_credited && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                      ₹{referral.referrer_bonus_amount} credited
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
        </>
      )}

      {/* Tier System Section */}
      {activeSection === 'tier' && tierData && (
        <div className="space-y-4 sm:space-y-6">
          {/* Current Tier Card - Mobile Optimized */}
          <div className={`bg-gradient-to-br ${tierData.currentTier.badgeColor} rounded-2xl p-4 sm:p-6 border-2 border-opacity-50 shadow-lg`}>
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm flex-shrink-0">
                  <span className="text-2xl sm:text-3xl">{tierData.currentTier.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-white/80 mb-0.5">Your Current Tier</p>
                  <h3 className="text-xl sm:text-3xl font-bold text-white leading-tight">
                    {tierData.currentTier.name || tierData.currentTier.tier}
                  </h3>
                  <p className="text-xs sm:text-sm text-white/70 mt-0.5">{tierData.currentTier.tier} Tier</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <p className="text-xs sm:text-sm text-white/80 mb-0.5">Bonus</p>
                <p className="text-xl sm:text-2xl font-bold text-white">{(tierData.bonusMultiplier * 100).toFixed(0)}%</p>
              </div>
            </div>
            <div className="bg-white/20 rounded-xl p-3 sm:p-4 backdrop-blur-sm">
              <p className="text-white font-semibold mb-2 text-sm sm:text-base">Tier Benefits:</p>
              <ul className="space-y-1.5 text-white/90 text-xs sm:text-sm">
                {tierData.currentTier.benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0" />
                    <span className="leading-relaxed">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Next Tier Progress - Mobile Optimized */}
          {tierData.nextTier && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 border border-pink-200 dark:border-pink-700">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-pink-50 dark:bg-pink-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xl sm:text-2xl">{tierData.nextTier.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-0.5">Next Tier</p>
                    <h4 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white leading-tight">
                      {tierData.nextTier.name || tierData.nextTier.tier}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{tierData.nextTier.tier} Tier</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-0.5">Needed</p>
                  <p className="text-xl sm:text-2xl font-bold text-pink-600 dark:text-pink-400">
                    {tierData.referralsNeeded}
                  </p>
                </div>
              </div>
              <div className="mt-3 sm:mt-4">
                <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1.5 sm:mb-2">
                  <span>Progress to {tierData.nextTier.tier}</span>
                  <span className="font-semibold">{tierData.progressToNextTier}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 sm:h-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${tierData.progressToNextTier}%` }}
                    transition={{ duration: 0.5 }}
                    className={`bg-gradient-to-r ${tierData.nextTier.badgeColor} h-2 sm:h-3 rounded-full`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* All Tiers - Mobile Optimized */}
          <div className="space-y-2 sm:space-y-3">
            <h4 className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg px-1">All Tiers</h4>
            {tierData.allTiers.map((tier, index) => {
              const isCurrentTier = tier.tier === tierData.currentTier.tier;
              const isUnlocked = tierData.completedReferrals >= tier.minReferrals;
              return (
                <div
                  key={index}
                  className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${
                    isCurrentTier
                      ? `bg-gradient-to-r ${tier.badgeColor} border-opacity-50 text-white shadow-md`
                      : isUnlocked
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isCurrentTier 
                          ? 'bg-white/20 backdrop-blur-sm' 
                          : isUnlocked
                          ? 'bg-emerald-100 dark:bg-emerald-900/30'
                          : 'bg-gray-100 dark:bg-gray-700'
                      }`}>
                        <span className="text-lg sm:text-xl">{tier.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm sm:text-base truncate ${isCurrentTier ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                          {tier.name || tier.tier}
                        </p>
                        <p className={`text-xs sm:text-sm mt-0.5 ${isCurrentTier ? 'text-white/80' : 'text-gray-600 dark:text-gray-400'}`}>
                          {tier.tier} • {tier.minReferrals} - {tier.maxReferrals === Infinity ? '∞' : tier.maxReferrals} refs
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {isCurrentTier && (
                        <span className="px-2.5 py-1 bg-white/20 rounded-full text-xs font-semibold text-white whitespace-nowrap">
                          Current
                        </span>
                      )}
                      {!isCurrentTier && isUnlocked && (
                        <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Leaderboard Section */}
      {activeSection === 'leaderboard' && (
        <div className="space-y-6">
          {/* User Rank Card */}
          {userRank && (
            <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/80 mb-1">Your Rank</p>
                  <h3 className="text-4xl font-bold">
                    #{userRank.rank || '—'}
                  </h3>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-sm text-white/80">Completed</p>
                  <p className="text-2xl font-bold">{userRank.completedReferrals}</p>
                  <p className="text-sm text-white/80">Total Earned</p>
                  <p className="text-xl font-bold">{formatPrice(userRank.totalEarnings)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard List */}
          {leaderboardData && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-pink-200 dark:border-pink-700 overflow-hidden">
              <div className="p-4 border-b border-pink-200 dark:border-pink-700">
                <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-pink-600" />
                  Top Referrers
                </h4>
              </div>
              <div className="divide-y divide-pink-200 dark:divide-pink-700">
                {leaderboardData.leaderboard.map((user, index) => {
                  const isTopThree = index < 3;
                  return (
                    <div
                      key={user.customerId}
                      className={`p-4 flex items-center justify-between ${
                        isTopThree ? 'bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                          index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                          index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' :
                          index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white' :
                          'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400'
                        }`}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${user.rank}`}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {user.completedReferrals} completed
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-pink-600 dark:text-pink-400">
                          {formatPrice(user.totalEarnings)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {user.totalReferrals} total
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Analytics Section */}
      {activeSection === 'analytics' && analyticsData && (
        <div className="space-y-6">
          {/* Overall Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-pink-200 dark:border-pink-700">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Conversion Rate</p>
              <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                {analyticsData.overall.conversionRate.toFixed(1)}%
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-pink-200 dark:border-pink-700">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Avg. Conversion</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {analyticsData.overall.avgConversionDays.toFixed(1)} days
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-pink-200 dark:border-pink-700">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Pending</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {analyticsData.overall.pendingReferrals}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-pink-200 dark:border-pink-700">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Pending Earnings</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatPrice(analyticsData.overall.pendingEarnings)}
              </p>
            </div>
          </div>

          {/* Referrals Chart Data */}
          {analyticsData.referralsByDate.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-pink-200 dark:border-pink-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-pink-600" />
                Referrals Over Time (Last 30 Days)
              </h4>
              <div className="space-y-2">
                {analyticsData.referralsByDate.slice(-7).map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-20 text-xs text-gray-600 dark:text-gray-400">
                      {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4 relative">
                        <div
                          className="bg-gradient-to-r from-pink-500 to-rose-500 h-4 rounded-full"
                          style={{ width: `${(item.completed / Math.max(...analyticsData.referralsByDate.map(r => r.completed))) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-900 dark:text-white w-12 text-right">
                        {item.completed}/{item.total}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Referrals */}
          {analyticsData.topReferrals.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-pink-200 dark:border-pink-700">
              <div className="p-4 border-b border-pink-200 dark:border-pink-700">
                <h4 className="font-semibold text-gray-900 dark:text-white">Top Referrals</h4>
              </div>
              <div className="divide-y divide-pink-200 dark:divide-pink-700">
                {analyticsData.topReferrals.map((referral, index) => (
                  <div key={index} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {referral.refereeName || referral.refereeEmail || 'Anonymous'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(referral.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        referral.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {referral.status}
                      </span>
                      {referral.credited && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                          {formatPrice(referral.bonusAmount)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default ReferAndEarn;

