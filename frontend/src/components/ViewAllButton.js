import React from 'react'
import { useRouter } from 'next/navigation'

const ViewAllButton = ({ selectedCategory }) => {
  const router = useRouter()

  // Handle navigation to the subcategory listing page
  const handleViewAllClick = () => {
    // Convert category name to URL-friendly slug
    const categorySlug = selectedCategory.toLowerCase().replace(/\s+/g, '-')
    const url = `/category/cakes-for-occasion/${categorySlug}`
    
    console.log('Navigating to:', url)
    router.push(url)
  }

  return (
    <div className="text-center mt-4 lg:mt-0">
      {/* Mobile Version - Clean and Minimal */}
      <button 
        onClick={handleViewAllClick}
        className="lg:hidden text-[#8B4513] font-inter font-medium text-sm px-4 py-2 border border-[#8B4513] rounded-lg hover:bg-[#8B4513] hover:text-white transition-all duration-300 cursor-pointer"
      >
        View All {selectedCategory} Cakes
      </button>
      
      {/* Desktop Version - Original Styling with Centered Position */}
      <div className="hidden lg:flex justify-center">
        <button 
          onClick={handleViewAllClick}
          className="group relative bg-gradient-to-r from-[#8B4513] via-[#A0522D] to-[#6c3e27] text-white font-poppins font-bold px-8 py-2 lg:px-12 lg:py-3 rounded-xl hover:from-[#6c3e27] hover:via-[#A0522D] hover:to-[#8B4513] transition-all duration-500 shadow-2xl hover:shadow-[#8B4513]/40 transform hover:scale-110 border-2 border-[#8B4513]/20 hover:border-[#8B4513] cursor-pointer"
        >
          {/* Animated background glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#8B4513]/20 via-[#A0522D]/20 to-[#6c3e27]/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
          
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform -skew-x-12 group-hover:animate-pulse"></div>
          
          <span className="relative z-10 flex items-center justify-center">
            <span className="text-sm lg:text-lg font-bold tracking-wide">View All {selectedCategory} Cakes</span>
            <svg className="w-5 h-5 lg:w-6 lg:h-6 ml-3 transform group-hover:translate-x-2 transition-transform duration-500 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        </button>
      </div>
    </div>
  )
}

export default ViewAllButton
