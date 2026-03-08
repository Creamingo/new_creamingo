'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Heart, ChevronLeft, ChevronRight, Share2, Trophy, TrendingUp } from 'lucide-react';
import { useWishlist } from '../../../../contexts/WishlistContext';
import { useCustomerAuth } from '../../../../contexts/CustomerAuthContext';
import { useAuthModal } from '../../../../contexts/AuthModalContext';
import { resolveImageUrl } from '../../../../utils/imageUrl';

const RelatedProducts = ({ products, currentProductId }) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isAuthenticated } = useCustomerAuth();
  const { openAuthModal } = useAuthModal();
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Show all products in a single row with scroll
  const displayProducts = products;

  // Check if desktop on mount and resize
  useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);
    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Star key="half" className="w-3 h-3 text-yellow-400 fill-current opacity-50" />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="w-3 h-3 text-gray-300" />
      );
    }

    return stars;
  };

  const formatPrice = (price) => {
    const numericPrice = typeof price === 'number' ? price : Number(price);
    if (!Number.isFinite(numericPrice)) {
      return '₹0';
    }
    return `₹${numericPrice % 1 === 0 ? numericPrice.toFixed(0) : numericPrice.toFixed(2)}`;
  };

  // Check scroll position for mobile navigation
  const checkScrollPosition = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  // Scroll functions for both mobile and desktop
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const cardWidth = container.children[0]?.offsetWidth || 0;
      const gap = isDesktop ? 24 : 16; // 1.5rem for desktop, 1rem for mobile
      const scrollAmount = cardWidth + gap;
      
      container.scrollBy({
        left: -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const cardWidth = container.children[0]?.offsetWidth || 0;
      const gap = isDesktop ? 24 : 16; // 1.5rem for desktop, 1rem for mobile
      const scrollAmount = cardWidth + gap;
      
      container.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    checkScrollPosition();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      return () => container.removeEventListener('scroll', checkScrollPosition);
    }
  }, [displayProducts, isDesktop]);

  if (!displayProducts || displayProducts.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-xl dark:shadow-black/20 border border-black dark:border-gray-700">
      <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">You May Also Like</h3>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
          Customers who viewed this item also viewed
        </p>
      </div>

      <div className="p-3 sm:p-4">
        {/* Horizontal Scroll for All Devices */}
        <div className="relative">
          {/* Scroll Navigation Buttons */}
          {canScrollLeft && (
            <button
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 lg:w-10 lg:h-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-md dark:shadow-xl dark:shadow-black/30 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 lg:w-5 lg:h-5 text-gray-600 dark:text-gray-300" />
            </button>
          )}
          
          {canScrollRight && (
            <button
              onClick={scrollRight}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 lg:w-10 lg:h-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-md dark:shadow-xl dark:shadow-black/30 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronRight className="w-4 h-4 lg:w-5 lg:h-5 text-gray-600 dark:text-gray-300" />
            </button>
          )}

          {/* Scrollable Container */}
          <div 
            ref={scrollContainerRef}
            className="flex space-x-4 lg:space-x-6 overflow-x-auto scrollbar-hide pb-2"
            style={{ 
              scrollSnapType: 'x mandatory',
              width: '100%'
            }}
          >
            {displayProducts.map((product, index) => {
              const isFirstVisible = index === 0;
              // Helper function to check if a value is truthy but not zero/zero-like
              const isTruthyBadge = (value) => {
                if (value === null || value === undefined) return false;
                if (value === false) return false;
                if (value === 0 || value === "0" || value === "00" || value === "000") return false;
                if (typeof value === 'string' && /^0+$/.test(value)) return false; // Matches "0", "00", "000", etc.
                return !!value; // Return truthy value
              };
              
              // Helper function specifically for top product and bestseller checks
              const isTopOrBestseller = (value) => {
                if (value === true || value === 1 || value === "1") return true;
                return isTruthyBadge(value);
              };
              
              // Sanitize product data - ensure no numeric fields are accidentally rendered
              const sanitizedProduct = {
                ...product,
                // Explicitly filter out any fields that might contain "000", "00", or numeric identifiers
                display_order: undefined,
                status: undefined,
                priority: undefined,
                order: undefined,
                rank: undefined,
                position: undefined
              };
              return (
              <div
                key={product.id}
                className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg dark:hover:shadow-xl dark:hover:shadow-black/30 transition-all duration-300 hover:border-rose-200 dark:hover:border-rose-800 flex-shrink-0"
                style={{ 
                  scrollSnapAlign: 'start',
                  // Mobile: 2.25 cards visible, Desktop: 4.5 cards visible
                  width: isDesktop 
                    ? 'calc((100% - 1.5rem) / 4.5)' 
                    : 'calc((100vw - 3rem) / 2.25)',
                  minWidth: isDesktop ? '200px' : '160px',
                  maxWidth: isDesktop ? '260px' : '180px'
                }}
              >
                {/* Product Image */}
                <div className="relative aspect-square overflow-hidden">
                  <Link href={`/product/${sanitizedProduct.slug}`} className="absolute inset-0">
                    <Image
                      src={resolveImageUrl(sanitizedProduct.image_url)}
                      alt={sanitizedProduct.name}
                      fill
                      sizes="(max-width: 1024px) 160px, 200px"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      loading={isFirstVisible ? 'eager' : 'lazy'}
                      priority={isFirstVisible}
                      unoptimized
                    />
                  </Link>
                  
                  {/* Top Right Corner - Discount Badge */}
                  <div className="absolute top-0 right-0 z-10">
                    {/* Discount Badge - Top Right Corner - Glassy Background */}
                    {sanitizedProduct.discount_percent > 0 && (
                      <div className="bg-red-500/80 dark:bg-red-500/70 backdrop-blur-md text-white font-bold rounded-bl-lg shadow-lg border border-white/20 dark:border-white/10 text-[8px] px-1.5 py-0.5 sm:text-[9px] sm:px-2 sm:py-1 lg:text-xs lg:px-2.5 lg:py-1.5">
                        {sanitizedProduct.discount_percent}% OFF
                      </div>
                    )}
                  </div>

                  {/* Bottom of Image - Action Icons and Status Badge in Row */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 sm:bottom-3 flex flex-row items-center gap-1 sm:gap-1.5 z-10">
                    {/* Wishlist Icon - First */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!isAuthenticated) {
                          if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('pending_wishlist_add', String(sanitizedProduct.id));
                          openAuthModal();
                          return;
                        }
                        toggleWishlist(sanitizedProduct.id);
                      }}
                      className={`w-6 h-6 sm:w-8 sm:h-8 rounded flex items-center justify-center transition-all duration-200 backdrop-blur-md shadow-lg border border-white/30 dark:border-white/20 ${
                        isInWishlist(sanitizedProduct.id) 
                          ? 'bg-rose-500/40 dark:bg-rose-500/30 text-white' 
                          : 'bg-white/40 dark:bg-gray-800/40 text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'
                      }`}
                      aria-label={isInWishlist(sanitizedProduct.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                      <Heart 
                        className={`w-3 h-3 sm:w-4 sm:h-4 ${
                          isInWishlist(sanitizedProduct.id) 
                            ? 'fill-current' 
                            : ''
                        }`} 
                      />
                    </button>

                    {/* Status Badges - Top Product and Bestseller (Independent) - Icon Only */}
                    {(isTopOrBestseller(sanitizedProduct.is_top_product) || isTopOrBestseller(product.is_top_product) || isTopOrBestseller(product.isTopProduct)) && (
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded flex items-center justify-center backdrop-blur-md shadow-lg border border-white/30 dark:border-white/20 bg-amber-500/40 dark:bg-amber-500/30">
                        <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-white fill-white" />
                      </div>
                    )}
                    {(isTopOrBestseller(sanitizedProduct.is_bestseller) || isTopOrBestseller(product.is_bestseller) || isTopOrBestseller(product.isBestseller)) && (
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded flex items-center justify-center backdrop-blur-md shadow-lg border border-white/30 dark:border-white/20 bg-orange-500/40 dark:bg-orange-500/30">
                        <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-white fill-white" />
                      </div>
                    )}

                    {/* Share Icon - Last */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Handle share functionality
                        if (typeof window !== 'undefined') {
                          const shareUrl = `${window.location.origin}/product/${sanitizedProduct.slug}`;
                          if (navigator.share) {
                            navigator.share({
                              title: sanitizedProduct.name,
                              url: shareUrl
                            }).catch(() => {
                              // Fallback: copy to clipboard
                              navigator.clipboard.writeText(shareUrl);
                            });
                          } else {
                            // Fallback: copy to clipboard
                            navigator.clipboard.writeText(shareUrl);
                          }
                        }
                      }}
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded flex items-center justify-center transition-all duration-200 backdrop-blur-md shadow-lg border border-white/30 dark:border-white/20 bg-white/40 dark:bg-gray-800/40 text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50"
                      aria-label="Share product"
                    >
                      <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-2.5 sm:p-3">
                  <Link href={`/product/${sanitizedProduct.slug}`}>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2 hover:text-rose-600 dark:hover:text-rose-400 transition-colors text-sm">
                      {sanitizedProduct.name}
                    </h4>
                  </Link>
                  
                  {/* Star Rating - Contemporary Style (Matching Listing Page) */}
                  <div className="flex items-center mb-1.5 lg:mb-2 mt-2">
                    {/* Mobile: Compact Rating */}
                    <div className="flex items-center space-x-0.5 lg:hidden">
                      <span className="font-poppins font-bold text-[10px] text-yellow-700 dark:text-yellow-500">
                        {sanitizedProduct.rating || 4.5}
                      </span>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-2 h-2 ${i < Math.floor(sanitizedProduct.rating || 4.5) ? 'text-yellow-500 dark:text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'}`}
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="font-inter text-[9px] text-gray-500 dark:text-gray-400 font-medium ml-0.5">
                        ({sanitizedProduct.review_count || 0})
                      </span>
                    </div>
                    
                    {/* Desktop: Full Rating */}
                    <div className="hidden lg:flex items-center space-x-1">
                      <span className="font-poppins font-bold text-xs text-yellow-700 dark:text-yellow-500">
                        {sanitizedProduct.rating || 4.5}
                      </span>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-2.5 h-2.5 ${i < Math.floor(sanitizedProduct.rating || 4.5) ? 'text-yellow-500 dark:text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'}`}
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="font-inter text-[10px] text-yellow-600 dark:text-yellow-500 font-medium ml-1">
                        ({sanitizedProduct.review_count || 0})
                      </span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline space-x-2 mt-2">
                    <span className="text-base font-bold text-gray-900 dark:text-gray-100">
                      {formatPrice(sanitizedProduct.discounted_price || sanitizedProduct.base_price)}
                    </span>
                    {sanitizedProduct.discount_percent > 0 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 line-through">
                        {formatPrice(sanitizedProduct.base_price)}
                      </span>
                    )}
                  </div>

                  {/* Category */}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                    {sanitizedProduct.category_name}
                    {sanitizedProduct.subcategory_name && ` • ${sanitizedProduct.subcategory_name}`}
                  </p>
                </div>
              </div>
              );
            })}
          </div>
        </div>

        {/* Visual Scroll Indicator */}
        <div className="mt-6 sm:mt-8 mb-8 lg:mb-6 text-center">
          <div className="inline-flex items-center space-x-2 text-gray-600 dark:text-gray-400">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
              <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
            </div>
            <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-sm text-gray-700 dark:text-gray-300 font-semibold">Swipe to explore more</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RelatedProducts;
