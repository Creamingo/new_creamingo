'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useCustomerAuth } from './CustomerAuthContext';
import walletApi from '../api/walletApi';

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const { customer, isAuthenticated } = useCustomerAuth();
  const [balance, setBalance] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showWelcomeBonus, setShowWelcomeBonus] = useState(false);

  const getWelcomeBonusSeenKey = useCallback((customerId) => {
    if (!customerId) return null;
    return `welcome_bonus_seen_${customerId}`;
  }, []);

  // Fetch wallet balance
  const fetchBalance = useCallback(async () => {
    if (!isAuthenticated || !customer) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await walletApi.getBalance();
      if (response.success) {
        setBalance(response.data.balance);
        setTotalEarned(response.data.totalEarned);
        setTotalSpent(response.data.totalSpent);
      }
    } catch (err) {
      console.error('Fetch wallet balance error:', err);
      setError(err.message || 'Failed to fetch wallet balance');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, customer]);

  // Check if welcome bonus should be shown
  const checkWelcomeBonus = useCallback(async () => {
    if (!isAuthenticated || !customer) {
      setShowWelcomeBonus(false);
      return;
    }

    try {
      // Check if customer has welcome bonus credited using the flag
      // This is more reliable than checking transactions
      const welcomeBonusCredited = customer.welcome_bonus_credited;
      
      // Show welcome bonus modal only if not credited yet and not already shown
      // Check for false, 0, null, or undefined (all mean not credited)
      const hasNotBeenCredited = (
        welcomeBonusCredited === false ||
        welcomeBonusCredited === 0 ||
        welcomeBonusCredited === null ||
        welcomeBonusCredited === undefined
      );
      const seenKey = getWelcomeBonusSeenKey(customer.id);
      const hasSeen = seenKey ? sessionStorage.getItem(seenKey) === 'true' : false;

      if (hasNotBeenCredited && !hasSeen) {
        setShowWelcomeBonus(true);
      } else {
        // Already credited, don't show modal
        setShowWelcomeBonus(false);
      }
    } catch (err) {
      console.error('Check welcome bonus error:', err);
      setShowWelcomeBonus(false);
    }
  }, [isAuthenticated, customer, getWelcomeBonusSeenKey]);

  const markWelcomeBonusSeen = useCallback(() => {
    if (!customer) return;
    const seenKey = getWelcomeBonusSeenKey(customer.id);
    if (seenKey) {
      sessionStorage.setItem(seenKey, 'true');
    }
  }, [customer, getWelcomeBonusSeenKey]);

  // Credit welcome bonus
  const creditWelcomeBonus = useCallback(async () => {
    try {
      const response = await walletApi.creditWelcomeBonus();
      if (response.success) {
        await fetchBalance(); // Refresh balance
        markWelcomeBonusSeen();
        setShowWelcomeBonus(false);
        return { success: true, amount: response.data.amount };
      }
      return { success: false, message: response.message };
    } catch (err) {
      console.error('Credit welcome bonus error:', err);
      return { success: false, message: err.message || 'Failed to credit welcome bonus' };
    }
  }, [fetchBalance, markWelcomeBonusSeen]);

  // Initialize wallet on mount and when auth state changes
  useEffect(() => {
    if (isAuthenticated && customer) {
      fetchBalance();
      checkWelcomeBonus();
    } else {
      setBalance(0);
      setTotalEarned(0);
      setTotalSpent(0);
      setIsLoading(false);
      setShowWelcomeBonus(false);
    }
  }, [isAuthenticated, customer, fetchBalance, checkWelcomeBonus]);

  const value = {
    balance,
    totalEarned,
    totalSpent,
    isLoading,
    error,
    showWelcomeBonus,
    setShowWelcomeBonus,
    markWelcomeBonusSeen,
    fetchBalance,
    creditWelcomeBonus,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

