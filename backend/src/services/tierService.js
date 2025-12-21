const { query } = require('../config/db');

// Define tier levels based on completed referrals
const TIER_LEVELS = [
  {
    tier: 'Bronze',
    name: 'Bronze Referrer',
    minReferrals: 0,
    maxReferrals: 4,
    color: '#CD7F32',
    icon: '🥉',
    benefits: ['Basic referral rewards', 'Standard support'],
    badgeColor: 'from-amber-600 to-amber-800'
  },
  {
    tier: 'Silver',
    name: 'Silver Ambassador',
    minReferrals: 5,
    maxReferrals: 9,
    color: '#C0C0C0',
    icon: '🥈',
    benefits: ['Enhanced referral rewards', 'Priority support', '5% bonus on milestones'],
    badgeColor: 'from-gray-400 to-gray-600'
  },
  {
    tier: 'Gold',
    name: 'Gold Champion',
    minReferrals: 10,
    maxReferrals: 24,
    color: '#FFD700',
    icon: '🥇',
    benefits: ['Premium referral rewards', 'VIP support', '10% bonus on milestones', 'Exclusive offers'],
    badgeColor: 'from-yellow-400 to-yellow-600'
  },
  {
    tier: 'Platinum',
    name: 'Platinum Elite',
    minReferrals: 25,
    maxReferrals: 49,
    color: '#E5E4E2',
    icon: '💎',
    benefits: ['Elite referral rewards', '24/7 VIP support', '15% bonus on milestones', 'Early access to features'],
    badgeColor: 'from-purple-400 to-purple-600'
  },
  {
    tier: 'Diamond',
    name: 'Diamond Master',
    minReferrals: 50,
    maxReferrals: Infinity,
    color: '#B9F2FF',
    icon: '💠',
    benefits: ['Ultimate referral rewards', 'Dedicated account manager', '20% bonus on milestones', 'Custom rewards'],
    badgeColor: 'from-cyan-400 to-cyan-600'
  }
];

// Get user's current tier
const getUserTier = (completedReferrals) => {
  for (let i = TIER_LEVELS.length - 1; i >= 0; i--) {
    const tier = TIER_LEVELS[i];
    if (completedReferrals >= tier.minReferrals) {
      return tier;
    }
  }
  return TIER_LEVELS[0]; // Default to Bronze
};

// Get tier progress
const getTierProgress = async (customerId) => {
  try {
    // Get completed referrals count
    const completedResult = await query(
      'SELECT COUNT(*) as count FROM referrals WHERE referrer_id = ? AND status = ?',
      [customerId, 'completed']
    );
    const completedReferrals = completedResult.rows[0].count || 0;

    const currentTier = getUserTier(completedReferrals);
    const nextTier = TIER_LEVELS.find(t => t.minReferrals > completedReferrals) || null;

    let progressToNextTier = 0;
    let referralsNeeded = 0;

    if (nextTier) {
      const range = nextTier.minReferrals - currentTier.minReferrals;
      const progress = completedReferrals - currentTier.minReferrals;
      progressToNextTier = range > 0 ? Math.min((progress / range) * 100, 100) : 0;
      referralsNeeded = nextTier.minReferrals - completedReferrals;
    }

    // Get tier-based bonus multiplier
    const bonusMultiplier = getTierBonusMultiplier(currentTier.tier);

    return {
      success: true,
      data: {
        currentTier,
        nextTier,
        completedReferrals,
        progressToNextTier: Math.round(progressToNextTier),
        referralsNeeded,
        bonusMultiplier,
        allTiers: TIER_LEVELS
      }
    };
  } catch (error) {
    console.error('Get tier progress error:', error);
    return { success: false, message: error.message };
  }
};

// Get tier bonus multiplier
const getTierBonusMultiplier = (tierName) => {
  const multipliers = {
    'Bronze': 1.0,
    'Silver': 1.05,
    'Gold': 1.10,
    'Platinum': 1.15,
    'Diamond': 1.20
  };
  return multipliers[tierName] || 1.0;
};

// Apply tier bonus to milestone rewards
const applyTierBonus = (baseAmount, tierName) => {
  const multiplier = getTierBonusMultiplier(tierName);
  return Math.round(baseAmount * multiplier);
};

module.exports = {
  getUserTier,
  getTierProgress,
  getTierBonusMultiplier,
  applyTierBonus,
  TIER_LEVELS
};

