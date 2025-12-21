'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import mainCategoriesAPI from '../api/mainCategories';

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
        const categories = await mainCategoriesAPI.getMainCategoriesForCurrentDevice();
        
        // Transform categories to match the expected format
        const transformedCategories = categories.map(category => {
          return {
          id: category.id,
          name: category.name,
          description: category.description,
          image_url: category.image_url,
          icon: category.icon, // Make sure icon is included
          icon_image_url: category.icon_image_url, // Include icon image URL
          display_name: category.display_name, // Include display name
          is_active: category.is_active,
          order_index: category.order_index,
          // Add legacy fields for compatibility
          item_type: 'category',
          category_id: category.id,
          category_name: category.name,
          category_image: category.image_url,
          category_description: category.description
        };
        });
        
        
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

  // Removed automatic refresh mechanism to prevent infinite loading

  // Icon mapping for database-stored icons
  const iconMap = {
    'cake': 'M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z',
    'heart': 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    'smile': 'M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    'book': 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    'star': 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
    'package': 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
    'gift': 'M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7',
    'crown': 'M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z',
    'sparkles': 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
    // Example: Adding a new cupcake icon
    'cupcake': 'M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 2a8 8 0 100 16 8 8 0 000-16zm-2 4a1 1 0 11-2 0 1 1 0 012 0zm4 0a1 1 0 11-2 0 1 1 0 012 0zm-2 4a1 1 0 11-2 0 1 1 0 012 0z'
  };

  // Function to get category icon from database or fallback to default
  const getCategoryIcon = (category) => {
    // First try to use uploaded icon image if available
    if (category.icon_image_url) {
      return (
        <img 
          src={category.icon_image_url} 
          alt={`${category.name} icon`}
          className="w-8 h-8 lg:w-12 lg:h-12 object-contain"
          style={{ filter: 'opacity(0.8)' }} // Make it slightly transparent to match the light color theme
        />
      );
    }
    
    // Then try to use the SVG icon from database
    if (category.icon && iconMap[category.icon]) {
      return (
        <svg className="w-6 h-6 lg:w-8 lg:h-8 text-[#8B7355] dark:text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={iconMap[category.icon]} />
        </svg>
      );
    }

    // Fallback to keyword-based icon selection for backward compatibility
    const name = category.name?.toLowerCase() || '';
    
    if (name.includes('birthday') || name.includes('cake')) {
      return (
        <svg className="w-6 h-6 lg:w-8 lg:h-8 text-[#8B7355] dark:text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={iconMap.cake} />
        </svg>
      );
    } else if (name.includes('wedding') || name.includes('anniversary')) {
      return (
        <svg className="w-6 h-6 lg:w-8 lg:h-8 text-[#8B7355] dark:text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={iconMap.heart} />
        </svg>
      );
    } else if (name.includes('kid') || name.includes('child')) {
      return (
        <svg className="w-6 h-6 lg:w-8 lg:h-8 text-[#8B7355] dark:text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={iconMap.smile} />
        </svg>
      );
    } else if (name.includes('mini') || name.includes('small') || name.includes('treat')) {
      return (
        <svg className="w-6 h-6 lg:w-8 lg:h-8 text-[#8B7355] dark:text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={iconMap.book} />
        </svg>
      );
    } else if (name.includes('flower') || name.includes('rose')) {
      return (
        <svg className="w-6 h-6 lg:w-8 lg:h-8 text-[#8B7355] dark:text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={iconMap.star} />
        </svg>
      );
    } else if (name.includes('sweet') || name.includes('dry') || name.includes('fruit')) {
      return (
        <svg className="w-6 h-6 lg:w-8 lg:h-8 text-[#8B7355] dark:text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={iconMap.book} />
        </svg>
      );
    } else {
      // Default icon
      return (
        <svg className="w-6 h-6 lg:w-8 lg:h-8 text-[#8B7355] dark:text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={iconMap.package} />
        </svg>
      );
    }
  };

  // Get category display name
  const getCategoryDisplayName = (category) => {
    if (category.item_type === 'category') {
      // Use display_name if available, otherwise fall back to category_name
      return category.display_name || category.category_name;
    } else if (category.item_type === 'subcategory') {
      return category.subcategory_name;
    }
    return 'Unknown Category';
  };

  // Function to display category names in single line for laptop/desktop
  const wrapCategoryName = (name) => {
    if (isMobile) {
      return name; // Keep single line on mobile
    }

    // For laptop/desktop, keep all names in single line
    return name;
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

  // Force refresh function
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Handle category click
  const handleCategoryClick = (category) => {
    const displayName = getCategoryDisplayName(category);
    const originalName = category.category_name; // Always use original name for navigation
    console.log('Category clicked:', displayName, 'Original name:', originalName, category);
    
    // Get the category slug from the mapping using the ORIGINAL name, not display name
    const categorySlug = categorySlugMap[originalName] || createSlug(originalName);
    
    // Navigate to the category page
    const url = `/category/${categorySlug}`;
    console.log('Navigating to:', url);
    
    router.push(url);
  };

  // Don't render during SSR
  if (!mounted) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <section className="bg-gradient-to-b from-pink-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 pt-8 lg:pt-12 pb-2 lg:pb-3">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <h2 className="font-poppins text-xl lg:text-2xl text-[#6c3e27] dark:text-amber-200">
                <span className="lg:hidden font-normal">Most Loved 9 Categories</span>
                <span className="hidden lg:inline font-bold">Most Loved 9 Categories</span>
              </h2>
              <div className="mt-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mx-auto"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    console.warn('Main categories error:', error);
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
            <div className="text-center relative">
              <h2 className="font-poppins text-xl lg:text-2xl text-[#6c3e27] dark:text-amber-200">
                <span className="lg:hidden font-normal">Most Loved 9 Categories</span>
                <span className="hidden lg:inline font-light">Most Loved 9 Categories</span>
              </h2>
              {/* Refresh button */}
              <button
                onClick={handleRefresh}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 p-2 text-[#8B7355] dark:text-amber-300 hover:text-[#6c3e27] dark:hover:text-amber-200 transition-colors"
                title="Refresh categories"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

        {/* Categories Grid */}
        <section className="bg-gradient-to-b from-pink-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 py-2 lg:py-3 pb-8 lg:pb-12">
          <div className="w-full px-3 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-xl dark:shadow-black/20 overflow-hidden border border-[#E6D7C3] dark:border-gray-700">
              <div className={`${
                isMobile 
                  ? 'grid grid-cols-3 gap-1 p-2' 
                  : 'flex overflow-x-auto gap-2 w-full px-3 py-3 scrollbar-thin scrollbar-thumb-[#D2B48C] scrollbar-track-[#F5F5DC] hover:scrollbar-thumb-[#8B4513]'
              }`}>
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
                    if (isFirst) borderRadiusClasses = 'rounded-tl-lg rounded-bl-lg';
                    if (isLast) borderRadiusClasses = 'rounded-tr-lg rounded-br-lg';
                  }

                  return (
                    <div
                      key={`${category.item_type}-${category.item_type === 'category' ? category.category_id : category.subcategory_id}`}
                      className={`border border-[#6c3e27] dark:border-amber-700 ${borderRadiusClasses} p-3 sm:p-4 lg:p-5 flex flex-col items-center hover:bg-gradient-to-br hover:from-[#FEFCFB] hover:to-[#F5F5DC] dark:hover:from-gray-700/50 dark:hover:to-gray-600/50 hover:shadow-lg hover:border-[#8B4513] dark:hover:border-amber-600 transition-all duration-300 cursor-pointer group ${
                        isMobile
                          ? 'min-h-[120px] rounded-lg shadow-sm active:scale-95 active:shadow-md bg-white dark:bg-gray-700/30 hover:bg-gradient-to-br hover:from-[#FEFCFB] hover:to-[#F5F5DC] dark:hover:from-gray-700/50 dark:hover:to-gray-600/50'
                          : displayName === 'Love and Relationship Cakes'
                            ? 'min-h-[110px] min-w-[160px] flex-shrink-0'
                            : 'min-h-[110px] min-w-[140px] flex-shrink-0'
                      }`}
                      onClick={() => handleCategoryClick(category)}
                    >
            <div className={`${isMobile ? 'w-16 h-16 mb-2' : 'w-10 h-10 lg:w-12 lg:h-12 mb-3'} flex items-center justify-center relative group p-0`}>
              {/* Background circle with subtle gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#F5F5DC] to-[#E6D7C3] dark:from-amber-900/20 dark:to-amber-800/20 rounded-full opacity-20 group-hover:opacity-30 dark:group-hover:opacity-40 transition-opacity duration-300" />
              
              {/* Icon with enhanced styling */}
              <div className="relative z-10 transform group-hover:scale-110 transition-transform duration-300 w-full h-full flex items-center justify-center">
                {getCategoryIcon(category)}
              </div>
            </div>
                      <span className={`font-inter text-[#6c3e27] dark:text-amber-200 text-center leading-tight group-hover:text-[#8B4513] dark:group-hover:text-amber-100 transition-colors duration-300 ${
                        isMobile 
                          ? 'text-sm font-light px-1 select-none' 
                          : 'text-xs sm:text-sm lg:text-sm xl:text-sm font-light'
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
