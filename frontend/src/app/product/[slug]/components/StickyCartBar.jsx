'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Heart } from 'lucide-react';
import { resolveImageUrl } from '../../../../utils/imageUrl';

const StickyCartBar = ({ 
  product, 
  selectedVariant, 
  quantity, 
  customizations, 
  onAddToCart, 
  onBuyNow 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Show/hide sticky bar based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Show sticky bar when user has scrolled past the product summary section
      // and there's still content below
      setIsVisible(scrollTop > 400 && scrollTop < documentHeight - windowHeight - 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getCurrentPrice = () => {
    if (selectedVariant) {
      return selectedVariant.discount_percent > 0 
        ? selectedVariant.discounted_price 
        : selectedVariant.price;
    }
    return product.discount_percent > 0 ? product.discounted_price : product.base_price;
  };

  const currentPrice = getCurrentPrice();
  const totalPrice = currentPrice * quantity;

  const handleFavoriteToggle = () => {
    setIsFavorite(!isFavorite);
    // TODO: Implement favorite functionality
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg dark:shadow-xl dark:shadow-black/30 z-50 lg:hidden">
      <div className="px-4 py-3">
        <div className="flex items-center space-x-3">
          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0 overflow-hidden">
                <img
                  src={resolveImageUrl(product.image_url)}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {product.name}
                </h4>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    ₹{totalPrice.toFixed(0)}
                  </span>
                  {quantity > 1 && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      (₹{currentPrice.toFixed(0)} × {quantity})
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Favorite Button */}
            <button
              onClick={handleFavoriteToggle}
              className={`p-2 rounded-lg transition-colors ${
                isFavorite
                  ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>

            {/* Add to Cart Button */}
            <button
              onClick={onAddToCart}
              className="flex items-center space-x-2 bg-rose-500 dark:bg-rose-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-rose-600 dark:hover:bg-rose-700 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Add to Cart</span>
            </button>

            {/* Buy Now Button */}
            <button
              onClick={onBuyNow}
              className="bg-gray-900 dark:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors"
            >
              Buy Now
            </button>
          </div>
        </div>

        {/* Customization Summary */}
        {(selectedVariant || customizations.flavor || customizations.shape || customizations.isEggless) && (
          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-400">
              {selectedVariant && (
                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  {selectedVariant.weight}
                </span>
              )}
              {customizations.flavor && (
                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  {customizations.flavor}
                </span>
              )}
              {customizations.shape && (
                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  {customizations.shape}
                </span>
              )}
              {customizations.isEggless && (
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded">
                  Eggless
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StickyCartBar;
