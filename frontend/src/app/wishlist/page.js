'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, ArrowLeft, Trash2, ShoppingCart, Loader2, Package, AlertCircle, X } from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import MobileFooter from '../../components/MobileFooter';
import LocationBar from '../../components/LocationBar';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useWishlist } from '../../contexts/WishlistContext';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import Link from 'next/link';

function WishlistPageContent() {
  const router = useRouter();
  const { wishlistItems, isLoading, isInitialized, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { showSuccess, showError } = useToast();
  const [removingId, setRemovingId] = useState(null);
  const [clearing, setClearing] = useState(false);
  const [addingToCartId, setAddingToCartId] = useState(null);

  const handleRemoveItem = async (productId) => {
    setRemovingId(productId);
    try {
      await removeFromWishlist(productId);
    } catch (error) {
      showError('Error', 'Failed to remove item from wishlist');
    } finally {
      setRemovingId(null);
    }
  };

  const handleClearWishlist = async () => {
    if (!confirm('Are you sure you want to clear your entire wishlist?')) {
      return;
    }

    setClearing(true);
    try {
      await clearWishlist();
      showSuccess('Wishlist Cleared', 'All items have been removed from your wishlist.');
    } catch (error) {
      showError('Error', 'Failed to clear wishlist');
    } finally {
      setClearing(false);
    }
  };

  const handleAddToCart = async (item) => {
    setAddingToCartId(item.product_id);
    try {
      // Create the proper item structure that addToCart expects
      const cartItem = {
        product: {
          id: item.product_id,
          name: item.product_name,
          image_url: item.image_url,
          slug: item.slug,
          base_price: item.price,
          discounted_price: item.discounted_price,
          price: item.discounted_price || item.price
        },
        variant: item.variant_id ? {
          id: item.variant_id,
          name: item.variant_name,
          weight: item.variant_weight
        } : null,
        quantity: 1,
        flavor: null,
        tier: null,
        deliverySlot: null,
        cakeMessage: null,
        combos: [],
        totalPrice: parseFloat(item.discounted_price || item.price) * 1
      };

      const result = await addToCart(cartItem);
      
      // If successfully added to cart (and not a duplicate), remove from wishlist
      if (result.success && !result.isDuplicate) {
        try {
          await removeFromWishlist(item.product_id);
          // Success toast is already shown by addToCart, no need to show another
        } catch (removeError) {
          console.error('Error removing from wishlist:', removeError);
          // Don't show error toast here - item is already in cart, which is the main goal
          // The wishlist removal is secondary
        }
      } else if (result.isDuplicate) {
        // Item is already in cart, but still in wishlist - that's okay
        // Don't show error - addToCart already shows a warning
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      showError('Error', error.message || 'Failed to add product to cart');
    } finally {
      setAddingToCartId(null);
    }
  };

  const formatPrice = (price) => {
    return `₹${parseFloat(price || 0).toFixed(0)}`;
  };

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <LocationBar />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 300px)' }}>
          <div className="text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-pink-600 dark:text-pink-400 animate-spin" />
            <p className="text-gray-600 dark:text-gray-300">Loading your wishlist...</p>
          </div>
        </div>
        <Footer />
        <MobileFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <LocationBar />

      {/* Header Section - Matching Product Listing Page */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
        <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-3">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-xs text-gray-400 dark:text-gray-500 mb-2">
            <button
              onClick={() => router.push('/')}
              className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 font-medium"
            >
              Home
            </button>
            <span className="text-gray-500 dark:text-gray-400 text-sm">›</span>
            <span className="text-gray-700 dark:text-gray-300 font-medium">My Wishlist</span>
          </nav>

          {/* Page Title and Controls */}
          <div className="mb-3">
            {/* Desktop Layout */}
            <div className="hidden lg:block">
              <div className="flex items-start justify-between">
                {/* Left: Title and Info */}
                <div className="flex-1">
                  <h1 className="text-xl lg:text-2xl font-semibold text-gray-900 dark:text-gray-100 font-poppins mb-1">
                    My Wishlist
                  </h1>
                  <div className="flex items-center space-x-4">
                    <span className="text-base text-gray-500 dark:text-gray-400 font-inter font-medium">
                      {wishlistItems.length} {wishlistItems.length === 1 ? 'Item' : 'Items'}
                    </span>
                    <div className="h-4 w-px bg-gray-200 dark:bg-gray-700"></div>
                    <p className="text-gray-600 dark:text-gray-300 font-inter text-sm">
                      Save your favorite products and add them to cart anytime
                    </p>
                  </div>
                </div>
                
                {/* Right: Clear All Button */}
                {wishlistItems.length > 0 && (
                  <button
                    onClick={handleClearWishlist}
                    disabled={clearing}
                    className="ml-6 flex items-center space-x-2 rounded-lg px-4 py-3 transition-all duration-200 cursor-pointer bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 hover:border-red-300 dark:hover:border-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {clearing ? (
                      <>
                        <Loader2 className="w-4 h-4 text-red-600 dark:text-red-400 animate-spin" />
                        <span className="text-xs text-red-700 dark:text-red-300 font-inter font-medium">Clearing...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                        <span className="text-xs text-red-700 dark:text-red-300 font-inter font-medium">Clear All</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Layout */}
            <div className="lg:hidden">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 font-poppins mb-2">
                My Wishlist
              </h1>
              <div className="flex items-center space-x-4 mb-3">
                <span className="text-sm text-gray-500 dark:text-gray-400 font-inter font-medium">
                  {wishlistItems.length} {wishlistItems.length === 1 ? 'Item' : 'Items'}
                </span>
                <div className="h-3 w-px bg-gray-200 dark:bg-gray-700"></div>
                <p className="text-gray-600 dark:text-gray-300 font-inter text-xs flex-1">
                  Save your favorite products for later
                </p>
              </div>
              
              {/* Mobile Clear All Button */}
              {wishlistItems.length > 0 && (
                <button
                  onClick={handleClearWishlist}
                  disabled={clearing}
                  className="w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 hover:bg-red-100 dark:hover:bg-red-900/30"
                >
                  {clearing ? (
                    <>
                      <Loader2 className="w-4 h-4 text-red-600 dark:text-red-400 animate-spin" />
                      <span className="text-xs text-red-700 dark:text-red-300 font-inter font-medium">Clearing...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                      <span className="text-xs text-red-700 dark:text-red-300 font-inter font-medium">Clear All Wishlist</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 pt-4 pb-8">
        {wishlistItems.length === 0 ? (
          <div className="text-center py-16 lg:py-24">
            <div className="w-24 h-24 lg:w-32 lg:h-32 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-12 h-12 lg:w-16 lg:h-16 text-gray-300 dark:text-gray-600" />
            </div>
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Your Wishlist is Empty</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">Start saving your favorite products to your wishlist!</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-pink-600 dark:bg-pink-700 text-white rounded-lg hover:bg-pink-700 dark:hover:bg-pink-600 transition-colors font-medium"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-6">
            {wishlistItems.map((item) => {
              const discountPercent = item.discount_percent || 
                (item.price && item.discounted_price ? 
                  Math.round(((item.price - item.discounted_price) / item.price) * 100) : 0);

              return (
                <div key={item.id} className="group w-full flex flex-col">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-[#8B4513] dark:border-amber-700 overflow-hidden h-full flex flex-col">
                    {/* Product Image Container */}
                    <div className="relative w-full aspect-square overflow-hidden bg-gray-50 dark:bg-gray-700">
                      <Link href={`/product/${item.slug || item.product_id}`}>
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.product_name}
                            className="w-full h-full object-cover object-center lg:group-hover:scale-105 lg:transition-transform lg:duration-300 cursor-pointer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-16 h-16 text-gray-300 dark:text-gray-600" />
                          </div>
                        )}
                      </Link>
                      
                      {/* Discount Badge */}
                      {discountPercent > 0 && (
                        <div className="absolute top-0 right-0 z-10">
                          <div className="bg-red-500 dark:bg-red-600 text-white font-bold rounded-bl-lg text-[10px] px-2 py-1 lg:text-sm lg:px-3 lg:py-1.5">
                            {discountPercent}% OFF
                          </div>
                        </div>
                      )}

                      {/* Delete Button (Top Left) */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemoveItem(item.product_id);
                        }}
                        disabled={removingId === item.product_id}
                        className={`absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center transition-colors z-10 ${
                          removingId === item.product_id
                            ? 'bg-white/90 dark:bg-gray-800/90 cursor-not-allowed'
                            : 'bg-white/80 dark:bg-gray-800/80 text-red-600 dark:text-red-400 hover:bg-white dark:hover:bg-gray-800 hover:scale-110'
                        }`}
                        title="Remove from Wishlist"
                      >
                        {removingId === item.product_id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-red-600 dark:text-red-400" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Product Info Section */}
                    <div className="p-2 flex-1 flex flex-col justify-between">
                      {/* Product Name */}
                      <Link href={`/product/${item.slug || item.product_id}`}>
                        <h3 className="font-inter font-medium text-xs lg:text-sm text-gray-800 dark:text-gray-200 mb-1 truncate hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer">
                          {item.product_name}
                        </h3>
                      </Link>

                      {/* Price Section */}
                      <div className="flex items-baseline space-x-2 mb-2">
                        <span className="font-poppins font-bold text-base text-gray-800 dark:text-gray-100">
                          {formatPrice(item.discounted_price || item.price)}
                        </span>
                        {item.price && item.discounted_price && parseFloat(item.discounted_price) < parseFloat(item.price) && (
                          <span className="font-inter text-[10px] text-gray-400 dark:text-gray-500 line-through">
                            {formatPrice(item.price)}
                          </span>
                        )}
                      </div>

                      {/* Add to Cart Button */}
                      <button
                        onClick={() => handleAddToCart(item)}
                        disabled={addingToCartId === item.product_id}
                        className={`w-full px-3 py-2 rounded-lg font-medium text-xs lg:text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                          addingToCartId === item.product_id
                            ? 'bg-gray-400 dark:bg-gray-600 text-white cursor-not-allowed'
                            : 'bg-pink-600 dark:bg-pink-700 text-white hover:bg-pink-700 dark:hover:bg-pink-600 active:scale-95'
                        }`}
                      >
                        {addingToCartId === item.product_id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Adding...</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-4 h-4" />
                            <span>Add to Cart</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
      <MobileFooter />
    </div>
  );
}

export default function WishlistPage() {
  return (
    <ProtectedRoute>
      <WishlistPageContent />
    </ProtectedRoute>
  );
}
