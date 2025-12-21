'use client';

import { useState, useEffect, useCallback } from 'react';
import { Star, StarOff, Edit2, Trash2, Package, Image as ImageIcon } from 'lucide-react';
import SectionHeader from '../shared/SectionHeader';
import EmptyState from '../shared/EmptyState';
import reviewApi from '../../../../api/reviewApi';
import ReviewFormModal from '../ReviewFormModal';
import { useToast } from '../../../../contexts/ToastContext';

export default function ReviewsSection({ onBadgeUpdate }) {
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingReviews, setPendingReviews] = useState([]);
  const [publishedReviews, setPublishedReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedReviewItem, setSelectedReviewItem] = useState(null);
  const [editingReview, setEditingReview] = useState(null);
  const [ratingSubmitting, setRatingSubmitting] = useState({});
  const { showSuccess, showError } = useToast();

  // Define fetch functions first using useCallback
  const fetchPendingReviews = useCallback(async () => {
    try {
      const response = await reviewApi.getPendingReviews();
      if (response && response.success) {
        const pendingList = response.data?.pendingReviews || response.pendingReviews || [];
        setPendingReviews(Array.isArray(pendingList) ? pendingList : []);
      } else {
        // Handle case where response might be direct array or different format
        const pendingList = Array.isArray(response) ? response : (response?.data?.pendingReviews || []);
        setPendingReviews(pendingList);
      }
    } catch (error) {
      console.error('Error fetching pending reviews:', error);
      setPendingReviews([]);
    }
  }, []);

  const fetchPublishedReviews = useCallback(async () => {
    try {
      const response = await reviewApi.getMyReviews();
      if (response && response.success) {
        const reviewsList = response.data?.reviews || response.reviews || [];
        setPublishedReviews(Array.isArray(reviewsList) ? reviewsList : []);
      } else {
        const reviewsList = Array.isArray(response) ? response : (response?.data?.reviews || []);
        setPublishedReviews(reviewsList);
      }
    } catch (error) {
      console.error('Error fetching published reviews:', error);
      setPublishedReviews([]);
    }
  }, []);

  const fetchReviews = useCallback(async () => {
    try {
      setIsLoading(true);
      
      if (activeTab === 'pending') {
        await fetchPendingReviews();
      } else {
        await fetchPublishedReviews();
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      // Set empty arrays on error to prevent showing stale data
      if (activeTab === 'pending') {
        setPendingReviews([]);
      } else {
        setPublishedReviews([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, fetchPendingReviews, fetchPublishedReviews]);

  // Fetch both tabs data on initial load to ensure badge counts are accurate
  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([
        fetchPendingReviews(),
        fetchPublishedReviews()
      ]);
    };
    initializeData();
  }, [fetchPendingReviews, fetchPublishedReviews]);

  useEffect(() => {
    // Fetch reviews for the active tab
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    if (onBadgeUpdate) {
      onBadgeUpdate(pendingReviews.length > 0 ? pendingReviews.length : null);
    }
  }, [pendingReviews.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleWriteReview = (item) => {
    setSelectedReviewItem(item);
    setShowReviewForm(true);
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setShowReviewForm(true);
  };

  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      const response = await reviewApi.deleteReview(reviewId);
      if (response.success) {
        // Refresh both tabs to ensure consistency
        await Promise.all([
          fetchPendingReviews(),
          fetchPublishedReviews()
        ]);
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review. Please try again.');
    }
  };

  const handleReviewSubmitted = async () => {
    setShowReviewForm(false);
    setSelectedReviewItem(null);
    setEditingReview(null);
    // Refresh both tabs to ensure consistency
    await Promise.all([
      fetchPendingReviews(),
      fetchPublishedReviews()
    ]);
  };

  const handleRateProduct = async (item, rating) => {
    try {
      setRatingSubmitting(prev => ({ ...prev, [item.product_id]: true }));
      
      // Check if review already exists (rating-only)
      if (item.review_id) {
        // Update existing review with new rating
        await reviewApi.updateReview(item.review_id, { rating });
      } else {
        // Submit new review with rating only
        await reviewApi.submitReview({
          product_id: item.product_id,
          rating: rating,
          comment: null,
          title: null
        });
      }

      showSuccess(
        'Rating Saved!',
        'Your rating has been saved successfully.'
      );

      // Refresh both pending and published reviews to update UI
      // This ensures the product moves from Pending to Published Reviews
      await Promise.all([
        fetchPendingReviews(),
        fetchPublishedReviews()
      ]);
      
      // Automatically switch to Published Reviews tab to show the newly rated product
      setActiveTab('published');
    } catch (error) {
      console.error('Error submitting rating:', error);
      showError(
        'Failed to Save Rating',
        error.message || 'Please try again later.'
      );
    } finally {
      setRatingSubmitting(prev => {
        const newState = { ...prev };
        delete newState[item.product_id];
        return newState;
      });
    }
  };

  const tabs = [
    { id: 'pending', label: 'Pending Reviews', count: pendingReviews.length },
    { id: 'published', label: 'Published Reviews', count: publishedReviews.length }
  ];

  return (
    <>
      <SectionHeader 
        title="Reviews" 
        description="Share your experience and manage your reviews"
      />

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200 overflow-x-hidden">
        <div className="flex w-screen lg:w-auto -mx-4 sm:-mx-6 lg:mx-0 gap-0 lg:gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 lg:flex-none px-3 lg:px-4 py-2 font-inter text-xs lg:text-sm font-medium border-b-2 transition-colors whitespace-nowrap text-center flex items-center justify-center gap-1.5 lg:gap-2 ${
                activeTab === tab.id
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className="px-1.5 lg:px-2 py-0.5 rounded-full text-[10px] lg:text-xs bg-pink-100 text-pink-700 font-semibold flex-shrink-0">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'pending' ? (
        <PendingReviewsTab
          pendingReviews={pendingReviews}
          isLoading={isLoading}
          onWriteReview={handleWriteReview}
          onRateProduct={handleRateProduct}
          ratingSubmitting={ratingSubmitting}
        />
      ) : (
        <PublishedReviewsTab
          publishedReviews={publishedReviews}
          isLoading={isLoading}
          onEditReview={handleEditReview}
          onDeleteReview={handleDeleteReview}
        />
      )}

      {/* Review Form Modal */}
      {showReviewForm && (
        <ReviewFormModal
          isOpen={showReviewForm}
          onClose={() => {
            setShowReviewForm(false);
            setSelectedReviewItem(null);
            setEditingReview(null);
          }}
          reviewItem={selectedReviewItem}
          editingReview={editingReview}
          onSuccess={handleReviewSubmitted}
        />
      )}
    </>
  );
}

function PendingReviewsTab({ pendingReviews, isLoading, onWriteReview, onRateProduct, ratingSubmitting }) {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (pendingReviews.length === 0) {
    return (
      <EmptyState
        icon={Star}
        title="No Pending Reviews"
        description="You've reviewed all your orders. Thank you for your feedback!"
      />
    );
  }

  return (
    <div className="space-y-3 lg:space-y-4">
      {pendingReviews.map((item) => {
        const isSubmitting = ratingSubmitting[item.product_id] || false;

        return (
          <div
            key={item.id}
            className="bg-gradient-to-br from-white via-pink-50/30 to-rose-50/20 rounded-xl border-2 border-pink-200/60 shadow-[0_2px_6px_rgba(236,72,153,0.08)] p-3.5 lg:p-4 hover:shadow-[0_3px_10px_rgba(236,72,153,0.15)] hover:border-pink-300/80 transition-all duration-300"
          >
            <div className="flex items-start gap-3">
              {/* Product Image with enhanced styling */}
              <div className="w-16 h-16 lg:w-20 lg:h-20 bg-white rounded-lg overflow-hidden border border-pink-100/80 shadow-sm flex items-center justify-center flex-shrink-0">
                {item.product_image ? (
                  <img
                    src={item.product_image}
                    alt={item.product_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-8 h-8 text-pink-300" />
                )}
              </div>
              
              {/* Product Details */}
              <div className="flex-1 min-w-0">
                <h3 className="font-poppins text-xs lg:text-sm font-medium lg:font-bold text-gray-900 mb-1.5 leading-snug tracking-tight truncate">
                  {item.product_name}
                </h3>
                
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {item.order_number && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/90 border border-pink-100/70 rounded-md shadow-sm">
                      <Package className="w-2.5 h-2.5 text-pink-500" />
                      <span className="font-inter text-[10px] font-bold text-gray-800 tracking-wide uppercase">
                        #{item.order_number}
                      </span>
                    </span>
                  )}
                  {item.order_date && (
                    <span className="font-inter text-[10px] font-semibold text-gray-600 tracking-wide">
                      {new Date(item.order_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  )}
                </div>
                
                {/* Star Rating Component - Enhanced */}
                <div className="flex flex-col gap-1 mt-2">
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-0.5 bg-white/95 px-2 py-1 rounded-lg border border-pink-100/80 shadow-sm">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const isDisabled = isSubmitting;
                        
                        return (
                          <button
                            key={star}
                            onClick={() => !isDisabled && onRateProduct(item, star)}
                            disabled={isDisabled}
                            className={`transition-all duration-200 ${
                              isDisabled 
                                ? 'cursor-not-allowed opacity-60' 
                                : 'cursor-pointer hover:scale-110 active:scale-95'
                            }`}
                            title={isDisabled ? 'Submitting...' : `Rate ${star} star${star > 1 ? 's' : ''}`}
                          >
                            <Star
                              className={`w-3.5 h-3.5 lg:w-4 lg:h-4 transition-colors text-gray-300 hover:text-yellow-300`}
                            />
                          </button>
                        );
                      })}
                    </div>
                    {isSubmitting && (
                      <span className="ml-1.5 text-[10px] font-semibold text-pink-600 tracking-wide">Saving...</span>
                    )}
                  </div>
                  
                  {/* Write Detailed Review Link - Optional */}
                  <button
                    onClick={() => onWriteReview(item)}
                    className="inline-flex items-center gap-1 text-[10px] lg:text-[11px] text-gray-600 hover:text-gray-700 font-semibold hover:gap-1.5 transition-all w-fit tracking-wide"
                  >
                    <span>→</span>
                    <span>Write a detailed review (optional)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PublishedReviewsTab({ publishedReviews, isLoading, onEditReview, onDeleteReview }) {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (publishedReviews.length === 0) {
    return (
      <EmptyState
        icon={Star}
        title="No Published Reviews"
        description="You haven't published any reviews yet. Share your experience with others!"
      />
    );
  }

  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        className={`w-3.5 h-3.5 lg:w-4 lg:h-4 ${
          index < rating
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="space-y-3 lg:space-y-4">
      {publishedReviews.map((review) => (
        <div
          key={review.id}
          className="bg-gradient-to-br from-white via-pink-50/30 to-rose-50/20 rounded-xl border-2 border-pink-200/60 shadow-[0_2px_6px_rgba(236,72,153,0.08)] p-3.5 lg:p-4 hover:shadow-[0_3px_10px_rgba(236,72,153,0.15)] hover:border-pink-300/80 transition-all duration-300"
        >
          <div className="flex items-start gap-3">
            {/* Product Image with enhanced styling */}
            <div className="w-16 h-16 lg:w-20 lg:h-20 bg-white rounded-lg overflow-hidden border border-pink-100/80 shadow-sm flex items-center justify-center flex-shrink-0">
              {review.product_image ? (
                <img
                  src={review.product_image}
                  alt={review.product_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon className="w-8 h-8 text-pink-300" />
              )}
            </div>
            
            {/* Review Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-poppins text-xs lg:text-sm font-medium lg:font-bold text-gray-900 leading-snug tracking-tight truncate flex-1">
                  {review.product_name}
                </h3>
              </div>
              
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <div className="flex items-center gap-0.5 bg-white/95 px-2 py-1 rounded-lg border border-pink-100/80 shadow-sm">
                  {renderStars(review.rating)}
                </div>
                <span className="font-inter text-[10px] font-semibold text-gray-600 tracking-wide">
                  {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>

              {review.comment && (
                <p className="font-inter text-xs lg:text-sm text-gray-700 leading-relaxed tracking-wide mb-1.5">
                  {review.comment}
                </p>
              )}
              
              {/* Action Buttons Row - Write Detailed Review + Edit + Delete */}
              <div className="flex items-center gap-1.5 flex-wrap mt-1">
                {review.has_only_rating && (
                  <button
                    onClick={() => onEditReview(review)}
                    className="inline-flex items-center gap-1 text-[10px] lg:text-[11px] text-pink-600 hover:text-pink-700 font-bold hover:gap-1.5 transition-all"
                  >
                    <span className="text-pink-500 font-extrabold">→</span>
                    <span>Write a detailed review</span>
                  </button>
                )}
                
                {/* Edit and Delete Buttons */}
                <div className="flex items-center gap-1.5 ml-auto">
                  <button
                    onClick={() => onEditReview(review)}
                    className="p-1.5 bg-white/90 border border-gray-200/80 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                    title="Edit Review"
                  >
                    <Edit2 className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => onDeleteReview(review.id)}
                    className="p-1.5 bg-white/90 border border-gray-200/80 rounded-lg hover:bg-red-50 transition-colors shadow-sm"
                    title="Delete Review"
                  >
                    <Trash2 className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

