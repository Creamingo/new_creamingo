'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, X, Sparkles, Gift } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useToast } from '../contexts/ToastContext';

const WELCOME_BONUS_ALLOWED_PATHS = ['/', '/wallet'];

const WelcomeBonusModal = () => {
  const { showWelcomeBonus, setShowWelcomeBonus, creditWelcomeBonus, markWelcomeBonusSeen } = useWallet();
  const { showSuccess, showError } = useToast();
  const [isCrediting, setIsCrediting] = useState(false);
  const bonusAmount = 50; // Fixed amount - no animation needed
  const pathname = usePathname();
  const allowedPaths = WELCOME_BONUS_ALLOWED_PATHS;

  useEffect(() => {
    if (showWelcomeBonus && pathname && allowedPaths.includes(pathname)) {
      // Mark as seen immediately to avoid re-showing on refresh.
      markWelcomeBonusSeen();
    }
  }, [showWelcomeBonus, pathname, markWelcomeBonusSeen]);

  const handleCreditBonus = async () => {
    setIsCrediting(true);
    const result = await creditWelcomeBonus();
    setIsCrediting(false);

    if (result.success) {
      showSuccess('Welcome Bonus Credited!', `₹${result.amount} has been added to your wallet.`);
      markWelcomeBonusSeen();
      setShowWelcomeBonus(false);
    } else {
      // If already credited, just close the modal
      if (result.message && result.message.includes('already credited')) {
        markWelcomeBonusSeen();
        setShowWelcomeBonus(false);
      } else {
        showError('Error', result.message || 'Failed to credit welcome bonus');
      }
    }
  };

  const handleClose = () => {
    markWelcomeBonusSeen();
    setShowWelcomeBonus(false);
  };

  if (!showWelcomeBonus) return null;
  if (pathname && !allowedPaths.includes(pathname)) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="relative bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-3xl shadow-2xl max-w-md w-full p-8 border border-pink-200 dark:border-gray-700"
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Content */}
          <div className="text-center">
            {/* Wallet Icon with Animation */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="relative mx-auto mb-6"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center shadow-lg">
                <Wallet className="w-12 h-12 text-white" />
              </div>
              {/* Sparkle effects */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="absolute -top-2 -right-2"
              >
                <Sparkles className="w-8 h-8 text-yellow-400" />
              </motion.div>
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                className="absolute -bottom-2 -left-2"
              >
                <Gift className="w-6 h-6 text-pink-400" />
              </motion.div>
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2"
            >
              Welcome to Creamingo! 🎉
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600 dark:text-gray-400 mb-6"
            >
              Cashback added to your wallet
            </motion.p>

            {/* Amount Display */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
              className="mb-8"
            >
              <div className="inline-block bg-white dark:bg-gray-800 rounded-2xl px-8 py-4 shadow-lg border-2 border-pink-300 dark:border-pink-700">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Cashback Amount</div>
                <div className="text-5xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                  ₹{bonusAmount}
                </div>
              </div>
            </motion.div>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <button
                onClick={handleCreditBonus}
                disabled={isCrediting}
                className="flex-1 bg-gradient-to-r from-pink-600 to-rose-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-pink-700 hover:to-rose-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCrediting ? 'Crediting...' : 'View Wallet'}
              </button>
              <button
                onClick={handleClose}
                className="flex-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-3 px-6 rounded-xl font-semibold border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                Start Shopping
              </button>
            </motion.div>
          </div>

          {/* Confetti effect (optional, can be enhanced) */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 0, x: Math.random() * 400 - 200 }}
                animate={{
                  opacity: [0, 1, 0],
                  y: 400,
                  x: Math.random() * 400 - 200,
                }}
                transition={{
                  duration: 2,
                  delay: Math.random() * 0.5,
                  repeat: Infinity,
                  repeatDelay: 3,
                }}
                className="absolute w-2 h-2 bg-pink-400 rounded-full"
                style={{ left: `${Math.random() * 100}%` }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WelcomeBonusModal;

