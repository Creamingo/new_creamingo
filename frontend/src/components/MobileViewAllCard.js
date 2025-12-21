import React from 'react'
import { useRouter } from 'next/navigation'

const MobileViewAllCard = ({ selectedCategory }) => {
  const router = useRouter()

  // Handle navigation to the subcategory listing page
  const handleViewAllClick = () => {
    // Convert category name to URL-friendly slug
    const categorySlug = selectedCategory.toLowerCase().replace(/\s+/g, '-')
    const url = `/category/cakes-for-occasion/${categorySlug}`
    
    console.log('Mobile navigating to:', url)
    router.push(url)
  }

  return (
    <div className="lg:hidden flex-shrink-0 w-28">
      <button 
        onClick={handleViewAllClick}
        className="w-full bg-gradient-to-br from-[#8B4513] to-[#A0522D] rounded-xl shadow-lg border-2 border-[#8B4513] overflow-hidden h-full flex flex-col items-center justify-center text-center p-4 hover:from-[#A0522D] hover:to-[#8B4513] transition-all duration-300 cursor-pointer"
      >
        <div className="text-white mb-2">
          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
        <span className="text-white font-inter font-bold text-sm">
          View All {selectedCategory} Cakes
        </span>
      </button>
    </div>
  )
}

export default MobileViewAllCard
