'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, ThumbsUp, MessageCircle, Camera, Send, Filter, SortAsc, ChevronDown, ChevronUp, X } from 'lucide-react';
import Image from 'next/image';
import productApi from '../../../../api/productApi';
import { resolveImageUrl } from '../../../../utils/imageUrl';

// Modern Category Rating Component - Always Visible Stars
const CategorySelector = ({ selectedCategories, onCategoryToggle, categories, categoryRatings, onCategoryRatingChange, overallRating = 0 }) => {
  const renderCategoryStars = (categoryId, rating, size = 16) => {
  return (
      <div className="flex items-center space-x-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const fillRatio = Math.max(0, Math.min(1, rating - (star - 1)));
          const isFilled = fillRatio >= 1;
          const isPartial = fillRatio > 0 && fillRatio < 1;
          const uniqueId = `cat-star-${categoryId}-${star}-${rating.toFixed(1)}`;
            
            return (
                <button
              key={star}
              onClick={(e) => {
                e.stopPropagation();
                onCategoryRatingChange(categoryId, star);
              }}
              className="transition-all duration-200 hover:scale-110 cursor-pointer"
            >
              <svg
                className={
                  size === 14 ? 'w-3.5 h-3.5' :
                  size === 16 ? 'w-4 h-4' :
                  size === 18 ? 'w-5 h-5' :
                  'w-5 h-5'
                }
                      viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {isPartial && (
                  <defs>
                    <linearGradient id={uniqueId} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset={`${fillRatio * 100}%`} stopColor="#ec4899" />
                      <stop offset={`${fillRatio * 100}%`} stopColor="#e5e7eb" />
                    </linearGradient>
                  </defs>
                )}
                      <path 
                  d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                  fill={
                    isFilled
                      ? '#ec4899'
                      : isPartial
                      ? `url(#${uniqueId})`
                      : '#e5e7eb'
                  }
                  className={isFilled ? 'drop-shadow-sm' : ''}
                      />
                    </svg>
                </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-2 mt-6 sm:mt-8">
      <div className="text-center">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-0.5">
          Fine-tune individual aspects <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Each category can be rated independently to reflect your experience
        </p>
                    </div>
      
      {/* Desktop: Grid Layout - Horizontal Design */}
      <div className="hidden md:block">
        <div className="grid grid-cols-5 gap-2.5">
          {categories.map((category) => {
            const currentRating = categoryRatings[category.id] || 0;
            const isRated = currentRating > 0;
            const isCustomized = overallRating > 0 && currentRating > 0 && currentRating !== overallRating;
            
            return (
              <div
                key={category.id}
                className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                  isRated
                    ? 'border-rose-300 dark:border-rose-600 bg-rose-50/60 dark:bg-rose-900/25 shadow-md hover:shadow-lg'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-rose-200 dark:hover:border-rose-700 hover:bg-rose-50/30 dark:hover:bg-rose-900/10 hover:shadow-md'
                          }`}
                        >
                <div className="flex items-start space-x-2.5">
                  {/* Icon on Left - Larger and More Prominent */}
                  <div className="text-2xl flex-shrink-0">{category.emoji}</div>
                  
                  {/* Content on Right - Uses More Width */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex-1 min-w-0 pr-1">
                        <div className="text-xs font-bold text-gray-900 dark:text-gray-100 leading-tight mb-0.5">{category.name}</div>
                        <div className="text-[10px] text-gray-600 dark:text-gray-400 leading-tight mb-0.5">{category.description}</div>
                        <div className="text-[9px] text-rose-500 dark:text-rose-400 font-semibold">
                          Click to adjust
                    </div>
                  </div>
                      {/* Rating on Far Right - Always Visible */}
                      <div className="flex flex-col items-end flex-shrink-0 ml-1">
                        <span className={`text-[10px] font-bold ${
                          isRated 
                            ? 'text-rose-600 dark:text-rose-400' 
                            : 'text-gray-400 dark:text-gray-500'
                        }`}>
                          {currentRating > 0 ? `${currentRating.toFixed(1)}/5` : '0/5'}
                        </span>
                        {isCustomized && (
                          <span className="text-[9px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                            Customized
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Stars at Bottom - Larger and More Visible */}
                    <div className="flex items-center justify-start mt-1.5">
                      {renderCategoryStars(category.id, currentRating, 16)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile: Vertical List Layout */}
      <div className="md:hidden space-y-2.5">
        {categories.map((category) => {
          const currentRating = categoryRatings[category.id] || 0;
          const isRated = currentRating > 0;
          const isCustomized = overallRating > 0 && currentRating > 0 && currentRating !== overallRating;
          
          return (
            <div
              key={category.id}
              className={`p-3.5 rounded-xl border-2 transition-all duration-200 ${
                isRated
                  ? 'border-rose-300 dark:border-rose-600 bg-rose-50/60 dark:bg-rose-900/25 shadow-md'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-rose-200 dark:hover:border-rose-700'
                }`}
              >
              <div className="flex items-start space-x-3.5">
                {/* Icon on Left - Larger */}
                <div className="text-2xl flex-shrink-0">{category.emoji}</div>
                
                {/* Content on Right - Uses More Width */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="text-xs font-bold text-gray-900 dark:text-gray-100 mb-0.5">{category.name}</div>
                      <div className="text-[10px] text-gray-600 dark:text-gray-400 leading-tight mb-0.5">{category.description}</div>
                      <div className="text-[9px] text-rose-500 dark:text-rose-400 font-semibold">
                        Click to adjust
                  </div>
                      </div>
                    {/* Rating on Far Right - Always Visible */}
                    <div className="flex flex-col items-end flex-shrink-0 ml-2">
                      <span className={`text-xs font-bold ${
                        isRated 
                          ? 'text-rose-600 dark:text-rose-400' 
                          : 'text-gray-400 dark:text-gray-500'
                      }`}>
                        {currentRating > 0 ? `${currentRating.toFixed(1)}/5` : '0/5'}
                      </span>
                      {isCustomized && (
                        <span className="text-[9px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                          Customized
                        </span>
                  )}
                </div>
                </div>
                  {/* Stars at Bottom - More Visible */}
                  <div className="flex items-center justify-start mt-1.5">
                    {renderCategoryStars(category.id, currentRating, 20)}
                  </div>
                  </div>
                </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CustomerReviews = ({ productId, onPdpReviewOverlayChange }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReviewsList, setShowReviewsList] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [showReviewFormModal, setShowReviewFormModal] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showSortDropdownModal, setShowSortDropdownModal] = useState(false);
  const [showCategoryHelper, setShowCategoryHelper] = useState(false);
  const [sortBy, setSortBy] = useState('recent');
  const [filterBy, setFilterBy] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [userSubmittedRating, setUserSubmittedRating] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [newReview, setNewReview] = useState({
    overallRating: 0,
    selectedCategories: [],
    categoryRatings: {
      taste: 0,
      presentation: 0,
      freshness: 0,
      valueForMoney: 0,
      deliveryExperience: 0
    },
    reviewText: '',
    imageUrl: '',
    customer_name: '',
    customer_email: ''
  });

  // Check if user is logged in
  const checkUserLoginStatus = () => {
    // Check for authentication token or user data in localStorage/sessionStorage
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const userData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
    
    if (token || userData) {
      setIsLoggedIn(true);
      return true;
    }
    setIsLoggedIn(false);
    return false;
  };

  // Initial local state; will load from API
  const mockReviews = [
    {
      id: 1,
      customerName: 'Aditi S.',
      ratings: { taste: 5, presentation: 5, freshness: 4, valueForMoney: 4, deliveryExperience: 5, overall: 5 },
      reviewText: 'Absolutely loved this cake! The chocolate flavor was rich and the presentation was beautiful. Perfect for my daughter\'s birthday party. Everyone was asking where I got it from!',
      imageUrl: '/images/reviews/cake1.jpg',
      timestamp: '2 days ago',
      verifiedPurchase: true,
      helpful: 12
    },
    {
      id: 2,
      customerName: 'Rajesh K.',
      ratings: { taste: 4, presentation: 4, freshness: 5, valueForMoney: 5, deliveryExperience: 4, overall: 4 },
      reviewText: 'Great quality cake with fresh ingredients. The delivery was on time and packaging was excellent. Good value for money.',
      imageUrl: null,
      timestamp: '1 week ago',
      verifiedPurchase: true,
      helpful: 8
    },
    {
      id: 3,
      customerName: 'Priya M.',
      ratings: { taste: 5, presentation: 5, freshness: 5, valueForMoney: 4, deliveryExperience: 5, overall: 5 },
      reviewText: 'The cake looked even better than the photos! Everyone at the party loved it. Will definitely order again for future celebrations.',
      imageUrl: '/images/reviews/cake2.jpg',
      timestamp: '2 weeks ago',
      verifiedPurchase: true,
      helpful: 15
    },
    {
      id: 4,
      customerName: 'Sneha P.',
      ratings: { taste: 5, presentation: 4, freshness: 5, valueForMoney: 5, deliveryExperience: 4, overall: 5 },
      reviewText: 'Amazing cake! The taste was perfect and it was so fresh. Great value for money and the delivery was smooth.',
      imageUrl: null,
      timestamp: '3 weeks ago',
      verifiedPurchase: true,
      helpful: 6
    },
    {
      id: 5,
      customerName: 'Vikram S.',
      ratings: { taste: 4, presentation: 5, freshness: 4, valueForMoney: 4, deliveryExperience: 5, overall: 4 },
      reviewText: 'Beautiful presentation and good taste. The delivery experience was excellent. Would recommend to others.',
      imageUrl: '/images/reviews/cake3.jpg',
      timestamp: '1 month ago',
      verifiedPurchase: true,
      helpful: 9
    },
    {
      id: 6,
      customerName: 'Meera R.',
      ratings: { taste: 5, presentation: 5, freshness: 5, valueForMoney: 5, deliveryExperience: 5, overall: 5 },
      reviewText: 'Perfect cake for our anniversary! Everything was just right - taste, presentation, freshness. Creamingo never disappoints!',
      imageUrl: null,
      timestamp: '1 month ago',
      verifiedPurchase: true,
      helpful: 11
    }
  ];

  const [overallStats, setOverallStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingBreakdown: {
      taste: 0,
      presentation: 0,
      freshness: 0,
      valueForMoney: 0,
      deliveryExperience: 0
    }
  });

  // Categories for smart selection
  const categories = [
    { id: 'taste', name: 'Taste', emoji: '🍰', description: 'How did it taste?' },
    { id: 'presentation', name: 'Presentation', emoji: '🎂', description: 'How did it look?' },
    { id: 'freshness', name: 'Freshness', emoji: '🧁', description: 'How fresh was it?' },
    { id: 'valueForMoney', name: 'Value for Money', emoji: '💰', description: 'Worth the price?' },
    { id: 'deliveryExperience', name: 'Delivery', emoji: '🚚', description: 'How was the delivery?' }
  ];

  useEffect(() => {
    const load = async () => {
      try {
        // Check user login status
        checkUserLoginStatus();
        
        const data = await productApi.getProductReviews(productId, 1, 10);
        const list = data?.data?.reviews || [];
        setReviews(list.length ? list : []);
        const apiAvg = Number(data?.data?.avg_rating);
        const avgFromPage =
          list.length > 0
            ? Math.round(
                (list.reduce((sum, r) => sum + Number(r.rating || 0), 0) / list.length) * 10
              ) / 10
            : 0;
        const averageRating =
          Number.isFinite(apiAvg) && apiAvg > 0 ? apiAvg : avgFromPage;
        setOverallStats({
          averageRating,
          totalReviews: data?.data?.pagination?.total || list.length || 0,
          ratingBreakdown: data?.data?.ratingBreakdown || {
            taste: 0,
            presentation: 0,
            freshness: 0,
            valueForMoney: 0,
            deliveryExperience: 0
          }
        });
      } catch (e) {
        // fallback: show empty state
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [productId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSortDropdown && !event.target.closest('.sort-dropdown-container')) {
        setShowSortDropdown(false);
      }
      if (showSortDropdownModal && !event.target.closest('.sort-dropdown-modal-container')) {
        setShowSortDropdownModal(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSortDropdown, showSortDropdownModal]);

  useEffect(() => {
    if (!showReviewsModal && !showReviewFormModal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showReviewsModal, showReviewFormModal]);

  useEffect(() => {
    const open = Boolean(showReviewsModal || showReviewFormModal);
    onPdpReviewOverlayChange?.(open);
    return () => {
      onPdpReviewOverlayChange?.(false);
    };
  }, [showReviewsModal, showReviewFormModal, onPdpReviewOverlayChange]);

  const handleSortChange = (value) => {
    setSortBy(value);
    setShowSortDropdown(false);
    setShowSortDropdownModal(false);
  };

  const getSortLabel = (value) => {
    switch (value) {
      case 'recent':
        return 'Most Recent';
      case 'top-rated':
        return 'Top Rated';
      case 'with-photos':
        return 'With Photos';
      default:
        return 'Most Recent';
    }
  };

  const renderStars = (rating, size = 14, interactive = false, onRatingChange = null) => {
    const starSize = size === 14 ? 'w-4 h-4' : size === 16 ? 'w-4 h-4' : 'w-5 h-5';
    return (
      <div className="flex items-center space-x-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const fillRatio = Math.max(0, Math.min(1, rating - (star - 1)));
          const isFilled = fillRatio >= 1;
          const isPartial = fillRatio > 0 && fillRatio < 1;
          const uniqueId = `star-${star}-${rating.toFixed(1)}`;
          
          return (
          <button
            key={star}
            onClick={() => interactive && onRatingChange && onRatingChange(star)}
              className={`transition-all duration-200 ${
              interactive ? 'hover:scale-110 cursor-pointer' : 'cursor-default'
            }`}
            disabled={!interactive}
          >
              <svg
                className={starSize}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {isPartial && (
                  <defs>
                    <linearGradient id={uniqueId} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset={`${fillRatio * 100}%`} stopColor="#fbbf24" />
                      <stop offset={`${fillRatio * 100}%`} stopColor="#e5e7eb" />
                    </linearGradient>
                  </defs>
                )}
                <path
                  d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                  fill={
                    isFilled
                      ? '#fbbf24'
                      : isPartial
                      ? `url(#${uniqueId})`
                      : '#e5e7eb'
                  }
                  className={isFilled ? 'drop-shadow-sm' : ''}
            />
              </svg>
          </button>
          );
        })}
      </div>
    );
  };

  const renderRatingBar = (label, rating, emoji) => (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{emoji}</span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-400">{label}</span>
      </div>
      <div className="flex items-center space-x-2">
        <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-pink-400 to-rose-500 dark:from-pink-500 dark:to-rose-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(rating / 5) * 100}%` }}
          />
        </div>
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 w-8">{rating}</span>
      </div>
    </div>
  );

  /** Compact single-row breakdown for the All Reviews sheet / modal */
  const renderRatingBarSheet = (label, rating, emoji, barGradient) => {
    const r = Math.min(5, Math.max(0, Number(rating) || 0));
    const pct = (r / 5) * 100;
    return (
      <div className="flex items-center gap-2 border-b border-rose-100/40 py-2 last:border-0 dark:border-gray-600/35">
        <div
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-white text-sm shadow-sm ring-1 ring-rose-100/60 dark:bg-gray-700/50 dark:ring-gray-600/50"
          aria-hidden
        >
          {emoji}
        </div>
        <span className="max-w-[34%] flex-shrink-0 truncate text-[11px] font-semibold leading-tight text-gray-800 dark:text-gray-100 sm:max-w-[9rem]">
          {label}
        </span>
        <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-100 ring-1 ring-black/[0.04] dark:bg-gray-600/70 dark:ring-white/[0.05]">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${barGradient} shadow-[0_0_10px_-2px_rgba(244,63,94,0.4)] transition-all duration-700 ease-out`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="w-9 flex-shrink-0 text-right text-[11px] font-bold tabular-nums text-rose-600 dark:text-rose-400">
          {r.toFixed(1)}
          <span className="font-medium text-gray-400 dark:text-gray-500">/5</span>
        </span>
      </div>
    );
  };

  const handleOverallRatingChange = (rating) => {
    // Reset submitted state when user starts rating again
    if (reviewSubmitted) {
      setReviewSubmitted(false);
      setUserSubmittedRating(0);
    }
    
    setNewReview(prev => {
      // When overall rating is set, auto-set all category ratings to the same value
      // This makes it clear that all categories are pre-filled
      const newCategoryRatings = {
        taste: rating,
        presentation: rating,
        freshness: rating,
        valueForMoney: rating,
        deliveryExperience: rating
      };
      
      // Auto-select all categories when overall rating is set
      const allCategories = ['taste', 'presentation', 'freshness', 'valueForMoney', 'deliveryExperience'];
      
      return {
        ...prev,
        overallRating: rating,
        categoryRatings: newCategoryRatings,
        selectedCategories: allCategories
      };
    });
    
    // Show helper message when overall rating is set
    setShowCategoryHelper(true);
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setShowCategoryHelper(false);
    }, 5000);
  };

  const handleCategoryToggle = (categoryId) => {
    // No longer needed since categories are always visible, but keeping for backward compatibility
    // Categories are now always visible, so this function can be a no-op or handle selection state if needed
  };

  const handleCategoryRatingChange = (category, rating) => {
    // Reset submitted state when user starts rating again
    if (reviewSubmitted) {
      setReviewSubmitted(false);
      setUserSubmittedRating(0);
    }
    
    setNewReview(prev => {
      const newCategoryRatings = {
        ...prev.categoryRatings,
        [category]: rating
      };
      
      // Auto-add category to selectedCategories if it has a rating
      const newSelectedCategories = prev.selectedCategories.includes(category)
        ? prev.selectedCategories
        : [...prev.selectedCategories, category];
      
      // Calculate new overall rating based on RATED categories only
      // If user rates individual categories, calculate average of rated categories
      const ratedCategories = newSelectedCategories.filter(catId => newCategoryRatings[catId] > 0);
      
      let newOverallRating = prev.overallRating;
      
      if (ratedCategories.length > 0) {
        // Calculate average of rated categories
        const totalRating = ratedCategories.reduce((sum, catId) => {
        return sum + (newCategoryRatings[catId] || 0);
      }, 0);
        newOverallRating = totalRating / ratedCategories.length;
      }
      
      return {
        ...prev,
        selectedCategories: newSelectedCategories,
        categoryRatings: newCategoryRatings,
        overallRating: newOverallRating
      };
    });
  };

  // Calculate overall rating based on the logic flow:
  // 1. When overall rating is set, all category ratings are auto-set to that value
  // 2. When any category rating is manually adjusted, overall rating recalculates as average of rated categories
  // 3. For logged-in users who have submitted a review, show their submitted rating
  const calculateOverallRating = () => {
    // For logged-in users who have submitted a review, show their submitted rating
    if (isLoggedIn && reviewSubmitted && userSubmittedRating > 0) {
      return userSubmittedRating;
    }
    
    // Get all rated categories
    const ratedCategories = newReview.selectedCategories.filter(catId => 
      newReview.categoryRatings[catId] > 0
    );
    
    // If any category has been rated, calculate average of rated categories
    if (ratedCategories.length > 0) {
      const totalRating = ratedCategories.reduce((sum, categoryId) => {
        return sum + (newReview.categoryRatings[categoryId] || 0);
      }, 0);
      return totalRating / ratedCategories.length;
    }
    
    // If no categories rated, use the overall rating (from main star selection)
    return newReview.overallRating;
  };

  const handleSubmitReview = async () => {
    setIsSubmitting(true);
    try {
      // Build category ratings object
      let categoryRatings = {};
      let selectedCategories = newReview.selectedCategories;
      
      if (newReview.selectedCategories.length === 0 && newReview.overallRating > 0) {
        // If no categories selected but overall rating given, use all categories with overall rating
        selectedCategories = ['taste', 'presentation', 'freshness', 'valueForMoney', 'deliveryExperience'];
        categoryRatings = {
          taste: newReview.overallRating,
          presentation: newReview.overallRating,
          freshness: newReview.overallRating,
          valueForMoney: newReview.overallRating,
          deliveryExperience: newReview.overallRating
        };
      } else {
        // Use selected categories
        newReview.selectedCategories.forEach(categoryId => {
          if (newReview.categoryRatings[categoryId] > 0) {
            categoryRatings[categoryId] = newReview.categoryRatings[categoryId];
          }
        });
      }

      const payload = {
        customer_name: newReview.customer_name || 'Guest',
        customer_email: newReview.customer_email || '',
        overall_rating: calculateOverallRating(),
        manual_overall_rating: newReview.overallRating,
        selected_categories: selectedCategories,
        category_ratings: categoryRatings,
        review_text: newReview.reviewText,
        image_url: newReview.imageUrl || undefined
      };
      
      await productApi.submitProductReview(productId, payload);
      setReviewSubmitted(true);
      
      // Store user's submitted rating for logged-in users
      if (isLoggedIn) {
        setUserSubmittedRating(calculateOverallRating());
      }
      
      alert('Your review made our day! 💖 Thanks for sharing your experience. It will show once approved.');
      
      // Collapse form after submission
      setShowReviewForm(false);
      // Close modal on mobile
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        setShowReviewFormModal(false);
      }
      
      // Reload reviews list
      const data = await productApi.getProductReviews(productId, 1, 10);
      setReviews(data?.data?.reviews || []);
    } catch (e) {
      alert('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }

    // Reset form
    setNewReview({
      overallRating: 0,
      selectedCategories: [],
      categoryRatings: {
        taste: 0,
        presentation: 0,
        freshness: 0,
        valueForMoney: 0,
        deliveryExperience: 0
      },
      reviewText: '',
      imageUrl: '',
      customer_name: '',
      customer_email: ''
    });
  };

  const formatTimeAgo = (timestamp) => {
    return timestamp; // For demo purposes, return as is
  };

  // Get preview reviews (top 2-3 most recent/helpful)
  const previewReviews = reviews.slice(0, 2);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-xl dark:shadow-black/20 border border-gray-200 dark:border-gray-700 p-3 sm:p-4 scroll-mt-20">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="customer-reviews" className="bg-white dark:bg-gray-800 rounded-xl border-l-4 border-amber-500 dark:border-amber-400 border border-gray-200 dark:border-gray-700 shadow-lg dark:shadow-xl dark:shadow-black/30 scroll-mt-20 overflow-hidden transition-all duration-300 hover:shadow-xl dark:hover:shadow-2xl dark:hover:shadow-black/40 hover:border-amber-400 dark:hover:border-amber-300">
      {/* Header Section */}
      <div className="p-3.5 sm:p-4 lg:p-5">
        <div className="flex items-center gap-2 pb-2.5 border-b border-gray-200 dark:border-gray-700 mb-3.5">
          <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30">
            <Star className="w-4 h-4 text-amber-600 dark:text-amber-400 fill-amber-600 dark:fill-amber-400" />
          </div>
          <h3 className="text-[15px] sm:text-lg font-semibold text-gray-900 dark:text-gray-100 tracking-tight">Customer Reviews</h3>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
          {/* Left Side - Rating */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                {renderStars(overallStats.averageRating || 0, 14)}
                <span className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">
                  {overallStats.averageRating ? overallStats.averageRating.toFixed(1) : '0.0'}
                </span>
              </div>
              {/* Right Side - Actions (Mobile: same row as stars) */}
              <div className="flex items-center gap-2 sm:hidden">
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                      setShowReviewFormModal(true);
                    } else {
                      setShowReviewForm(!showReviewForm);
                    }
                  }}
                  className="text-[13px] font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors"
                >
                  Write Review
                </button>
                <span className="text-gray-300 dark:text-gray-600 text-xs">•</span>
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                      setShowReviewsModal(true);
                    } else {
                      setShowReviewsList(!showReviewsList);
                    }
                  }}
                  className="text-[13px] font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors"
                >
                  View All
                </button>
              </div>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 sm:ml-0">
              ({overallStats.totalReviews} {overallStats.totalReviews === 1 ? 'review' : 'reviews'})
            </span>
          </div>
          {/* Right Side - Actions (Desktop) */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => {
                if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                  setShowReviewFormModal(true);
                } else {
                  // Laptop: Close View All if open, toggle Write Review
                  if (showReviewsList) {
                    setShowReviewsList(false);
                  }
                  setShowReviewForm(!showReviewForm);
                }
              }}
              className="text-[13px] font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors"
            >
              Write Review
            </button>
            <span className="text-gray-300 dark:text-gray-600 text-xs">•</span>
            <button
              onClick={() => {
                if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                  setShowReviewsModal(true);
                } else {
                  // Laptop: Close Write Review if open, toggle View All
                  if (showReviewForm) {
                    setShowReviewForm(false);
                  }
                  setShowReviewsList(!showReviewsList);
                }
              }}
              className="text-[13px] font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors"
            >
              View All
            </button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="px-3.5 sm:px-4 lg:px-5 pb-3.5 sm:pb-4 lg:pb-5 bg-white dark:bg-gray-800">
        <div className="space-y-3">

          {/* Review Previews - Always Visible (2 reviews) */}
          {previewReviews.length > 0 && (
            <div className="space-y-3">
              {previewReviews.map((review) => (
                <div key={review.id} className="bg-gray-50/50 dark:bg-gray-700/30 rounded-xl p-3 sm:p-3.5 border border-gray-200/60 dark:border-gray-600/60 hover:border-gray-300 dark:hover:border-gray-500 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-rose-500 dark:from-pink-500 dark:to-rose-600 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                        {(review.customerName || review.customer_name || 'G').charAt(0).toUpperCase()}
            </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {review.customerName || review.customer_name || 'Guest User'}
                          </h5>
                          {renderStars(review.ratings?.overall || 0, 12)}
                          {(review.verifiedPurchase || review.is_verified_purchase) && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 flex-shrink-0">
                              ✓ Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                      {formatTimeAgo(review.timestamp || review.created_at)}
                    </span>
                  </div>
                  <p className="text-[13px] font-normal text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">
                    {review.reviewText || review.review_text || 'No review text provided.'}
                  </p>
                  {(review.imageUrl || review.image_url) && (
                    <div className="mt-2">
                      <Image
                        src={resolveImageUrl(review.imageUrl || review.image_url)}
                        alt="Review photo"
                        width={80}
                        height={60}
                        className="rounded object-cover"
                        loading="lazy"
                        unoptimized
                      />
                    </div>
                  )}
                </div>
              ))}
              
              {/* View All Reviews Link */}
              {reviews.length > 2 && (
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                      setShowReviewsModal(true);
                    } else {
                      setShowReviewsList(!showReviewsList);
                    }
                  }}
                  className="w-full text-center text-[13px] font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 py-2 transition-colors"
                >
                  View All {overallStats.totalReviews} Reviews
                </button>
              )}
            </div>
          )}

          {/* Empty State for Reviews */}
          {previewReviews.length === 0 && (
            <div className="text-center py-5">
              <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mb-3">No reviews yet. Be the first to review!</p>
            </div>
          )}

          {/* Write a Review Section - Collapsible */}
          {showReviewForm && (
            <div className="bg-gradient-to-br from-rose-50/50 via-pink-50/30 to-rose-50/50 dark:from-rose-900/10 dark:via-pink-900/5 dark:to-rose-900/10 rounded-xl border-2 border-gray-400 dark:border-gray-500 p-4 sm:p-5 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
                    Rate your experience
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Share your thoughts and help others decide
                  </p>
                </div>
                {/* Close Button - Desktop Only */}
                <button
                  onClick={() => setShowReviewForm(false)}
                  className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-200 hover:scale-110 shadow-sm"
                  aria-label="Close review form"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

           <div className="space-y-3 sm:space-y-4">
            {/* Overall Rating */}
            <div className="space-y-2">
              <div className="text-center">
                <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  How would you rate this product?
                </p>
              </div>
              <div className="flex items-center justify-center space-x-1.5">
                {[1, 2, 3, 4, 5].map((star) => {
                  const currentOverallRating = calculateOverallRating();
                  const isFullyFilled = star <= Math.floor(currentOverallRating);
                  const isPartiallyFilled = star > Math.floor(currentOverallRating) && star <= Math.ceil(currentOverallRating) && currentOverallRating % 1 !== 0;
                  const fillPercentage = isPartiallyFilled ? (currentOverallRating % 1) * 100 : 0;
                  
                  return (
                    <button
                      key={star}
                      onClick={() => handleOverallRatingChange(star)}
                      disabled={isLoggedIn && reviewSubmitted}
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl transition-all duration-200 flex items-center justify-center relative overflow-hidden group ${
                        isLoggedIn && reviewSubmitted 
                          ? 'cursor-default' 
                          : 'cursor-pointer hover:scale-105'
                      } ${
                        isFullyFilled 
                          ? 'bg-gradient-to-br from-amber-400 to-amber-500 dark:from-amber-500 dark:to-amber-600 shadow-md shadow-amber-200/50 dark:shadow-amber-900/30 border-2 border-amber-300 dark:border-amber-600' 
                          : 'bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 group-hover:border-amber-300 dark:group-hover:border-amber-600 shadow-sm'
                      }`}
                    >
                      {/* Partial fill using mask */}
                      {isPartiallyFilled && (
                        <div 
                          className="absolute inset-0 bg-gradient-to-br from-amber-400 to-amber-500 dark:from-amber-500 dark:to-amber-600"
                          style={{
                            clipPath: `polygon(0 0, ${fillPercentage}% 0, ${fillPercentage}% 100%, 0 100%)`
                          }}
                        />
                      )}
                      <svg
                        className="w-5 h-5 sm:w-6 sm:h-6 relative z-10"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                          fill={
                            isFullyFilled || isPartiallyFilled
                              ? '#ffffff'
                              : '#d1d5db'
                          }
                          className={isFullyFilled ? 'drop-shadow-sm' : ''}
                      />
                      </svg>
                    </button>
                  );
                })}
              </div>
              {calculateOverallRating() > 0 && (
                <div className="text-center space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/80 dark:bg-gray-800/80 rounded-full border border-amber-200 dark:border-amber-800">
                    <span className="text-xs sm:text-sm font-semibold text-amber-600 dark:text-amber-400">
                      {calculateOverallRating().toFixed(1)}
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">/ 5</span>
                    {isLoggedIn && reviewSubmitted && (
                      <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">✓</span>
                    )}
                  </div>
                  {newReview.selectedCategories.filter(catId => newReview.categoryRatings[catId] > 0).length > 0 && (
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                      Based on {newReview.selectedCategories.filter(catId => newReview.categoryRatings[catId] > 0).length} rated categor{newReview.selectedCategories.filter(catId => newReview.categoryRatings[catId] > 0).length === 1 ? 'y' : 'ies'}
                    </p>
                  )}
                  {showCategoryHelper && (
                    <div className="mt-1 px-2.5 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg transition-opacity duration-300 opacity-100">
                      <p className="text-[10px] text-blue-700 dark:text-blue-300 font-medium">
                        Categories pre-filled to {newReview.overallRating.toFixed(1)} - You can adjust each one individually below
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Smart Category Selection */}
            <CategorySelector
              selectedCategories={newReview.selectedCategories}
              onCategoryToggle={handleCategoryToggle}
              categories={categories}
              categoryRatings={newReview.categoryRatings}
              onCategoryRatingChange={handleCategoryRatingChange}
              overallRating={newReview.overallRating}
            />

            {/* Review Text */}
            <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
                  Write something sweet... <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
              </label>
              <textarea
                value={newReview.reviewText}
                onChange={(e) => setNewReview(prev => ({ ...prev, reviewText: e.target.value }))}
                  className="w-full px-3 py-2 text-sm font-normal border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-rose-400/30 dark:focus:ring-rose-500/30 focus:border-rose-400 dark:focus:border-rose-500 resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all shadow-sm focus:shadow-md"
                  rows={3}
                  placeholder="Share your experience with this product..."
              />
            </div>

            {/* Image Upload */}
            <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
                  Add photo 📸 <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
              </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center hover:border-rose-400 dark:hover:border-rose-500 hover:bg-rose-50/30 dark:hover:bg-rose-900/10 transition-all cursor-pointer bg-white dark:bg-gray-800 shadow-sm hover:shadow">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mb-2">
                      <Camera className="w-5 h-5 text-rose-500 dark:text-rose-400" />
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Click to upload or drag and drop</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">PNG, JPG up to 10MB</p>
                  </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmitReview}
              disabled={calculateOverallRating() === 0 || isSubmitting || reviewSubmitted}
                className={`w-full py-3.5 sm:py-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 text-xs sm:text-sm font-semibold ${
                calculateOverallRating() === 0
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : reviewSubmitted
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-2 border-green-200 dark:border-green-800 cursor-default'
                  : isSubmitting
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-2 border-blue-200 dark:border-blue-800 cursor-not-allowed'
                    : 'bg-gradient-to-r from-rose-500 via-pink-500 to-rose-500 dark:from-rose-600 dark:via-pink-600 dark:to-rose-600 text-white hover:from-rose-600 hover:via-pink-600 hover:to-rose-600 dark:hover:from-rose-500 dark:hover:via-pink-500 dark:hover:to-rose-500 shadow-md hover:shadow-lg'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>
                {reviewSubmitted
                    ? 'Submitted! ✓'
                  : isSubmitting
                    ? 'Submitting...'
                  : calculateOverallRating() === 0 
                    ? 'Rate to Submit' 
                  : 'Submit Review'
                }
              </span>
            </button>
          </div>
        </div>
          )}

          {/* Review Display Section - Desktop Expandable */}
          {showReviewsList && typeof window !== 'undefined' && window.innerWidth >= 1024 && (
            <div className="space-y-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              {/* Close Button - Desktop Only */}
              <div className="flex justify-end">
          <button
                  onClick={() => setShowReviewsList(false)}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-200 hover:scale-110 shadow-sm"
                  aria-label="Close reviews list"
          >
                  <X className="w-5 h-5" />
          </button>
        </div>
          {/* Overall Rating Summary */}
              <div className="bg-gray-50/50 dark:bg-gray-700/30 rounded-xl border border-gray-200/60 dark:border-gray-600/60 p-4 sm:p-5">
            <h4 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Rating Breakdown</h4>
            <div className="space-y-1">
              {renderRatingBar('Taste', overallStats.ratingBreakdown.taste, '🍰')}
              {renderRatingBar('Presentation', overallStats.ratingBreakdown.presentation, '🎂')}
              {renderRatingBar('Freshness', overallStats.ratingBreakdown.freshness, '🧁')}
              {renderRatingBar('Value for Money', overallStats.ratingBreakdown.valueForMoney, '💰')}
              {renderRatingBar('Delivery Experience', overallStats.ratingBreakdown.deliveryExperience, '🚚')}
            </div>
          </div>

          {/* Reviews List */}
              <div className="bg-gray-50/50 dark:bg-gray-700/30 rounded-xl border border-gray-200/60 dark:border-gray-600/60 p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">All Reviews</h4>
                  
                  {/* Custom Sort Dropdown */}
                  <div className="relative sort-dropdown-container">
                    <button
                      onClick={() => setShowSortDropdown(!showSortDropdown)}
                      className="flex items-center justify-between h-10 min-w-[160px] bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-3 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 cursor-pointer shadow-sm hover:shadow"
                    >
              <div className="flex items-center space-x-2">
                        <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {getSortLabel(sortBy)}
                        </span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform duration-300 flex-shrink-0 ${showSortDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {showSortDropdown && (
                      <div className="absolute top-full right-0 mt-2 min-w-[160px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg dark:shadow-black/30 z-20 overflow-hidden">
                        <div className="py-1">
                          <button
                            onClick={() => handleSortChange('recent')}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-all duration-200 flex items-center justify-between ${
                              sortBy === 'recent' 
                                ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-semibold border-l-2 border-rose-500 dark:border-rose-400' 
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            }`}
                          >
                            <span>Most Recent</span>
                            {sortBy === 'recent' && (
                              <div className="w-2 h-2 rounded-full bg-rose-500 dark:bg-rose-400"></div>
                            )}
                          </button>
                          <button
                            onClick={() => handleSortChange('top-rated')}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-all duration-200 flex items-center justify-between ${
                              sortBy === 'top-rated' 
                                ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-semibold border-l-2 border-rose-500 dark:border-rose-400' 
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            }`}
                          >
                            <span>Top Rated</span>
                            {sortBy === 'top-rated' && (
                              <div className="w-2 h-2 rounded-full bg-rose-500 dark:bg-rose-400"></div>
                            )}
                          </button>
                          <button
                            onClick={() => handleSortChange('with-photos')}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-all duration-200 flex items-center justify-between ${
                              sortBy === 'with-photos' 
                                ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-semibold border-l-2 border-rose-500 dark:border-rose-400' 
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            }`}
                          >
                            <span>With Photos</span>
                            {sortBy === 'with-photos' && (
                              <div className="w-2 h-2 rounded-full bg-rose-500 dark:bg-rose-400"></div>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
              </div>
            </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {reviews && reviews.length > 0 ? reviews.map((review) => (
                    <div key={review.id} className="bg-white dark:bg-gray-800 border border-gray-200/60 dark:border-gray-700/60 rounded-xl p-4 sm:p-5 shadow-sm dark:shadow-md dark:shadow-black/10 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20 hover:border-gray-300 dark:hover:border-gray-600 transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-rose-500 dark:from-pink-500 dark:to-rose-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                    {(review.customerName || review.customer_name || 'G').charAt(0).toUpperCase()}
                  </div>
                  <div>
                            <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{review.customerName || review.customer_name || 'Guest User'}</h5>
                            <div className="flex items-center space-x-1.5">
                              {renderStars(review.ratings?.overall || 0, 12)}
                      {(review.verifiedPurchase || review.is_verified_purchase) && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                                  ✓ Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">{formatTimeAgo(review.timestamp || review.created_at)}</span>
              </div>

              {/* Rating Breakdown */}
                      <div className="grid grid-cols-2 gap-1.5 mb-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">🍰 Taste</span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{review.ratings?.taste || review.ratings?.overall || 0}/5</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">🎂 Presentation</span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{review.ratings?.presentation || review.ratings?.overall || 0}/5</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">🧁 Freshness</span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{review.ratings?.freshness || review.ratings?.overall || 0}/5</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">💰 Value</span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{review.ratings?.valueForMoney || review.ratings?.overall || 0}/5</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">🚚 Delivery</span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{review.ratings?.deliveryExperience || review.ratings?.overall || 0}/5</span>
                        </div>
                      </div>

                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-relaxed mb-3">{review.reviewText || review.review_text || 'No review text provided.'}</p>

                  {(review.imageUrl || review.image_url) && (
                    <div className="mb-3">
                      <Image
                        src={resolveImageUrl(review.imageUrl || review.image_url)}
                        alt="Review photo"
                        width={200}
                        height={150}
                        className="rounded-lg object-cover"
                        loading="lazy"
                        unoptimized
                      />
                    </div>
                  )}

                      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                          <button className="flex items-center space-x-1 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                            <ThumbsUp className="w-4 h-4" />
                            <span>Helpful ({review.helpful || 0})</span>
          </button>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="col-span-full text-center py-6">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No reviews available yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reviews modal: max-lg = bottom sheet (aligns with JS open below 1024px); lg+ = centered */}
      {showReviewsModal && (
        <div className="fixed inset-0 z-[65] lg:z-50 pointer-events-none">
          <div
            role="presentation"
            className="pointer-events-auto absolute inset-0 bg-black/50 backdrop-blur-[2px] lg:hidden"
            onClick={() => setShowReviewsModal(false)}
          />
          <div
            role="presentation"
            className="pointer-events-auto absolute inset-0 hidden bg-black/60 backdrop-blur-sm lg:block dark:bg-black/80"
            onClick={() => setShowReviewsModal(false)}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="pointer-events-auto absolute bottom-0 left-0 right-0 flex max-h-[min(88dvh,calc(100dvh-env(safe-area-inset-bottom,0px)))] flex-col overflow-hidden rounded-t-[1.25rem] bg-white pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-12px_48px_-8px_rgba(0,0,0,0.14)] ring-1 ring-black/[0.06] max-lg:bg-gradient-to-b max-lg:from-rose-50/95 max-lg:via-white max-lg:to-white dark:bg-gray-800 dark:shadow-[0_-12px_48px_-8px_rgba(0,0,0,0.55)] dark:ring-white/10 dark:max-lg:from-gray-800 dark:max-lg:via-gray-800 dark:max-lg:to-gray-900 lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:h-[80vh] lg:max-h-[90vh] lg:w-[calc(100%-2rem)] lg:max-w-4xl lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-2xl lg:pb-0 lg:shadow-2xl lg:ring-0 lg:border lg:border-gray-200 lg:dark:border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Bottom-sheet affordance (mobile / tablet) */}
            <div className="flex justify-center pt-1.5 pb-0.5 lg:hidden" aria-hidden>
              <div className="h-1 w-10 rounded-full bg-gray-300/90 dark:bg-gray-500/80" />
            </div>

            {/* Header */}
            <div className="flex items-start justify-between gap-2 px-4 pb-1.5 pt-0 lg:px-6 lg:pb-2 lg:pt-3">
              <div className="min-w-0 pr-1">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-rose-500 dark:text-rose-400">
                  Customer voices
                </p>
                <h3 className="text-lg font-bold leading-tight tracking-tight text-gray-900 dark:text-gray-100 lg:text-xl">
                  All reviews
                </h3>
                <p className="mt-0.5 text-[11px] leading-snug text-gray-500 dark:text-gray-400">
                  {overallStats.totalReviews}{' '}
                  {overallStats.totalReviews === 1 ? 'rating' : 'ratings'}
                  <span className="text-gray-300 dark:text-gray-600"> · </span>
                  Avg{' '}
                  <span className="font-semibold text-gray-700 dark:text-gray-200">
                    {overallStats.averageRating ? overallStats.averageRating.toFixed(1) : '—'}
                  </span>
                  {overallStats.averageRating ? (
                    <span className="text-gray-400 dark:text-gray-500">/5</span>
                  ) : null}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReviewsModal(false)}
                className="-mr-1 flex-shrink-0 rounded-full p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                aria-label="Close reviews modal"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex min-h-0 flex-1 flex-col space-y-3 overflow-y-auto overscroll-contain px-4 pb-4 pt-1 lg:space-y-4 lg:px-6 lg:pb-5 lg:pt-2">
              {/* Rating Breakdown */}
              <div className="rounded-xl bg-white/80 p-2.5 shadow-[0_2px_20px_-4px_rgba(244,63,94,0.1)] ring-1 ring-rose-100/70 backdrop-blur-sm dark:bg-gray-800/40 dark:shadow-none dark:ring-rose-900/25 lg:p-3">
                <div className="mb-0.5 flex items-baseline justify-between gap-2 px-0.5">
                  <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 lg:text-sm">Rating breakdown</h4>
                  <span className="text-[9px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    By category
                  </span>
                </div>
                <div className="mt-1">
                  {renderRatingBarSheet(
                    'Taste',
                    overallStats.ratingBreakdown.taste,
                    '🍰',
                    'from-amber-400 via-orange-400 to-rose-500'
                  )}
                  {renderRatingBarSheet(
                    'Presentation',
                    overallStats.ratingBreakdown.presentation,
                    '🎂',
                    'from-pink-400 via-rose-500 to-fuchsia-600'
                  )}
                  {renderRatingBarSheet(
                    'Freshness',
                    overallStats.ratingBreakdown.freshness,
                    '🧁',
                    'from-teal-400 via-emerald-400 to-cyan-500'
                  )}
                  {renderRatingBarSheet(
                    'Value for Money',
                    overallStats.ratingBreakdown.valueForMoney,
                    '💰',
                    'from-violet-400 via-purple-500 to-fuchsia-500'
                  )}
                  {renderRatingBarSheet(
                    'Delivery Experience',
                    overallStats.ratingBreakdown.deliveryExperience,
                    '🚚',
                    'from-sky-400 via-blue-500 to-indigo-600'
                  )}
                </div>
              </div>

              {/* Sort Options */}
              <div className="flex flex-row items-center gap-2">
                <span className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Sort
                </span>
                <div className="relative min-w-0 flex-1 sort-dropdown-modal-container sm:ml-auto sm:max-w-[220px]">
                  <button
                    type="button"
                    onClick={() => setShowSortDropdownModal(!showSortDropdownModal)}
                    className="flex h-9 w-full items-center justify-between gap-2 rounded-full border border-rose-200/70 bg-white/90 px-3 text-xs font-semibold text-gray-800 shadow-sm backdrop-blur-sm transition-all hover:border-rose-300 hover:shadow dark:border-rose-500/25 dark:bg-gray-700/90 dark:text-gray-100 dark:hover:border-rose-400/40"
                  >
                    <div className="flex min-w-0 items-center gap-1.5">
                      <Filter className="h-3.5 w-3.5 flex-shrink-0 text-rose-500 dark:text-rose-400" />
                      <span className="truncate">{getSortLabel(sortBy)}</span>
                    </div>
                    <ChevronDown
                      className={`h-3.5 w-3.5 flex-shrink-0 text-gray-500 transition-transform duration-300 dark:text-gray-400 ${showSortDropdownModal ? 'rotate-180' : ''}`}
                    />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showSortDropdownModal && (
                    <div className="absolute right-0 top-full z-20 mt-1.5 min-w-[168px] overflow-hidden rounded-xl border border-rose-100/80 bg-white/95 py-1 shadow-lg shadow-rose-200/15 ring-1 ring-black/5 backdrop-blur-md dark:border-gray-600 dark:bg-gray-800/95 dark:shadow-black/40">
                      <button
                        type="button"
                        onClick={() => handleSortChange('recent')}
                        className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors ${
                          sortBy === 'recent'
                            ? 'bg-rose-50 font-semibold text-rose-600 dark:bg-rose-950/40 dark:text-rose-300'
                            : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <span>Most recent</span>
                        {sortBy === 'recent' && (
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 dark:bg-rose-400" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSortChange('top-rated')}
                        className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors ${
                          sortBy === 'top-rated'
                            ? 'bg-rose-50 font-semibold text-rose-600 dark:bg-rose-950/40 dark:text-rose-300'
                            : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <span>Top rated</span>
                        {sortBy === 'top-rated' && (
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 dark:bg-rose-400" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSortChange('with-photos')}
                        className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors ${
                          sortBy === 'with-photos'
                            ? 'bg-rose-50 font-semibold text-rose-600 dark:bg-rose-950/40 dark:text-rose-300'
                            : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <span>With photos</span>
                        {sortBy === 'with-photos' && (
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 dark:bg-rose-400" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-2 lg:space-y-3">
          {reviews && reviews.length > 0 ? reviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-xl border border-gray-100/90 bg-white/90 p-3 shadow-sm ring-1 ring-black/[0.03] transition-all hover:border-rose-100 hover:shadow-md dark:border-gray-600/50 dark:bg-gray-800/50 dark:ring-white/[0.04] dark:hover:border-rose-900/40 lg:rounded-2xl lg:p-4"
                  >
                    <div className="mb-2 flex items-start justify-between lg:mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-rose-500 dark:from-pink-500 dark:to-rose-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                    {(review.customerName || review.customer_name || 'G').charAt(0).toUpperCase()}
                  </div>
                  <div>
                          <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{review.customerName || review.customer_name || 'Guest User'}</h5>
                          <div className="flex items-center space-x-1.5">
                            {renderStars(review.ratings?.overall || 0, 12)}
                      {(review.verifiedPurchase || review.is_verified_purchase) && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                                ✓ Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">{formatTimeAgo(review.timestamp || review.created_at)}</span>
              </div>

              {/* Rating Breakdown */}
                    <div className="grid grid-cols-2 gap-1.5 mb-3 text-[10px]">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">🍰 Taste</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{review.ratings?.taste || review.ratings?.overall || 0}/5</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">🎂 Presentation</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{review.ratings?.presentation || review.ratings?.overall || 0}/5</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">🧁 Freshness</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{review.ratings?.freshness || review.ratings?.overall || 0}/5</span>
                </div>
                <div className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">💰 Value</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{review.ratings?.valueForMoney || review.ratings?.overall || 0}/5</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">🚚 Delivery</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{review.ratings?.deliveryExperience || review.ratings?.overall || 0}/5</span>
                </div>
              </div>

                    <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">{review.reviewText || review.review_text || 'No review text provided.'}</p>

              {(review.imageUrl || review.image_url) && (
                      <div className="mb-3">
                  <Image
                    src={resolveImageUrl(review.imageUrl || review.image_url)}
                    alt="Review photo"
                    width={200}
                    height={150}
                    className="rounded-lg object-cover"
                    loading="lazy"
                    unoptimized
                  />
                </div>
              )}

                    <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-600">
                      <button className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                        <ThumbsUp className="w-3 h-3" />
                    <span>Helpful ({review.helpful || 0})</span>
                  </button>
              </div>
            </div>
          )) : (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-rose-200/70 bg-gradient-to-b from-rose-50/40 to-white px-4 py-7 text-center dark:border-rose-500/20 dark:from-rose-950/15 dark:to-gray-800/25 lg:rounded-2xl lg:py-10">
                    <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-rose-100 dark:bg-gray-800 dark:ring-gray-600 lg:mb-3 lg:h-12 lg:w-12">
                      <MessageCircle className="h-5 w-5 text-rose-400 dark:text-rose-500 lg:h-6 lg:w-6" strokeWidth={1.75} />
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 lg:text-base">No reviews yet</p>
                    <p className="mt-0.5 max-w-[240px] text-[11px] leading-snug text-gray-500 dark:text-gray-400 lg:text-xs">
                      Be the first to leave a review and help others choose.
                    </p>
                  </div>
          )}
              </div>
        </div>
          </motion.div>
        </div>
      )}

      {/* Write review: max-lg = bottom sheet; lg+ = centered */}
      {showReviewFormModal && (
        <div className="fixed inset-0 z-[65] lg:z-50 pointer-events-none">
          <div
            role="presentation"
            className="pointer-events-auto absolute inset-0 bg-black/50 backdrop-blur-[2px] lg:hidden"
            onClick={() => setShowReviewFormModal(false)}
          />
          <div
            role="presentation"
            className="pointer-events-auto absolute inset-0 hidden bg-black/60 backdrop-blur-sm lg:block dark:bg-black/80"
            onClick={() => setShowReviewFormModal(false)}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="pointer-events-auto absolute bottom-0 left-0 right-0 flex max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-bottom,0px)))] flex-col overflow-hidden rounded-t-2xl border-x border-t border-gray-200/90 bg-white shadow-[0_-12px_40px_rgba(0,0,0,0.12)] dark:border-gray-700 dark:bg-gray-800 dark:shadow-black/45 lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:h-[90vh] lg:max-h-[90vh] lg:w-[calc(100%-2rem)] lg:max-w-4xl lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-2xl lg:border lg:border-gray-200 lg:shadow-2xl dark:lg:border-gray-700 dark:lg:shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Write a Review</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Share your thoughts and help others decide</p>
              </div>
              <button
                onClick={() => setShowReviewFormModal(false)}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-200 hover:scale-110 shadow-sm"
                aria-label="Close review form modal"
              >
                <X className="w-5 h-5" />
                  </button>
                </div>

            {/* Modal Content - Scrollable */}
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain p-4 sm:p-5">
              <div className="bg-gradient-to-br from-rose-50/50 via-pink-50/30 to-rose-50/50 dark:from-rose-900/10 dark:via-pink-900/5 dark:to-rose-900/10 rounded-xl border-2 border-gray-400 dark:border-gray-500 p-4 sm:p-5 shadow-md">
                <div className="space-y-3 sm:space-y-4">
                  {/* Overall Rating */}
                  <div className="space-y-2">
                    <div className="text-center">
                      <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        How would you rate this product?
                      </p>
              </div>
                    <div className="flex items-center justify-center space-x-1.5">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const currentOverallRating = calculateOverallRating();
                        const isFullyFilled = star <= Math.floor(currentOverallRating);
                        const isPartiallyFilled = star > Math.floor(currentOverallRating) && star <= Math.ceil(currentOverallRating) && currentOverallRating % 1 !== 0;
                        const fillPercentage = isPartiallyFilled ? (currentOverallRating % 1) * 100 : 0;
                        
                        return (
                          <button
                            key={star}
                            onClick={() => handleOverallRatingChange(star)}
                            disabled={isLoggedIn && reviewSubmitted}
                            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl transition-all duration-200 flex items-center justify-center relative overflow-hidden group ${
                              isLoggedIn && reviewSubmitted 
                                ? 'cursor-default' 
                                : 'cursor-pointer hover:scale-105'
                            } ${
                              isFullyFilled 
                                ? 'bg-gradient-to-br from-amber-400 to-amber-500 dark:from-amber-500 dark:to-amber-600 shadow-md shadow-amber-200/50 dark:shadow-amber-900/30 border-2 border-amber-300 dark:border-amber-600' 
                                : 'bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 group-hover:border-amber-300 dark:group-hover:border-amber-600 shadow-sm'
                            }`}
                          >
                            {/* Partial fill using mask */}
                            {isPartiallyFilled && (
                              <div 
                                className="absolute inset-0 bg-gradient-to-br from-amber-400 to-amber-500 dark:from-amber-500 dark:to-amber-600"
                                style={{
                                  clipPath: `polygon(0 0, ${fillPercentage}% 0, ${fillPercentage}% 100%, 0 100%)`
                                }}
                              />
                            )}
                            <svg
                              className="w-5 h-5 sm:w-6 sm:h-6 relative z-10"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                                fill={
                                  isFullyFilled || isPartiallyFilled
                                    ? '#ffffff'
                                    : '#d1d5db'
                                }
                                className={isFullyFilled ? 'drop-shadow-sm' : ''}
                              />
                            </svg>
                          </button>
                        );
                      })}
            </div>
                    {calculateOverallRating() > 0 && (
                      <div className="text-center space-y-1">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/80 dark:bg-gray-800/80 rounded-full border border-amber-200 dark:border-amber-800">
                          <span className="text-xs sm:text-sm font-semibold text-amber-600 dark:text-amber-400">
                            {calculateOverallRating().toFixed(1)}
                          </span>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400">/ 5</span>
                          {isLoggedIn && reviewSubmitted && (
                            <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">✓</span>
                          )}
            </div>
                        {newReview.selectedCategories.filter(catId => newReview.categoryRatings[catId] > 0).length > 0 && (
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">
                            Based on {newReview.selectedCategories.filter(catId => newReview.categoryRatings[catId] > 0).length} rated categor{newReview.selectedCategories.filter(catId => newReview.categoryRatings[catId] > 0).length === 1 ? 'y' : 'ies'}
                          </p>
          )}
                        {showCategoryHelper && (
                          <div className="mt-1 px-2.5 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg transition-opacity duration-300 opacity-100">
                            <p className="text-[10px] text-blue-700 dark:text-blue-300 font-medium">
                              Categories pre-filled to {newReview.overallRating.toFixed(1)} - You can adjust each one individually below
                            </p>
        </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Smart Category Selection */}
                  <CategorySelector
                    selectedCategories={newReview.selectedCategories}
                    onCategoryToggle={handleCategoryToggle}
                    categories={categories}
                    categoryRatings={newReview.categoryRatings}
                    onCategoryRatingChange={handleCategoryRatingChange}
                    overallRating={newReview.overallRating}
                  />

                  {/* Review Text */}
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
                      Write something sweet... <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
                    </label>
                    <textarea
                      value={newReview.reviewText}
                      onChange={(e) => setNewReview(prev => ({ ...prev, reviewText: e.target.value }))}
                      className="w-full px-3 py-2 text-sm font-normal border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-rose-400/30 dark:focus:ring-rose-500/30 focus:border-rose-400 dark:focus:border-rose-500 resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all shadow-sm focus:shadow-md"
                      rows={3}
                      placeholder="Share your experience with this product..."
                    />
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
                      Add photo 📸 <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
                    </label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center hover:border-rose-400 dark:hover:border-rose-500 hover:bg-rose-50/30 dark:hover:bg-rose-900/10 transition-all cursor-pointer bg-white dark:bg-gray-800 shadow-sm hover:shadow">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mb-2">
                          <Camera className="w-5 h-5 text-rose-500 dark:text-rose-400" />
                        </div>
                        <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Click to upload or drag and drop</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">PNG, JPG up to 10MB</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit — pinned to bottom of sheet */}
            <div className="flex-shrink-0 border-t border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800 sm:p-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] lg:pb-4">
              <button
                type="button"
                onClick={handleSubmitReview}
                disabled={calculateOverallRating() === 0 || isSubmitting || reviewSubmitted}
                className={`w-full py-3.5 sm:py-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 text-xs sm:text-sm font-semibold ${
                  calculateOverallRating() === 0
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : reviewSubmitted
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-2 border-green-200 dark:border-green-800 cursor-default'
                    : isSubmitting
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-2 border-blue-200 dark:border-blue-800 cursor-not-allowed'
                    : 'bg-gradient-to-r from-rose-500 via-pink-500 to-rose-500 dark:from-rose-600 dark:via-pink-600 dark:to-rose-600 text-white hover:from-rose-600 hover:via-pink-600 hover:to-rose-600 dark:hover:from-rose-500 dark:hover:via-pink-500 dark:hover:to-rose-500 shadow-md hover:shadow-lg'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>
                  {reviewSubmitted
                      ? 'Submitted! ✓'
                    : isSubmitting
                      ? 'Submitting...'
                    : calculateOverallRating() === 0 
                      ? 'Rate to Submit' 
                    : 'Submit Review'
                  }
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CustomerReviews;
