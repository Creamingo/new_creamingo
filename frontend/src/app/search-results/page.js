'use client';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Head from 'next/head';
import { Loader2, AlertCircle, Filter, ChevronDown } from 'lucide-react';
import Header from '../../components/Header';
import MobileFooter from '../../components/MobileFooter';
import LocationBar from '../../components/LocationBar';
import ListingProductCard from '../../components/ListingProductCard';
import productApi from '../../api/productApi';
import { useWishlist } from '../../contexts/WishlistContext';

const SearchResults = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [sortBy, setSortBy] = useState('popularity');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Get search parameters
  const occasion = searchParams.get('occasion');
  const flavor = searchParams.get('flavor');
  const query = searchParams.get('query');

  // Load products based on search criteria
  useEffect(() => {
    const loadSearchResults = async () => {
      try {
        setLoading(true);
        setError(null);

        let searchResults = [];

        if (occasion && flavor) {
          // Search by occasion and flavor combination
          searchResults = await productApi.searchProductsByOccasionAndFlavor(occasion, flavor);
        } else if (query) {
          // General search by query
          searchResults = await productApi.searchProducts(query);
        } else {
          // Fallback to all products if no specific criteria
          searchResults = await productApi.getAllProducts();
        }

        // Transform API response to match frontend expected format
        const products = searchResults.data?.products || searchResults.products || [];
        const transformedProducts = products.map(product => ({
          id: product.id,
          name: product.name,
          slug: product.slug, // Include the slug field
          image: product.image_url || product.image,
          originalPrice: product.base_price || product.originalPrice,
          discountedPrice: product.discounted_price || product.discountedPrice,
          rating: product.rating || 4.5,
          reviews: product.reviews || Math.floor(Math.random() * 100) + 10,
          category: product.category_name || product.category,
          subcategory: product.subcategory_name || product.subcategory,
          isTopProduct: product.is_top_product === 1 || product.isTopProduct,
          discount: product.discount_percent || (product.discounted_price && product.base_price ? Math.round(((product.base_price - product.discounted_price) / product.base_price) * 100) : 0)
        }));

        setProducts(transformedProducts);
      } catch (err) {
        setError('Failed to load search results');
        console.error('Error loading search results:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSearchResults();
  }, [occasion, flavor, query]);

  // Utility functions
  const formatPrice = (price) => {
    if (typeof price === 'number') {
      return `₹${price % 1 === 0 ? price.toFixed(0) : price.toFixed(2)}`;
    }
    return `₹${price}`;
  };

  const sortProducts = (products, sortBy) => {
    switch (sortBy) {
      case 'price-low':
        return [...products].sort((a, b) => a.discountedPrice - b.discountedPrice);
      case 'price-high':
        return [...products].sort((a, b) => b.discountedPrice - a.discountedPrice);
      case 'rating':
        return [...products].sort((a, b) => b.rating - a.rating);
      case 'newest':
        return [...products].sort((a, b) => b.id - a.id);
      default:
        return products;
    }
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    setShowSortDropdown(false);
  };

  // Generate page title and description
  const getPageTitle = () => {
    if (occasion && flavor) {
      return `${flavor} ${occasion} Cakes - Search Results | Creamingo`;
    } else if (query) {
      return `${query} - Search Results | Creamingo`;
    }
    return 'Search Results | Creamingo';
  };

  const getPageDescription = () => {
    if (occasion && flavor) {
      return `Find the perfect ${flavor} cake for your ${occasion} celebration. Fresh, delicious cakes delivered to your doorstep.`;
    } else if (query) {
      return `Search results for ${query}. Discover delicious cakes and desserts for every occasion.`;
    }
    return 'Search results for cakes and desserts. Find the perfect treat for any occasion.';
  };

  const getSearchTitle = () => {
    if (occasion && flavor) {
      return `${flavor} ${occasion} Cakes`;
    } else if (query) {
      return `Results for "${query}"`;
    }
    return 'Search Results';
  };

  const getSearchSubtitle = () => {
    if (occasion && flavor) {
      return `Perfect ${flavor} cakes for your ${occasion} celebration`;
    } else if (query) {
      return `Found ${products.length} results for "${query}"`;
    }
    return `Found ${products.length} results`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 dark:text-purple-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300 font-inter">Loading search results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="bg-purple-600 dark:bg-purple-700 text-white px-6 py-2 rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const sortedProducts = sortProducts(products, sortBy);

  return (
    <>
      <Head>
        <title>{getPageTitle()}</title>
        <meta name="description" content={getPageDescription()} />
        <meta property="og:title" content={getPageTitle()} />
        <meta property="og:description" content={getPageDescription()} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={getPageTitle()} />
        <meta name="twitter:description" content={getPageDescription()} />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Website Header */}
        <Header />
        <LocationBar />

        {/* Header Section */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
          <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-3">
            {/* Breadcrumb */}
            <nav className="flex items-center space-x-2 text-xs text-gray-400 dark:text-gray-500 mb-2">
              <button
                onClick={() => router.push('/')}
                className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 font-medium"
              >
                Home
              </button>
              <span className="text-gray-500 dark:text-gray-400 text-sm">›</span>
              <span className="text-gray-700 dark:text-gray-300 font-medium">Search Results</span>
            </nav>

            {/* Page Title and Controls */}
            <div className="mb-3">
              {/* Desktop Layout */}
              <div className="hidden lg:block">
                <div className="flex items-start justify-between">
                  {/* Left: Title and Info */}
                  <div className="flex-1">
                    <h1 className="text-xl lg:text-2xl font-semibold text-gray-800 dark:text-gray-100 font-poppins mb-2">
                      {getSearchTitle()}
                    </h1>
                    <div className="flex items-center space-x-4">
                      <span className="text-lg text-gray-600 dark:text-gray-300 font-inter font-semibold">
                        {products.length} Products
                      </span>
                      <div className="h-5 w-px bg-gray-300 dark:bg-gray-700"></div>
                      <p className="text-gray-700 dark:text-gray-300 font-inter text-base font-medium">
                        {getSearchSubtitle()}
                      </p>
                    </div>
                  </div>
                  
                  {/* Right: Sort Button */}
                  <div className="flex items-center space-x-3 ml-6">
                    <div className="relative">
                      <button
                        onClick={() => setShowSortDropdown(!showSortDropdown)}
                        className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-5 py-3 hover:bg-gray-100 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 cursor-pointer group"
                      >
                        <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300" />
                        <span className="text-xs text-gray-600 dark:text-gray-300 font-inter font-medium">Sort by</span>
                        <span className="text-xs font-inter font-semibold text-purple-600 dark:text-purple-400">
                          {sortBy === 'popularity' && 'Popularity'}
                          {sortBy === 'price-low' && 'Price: Low to High'}
                          {sortBy === 'price-high' && 'Price: High to Low'}
                          {sortBy === 'rating' && 'Rating'}
                          {sortBy === 'newest' && 'Latest First'}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-transform duration-200 ${showSortDropdown ? 'rotate-180' : ''}`} />
                      </button>
                    
                      {/* Dropdown Menu */}
                      {showSortDropdown && (
                        <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl dark:shadow-2xl dark:shadow-black/30 z-10 overflow-hidden">
                          <div className="py-2">
                            <button
                              onClick={() => handleSortChange('popularity')}
                              className={`w-full text-left px-4 py-3 text-sm font-inter transition-colors duration-200 ${
                                sortBy === 'popularity' 
                                  ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-r-2 border-purple-500 dark:border-purple-400' 
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                              }`}
                            >
                              Popularity
                            </button>
                            <button
                              onClick={() => handleSortChange('newest')}
                              className={`w-full text-left px-4 py-3 text-sm font-inter transition-colors duration-200 ${
                                sortBy === 'newest' 
                                  ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-r-2 border-purple-500 dark:border-purple-400' 
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                              }`}
                            >
                              Latest First
                            </button>
                            <button
                              onClick={() => handleSortChange('price-low')}
                              className={`w-full text-left px-4 py-3 text-sm font-inter transition-colors duration-200 ${
                                sortBy === 'price-low' 
                                  ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-r-2 border-purple-500 dark:border-purple-400' 
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                              }`}
                            >
                              Price: Low to High
                            </button>
                            <button
                              onClick={() => handleSortChange('price-high')}
                              className={`w-full text-left px-4 py-3 text-sm font-inter transition-colors duration-200 ${
                                sortBy === 'price-high' 
                                  ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-r-2 border-purple-500 dark:border-purple-400' 
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                              }`}
                            >
                              Price: High to Low
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Layout */}
              <div className="lg:hidden">
                <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100 font-poppins mb-2">
                  {getSearchTitle()}
                </h1>
                <div className="flex items-center space-x-4 mb-3">
                  <span className="text-base text-gray-600 dark:text-gray-300 font-inter font-semibold">
                    {products.length} Products
                  </span>
                  <div className="h-4 w-px bg-gray-300 dark:bg-gray-700"></div>
                  <p className="text-gray-700 dark:text-gray-300 font-inter text-sm font-medium flex-1">
                    {getSearchSubtitle()}
                  </p>
                </div>
                
                {/* Mobile Sort Options */}
                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                  <div className="flex items-center space-x-3">
                    <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-300 font-inter font-medium">Sort by:</span>
                  </div>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-xs font-inter font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent transition-all duration-200"
                  >
                    <option value="popularity">Popularity</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Rating</option>
                    <option value="newest">Newest</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 pt-4 pb-8">
          {/* Products Grid */}
          {sortedProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-6">
              {sortedProducts.map((product) => (
                <ListingProductCard
                  key={product.id}
                  product={product}
                  formatPrice={formatPrice}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">No products found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {occasion && flavor 
                  ? `We couldn't find any ${flavor} cakes for ${occasion}`
                  : query 
                    ? `No results found for "${query}"`
                    : 'No products match your search criteria'
                }
              </p>
              <button
                onClick={() => router.push('/')}
                className="bg-purple-600 dark:bg-purple-700 text-white px-6 py-2 rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors"
              >
                Browse All Products
              </button>
            </div>
          )}
        </div>

        {/* Mobile Footer */}
        <MobileFooter cartItemCount={3} walletAmount={1250} wishlistCount={5} />
      </div>
    </>
  );
};

export default SearchResults;
