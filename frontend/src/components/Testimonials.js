'use client'

import React, { useState, useEffect } from 'react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Fallback testimonials if API fails
const getFallbackTestimonials = () => {
    return [
      {
        name: 'Priya Sharma',
        location: 'Bashratpur, Gorakhpur',
        rating: 5,
        comment: 'The birthday cake was absolutely perfect! Fresh, delicious, and delivered right on time. My daughter loved the design and everyone at the party was asking where I got it from.',
        avatar: '/images/testimonials/priya-sharma.jpg',
        stockAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
        occasion: 'Birthday Celebration',
        gender: 'female'
      },
      {
        name: 'Sneha Patel',
        location: 'Singharia, Gorakhpur',
        rating: 5,
        comment: 'Exceeded expectations',
        avatar: '/images/testimonials/sneha-patel.jpg',
        stockAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
        occasion: 'Special Occasion',
        gender: 'female'
      },
      {
        name: 'Rajesh Kumar',
        location: 'Bargadwa, Gorakhpur',
        rating: 5,
        comment: 'Great taste and quality',
        avatar: '/images/testimonials/rajesh-kumar.jpg',
        stockAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        occasion: 'Family Celebration',
        gender: 'male'
      }
    ]
}

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch testimonials from API
  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`${API_BASE_URL}/products/testimonials/list?limit=10`)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (data.success && data.data && data.data.testimonials) {
          setTestimonials(data.data.testimonials)
        } else {
          setError('No testimonials found')
          // Use fallback testimonials
          setTestimonials(getFallbackTestimonials())
        }
      } catch (err) {
        console.error('Error fetching testimonials:', err)
        setError('Failed to load testimonials')
        // Use fallback testimonials on error
        setTestimonials(getFallbackTestimonials())
      } finally {
        setLoading(false)
      }
    }

    fetchTestimonials()
  }, [])

  // Function to get the appropriate avatar image
  const getAvatarImage = (testimonial) => {
    // Always use stock avatar as fallback until user uploads real image
    // The stockAvatar is now gender-appropriate for each user
    return testimonial.stockAvatar
  }

  // Function to handle image loading errors (fallback to a default avatar if needed)
  const handleImageError = (event) => {
    // If stock avatar fails, we could set a default avatar here
    // For now, we'll keep the stock avatar as it should be reliable
    console.warn('Avatar image failed to load')
  }

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <svg
        key={index}
        className={`w-4 h-4 ${index < rating ? 'text-yellow-400 dark:text-yellow-500' : 'text-gray-300 dark:text-gray-600'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))
  }

  // Loading state
  if (loading) {
    return (
      <section className="bg-gradient-to-b from-white to-pink-50 dark:from-gray-900 dark:to-gray-800 pt-12 pb-8 lg:pt-12 lg:pb-12">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 dark:border-pink-400"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-300">Loading testimonials...</p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Don't render if no testimonials (error handled by fallback)
  if (testimonials.length === 0) {
    return null
  }

  return (
    <>
      {/* Custom CSS for hiding scrollbar */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      
      <section className="bg-gradient-to-b from-white to-pink-50 dark:from-gray-900 dark:to-gray-800 pt-12 pb-8 lg:pt-12 lg:pb-12">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-4 lg:mb-6">
              <div className="inline-flex items-center justify-center px-4 lg:px-6 py-1.5 lg:py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full mb-3 lg:mb-3 shadow-lg dark:shadow-xl dark:shadow-black/20 border border-pink-100 dark:border-pink-800/30 relative">
                <span className="text-xs font-bold text-pink-500 dark:text-pink-400 uppercase tracking-wider">Customer Stories</span>
                {/* Left gradient line */}
                <div className="absolute left-full ml-2 lg:ml-3 w-16 lg:w-20 h-px bg-gradient-to-r from-pink-300 dark:from-pink-500 to-transparent"></div>
                {/* Right gradient line */}
                <div className="absolute right-full mr-2 lg:mr-3 w-16 lg:w-20 h-px bg-gradient-to-l from-pink-300 dark:from-pink-500 to-transparent"></div>
              </div>
              <h2 className="font-poppins text-2xl lg:text-4xl font-bold mb-1 lg:mb-1">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 dark:from-purple-400 dark:to-pink-400">Sweet Stories</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-orange-500 dark:from-pink-400 dark:to-orange-400"> 🍰</span>
              </h2>
              <p className="font-inter text-gray-600 dark:text-gray-300 text-base lg:text-lg max-w-3xl mx-auto leading-relaxed">
                <span className="lg:hidden">Experiences from our customers</span>
                <span className="hidden lg:inline">Real experiences from happy customers across India</span>
              </p>
            </div>

            {/* Horizontal Scrolling Testimonials */}
            <div className="relative">
              {/* Scroll Container */}
              <div className="overflow-x-auto scrollbar-hide relative" style={{ WebkitOverflowScrolling: 'touch', scrollBehavior: 'smooth', scrollSnapType: 'x mandatory' }}>
                <div className="flex gap-3 lg:gap-5 pb-8 lg:pb-8" style={{ minWidth: 'max-content', display: 'flex' }}>
                  {testimonials.map((testimonial, index) => (
                    <div key={index} className="group flex-shrink-0" style={{ scrollSnapAlign: 'start' }}>
                      {/* Card Width: 1 column on mobile, 3 columns on desktop */}
                      <div className="w-[calc(100vw-3rem)] lg:w-[calc((100vw-4rem)/3)] max-w-sm lg:max-w-md">
                        {/* Modern Card Design */}
                        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg dark:shadow-xl dark:shadow-black/20 hover:shadow-xl dark:hover:shadow-2xl dark:hover:shadow-black/30 transition-all duration-300 border-2 border-pink-200 dark:border-pink-800/30 overflow-hidden group-hover:scale-[1.02] group-hover:-translate-y-1 h-full">
                          {/* Card Header with Avatar and Rating */}
                          <div className="p-3 lg:p-4 pb-2 lg:pb-2">
                            <div className="flex items-start mb-2 lg:mb-2">
                              <div className="w-10 h-10 lg:w-12 lg:h-12 flex-shrink-0 mr-2 lg:mr-3">
                                <img
                                  src={getAvatarImage(testimonial)}
                                  alt={testimonial.name}
                                  className="w-full h-full object-cover object-center rounded-full border-2 border-pink-100 dark:border-pink-800/30 shadow-sm"
                                />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1 lg:mb-1">
                                  <h3 className="font-poppins font-bold text-base lg:text-lg text-gray-900 dark:text-gray-100 truncate">
                                    {testimonial.name}
                                  </h3>
                                  <div className="flex items-center space-x-1">
                                    {renderStars(testimonial.rating)}
                                  </div>
                                </div>
                                
                                <p className="font-inter text-xs lg:text-sm text-pink-600 dark:text-pink-400 font-medium mb-0.5">
                                  {testimonial.occasion}
                                </p>
                                
                                <p className="font-inter text-xs lg:text-sm text-gray-500 dark:text-gray-400">
                                  {testimonial.location}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Comment */}
                          <div className="px-3 lg:px-4 pb-2 lg:pb-2">
                            <blockquote className="font-inter text-gray-700 dark:text-gray-300 text-sm lg:text-sm leading-relaxed italic text-justify">
                              "{testimonial.comment}"
                            </blockquote>
                          </div>
                          
                          {/* Trust indicators */}
                          <div className="px-3 lg:px-4 pb-3 lg:pb-3">
                            <div className="flex items-center justify-between pt-2 lg:pt-2 border-t border-pink-100/50 dark:border-pink-800/30">
                              <div className="flex items-center space-x-2 lg:space-x-2">
                                <div className="flex items-center space-x-1 lg:space-x-1">
                                  <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-green-400 dark:bg-green-500 rounded-full shadow-sm"></div>
                                  <span className="font-inter text-xs text-green-600 dark:text-green-400 font-medium">Verified</span>
                                </div>
                                <div className="flex items-center space-x-1 lg:space-x-1">
                                  <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-blue-400 dark:bg-blue-500 rounded-full shadow-sm"></div>
                                  <span className="font-inter text-xs text-blue-600 dark:text-blue-400 font-medium">On-time</span>
                                </div>
                              </div>
                              
                              <div className="text-right">
                                <p className="font-inter text-xs text-amber-600 dark:text-amber-400 font-medium">
                                  Real customer
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Floating Footer - Scroll Indicators */}
                {testimonials.length > 1 && (
                  <div className="absolute bottom-2 right-2 z-10">
                    <span className="font-inter text-sm text-[#6c3e27] dark:text-amber-400 font-light italic bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm dark:shadow-md dark:shadow-black/20 border border-pink-100 dark:border-pink-800/30">
                      {testimonials.length > 3 ? `Swipe to see ${testimonials.length} stories →` : 'Swipe to see more →'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Trust Statistics */}
            <div className="text-center mt-6 lg:mt-8">
              <div className="bg-gradient-to-br from-white/95 to-pink-50/80 dark:from-gray-800/95 dark:to-gray-800/80 backdrop-blur-sm rounded-3xl p-4 lg:p-6 shadow-2xl dark:shadow-2xl dark:shadow-black/30 border-2 border-pink-200 dark:border-pink-800/30 lg:border-0 relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-pink-200/20 to-orange-200/20 dark:from-pink-900/20 dark:to-orange-900/20 rounded-full -translate-y-12 translate-x-12"></div>
                <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-orange-200/20 to-pink-200/20 dark:from-orange-900/20 dark:to-pink-900/20 rounded-full translate-y-8 -translate-x-8"></div>
                
                {/* Header with enhanced styling - compact */}
                <div className="relative z-10 mb-4 lg:mb-5">
                  <div className="inline-flex items-center justify-center px-3 lg:px-4 py-1.5 lg:py-2 bg-gradient-to-r from-pink-100 to-orange-100 dark:from-pink-900/30 dark:to-orange-900/30 rounded-full mb-3 lg:mb-3 shadow-lg dark:shadow-xl dark:shadow-black/20 border border-pink-200 dark:border-pink-800/30">
                    <span className="text-xs font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wider">Trusted Choice</span>
                  </div>
                  <h3 className="font-poppins text-lg lg:text-2xl font-bold text-gray-800 dark:text-gray-100">
                    <span className="lg:hidden">Why choose Creamingo?</span>
                    <span className="hidden lg:inline">Why choose Creamingo?</span>
                  </h3>
                </div>
                
                {/* Statistics grid with enhanced styling - compact */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 relative z-10">
                  <div className="text-center group">
                    <div className="bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm rounded-xl p-2 lg:p-3 shadow-lg dark:shadow-xl dark:shadow-black/20 border border-pink-100 dark:border-pink-800/30 group-hover:shadow-xl dark:group-hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                      <div className="text-xl lg:text-2xl font-bold text-pink-600 dark:text-pink-400 mb-1">10K+</div>
                      <div className="text-xs text-gray-600 dark:text-gray-300 font-medium">Happy Customers</div>
                    </div>
                  </div>
                  <div className="text-center group">
                    <div className="bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm rounded-xl p-2 lg:p-3 shadow-lg dark:shadow-xl dark:shadow-black/20 border border-orange-100 dark:border-orange-800/30 group-hover:shadow-xl dark:group-hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                      <div className="text-xl lg:text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">4.9★</div>
                      <div className="text-xs text-gray-600 dark:text-gray-300 font-medium">Average Rating</div>
                    </div>
                  </div>
                  <div className="text-center group">
                    <div className="bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm rounded-xl p-2 lg:p-3 shadow-lg dark:shadow-xl dark:shadow-black/20 border border-purple-100 dark:border-purple-800/30 group-hover:shadow-xl dark:group-hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                      <div className="text-xl lg:text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">98%</div>
                      <div className="text-xs text-gray-600 dark:text-gray-300 font-medium">On-time Delivery</div>
                    </div>
                  </div>
                  <div className="text-center group">
                    <div className="bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm rounded-xl p-2 lg:p-3 shadow-lg dark:shadow-xl dark:shadow-black/20 border border-green-100 dark:border-green-800/30 group-hover:shadow-xl dark:group-hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                      <div className="text-xl lg:text-2xl font-bold text-green-600 dark:text-green-400 mb-1">24/7</div>
                      <div className="text-xs text-gray-600 dark:text-gray-300 font-medium">Customer Support</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default Testimonials
