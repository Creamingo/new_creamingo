'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import milestoneYearCakesAPI from '../api/milestoneYearCakes'
import { resolveImageUrl } from '../utils/imageUrl'

export default function CakesForMilestone() {
  const router = useRouter()
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Static fallback data - Ordered with 1/2 first, then 1, then others
  const staticMilestones = [
    {
      id: 2,
      year: '1/2',
      label: '1/2 YEAR',
      slug: '1-2-year',
      image: '/Design 2.webp',
      gradient: 'from-pink-400 via-rose-400 to-pink-500'
    },
    {
      id: 1,
      year: '1',
      label: '1 YEAR',
      slug: '1-year',
      image: '/Design 1.webp',
      gradient: 'from-blue-400 via-indigo-400 to-blue-500'
    },
    {
      id: 3,
      year: '5',
      label: '5 YEARS',
      slug: '5-year',
      image: '/Design 3.webp',
      gradient: 'from-purple-400 via-violet-400 to-purple-500'
    },
    {
      id: 4,
      year: '10',
      label: '10 YEARS',
      slug: '10-year',
      image: '/Design 4.webp',
      gradient: 'from-orange-400 via-red-400 to-orange-500'
    },
    {
      id: 5,
      year: '25',
      label: '25 YEARS',
      slug: '25-year',
      image: '/Design 1.webp',
      gradient: 'from-emerald-400 via-teal-400 to-emerald-500'
    },
    {
      id: 6,
      year: '50',
      label: '50 YEARS',
      slug: '50-year',
      image: '/Design 2.webp',
      gradient: 'from-amber-400 via-yellow-400 to-amber-500'
    }
  ]

  // Navigation handler
  const handleMilestoneClick = (milestone) => {
    const slug = milestone.slug || milestone.year.toLowerCase().replace(/\//g, '-')
    const targetUrl = `/category/milestone-year-cakes/${slug}`
    console.log('Navigating to milestone-year category:', targetUrl)
    router.push(targetUrl)
  }

  // Helper function to extract year from subcategory name
  const extractYearFromName = (name) => {
    // Handle "Half Year" or "HALF YEAR" and convert to "1/2"
    const lowerName = name.toLowerCase();
    if (lowerName.includes('half') || lowerName.includes('1/2')) {
      return '1/2';
    }
    
    // Extract numbers from the name (e.g., "1/2 Year" -> "1/2", "25 Years" -> "25")
    const match = name.match(/(\d+(?:\/\d+)?)/);
    return match ? match[1] : name;
  }

  // Helper function to create label from subcategory name
  const createLabelFromName = (name) => {
    // Convert "1/2 Year" to "1/2 YEAR", "25 Years" to "25 YEARS"
    return name.toUpperCase();
  }

  // Helper function to get gradient based on year
  const getGradientForYear = (year) => {
    const gradients = {
      '1/2': 'from-pink-400 via-rose-400 to-pink-500',
      '1': 'from-blue-400 via-indigo-400 to-blue-500',
      '5': 'from-purple-400 via-violet-400 to-purple-500',
      '10': 'from-orange-400 via-red-400 to-orange-500',
      '25': 'from-emerald-400 via-teal-400 to-emerald-500',
      '50': 'from-amber-400 via-yellow-400 to-amber-500'
    };
    return gradients[year] || 'from-gray-400 via-gray-500 to-gray-600';
  }

  // Helper function to sort milestones - 1/2 first, then numeric order
  const sortMilestones = (milestones) => {
    return [...milestones].sort((a, b) => {
      // Put 1/2 first
      if (a.year === '1/2') return -1;
      if (b.year === '1/2') return 1;
      
      // Convert to numbers for comparison
      const aNum = parseFloat(a.year);
      const bNum = parseFloat(b.year);
      
      return aNum - bNum;
    });
  }

  useEffect(() => {
    const fetchMilestoneYearCakes = async () => {
      try {
        setLoading(true)
        const response = await milestoneYearCakesAPI.getMilestoneYearCakes()
        if (response.success && response.data && response.data.subcategories) {
          // Transform subcategories to match the expected format
          const transformedMilestones = response.data.subcategories.map((subcategory, index) => {
            const year = extractYearFromName(subcategory.name);
            return {
              id: subcategory.id,
              year: year,
              label: createLabelFromName(subcategory.name),
              slug: subcategory.name.toLowerCase().replace(/\s+/g, '-').replace(/\//g, '-'),
              image: resolveImageUrl(subcategory.image_url) || '/Design 1.webp',
              gradient: getGradientForYear(year)
            };
          });
          // Sort milestones: 1/2 first, then numeric order
          const sortedMilestones = sortMilestones(transformedMilestones);
          setMilestones(sortedMilestones)
        } else {
          setError('Failed to fetch milestone year cakes')
        }
      } catch (err) {
        console.error('Error fetching milestone year cakes:', err)
        setError('Failed to load milestone year cakes')
        // Use static data as fallback
        setMilestones(staticMilestones)
      } finally {
        setLoading(false)
      }
    }

    fetchMilestoneYearCakes()
  }, [])

  // Use static data if no data from API
  const displayMilestones = milestones.length > 0 ? milestones : staticMilestones

  // Show loading state
  if (loading) {
    return (
      <section className="bg-gradient-to-b from-white to-pink-50 dark:from-gray-900 dark:to-gray-800 pt-12 pb-8 lg:pt-12 lg:pb-12">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 dark:border-pink-400"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-300">Loading milestone year cakes...</p>
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
          {/* Section Header - Matching other sections */}
          <div className="text-center mb-5 lg:mb-6">
            <div className="inline-block mb-3">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-px bg-gradient-to-r from-purple-400 to-pink-400 dark:from-purple-500 dark:to-pink-500"></div>
                <span className="px-4 text-xs font-semibold text-pink-500 dark:text-pink-400 uppercase tracking-widest leading-relaxed">MILESTONE YEARS</span>
                <div className="w-12 h-px bg-gradient-to-r from-pink-400 to-purple-400 dark:from-pink-500 dark:to-purple-500"></div>
              </div>
              <h2 className="font-poppins text-2xl lg:text-3xl font-bold mb-1 leading-tight tracking-tight">
                <span className="text-purple-700 dark:text-purple-400">Cakes for Every</span>
                <span className="text-pink-600 dark:text-pink-400"> Milestone Year</span>
              </h2>
              <p className="font-inter text-gray-600 dark:text-gray-300 text-sm lg:text-lg max-w-2xl mx-auto leading-relaxed font-normal">
                Turning milestones into memories, one cake at a time!
              </p>
            </div>
          </div>

          {/* Mobile Version - Enhanced Two column grid */}
          <div className="lg:hidden">
            <div className="grid grid-cols-2 gap-4">
              {displayMilestones.map((milestone) => (
                <div key={milestone.id} className="group">
                  <button 
                    onClick={() => handleMilestoneClick(milestone)}
                    className="relative bg-gradient-to-br from-white via-pink-50 to-orange-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 rounded-xl border-2 border-transparent bg-gradient-to-r from-pink-200 via-orange-200 to-pink-200 dark:from-pink-900/30 dark:via-orange-900/30 dark:to-pink-900/30 p-0.5 shadow-lg dark:shadow-xl dark:shadow-black/20 hover:shadow-md hover:shadow-[#6c3e27]/5 dark:hover:shadow-amber-500/10 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer w-full"
                  >
                    <div className="bg-gradient-to-br from-white to-pink-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 text-center relative overflow-hidden">
                      {/* Floating decorative elements */}
                      <div className="absolute top-2 right-2 w-3 h-3 bg-gradient-to-r from-pink-300 to-orange-300 rounded-full opacity-60"></div>
                      <div className="absolute bottom-2 left-2 w-2 h-2 bg-gradient-to-r from-orange-300 to-pink-300 rounded-full opacity-60"></div>
                      
                      <div className="relative mb-3">
                        <div className={`w-12 h-12 mx-auto bg-gradient-to-br ${milestone.gradient} rounded-full flex items-center justify-center mb-2 shadow-lg relative`}>
                          <span className={`font-poppins font-bold text-white drop-shadow-sm ${milestone.year === '1/2' ? 'text-sm' : 'text-lg'}`}>
                            {milestone.year}
                          </span>
                          {/* Glowing effect */}
                          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full"></div>
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </div>
                      </div>
                      <h3 className="font-poppins font-bold text-sm bg-gradient-to-r from-[#8b4513] via-[#a0522d] to-[#8b4513] dark:from-amber-500 dark:via-amber-400 dark:to-amber-500 bg-clip-text text-transparent transition-all duration-300">
                        {milestone.label}
                      </h3>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop Version - Enhanced 3x2 grid */}
          <div className="hidden lg:block">
            <div className="bg-gradient-to-br from-white via-pink-50 to-orange-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 rounded-2xl border border-pink-200 dark:border-pink-800/30 p-8 shadow-xl dark:shadow-2xl dark:shadow-black/20 relative overflow-hidden">
              {/* Desktop background decorative elements */}
              <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-br from-pink-200 to-orange-200 dark:from-pink-900/30 dark:to-orange-900/30 rounded-full opacity-40"></div>
              <div className="absolute bottom-4 left-4 w-6 h-6 bg-gradient-to-br from-orange-200 to-pink-200 dark:from-orange-900/30 dark:to-pink-900/30 rounded-full opacity-40"></div>
              
              <div className="grid grid-cols-3 gap-6 relative z-10">
                {displayMilestones.map((milestone) => (
                  <div key={milestone.id} className="group">
                    <button 
                      onClick={() => handleMilestoneClick(milestone)}
                      className="relative bg-gradient-to-br from-white via-pink-50 to-orange-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 rounded-xl border-2 border-transparent bg-gradient-to-r from-pink-200 via-orange-200 to-pink-200 dark:from-pink-900/30 dark:via-orange-900/30 dark:to-pink-900/30 p-0.5 shadow-lg dark:shadow-xl dark:shadow-black/20 hover:shadow-md hover:shadow-[#6c3e27]/5 dark:hover:shadow-amber-500/10 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer w-full"
                    >
                      <div className="bg-gradient-to-br from-white to-pink-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 text-center relative overflow-hidden">
                        {/* Floating decorative elements */}
                        <div className="absolute top-3 right-3 w-4 h-4 bg-gradient-to-r from-pink-300 to-orange-300 rounded-full opacity-60"></div>
                        <div className="absolute bottom-3 left-3 w-3 h-3 bg-gradient-to-r from-orange-300 to-pink-300 rounded-full opacity-60"></div>
                        
                        <div className="relative mb-4">
                          <div className={`w-16 h-16 mx-auto bg-gradient-to-br ${milestone.gradient} rounded-full flex items-center justify-center mb-3 shadow-xl relative`}>
                            <span className={`font-poppins font-bold text-white drop-shadow-sm ${milestone.year === '1/2' ? 'text-lg' : 'text-2xl'}`}>
                              {milestone.year}
                            </span>
                            {/* Glowing effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-full"></div>
                          </div>
                          <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </div>
                        </div>
                        <h3 className="font-poppins font-bold text-lg bg-gradient-to-r from-[#8b4513] via-[#a0522d] to-[#8b4513] dark:from-amber-500 dark:via-amber-400 dark:to-amber-500 bg-clip-text text-transparent transition-all duration-300">
                          {milestone.label}
                        </h3>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
