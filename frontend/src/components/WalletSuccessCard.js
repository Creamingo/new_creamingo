'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, X, TrendingUp, Gift, Sparkles } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useRouter } from 'next/navigation';
import { formatPrice } from '../utils/priceFormatter';

const WalletSuccessCard = ({ orderNumber, earnedAmount = 0, referralBonus = 0, onDismiss }) => {
  const { balance } = useWallet();
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const [showTip, setShowTip] = useState(true);

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) onDismiss();
  };

  const handleDismissTip = () => {
    setShowTip(false);
    localStorage.setItem('wallet_tip_dismissed', 'true');
  };

  useEffect(() => {
    const tipDismissed = localStorage.getItem('wallet_tip_dismissed');
    if (tipDismissed === 'true') {
      setShowTip(false);
    }
  }, []);

  if (dismissed) return null;

  const totalEarned = earnedAmount + referralBonus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-xl p-4 sm:p-5 border border-pink-200 dark:border-pink-800 mb-4"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center">
            <Wallet className="w-5 h-5 text-pink-600 dark:text-pink-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
              Your Wallet Balance
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">Updated after order</p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-3 border border-pink-100 dark:border-pink-900/30">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Current Balance</span>
          <span className="text-xl font-bold text-pink-600 dark:text-pink-400">
            {formatPrice(balance)}
          </span>
        </div>
      </div>

      {totalEarned > 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 mb-3 border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
              You Earned
            </span>
          </div>
          <div className="space-y-1">
            {earnedAmount > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-700 dark:text-emerald-300">Cashback</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  +{formatPrice(earnedAmount)}
                </span>
              </div>
            )}
            {referralBonus > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-700 dark:text-emerald-300">Referral Bonus</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  +{formatPrice(referralBonus)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1 border-t border-emerald-200 dark:border-emerald-800">
              <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">Total</span>
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                +{formatPrice(totalEarned)}
              </span>
            </div>
          </div>
        </div>
      )}

      {showTip && balance > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800 relative"
        >
          <button
            onClick={handleDismissTip}
            className="absolute top-2 right-2 text-blue-400 hover:text-blue-600 dark:hover:text-blue-300"
          >
            <X className="w-3 h-3" />
          </button>
          <div className="flex items-start gap-2 pr-6">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-blue-900 dark:text-blue-200 mb-1">
                Use wallet for your next order
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Save {formatPrice(balance)} on your next purchase!
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default WalletSuccessCard;

