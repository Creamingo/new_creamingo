'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import crowdFavoriteCakesAPI from '../api/crowdFavoriteCakes'
import { resolveImageUrl } from '../utils/imageUrl'

const CrowdFavoriteCakes = () => {
  const router = useRouter()
  const [categories, setCategories] = useState([])
  const [categoryTitle, setCategoryTitle] = useState('Crowd-Favorite Cakes')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Static fallback data
  const staticCategories = [
    {
      id: 1,
      name: 'Fondant Cakes',
      slug: 'fondant-cakes',
      image: '/Design 1.webp',
      description: 'Elegant fondant decorated cakes'
    },
    {
      id: 2,
      name: 'Multi-Tier Cakes',
      slug: 'multi-tier',
      image: '/Design 2.webp',
      description: 'Grand multi-layered celebration cakes'
    },
    {
      id: 3,
      name: 'Photo Cakes',
      slug: 'photo-cakes',
      image: '/Design 3.webp',
      description: 'Personalized edible photo cakes'
    },
    {
      id: 4,
      name: 'Pinata Cakes',
      slug: 'pinata-cakes',
      image: '/Design 4.webp',
      description: 'Surprise-filled celebration cakes'
    },
    {
      id: 5,
      name: 'Unicorn Cakes',
      slug: 'unicorn-cakes',
      image: '/Design 1.webp',
      description: 'Magical rainbow unicorn designs'
    }
  ]

  // Navigation handler
  const handleCategoryClick = (category) => {
    const slug = category.slug || category.name.toLowerCase().replace(/\s+/g, '-')
    const targetUrl = `/category/crowd-favorite-cakes/${slug}`
    console.log('Navigating to crowd-favorite category:', targetUrl, 'from category:', category)
    console.log('Current window width:', window.innerWidth)
    router.push(targetUrl)
  }

  useEffect(() => {
    const fetchCrowdFavoriteCakes = async () => {
      try {
        setLoading(true)
        const response = await crowdFavoriteCakesAPI.getCrowdFavoriteCakes()
        if (response.success && response.data && response.data.subcategories) {
          // Transform subcategories to match the expected format
          const transformedCategories = response.data.subcategories.map(subcategory => ({
            id: subcategory.id,
            name: subcategory.name,
            slug: subcategory.name.toLowerCase().replace(/\s+/g, '-'),
            image: resolveImageUrl(subcategory.image_url) || '/Design 1.webp',
            description: subcategory.description || 'Most popular cake categories loved by everyone'
          }))
          setCategories(transformedCategories)
          const title = response.data.category?.name
          if (title) {
            setCategoryTitle(title)
          }
        } else {
          setError('Failed to fetch crowd favorite cakes')
        }
      } catch (err) {
        console.error('Error fetching crowd favorite cakes:', err)
        setError('Failed to load crowd favorite cakes')
        // Use static data as fallback
        setCategories(staticCategories)
      } finally {
        setLoading(false)
      }
    }

    fetchCrowdFavoriteCakes()
  }, [])

  // Use static data if no data from API
  const displayCategories = categories.length > 0 ? categories : staticCategories

  // Show loading state
  if (loading) {
    return (
      <section className="bg-gradient-to-b from-white to-pink-50 dark:from-gray-900 dark:to-gray-800 pt-12 pb-8 lg:pt-12 lg:pb-12">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-pink-500 border-t-transparent"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-300 text-sm leading-relaxed">Loading crowd favorite cakes...</p>
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

  const getTitleParts = (title) => {
    const cleanTitle = (title || '').trim()
    if (!cleanTitle) {
      return { first: '', rest: '' }
    }
    const parts = cleanTitle.split(' ')
    return {
      first: parts[0],
      rest: parts.slice(1).join(' ')
    }
  }

  const { first: titleFirst, rest: titleRest } = getTitleParts(categoryTitle)

  return (
    <section className="bg-gradient-to-b from-white to-pink-50 dark:from-gray-900 dark:to-gray-800 pt-12 pb-8 lg:pt-12 lg:pb-12">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Section Header - Improved Typography Hierarchy */}
          <div className="text-center mb-5 lg:mb-6">
            <div className="inline-block mb-3">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-px bg-gradient-to-r from-purple-400 to-pink-400 dark:from-purple-500 dark:to-pink-500"></div>
                <span className="px-4 text-xs font-semibold text-pink-500 dark:text-pink-400 uppercase tracking-widest leading-relaxed">CROWD-FAVORITE</span>
                <div className="w-12 h-px bg-gradient-to-r from-pink-400 to-purple-400 dark:from-pink-500 dark:to-purple-500"></div>
              </div>
              <h2 className="font-poppins text-2xl lg:text-3xl font-bold mb-1 leading-tight tracking-tight">
                <span className="text-purple-700 dark:text-purple-400">{titleFirst}</span>
                {titleRest && (
                  <span className="text-pink-600 dark:text-pink-400"> {titleRest}</span>
                )}
              </h2>
              <p className="font-inter text-gray-600 dark:text-gray-300 text-sm lg:text-lg max-w-2xl mx-auto leading-relaxed font-normal">
                Most popular cake categories loved by everyone
              </p>
            </div>
          </div>

          {/* Category Cards - Mobile: Vertical List, Desktop: 1x5 Grid */}
          <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-5 lg:gap-5">
            {displayCategories.map((category, index) => {
              const badgeText = index === 0 ? 'Trending' : index === 1 ? 'Top Pick' : null
              return (
              <div key={category.id} className="group">
                <div 
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-[#6c3e27]/15 dark:border-amber-700/30 shadow-[0_8px_20px_rgba(0,0,0,0.10)] dark:shadow-black/20 overflow-hidden hover:shadow-[0_14px_28px_rgba(0,0,0,0.16)] hover:-translate-y-0.5 hover:border-[#E65A5A]/40 transition-all duration-300 cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCategoryClick(category);
                  }}
                >
                  {/* Mobile Layout - All images on left, content on right */}
                  <div className="flex lg:hidden">
                    {/* Image Section - 40% width */}
                    <div className="w-2/5 relative overflow-hidden aspect-[4/3] rounded-l-2xl border-r border-[#6c3e27]/10 dark:border-amber-700/20">
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover object-center group-hover:scale-[1.04] transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/5 to-transparent"></div>
                      {badgeText && (
                        <div className="absolute top-2 left-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[9px] font-semibold uppercase tracking-[0.2em] px-2 py-0.5 shadow-md">
                          {badgeText}
                        </div>
                      )}
                    </div>
                    
                    {/* Content Section - 60% width */}
                    <div className="w-3/5 px-3 py-3 flex flex-col justify-between">
                      <div>
                        <h3 className="font-poppins font-semibold text-base mb-1 leading-tight text-gray-900 dark:text-gray-100 group-hover:text-[#8b4513] dark:group-hover:text-amber-300 transition-colors duration-300">
                          {category.name}
                        </h3>
                        <p className="font-inter text-gray-600 dark:text-gray-300 text-[11px] leading-relaxed line-clamp-2">
                          {category.description}
                        </p>
                      </div>
                      {/* Button Indicator */}
                      <div className="flex items-center justify-end mt-2">
                        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-[#ff3f6c]/10 to-rose-500/10 text-[#ff3f6c] text-[11px] font-semibold border border-[#ff3f6c]/30 group-hover:border-[#ff3f6c]/50 transition-colors duration-300">
                          <span>Explore</span>
                          <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                    
                  {/* Desktop Layout - 1x5 Grid with image on top, content below */}
                  <div className="hidden lg:block">
                    {/* Image Section - Top with 1:1 aspect ratio */}
                    <div className="w-full relative overflow-hidden aspect-square rounded-t-2xl border-b border-[#6c3e27]/10 dark:border-amber-700/20">
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover object-center group-hover:scale-[1.04] transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/5 to-transparent"></div>
                      {badgeText && (
                        <div className="absolute top-2 left-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[9px] font-semibold uppercase tracking-[0.2em] px-2 py-0.5 shadow-md">
                          {badgeText}
                        </div>
                      )}
                    </div>
                    
                    {/* Content Section - Bottom */}
                    <div className="px-4 py-3 text-center">
                      <h3 className="font-poppins font-semibold text-base mb-1.5 leading-tight text-gray-900 dark:text-gray-100 group-hover:text-[#8b4513] dark:group-hover:text-amber-300 transition-colors duration-300">
                        {category.name}
                      </h3>
                      <p className="font-inter text-gray-600 dark:text-gray-300 text-[11px] leading-relaxed line-clamp-2">
                        {category.description}
                      </p>
                      <div className="mt-2 flex items-center justify-center">
                        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-[#ff3f6c]/10 to-rose-500/10 text-[#ff3f6c] text-[11px] font-semibold border border-[#ff3f6c]/30 group-hover:border-[#ff3f6c]/50 transition-colors duration-300">
                          <span>Explore</span>
                          <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )})}
          </div>
        </div>
      </div>
    </section>
  )
}

export default CrowdFavoriteCakes
