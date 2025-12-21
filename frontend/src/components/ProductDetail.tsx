import React, { useState } from 'react';
import { Star, Award, ShoppingCart, Heart, Minus, Plus, Truck, Shield, RotateCcw } from 'lucide-react';
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
  care_storage?: string;
  delivery_guidelines?: string;
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

interface ProductDetailProps {
  product: Product;
  onAddToCart?: (product: Product, variant?: ProductVariant, quantity?: number) => void;
  onToggleFavorite?: (product: Product) => void;
  className?: string;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({
  product,
  onAddToCart,
  onToggleFavorite,
  className = ''
}) => {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants?.[0] || null
  );
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  const hasDiscount = product.discount_percent > 0;
  const savings = hasDiscount ? (product.base_price - product.discounted_price) : 0;

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product, selectedVariant || undefined, quantity);
    }
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    if (onToggleFavorite) {
      onToggleFavorite(product);
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  const getCurrentPrice = () => {
    if (selectedVariant) {
      return selectedVariant.discount_percent > 0 
        ? selectedVariant.discounted_price 
        : selectedVariant.price;
    }
    return hasDiscount ? product.discounted_price : product.base_price;
  };

  const getOriginalPrice = () => {
    if (selectedVariant) {
      return selectedVariant.price;
    }
    return product.base_price;
  };

  const getCurrentDiscount = () => {
    if (selectedVariant) {
      return selectedVariant.discount_percent;
    }
    return product.discount_percent;
  };

  const getCurrentWeight = () => {
    if (selectedVariant) {
      return selectedVariant.weight;
    }
    return product.base_weight;
  };

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="aspect-square overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Product Badges */}
          <div className="flex gap-2">
            {product.isTopProduct && (
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                <Star className="h-4 w-4 fill-current" />
                Top Product
              </div>
            )}
            {product.isBestseller && (
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                <Award className="h-4 w-4" />
                Bestseller
              </div>
            )}
            {hasDiscount && (
              <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                {product.discount_percent}% OFF
              </div>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Category */}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {product.category}
            {product.subcategory && ` • ${product.subcategory}`}
          </div>

          {/* Product Name */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {product.name}
          </h1>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            {product.description}
          </p>

          {/* Care & Storage */}
          {product.care_storage && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Care & Storage
              </h3>
              <div 
                className="text-gray-600 dark:text-gray-400 leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: product.care_storage }}
              />
            </div>
          )}

          {/* Delivery Guidelines */}
          {product.delivery_guidelines && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Delivery Guidelines
              </h3>
              <div 
                className="text-gray-600 dark:text-gray-400 leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: product.delivery_guidelines }}
              />
            </div>
          )}

          {/* Price Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              {getCurrentDiscount() > 0 ? (
                <>
                  <span className="text-3xl font-bold text-green-600">
                    {formatCurrency(getCurrentPrice())}
                  </span>
                  <span className="text-xl text-gray-500 line-through">
                    {formatCurrency(getOriginalPrice())}
                  </span>
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium">
                    Save {getCurrentDiscount()}%
                  </span>
                </>
              ) : (
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(getCurrentPrice())}
                </span>
              )}
            </div>
            
            {getCurrentDiscount() > 0 && (
              <p className="text-sm text-green-600 font-medium">
                You save {formatCurrency(getOriginalPrice() - getCurrentPrice())} on this item
              </p>
            )}
          </div>

          {/* Variants Selection */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Select Size
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                      selectedVariant?.id === variant.id
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {variant.weight}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {variant.discount_percent > 0 ? (
                        <>
                          <span className="text-green-600 font-semibold">
                            {formatCurrency(variant.discounted_price)}
                          </span>
                          <span className="text-gray-500 line-through ml-1">
                            {formatCurrency(variant.price)}
                          </span>
                        </>
                      ) : (
                        <span>{formatCurrency(variant.price)}</span>
                      )}
                    </div>
                    {variant.discount_percent > 0 && (
                      <div className="text-xs text-red-500 font-medium">
                        {variant.discount_percent}% OFF
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Quantity
            </h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleQuantityChange(quantity - 1)}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="text-lg font-semibold text-gray-900 dark:text-white min-w-[2rem] text-center">
                {quantity}
              </span>
              <button
                onClick={() => handleQuantityChange(quantity + 1)}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleAddToCart}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 px-6 rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 transition-all duration-300 flex items-center justify-center gap-3 text-lg"
            >
              <ShoppingCart className="h-5 w-5" />
              Add to Cart - {formatCurrency(getCurrentPrice() * quantity)}
            </button>
            
            <div className="flex gap-3">
              <button
                onClick={handleToggleFavorite}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                  isFavorite
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                {isFavorite ? 'Favorited' : 'Add to Favorites'}
              </button>
            </div>
          </div>

          {/* Product Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Truck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  Free Delivery
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  On orders over $50
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  Quality Guarantee
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  100% Fresh & Delicious
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <RotateCcw className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  Easy Returns
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  30-day return policy
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
