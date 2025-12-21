'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
// import { categories as staticCategories } from './cakeData'
import occasionCategoryAPI from '../api/occasionCategories'

export default function CakesForOccasion() {
  const router = useRouter()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchOccasionCategories = async () => {
      try {
        setLoading(true)
        const response = await occasionCategoryAPI.getOccasionCategories()
        if (response.success && response.data && response.data.subcategories) {
          // Transform database categories to use actual database images
          const transformedCategories = response.data.subcategories.map(category => {
            // Use image_url directly from API (already full URLs)
            const imageUrl = category.image_url;
            
            return {
              name: category.name,
              image: (imageUrl && imageUrl.trim() !== '') ? imageUrl : getCategoryImage(category.name) // Use database image or fallback
            }
          })
          setCategories(transformedCategories)
        } else {
          setError('Failed to fetch occasion categories')
        }
      } catch (err) {
        console.error('Error fetching occasion categories:', err)
        setError('Failed to load occasion categories')
        // Keep using static categories as fallback
      } finally {
        setLoading(false)
      }
    }

    fetchOccasionCategories()
  }, [])

  // Handle category click
  const handleCategoryClick = (categoryName) => {
    const categorySlug = categoryName.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and')
    router.push(`/category/cakes-for-occasion/${categorySlug}`)
  }


  // Helper function to get category image
  const getCategoryImage = (categoryName) => {
    const imageMap = {
      'Birthday': '/Design 1.webp',
      'Anniversary': '/Design 2.webp',
      'Engagement': '/Design 3.webp',
      'Wedding': '/Design 4.webp',
      'New Beginning': '/Design 1.webp',
      'No Reason Cake': '/Design 2.webp'
    }
    return imageMap[categoryName] || '/Design 1.webp'
  }

  // Default categories if API fails
  const defaultCategories = [
    { name: 'Birthday', image: getCategoryImage('Birthday') },
    { name: 'Anniversary', image: getCategoryImage('Anniversary') },
    { name: 'Engagement', image: getCategoryImage('Engagement') },
    { name: 'Wedding', image: getCategoryImage('Wedding') },
    { name: 'New Beginning', image: getCategoryImage('New Beginning') },
    { name: 'No Reason Cake', image: getCategoryImage('No Reason Cake') }
  ]

  // Use default categories if API fails
  const displayCategories = categories.length > 0 ? categories : defaultCategories

  // Add custom CSS for scrollbar hiding
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Show loading state
  if (loading) {
    return (
      <section className="bg-gradient-to-b from-white to-pink-50 dark:from-gray-900 dark:to-gray-800 pt-12 pb-8 lg:pt-12 lg:pb-12">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-pink-500 border-t-transparent"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-300 text-sm leading-relaxed">Loading occasion categories...</p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Show error state
  if (error) {
    return (
      <section className="bg-gradient-to-b from-white to-pink-50 dark:from-gray-900 dark:to-gray-800 pt-12 pb-8 lg:pt-12 lg:pb-12">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <p className="text-red-600 dark:text-red-400 mb-2 font-medium leading-relaxed">{error}</p>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">Using fallback data</p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-gradient-to-b from-white to-pink-50 dark:from-gray-900 dark:to-gray-800 pt-12 pb-8 lg:pt-12 lg:pb-12">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Section Header - Improved Typography Hierarchy */}
          <div className="text-center mb-5 lg:mb-6">
            <div className="inline-block mb-3">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-px bg-gradient-to-r from-purple-400 to-pink-400 dark:from-purple-500 dark:to-pink-500"></div>
                <span className="px-4 text-xs font-semibold text-pink-500 dark:text-pink-400 uppercase tracking-widest leading-relaxed">OCCASION</span>
                <div className="w-12 h-px bg-gradient-to-r from-pink-400 to-purple-400 dark:from-pink-500 dark:to-purple-500"></div>
               </div>
              <h2 className="font-poppins text-2xl lg:text-3xl font-bold mb-1 leading-tight tracking-tight">
              <span className="text-purple-700 dark:text-purple-400">Cakes</span>
              <span className="text-pink-600 dark:text-pink-400"> for Any Occasion</span>
               </h2>
              <p className="font-inter text-gray-600 dark:text-gray-300 text-sm lg:text-lg max-w-2xl mx-auto leading-relaxed font-normal">
              Your celebrations, our speedy cake delivery
              </p>
            </div>
           </div>

          {/* Clean Category Horizontal Scroll */}
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex space-x-6 lg:space-x-8 pb-4 min-w-max">
              {displayCategories.map((category) => (
                <div
                     key={category.name}
                  onClick={() => handleCategoryClick(category.name)}
                  className="group cursor-pointer flex-shrink-0"
                >
                  {/* Clean Category Image Container */}
                  <div className="relative mb-3 overflow-hidden rounded-xl border border-[#6c3e27]/20 dark:border-amber-700/30 shadow-sm dark:shadow-md dark:shadow-black/10 group-hover:shadow-md hover:shadow-[#6c3e27]/10 dark:hover:shadow-amber-500/20 hover:border-[#6c3e27]/40 dark:hover:border-amber-500/50 hover:-translate-y-1 active:translate-y-0 transition-all duration-300">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-36 h-36 lg:w-52 lg:h-52 object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.src = '/Design 1.webp'
                      }}
                    />
                  </div>
                  
                  {/* Clean Category Name */}
                  <h3 className="text-center font-poppins font-semibold text-base text-[#6c3e27] dark:text-amber-400 group-hover:text-[#8b4513] dark:group-hover:text-amber-300 transition-colors duration-300 w-36 lg:w-52 leading-relaxed tracking-normal">
                    {category.name}
                  </h3>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
