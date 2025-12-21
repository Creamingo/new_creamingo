'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import featuredCategoriesAPI from '../api/featuredCategories';

const MainCategories = () => {
  const router = useRouter();
  const [mainCategories, setMainCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Mount detection
  useEffect(() => {
    setMounted(true);
  }, []);

  // Device detection
  useEffect(() => {
    if (!mounted) return;

    const checkDevice = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 1024);
      }
    };

    checkDevice();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkDevice);
      return () => window.removeEventListener('resize', checkDevice);
    }
  }, [mounted]);

  // Fetch all main categories
  useEffect(() => {
    // Only run on client side after component is mounted
    if (!mounted) {
      return;
    }

    const fetchAllMainCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get all main categories from the database
        const categories = await featuredCategoriesAPI.getFeaturedCategoriesForCurrentDevice();
        
        // Transform categories to match the expected format
        const transformedCategories = categories.map(category => ({
          id: category.id,
          name: category.name,
          description: category.description,
          image_url: category.image_url,
          is_active: category.is_active,
          order_index: category.order_index,
          // Add legacy fields for compatibility
          item_type: 'category',
          category_id: category.id,
          category_name: category.name,
          category_image: category.image_url,
          category_description: category.description
        }));
        
        
        setMainCategories(transformedCategories);
      } catch (err) {
        console.error('Error fetching main categories:', err);
        setError(err.message);
        // Fallback to empty array to prevent crashes
        setMainCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllMainCategories();
  }, [mounted]);

  // Default icons for different category types
  const getCategoryIcon = (categoryName, itemType) => {
    const name = categoryName.toLowerCase();
    
    if (name.includes('birthday') || name.includes('cake')) {
      return (
        <svg className="w-14 h-14 lg:w-5 lg:h-5 text-[#6c3e27] dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
        </svg>
      );
    } else if (name.includes('wedding') || name.includes('anniversary')) {
      return (
        <svg className="w-14 h-14 lg:w-5 lg:h-5 text-[#6c3e27] dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      );
    } else if (name.includes('kid') || name.includes('child')) {
      return (
        <svg className="w-14 h-14 lg:w-5 lg:h-5 text-[#6c3e27] dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    } else if (name.includes('mini') || name.includes('small') || name.includes('treat')) {
      return (
        <svg className="w-14 h-14 lg:w-5 lg:h-5 text-[#6c3e27] dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
    } else if (name.includes('flower') || name.includes('rose')) {
      return (
        <svg className="w-14 h-14 lg:w-5 lg:h-5 text-[#6c3e27] dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    } else if (name.includes('sweet') || name.includes('dry') || name.includes('fruit')) {
      return (
        <svg className="w-14 h-14 lg:w-5 lg:h-5 text-[#6c3e27] dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
    } else {
      // Default icon
      return (
        <svg className="w-14 h-14 lg:w-5 lg:h-5 text-[#6c3e27] dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      );
    }
  };

  // Get category display name
  const getCategoryDisplayName = (category) => {
    if (category.item_type === 'category') {
      return category.category_name;
    } else if (category.item_type === 'subcategory') {
      return category.subcategory_name;
    }
    return 'Unknown Category';
  };

  // Function to wrap category names into two lines for better readability
  const wrapCategoryName = (name) => {
    if (isMobile) {
      return name; // Keep single line on mobile
    }

    // Define wrapping rules for desktop/laptop
    const wrapRules = {
      'Pick a Cake by Flavor': 'Pick a Cake\nby Flavor',
      'Cakes for Any Occasion': 'Cakes for Any\nOccasion',
      'Kid\'s Cake Collection': 'Kid\'s Cake\nCollection',
      'Crowd-Favorite Cakes': 'Crowd-Favorite\nCakes',
      'Love and Relationship Cakes': 'Love & Relationship\nCakes',
      'Cakes for Every Milestone Year': 'Cakes for Every\nMilestone Year',
      'Flowers': 'Flowers',
      'Sweets and Dry Fruits': 'Sweets and\nDry Fruits',
      'Small Treats Desserts': 'Small Treats\nDesserts'
    };

    return wrapRules[name] || name;
  };

  // Function to convert names to URL-friendly slugs
  const createSlug = (name) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim();
  };

  // Mapping of category names to their URL slugs (matching the existing pattern)
  const categorySlugMap = {
    'Pick a Cake by Flavor': 'cakes-by-flavor',
    'Cakes for Any Occasion': 'cakes-for-occasion',
    'Kid\'s Cake Collection': 'kids-cake-collection',
    'Crowd-Favorite Cakes': 'crowd-favorite-cakes',
    'Love and Relationship Cakes': 'love-relationship-cakes',
    'Cakes for Every Milestone Year': 'milestone-year-cakes',
    'Flowers': 'flowers',
    'Sweets and Dry Fruits': 'sweets-dry-fruits',
    'Small Treats Desserts': 'small-treats-desserts'
  };

  // Handle category click
  const handleCategoryClick = (category) => {
    const displayName = getCategoryDisplayName(category);
    console.log('Category clicked:', displayName, category);
    
    // Get the category slug from the mapping or create one
    const categorySlug = categorySlugMap[displayName] || createSlug(displayName);
    
    // Navigate to the category page
    const url = `/category/${categorySlug}`;
    console.log('Navigating to:', url);
    
    router.push(url);
  };

  // Loading state (render during SSR to prevent hydration mismatch)
  if (!mounted || loading) {
    return (
      <section className="bg-gradient-to-b from-pink-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 pt-8 lg:pt-12 pb-2 lg:pb-3">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <h2 className="font-poppins text-xl lg:text-2xl text-[#6c3e27] dark:text-amber-400">
                <span className="lg:hidden font-normal">Most Loved 9 Categories</span>
                <span className="hidden lg:inline font-bold">Most Loved 9 Categories</span>
              </h2>
              {loading && (
                <div className="mt-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mx-auto"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    console.warn('Featured categories error:', error);
    // Don't show error to users, just log it and show empty state
  }

  // Empty state
  if (mainCategories.length === 0) {
    return null; // Don't render anything if no categories
  }

  return (
    <>
      {/* Header Section */}
      <section className="bg-gradient-to-b from-pink-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 pt-4 lg:pt-8 pb-2 lg:pb-3">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <h2 className="font-poppins text-xl lg:text-2xl text-[#6c3e27] dark:text-amber-400">
                <span className="lg:hidden font-normal">Most Loved 9 Categories</span>
                <span className="hidden lg:inline font-bold">Most Loved 9 Categories</span>
              </h2>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="bg-gradient-to-b from-pink-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 py-2 lg:py-3">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="w-full mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
              <div 
                className={`${
                  isMobile 
                    ? 'grid grid-cols-3 gap-1' 
                    : 'flex overflow-x-auto gap-1 scrollbar-hide w-full'
                }`}
                suppressHydrationWarning
              >
                {mainCategories.map((category, index) => {
                  const displayName = getCategoryDisplayName(category);
                  const isFirst = index === 0;
                  const isLast = index === mainCategories.length - 1;
                  const isFirstRow = index < 3;
                  const isLastRow = index >= mainCategories.length - 3;
                  
                  // Determine border radius classes
                  let borderRadiusClasses = '';
                  if (isMobile) {
                    // Mobile: 3x3 grid - first row, first column, last row, last column
                    const isFirstRow = index < 3;
                    const isLastRow = index >= 6;
                    const isFirstCol = index % 3 === 0;
                    const isLastCol = index % 3 === 2;
                    
                    if (isFirstRow && isFirstCol) borderRadiusClasses = 'rounded-tl-lg';
                    if (isFirstRow && isLastCol) borderRadiusClasses = 'rounded-tr-lg';
                    if (isLastRow && isFirstCol) borderRadiusClasses = 'rounded-bl-lg';
                    if (isLastRow && isLastCol) borderRadiusClasses = 'rounded-br-lg';
                  } else {
                    // Desktop: single row - first and last items get rounded corners
                    if (isFirst) borderRadiusClasses = 'rounded-tl-lg';
                    if (isLast) borderRadiusClasses = 'rounded-br-lg';
                  }

                  return (
                    <div
                      key={`${category.item_type}-${category.item_type === 'category' ? category.category_id : category.subcategory_id}`}
                      className={`border border-[#6c3e27] dark:border-amber-700 ${borderRadiusClasses} p-1 sm:p-2 lg:p-4 flex flex-col items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 cursor-pointer ${
                        isMobile 
                          ? 'min-h-[120px]' 
                          : displayName === 'Love and Relationship Cakes' 
                            ? 'flex-1 min-h-[120px] min-w-[140px]' 
                            : 'flex-1 min-h-[120px]'
                      }`}
                      onClick={() => handleCategoryClick(category)}
                    >
                      <div className="w-16 h-16 lg:w-6 lg:h-6 mb-1 lg:mb-2 flex items-center justify-center">
                        {getCategoryIcon(displayName, category.item_type)}
                      </div>
                      <span className={`font-inter text-[#6c3e27] dark:text-amber-400 text-center font-medium leading-tight whitespace-pre-line ${
                        isMobile 
                          ? 'text-xs sm:text-sm' 
                          : 'text-xs sm:text-sm lg:text-sm xl:text-sm'
                      }`}>
                        {wrapCategoryName(displayName)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default MainCategories;
