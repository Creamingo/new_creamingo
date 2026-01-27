'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { resolveImageUrl } from '../../../../utils/imageUrl';

const ProductHero = ({ product, selectedVariant, isFavorite, onFavoriteToggle, onQuickShare }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const minSwipeDistance = 50;

  // Combine main image with gallery images
  const allImages = [
    product.image_url,
    ...(product.gallery_images || [])
  ]
    .filter(Boolean)
    .map((image) => resolveImageUrl(image));

  const handleImageSelect = (index) => {
    setSelectedImageIndex(index);
  };

  const handlePreviousImage = () => {
    setSelectedImageIndex(prev => 
      prev === 0 ? allImages.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setSelectedImageIndex(prev => 
      prev === allImages.length - 1 ? 0 : prev + 1
    );
  };

  const handleImageClick = () => {
    setIsZoomed(true);
  };

  const handleZoomClose = () => {
    setIsZoomed(false);
  };

  // Swipe gesture handlers
  const onTouchStart = (e) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      handleNextImage();
    } else if (isRightSwipe) {
      handlePreviousImage();
    }
  };

  if (!allImages.length) {
    return (
      <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-2xl flex items-center justify-center">
        <span className="text-gray-500 dark:text-gray-400">No image available</span>
      </div>
    );
  }

  return (
    <div className="space-y-2 lg:space-y-0 lg:flex lg:items-start lg:gap-4">
      {/* Thumbnails column on large screens */}
      {allImages.length > 1 && (
        <div className="hidden lg:flex lg:flex-col lg:justify-center lg:w-20 xl:w-24 lg:space-y-2">
          {allImages.map((image, index) => (
            <button
              key={index}
              onClick={() => handleImageSelect(index)}
              className={`relative w-full aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                selectedImageIndex === index
                  ? 'border-rose-500 dark:border-rose-400 ring-2 ring-rose-200 dark:ring-rose-900/30'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Image
                src={image}
                alt={`${product.name} ${index + 1}`}
                fill
                sizes="(max-width: 1024px) 0vw, 96px"
                className="object-cover"
                unoptimized
              />
            </button>
          ))}
        </div>
      )}

      {/* Main Image */}
      <div 
        className="relative flex-1 aspect-square bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-xl dark:shadow-black/20 group cursor-pointer"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <Image
          src={allImages[selectedImageIndex]}
          alt={product.name}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          onClick={handleImageClick}
          priority
          loading="eager"
          fetchPriority="high"
          unoptimized
        />

        {/* Bestseller Badge (overlay on image) */}
        {product.is_bestseller && (
          <div className="absolute left-4 top-4">
            <span className="inline-flex items-center px-3 py-1 text-xs font-semibold text-white bg-orange-500 dark:bg-orange-600 rounded-full shadow">
              Bestseller
            </span>
          </div>
        )}
        
        {/* Zoom Icon */}
        <div className="absolute top-4 right-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Search className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </div>

        {/* Navigation Arrows */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={handlePreviousImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-gray-700"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-gray-700"
            >
              <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          </>
        )}

        {/* Mobile: Wishlist and Share overlay */}
        <div className="absolute top-4 right-4 flex items-center space-x-2 sm:hidden">
          <button
            onClick={onFavoriteToggle}
            className={`w-10 h-10 rounded-full backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 flex items-center justify-center shadow ${isFavorite ? 'text-rose-600 dark:text-rose-400' : 'text-gray-700 dark:text-gray-300'}`}
            aria-label="Save to wishlist"
          >
            <svg className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
          <button
            onClick={onQuickShare}
            className="w-10 h-10 rounded-full backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 flex items-center justify-center shadow text-gray-700 dark:text-gray-300"
            aria-label="Share product"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
          </button>
        </div>

        {/* Image Counter */}
        {allImages.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 dark:bg-black/80 text-white px-2 py-0.5 rounded-full text-xs">
            {selectedImageIndex + 1} / {allImages.length}
          </div>
        )}
      </div>

      {/* Thumbnails: horizontal strip on mobile */}
      {allImages.length > 1 && (
        <>
          <div className="flex lg:hidden space-x-2 overflow-x-auto scrollbar-hide pb-0">
            {allImages.map((image, index) => (
              <button
                key={index}
                onClick={() => handleImageSelect(index)}
                className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                  selectedImageIndex === index
                    ? 'border-rose-500 dark:border-rose-400 ring-2 ring-rose-200 dark:ring-rose-900/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Image
                  src={image}
                  alt={`${product.name} ${index + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                  unoptimized
                />
              </button>
            ))}
          </div>
        </>
      )}

      {/* Zoom Modal */}
      {isZoomed && (
        <div 
          className="fixed inset-0 bg-black/90 dark:bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={handleZoomClose}
        >
          {/* Close Button - Above the image */}
          <button
            onClick={handleZoomClose}
            className="absolute top-4 right-4 min-w-[44px] min-h-[44px] bg-white/90 dark:bg-white/80 sm:bg-white/20 sm:dark:bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-900 dark:text-white sm:text-white hover:bg-white dark:hover:bg-white/90 sm:hover:bg-white/30 sm:dark:hover:bg-white/20 transition-colors z-10"
            aria-label="Close zoom"
          >
            <svg className="w-6 h-6 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="relative max-w-4xl max-h-full">
            <Image
              src={allImages[selectedImageIndex]}
              alt={product.name}
              width={800}
              height={800}
              className="object-contain max-h-[90vh] rounded-lg"
              onClick={(e) => e.stopPropagation()}
              unoptimized
            />

            {/* Navigation in Zoom - Enhanced touch targets and swipe support */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreviousImage();
                  }}
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                  className="absolute left-4 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 dark:hover:bg-white/20 transition-colors"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextImage();
                  }}
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                  className="absolute right-4 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 dark:hover:bg-white/20 transition-colors"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductHero;
