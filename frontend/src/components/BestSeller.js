'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const BestSeller = () => {
  const router = useRouter()
  const [activeCategory, setActiveCategory] = useState('Cakes')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const scrollContainerRef = useRef(null)

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
    
    return weights;
  };

  // Check if product has multiple weight options
  const hasMultipleWeights = (product) => {
    if (!product) return false;
    const availableWeights = getAvailableWeights(product);
    return availableWeights.length > 1;
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
  }

  // Fetch bestsellers from API
  useEffect(() => {
    const fetchBestsellers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${API_BASE_URL}/products/bestsellers?limit=50`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.data && data.data.products) {
          // Transform API response to match component format
          const transformedProducts = data.data.products.map(product => ({
            id: product.id,
            name: product.name,
            category: product.category_name === 'Flowers' ? 'Flowers' : 'Cakes', // Default to Cakes if not Flowers
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
            // Include variants and base weight for badge display
            variants: product.variants || [],
            base_weight: product.base_weight || null,
            is_eggless: product.is_eggless === 1 || product.is_eggless === true || product.is_eggless === '1'
          }));
          
          // Sort by ID in ascending order
          transformedProducts.sort((a, b) => a.id - b.id);
          setProducts(transformedProducts);
        } else {
          setError('No bestsellers found');
          setProducts([]);
        }
      } catch (err) {
        console.error('Error fetching bestsellers:', err);
        setError('Failed to load bestsellers');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBestsellers();
  }, []);

  // Handle product click navigation
  const handleProductClick = (product) => {
    if (product.slug) {
      router.push(`/product/${product.slug}`);
    }
  };

  // Scroll functions
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -300,
        behavior: 'smooth'
      })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 300,
        behavior: 'smooth'
      })
    }
  }

  // Filter products by active category
  const filteredProducts = products.filter(product => product.category === activeCategory)

  // Loading state
  if (loading) {
    return (
      <section className="relative bg-gradient-to-br from-white via-pink-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 lg:py-12 pb-12 lg:pb-16 overflow-hidden">
        <div className="relative w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h2 className="font-poppins text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">Bestsellers</h2>
              <div className="flex items-center space-x-3">
                {['Cakes', 'Flowers'].map((category) => (
                  <div key={category} className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-md h-10 w-24"></div>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex space-x-4 min-w-max">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex-shrink-0 w-48 animate-pulse">
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-xl h-48 mb-2"></div>
                    <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 mb-2"></div>
                    <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 w-3/4"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Error state - return null to avoid breaking the page
  if (error && products.length === 0) {
    return null;
  }

  return (
    <section className="bg-gradient-to-b from-white to-pink-50 dark:from-gray-900 dark:to-gray-800 pt-12 pb-8 lg:pt-12 lg:pb-12">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Section Header - Unique Design for Bestsellers */}
          <div className="mb-6 lg:mb-8">
            {/* Mobile Layout */}
             <div className="lg:hidden">
              {/* Header and Buttons in Same Row - Title Left, Buttons Right */}
              <div className="flex items-center justify-between mb-1.5">
                {/* Left Side - Header with Badge and Title */}
                <div className="flex items-center space-x-2">
                  <div className="flex flex-col">
                    <div className="flex items-center space-x-1.5 mb-0.5">
                      <svg className="w-4 h-4 text-yellow-500 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-[10px] font-semibold text-yellow-600 dark:text-yellow-400 uppercase tracking-widest">CREAMINGO PICKS</span>
                    </div>
                    <h2 className="font-poppins text-[22px] font-bold leading-tight">
                      <span className="text-purple-700 dark:text-purple-400">Best</span>
                      <span className="text-pink-600 dark:text-pink-400"> Sellers</span>
                 </h2>
                  </div>
                </div>
               
                {/* Right Side - Category Tabs */}
                <div className="flex items-center space-x-2">
                   {['Cakes', 'Flowers'].map((category) => (
                                               <button
                      key={category}
                          onClick={() => setActiveCategory(category)}
                      className={`px-5 py-2.5 rounded-none font-inter text-base font-medium transition-all duration-300 border min-w-[90px] ${
                            activeCategory === category
                          ? 'bg-[#6c3e27] dark:bg-amber-700 text-white border-[#6c3e27] dark:border-amber-700 shadow-sm'
                          : 'bg-white dark:bg-gray-800 text-[#6c3e27] dark:text-amber-400 border-[#6c3e27]/20 dark:border-amber-700/30 hover:border-[#6c3e27]/40 dark:hover:border-amber-500/50 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                          }`}
                        >
                         {category}
                       </button>
                   ))}
                 </div>
             </div>
             
              {/* Container for Line and Arrow - Aligned with Buttons */}
              <div className="flex flex-col items-end pr-2">
                {/* Separator Line - Between Buttons and Arrow */}
                <div className="mb-1.5 w-[200px]">
                  <div className="h-px bg-[#6c3e27]/20 dark:bg-amber-700/30 w-full"></div>
                </div>
                
                {/* Downward Arrow - Centered Below Buttons */}
                <div className="flex items-center justify-center w-[200px]">
                  <svg className="w-5 h-5 text-[#6c3e27] dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Desktop Layout */}
            <div className="hidden lg:block">
              {/* Top Row - Header, Category Tabs, and VIEW ALL Button */}
              <div className="flex items-center justify-between mb-1.5">
                {/* Left Side - Header with Badge and Title */}
                                       <div className="flex items-center space-x-4">
                  <div className="flex flex-col">
                    <div className="flex items-center space-x-2 mb-1">
                      <svg className="w-5 h-5 text-yellow-500 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400 uppercase tracking-widest">CREAMINGO PICKS</span>
                    </div>
                    <h2 className="font-poppins text-2xl lg:text-3xl font-bold leading-tight">
                      <span className="text-purple-700 dark:text-purple-400">Best</span>
                      <span className="text-pink-600 dark:text-pink-400"> Sellers</span>
                      </h2>
                  </div>
                </div>
                      
                {/* Center - Category Tabs */}
                <div className="flex items-center space-x-3">
                      {['Cakes', 'Flowers'].map((category) => (
                                                                                 <button
                      key={category}
                             onClick={() => setActiveCategory(category)}
                      className={`px-8 py-2.5 rounded-none font-inter text-base font-medium transition-all duration-300 border min-w-[120px] ${
                               activeCategory === category
                          ? 'bg-[#6c3e27] dark:bg-amber-700 text-white border-[#6c3e27] dark:border-amber-700 shadow-sm'
                          : 'bg-white dark:bg-gray-800 text-[#6c3e27] dark:text-amber-400 border-[#6c3e27]/20 dark:border-amber-700/30 hover:border-[#6c3e27]/40 dark:hover:border-amber-500/50 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                             }`}
                           >
                             {category}
                           </button>
                     ))}
                   </div>
                  
                                                                                                       {/* Right Side - VIEW ALL Button */}
                   <div>
                     <button 
                       onClick={() => router.push('/products?filter=bestsellers')}
                    className="px-5 py-2.5 bg-white dark:bg-gray-800 text-[#6c3e27] dark:text-amber-400 font-inter text-sm font-medium rounded-lg border border-[#6c3e27]/20 dark:border-amber-700/30 shadow-sm hover:shadow-md hover:shadow-[#6c3e27]/10 dark:hover:shadow-amber-500/20 hover:border-[#6c3e27]/40 dark:hover:border-amber-500/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
                     >
                       VIEW ALL
                     </button>
                   </div>
                </div>
               
              {/* Separator Line - Centered */}
              <div className="flex items-center justify-center mb-1.5">
                <div className="h-px bg-[#6c3e27]/20 dark:bg-amber-700/30 w-full"></div>
              </div>
              
              {/* Downward Arrow - Centered */}
              <div className="flex items-center justify-center mb-0">
                <svg className="w-5 h-5 text-[#6c3e27] dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
                </div>
           </div>

                                           {/* Product Cards - 1×10 Horizontal Grid with Navigation */}
          <div className="relative mt-1 lg:-mt-4">
             {/* Navigation Arrows - Desktop Only */}
             <button 
               onClick={scrollLeft}
               className="hidden lg:flex absolute left-0 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow-lg dark:shadow-xl dark:shadow-black/20 items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300 border border-gray-200 dark:border-gray-700"
             >
               <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
               </svg>
             </button>
             
             <button 
               onClick={scrollRight}
               className="hidden lg:flex absolute right-0 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow-lg dark:shadow-xl dark:shadow-black/20 items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300 border border-gray-200 dark:border-gray-700"
             >
               <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
               </svg>
             </button>

                                                   {/* Horizontal Scrollable Container */}
                             <div 
                               ref={scrollContainerRef} 
                               className="overflow-x-auto scrollbar-hide"
                               style={{ 
                                 scrollSnapType: 'x mandatory',
                                 WebkitOverflowScrolling: 'touch',
                                 scrollBehavior: 'smooth'
                               }}
                             >
                 <div className="flex gap-4 lg:gap-6 min-w-max pb-4 lg:pb-6">
                 {filteredProducts.length > 0 ? filteredProducts.map((product, index) => (
                   <div 
                     key={product.id} 
                     className="group cursor-pointer flex-shrink-0"
                     style={{ 
                       scrollSnapAlign: 'start',
                       width: '280px'
                     }}
                     onClick={() => handleProductClick(product)}
                   >
                     <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md dark:shadow-xl dark:shadow-black/20 border border-[#6c3e27]/30 dark:border-amber-700/50 overflow-hidden transition-all duration-300 hover:shadow-lg dark:hover:shadow-2xl dark:hover:shadow-black/30 relative lg:shadow-md">
                       {/* Product Image Container */}
                       <div className="relative w-full lg:aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 z-10 h-48 lg:h-auto">
                         <img
                           src={product.image}
                           alt={product.name}
                           className="w-full h-full object-cover object-center transition-transform duration-300 lg:group-hover:scale-105"
                           loading="lazy"
                         />
                         
                         {/* Discount Badge - Corner Style */}
                         {product.discount && (
                           <div className="absolute top-0 right-0 z-20">
                             <div className="bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-tr-2xl rounded-bl-lg text-[10px] lg:text-sm px-3 py-1.5 shadow-lg" style={{ 
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
                       <div className="p-2 lg:p-3 relative z-10 bg-white dark:bg-gray-800 flex flex-col">
                         {/* Product Name */}
                         <h3 className="font-inter font-medium text-xs lg:text-sm text-gray-800 dark:text-gray-100 mb-0.5 lg:mb-0.5 truncate flex items-center gap-1.5" style={{
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
                         <div className="flex items-center justify-between flex-wrap gap-2 mb-2 lg:flex lg:items-baseline lg:justify-between lg:mt-2 lg:mb-1">
                           <div className="flex items-baseline gap-1 lg:gap-1.5">
                             <span className="font-poppins font-bold text-base text-gray-800 dark:text-gray-100">
                               {formatPrice(getCurrentPrice(product))}
                             </span>
                             {product.base_weight && (
                               <span className="font-inter text-[10px] lg:text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                                 / {product.base_weight}
                               </span>
                             )}
                             {getOriginalPrice(product) > 0 && (
                               <span className="font-inter text-[10px] text-gray-400 dark:text-gray-500 line-through ml-1 lg:ml-0">
                                 {formatPrice(getOriginalPrice(product))}
                               </span>
                             )}
                           </div>
                           {/* Multiple Sizes Badge - Mobile (right side of price) */}
                           {hasMultipleWeights(product) && (
                             <span className="lg:hidden inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-700/50 shadow-sm">
                               <svg className="w-2.5 h-2.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                 <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                               </svg>
                               <span className="font-poppins whitespace-nowrap">{getWeightCount(product)} sizes available</span>
                             </span>
                           )}
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
                 )) : (
                   <div className="flex-shrink-0 w-[280px] flex items-center justify-center">
                     <p className="text-gray-500 dark:text-gray-400 text-sm">No {activeCategory.toLowerCase()} found</p>
                   </div>
                 )}
                 
                                   {/* View All Card - Mobile Only */}
                 <div className="lg:hidden flex-shrink-0" style={{ width: '143px', scrollSnapAlign: 'start' }}>
                   <div 
                     onClick={() => router.push('/products?filter=bestsellers')}
                     className="bg-gradient-to-br from-pink-50 via-pink-50/80 to-amber-50/50 dark:from-gray-800 dark:via-gray-800/90 dark:to-amber-900/20 rounded-2xl shadow-md dark:shadow-xl dark:shadow-black/20 border border-[#6c3e27]/30 dark:border-amber-700/50 overflow-hidden h-full flex flex-col justify-center items-center p-4 cursor-pointer transition-all duration-300 hover:shadow-lg dark:hover:shadow-2xl dark:hover:shadow-black/30 group"
                   >
                      <div className="text-center">
                       <div className="mb-3">
                         <svg className="w-8 h-8 text-[#6c3e27] dark:text-amber-400 mx-auto group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                       </div>
                       <h3 className="font-inter font-semibold text-sm text-gray-800 dark:text-gray-100 mb-1">
                         View All
                       </h3>
                       <p className="font-inter text-xs text-gray-600 dark:text-gray-400">
                         {activeCategory === 'Cakes' ? 'Bestseller Cakes' : 'Bestseller Flowers'}
                       </p>
                      </div>
                    </div>
                  </div>
               </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default BestSeller
