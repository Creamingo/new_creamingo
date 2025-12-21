'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useCustomerAuth } from './CustomerAuthContext';
import wishlistApi from '../api/wishlistApi';
import { ToastContext } from './ToastContext';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [isInWishlist, setIsInWishlist] = useState(new Set()); // Track product IDs
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const { isAuthenticated } = useCustomerAuth();
  
  // Get toast functions (use useContext directly to avoid hook order issues)
  // Use a ref to safely access toast without causing render issues
  const toastContextValue = useContext(ToastContext);
  const toastRef = React.useRef(toastContextValue);
  
  // Update ref when context changes, but don't cause re-renders
  React.useEffect(() => {
    toastRef.current = toastContextValue;
  }, [toastContextValue]);
  
  // Helper function to safely get toast functions
  const getToast = () => toastRef.current;

  // Load wishlist on mount and when authentication changes
  useEffect(() => {
    const loadWishlist = async () => {
      if (!isAuthenticated) {
        setWishlistItems([]);
        setIsInWishlist(new Set());
        setIsLoading(false);
        setIsInitialized(true);
        return;
      }

      try {
        setIsLoading(true);
        const response = await wishlistApi.getWishlist();
        
        if (response.success) {
          setWishlistItems(response.items || []);
          const productIds = new Set((response.items || []).map(item => item.product_id));
          setIsInWishlist(productIds);
        }
      } catch (error) {
        console.error('Error loading wishlist:', error);
        setWishlistItems([]);
        setIsInWishlist(new Set());
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    loadWishlist();
  }, [isAuthenticated]);

  /**
   * Check if a product is in wishlist
   */
  const checkIfInWishlist = useCallback((productId) => {
    return isInWishlist.has(productId);
  }, [isInWishlist]);

  /**
   * Add product to wishlist
   */
  const addToWishlist = useCallback(async (productId) => {
    if (!isAuthenticated) {
      const toast = getToast();
      if (toast) {
        setTimeout(() => {
          toast.showError('Login Required', 'Please login to add items to your wishlist.');
        }, 0);
      }
      return false;
    }

    if (isInWishlist.has(productId)) {
      return true; // Already in wishlist
    }

    try {
      const response = await wishlistApi.addToWishlist(productId);
      
      if (response.success) {
        setIsInWishlist(prev => new Set([...prev, productId]));
        
        // Fetch updated wishlist to get full product details
        const updatedResponse = await wishlistApi.getWishlist();
        if (updatedResponse.success) {
          setWishlistItems(updatedResponse.items || []);
        }

        const toast = getToast();
        if (toast) {
          setTimeout(() => {
            toast.showSuccess('Added to Wishlist', 'Product has been added to your wishlist.');
          }, 0);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      const toast = getToast();
      if (toast) {
        setTimeout(() => {
          toast.showError('Error', error.message || 'Failed to add product to wishlist.');
        }, 0);
      }
      return false;
    }
  }, [isAuthenticated, isInWishlist]);

  /**
   * Remove product from wishlist
   */
  const removeFromWishlist = useCallback(async (productId) => {
    if (!isAuthenticated) {
      return false;
    }

    if (!isInWishlist.has(productId)) {
      return true; // Already not in wishlist
    }

    try {
      const response = await wishlistApi.removeFromWishlist(productId);
      
      if (response.success) {
        setIsInWishlist(prev => {
          const newSet = new Set(prev);
          newSet.delete(productId);
          return newSet;
        });
        
        setWishlistItems(prev => prev.filter(item => item.product_id !== productId));

        const toast = getToast();
        if (toast) {
          setTimeout(() => {
            toast.showSuccess('Removed from Wishlist', 'Product has been removed from your wishlist.');
          }, 0);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      const toast = getToast();
      if (toast) {
        setTimeout(() => {
          toast.showError('Error', error.message || 'Failed to remove product from wishlist.');
        }, 0);
      }
      return false;
    }
  }, [isAuthenticated, isInWishlist]);

  /**
   * Toggle wishlist status
   */
  const toggleWishlist = useCallback(async (productId) => {
    if (isInWishlist.has(productId)) {
      return await removeFromWishlist(productId);
    } else {
      return await addToWishlist(productId);
    }
  }, [isInWishlist, addToWishlist, removeFromWishlist]);

  /**
   * Clear entire wishlist
   */
  const clearWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      return false;
    }

    try {
      const response = await wishlistApi.clearWishlist();
      
      if (response.success) {
        setWishlistItems([]);
        setIsInWishlist(new Set());

        const toast = getToast();
        if (toast) {
          setTimeout(() => {
            toast.showSuccess('Wishlist Cleared', 'All items have been removed from your wishlist.');
          }, 0);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      const toast = getToast();
      if (toast) {
        setTimeout(() => {
          toast.showError('Error', error.message || 'Failed to clear wishlist.');
        }, 0);
      }
      return false;
    }
  }, [isAuthenticated]);

  /**
   * Refresh wishlist from server
   */
  const refreshWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await wishlistApi.getWishlist();
      
      if (response.success) {
        setWishlistItems(response.items || []);
        const productIds = new Set((response.items || []).map(item => item.product_id));
        setIsInWishlist(productIds);
      }
    } catch (error) {
      console.error('Error refreshing wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const value = {
    wishlistItems,
    wishlistCount: wishlistItems.length,
    isInWishlist: checkIfInWishlist,
    isLoading,
    isInitialized,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    clearWishlist,
    refreshWishlist
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}

