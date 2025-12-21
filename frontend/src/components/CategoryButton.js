import React from 'react'

const CategoryButton = ({ 
  category, 
  isSelected, 
  onClick 
}) => {
  return (
    <div className="relative">
      <button
        onClick={onClick}
        className={`group relative flex items-center justify-center space-x-2 px-4 py-3 rounded-md lg:rounded-lg lg:px-4 lg:py-3 lg:w-full whitespace-nowrap transition-all duration-500 transform hover:scale-105 lg:backdrop-blur-sm lg:border-2 lg:ring-1 lg:ring-[#8B4513]/20 ${
          isSelected
            ? 'lg:bg-gradient-to-r lg:from-[#8B4513] lg:via-[#A0522D] lg:to-[#6c3e27] lg:text-white lg:border-2 lg:border-[#8B4513] bg-[#8B4513] text-white border-2 border-[#8B4513]'
            : 'lg:bg-gradient-to-r lg:from-white lg:via-gray-50 lg:to-white lg:text-[#8B4513] lg:hover:from-[#8B4513] lg:hover:via-[#A0522D] lg:hover:to-[#6c3e27] lg:hover:text-white lg:border-2 lg:border-[#8B4513]/30 lg:hover:border-[#8B4513] bg-white text-gray-700 border-2 border-[#8B4513] hover:bg-[#8B4513] hover:text-white'
        }`}
      >
        {/* Background glow effect */}
        <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
          isSelected 
            ? 'bg-gradient-to-r from-[#8B4513]/20 via-[#A0522D]/20 to-[#6c3e27]/20' 
            : 'bg-gradient-to-r from-[#8B4513]/10 via-[#A0522D]/10 to-[#6c3e27]/10'
        } lg:bg-gradient-to-br lg:from-[#8B4513]/5 lg:via-transparent lg:to-[#8B4513]/5`}></div>
        
        {/* Icon */}
        <div className="relative z-10 hidden lg:block">
          {category.icon}
        </div>
        
        {/* Category Name */}
        <span className={`relative z-10 font-inter font-bold text-base lg:text-base transition-all duration-300 ${
          isSelected 
            ? 'text-white' 
            : 'text-[#8B4513] group-hover:text-white'
        }`}>
          {category.name}
        </span>
      </button>

      {/* Active Indicator Triangle - Mobile Only */}
      {isSelected && (
        <div className="lg:hidden absolute top-full left-1/2 transform -translate-x-1/2 z-10">
          <svg width="20" height="10" viewBox="0 0 20 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 10L0 0H20L10 10Z" fill="#8B4513"/>
          </svg>
        </div>
      )}

      {/* Active Indicator Triangle - Desktop Only */}
      {isSelected && (
        <div className="hidden lg:block absolute top-full left-1/2 transform -translate-x-1/2 z-10">
          <svg width="24" height="12" viewBox="0 0 24 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 12L0 0H24L12 12Z" fill="#8B4513"/>
          </svg>
        </div>
      )}
    </div>
  )
}

export default CategoryButton
