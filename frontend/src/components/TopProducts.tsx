import React, { useState, useEffect } from 'react';
import { Star, ArrowRight } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { formatPrice } from '../utils/priceFormatter';
import { resolveImageUrl } from '../utils/imageUrl';

interface Product {
  id: number;
  name: string;
  image_url: string;
  description: string;
  base_price: number;
  slug: string;
  display_order?: number;
  category_name?: string;
  subcategory_name?: string;
}

interface TopProductsProps {
  products?: Product[];
  loading?: boolean;
  showViewAll?: boolean;
}

export const TopProducts: React.FC<TopProductsProps> = ({ 
  products: propProducts, 
  loading: propLoading = false, 
  showViewAll = true 
}) => {
  const [products, setProducts] = useState<Product[]>(propProducts || []);
  const [loading, setLoading] = useState(propLoading);

  // Fetch top products from API if not provided as props
  useEffect(() => {
    if (!propProducts) {
      const fetchTopProducts = async () => {
        try {
          setLoading(true);
          const response = await fetch('/api/products/top?limit=10');
          const data = await response.json();
          
          if (data.success) {
            // Sort products by ID in ascending order (lowest number first)
            const sortedProducts = data.data.products.sort((a: Product, b: Product) => a.id - b.id);
            setProducts(sortedProducts);
          }
        } catch (error) {
          console.error('Error fetching top products:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchTopProducts();
    }
  }, [propProducts]);

  // Limit products based on screen size
  const getMaxProducts = () => {
    if (typeof window === 'undefined') return 5; // SSR default
    
    return window.innerWidth < 768 ? 4 : 5; // Mobile: 4, Desktop: 5
  };

  const maxProducts = getMaxProducts();
  const displayProducts = products.slice(0, maxProducts);

  if (loading) {
    return (
      <section className="py-12 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-48 mx-auto mb-4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 mx-auto animate-pulse"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
            {Array.from({ length: maxProducts }).map((_, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl p-4 animate-pulse">
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl mb-3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (displayProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Star className="h-8 w-8 text-amber-500" />
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              Top Products
            </h2>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Discover our most loved and highly rated cakes that customers can't get enough of
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
          {displayProducts.map((product, index) => (
            <div
              key={product.id}
              className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-soft-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-amber-100 dark:border-gray-700"
            >
              {/* Top Badge */}
              <div className="absolute top-3 left-3 z-10">
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current" />
                  #{index + 1}
                </div>
              </div>

              {/* Product Image */}
              <div className="relative h-32 md:h-40 overflow-hidden">
                <img
                  src={resolveImageUrl(product.image_url)}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>

              {/* Product Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm md:text-base mb-2 line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {product.name}
                </h3>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {product.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                    {formatPrice(product.base_price)}
                  </span>
                  <button className="text-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        {showViewAll && products.length > maxProducts && (
          <div className="text-center mt-8">
            <button 
              onClick={() => window.location.href = '/products?filter=top'}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              View All Top Products ({products.length})
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
