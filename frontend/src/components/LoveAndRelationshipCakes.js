'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import loveAndRelationshipCakesAPI from '../api/loveAndRelationshipCakes'
import { resolveImageUrl } from '../utils/imageUrl'

const LoveAndRelationshipCakes = () => {
  const router = useRouter()
  const [relationships, setRelationships] = useState([])
  const [categoryTitle, setCategoryTitle] = useState('Love & Relationship Cakes')
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

  const renderAccentTitle = (name) => {
    const accentWords = ['Love', 'Him', 'Her', 'Father', 'Mother', 'Brother', 'Sister']
    const words = (name || '').split(' ')
    return (
      <>
        {words.map((word, index) => {
          const cleanWord = word.replace(/[^a-z]/gi, '')
          const isAccent = accentWords.includes(cleanWord)
          return (
            <span
              key={`${word}-${index}`}
              className={isAccent ? 'text-pink-600 dark:text-pink-400' : 'text-gray-900 dark:text-gray-100'}
            >
              {word}
              {index < words.length - 1 ? ' ' : ''}
            </span>
          )
        })}
      </>
    )
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
            image: resolveImageUrl(subcategory.image_url) || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
            icon: (
              <svg className="w-8 h-8 text-[#8B4513]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9ZM19 9H14V4H5V21H19V9Z"/>
              </svg>
            )
          }))
          setRelationships(transformedRelationships)
          const title = response.data.category?.name
          if (title) {
            setCategoryTitle(title)
          }
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
          {/* Section Header - Matching Pick a Cake by Flavor */}
          <div className="text-center mb-5 lg:mb-6">
            <div className="inline-block mb-3">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-px bg-gradient-to-r from-purple-400 to-pink-400 dark:from-purple-500 dark:to-pink-500"></div>
                <span className="px-4 text-xs font-semibold text-pink-500 dark:text-pink-400 uppercase tracking-[0.25em] leading-relaxed">LOVE & RELATIONSHIP</span>
                <div className="w-12 h-px bg-gradient-to-r from-pink-400 to-purple-400 dark:from-pink-500 dark:to-purple-500"></div>
              </div>
              <h2 className="font-poppins text-2xl lg:text-3xl font-bold mb-1 leading-tight tracking-tight">
                <span className="text-purple-700 dark:text-purple-400">{titleFirst}</span>
                {titleRest && (
                  <span className="text-pink-600 dark:text-pink-400"> {titleRest}</span>
                )}
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
                    <div className="love-card bg-white dark:bg-gray-800 rounded-2xl border border-pink-200/40 dark:border-pink-900/30 shadow-[0_8px_20px_rgba(0,0,0,0.10)] dark:shadow-black/20 overflow-hidden transition-all duration-300 hover:shadow-[0_14px_28px_rgba(255,63,108,0.18)] hover:-translate-y-0.5 hover:border-pink-400/50 h-full flex flex-col">
                      {/* Image Container with Elegant Design */}
                      <div className="relative w-full aspect-square overflow-hidden rounded-t-2xl">
                        <img 
                          src={relationship.image} 
                          alt={relationship.name}
                          className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent"></div>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-white/70 backdrop-blur px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-800 shadow-sm border border-white/60">
                          {relationship.name}
                        </div>
                      </div>
                      
                      {/* Category Name with Enhanced Styling */}
                      <div className="p-4 text-center flex-1 flex items-center justify-center bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50">
                        <div className="w-full">
                          <h3 className="font-poppins font-semibold text-base tracking-tight leading-tight">
                            {renderAccentTitle(relationship.name)}
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
                    className="love-card w-full bg-white dark:bg-gray-800 rounded-2xl border border-pink-200/40 dark:border-pink-900/30 shadow-[0_8px_20px_rgba(0,0,0,0.10)] dark:shadow-black/20 overflow-hidden transition-all duration-300 hover:shadow-[0_14px_28px_rgba(255,63,108,0.18)] hover:-translate-y-0.5 hover:border-pink-400/50 flex flex-col h-full"
                  >
                    {/* Image Container */}
                    <div className="relative w-full aspect-square overflow-hidden rounded-t-2xl">
                      <img 
                        src={relationship.image} 
                        alt={relationship.name}
                        className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent"></div>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-white/70 backdrop-blur px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-800 shadow-sm border border-white/60">
                        {relationship.name}
                      </div>
                    </div>
                    
                    {/* Category Name */}
                    <div className="p-3 text-center flex-1 flex items-center justify-center">
                      <h3 className="font-poppins font-semibold text-sm tracking-tight leading-tight">
                        {renderAccentTitle(relationship.name)}
                      </h3>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .love-card {
          position: relative;
          overflow: hidden;
        }
        .love-card:active {
          box-shadow: 0 0 0 6px rgba(255, 63, 108, 0.18);
        }
        .love-card:active::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, rgba(255, 63, 108, 0.25), transparent 45%);
          opacity: 1;
          transition: opacity 0.2s ease;
          pointer-events: none;
        }
      `}</style>
    </section>
  )
}

export default LoveAndRelationshipCakes
