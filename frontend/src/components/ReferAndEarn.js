'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { 
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
  Activity,
  X,
  MoreHorizontal
} from 'lucide-react';
import referralApi from '../api/referralApi';
import { useToast } from '../contexts/ToastContext';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import { formatPrice } from '../utils/priceFormatter';

const ReferAndEarn = ({ compact = false, onReferNowClick }) => {
  const { showSuccess, showError } = useToast();
  const { isAuthenticated, isLoading: isAuthLoading } = useCustomerAuth();
  const { openAuthModal } = useAuthModal();
  const [referralData, setReferralData] = useState(null);
  const [milestoneData, setMilestoneData] = useState(null);
  const [tierData, setTierData] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [userRank, setUserRank] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState('overview'); // overview, tier, leaderboard, analytics
  const [showAllMilestones, setShowAllMilestones] = useState(false);
  const tabButtonRefs = useRef({});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isAuthLoading) return; // wait until auth state is resolved
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    fetchReferralInfo();
    fetchMilestoneProgress();
    fetchTierProgress();
    fetchLeaderboard();
    fetchUserRank();
    fetchAnalytics();
  }, [isAuthenticated, isAuthLoading]);

  useEffect(() => {
    if (!shareSheetOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onEscape = (event) => {
      if (event.key === 'Escape') {
        setShareSheetOpen(false);
      }
    };

    window.addEventListener('keydown', onEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onEscape);
    };
  }, [shareSheetOpen]);

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

  const copyToClipboard = async (closeSheetAfterCopy = false) => {
    const link = getReferralLink();
    if (!link) return;

    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      showSuccess('Copied!', 'Referral link copied to clipboard');
      if (closeSheetAfterCopy) {
        setShareSheetOpen(false);
      }
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      showError('Error', 'Failed to copy link');
    }
  };

  const shareViaWhatsApp = (closeSheetAfterShare = false) => {
    const link = getReferralLink();
    const message = encodeURIComponent(
      `🎉 Join Creamingo and get ₹50 welcome bonus + ₹25 extra when you use my referral code!\n\nUse code: ${referralData?.referralCode}\n\nSign up here: ${link}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
    if (closeSheetAfterShare) {
      setShareSheetOpen(false);
    }
  };

  const shareViaSMS = (closeSheetAfterShare = false) => {
    const link = getReferralLink();
    const message = encodeURIComponent(
      `Join Creamingo and get ₹50 welcome bonus + ₹25 extra! Use my referral code: ${referralData?.referralCode}. Sign up: ${link}`
    );
    window.open(`sms:?body=${message}`, '_blank');
    if (closeSheetAfterShare) {
      setShareSheetOpen(false);
    }
  };

  const shareViaEmail = (closeSheetAfterShare = false) => {
    const link = getReferralLink();
    const subject = encodeURIComponent('Join Creamingo with my referral code!');
    const body = encodeURIComponent(
      `Hi!\n\nI'm inviting you to join Creamingo! When you sign up using my referral code, you'll get:\n\n✨ ₹50 Welcome Bonus\n✨ ₹25 Extra Bonus\n\nUse my referral code: ${referralData?.referralCode}\n\nSign up here: ${link}\n\nI'll also get ₹50 when you complete your first order!\n\nThanks!`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    if (closeSheetAfterShare) {
      setShareSheetOpen(false);
    }
  };

  const shareViaNative = useCallback(async () => {
    const link = getReferralLink();
    if (!link) return;

    const shareText = `Join Creamingo and get rewards using my referral code: ${referralData?.referralCode}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Join Creamingo',
          text: shareText,
          url: link,
        });
      } catch (error) {
        if (error?.name !== 'AbortError') {
          showError('Error', 'Unable to open share apps. Please try again.');
        }
      }
      setShareSheetOpen(false);
      return;
    }

    await copyToClipboard(true);
  }, [referralData?.referralCode]);

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

  const handleTabClick = (tabId) => {
    setActiveSection(tabId);

    const clickedTab = tabButtonRefs.current[tabId];
    if (clickedTab && typeof clickedTab.scrollIntoView === 'function') {
      clickedTab.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  };

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
            <p className="mt-3 text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
              Terms: Referral rewards apply after your friend completes their first order and are
              subject to eligibility and limits.
            </p>
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
          {!isAuthenticated ? (
            <>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Sign in to view your referral program and earn rewards.
              </p>
              <button
                onClick={() => openAuthModal?.()}
                className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-medium transition-colors"
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Unable to load referral information. Please try refreshing the page.
              </p>
              <button
                onClick={fetchReferralInfo}
                className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-medium transition-colors"
              >
                Retry
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Full version
  return (
    <>
      <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-0 lg:p-6 lg:bg-white lg:dark:bg-gray-800 lg:rounded-2xl lg:border lg:border-gray-200 lg:dark:border-gray-700 lg:shadow-md"
      >
      {/* Header */}
      <div className="hidden lg:flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-pink-100 dark:bg-pink-900/30 rounded-xl flex items-center justify-center border border-pink-200 dark:border-pink-800">
            <Gift className="w-5 h-5 text-pink-600 dark:text-pink-300" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Refer & Earn
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Invite friends, track progress, and earn wallet cashback.
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pink-50 dark:bg-pink-900/20 border border-pink-100 dark:border-pink-800/50">
          <Sparkles className="w-3.5 h-3.5 text-pink-500" />
          <span className="text-xs font-semibold text-pink-600 dark:text-pink-300">Earn Rewards</span>
        </div>
      </div>

      {/* Primary value proposition */}
      <div className="mb-5 rounded-xl border border-pink-200/70 dark:border-pink-800/50 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/15 p-3.5 sm:p-4">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
          What you and your friend get
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="rounded-lg bg-white/80 dark:bg-gray-800/80 border border-pink-100 dark:border-pink-800/40 px-3 py-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
            Friend: <span className="font-semibold text-pink-600 dark:text-pink-300">₹50 welcome + ₹25 extra</span>
          </div>
          <div className="rounded-lg bg-white/80 dark:bg-gray-800/80 border border-pink-100 dark:border-pink-800/40 px-3 py-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
            You: <span className="font-semibold text-pink-600 dark:text-pink-300">₹50 after first completed order</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-5 -mx-4 sm:mx-0 border-b border-gray-200 dark:border-gray-700 lg:rounded-xl lg:border lg:border-gray-200 lg:dark:border-gray-700 lg:bg-white/90 lg:dark:bg-gray-800/80">
        <div className="overflow-x-auto scrollbar-hide px-2 lg:px-1">
          <div className="flex min-w-max sm:min-w-0 sm:grid sm:grid-cols-4">
          {[
            { id: 'overview', label: 'Overview', icon: Gift },
            { id: 'tier', label: 'Tier', icon: Crown },
            { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;

            return (
              <button
                key={tab.id}
                ref={(element) => {
                  tabButtonRefs.current[tab.id] = element;
                }}
                onClick={() => handleTabClick(tab.id)}
                className={`min-w-[98px] sm:min-w-0 inline-flex items-center justify-center gap-1.5 px-2.5 py-2.5 text-[12px] sm:text-sm font-medium border-b-2 -mb-px transition-colors ${
                  isActive
                    ? 'text-pink-600 dark:text-pink-300 border-pink-500 dark:border-pink-400 bg-pink-50/40 dark:bg-pink-900/15'
                    : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-pink-600 dark:hover:text-pink-300'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-pink-600 dark:text-pink-300' : 'text-gray-500 dark:text-gray-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
          </div>
        </div>
      </div>

      {/* Overview Section */}
      {activeSection === 'overview' && (
        <>
      {/* How it Works - plain list style */}
      <div className="mb-5">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2.5 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-pink-600" />
          How it works
        </h4>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          <div className="flex items-start gap-3 py-3">
            <span className="w-7 text-2xl leading-none font-extrabold text-amber-500 dark:text-amber-400">1</span>
            <div>
              <p className="text-base font-semibold text-gray-900 dark:text-white">Share your code</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Share your referral code or link with your friends.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 py-3">
            <span className="w-7 text-2xl leading-none font-extrabold text-amber-500 dark:text-amber-400">2</span>
            <div>
              <p className="text-base font-semibold text-gray-900 dark:text-white">Friend signs up</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Your friend signs up and places the first order.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 py-3">
            <span className="w-7 text-2xl leading-none font-extrabold text-amber-500 dark:text-amber-400">3</span>
            <div>
              <p className="text-base font-semibold text-gray-900 dark:text-white">Get rewarded</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Cashback gets credited to your wallet.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
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

      {/* Milestones Section */}
      {milestoneData && (
        <div className="mt-5 pt-5 border-t border-pink-200 dark:border-pink-700">
          {(() => {
            const allMilestones = milestoneData.milestones || [];
            const achievedMilestones = allMilestones.filter((milestone) => milestone.isAchieved).length;
            const previewMilestones = showAllMilestones ? allMilestones : allMilestones.slice(0, 3);
            const shouldShowToggle = allMilestones.length > 3;
            const nextMilestone = milestoneData.nextMilestone;
            const referralsDone = milestoneData.completedReferrals || 0;
            const referralsNeeded = nextMilestone?.referrals || referralsDone;
            const referralsRemaining = Math.max(referralsNeeded - referralsDone, 0);

            return (
              <>
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
          <div className="mb-4 grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-pink-200 dark:border-pink-800 bg-pink-50/70 dark:bg-pink-900/20 px-3 py-2">
              <p className="text-[11px] text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {achievedMilestones}/{allMilestones.length}
              </p>
            </div>
            <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-900/20 px-3 py-2">
              <p className="text-[11px] text-gray-600 dark:text-gray-400">Unlocked</p>
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                {formatPrice(milestoneData.totalMilestoneBonuses || 0)}
              </p>
            </div>
            <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-900/20 px-3 py-2">
              <p className="text-[11px] text-gray-600 dark:text-gray-400">Remaining</p>
              <p className="text-sm font-bold text-amber-700 dark:text-amber-300">
                {Math.max(allMilestones.length - achievedMilestones, 0)}
              </p>
            </div>
          </div>

          {nextMilestone ? (
            <div className="mb-5 p-4 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-xl border border-pink-200 dark:border-pink-700">
              <div className="flex items-center justify-between gap-3 mb-1">
                <p className="font-semibold text-gray-900 dark:text-white">
                  Next reward: {formatPrice(nextMilestone.bonus)}
                </p>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300">
                  In progress
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {referralsRemaining > 0
                  ? `${referralsRemaining} more successful referral${referralsRemaining > 1 ? 's' : ''} to unlock ${nextMilestone.name}.`
                  : `You are at ${nextMilestone.name}. Complete the remaining step to unlock reward.`}
              </p>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1.5">
                  <span>
                    {referralsDone} / {referralsNeeded} referrals
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300 font-medium">
                    {referralsRemaining} left
                  </span>
                </div>
                <div className="w-full bg-pink-100 dark:bg-pink-900/35 rounded-full h-2.5 border border-pink-200/80 dark:border-pink-800/60">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${nextMilestone.progress}%` }}
                    transition={{ duration: 0.5 }}
                    className="bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-500 h-2.5 rounded-full"
                  />
                </div>
                <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-1.5">
                  Complete referral onboarding to unlock this reward faster.
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-5 p-4 rounded-xl border border-emerald-200 dark:border-emerald-700 bg-emerald-50/70 dark:bg-emerald-900/20">
              <p className="font-semibold text-emerald-700 dark:text-emerald-300">Great job! All milestones are unlocked.</p>
              <p className="text-xs text-emerald-700/90 dark:text-emerald-300/90 mt-1">
                Keep sharing to maintain your referral momentum.
              </p>
            </div>
          )}

          {/* All Milestones */}
          <div className="space-y-2.5">
            {previewMilestones.map((milestone, index) => {
              const referralsLeft = Math.max((milestone.referrals || 0) - referralsDone, 0);
              const statusLabel = milestone.isAchieved
                ? 'Unlocked'
                : referralsLeft > 0
                  ? `${referralsLeft} left`
                  : 'In progress';

              return (
                <div
                  key={index}
                  className={`p-3 rounded-xl border ${
                    milestone.isAchieved
                      ? 'bg-emerald-50/80 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      milestone.isAchieved
                        ? 'bg-emerald-500'
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      {milestone.isAchieved ? (
                        <Check className="w-4 h-4 text-white" />
                      ) : (
                        <Gift className="w-4 h-4 text-gray-500 dark:text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`font-semibold truncate ${
                          milestone.isAchieved ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-900 dark:text-white'
                        }`}>
                          {milestone.name}
                        </p>
                        <p className={`font-bold ${
                          milestone.isAchieved ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-200'
                        }`}>
                          {formatPrice(milestone.bonus || 0)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Target: {milestone.referrals} referrals
                        </p>
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                          milestone.isAchieved
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                        }`}>
                          {statusLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!milestone.isAchieved && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-gray-600 dark:text-gray-400">
                          Need {referralsLeft} more
                        </span>
                        <span className="text-[11px] text-pink-600 dark:text-pink-300 font-medium">
                          {milestone.progress}% complete
                        </span>
                      </div>
                      <div className="w-full bg-pink-100 dark:bg-pink-900/30 rounded-full h-1.5 border border-pink-200/80 dark:border-pink-800/50">
                        <div
                          className="bg-gradient-to-r from-pink-400 via-rose-400 to-fuchsia-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${milestone.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {shouldShowToggle && (
            <div className="mt-3 flex justify-center">
              <button
                type="button"
                onClick={() => setShowAllMilestones((prev) => !prev)}
                className="text-sm font-medium text-pink-600 dark:text-pink-300 hover:text-pink-700 dark:hover:text-pink-200 transition-colors"
              >
                {showAllMilestones ? 'View less milestones' : `View all milestones (${allMilestones.length})`}
              </button>
            </div>
          )}
              </>
            );
          })()}
        </div>
      )}

      {/* How it Works */}
      {/* Terms & Conditions */}
      <div className="mt-5 pt-5 border-t border-pink-200 dark:border-pink-700">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Terms & Conditions</h4>
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
          Referral rewards are credited after the referred friend completes their first order.
          Eligibility rules, limits, and reward values may change at any time.
        </p>
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
          {/* Current Tier Card */}
          <div className={`relative overflow-hidden bg-gradient-to-br ${tierData.currentTier.badgeColor} rounded-2xl p-4 sm:p-6 border border-white/20 shadow-[0_16px_36px_rgba(17,24,39,0.24)]`}>
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/15 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-8 w-24 h-24 rounded-full bg-black/10 blur-xl pointer-events-none" />

            <div className="relative z-10 flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20 flex-shrink-0">
                  <span className="text-2xl sm:text-3xl">{tierData.currentTier.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-white/85 mb-0.5">Your Current Tier</p>
                  <h3 className="text-xl sm:text-3xl font-bold text-white leading-tight">
                    {tierData.currentTier.name || tierData.currentTier.tier}
                  </h3>
                  <p className="text-xs sm:text-sm text-white/75 mt-0.5">{tierData.currentTier.tier} Tier</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-3">
                <p className="text-[11px] sm:text-xs text-white/80 mb-0.5">Bonus</p>
                <p className="text-2xl sm:text-3xl font-extrabold text-white">{(tierData.bonusMultiplier * 100).toFixed(0)}%</p>
              </div>
            </div>

            <div className="relative z-10 grid grid-cols-2 gap-2 mb-3">
              <div className="rounded-lg bg-black/15 border border-white/20 px-3 py-2">
                <p className="text-[11px] text-white/70">Completed referrals</p>
                <p className="text-sm sm:text-base font-bold text-white">{tierData.completedReferrals}</p>
              </div>
              <div className="rounded-lg bg-black/15 border border-white/20 px-3 py-2">
                <p className="text-[11px] text-white/70">Tier status</p>
                <p className="text-sm sm:text-base font-bold text-white">Active now</p>
              </div>
            </div>

            <div className="relative z-10 bg-black/15 border border-white/20 rounded-xl p-3 sm:p-4 backdrop-blur-sm">
              <p className="text-white font-semibold mb-2 text-sm sm:text-base">Tier Benefits</p>
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
            <div className="rounded-2xl p-4 sm:p-6 border border-pink-200 dark:border-pink-700 bg-gradient-to-br from-white via-rose-50/80 to-pink-50 dark:from-gray-800 dark:via-gray-800 dark:to-pink-900/10 shadow-sm">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-pink-100 dark:bg-pink-900/30 rounded-2xl border border-pink-200 dark:border-pink-800 flex items-center justify-center flex-shrink-0">
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

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="rounded-lg bg-white/80 dark:bg-gray-900/40 border border-pink-100 dark:border-pink-800/50 px-3 py-2">
                  <p className="text-[11px] text-gray-600 dark:text-gray-400">Referrals done</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{tierData.completedReferrals}</p>
                </div>
                <div className="rounded-lg bg-white/80 dark:bg-gray-900/40 border border-pink-100 dark:border-pink-800/50 px-3 py-2">
                  <p className="text-[11px] text-gray-600 dark:text-gray-400">To unlock</p>
                  <p className="text-sm font-semibold text-pink-600 dark:text-pink-400">{tierData.referralsNeeded} more</p>
                </div>
              </div>

              <div className="mt-2">
                <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1.5">
                  <span>Progress to {tierData.nextTier.tier}</span>
                  <span className="font-semibold text-pink-600 dark:text-pink-300">{tierData.progressToNextTier}%</span>
                </div>
                <div className="w-full bg-pink-100 dark:bg-pink-900/35 rounded-full h-2.5 border border-pink-200/80 dark:border-pink-800/50">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${tierData.progressToNextTier}%` }}
                    transition={{ duration: 0.5 }}
                    className={`bg-gradient-to-r ${tierData.nextTier.badgeColor} h-2.5 rounded-full`}
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
                  className={`p-3 sm:p-4 rounded-xl border transition-all ${
                    isCurrentTier
                      ? `bg-gradient-to-r ${tier.badgeColor} border-white/25 text-white shadow-md`
                      : isUnlocked
                      ? 'bg-emerald-50/80 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-pink-200 dark:hover:border-pink-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
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
                        <span className="px-2.5 py-1 bg-white/20 border border-white/30 rounded-full text-xs font-semibold text-white whitespace-nowrap">
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
        <div className="space-y-4">
          {(() => {
            const hasUserCompletions = (userRank?.completedReferrals || 0) > 0;
            const hasBoardCompletions = (leaderboardData?.leaderboard || []).some(
              (entry) => (entry.completedReferrals || 0) > 0
            );
            const hasRealLeaderboardActivity = hasUserCompletions || hasBoardCompletions;
            const isTopRank = hasRealLeaderboardActivity && userRank?.rank === 1 && hasUserCompletions;

            return (
              <>
          <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-gradient-to-r from-indigo-50 via-violet-50 to-fuchsia-50 dark:from-indigo-900/25 dark:via-violet-900/20 dark:to-fuchsia-900/20 p-3.5">
            <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
              Quarterly leaderboard
            </p>
            <p className="mt-1 text-xs text-indigo-800/85 dark:text-indigo-200/85">
              Based on successful referrals + credited rewards.
            </p>
          </div>

          <div className="bg-gradient-to-br from-violet-600 via-fuchsia-600 to-indigo-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs sm:text-sm text-white/80 mb-1">Your Rank</p>
                <h3 className="text-4xl sm:text-5xl font-extrabold">
                  {hasRealLeaderboardActivity ? `#${userRank?.rank || '—'}` : '—'}
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/20 border border-white/25 text-white/95">
                {isTopRank ? 'You are on top' : hasRealLeaderboardActivity ? 'Live standings' : 'Not ranked yet'}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <div className="rounded-lg bg-white/15 border border-white/20 px-3 py-2.5">
                <p className="text-[11px] text-white/75">Completed</p>
                <p className="text-xl font-bold">{userRank?.completedReferrals ?? 0}</p>
              </div>
              <div className="rounded-lg bg-white/15 border border-white/20 px-3 py-2.5">
                <p className="text-[11px] text-white/75">Total Earned</p>
                <p className="text-xl font-bold">{formatPrice(userRank?.totalEarnings ?? 0)}</p>
              </div>
            </div>

          </div>

          {/* Leaderboard List */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-indigo-200 dark:border-indigo-800 overflow-hidden">
            <div className="p-4 border-b border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-900/20">
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
                Top Referrers
              </h4>
            </div>

            {leaderboardData?.leaderboard?.length ? (
              <div className="divide-y divide-indigo-100 dark:divide-indigo-900/40">
                {leaderboardData.leaderboard.map((user, index) => {
                  const isTopThree = index < 3;
                  return (
                    <div
                      key={user.customerId}
                      className={`p-4 flex items-center justify-between ${
                        isTopThree ? 'bg-gradient-to-r from-indigo-50/70 to-violet-50/70 dark:from-indigo-900/20 dark:to-violet-900/20' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                          index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                          index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-white' :
                          index === 2 ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-white' :
                          'bg-indigo-100 dark:bg-indigo-900/35 text-indigo-600 dark:text-indigo-300'
                        }`}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${user.rank}`}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {user.completedReferrals} successful
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-indigo-700 dark:text-indigo-300">
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
            ) : (
              <div className="p-4 text-sm text-gray-600 dark:text-gray-400">
                No leaderboard activity yet. Start sharing now to appear in the rankings.
              </div>
            )}
          </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Analytics Section */}
      {activeSection === 'analytics' && analyticsData && (
        <div className="space-y-4">
          <div className="rounded-xl border border-sky-200 dark:border-sky-800 bg-gradient-to-r from-sky-50 via-cyan-50 to-blue-50 dark:from-sky-900/25 dark:via-cyan-900/20 dark:to-blue-900/20 p-3.5">
            <p className="text-sm font-semibold text-sky-900 dark:text-sky-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-600 dark:text-sky-300" />
              Analytics
            </p>
            <p className="mt-1 text-xs text-sky-800/85 dark:text-sky-200/85">
              Conversion and rewards snapshot.
            </p>
          </div>

          {/* Overall Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-xl p-4 border border-fuchsia-200 dark:border-fuchsia-800 bg-fuchsia-50/70 dark:bg-fuchsia-900/20">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Conversion Rate</p>
              <p className="text-2xl font-bold text-fuchsia-600 dark:text-fuchsia-300">
                {analyticsData.overall.conversionRate.toFixed(1)}%
              </p>
            </div>
            <div className="rounded-xl p-4 border border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-900/20">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Avg. Conversion</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-300">
                {analyticsData.overall.avgConversionDays.toFixed(1)} days
              </p>
            </div>
            <div className="rounded-xl p-4 border border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-900/20">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Pending</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-300">
                {analyticsData.overall.pendingReferrals}
              </p>
            </div>
            <div className="rounded-xl p-4 border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-900/20">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Pending Earnings</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-300">
                {formatPrice(analyticsData.overall.pendingEarnings)}
              </p>
            </div>
          </div>

          {/* Referrals Chart Data */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-sky-200 dark:border-sky-800">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <Activity className="w-5 h-5 text-sky-600 dark:text-sky-300" />
              Referrals Over Time
            </h4>
            <div className="mb-2" />

            {analyticsData.referralsByDate.length > 0 ? (
              <div className="space-y-2">
                {analyticsData.referralsByDate.slice(-7).map((item, index) => {
                  const maxCompleted = Math.max(1, ...analyticsData.referralsByDate.map((r) => r.completed || 0));
                  const widthPercent = ((item.completed || 0) / maxCompleted) * 100;

                  return (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-20 text-xs text-gray-600 dark:text-gray-400">
                        {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 bg-sky-100 dark:bg-sky-900/30 rounded-full h-4 relative border border-sky-200/80 dark:border-sky-800/60">
                          <div
                            className="bg-gradient-to-r from-sky-500 to-cyan-500 h-4 rounded-full"
                            style={{ width: `${widthPercent}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-900 dark:text-white w-14 text-right">
                          {item.completed}/{item.total}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-gray-600 dark:text-gray-400 py-2">
                No trend data yet.
              </div>
            )}
          </div>

          {/* Top Referrals */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-cyan-200 dark:border-cyan-800">
            <div className="p-4 border-b border-cyan-200 dark:border-cyan-800">
              <h4 className="font-semibold text-gray-900 dark:text-white">Top Referrals</h4>
            </div>

            {analyticsData.topReferrals.length > 0 ? (
              <div className="divide-y divide-cyan-100 dark:divide-cyan-900/40">
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
            ) : (
              <div className="p-4 text-sm text-gray-600 dark:text-gray-400">
                No top referrals yet.
              </div>
            )}
          </div>
        </div>
      )}
      </motion.div>

      {/* Sticky footer CTA */}
      <div className="fixed inset-x-0 bottom-0 z-[120] pointer-events-none">
        <div className="mx-auto max-w-5xl border-t border-gray-200/80 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.8rem)] shadow-[0_-6px_24px_rgba(15,23,42,0.08)]">
          <button
            type="button"
            onClick={() => setShareSheetOpen(true)}
            className="pointer-events-auto mx-auto flex w-full max-w-md items-center justify-center rounded-full bg-gradient-to-r from-pink-600 to-rose-600 px-6 py-3.5 text-base font-semibold text-white hover:from-pink-700 hover:to-rose-700 active:scale-[0.99] transition-all"
          >
            Refer now
          </button>
        </div>
      </div>

      {/* Bottom share sheet */}
      {mounted && shareSheetOpen && createPortal(
        <>
          <div
            className="fixed inset-0 z-[200] bg-black/50 dark:bg-black/70 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setShareSheetOpen(false)}
            aria-hidden
          />
          <div
            className="fixed inset-x-0 bottom-0 z-[201] w-full max-w-lg mx-auto rounded-t-3xl bg-white dark:bg-gray-900 shadow-2xl border-t border-x border-gray-100 dark:border-gray-800 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-[max(1rem,env(safe-area-inset-bottom))] max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="referral-share-sheet-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
              <h2 id="referral-share-sheet-title" className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Share your referral code
              </h2>
              <button
                type="button"
                onClick={() => setShareSheetOpen(false)}
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Close share sheet"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-4 pt-4">
              <div className="mb-2 rounded-lg border border-pink-200 dark:border-pink-800 bg-pink-50/70 dark:bg-pink-900/20 px-3 py-2">
                <p className="text-[11px] text-gray-600 dark:text-gray-300 mb-1">Referral code</p>
                <p className="font-mono text-sm font-semibold text-pink-700 dark:text-pink-300">{referralData?.referralCode}</p>
              </div>

              <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800/50">
                <input
                  readOnly
                  type="text"
                  value={referralLink}
                  className="flex-1 min-w-0 px-3 py-2.5 text-xs sm:text-sm text-gray-700 dark:text-gray-200 bg-transparent border-0 outline-none truncate"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(true)}
                  className="flex-shrink-0 px-3 border-l border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Copy referral link"
                >
                  <Copy className="w-5 h-5 mx-auto" />
                </button>
              </div>
            </div>

            <div className="px-4 pt-6 pb-6">
              <div className="flex justify-between items-start gap-2 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => shareViaWhatsApp(true)}
                  className="flex flex-col items-center gap-2 flex-1 min-w-0"
                >
                  <span className="w-12 h-12 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-md">
                    <MessageCircle className="w-5 h-5" />
                  </span>
                  <span className="text-[11px] text-gray-600 dark:text-gray-400 text-center font-medium leading-tight">
                    WhatsApp
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => shareViaSMS(true)}
                  className="flex flex-col items-center gap-2 flex-1 min-w-0"
                >
                  <span className="w-12 h-12 rounded-full bg-[#1877F2] text-white flex items-center justify-center shadow-md">
                    <MessageCircle className="w-5 h-5" />
                  </span>
                  <span className="text-[11px] text-gray-600 dark:text-gray-400 text-center font-medium leading-tight">
                    SMS
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => shareViaEmail(true)}
                  className="flex flex-col items-center gap-2 flex-1 min-w-0"
                >
                  <span className="w-12 h-12 rounded-full bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center shadow-md">
                    <Mail className="w-5 h-5" />
                  </span>
                  <span className="text-[11px] text-gray-600 dark:text-gray-400 text-center font-medium leading-tight">
                    Email
                  </span>
                </button>

                <button
                  type="button"
                  onClick={shareViaNative}
                  className="flex flex-col items-center gap-2 flex-1 min-w-0"
                >
                  <span className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center shadow-md">
                    <MoreHorizontal className="w-6 h-6" />
                  </span>
                  <span className="text-[11px] text-gray-600 dark:text-gray-400 text-center font-medium leading-tight">
                    More apps
                  </span>
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
};

export default ReferAndEarn;

