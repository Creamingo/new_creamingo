'use client';

import React, { useState, useEffect } from 'react';
import { Gift, Sparkles, Plus, CheckCircle, TrendingUp, Trash2 } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import dealApi from '../api/dealApi';
import { formatPrice } from '../utils/priceFormatter';

const CartDeals = () => {
  const { cartItems, addToCart, removeFromCart, getCartSummary } = useCart();
  const [deals, setDeals] = useState(null);
  const [loading, setLoading] = useState(false);
  const [addingDealId, setAddingDealId] = useState(null);
  const [removingDealId, setRemovingDealId] = useState(null);

  const cartSummary = getCartSummary();
  const cartTotal = cartSummary.totalPrice;

  // Check if deal product is already in cart and get the cart item
  const getDealCartItem = (dealId) => {
    return cartItems.find(item => 
      item.is_deal_item && item.deal_id === dealId
    );
  };

  // Check if deal product is already in cart
  const isDealInCart = (productId) => {
    return cartItems.some(item => 
      item.product.id === productId && item.is_deal_item
    );
  };

  // Fetch deals based on cart total
  useEffect(() => {
    const fetchDeals = async () => {
      if (cartTotal > 0) {
        setLoading(true);
        try {
          const response = await dealApi.getActiveDeals(cartTotal);
          setDeals(response);
        } catch (error) {
          console.error('Error fetching deals:', error);
          setDeals(null);
        } finally {
          setLoading(false);
        }
      } else {
        setDeals(null);
      }
    };

    fetchDeals();
  }, [cartTotal, cartItems.length]);

  // Handle adding deal to cart
  const handleAddDeal = async (deal) => {
    if (isDealInCart(deal.product_id)) {
      return; // Already in cart
    }

    setAddingDealId(deal.deal_id);
    try {
      // Add product to cart with deal price
      const dealItem = {
        product: deal.product,
        quantity: 1,
        is_deal_item: true,
        deal_id: deal.deal_id,
        deal_threshold: deal.threshold,
        deal_price: deal.deal_price
      };

      // Use addToCart but override the price
      await addToCart(deal.product, 1, null, null, null, deal.deal_price, deal.deal_id, deal.threshold);
      
      // Refresh deals after adding
      const response = await dealApi.getActiveDeals(cartTotal);
      setDeals(response);
    } catch (error) {
      console.error('Error adding deal to cart:', error);
    } finally {
      setAddingDealId(null);
    }
  };

  // Handle removing deal from cart
  const handleRemoveDeal = async (deal) => {
    const cartItem = getDealCartItem(deal.deal_id);
    if (!cartItem) {
      return; // Not in cart
    }

    setRemovingDealId(deal.deal_id);
    try {
      removeFromCart(cartItem.id);
      
      // Refresh deals after removing
      const response = await dealApi.getActiveDeals(cartTotal);
      setDeals(response);
    } catch (error) {
      console.error('Error removing deal from cart:', error);
    } finally {
      setRemovingDealId(null);
    }
  };

  if (!deals || (!deals.eligible_deals || deals.eligible_deals.length === 0)) {
    // Show next deal progress if available
    if (deals?.next_deal) {
      const amountNeeded = Math.ceil(deals.next_deal.threshold - cartTotal);
      const progressPercent = Math.min(100, (cartTotal / deals.next_deal.threshold) * 100);

      return (
        <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-lg sm:rounded-xl border border-pink-200 dark:border-pink-700 p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="p-1.5 sm:p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
              <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600 dark:text-pink-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
                Steal Deal Unlocked
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Add ₹{amountNeeded} more to unlock next deal
              </p>
            </div>
          </div>
          
          <div className="space-y-2 sm:space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-gray-600 dark:text-gray-400">Progress to next deal</span>
              <span className="font-semibold text-pink-600 dark:text-pink-400">
                {formatPrice(cartTotal)} / {formatPrice(deals.next_deal.threshold)}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 sm:h-2.5">
              <div
                className="bg-gradient-to-r from-pink-500 to-rose-500 h-2 sm:h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  const unlockedDeals = deals.eligible_deals.filter(d => d.status === 'unlocked');
  const lockedDeals = deals.eligible_deals.filter(d => d.status === 'locked');

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Unlocked Deals */}
      {unlockedDeals.length > 0 && (
        <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-lg sm:rounded-xl border border-pink-200 dark:border-pink-700 p-4 sm:p-6">
          {/* Deal Unlocked Banner */}
          <div className="flex items-center gap-2 mb-4 sm:mb-5">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                Deal unlocked!
              </span>
            </div>
          </div>

          {/* Mobile: Horizontal scrollable row, Desktop: Grid */}
          <div 
            className="flex md:grid md:grid-cols-2 gap-3 sm:gap-4 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 -mx-1 md:mx-0 px-1 md:px-0"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(155, 155, 155, 0.5) transparent'
            }}
          >
            {unlockedDeals.map((deal) => {
              const alreadyInCart = isDealInCart(deal.product_id);
              const isAdding = addingDealId === deal.deal_id;
              const isRemoving = removingDealId === deal.deal_id;

              return (
                <div
                  key={deal.deal_id}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-pink-200 dark:border-pink-700 p-3.5 sm:p-4 hover:shadow-md transition-shadow flex-shrink-0 w-[280px] sm:w-[300px] md:w-auto md:flex-shrink flex flex-col"
                >
                  {/* Product Title - Full width, single line */}
                  <h4 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-3.5 truncate">
                    {deal.product.name}
                  </h4>
                  
                  {/* Image and Price/Weight/Button Section */}
                  <div className="flex items-start gap-3 sm:gap-3.5">
                    {/* Product Image - Left side */}
                    {deal.product.image_url && (
                      <img
                        src={deal.product.image_url}
                        alt={deal.product.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    
                    {/* Price, Weight and Button - Right side */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between h-16 sm:h-20">
                      {/* Price and Weight in a row */}
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 line-through">
                          {formatPrice(deal.product.original_price || deal.product.base_price)}
                        </span>
                        <span className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400">
                          {formatPrice(deal.deal_price)}
                        </span>
                        {deal.product.base_weight && (
                          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                            • {deal.product.base_weight}
                          </span>
                        )}
                      </div>
                      
                      {/* Button - Just below Prices and Weight */}
                      <div className="mt-auto">
                        {alreadyInCart ? (
                          <div className="flex gap-2 sm:gap-2">
                            <button
                              disabled
                              className="py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed flex items-center justify-center gap-1.5 sm:gap-2"
                            >
                              <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              <span>Added</span>
                            </button>
                            <button
                              onClick={() => handleRemoveDeal(deal)}
                              disabled={isRemoving || loading}
                              className="py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-red-300 dark:hover:border-red-700 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center justify-center gap-1.5 sm:gap-2 disabled:opacity-50"
                              title="Remove from cart"
                            >
                              {isRemoving ? (
                                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAddDeal(deal)}
                            disabled={isAdding || loading}
                            className="w-full py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-1.5 sm:gap-2 bg-white dark:bg-gray-800 border border-pink-500 dark:border-pink-500 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20 disabled:opacity-50"
                          >
                            {isAdding ? (
                              <>
                                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                                <span>Adding...</span>
                              </>
                            ) : (
                              <>
                            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span>Grab for Just {formatPrice(deal.deal_price)}</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Locked Deals - Show Progress */}
      {lockedDeals.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
              Upcoming Deals
            </h3>
          </div>

          <div className="space-y-2.5 sm:space-y-3">
            {lockedDeals.map((deal) => {
              const amountNeeded = Math.ceil(deal.threshold - cartTotal);
              const progressPercent = Math.min(100, (cartTotal / deal.threshold) * 100);

              return (
                <div
                  key={deal.deal_id}
                  className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-start gap-2.5 sm:gap-3 mb-2 sm:mb-2.5">
                    {deal.product.image_url && (
                      <img
                        src={deal.product.image_url}
                        alt={deal.product.name}
                        className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">
                        Add ₹{amountNeeded} more to unlock:
                      </p>
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                          {deal.product.name} for {formatPrice(deal.deal_price)}
                        </p>
                        {deal.product.base_weight && (
                          <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
                            • {deal.product.base_weight}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 sm:h-2">
                    <div
                      className="bg-gradient-to-r from-pink-400 to-rose-400 h-1.5 sm:h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CartDeals;

