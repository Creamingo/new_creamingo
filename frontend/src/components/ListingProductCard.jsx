'use client';

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Heart, Star } from 'lucide-react'
import { generateDynamicTitle } from '../utils/dynamicTitle'
import { useWishlist } from '../contexts/WishlistContext'
import DeliveryBadge from './DeliveryBadge'

const ListingProductCard = ({ 
  product, 
  formatPrice, 
  currentSubcategoryName // New prop for dynamic title generation
}) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isProductInWishlist = isInWishlist(product.id);
  const [isVisible, setIsVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const cardRef = useRef(null);
  
  // Generate dynamic title based on current subcategory
  const displayTitle = currentSubcategoryName 
    ? generateDynamicTitle(product.name, currentSubcategoryName)
    : product.name;
    
  const discountPercent = Math.round(((product.originalPrice - product.discountedPrice) / product.originalPrice) * 100);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before the element is visible
        threshold: 0.01
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);
    
  return (
    <div ref={cardRef} className="group w-full flex flex-col">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-md dark:shadow-black/20 border border-[#8B4513] dark:border-amber-700 overflow-hidden h-full transition-all duration-200 hover:shadow-md dark:hover:shadow-lg">
        {/* Product Image Container */}
        <div className="relative w-full aspect-square overflow-hidden bg-gray-50 dark:bg-gray-700">
          <Link href={currentSubcategoryName 
            ? `/product/${product.slug || product.id}?subcategory=${encodeURIComponent(currentSubcategoryName)}`
            : `/product/${product.slug || product.id}`
          }>
            {/* Blur-up placeholder */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-800 dark:to-gray-700 animate-pulse"></div>
            )}
            {isVisible && (
              <img
                src={product.image}
                alt={product.name}
                className={`w-full h-full object-cover object-center lg:group-hover:scale-105 lg:transition-transform lg:duration-300 cursor-pointer transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
                loading="lazy"
              />
            )}
          </Link>
          
          {/* Simple Discount Badge */}
          <div className="absolute top-0 right-0 z-10">
            <div className="bg-red-500 text-white font-bold rounded-bl-lg text-[8px] px-1.5 py-0.5 lg:text-xs lg:px-2 lg:py-1">
              {discountPercent}% OFF
            </div>
          </div>

          {/* Wishlist Button - Top-left corner with matching radius, bottom-right also rounded */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist(product.id);
            }}
            className={`absolute top-0 left-0 w-8 h-8 lg:w-10 lg:h-10 rounded-tl-xl rounded-br-xl flex items-center justify-center transition-all duration-200 backdrop-blur-sm z-20 ${
              isProductInWishlist
                ? 'bg-red-500 dark:bg-red-600 text-white shadow-md'
                : 'bg-white/90 dark:bg-gray-800/90 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700'
            }`}
          >
            <Heart className={`w-4 h-4 lg:w-5 lg:h-5 ${isProductInWishlist ? 'fill-current' : ''}`} />
          </button>


          {/* Top Product Badge - Below Discount Badge */}
          {product.isTopProduct && (
            <div className="absolute top-6 right-0 lg:top-8 z-10">
              <div className="bg-white/20 dark:bg-gray-900/20 backdrop-blur-sm rounded-tr-xl rounded-bl-lg shadow-sm border border-white/20 dark:border-gray-700/20 text-[9px] px-2 py-1 lg:text-xs lg:px-2.5 lg:py-1.5">
                <span className="font-medium text-gray-900 dark:text-gray-100 tracking-wide">Top</span>
              </div>
            </div>
          )}

          {/* Delivery Badge - Bottom of Image */}
          <DeliveryBadge />
        </div>

        {/* Product Info Section - Compact & Clean */}
        <div className="p-1.5 flex-1 flex flex-col justify-between">
          {/* Product Name - One Line with Truncation (Dynamic Title) */}
          <Link href={currentSubcategoryName 
            ? `/product/${product.slug || product.id}?subcategory=${encodeURIComponent(currentSubcategoryName)}`
            : `/product/${product.slug || product.id}`
          }>
            <h3 className="font-inter font-semibold text-[11px] lg:text-sm text-gray-800 dark:text-gray-100 mb-0.5 lg:mb-1 line-clamp-2 min-h-[2.5em] lg:min-h-0 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer leading-tight">
              {displayTitle}
            </h3>
          </Link>

          {/* Star Rating - Contemporary Style */}
          <div className="flex items-center mb-1 lg:mb-1.5">
            {/* Mobile: Compact Rating */}
            <div className="flex items-center space-x-0.5 lg:hidden">
              <span className="font-poppins font-bold text-[10px] text-yellow-700 dark:text-yellow-500">
                {product.rating}
              </span>
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-2 h-2 ${i < Math.floor(product.rating) ? 'text-yellow-500 dark:text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'}`}
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="font-inter text-[9px] text-gray-500 dark:text-gray-400 font-medium ml-0.5">
                ({product.reviews})
              </span>
            </div>
            
            {/* Desktop: Full Rating */}
            <div className="hidden lg:flex items-center space-x-1">
              <span className="font-poppins font-bold text-xs text-yellow-700 dark:text-yellow-500">
                {product.rating}
              </span>
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-2.5 h-2.5 ${i < Math.floor(product.rating) ? 'text-yellow-500 dark:text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'}`}
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="font-inter text-[10px] text-yellow-600 dark:text-yellow-500 font-medium ml-1">
                ({product.reviews})
              </span>
            </div>
          </div>

          {/* Price Section - Dynamic Pricing */}
          <div className="flex items-baseline space-x-1.5 lg:space-x-2">
            <span className="font-poppins font-bold text-sm lg:text-base text-gray-800 dark:text-gray-100">
              {formatPrice(product.discountedPrice)}
            </span>
            <span className="font-inter text-[9px] lg:text-[10px] text-gray-400 dark:text-gray-500 line-through">
              {formatPrice(product.originalPrice)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ListingProductCard
