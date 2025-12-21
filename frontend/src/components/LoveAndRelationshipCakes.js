'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import loveAndRelationshipCakesAPI from '../api/loveAndRelationshipCakes'

const LoveAndRelationshipCakes = () => {
  const router = useRouter()
  const [relationships, setRelationships] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const scrollContainerRef = useRef(null)

  // Static fallback data
  const staticRelationships = [
    {
      name: 'Cake for Brother',
      slug: 'cake-for-brother',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
      icon: (
        <svg className="w-8 h-8 text-[#8B4513]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9ZM19 9H14V4H5V21H19V9Z"/>
        </svg>
      )
    },
    {
      name: 'Cake for Father',
      slug: 'cake-for-father',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
      icon: (
        <svg className="w-8 h-8 text-[#8B4513]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9ZM19 9H14V4H5V21H19V9Z"/>
        </svg>
      )
    },
    {
      name: 'Cake for Her',
      slug: 'cake-for-her',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
      icon: (
        <svg className="w-8 h-8 text-[#8B4513]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9ZM19 9H14V4H5V21H19V9Z"/>
        </svg>
      )
    },
    {
      name: 'Cake for Him',
      slug: 'cake-for-him',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
      icon: (
        <svg className="w-8 h-8 text-[#8B4513]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9ZM19 9H14V4H5V21H19V9Z"/>
        </svg>
      )
    },
    {
      name: 'Cake for Mother',
      slug: 'cake-for-mother',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
      icon: (
        <svg className="w-8 h-8 text-[#8B4513]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9ZM19 9H14V4H5V21H19V9Z"/>
        </svg>
      )
    },
    {
      name: 'Cake for Sister',
      slug: 'cake-for-sister',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
      icon: (
        <svg className="w-8 h-8 text-[#8B4513]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9ZM19 9H14V4H5V21H19V9Z"/>
        </svg>
      )
    }
  ]

  // Navigation handler
  const handleRelationshipClick = (relationship) => {
    const slug = relationship.slug || relationship.name.toLowerCase().replace(/\s+/g, '-')
    const targetUrl = `/category/love-relationship-cakes/${slug}`
    console.log('Navigating to love-relationship category:', targetUrl)
    router.push(targetUrl)
  }

  // Scroll functions for horizontal scroll
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -220,
        behavior: 'smooth'
      })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 220,
        behavior: 'smooth'
      })
    }
  }

  useEffect(() => {
    const fetchLoveAndRelationshipCakes = async () => {
      try {
        setLoading(true)
        const response = await loveAndRelationshipCakesAPI.getLoveAndRelationshipCakes()
        if (response.success && response.data && response.data.subcategories) {
          // Transform subcategories to match the expected format
          const transformedRelationships = response.data.subcategories.map(subcategory => ({
            name: subcategory.name,
            slug: subcategory.name.toLowerCase().replace(/\s+/g, '-'),
            image: subcategory.image_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
            icon: (
              <svg className="w-8 h-8 text-[#8B4513]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9ZM19 9H14V4H5V21H19V9Z"/>
              </svg>
            )
          }))
          setRelationships(transformedRelationships)
        } else {
          setError('Failed to fetch love and relationship cakes')
        }
      } catch (err) {
        console.error('Error fetching love and relationship cakes:', err)
        setError('Failed to load love and relationship cakes')
        // Use static data as fallback
        setRelationships(staticRelationships)
      } finally {
        setLoading(false)
      }
    }

    fetchLoveAndRelationshipCakes()
  }, [])

  // Use static data if no data from API
  const displayRelationships = relationships.length > 0 ? relationships : staticRelationships

  // Show loading state
  if (loading) {
    return (
      <section className="bg-gradient-to-b from-white to-pink-50 dark:from-gray-900 dark:to-gray-800 pt-12 pb-8 lg:pt-12 lg:pb-12">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 dark:border-pink-400"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-300">Loading love and relationship cakes...</p>
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
            <div className="text-center py-8">
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Using fallback data</p>
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
          {/* Section Header - Matching Pick a Cake by Flavor */}
          <div className="text-center mb-5 lg:mb-6">
            <div className="inline-block mb-3">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-px bg-gradient-to-r from-purple-400 to-pink-400 dark:from-purple-500 dark:to-pink-500"></div>
                <span className="px-4 text-xs font-semibold text-pink-500 dark:text-pink-400 uppercase tracking-widest leading-relaxed">LOVE & RELATIONSHIP</span>
                <div className="w-12 h-px bg-gradient-to-r from-pink-400 to-purple-400 dark:from-pink-500 dark:to-purple-500"></div>
              </div>
              <h2 className="font-poppins text-2xl lg:text-3xl font-bold mb-1 leading-tight tracking-tight">
                <span className="text-purple-700 dark:text-purple-400">Love & Relationship</span>
                <span className="text-pink-600 dark:text-pink-400"> Cakes</span>
              </h2>
              <p className="font-inter text-gray-600 dark:text-gray-300 text-sm lg:text-lg max-w-2xl mx-auto leading-relaxed font-normal">
                Adding sweetness to every relationship
              </p>
            </div>
          </div>

          {/* Relationship Categories Grid */}
          <div className="relative">
            {/* Laptop/Desktop: Horizontal Scroll Layout with Navigation */}
            <div className="hidden lg:block relative">
              {/* Navigation Arrows */}
              <button 
                onClick={scrollLeft}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow-lg dark:shadow-xl dark:shadow-black/20 items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300 border border-gray-200 dark:border-gray-700 flex"
              >
                <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button 
                onClick={scrollRight}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow-lg dark:shadow-xl dark:shadow-black/20 items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300 border border-gray-200 dark:border-gray-700 flex"
              >
                <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <div 
                ref={scrollContainerRef}
                className="flex gap-4 lg:gap-6 overflow-x-auto pb-6 scrollbar-hide" 
                style={{
                  scrollSnapType: 'x mandatory',
                  WebkitOverflowScrolling: 'touch',
                  scrollBehavior: 'smooth'
                }}
              >
                {displayRelationships.map((relationship, index) => (
                  <div 
                    key={index} 
                    className="group cursor-pointer flex-shrink-0"
                    style={{ 
                      scrollSnapAlign: 'start',
                      width: '200px'
                    }}
                    onClick={() => handleRelationshipClick(relationship)}
                  >
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-[#6c3e27]/20 dark:border-amber-700/30 shadow-sm dark:shadow-md dark:shadow-black/10 overflow-hidden transition-all duration-300 hover:shadow-md hover:shadow-[#6c3e27]/5 dark:hover:shadow-amber-500/10 hover:border-[#6c3e27]/30 dark:hover:border-amber-500/40 hover:-translate-y-0.5 active:translate-y-0 h-full flex flex-col">
                      {/* Image Container with Elegant Design */}
                      <div className="relative w-full aspect-square overflow-hidden bg-gradient-to-br from-gray-50 via-pink-50/30 to-orange-50/30 dark:from-gray-700 dark:via-pink-900/10 dark:to-orange-900/10">
                        <img 
                          src={relationship.image} 
                          alt={relationship.name}
                          className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.02]"
                          loading="lazy"
                        />
                      </div>
                      
                      {/* Category Name with Enhanced Styling */}
                      <div className="p-4 text-center flex-1 flex items-center justify-center bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50">
                        <div className="w-full">
                          <h3 className="font-poppins font-semibold text-base text-[#6c3e27] dark:text-amber-400 group-hover:text-[#8b4513] dark:group-hover:text-amber-300 transition-colors duration-300 leading-tight">
                            {relationship.name}
                          </h3>
                          {/* Subtle animated underline accent on hover */}
                          <div className="mt-2 mx-auto w-0 h-0.5 bg-gradient-to-r from-pink-400/60 to-orange-400/60 dark:from-pink-500/60 dark:to-orange-500/60 group-hover:w-8 transition-all duration-300"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile: 2 Column Grid Layout */}
            <div className="lg:hidden grid grid-cols-2 gap-4">
              {displayRelationships.map((relationship, index) => (
                <div key={index} className="group">
                  <button 
                    onClick={() => handleRelationshipClick(relationship)}
                    className="w-full bg-white dark:bg-gray-800 rounded-xl border border-[#6c3e27]/20 dark:border-amber-700/30 shadow-sm dark:shadow-md dark:shadow-black/10 overflow-hidden transition-all duration-300 hover:shadow-md hover:shadow-[#6c3e27]/10 dark:hover:shadow-amber-500/20 hover:border-[#6c3e27]/40 dark:hover:border-amber-500/50 hover:-translate-y-1 active:translate-y-0 flex flex-col h-full"
                  >
                    {/* Image Container */}
                    <div className="relative w-full aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                      <img 
                        src={relationship.image} 
                        alt={relationship.name}
                        className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.02]"
                        loading="lazy"
                      />
                    </div>
                    
                    {/* Category Name */}
                    <div className="p-3 text-center flex-1 flex items-center justify-center">
                      <h3 className="font-inter font-semibold text-base text-[#6c3e27] dark:text-amber-400 group-hover:text-[#8b4513] dark:group-hover:text-amber-300 transition-colors duration-300">
                        {relationship.name}
                      </h3>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default LoveAndRelationshipCakes
