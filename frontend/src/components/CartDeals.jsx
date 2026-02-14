'use client';

import React, { useState, useEffect } from 'react';
import { Gift, Sparkles, Plus, CheckCircle, TrendingUp, Trash2 } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import dealApi from '../api/dealApi';
import { formatPrice } from '../utils/priceFormatter';
import { resolveImageUrl } from '../utils/imageUrl';

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
              <span className="text-gray-700 dark:text-gray-300">Progress to next deal</span>
              <span className="font-semibold text-pink-700 dark:text-pink-400">
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
      {/* Unlocked Deals - Same card design as Upcoming Deals, with green accents for unlocked */}
      {unlockedDeals.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 shadow-sm dark:shadow-xl dark:shadow-black/30">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
              Deal unlocked!
            </h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-[10px] font-semibold px-2 py-0.5 border border-green-200 dark:border-green-800">
              <CheckCircle className="w-3 h-3" />
              Unlocked
            </span>
          </div>

          <div className="space-y-2.5 sm:space-y-3">
            {unlockedDeals.map((deal) => {
              const alreadyInCart = isDealInCart(deal.product_id);
              const isAdding = addingDealId === deal.deal_id;
              const isRemoving = removingDealId === deal.deal_id;

              return (
                <div key={deal.deal_id} className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                  {/* Top bar - same style as Upcoming Deals but green for unlocked */}
                  <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-3 py-2 text-xs sm:text-sm font-semibold flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Deal unlocked – grab now</span>
                  </div>

                  {/* Deal card - same layout as Upcoming Deals */}
                  <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50">
                    <div className="flex items-start gap-2.5 sm:gap-3 mb-2 sm:mb-2.5">
                      {deal.product.image_url && (
                        <img
                          src={resolveImageUrl(deal.product.image_url)}
                          alt={deal.product.name}
                          className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
                          {deal.product.name}
                        </p>
                        {deal.product.base_weight && (
                          <p className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                            {deal.product.base_weight}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs sm:text-sm font-bold">
                            in {formatPrice(deal.deal_price)}
                          </span>
                          {deal.original_price && deal.original_price > deal.deal_price && (
                            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                              current price {formatPrice(deal.original_price)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      {alreadyInCart ? (
                        <>
                          <button
                            disabled
                            className="flex-1 py-2 sm:py-2.5 px-3 rounded-lg text-xs sm:text-sm font-medium bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span>Added</span>
                          </button>
                          <button
                            onClick={() => handleRemoveDeal(deal)}
                            disabled={isRemoving || loading}
                            className="py-2 sm:py-2.5 px-3 rounded-lg text-xs sm:text-sm font-medium bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-red-300 dark:hover:border-red-700 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center justify-center disabled:opacity-50"
                            title="Remove from cart"
                          >
                            {isRemoving ? (
                              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            )}
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleAddDeal(deal)}
                          disabled={isAdding || loading}
                          className="w-full py-2 sm:py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 border-2 border-pink-500 dark:border-pink-500 text-pink-600 dark:text-pink-400 bg-transparent hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:border-pink-600 dark:hover:border-pink-400 disabled:opacity-50"
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
            <span className="inline-flex items-center gap-1 rounded-full bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 text-[10px] font-semibold px-2 py-0.5 border border-pink-200 dark:border-pink-800">
              <Gift className="w-3 h-3" />
              Deal
            </span>
          </div>

          <div className="space-y-2.5 sm:space-y-3">
            {lockedDeals.map((deal) => {
              const amountNeeded = Math.ceil(deal.threshold - cartTotal);
              const progressPercent = Math.min(100, (cartTotal / deal.threshold) * 100);
              const currentPrice = deal.original_price;

              return (
                <div key={deal.deal_id} className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                  {/* Top deal info bar */}
                  <div className="bg-gradient-to-r from-pink-600 to-rose-600 text-white px-3 py-2 text-xs sm:text-sm font-semibold flex items-center gap-2">
                    <Gift className="w-3.5 h-3.5" />
                    <span>Shop for ₹{amountNeeded} more to unlock this deal</span>
                  </div>

                  {/* Deal card */}
                  <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50">
                    <div className="flex items-start gap-2.5 sm:gap-3 mb-2 sm:mb-2.5">
                      {deal.product.image_url && (
                        <img
                          src={resolveImageUrl(deal.product.image_url)}
                          alt={deal.product.name}
                          className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
                          {deal.product.name}
                        </p>
                        {deal.product.base_weight && (
                          <p className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                            {deal.product.base_weight}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs sm:text-sm font-bold">
                            in {formatPrice(deal.deal_price)}
                          </span>
                          {currentPrice && currentPrice > deal.deal_price && (
                            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                              current price {formatPrice(currentPrice)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 sm:h-2">
                      <div
                        className="bg-gradient-to-r from-pink-500 to-rose-500 dark:from-pink-600 dark:to-rose-600 h-1.5 sm:h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
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

