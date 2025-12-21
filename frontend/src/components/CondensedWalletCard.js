'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Gift } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import ScratchCard from './ScratchCard';
import { formatPrice } from '../utils/priceFormatter';

const CondensedWalletCard = ({ earnedAmount = 0, referralBonus = 0, scratchCard = null, onScratchCardRevealed, onScratchCardCredited }) => {
  const { balance } = useWallet();
  const [isCardRevealed, setIsCardRevealed] = useState(false);
  const [revealedAmount, setRevealedAmount] = useState(null);

  // Check if card is already revealed on mount
  useEffect(() => {
    if (scratchCard && (scratchCard.status === 'revealed' || scratchCard.status === 'credited')) {
      setIsCardRevealed(true);
      setRevealedAmount(scratchCard.amount);
    }
  }, [scratchCard]);

  // Handle when card is revealed
  const handleCardRevealed = (cardId, amount) => {
    setIsCardRevealed(true);
    setRevealedAmount(amount);
    if (onScratchCardRevealed) {
      onScratchCardRevealed(cardId, amount);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-xl border-l-4 border-pink-500 dark:border-pink-400 border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      {/* Wallet Balance Header */}
      <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center">
            <Wallet className="w-4 h-4 text-pink-600 dark:text-pink-400" />
          </div>
          <div className="text-left flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                Current Wallet Balance
              </span>
              <motion.span
                key={balance}
                initial={{ scale: 1.2, color: '#ec4899' }}
                animate={{ scale: 1, color: '#ec4899' }}
                transition={{ duration: 0.3 }}
                className="text-sm font-bold text-pink-600 dark:text-pink-400"
              >
                {formatPrice(balance)}
              </motion.span>
            </div>
          </div>
        </div>
        
        {/* Cashback Earned Line */}
        {scratchCard && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              CB earned on this order
            </span>
            <motion.span
              key={isCardRevealed ? revealedAmount : 'placeholder'}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`text-sm font-bold ${
                isCardRevealed 
                  ? 'text-emerald-600 dark:text-emerald-400' 
                  : 'text-gray-400 dark:text-gray-500 italic'
              }`}
            >
              {isCardRevealed && revealedAmount 
                ? `+${formatPrice(revealedAmount)}`
                : 'Scratch the Card'
              }
            </motion.span>
          </div>
        )}
      </div>

      {/* Scratch Card - Shown Directly */}
      {scratchCard && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="p-3 sm:p-4"
        >
          <div className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-lg p-3 sm:p-4 border border-pink-200 dark:border-pink-800">
            <div className="flex items-start gap-2 mb-3">
              <Gift className="w-5 h-5 text-pink-600 dark:text-pink-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="font-semibold text-base sm:text-sm text-pink-900 dark:text-pink-200">🎁 Scratch & Win Cashback!</p>
                  {isCardRevealed && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Revealed
                    </motion.span>
                  )}
                </div>
                <p className="text-sm sm:text-xs text-pink-700 dark:text-pink-300">
                  Scratch the card below to reveal your cashback reward!
                </p>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="max-w-full"
            >
              <ScratchCard
                scratchCard={scratchCard}
                onRevealed={handleCardRevealed}
                onCredited={onScratchCardCredited}
                showAutoCreditMessage={true}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default CondensedWalletCard;

