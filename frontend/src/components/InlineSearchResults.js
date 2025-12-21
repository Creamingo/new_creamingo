'use client'

import { useSearch } from '../contexts/SearchContext'
import { useRouter } from 'next/navigation'
import { Loader2, Search, X } from 'lucide-react'
import ListingProductCard from './ListingProductCard'
import { formatPrice } from '../utils/priceFormatter'

const InlineSearchResults = () => {
  const { searchResults, currentSearchQuery, isSearchResultsLoading, setSearchResults, setCurrentSearchQuery } = useSearch()
  const router = useRouter()

  // formatPrice is imported from utils

  const handleClearResults = () => {
    setSearchResults([])
    setCurrentSearchQuery('')
  }

  if (!currentSearchQuery || searchResults.length === 0) {
    return null
  }

  return (
    <section id="inline-search-results" className="w-full px-4 sm:px-6 lg:px-8 py-6 bg-gradient-to-br from-pink-50 via-red-50 to-orange-50 lg:hidden">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-pink-200 p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-pink-500 to-red-500 flex items-center justify-center shadow-lg">
                <Search className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-poppins font-bold text-gray-800 text-lg">
                  Search Results
                </h2>
                <p className="font-inter text-sm text-gray-600">
                  {searchResults.length} {searchResults.length === 1 ? 'product' : 'products'} found for "{currentSearchQuery}"
                </p>
              </div>
            </div>
            <button
              onClick={handleClearResults}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isSearchResultsLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <Loader2 className="w-16 h-16 text-pink-500 animate-spin" />
              <div className="absolute inset-0 rounded-full border-4 border-pink-200"></div>
            </div>
            <p className="mt-6 text-gray-600 font-medium">Loading results...</p>
          </div>
        ) : (
          <>
            {/* View All Button */}
            <div className="mb-4">
              <button
                onClick={() => router.push(`/search-results?query=${encodeURIComponent(currentSearchQuery)}`)}
                className="w-full px-4 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-xl font-inter font-bold text-base hover:from-pink-600 hover:to-red-600 hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg"
              >
                <span>View All Results</span>
                <Search className="w-5 h-5" />
              </button>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {searchResults.slice(0, 6).map((product) => (
                <ListingProductCard
                  key={product.id}
                  product={product}
                  formatPrice={formatPrice}
                />
              ))}
            </div>

            {/* Show More Button if more than 6 results */}
            {searchResults.length > 6 && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => router.push(`/search-results?query=${encodeURIComponent(currentSearchQuery)}`)}
                  className="px-6 py-3 bg-white border-2 border-pink-400 text-pink-600 rounded-xl font-inter font-bold text-sm hover:bg-pink-50 hover:shadow-lg transition-all duration-200"
                >
                  View All {searchResults.length} Products
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}

export default InlineSearchResults

