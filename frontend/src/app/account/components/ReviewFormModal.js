'use client';

import { useState, useEffect } from 'react';
import { X, Star, Loader2 } from 'lucide-react';
import reviewApi from '../../../api/reviewApi';
import { useToast } from '../../../contexts/ToastContext';

export default function ReviewFormModal({ isOpen, onClose, reviewItem, editingReview, onSuccess }) {
  const [rating, setRating] = useState(editingReview?.rating || 0);
  const [comment, setComment] = useState(editingReview?.comment || '');
  const [title, setTitle] = useState(editingReview?.title || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (editingReview) {
      setRating(editingReview.rating || 0);
      setComment(editingReview.comment || '');
      setTitle(editingReview.title || '');
    } else if (reviewItem) {
      // If reviewItem has existing rating, use it; otherwise start fresh
      setRating(reviewItem.existing_rating || 0);
      setComment('');
      setTitle('');
    }
  }, [editingReview, reviewItem]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!rating || rating < 1) {
      showError('Rating Required', 'Please select a rating');
      return;
    }

    try {
      setIsSubmitting(true);

      if (editingReview) {
        // Update existing review
        const response = await reviewApi.updateReview(editingReview.id, {
          rating,
          comment,
          title
        });

        if (response.success) {
          showSuccess('Review Updated', 'Your review has been updated successfully');
          onSuccess();
        }
      } else if (reviewItem) {
        // Check if review already exists (rating-only review)
        if (reviewItem.review_id) {
          // Update existing rating-only review with details
          const response = await reviewApi.updateReview(reviewItem.review_id, {
            rating: rating,
            comment: comment || null,
            title: title || null
          });

          if (response.success) {
            showSuccess('Review Updated', 'Your detailed review has been added successfully');
            onSuccess();
          }
        } else {
          // Create new review
          const response = await reviewApi.submitReview({
            product_id: reviewItem.product_id,
            rating,
            comment,
            title,
            order_item_id: reviewItem.id
          });

          if (response.success) {
            showSuccess('Review Submitted', response.message || 'Your review has been submitted successfully');
            onSuccess();
          }
        }
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      showError('Error', error.message || 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="font-poppins text-xl font-bold text-gray-900">
            {editingReview ? 'Edit Review' : 'Write a Review'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Product Info */}
          {(reviewItem || editingReview) && (
            <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
              <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={reviewItem?.product_image || editingReview?.product_image || '/placeholder.png'}
                  alt={reviewItem?.product_name || editingReview?.product_name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-poppins font-semibold text-gray-900">
                  {reviewItem?.product_name || editingReview?.product_name}
                </h3>
                {reviewItem?.order_number && (
                  <p className="font-inter text-sm text-gray-600">
                    Order #{reviewItem.order_number}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Rating */}
          <div className="mb-6">
            <label className="block font-inter text-sm font-medium text-gray-700 mb-3">
              Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= rating
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="mb-6">
            <label className="block font-inter text-sm font-medium text-gray-700 mb-2">
              Review Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your review a title"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-inter text-sm"
              maxLength={100}
            />
          </div>

          {/* Comment */}
          <div className="mb-6">
            <label className="block font-inter text-sm font-medium text-gray-700 mb-2">
              Your Review (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this product..."
              rows={6}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-inter text-sm resize-none"
              maxLength={500}
            />
            <p className="mt-1 text-xs text-gray-500 text-right">
              {comment.length}/500
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-inter text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !rating || rating < 1}
              className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg font-inter text-sm font-medium hover:from-pink-600 hover:to-rose-600 transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>{editingReview ? 'Update Review' : 'Submit Review'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

