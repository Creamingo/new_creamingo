import React from 'react';
import { Star, Award, ShoppingCart, Heart } from 'lucide-react';

import { formatPrice } from '../utils/priceFormatter';

// Format currency (configurable currency symbol) - now uses global formatter
const formatCurrency = (amount: number, currencySymbol: string = '₹'): string => {
  return formatPrice(amount, currencySymbol);
};

interface Product {
  id: string;
  name: string;
  description: string;
  base_price: number;
  base_weight: string;
  discount_percent: number;
  discounted_price: number;
  image: string;
  category: string;
  subcategory?: string;
  isTopProduct?: boolean;
  isBestseller?: boolean;
  variants?: ProductVariant[];
}

interface ProductVariant {
  id: string;
  weight: string;
  price: number;
  discount_percent: number;
  discounted_price: number;
  stock: number;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
  showBadges?: boolean;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onToggleFavorite,
  showBadges = true,
  className = ''
}) => {
  const hasDiscount = product.discount_percent > 0;
  const savings = hasDiscount ? (product.base_price - product.discounted_price) : 0;

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  const handleToggleFavorite = () => {
    if (onToggleFavorite) {
      onToggleFavorite(product);
    }
  };

  return (
    <div className={`group relative bg-white dark:bg-gray-800 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-soft-lg transition-all duration-300 ${className}`}>
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Product Badges */}
        {showBadges && (
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.isTopProduct && (
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <Star className="h-3 w-3 fill-current" />
                Top
              </div>
            )}
            {product.isBestseller && (
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <Award className="h-3 w-3" />
                Bestseller
              </div>
            )}
          </div>
        )}

        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute top-3 right-3">
            <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-bold">
              {product.discount_percent}% OFF
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
            <button
              onClick={handleAddToCart}
              className="bg-white text-gray-900 p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors"
              title="Add to Cart"
            >
              <ShoppingCart className="h-4 w-4" />
            </button>
            <button
              onClick={handleToggleFavorite}
              className="bg-white text-gray-900 p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors"
              title="Add to Favorites"
            >
              <Heart className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Category */}
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
          {product.category}
          {product.subcategory && ` • ${product.subcategory}`}
        </div>

        {/* Product Name */}
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2 line-clamp-2">
          {product.name}
        </h3>

        {/* Weight */}
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
          {product.base_weight}
        </div>

        {/* Price */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-col">
            {hasDiscount ? (
              <>
                <span className="text-lg font-bold text-green-600">
                  {formatCurrency(product.discounted_price)}
                </span>
                <span className="text-sm text-gray-500 line-through">
                  {formatCurrency(product.base_price)}
                </span>
                <span className="text-xs text-red-500 font-medium">
                  Save {formatCurrency(savings)}
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {formatCurrency(product.base_price)}
              </span>
            )}
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2 px-4 rounded-xl font-medium hover:from-amber-600 hover:to-orange-600 transition-all duration-300 flex items-center justify-center gap-2"
        >
          <ShoppingCart className="h-4 w-4" />
          Add to Cart
        </button>
      </div>

      {/* Savings Highlight */}
      {hasDiscount && (
        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg">
          SAVE {product.discount_percent}%
        </div>
      )}
    </div>
  );
};

// Product Grid Component
interface ProductGridProps {
  products: Product[];
  onAddToCart?: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
  showBadges?: boolean;
  className?: string;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onAddToCart,
  onToggleFavorite,
  showBadges = true,
  className = ''
}) => {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
          onToggleFavorite={onToggleFavorite}
          showBadges={showBadges}
        />
      ))}
    </div>
  );
};

// Product List Component (for list view)
export const ProductList: React.FC<ProductGridProps> = ({
  products,
  onAddToCart,
  onToggleFavorite,
  showBadges = true,
  className = ''
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {products.map((product) => (
        <div
          key={product.id}
          className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700 hover:shadow-soft-lg transition-all duration-300"
        >
          {/* Product Image */}
          <div className="relative w-20 h-20 flex-shrink-0">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover rounded-xl"
            />
            {showBadges && product.isTopProduct && (
              <div className="absolute -top-1 -left-1">
                <Star className="h-4 w-4 text-amber-500 fill-current" />
              </div>
            )}
            {showBadges && product.isBestseller && (
              <div className="absolute -top-1 -right-1">
                <Award className="h-4 w-4 text-purple-500" />
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              {product.category}
              {product.subcategory && ` • ${product.subcategory}`}
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 truncate">
              {product.name}
            </h3>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              {product.base_weight}
            </div>
            
            {/* Price */}
            <div className="flex items-center gap-2">
              {product.discount_percent > 0 ? (
                <>
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(product.discounted_price)}
                  </span>
                  <span className="text-sm text-gray-500 line-through">
                    {formatCurrency(product.base_price)}
                  </span>
                  <span className="text-xs text-red-500 font-medium">
                    {product.discount_percent}% OFF
                  </span>
                </>
              ) : (
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatCurrency(product.base_price)}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => onAddToCart?.(product)}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2 px-4 rounded-xl font-medium hover:from-amber-600 hover:to-orange-600 transition-all duration-300 flex items-center gap-2 text-sm"
            >
              <ShoppingCart className="h-4 w-4" />
              Add
            </button>
            <button
              onClick={() => onToggleFavorite?.(product)}
              className="text-gray-400 hover:text-red-500 transition-colors p-1"
              title="Add to Favorites"
            >
              <Heart className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
