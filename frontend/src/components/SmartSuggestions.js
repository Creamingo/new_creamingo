'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Sparkles } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useRouter } from 'next/navigation';

const SmartSuggestions = () => {
  const { balance } = useWallet();
  const router = useRouter();
  const [suggestions, setSuggestions] = useState([]);
  const [dismissed, setDismissed] = useState({});

  useEffect(() => {
    const dismissedState = JSON.parse(localStorage.getItem('dismissed_suggestions') || '{}');
    setDismissed(dismissedState);

    const newSuggestions = [];

    // Referral suggestion - Encourage earning through referrals when balance could be higher
    if (balance < 200) {
      if (!dismissedState['referral']) {
        newSuggestions.push({
          id: 'referral',
          type: 'earn',
          icon: Gift,
          title: 'Earn More with Referrals!',
          message: 'Share your referral code and earn ₹50 for each friend who orders. Build your wallet balance through cashback and referrals!',
          action: null,
          actionLink: null,
          color: 'pink'
        });
      }
    }

    // Milestone suggestion (if close to milestone)
    if (balance >= 200 && balance < 300) {
      if (!dismissedState['milestone']) {
        newSuggestions.push({
          id: 'milestone',
          type: 'achievement',
          icon: Sparkles,
          title: 'Unlock Milestones!',
          message: 'Complete more referrals to unlock milestone bonuses and tier upgrades.',
          action: 'View Milestones',
          actionLink: '/wallet?tab=referEarn',
          color: 'purple'
        });
      }
    }

    setSuggestions(newSuggestions);
  }, [balance]);

  const handleDismiss = (suggestionId) => {
    const newDismissed = { ...dismissed, [suggestionId]: true };
    setDismissed(newDismissed);
    localStorage.setItem('dismissed_suggestions', JSON.stringify(newDismissed));
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  };

  const handleAction = (actionLink) => {
    if (actionLink) {
      router.push(actionLink);
    }
  };

  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      <AnimatePresence>
        {suggestions.map((suggestion) => {
          const Icon = suggestion.icon;
          const colorClasses = {
            blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200',
            pink: 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800 text-pink-900 dark:text-pink-200',
            purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200'
          };

          return (
            <motion.div
              key={suggestion.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`rounded-xl p-4 border ${colorClasses[suggestion.color]} relative`}
            >
              <button
                onClick={() => handleDismiss(suggestion.id)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-start gap-3 pr-6">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  suggestion.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30' :
                  suggestion.color === 'pink' ? 'bg-pink-100 dark:bg-pink-900/30' :
                  'bg-purple-100 dark:bg-purple-900/30'
                }`}>
                  <Icon className={`w-5 h-5 ${
                    suggestion.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                    suggestion.color === 'pink' ? 'text-pink-600 dark:text-pink-400' :
                    'text-purple-600 dark:text-purple-400'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm mb-1">{suggestion.title}</h4>
                  <p className="text-xs opacity-90 leading-relaxed mb-2">{suggestion.message}</p>
                  {suggestion.action && (
                    <button
                      onClick={() => handleAction(suggestion.actionLink)}
                      className={`text-xs font-semibold px-3 py-1 rounded-lg transition-colors ${
                        suggestion.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700 text-white' :
                        suggestion.color === 'pink' ? 'bg-pink-600 hover:bg-pink-700 text-white' :
                        'bg-purple-600 hover:bg-purple-700 text-white'
                      }`}
                    >
                      {suggestion.action}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default SmartSuggestions;

