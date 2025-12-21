import React from 'react'
import Link from 'next/link'

const ProductCard = ({ 
  product, 
  productWeights, 
  updateWeight, 
  formatWeight, 
  formatPrice, 
  getCurrentPrice, 
  canDecreaseWeight, 
  canIncreaseWeight 
}) => {
  return (
    <div className="group flex-shrink-0 w-48 lg:w-56 flex flex-col">
      <div className="bg-white rounded-xl shadow-sm border border-[#8B4513] overflow-hidden h-full">
        {/* Product Image Container */}
        <div className="relative w-full aspect-square overflow-hidden bg-gray-50">
          <Link href={`/product/${product.slug || product.id}`}>
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover object-center lg:group-hover:scale-105 lg:transition-transform lg:duration-300 cursor-pointer"
            />
          </Link>
          
          {/* Simple Discount Badge */}
          <div className="absolute top-0 right-0 z-10">
            <div className="bg-red-500 text-white font-bold rounded-bl-lg text-[10px] px-2 py-1 lg:text-sm lg:px-3 lg:py-1.5">
              {Math.round(((product.originalPrice - product.discountedPrice) / product.originalPrice) * 100)}% OFF
            </div>
          </div>
        </div>

        {/* Product Info Section - Compact & Clean */}
        <div className="p-2 flex-1 flex flex-col justify-between">
          {/* Product Name - One Line with Truncation */}
          <Link href={`/product/${product.slug || product.id}`}>
            <h3 className="font-inter font-medium text-xs lg:text-sm text-gray-800 mb-1 truncate hover:text-rose-600 transition-colors cursor-pointer">
              {product.name}
            </h3>
          </Link>

          {/* Star Rating - Contemporary Style */}
          <div className="flex items-center mb-2">
            {/* Mobile: No box container */}
            <div className="flex items-center space-x-1 lg:hidden">
              <span className="font-poppins font-bold text-xs text-yellow-700">
                {product.rating}
              </span>
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-2.5 h-2.5 ${i < Math.floor(product.rating) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="font-inter text-[10px] text-yellow-600 font-medium ml-1">
                ({product.reviews})
              </span>
            </div>
            
            {/* Desktop: Without box container */}
            <div className="hidden lg:flex items-center space-x-1">
              <span className="font-poppins font-bold text-xs text-yellow-700">
                {product.rating}
              </span>
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-2.5 h-2.5 ${i < Math.floor(product.rating) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="font-inter text-[10px] text-yellow-600 font-medium ml-1">
                ({product.reviews})
              </span>
            </div>
          </div>

          {/* Price Section - Dynamic Pricing */}
          <div className="flex items-baseline space-x-2 mb-2">
            <span className="font-poppins font-bold text-base text-gray-800">
              {formatPrice(getCurrentPrice(product))}
            </span>
            <span className="font-inter text-[10px] text-gray-400 line-through">
              {formatPrice(product.originalPrice)}
            </span>
          </div>

          {/* Weight Selector - Desktop Version */}
          <div className="hidden lg:block bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-2 mb-2 border border-[#6c3e27]">
            <div className="flex items-center justify-between">
              <span className="font-poppins font-semibold text-sm text-gray-800">
                Weight
              </span>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => updateWeight(product.id, 'decrease')}
                  disabled={!canDecreaseWeight(product.id)}
                  className={`group relative w-6 h-6 rounded-full flex items-center justify-center shadow-sm ${
                    canDecreaseWeight(product.id)
                      ? 'bg-white border border-[#6c3e27]'
                      : 'bg-gray-100 border border-gray-200 cursor-not-allowed'
                  }`}
                  title="Decrease weight"
                >
                  <svg className={`w-3 h-3 ${
                    canDecreaseWeight(product.id)
                      ? 'text-gray-600'
                      : 'text-gray-400'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                  </svg>
                </button>
                
                <div className="font-poppins font-bold text-sm text-gray-900 bg-white px-2 py-1 rounded-md shadow-sm border border-[#6c3e27] w-14 text-center">
                  {formatWeight(productWeights[product.id] || 1)}
                </div>
                
                <button
                  onClick={() => updateWeight(product.id, 'increase')}
                  disabled={!canIncreaseWeight(product.id)}
                  className={`group relative w-6 h-6 rounded-full flex items-center justify-center shadow-sm ${
                    canIncreaseWeight(product.id)
                      ? 'bg-white border border-[#6c3e27]'
                      : 'bg-gray-200 border border-gray-200 cursor-not-allowed'
                  }`}
                  title="Increase weight"
                >
                  <svg className={`w-3 h-3 ${
                    canIncreaseWeight(product.id)
                      ? 'text-gray-600'
                      : 'text-gray-400'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Weight Selector - Mobile Version (Only - weight + with background box) */}
          <div className="lg:hidden bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-1 mb-2 border border-[#6c3e27]">
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={() => updateWeight(product.id, 'decrease')}
                disabled={!canDecreaseWeight(product.id)}
                className={`group relative w-6 h-6 rounded-full flex items-center justify-center shadow-sm ${
                  canDecreaseWeight(product.id)
                    ? 'bg-white border border-[#6c3e27]'
                    : 'bg-gray-100 border border-gray-200 cursor-not-allowed'
                }`}
                title="Decrease weight"
              >
                <svg className={`w-3 h-3 ${
                  canDecreaseWeight(product.id)
                    ? 'text-gray-600'
                    : 'text-gray-400'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                </svg>
              </button>
              
              <div className="font-poppins font-bold text-sm text-gray-900 bg-white px-2 py-1 rounded-md shadow-sm border border-[#6c3e27] w-14 text-center">
                {formatWeight(productWeights[product.id] || 1)}
              </div>
              
              <button
                onClick={() => updateWeight(product.id, 'increase')}
                disabled={!canIncreaseWeight(product.id)}
                className={`group relative w-6 h-6 rounded-full flex items-center justify-center shadow-sm ${
                  canIncreaseWeight(product.id)
                    ? 'bg-white border border-[#6c3e27]'
                    : 'bg-gray-200 border border-gray-200 cursor-not-allowed'
                }`}
                title="Increase weight"
              >
                <svg className={`w-3 h-3 ${
                  canIncreaseWeight(product.id)
                    ? 'text-gray-600'
                    : 'text-gray-400'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductCard
