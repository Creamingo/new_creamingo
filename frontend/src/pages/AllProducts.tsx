import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Star, Filter, Search, Grid, List, ArrowRight, Award } from 'lucide-react';
import { resolveImageUrl } from '../utils/imageUrl';

interface Product {
  id: number;
  name: string;
  image_url: string;
  description: string;
  base_price: number;
  slug: string;
  category_name?: string;
  subcategory_name?: string;
  is_top_product?: boolean;
  is_bestseller?: boolean;
}

const AllProducts: React.FC = () => {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<string>('all');

  // Initialize filter from query when router is ready (avoids SSR issues)
  useEffect(() => {
    if (!router.isReady) return;
    const q = router.query?.filter;
    if (typeof q === 'string' && q.length > 0) {
      setFilter(q);
    } else {
      setFilter('all');
    }
  }, [router.isReady, router.query]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        let url = '/api/products';
        
        if (filter === 'top') {
          url = '/api/products/top?limit=50';
        } else if (filter === 'bestsellers') {
          url = '/api/products/bestsellers?limit=50';
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
          let fetchedProducts = data.data.products || data.data;
          
          // Sort products by ID in ascending order (lowest number first)
          fetchedProducts = fetchedProducts.sort((a: Product, b: Product) => a.id - b.id);
          
          setProducts(fetchedProducts);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [filter]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFilterTitle = () => {
    switch (filter) {
      case 'top':
        return 'Top Products';
      case 'bestsellers':
        return 'Bestsellers';
      case 'featured':
        return 'Featured Products';
      default:
        return 'All Products';
    }
  };

  const getFilterDescription = () => {
    switch (filter) {
      case 'top':
        return 'Our most loved and highly rated cakes that customers can\'t get enough of';
      case 'bestsellers':
        return 'Our most popular cakes that customers keep coming back for';
      case 'featured':
        return 'Handpicked products that we think you\'ll love';
      default:
        return 'Browse our complete collection of delicious cakes and desserts';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl p-4">
                  <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl mb-4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            {filter === 'top' && <Star className="h-8 w-8 text-amber-500 fill-current" />}
            {filter === 'bestsellers' && <Award className="h-8 w-8 text-purple-500" />}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              {getFilterTitle()}
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
            {getFilterDescription()}
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-8 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                All Products
              </button>
              <button
                onClick={() => setFilter('top')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'top'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                Top Products
              </button>
              <button
                onClick={() => setFilter('bestsellers')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'bestsellers'
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                Bestsellers
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-400">
            Showing {filteredProducts.length} of {products.length} products
          </p>
        </div>

        {/* Products Grid/List */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-600 mb-4">
              <Search className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No products found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }>
            {filteredProducts.map((product, index) => (
              <div
                key={product.id}
                className={`group bg-white dark:bg-gray-800 rounded-2xl shadow-soft-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 ${
                  viewMode === 'list' ? 'flex' : ''
                }`}
              >
                {/* Product Image */}
                <div className={`relative overflow-hidden ${
                  viewMode === 'list' ? 'w-48 h-32' : 'h-48'
                }`}>
                  <img
                    src={resolveImageUrl(product.image_url)}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {product.is_top_product && (
                    <div className="absolute top-3 left-3">
                      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current" />
                        Top Product
                      </div>
                    </div>
                  )}
                  {product.is_bestseller && (
                    <div className="absolute top-3 right-3">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <Award className="h-3 w-3" />
                        Bestseller
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                {/* Product Info */}
                <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-2 line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {product.description}
                  </p>
                  {product.category_name && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">
                      {product.category_name}
                      {product.subcategory_name && ` • ${product.subcategory_name}`}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                      ₹{product.base_price % 1 === 0 ? product.base_price.toFixed(0) : product.base_price.toFixed(2)}
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
        )}
      </div>
    </div>
  );
};

export default AllProducts;
