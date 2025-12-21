'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Star } from 'lucide-react'
import './TopProducts.css'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function TopProducts() {
  const router = useRouter()
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get available weights from product variants and base weight
  const getAvailableWeights = (product) => {
    if (!product) return [];
    
    const weights = [];
    
    // Add base weight if it exists
    if (product.base_weight && product.base_weight.trim() !== '') {
      weights.push(product.base_weight);
    }
    
    // Add variant weights
    if (product.variants && Array.isArray(product.variants)) {
      product.variants.forEach(variant => {
        if (variant.is_available !== false && variant.weight) {
          // Check if weight is not already added (avoid duplicates)
          if (!weights.includes(variant.weight)) {
            weights.push(variant.weight);
          }
        }
      });
    }
    
    // Debug logging
    if (process.env.NODE_ENV === 'development' && product.id) {
      console.log(`[getAvailableWeights] Product ${product.id} (${product.name}):`, {
        base_weight: product.base_weight,
        variants: product.variants,
        variantsCount: product.variants?.length || 0,
        availableWeights: weights
      });
    }
    
    return weights;
  };

  // Check if product has multiple weight options
  const hasMultipleWeights = (product) => {
    if (!product) return false;
    const availableWeights = getAvailableWeights(product);
    const hasMultiple = availableWeights.length > 1;
    
    // Debug logging
    if (process.env.NODE_ENV === 'development' && product.id) {
      console.log(`[hasMultipleWeights] Product ${product.id} (${product.name}):`, {
        availableWeights: availableWeights,
        count: availableWeights.length,
        hasMultiple: hasMultiple
      });
    }
    
    return hasMultiple;
  };

  // Get weight count for badge display
  const getWeightCount = (product) => {
    if (!product) return 0;
    const availableWeights = getAvailableWeights(product);
    return availableWeights.length;
  };



  // Parse price from string or number format
  const parsePrice = (price) => {
    if (typeof price === 'number') {
      return isNaN(price) ? 0 : price;
    }
    if (typeof price === 'string') {
      const cleaned = price.replace('₹', '').replace(',', '').trim();
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const getCurrentPrice = (product) => {
    try {
      if (!product) {
        console.warn('Product is undefined in getCurrentPrice');
        return 0;
      }
      
      // Parse discounted price
      const basePrice = parsePrice(product.discountedPrice);
      return basePrice;
    } catch (error) {
      console.error('Error calculating current price:', error);
      return 0;
    }
  };

  // Get original price
  const getOriginalPrice = (product) => {
    try {
      if (!product) {
        console.warn('Product is undefined in getOriginalPrice');
        return 0;
      }
      
      // Parse original price
      const baseOriginalPrice = parsePrice(product.originalPrice);
      return baseOriginalPrice;
    } catch (error) {
      console.error('Error calculating original price:', error);
      return 0;
    }
  };

  // Import formatPrice from utils
  const { formatPrice: formatPriceUtil } = require('../utils/priceFormatter');
  const formatPrice = (price) => {
    return formatPriceUtil(price);
  };


  // Fetch top products from API
  useEffect(() => {
    const fetchTopProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${API_BASE_URL}/products/top?limit=10`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.data && data.data.products) {
          // Transform API response to match component format
          const transformedProducts = data.data.products.map(product => ({
            id: product.id,
            name: product.name,
            image: product.image_url || product.image || '/Design 1.webp',
            discount: product.discount_percent > 0 
              ? `${Math.round(product.discount_percent)}% OFF` 
              : null,
            originalPrice: product.base_price 
              ? `₹${Math.round(product.base_price)}` 
              : '₹0',
            discountedPrice: product.discounted_price 
              ? `₹${Math.round(product.discounted_price)}` 
              : product.base_price 
                ? `₹${Math.round(product.base_price)}` 
                : '₹0',
            rating: product.rating ?? 0,
            reviews: product.review_count ?? 0,
            slug: product.slug || product.name.toLowerCase().replace(/\s+/g, '-'),
            deliveryTime: "30-60 mins",
            deliveryDate: "Tomorrow",
            isBestSeller: product.is_bestseller || false,
            // Include variants and base weight for badge display
            variants: product.variants || [],
            base_weight: product.base_weight || null,
            is_eggless: product.is_eggless === 1 || product.is_eggless === true || product.is_eggless === '1'
          }));
          
          // Sort by ID in ascending order
          transformedProducts.sort((a, b) => a.id - b.id);
          setProducts(transformedProducts);
        } else {
          setError('No products found');
          setProducts([]);
        }
      } catch (err) {
        console.error('Error fetching top products:', err);
        setError('Failed to load products');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTopProducts();
  }, []);

  // Handle product click navigation
  const handleProductClick = (product) => {
    if (product.slug) {
      router.push(`/product/${product.slug}`);
    }
  };

  // Loading state
  if (loading) {
    return (
      <section className="relative bg-gradient-to-br from-white via-pink-50 to-purple-50 py-6 lg:pt-12 pb-10 lg:pb-16 overflow-visible">
        <div className="relative w-full px-4 sm:px-6 lg:px-8 top-products-content">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 lg:mb-6 text-center">
              <div className="inline-flex items-center justify-center mb-2 lg:mb-1.5">
                <div className="w-8 h-0.5 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"></div>
                <span className="mx-3 text-pink-600 dark:text-pink-400 font-inter text-xs font-medium tracking-wider uppercase" style={{
                  WebkitFontSmoothing: 'antialiased',
                  MozOsxFontSmoothing: 'grayscale',
                  textRendering: 'optimizeLegibility'
                }}>Featured</span>
                <div className="w-8 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
              </div>
              <h2 className="font-poppins text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 via-pink-600 to-purple-600 dark:from-gray-100 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent mb-1 lg:mb-0.5" style={{
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
                textRendering: 'optimizeLegibility',
                WebkitTextStroke: '0.01px transparent'
              }}>
                Top Products
              </h2>
            </div>
            {/* Mobile: Horizontal scroll skeleton */}
            <div className="lg:hidden">
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide" style={{ scrollSnapType: 'x mandatory' }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex-shrink-0 w-[280px] animate-pulse" style={{ scrollSnapAlign: 'start' }}>
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl h-64 mb-2"></div>
                    <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 mb-2"></div>
                    <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 w-3/4"></div>
                  </div>
                ))}
              </div>
            </div>
            {/* Desktop: Grid skeleton */}
            <div className="hidden lg:grid grid-cols-5 gap-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-xl h-48 mb-2"></div>
                  <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 mb-2"></div>
                  <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (error && products.length === 0) {
    return null; // Return null on error to avoid breaking the page
  }

  return (
    <section className="relative bg-gradient-to-br from-white via-pink-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-6 lg:pt-12 lg:pb-16 overflow-visible">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-pink-200 to-purple-200 dark:from-pink-900/20 dark:to-purple-900/20 rounded-full opacity-20 blur-2xl"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-tr from-purple-200 to-pink-200 dark:from-purple-900/20 dark:to-pink-900/20 rounded-full opacity-20 blur-2xl"></div>
      </div>
      
      <div className="relative w-full px-4 sm:px-6 lg:px-8 top-products-content">
        <div className="max-w-7xl mx-auto">
          {/* Section Header - Compact & Trendy */}
          <div className="mb-6 lg:mb-6 text-center">
            <div className="inline-flex items-center justify-center mb-2 lg:mb-1.5">
              <div className="w-8 h-0.5 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"></div>
              <span className="mx-3 text-pink-600 dark:text-pink-400 font-inter text-xs font-medium tracking-wider uppercase" style={{
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
                textRendering: 'optimizeLegibility'
              }}>Instant Buy</span>
              <div className="w-8 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
            </div>
            <h2 className="font-poppins text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 via-pink-600 to-purple-600 dark:from-gray-100 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent mb-1 lg:mb-0.5" style={{
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
              textRendering: 'optimizeLegibility',
              WebkitTextStroke: '0.01px transparent'
            }}>
              Top Products
            </h2>
            <p className="font-inter text-gray-600 dark:text-gray-300 text-sm lg:text-base max-w-xl mx-auto mt-1">
              In a hurry? Click, pick, and enjoy unbeatable cake prices!
            </p>
          </div>

          {/* Mobile: Horizontal Scroll Container */}
          <div className="lg:hidden relative">
            {/* Scrollable Products Container */}
            <div 
              className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
              style={{ 
                scrollSnapType: 'x mandatory',
                WebkitOverflowScrolling: 'touch',
                scrollBehavior: 'smooth'
              }}
            >
            {products.slice(0, 10).map((product, index) => (
              <div 
                key={product.id} 
                  className="flex-shrink-0 w-[280px] cursor-pointer"
                  style={{ 
                    scrollSnapAlign: 'start'
                  }}
                onClick={() => handleProductClick(product)}
              >
                  {/* Modern Card with Enhanced Design */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-xl dark:shadow-black/20 border border-[#6c3e27]/30 dark:border-amber-700/50 overflow-hidden h-full flex flex-col">
                    {/* Product Image Container - Larger on Mobile */}
                    <div className="relative w-full h-48 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                    <img
                      src={product.image}
                      alt={product.name}
                        className="w-full h-full object-cover object-center"
                        loading="lazy"
                    />
                      
                      {/* Modern Discount Badge - Corner Style */}
                    {product.discount && (
                      <div className="absolute top-0 right-0 z-10">
                          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white font-bold text-[10px] px-3 py-1.5 shadow-lg rounded-tr-2xl rounded-bl-lg" style={{ 
                            WebkitFontSmoothing: 'antialiased',
                            MozOsxFontSmoothing: 'grayscale',
                            textRendering: 'optimizeLegibility'
                          }}>
                          {product.discount}
                        </div>
                      </div>
                    )}
                  </div>

                    {/* Product Info Section - Optimized for Horizontal Scroll */}
                    <div className="p-2 flex-1 flex flex-col justify-between">
                      {/* Product Name */}
                      <h3 className="font-inter font-medium text-sm lg:text-base text-gray-800 dark:text-gray-100 mb-1 truncate flex items-center gap-1.5" style={{
                        WebkitFontSmoothing: 'antialiased',
                        MozOsxFontSmoothing: 'grayscale',
                        textRendering: 'optimizeLegibility'
                      }}>
                        {/* Veg/Non-Veg icon */}
                        <span
                          className={`inline-flex items-center justify-center align-middle w-[0.95em] h-[0.95em] border-2 ${product.is_eggless ? 'border-green-600' : 'border-red-600'} rounded-[3px] flex-shrink-0`}
                          aria-label={product.is_eggless ? 'Eggless (Vegetarian)' : 'Contains Egg (Non‑Vegetarian)'}
                          title={product.is_eggless ? 'Eggless (Vegetarian)' : 'Contains Egg (Non‑Vegetarian)'}
                        >
                          <span className={`block rounded-full ${product.is_eggless ? 'bg-green-600' : 'bg-red-600'}`}
                            style={{ width: '0.5em', height: '0.5em' }} />
                        </span>
                        <span className="truncate">{product.name}</span>
                      </h3>

                      {/* Star Rating - Compact with Partial Fills */}
                      <div className="flex items-center mb-2">
                          <span className="font-poppins font-bold text-xs text-yellow-700 dark:text-yellow-500">
                            {parseFloat(product.rating ?? 0).toFixed(1)}
                          </span>
                          <div className="flex items-center ml-1">
                            {[...Array(5)].map((_, i) => {
                              const rating = parseFloat(product.rating ?? 0);
                              const fullStars = Math.floor(rating);
                              const decimalPart = rating % 1;
                              const isFullStar = i < fullStars;
                              const isPartialStar = i === fullStars && decimalPart > 0;
                              const fillPercentage = isPartialStar ? Math.round(decimalPart * 100) : 0;
                              
                              return (
                                <div key={i} className="relative inline-block w-2.5 h-2.5">
                                  {/* Empty star background */}
                                  <svg
                                    className="absolute top-0 left-0 w-2.5 h-2.5 text-gray-200 dark:text-gray-700 fill-current"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                  {/* Filled star (full or partial) */}
                                  {(isFullStar || isPartialStar) && (
                                    <svg
                                      className="absolute top-0 left-0 w-2.5 h-2.5 text-yellow-500 fill-current"
                                      viewBox="0 0 20 20"
                                      style={isPartialStar ? { clipPath: `inset(0 ${100 - fillPercentage}% 0 0)` } : {}}
                                    >
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <span className="font-inter text-[10px] text-yellow-600 dark:text-yellow-500 font-medium ml-1 flex items-center" style={{ lineHeight: '1.2', marginTop: '1px' }}>
                            ({product.reviews})
                          </span>
                        </div>
                        
                      {/* Price Section - Dynamic Pricing */}
                      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-poppins font-bold text-base text-gray-800 dark:text-gray-100">
                            {formatPrice(getCurrentPrice(product))}
                          </span>
                          {product.base_weight && (
                            <span className="font-inter text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                              / {product.base_weight}
                            </span>
                          )}
                          {getOriginalPrice(product) > 0 && (
                            <span className="font-inter text-[10px] text-gray-400 dark:text-gray-500 line-through ml-1">
                              {formatPrice(getOriginalPrice(product))}
                            </span>
                          )}
                        </div>
                        {/* Multiple Sizes Badge - Mobile (right side of price) */}
                        {hasMultipleWeights(product) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-700/50 shadow-sm">
                            <svg className="w-2.5 h-2.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                            <span className="font-poppins whitespace-nowrap">{getWeightCount(product)} sizes available</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Scroll Indicator Dots */}
            {products.length > 0 && (
              <div className="flex justify-center gap-2 mt-1 mb-2">
                {products.slice(0, 10).map((_, index) => (
                  <div
                    key={index}
                    className="w-1.5 h-1.5 rounded-full bg-[#6c3e27]/30 dark:bg-amber-600/40"
                  ></div>
                ))}
              </div>
            )}
          </div>

          {/* Desktop: Horizontal Scroll Layout */}
          <div className="hidden lg:block">
            <div 
              className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide"
              style={{
                scrollSnapType: 'x mandatory',
                WebkitOverflowScrolling: 'touch',
                scrollBehavior: 'smooth'
              }}
            >
            {products.slice(0, 10).map((product, index) => (
              <div 
                key={product.id} 
                className="group cursor-pointer flex-shrink-0"
                style={{ 
                  scrollSnapAlign: 'start',
                  width: '280px'
                }}
                onClick={() => handleProductClick(product)}
              >
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md dark:shadow-xl dark:shadow-black/20 border border-[#6c3e27]/30 dark:border-amber-700/50 overflow-hidden transition-all duration-300 hover:shadow-lg dark:hover:shadow-2xl dark:hover:shadow-black/30 relative">
                  {/* Product Image Container */}
                  <div className="relative w-full aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 z-10">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    
                    {/* Discount Badge - Corner Style */}
                    {product.discount && (
                      <div className="absolute top-0 right-0 z-20">
                        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-tr-2xl rounded-bl-lg text-sm px-3 py-1.5 shadow-lg" style={{ 
                          WebkitFontSmoothing: 'antialiased',
                          MozOsxFontSmoothing: 'grayscale',
                          textRendering: 'optimizeLegibility'
                        }}>
                          {product.discount}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Product Info Section */}
                  <div className="p-3 relative z-10 bg-white dark:bg-gray-800 flex flex-col">
                    {/* Product Name */}
                    <h3 className="font-inter font-medium text-xs lg:text-sm text-gray-800 dark:text-gray-100 mb-0.5 lg:mb-0.5 truncate flex items-center gap-1.5">
                      {/* Veg/Non-Veg icon */}
                      <span
                        className={`inline-flex items-center justify-center align-middle w-[0.95em] h-[0.95em] border-2 ${product.is_eggless ? 'border-green-600' : 'border-red-600'} rounded-[3px] flex-shrink-0`}
                        aria-label={product.is_eggless ? 'Eggless (Vegetarian)' : 'Contains Egg (Non‑Vegetarian)'}
                        title={product.is_eggless ? 'Eggless (Vegetarian)' : 'Contains Egg (Non‑Vegetarian)'}
                      >
                        <span className={`block rounded-full ${product.is_eggless ? 'bg-green-600' : 'bg-red-600'}`}
                          style={{ width: '0.5em', height: '0.5em' }} />
                      </span>
                      <span className="truncate">{product.name}</span>
                    </h3>

                    {/* Star Rating with Partial Fills */}
                    <div className="flex items-center mb-1 lg:mb-1">
                      <div className="flex items-center space-x-1">
                          <span className="font-poppins font-bold text-xs text-yellow-700 dark:text-yellow-500">
                            {parseFloat(product.rating ?? 0).toFixed(1)}
                          </span>
                          <div className="flex items-center ml-1">
                            {[...Array(5)].map((_, i) => {
                              const rating = parseFloat(product.rating ?? 0);
                              const fullStars = Math.floor(rating);
                              const decimalPart = rating % 1;
                              const isFullStar = i < fullStars;
                              const isPartialStar = i === fullStars && decimalPart > 0;
                              const fillPercentage = isPartialStar ? Math.round(decimalPart * 100) : 0;
                              
                              return (
                                <div key={i} className="relative inline-block w-2.5 h-2.5">
                                  {/* Empty star background */}
                                  <svg
                                    className="absolute top-0 left-0 w-2.5 h-2.5 text-gray-200 dark:text-gray-700 fill-current"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                  {/* Filled star (full or partial) */}
                                  {(isFullStar || isPartialStar) && (
                                    <svg
                                      className="absolute top-0 left-0 w-2.5 h-2.5 text-yellow-500 fill-current"
                                      viewBox="0 0 20 20"
                                      style={isPartialStar ? { clipPath: `inset(0 ${100 - fillPercentage}% 0 0)` } : {}}
                                    >
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <span className="font-inter text-[10px] text-yellow-600 dark:text-yellow-500 font-medium ml-1 flex items-center" style={{ lineHeight: '1.2', marginTop: '1px' }}>
                            ({product.reviews})
                          </span>
                        </div>
                      </div>

                    {/* Price Section */}
                    <div className="flex items-baseline justify-between mb-1 lg:mt-2 lg:mb-1">
                      <div className="flex items-baseline gap-1 lg:gap-1.5">
                        <span className="font-poppins font-bold text-base text-gray-800 dark:text-gray-100">
                          {formatPrice(getCurrentPrice(product))}
                        </span>
                        {product.base_weight && (
                          <span className="font-inter text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                            / {product.base_weight}
                          </span>
                        )}
                      {getOriginalPrice(product) > 0 && (
                        <span className="font-inter text-[10px] text-gray-400 dark:text-gray-500 line-through">
                          {formatPrice(getOriginalPrice(product))}
                        </span>
                      )}
                            </div>
                    {/* Multiple Sizes Badge - Desktop */}
                    {hasMultipleWeights(product) && (
                        <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-700/50 shadow-sm transition-all hover:shadow-md hover:scale-105">
                          <svg className="w-2.5 h-2.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                              </svg>
                          <span className="font-poppins whitespace-nowrap">{getWeightCount(product)} Sizes</span>
                        </span>
                      )}
                      </div>
                   </div>
                </div>
              </div>
            ))}
            </div>
          </div>

          {/* View All Products Button */}
          {products.length > 0 && (
            <div className="text-center mt-6 lg:mt-4">
              <button
                onClick={() => router.push('/products')}
                className="inline-flex items-center gap-2 px-6 py-2.5 border border-[#6c3e27] dark:border-amber-400 text-[#6c3e27] dark:text-amber-400 rounded-lg font-inter text-sm font-medium hover:bg-[#6c3e27] hover:text-white dark:hover:bg-amber-400 dark:hover:text-gray-900 transition-colors duration-300"
              >
                View All Products
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Custom Styles for Scrollbar and Animations */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
          opacity: 0;
        }
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
    </section>
  )
}
