'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Head from 'next/head';
import { ChevronDown, Filter, Loader2, AlertCircle, Grid3X3, X, SlidersHorizontal, Sparkles, TrendingUp, Clock, DollarSign, Star, Check, ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ListingProductCard from './ListingProductCard';
import Header from './Header';
import MobileFooter from './MobileFooter';
import Footer from './Footer';
import LocationBar from './LocationBar';
import categoryApi from '../api/categoryApi';
import productApi from '../api/productApi';
import { useCategoryMenu } from '../contexts/CategoryMenuContext';
import { useWishlist } from '../contexts/WishlistContext';
import { formatPrice } from '../utils/priceFormatter';

const ListingPage = () => {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryData, setCategoryData] = useState(null);
  const [subcategoryData, setSubcategoryData] = useState(null);
  const [allSubcategories, setAllSubcategories] = useState([]);
  const [products, setProducts] = useState([]);
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [sortBy, setSortBy] = useState('popularity');
  const [showFilters, setShowFilters] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [minRating, setMinRating] = useState(0);
  const [isLocationBarSticky, setIsLocationBarSticky] = useState(true);
  const [activeSlider, setActiveSlider] = useState(null); // 'min' or 'max' or null
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [focusedSubcategoryIndex, setFocusedSubcategoryIndex] = useState(null);
  const locationBarRef = useRef(null);
  const filterBarRef = useRef(null);
  const subcategoryButtonsRef = useRef([]);
  
  // Calculate max price from products and round up to ensure slider can reach it
  const rawMaxPrice = products.length > 0 
    ? Math.max(...products.map(p => p.discountedPrice || p.originalPrice || 0))
    : 10000;
  
  // Round up to nearest step increment to ensure slider can reach the max value
  const stepSize = Math.max(1, Math.ceil(rawMaxPrice / 200));
  const maxPrice = Math.ceil(rawMaxPrice / stepSize) * stepSize;
  const sortDropdownRef = useRef(null);
  const bottomSheetRef = useRef(null);

  // Use CategoryMenu context
  const { toggleCategoryMenu, isCategoryMenuOpen } = useCategoryMenu();

  // Extract route parameters
  const categorySlug = params?.categorySlug;
  const subCategorySlug = params?.subCategorySlug;
  const isSubcategory = Boolean(subCategorySlug);

  // Helper function to get category display name from slug
  const getCategoryDisplayName = (slug) => {
    const slugToNameMap = {
      'cakes-by-flavor': 'Pick a Cake by Flavor',
      'cakes-for-occasion': 'Cakes for Any Occasion',
      'kids-cake-collection': 'Kid\'s Cake Collection',
      'crowd-favorite-cakes': 'Crowd-Favorite Cakes',
      'love-relationship-cakes': 'Love and Relationship Cakes',
      'milestone-year-cakes': 'Cakes for Every Milestone Year',
      'small-treats-desserts': 'Small Treats & Desserts',
      'flowers': 'Flowers',
      'sweets-dry-fruits': 'Sweets and Dry Fruits'
    };
    return slugToNameMap[slug] || slug;
  };

  // API functions with fallback to mock data
  const fetchCategoryData = async (slug) => {
    try {
      const response = await categoryApi.getCategoryBySlug(slug);
      // Check if response is valid
      if (response && response.success && response.data) {
        return response;
      }
      throw new Error('Invalid API response');
    } catch (error) {
      console.error('Failed to fetch category data:', error);
      throw error; // Don't fall back to mock data, let the error propagate
    }
  };

  const fetchSubcategoryData = async (categorySlug, subCategorySlug) => {
    try {
      console.log('Fetching subcategory data for:', categorySlug, subCategorySlug);
      const response = await categoryApi.getSubcategoryBySlug(categorySlug, subCategorySlug);
      console.log('Subcategory API response:', response);
      
      if (response.success && response.data && response.data.subcategory) {
        const subcategory = response.data.subcategory;
        return {
          id: subcategory.id,
          name: subcategory.name,
          slug: subcategory.name.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and'),
          description: subcategory.description,
          metaTitle: `${subcategory.name} | Creamingo`,
          metaDescription: subcategory.description,
          image: subcategory.image_url,
          productCount: Math.floor(Math.random() * 10) + 2 // Random count for now, should come from API
        };
      }
      throw new Error('Invalid API response format');
    } catch (error) {
      console.error('Failed to fetch subcategory data:', error);
      throw error; // Don't fall back to mock data, let the error propagate
    }
  };

  const fetchAllSubcategories = async (categorySlug) => {
    try {
      console.log('Fetching subcategories for category:', categorySlug);
      const response = await categoryApi.getSubcategories(categorySlug);
      console.log('API response:', response);
      
      // Transform the API response to match our expected format
      if (response && response.success && response.data && response.data.subcategories && response.data.subcategories.length > 0) {
        const transformedData = response.data.subcategories.map(subcategory => ({
          id: subcategory.id,
          name: subcategory.name,
          slug: subcategory.name.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and'),
          image: subcategory.image_url,
          productCount: subcategory.product_count || subcategory.products_count || subcategory.productCount || 0 // Use API count if available
        }));
        console.log('Transformed subcategories data:', transformedData);
        return transformedData;
      }
      throw new Error('Invalid API response format or empty subcategories');
    } catch (error) {
      console.error('Failed to fetch subcategories data:', error);
      throw error; // Don't fall back to mock data, let the error propagate
    }
  };

  const fetchProducts = async (categorySlug, subCategorySlug = null) => {
    try {
      // Use the new productApi for fetching products
      const response = await productApi.getProductsByCategory(categorySlug, subCategorySlug, {
        sortBy,
        limit: 50
      });
      
      // Handle the API response structure: { success: true, data: { products: [...], pagination: {...} } }
      let products = [];
      if (response.success && response.data && response.data.products) {
        products = response.data.products;
      } else if (response.products) {
        products = response.products;
      } else {
        products = response;
      }
      
      // Transform API response to match frontend expected format
      return products.map(product => ({
        id: product.id,
        name: product.name,
        slug: product.slug, // Include the slug field
        image: product.image_url || product.image,
        originalPrice: product.base_price || product.originalPrice,
        discountedPrice: product.discounted_price || product.discountedPrice,
        rating: product.rating || 4.5, // Default rating if not provided
        reviews: product.reviews || Math.floor(Math.random() * 100) + 10,
        category: product.category_name || product.category,
        subcategory: product.subcategory_name || product.subcategory,
        subcategory_id: product.subcategory_id || product.subcategoryId, // Preserve subcategory ID for matching
        isTopProduct: product.is_top_product === 1 || product.isTopProduct,
        discount: product.discount || Math.round(((product.base_price - product.discounted_price) / product.base_price) * 100)
      }));
    } catch (error) {
      console.error('Failed to fetch products data:', error);
      throw error; // Don't fall back to mock data, let the error propagate
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch category data
        const category = await fetchCategoryData(categorySlug);
        if (!category) {
          setError('Category not found');
          return;
        }
        setCategoryData(category);

        // Fetch subcategory data if applicable
        if (isSubcategory) {
          const subcategory = await fetchSubcategoryData(categorySlug, subCategorySlug);
          if (!subcategory) {
            setError('Subcategory not found');
            return;
          }
          setSubcategoryData(subcategory);
        }

        // Fetch all subcategories for the category (for navigation)
        const subcategoriesList = await fetchAllSubcategories(categorySlug);
        
        // Fetch ALL products for the category (without subcategory filter) to calculate accurate counts
        const allProductsForCategory = await fetchProducts(categorySlug, null);
        
        // Calculate product counts for each subcategory from all products
        const subcategoriesWithCounts = subcategoriesList.map(subcategory => {
          // Count products that belong to this subcategory
          // Match by ID first (most reliable), then by name/slug
          const count = allProductsForCategory.filter(product => {
            // Match by subcategory ID if available
            if (product.subcategory_id && subcategory.id && product.subcategory_id === subcategory.id) {
              return true;
            }
            
            // Match by subcategory name/slug
            const productSubcategory = (product.subcategory || product.subcategory_name || '').toString().trim();
            if (!productSubcategory) return false;
            
            // Normalize both for comparison
            const productSubcategoryNormalized = productSubcategory.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and');
            const subcategoryNameNormalized = subcategory.name.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and');
            
            // Match by normalized name or slug
            return productSubcategoryNormalized === subcategory.slug || 
                   productSubcategoryNormalized === subcategoryNameNormalized ||
                   productSubcategory.toLowerCase() === subcategory.name.toLowerCase();
          }).length;
          
          // Always use calculated count
          return {
            ...subcategory,
            productCount: count
          };
        });
        
        setAllSubcategories(subcategoriesWithCounts);

        // Fetch products for current view (with subcategory filter if applicable)
        const productList = await fetchProducts(categorySlug, subCategorySlug);
        setProducts(productList);


      } catch (err) {
        setError('Failed to load data');
        console.error('Error loading listing data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (categorySlug) {
      loadData();
    }
  }, [categorySlug, subCategorySlug, isSubcategory]);

  // Utility functions - use global formatter
  // formatPrice is imported from utils

  const sortProducts = (products, sortBy) => {
    switch (sortBy) {
      case 'price-low':
        return [...products].sort((a, b) => a.discountedPrice - b.discountedPrice);
      case 'price-high':
        return [...products].sort((a, b) => b.discountedPrice - a.discountedPrice);
      case 'rating':
        return [...products].sort((a, b) => b.rating - a.rating);
      case 'newest':
        return [...products].sort((a, b) => b.id - a.id);
      default:
        return products;
    }
  };

  const handleSubcategoryNavigation = useCallback((subcategorySlug) => {
    const url = `/category/${categorySlug}/${subcategorySlug}`;
    console.log('Navigating to subcategory:', url, 'from category:', categorySlug, 'subcategory:', subcategorySlug);
    console.log('Current window width:', window.innerWidth);
    router.push(url);
  }, [categorySlug, router]);

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    setShowSortDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
        setShowSortDropdown(false);
      }
      if (bottomSheetRef.current && !bottomSheetRef.current.contains(event.target) && showBottomSheet) {
        // Don't close if clicking the backdrop
        if (event.target.classList.contains('bottom-sheet-backdrop')) {
          setShowBottomSheet(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showBottomSheet]);

  // Prevent body scroll when bottom sheet is open
  useEffect(() => {
    if (showBottomSheet) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showBottomSheet]);

  // Update price range when products load
  useEffect(() => {
    if (products.length > 0) {
      const rawMaxPrice = Math.max(...products.map(p => p.discountedPrice || p.originalPrice || 0));
      if (rawMaxPrice > 0 && priceRange[1] === 10000) {
        // Use the same calculation as maxPrice to ensure sync
        const stepSize = Math.max(1, Math.ceil(rawMaxPrice / 200));
        const calculatedMaxPrice = Math.ceil(rawMaxPrice / stepSize) * stepSize;
        setPriceRange([0, calculatedMaxPrice]);
      }
    }
  }, [products]);

  // Ensure priceRange[1] never exceeds maxPrice
  useEffect(() => {
    if (priceRange[1] > maxPrice) {
      setPriceRange([priceRange[0], maxPrice]);
    }
  }, [maxPrice]);

  // Handle scroll to detect when filter bar approaches location bar
  useEffect(() => {
    if (typeof window === 'undefined' || loading) return;

    const handleScroll = () => {
      if (!locationBarRef.current || !filterBarRef.current) return;

      const scrollY = window.scrollY;
      const headerHeight = 64; // Header is typically 4rem = 64px
      
      // Get location bar's current position
      const locationBarRect = locationBarRef.current.getBoundingClientRect();
      const locationBarBottom = locationBarRect.bottom;
      
      // Get filter bar's current position
      const filterBarRect = filterBarRef.current.getBoundingClientRect();
      const filterBarTop = filterBarRect.top;
      
      // Calculate the gap between location bar bottom and filter bar top
      // When this gap is zero or negative, filter bar is touching/overlapping location bar
      const gap = filterBarTop - locationBarBottom;
      
      // Only make location bar scrollable when filter bar actually touches it (gap <= 0)
      // This creates the "pushing" effect at the exact moment of contact
      if (gap <= 0 && scrollY > 30) {
        // Filter bar is touching location bar, make location bar scrollable
        setIsLocationBarSticky(false);
      } else if (scrollY <= 20 || gap > 10) {
        // Reset to sticky when scrolled back to top or filter bar is not touching
        setIsLocationBarSticky(true);
      }
    };

    // Throttle scroll events for smooth performance
    let ticking = false;
    const throttledHandleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledHandleScroll, { passive: true });
    
    // Initialize after DOM is ready
    const initialize = () => {
      if (locationBarRef.current && filterBarRef.current) {
        handleScroll(); // Initial check
      } else {
        setTimeout(initialize, 50);
      }
    };
    
    setTimeout(initialize, 300);

    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
    };
  }, [products, allSubcategories, loading]); // Re-run when content changes or loads

  // Get current page data
  const currentData = isSubcategory ? subcategoryData : categoryData?.data?.category;
  
  // Generate SEO-optimized titles and descriptions
  let pageTitle, pageDescription;
  
  if (isSubcategory && categorySlug === 'crowd-favorite-cakes') {
    // Special SEO titles for crowd-favorite subcategories
    pageTitle = `Buy ${currentData?.name || 'Crowd-Favorite Cakes'} – Crowd-Favorite Cakes | Creamingo`;
    pageDescription = `Explore our premium ${currentData?.name || 'Crowd-Favorite Cakes'} selection — crafted fresh for every celebration.`;
  } else if (isSubcategory && categorySlug === 'love-relationship-cakes') {
    // Special SEO titles for love-relationship subcategories
    pageTitle = `Buy ${currentData?.name || 'Love and Relationship Cakes'} Cakes – Love and Relationship | Creamingo`;
    pageDescription = `Discover our ${currentData?.name || 'Love and Relationship Cakes'} cakes, freshly crafted for your loved ones.`;
  } else if (isSubcategory && categorySlug === 'milestone-year-cakes') {
    // Special SEO titles for milestone-year subcategories
    pageTitle = `Buy ${currentData?.name || 'Milestone Cakes'} Cakes – Milestone Cakes | Creamingo`;
    pageDescription = `Celebrate every milestone with our ${currentData?.name || 'Milestone Cakes'} cakes, freshly baked for your special day.`;
  } else if (isSubcategory && categorySlug === 'flowers') {
    // Special SEO titles for flowers subcategories
    pageTitle = `Buy ${currentData?.name || 'Flowers'} Flowers Online | Creamingo`;
    pageDescription = `Explore our ${currentData?.name || 'Flowers'} flowers — fresh, vibrant, and perfect for every occasion.`;
  } else if (isSubcategory && categorySlug === 'sweets-dry-fruits') {
    // Special SEO titles for sweets and dry fruits subcategories
    pageTitle = `Buy ${currentData?.name || 'Sweets and Dry Fruits'} Online | Creamingo`;
    pageDescription = `Explore our ${currentData?.name || 'Sweets and Dry Fruits'} selection — fresh, delightful, and perfect for every occasion.`;
  } else if (isSubcategory && categorySlug === 'small-treats-desserts') {
    // Special SEO titles for small treats desserts subcategories
    pageTitle = `Buy ${currentData?.name || 'Small Treats'} Desserts Online | Creamingo`;
    pageDescription = `Explore our ${currentData?.name || 'Small Treats'} desserts — fresh, sweet, and perfect for every celebration.`;
  } else {
    // Default SEO titles for other categories
    pageTitle = currentData?.metaTitle || `${currentData?.name || 'Products'} | Creamingo`;
    pageDescription = currentData?.metaDescription || currentData?.description || '';
  }

  // Skeleton Loader Component with shimmer effect
  const ProductCardSkeleton = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="w-full aspect-square bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/10 animate-shimmer"></div>
      </div>
      <div className="p-1.5 space-y-1.5">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/10 animate-shimmer"></div>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/10 animate-shimmer"></div>
        </div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/10 animate-shimmer"></div>
        </div>
        </div>
      </div>
    );

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] pt-16 pb-8">
          <div className="text-center px-4 max-w-md">
            <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg dark:shadow-black/20">
              <AlertCircle className="w-10 h-10 text-red-500 dark:text-red-400" />
            </div>
            <h2 className="text-xl lg:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2 font-poppins">Oops! Something went wrong</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6 font-inter text-sm lg:text-base">{error}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-inter text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Try Again
              </button>
            <button
              onClick={() => router.back()}
                className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-inter text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Go Back
            </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Filter products by price range and rating
  const filteredProducts = products.filter(product => {
    const price = product.discountedPrice || product.originalPrice;
    const rating = product.rating || 0;
    return price >= priceRange[0] && price <= priceRange[1] && rating >= minRating;
  });

  const sortedProducts = sortProducts(filteredProducts, sortBy);

  // Quick filter options
  const quickFilters = [
    { id: 'popularity', label: 'Popular', icon: TrendingUp },
    { id: 'newest', label: 'New', icon: Clock },
    { id: 'price-low', label: 'Price', icon: DollarSign },
    { id: 'rating', label: 'Top Rated', icon: Star },
  ];

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Website Header */}
        <Header />
        <div ref={locationBarRef}>
          <LocationBar isSticky={isLocationBarSticky} />
        </div>

        {/* Subcategory Navigation Section - Only show for mobile subcategory pages */}
        {allSubcategories.length > 0 && (
          <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-purple-200 dark:border-purple-800 relative">
            <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-3">
              <div className="mb-2">
                <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 font-poppins">
                  Explore {categoryData?.data?.category?.name} Categories
                </h2>
                <p className="text-xs text-gray-600 dark:text-gray-300 font-inter mt-0.5">
                  Choose from our wide variety
                </p>
              </div>
              
              {/* Scroll Indicators */}
              <div className="relative">
                {/* Left fade gradient - only show when scrolled */}
                <div 
                  id="left-scroll-indicator"
                  className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white dark:from-gray-800 to-transparent z-10 pointer-events-none opacity-0 transition-opacity duration-300"
                ></div>
                {/* Right fade gradient */}
                <div 
                  id="right-scroll-indicator"
                  className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white dark:from-gray-800 to-transparent z-10 pointer-events-none opacity-100 transition-opacity duration-300"
                ></div>
              
              {/* Subcategory Horizontal Scroll - Mobile Only */}
                <div 
                  id="subcategory-scroll-container"
                  className="flex space-x-2 overflow-x-auto pb-1 scrollbar-hide relative"
                  style={{
                    scrollSnapType: 'x mandatory',
                    WebkitOverflowScrolling: 'touch',
                    scrollBehavior: 'smooth'
                  }}
                  onScroll={(e) => {
                    const container = e.target;
                    const leftIndicator = document.getElementById('left-scroll-indicator');
                    const rightIndicator = document.getElementById('right-scroll-indicator');
                    
                    // Show left indicator only if scrolled
                    if (leftIndicator) {
                      leftIndicator.style.opacity = container.scrollLeft > 10 ? '1' : '0';
                    }
                    
                    // Hide right indicator if scrolled to end
                    if (rightIndicator) {
                      const isAtEnd = container.scrollWidth - container.scrollLeft <= container.clientWidth + 10;
                      rightIndicator.style.opacity = isAtEnd ? '0' : '1';
                    }
                  }}
                >
                {allSubcategories.map((subcategory, index) => (
                  <button
                    key={subcategory.id}
                      ref={(el) => (subcategoryButtonsRef.current[index] = el)}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSubcategoryNavigation(subcategory.slug);
                        setFocusedSubcategoryIndex(index);
                      }}
                      onFocus={() => setFocusedSubcategoryIndex(index)}
                      onBlur={() => {
                        setTimeout(() => {
                          if (!subcategoryButtonsRef.current.some(btn => btn === document.activeElement)) {
                            setFocusedSubcategoryIndex(null);
                          }
                        }, 100);
                      }}
                      aria-label={`View ${subcategory.name} subcategory`}
                      aria-pressed={subCategorySlug === subcategory.slug}
                      tabIndex={0}
                      className={`group flex flex-col items-center p-1.5 rounded-xl border-2 transition-all duration-300 hover:shadow-md active:scale-95 active:shadow-sm flex-shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 ${
                      subCategorySlug === subcategory.slug
                          ? 'border-pink-500 dark:border-pink-400 bg-purple-50 dark:bg-purple-900/30'
                          : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                      style={{ scrollSnapAlign: 'start' }}
                  >
                    {/* Subcategory Image */}
                    <div className="w-12 h-12 mb-1 relative">
                      <div className="w-full h-full rounded-full overflow-hidden bg-gray-100">
                      <img
                        src={subcategory.image}
                        alt={subcategory.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        loading="lazy"
                      />
                      </div>
                      {subCategorySlug === subcategory.slug && (
                        <div className="absolute bottom-0 right-0 w-5 h-5 bg-pink-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center shadow-sm z-10">
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    
                    {/* Subcategory Name and Count */}
                    <span className={`text-[9px] sm:text-[10px] font-inter font-medium text-center leading-tight whitespace-nowrap ${
                      subCategorySlug === subcategory.slug
                        ? 'text-pink-500 dark:text-pink-400'
                        : 'text-black dark:text-gray-300'
                    }`}>
                      {subcategory.name}
                    </span>
                  </button>
                ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sticky Filter Bar - Mobile Only */}
        <div ref={filterBarRef} className="lg:hidden sticky top-16 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300">
          <div className="px-3 py-1.5">
            <div className="flex items-center justify-between gap-2">
              {/* Quick Filter Chips */}
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-1">
                {quickFilters.map((filter) => {
                  const Icon = filter.icon;
                  const isActive = sortBy === filter.id;
                  return (
                    <button
                      key={filter.id}
                      onClick={() => handleSortChange(filter.id)}
                      aria-label={`Sort by ${filter.label.toLowerCase()}`}
                      aria-pressed={isActive}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all active:scale-95 ${
                        isActive
                          ? 'bg-pink-500 text-white shadow-md active:shadow-sm'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 active:bg-gray-300 dark:active:bg-gray-500'
                      }`}
                    >
                      {filter.id === 'price-low' ? (
                        <span className="text-xs font-bold">₹</span>
                      ) : (
                        <Icon className="w-3 h-3" />
                      )}
                      <span>{filter.label}</span>
                    </button>
                  );
                })}
              </div>
              
              {/* Filter Button */}
              <div className="relative group/tooltip">
              <button
                onClick={() => setShowBottomSheet(true)}
                  aria-label="Open filters"
                  aria-expanded={showBottomSheet}
                  className="flex items-center gap-1 px-2.5 py-1 bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 rounded-full text-[11px] font-medium border border-pink-200 dark:border-pink-800 hover:bg-pink-100 dark:hover:bg-pink-900/30 transition-colors active:scale-95 active:bg-pink-200 dark:active:bg-pink-900/40"
              >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filter</span>
              </button>
                {/* Tooltip */}
                <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-[10px] rounded shadow-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                  Filter products by price and rating
                  <div className="absolute right-4 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Breadcrumb - Mobile Only (Below Filter Bar) */}
        <div className="lg:hidden sticky top-[112px] z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="w-full px-3 py-0.5">
            <nav className="flex items-center space-x-1 text-[10px] text-gray-400 dark:text-gray-500">
              <button
                onClick={() => router.push('/')}
                className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 font-medium"
              >
                Home
              </button>
              <span className="text-gray-500 dark:text-gray-400 text-xs">›</span>
              {isSubcategory ? (
                <>
                  <button
                    onClick={() => router.push(`/category/${categorySlug}`)}
                    className="text-gray-700 dark:text-gray-300 font-medium hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200"
                  >
                    {categoryData?.data?.category?.name || getCategoryDisplayName(categorySlug)}
                  </button>
                  <span className="text-gray-500 dark:text-gray-400 text-xs">›</span>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">{currentData?.name || 'Subcategory'}</span>
                </>
              ) : (
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {currentData?.name || getCategoryDisplayName(categorySlug)}
                </span>
              )}
            </nav>
          </div>
        </div>

        {/* Sticky Breadcrumb - Desktop/Laptop (Below Header) */}
        <div className="hidden lg:block sticky top-16 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="w-full px-12 xl:px-16 py-0.5">
            <nav className="flex items-center space-x-1.5 text-xs text-gray-400 dark:text-gray-500">
              <button
                onClick={() => router.push('/')}
                className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 font-medium"
              >
                Home
              </button>
              <span className="text-gray-500 dark:text-gray-400 text-sm">›</span>
              {isSubcategory ? (
                <>
                  <button
                    onClick={() => router.push(`/category/${categorySlug}`)}
                    className="text-gray-700 dark:text-gray-300 font-medium hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200"
                  >
                    {categoryData?.data?.category?.name || getCategoryDisplayName(categorySlug)}
                  </button>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">›</span>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">{currentData?.name || 'Subcategory'}</span>
                </>
              ) : (
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {currentData?.name || getCategoryDisplayName(categorySlug)}
                </span>
              )}
            </nav>
          </div>
        </div>

        {/* Header Section */}
        <div className="bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-b border-gray-100 dark:border-gray-700">
          <div className="w-full px-3 sm:px-4 lg:px-12 xl:px-16 py-1.5 lg:py-2">

            {/* Page Title and Controls */}
            <div className="mb-2">
              {/* Desktop Layout */}
              <div className="hidden lg:block">
                <div className="flex items-start justify-between">
                  {/* Left: Title and Info */}
                  <div className="flex-1">
                    <h1 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-gray-100 font-poppins mb-0.5">
                      {isSubcategory ? currentData?.name : 'Tap a Selection to Explore'}
                    </h1>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm text-gray-500 dark:text-gray-400 font-inter font-medium">
                        {products.length} Products
                      </span>
                      <span className="text-gray-400">•</span>
                      <p className="text-xs text-gray-600 dark:text-gray-300 font-inter line-clamp-1">
                        {currentData?.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Right: Action Buttons */}
                  <div className="flex items-center space-x-2 ml-4">
                    {/* Explore More Categories Button */}
                    <div className="relative group/tooltip">
                    <button
                      onClick={toggleCategoryMenu}
                        aria-label={isCategoryMenuOpen ? 'Close category menu' : 'Open category menu'}
                        aria-expanded={isCategoryMenuOpen}
                      className={`flex items-center space-x-2 h-10 rounded-lg px-4 transition-all duration-200 cursor-pointer group active:scale-95 active:shadow-sm ${
                        isCategoryMenuOpen 
                          ? 'bg-pink-50 dark:bg-pink-900/30 border border-pink-300 dark:border-pink-700' 
                          : 'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      {isCategoryMenuOpen ? (
                        <X className="w-4 h-4 text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100" />
                      ) : (
                        <Grid3X3 className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300" />
                      )}
                      <span className="text-xs text-gray-700 dark:text-gray-300 font-inter font-medium group-hover:text-gray-900 dark:group-hover:text-gray-100">
                        {isCategoryMenuOpen ? 'Close Menu' : 'Explore More Categories'}
                      </span>
                    </button>
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-[10px] rounded shadow-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                        {isCategoryMenuOpen ? 'Close category menu' : 'Browse all product categories'}
                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                      </div>
                    </div>
                    
                    {/* Sort Button - Modern Design with Fixed Width */}
                    <div className="relative group/tooltip" ref={sortDropdownRef}>
                      <button
                        onClick={() => setShowSortDropdown(!showSortDropdown)}
                        aria-label="Sort products"
                        aria-expanded={showSortDropdown}
                        aria-haspopup="true"
                        className="flex items-center justify-between h-10 min-w-[220px] bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md px-4 hover:bg-gray-100 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 cursor-pointer group shadow-sm active:scale-[0.98] active:shadow-xs"
                      >
                        <div className="flex items-center space-x-2.5">
                          <div className="p-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                            <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div className="flex flex-col items-start justify-center">
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-inter font-medium uppercase tracking-wide leading-none">Sort by</span>
                            <span className="text-xs font-inter font-semibold text-gray-700 dark:text-gray-300 leading-tight mt-0.5">
                              {sortBy === 'popularity' && 'Popularity'}
                              {sortBy === 'price-low' && 'Price: Low to High'}
                              {sortBy === 'price-high' && 'Price: High to Low'}
                              {sortBy === 'rating' && 'Top Rated'}
                              {sortBy === 'newest' && 'Latest First'}
                            </span>
                          </div>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform duration-300 flex-shrink-0 ${showSortDropdown ? 'rotate-180' : ''}`} />
                      </button>
                      {/* Tooltip */}
                      {!showSortDropdown && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-[10px] rounded shadow-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                          Sort products by different criteria
                          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                        </div>
                      )}
                    
                      {/* Dropdown Menu - Modern Design with Fixed Width */}
                      {showSortDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-full right-0 mt-2 min-w-[220px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl dark:shadow-black/40 z-50 overflow-hidden backdrop-blur-sm"
                          role="menu"
                          aria-label="Sort options"
                        >
                          <div className="py-1.5" role="group">
                            <button
                              onClick={() => handleSortChange('popularity')}
                              aria-label="Sort by popularity"
                              aria-checked={sortBy === 'popularity'}
                              role="menuitemradio"
                              className={`w-full text-left px-4 py-3 text-sm font-inter transition-all duration-200 flex items-center justify-between active:bg-gray-100 dark:active:bg-gray-700/70 ${
                                sortBy === 'popularity' 
                                  ? 'bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 font-semibold border-l-2 border-pink-500 dark:border-pink-400' 
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                              }`}
                            >
                              <span>Popularity</span>
                              {sortBy === 'popularity' && (
                                <div className="w-2 h-2 rounded-full bg-pink-500 dark:bg-pink-400"></div>
                              )}
                            </button>
                            <button
                              onClick={() => handleSortChange('newest')}
                              aria-label="Sort by newest"
                              aria-checked={sortBy === 'newest'}
                              role="menuitemradio"
                              className={`w-full text-left px-4 py-3 text-sm font-inter transition-all duration-200 flex items-center justify-between ${
                                sortBy === 'newest' 
                                  ? 'bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 font-semibold border-l-2 border-pink-500 dark:border-pink-400' 
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                              }`}
                            >
                              <span>Latest First</span>
                              {sortBy === 'newest' && (
                                <div className="w-2 h-2 rounded-full bg-pink-500 dark:bg-pink-400"></div>
                              )}
                            </button>
                            <button
                              onClick={() => handleSortChange('price-low')}
                              aria-label="Sort by price low to high"
                              aria-checked={sortBy === 'price-low'}
                              role="menuitemradio"
                              className={`w-full text-left px-4 py-3 text-sm font-inter transition-all duration-200 flex items-center justify-between ${
                                sortBy === 'price-low' 
                                  ? 'bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 font-semibold border-l-2 border-pink-500 dark:border-pink-400' 
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                              }`}
                            >
                              <span>Price: Low to High</span>
                              {sortBy === 'price-low' && (
                                <div className="w-2 h-2 rounded-full bg-pink-500 dark:bg-pink-400"></div>
                              )}
                            </button>
                            <button
                              onClick={() => handleSortChange('price-high')}
                              aria-label="Sort by price high to low"
                              aria-checked={sortBy === 'price-high'}
                              role="menuitemradio"
                              className={`w-full text-left px-4 py-3 text-sm font-inter transition-all duration-200 flex items-center justify-between ${
                                sortBy === 'price-high' 
                                  ? 'bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 font-semibold border-l-2 border-pink-500 dark:border-pink-400' 
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                              }`}
                            >
                              <span>Price: High to Low</span>
                              {sortBy === 'price-high' && (
                                <div className="w-2 h-2 rounded-full bg-pink-500 dark:bg-pink-400"></div>
                              )}
                            </button>
                            <button
                              onClick={() => handleSortChange('rating')}
                              aria-label="Sort by top rated"
                              aria-checked={sortBy === 'rating'}
                              role="menuitemradio"
                              className={`w-full text-left px-4 py-3 text-sm font-inter transition-all duration-200 flex items-center justify-between ${
                                sortBy === 'rating' 
                                  ? 'bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 font-semibold border-l-2 border-pink-500 dark:border-pink-400' 
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                              }`}
                            >
                              <span>Top Rated</span>
                              {sortBy === 'rating' && (
                                <div className="w-2 h-2 rounded-full bg-pink-500 dark:bg-pink-400"></div>
                              )}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Layout */}
              <div className="lg:hidden">
                <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 font-poppins mb-1">
                  {isSubcategory ? currentData?.name : 'Tap a Selection to Explore'}
                </h1>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-inter font-medium">
                    {filteredProducts.length} Products
                  </span>
                  <span className="text-gray-400 text-xs">•</span>
                  <p className="text-[10px] text-gray-600 dark:text-gray-300 font-inter line-clamp-1 flex-1">
                    {currentData?.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Subcategory Navigation */}
            {allSubcategories.length > 0 && (
              <div className="hidden lg:block pt-4 pb-1.5">
                {allSubcategories.length >= 10 ? (
                  // Original circular layout for 10+ subcategories (like "Pick a Cake by Flavor")
                  <div className="flex items-center justify-between w-full">
                    {allSubcategories.map((subcategory, index) => {
                      // Define border colors based on category names
                      const getBorderColor = (categoryName) => {
                        const name = categoryName.toLowerCase();
                        if (name.includes('bloom') || name.includes('celebrate')) return 'border-pink-400';
                        if (name.includes('chocolate')) return 'border-amber-600';
                        if (name.includes('bento')) return 'border-pink-500';
                        if (name.includes('truffle')) return 'border-red-600';
                        if (name.includes('flower')) return 'border-purple-500';
                        if (name.includes('pinata')) return 'border-blue-400';
                        if (name.includes('red velvet')) return 'border-red-500';
                        if (name.includes('photo')) return 'border-yellow-500';
                        if (name.includes('fusion')) return 'border-orange-500';
                        if (name.includes('designer')) return 'border-indigo-500';
                        if (name.includes('butterscotch')) return 'border-yellow-600';
                        if (name.includes('dry')) return 'border-amber-700';
                        // Default colors for other categories
                        return 'border-gray-400';
                      };
                      
                      const getHoverBorderColor = (categoryName) => {
                        const name = categoryName.toLowerCase();
                        if (name.includes('bloom') || name.includes('celebrate')) return 'hover:border-pink-500';
                        if (name.includes('chocolate')) return 'hover:border-amber-700';
                        if (name.includes('bento')) return 'hover:border-pink-600';
                        if (name.includes('truffle')) return 'hover:border-red-700';
                        if (name.includes('flower')) return 'hover:border-purple-600';
                        if (name.includes('pinata')) return 'hover:border-blue-500';
                        if (name.includes('red velvet')) return 'hover:border-red-600';
                        if (name.includes('photo')) return 'hover:border-yellow-600';
                        if (name.includes('fusion')) return 'hover:border-orange-600';
                        if (name.includes('designer')) return 'hover:border-indigo-600';
                        if (name.includes('butterscotch')) return 'hover:border-yellow-700';
                        if (name.includes('dry')) return 'hover:border-amber-800';
                        // Default hover colors
                        return 'hover:border-gray-500';
                      };
                      
                      const borderColor = getBorderColor(subcategory.name);
                      const hoverBorderColor = getHoverBorderColor(subcategory.name);
                      
                      return (
                        <button
                          key={subcategory.id}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSubcategoryNavigation(subcategory.slug);
                          }}
                          aria-label={`View ${subcategory.name} subcategory`}
                          aria-pressed={subCategorySlug === subcategory.slug}
                          className="flex flex-col items-center space-y-2 flex-1 group cursor-pointer relative active:scale-95 transition-transform duration-150"
                        >
                          <div className="w-24 h-24 relative">
                            <div className={`w-full h-full rounded-full overflow-hidden border-2 transition-all duration-200 ${
                            subCategorySlug === subcategory.slug
                                ? 'border-pink-500 shadow-lg'
                                : 'border-gray-300 hover:border-gray-400'
                          }`}>
                            <img
                              src={subcategory.image}
                              alt={subcategory.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                              loading="lazy"
                            />
                            </div>
                            {subCategorySlug === subcategory.slug && (
                              <div className="absolute bottom-0 right-0 w-6 h-6 bg-pink-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm z-10">
                                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                              </div>
                            )}
                          </div>
                          <span className={`text-sm font-light text-center leading-tight whitespace-nowrap ${
                            subCategorySlug === subcategory.slug
                              ? 'text-pink-500'
                              : 'text-black'
                          }`}>
                            {subcategory.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  // New rectangular layout for fewer than 10 subcategories - in a row
                  <div className="flex gap-4 w-full">
                    {allSubcategories.map((subcategory, index) => {
                      return (
                        <button
                          key={subcategory.id}
                            ref={(el) => (subcategoryButtonsRef.current[index] = el)}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSubcategoryNavigation(subcategory.slug);
                              setFocusedSubcategoryIndex(index);
                            }}
                            onFocus={() => setFocusedSubcategoryIndex(index)}
                            onBlur={() => {
                              setTimeout(() => {
                                if (!subcategoryButtonsRef.current.some(btn => btn === document.activeElement)) {
                                  setFocusedSubcategoryIndex(null);
                                }
                              }, 100);
                            }}
                            aria-label={`View ${subcategory.name} subcategory`}
                            aria-pressed={subCategorySlug === subcategory.slug}
                            tabIndex={0}
                            className={`flex items-center space-x-4 p-4 rounded-xl border-2 transition-all duration-200 group cursor-pointer flex-1 relative active:scale-[0.98] active:shadow-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 ${
                            subCategorySlug === subcategory.slug
                                ? 'border-pink-500 bg-purple-50 shadow-lg'
                                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="w-16 h-16 rounded-md flex-shrink-0 relative">
                            <div className="w-full h-full rounded-md overflow-hidden">
                            <img
                              src={subcategory.image}
                              alt={subcategory.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                              loading="lazy"
                            />
                            </div>
                            {subCategorySlug === subcategory.slug && (
                              <div className="absolute bottom-0 right-0 w-5 h-5 bg-pink-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm z-10">
                                <Check className="w-3 h-3 text-white" strokeWidth={3} />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 text-left">
                            <h3 className={`text-sm font-semibold leading-tight ${
                              subCategorySlug === subcategory.slug
                                ? 'text-pink-500'
                                : 'text-black'
                            }`}>
                              {subcategory.name}
                            </h3>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full px-2 sm:px-3 lg:px-12 xl:px-16 pt-2 pb-6 lg:pt-2.5 lg:pb-6">
          {/* Products Grid */}
          {loading ? (
            <div>
              <div className="text-center mb-4">
                <Loader2 className="w-6 h-6 animate-spin text-pink-500 dark:text-pink-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400 font-inter">Loading products...</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-2.5 lg:gap-4">
              {[...Array(10)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
              </div>
            </div>
          ) : sortedProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-2.5 lg:gap-4">
              {sortedProducts.map((product) => (
                <ListingProductCard
                  key={product.id}
                  product={product}
                  formatPrice={formatPrice}
                  currentSubcategoryName={isSubcategory ? currentData?.name : null}
                />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12 lg:py-16"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-10 h-10 text-pink-500 dark:text-pink-400" />
              </div>
              <h3 className="text-lg lg:text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2 font-poppins">
                No products found
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6 font-inter text-sm lg:text-base">
                We couldn't find any products matching your criteria.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setPriceRange([0, maxPrice]);
                    setMinRating(0);
                    setSortBy('popularity');
                  }}
                  className="px-6 py-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-inter text-sm font-medium transition-all duration-200 active:scale-95 active:shadow-sm"
                >
                  Clear Filters
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-inter text-sm font-medium transition-all duration-200 active:scale-95 active:shadow-sm"
                >
                  Browse All Categories
                </button>
            </div>
            </motion.div>
          )}
        </div>

        {/* Bottom Sheet for Filters - Mobile Only */}
        <AnimatePresence>
          {showBottomSheet && (
            <>
              {/* Backdrop - Dimmed but visible */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setShowBottomSheet(false)}
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 bottom-sheet-backdrop lg:hidden"
              />
              
              {/* Bottom Sheet */}
              <motion.div
                ref={bottomSheetRef}
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed bottom-16 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-xl shadow-2xl z-[45] max-h-[calc(85vh-4rem)] overflow-y-auto lg:hidden"
              >
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-pink-50 via-rose-50 to-pink-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 border-b border-pink-100 dark:border-gray-700 px-4 py-3.5 flex items-center justify-between z-10 backdrop-blur-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-400 to-rose-400 dark:from-pink-500 dark:to-rose-500 flex items-center justify-center shadow-sm shadow-pink-200/50 dark:shadow-pink-900/30">
                      <SlidersHorizontal className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-base font-bold text-gray-800 dark:text-white font-poppins">
                      Filters
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowBottomSheet(false)}
                    className="w-9 h-9 rounded-xl bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm flex items-center justify-center hover:bg-white dark:hover:bg-gray-600 transition-colors active:scale-95 border border-pink-100 dark:border-gray-600"
                  >
                    <X className="w-4.5 h-4.5 text-gray-600 dark:text-gray-300" />
                  </button>
                </div>
                
                <div className="px-4 py-4 space-y-4 pb-6 bg-white dark:bg-gray-800">
                  {/* Sort Options - Soft Design */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-3 font-poppins">
                      Sort By
                    </h3>
                    <div className="space-y-2">
                      {[
                        { value: 'popularity', label: 'Popularity' },
                        { value: 'newest', label: 'Latest First' },
                        { value: 'price-low', label: 'Price: Low to High' },
                        { value: 'price-high', label: 'Price: High to Low' },
                        { value: 'rating', label: 'Top Rated' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            handleSortChange(option.value);
                            setShowBottomSheet(false);
                          }}
                          className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
                            sortBy === option.value
                              ? 'bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-900/40 dark:to-rose-900/40 text-pink-700 dark:text-pink-300 border-2 border-pink-300 dark:border-pink-600 shadow-sm'
                              : 'bg-gray-50/80 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-600 hover:bg-pink-50/50 dark:hover:bg-pink-900/20 hover:border-pink-200 dark:hover:border-pink-800'
                          }`}
                        >
                          <span className="font-inter text-sm font-semibold">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Range - Preset Buttons with Soft Design */}
                  <div className="bg-gradient-to-br from-pink-50/50 via-rose-50/30 to-pink-50/50 dark:from-gray-900/30 dark:via-gray-800/20 dark:to-gray-900/30 rounded-2xl p-4 border border-pink-100/50 dark:border-gray-700/50">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-gray-800 dark:text-white font-poppins">
                        Price Range
                      </h3>
                      {(priceRange[0] > 0 || priceRange[1] < maxPrice) && (
                        <button
                          onClick={() => setPriceRange([0, maxPrice])}
                          className="text-[10px] font-medium text-pink-500 dark:text-pink-400 hover:text-pink-600 dark:hover:text-pink-300 transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    
                    {/* Preset Price Range Buttons */}
                    <div className="grid grid-cols-2 gap-2.5">
                      {(() => {
                        // Calculate price ranges based on maxPrice
                        const ranges = [];
                        if (maxPrice <= 500) {
                          ranges.push(
                            { label: 'Under ₹500', min: 0, max: 500 },
                            { label: 'All Prices', min: 0, max: maxPrice }
                          );
                        } else if (maxPrice <= 1000) {
                          ranges.push(
                            { label: 'Under ₹500', min: 0, max: 500 },
                            { label: '₹500 - ₹1000', min: 500, max: 1000 },
                            { label: 'Above ₹1000', min: 1000, max: maxPrice },
                            { label: 'All Prices', min: 0, max: maxPrice }
                          );
                        } else if (maxPrice <= 2000) {
                          ranges.push(
                            { label: 'Under ₹500', min: 0, max: 500 },
                            { label: '₹500 - ₹1000', min: 500, max: 1000 },
                            { label: '₹1000 - ₹2000', min: 1000, max: 2000 },
                            { label: 'Above ₹2000', min: 2000, max: maxPrice },
                            { label: 'All Prices', min: 0, max: maxPrice }
                          );
                        } else {
                          ranges.push(
                            { label: 'Under ₹500', min: 0, max: 500 },
                            { label: '₹500 - ₹1000', min: 500, max: 1000 },
                            { label: '₹1000 - ₹2000', min: 1000, max: 2000 },
                            { label: '₹2000 - ₹5000', min: 2000, max: 5000 },
                            { label: 'Above ₹5000', min: 5000, max: maxPrice },
                            { label: 'All Prices', min: 0, max: maxPrice }
                          );
                        }
                        
                        return ranges.map((range, index) => {
                          const isActive = priceRange[0] === range.min && priceRange[1] === range.max;
                          return (
                            <button
                              key={index}
                              onClick={() => setPriceRange([range.min, range.max])}
                              className={`px-3 py-3 rounded-xl text-xs font-semibold transition-all duration-200 ${
                                isActive
                                  ? 'bg-gradient-to-br from-pink-400 to-rose-400 dark:from-pink-500 dark:to-rose-500 text-white scale-[1.02] border-2 border-pink-300 dark:border-pink-600'
                                  : 'bg-white/90 dark:bg-gray-700/80 backdrop-blur-sm text-gray-700 dark:text-gray-300 hover:bg-pink-50/70 dark:hover:bg-pink-900/20 border-2 border-pink-100 dark:border-gray-600 hover:border-pink-200 dark:hover:border-pink-800'
                              }`}
                            >
                              {range.label}
                            </button>
                          );
                        });
                      })()}
                    </div>
                    
                    {/* Current Selection Display */}
                    {(priceRange[0] > 0 || priceRange[1] < maxPrice) && (
                      <div className="mt-3.5 pt-3 border-t border-pink-200/50 dark:border-gray-700">
                        <div className="px-3.5 py-2.5 bg-gradient-to-r from-pink-100/80 to-rose-100/80 dark:from-pink-900/30 dark:to-rose-900/30 rounded-xl border border-pink-200 dark:border-pink-800/50">
                          <span className="text-xs font-bold text-pink-700 dark:text-pink-300 font-poppins">
                            Selected: ₹{priceRange[0].toLocaleString()} - ₹{priceRange[1].toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Rating Filter - Soft Design */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-gray-800 dark:text-white font-poppins">
                        Filter by Rating
                      </h3>
                      {minRating > 0 && (
                        <button
                          onClick={() => setMinRating(0)}
                          className="text-[10px] font-medium text-pink-500 dark:text-pink-400 hover:text-pink-600 dark:hover:text-pink-300 transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-2.5">
                      {[0, 3, 4, 4.5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => setMinRating(rating)}
                          className={`relative px-3 py-3 rounded-xl text-xs font-semibold transition-all duration-200 ${
                            minRating === rating
                              ? 'bg-gradient-to-br from-pink-400 to-rose-400 dark:from-pink-500 dark:to-rose-500 text-white scale-[1.02] border-2 border-pink-300 dark:border-pink-600'
                              : 'bg-white/90 dark:bg-gray-700/80 backdrop-blur-sm text-gray-700 dark:text-gray-300 hover:bg-pink-50/70 dark:hover:bg-pink-900/20 border-2 border-pink-100 dark:border-gray-600 hover:border-pink-200 dark:hover:border-pink-800'
                          }`}
                        >
                          {rating === 0 ? (
                            <span className="font-semibold">All</span>
                          ) : (
                            <div className="flex flex-col items-center justify-center gap-1">
                              <div className="flex items-center gap-0.5">
                                <span className="font-bold">{rating}</span>
                                <Star className={`w-3.5 h-3.5 ${minRating === rating ? 'fill-white' : 'fill-yellow-400 text-yellow-400'}`} />
                              </div>
                              <span className="text-[9px] font-medium opacity-75">+ Rating</span>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Apply Button - Soft Gradient */}
                  <div className="pt-2">
                    <button
                      onClick={() => setShowBottomSheet(false)}
                      className="w-full py-3.5 bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500 hover:from-pink-500 hover:via-rose-500 hover:to-pink-600 text-white rounded-xl font-inter text-sm font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm shadow-pink-200/50 dark:shadow-pink-900/30"
                    >
                      <Sparkles className="w-4 h-4" />
                      Apply Filters
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Scroll to Top Button */}
        <AnimatePresence>
          {showScrollToTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 z-50 w-12 h-12 lg:w-14 lg:h-14 bg-pink-500 hover:bg-pink-600 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
              aria-label="Scroll to top"
            >
              <ArrowUp className="w-5 h-5 lg:w-6 lg:h-6" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Website Footer */}
        <Footer />
        
        {/* Mobile Footer */}
        <MobileFooter cartItemCount={3} walletAmount={1250} wishlistCount={5} />
      </div>
    </>
  );
};

export default ListingPage;
