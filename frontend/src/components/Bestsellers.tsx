import React, { useRef, useState, useEffect } from 'react';
import { Award, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { formatPrice } from '../utils/priceFormatter';

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

interface BestsellersProps {
  products?: Product[];
  loading?: boolean;
  showViewAll?: boolean;
}

export const Bestsellers: React.FC<BestsellersProps> = ({ 
  products: propProducts, 
  loading: propLoading = false, 
  showViewAll = true 
}) => {
  const [products, setProducts] = useState<Product[]>(propProducts || []);
  const [loading, setLoading] = useState(propLoading);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Fetch bestsellers from API if not provided as props
  useEffect(() => {
    if (!propProducts) {
      const fetchBestsellers = async () => {
        try {
          setLoading(true);
          const response = await fetch('/api/products/bestsellers?limit=20');
          const data = await response.json();
          
          if (data.success) {
            // Sort products by ID in ascending order (lowest number first)
            const sortedProducts = data.data.products.sort((a: Product, b: Product) => a.id - b.id);
            setProducts(sortedProducts);
          }
        } catch (error) {
          console.error('Error fetching bestsellers:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchBestsellers();
    }
  }, [propProducts]);

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  React.useEffect(() => {
    checkScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      return () => container.removeEventListener('scroll', checkScrollButtons);
    }
  }, [products]);

  if (loading) {
    return (
      <section className="py-12 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-48 mx-auto mb-4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 mx-auto animate-pulse"></div>
          </div>
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex-shrink-0 w-64 bg-white dark:bg-gray-800 rounded-2xl p-4 animate-pulse">
                <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl mb-3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Award className="h-8 w-8 text-purple-500" />
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              Bestsellers
            </h2>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Our most popular cakes that customers keep coming back for
          </p>
        </div>

        {/* Scrollable Products Container */}
        <div className="relative">
          {/* Scroll Buttons */}
          {canScrollLeft && (
            <button
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 shadow-lg rounded-full p-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
          )}
          
          {canScrollRight && (
            <button
              onClick={scrollRight}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 shadow-lg rounded-full p-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
          )}

          {/* Products Scroll Container */}
          <div
            ref={scrollContainerRef}
            className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {products.map((product, index) => (
              <div
                key={product.id}
                className="group flex-shrink-0 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-soft-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-purple-100 dark:border-gray-700"
              >
                {/* Bestseller Badge */}
                <div className="absolute top-3 left-3 z-10">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    Bestseller
                  </div>
                </div>

                {/* Product Image */}
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-2 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      {formatPrice(product.base_price)}
                    </span>
                    <button className="text-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            ))}
          </div>
        </div>

        {/* View All Button */}
        {showViewAll && products.length > 10 && (
          <div className="text-center mt-8">
            <button 
              onClick={() => window.location.href = '/products?filter=bestsellers'}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              View All Bestsellers ({products.length})
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
};
