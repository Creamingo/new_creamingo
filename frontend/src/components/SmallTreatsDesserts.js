import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import smallTreatsDessertsAPI from '../api/smallTreatsDesserts'

const SmallTreatsDesserts = () => {
  const router = useRouter()
  const [categories, setCategories] = useState([
    {
      name: 'Pastries',
      slug: 'pastries',
      image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&h=600&fit=crop',
      description: 'Flaky, buttery delights'
    },
    {
      name: 'Puddings',
      slug: 'puddings',
      image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&h=600&fit=crop',
      description: 'Smooth, creamy comfort'
    },
    {
      name: 'Brownies',
      slug: 'brownies',
      image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&h=600&fit=crop',
      description: 'Rich, chocolatey squares'
    },
    {
      name: 'Cookies',
      slug: 'cookies',
      image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&h=600&fit=crop',
      description: 'Classic sweet treats'
    }
  ])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Navigation handler for subcategories
  const handleSubcategoryClick = (subcategory) => {
    const targetUrl = `/category/small-treats-desserts/${subcategory.slug}`
    console.log('Navigating to small treats subcategory:', targetUrl)
    router.push(targetUrl)
  }

  useEffect(() => {
    const fetchSmallTreatsDesserts = async () => {
      try {
        setLoading(true)
        const response = await smallTreatsDessertsAPI.getSmallTreatsDesserts()
        if (response.success && response.data && response.data.subcategories) {
          // Transform subcategories to match the expected format
          const transformedCategories = response.data.subcategories.map(subcategory => ({
            name: subcategory.name,
            slug: subcategory.name.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and'),
            image: subcategory.image_url || 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&h=600&fit=crop',
            description: subcategory.description || 'Delicious sweet treat'
          }))
          
          setCategories(transformedCategories)
        } else {
          setError('Failed to fetch small treats desserts data')
        }
      } catch (err) {
        console.error('Error fetching small treats desserts:', err)
        setError('Failed to load small treats desserts data')
        // Keep using static data as fallback
      } finally {
        setLoading(false)
      }
    }

    fetchSmallTreatsDesserts()
  }, [])

  // Show loading state
  if (loading) {
    return (
      <section className="relative bg-pink-100 dark:bg-gray-800 py-16 lg:py-20">
        <div className="w-full px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 dark:border-pink-400"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-300">Loading small treats desserts...</p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Show error state
  if (error) {
    return (
      <section className="relative bg-pink-100 dark:bg-gray-800 py-16 lg:py-20">
        <div className="w-full px-6 lg:px-8">
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
      <section className="relative bg-pink-100 dark:bg-gray-800 py-16 lg:py-20">
        {/* Scalloped Separator Border */}
        <div className="absolute top-0 left-0 right-0 h-8 lg:h-12 overflow-hidden">
          <div className="w-full h-full bg-white dark:bg-gray-900 relative">
            {/* Scalloped edge design */}
            <svg 
              className="absolute bottom-0 left-0 w-full h-full" 
              viewBox="0 0 1200 48" 
              preserveAspectRatio="none"
            >
              <path 
                d="M0,48 Q150,0 300,48 Q450,0 600,48 Q750,0 900,48 Q1050,0 1200,48 L1200,48 L0,48 Z" 
                className="fill-pink-100 dark:fill-gray-800"
              />
            </svg>
          </div>
        </div>

      <div className="w-full px-6 lg:px-8 relative z-10 pb-0 lg:pb-8">
        <div className="max-w-7xl mx-auto">
                     {/* Section Header */}
           <div className="text-center mb-8 lg:mb-16">
             <div className="inline-flex items-center justify-center px-4 py-1.5 bg-white dark:bg-gray-800 rounded-full mb-6 shadow-md dark:shadow-lg dark:shadow-black/20 relative border border-pink-200 dark:border-pink-800/30">
               <span className="text-xs font-bold text-pink-500 dark:text-pink-400 uppercase tracking-wider">Sweet Treats</span>
               {/* Left gradient line */}
               <div className="absolute left-full ml-2 w-16 h-px bg-gradient-to-r from-pink-300 dark:from-pink-500 to-transparent"></div>
               {/* Right gradient line */}
               <div className="absolute right-full mr-2 w-16 h-px bg-gradient-to-l from-pink-300 dark:from-pink-500 to-transparent"></div>
             </div>
             <h2 className="font-poppins text-2xl lg:text-4xl font-bold mb-2">
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 dark:from-purple-400 dark:to-pink-400">Small Treats</span>
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-orange-500 dark:from-pink-400 dark:to-orange-400"> Desserts</span>
             </h2>
             <p className="font-inter text-gray-600 dark:text-gray-300 text-base lg:text-xl max-w-2xl mx-auto leading-relaxed">
               Sweet bites for every mood
             </p>
           </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
            {categories.map((category, index) => (
              <div key={index} className="group">
                                 {/* Mobile Layout - Compact & Efficient Design */}
                 <div className="lg:hidden mb-1">
                   <button 
                     onClick={() => handleSubcategoryClick(category)}
                     className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-md dark:shadow-black/20 overflow-hidden hover:shadow-md dark:hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-300 dark:focus:ring-pink-500 focus:ring-opacity-50 active:scale-[0.98] border border-pink-200 dark:border-pink-800/30"
                   >
                                                              <div className="flex items-start p-3">
                       {/* Compact Image Section */}
                       <div className="w-24 h-24 flex-shrink-0 mr-4">
                         <img
                           src={category.image}
                           alt={category.name}
                           className="w-full h-full object-cover object-center rounded-lg"
                         />
                       </div>
                       
                       {/* Compact Content Section */}
                       <div className="flex-1 min-w-0">
                         {/* Header with Arrow */}
                         <div className="flex items-center justify-between mb-2">
                           <h3 className="font-poppins font-bold text-[22px] text-gray-900 dark:text-gray-100 truncate text-left">
                             {category.name}
                           </h3>
                           <div className="w-8 h-8 bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-900/30 dark:to-pink-800/30 rounded-full flex items-center justify-center ml-2 flex-shrink-0 shadow-sm border border-pink-200 dark:border-pink-800/30 group-hover:from-pink-200 group-hover:to-pink-300 dark:group-hover:from-pink-800/40 dark:group-hover:to-pink-700/40 group-hover:shadow-md transition-all duration-200">
                             <svg 
                               className="w-4 h-4 text-pink-600 dark:text-pink-400 group-hover:text-pink-700 dark:group-hover:text-pink-300 group-hover:translate-x-0.5 transition-all duration-200" 
                               fill="none" 
                               stroke="currentColor" 
                               viewBox="0 0 24 24"
                               strokeWidth="2.5"
                             >
                               <path 
                                 strokeLinecap="round" 
                                 strokeLinejoin="round" 
                                 d="M13 7l5 5m0 0l-5 5m5-5H6" 
                               />
                             </svg>
                           </div>
                         </div>
                         
                                                   {/* Description */}
                          <p className="font-inter text-gray-600 dark:text-gray-300 text-sm leading-tight mb-4 text-left">
                            {category.description}
                          </p>
                          
                                                     {/* Suggestion Text */}
                           <div className="text-right">
                             <p className="font-inter text-xs text-amber-700 dark:text-amber-400 font-medium italic">
                               Tap to view & shop flavors
                             </p>
                           </div>
                        </div>
                      </div>
                    </button>
                  </div>

                {/* Desktop Layout - Same as Curated Collections */}
                <button 
                  onClick={() => handleSubcategoryClick(category)}
                  className="hidden lg:flex w-full bg-white dark:bg-gray-800 border border-pink-200 dark:border-pink-800/30 rounded-3xl overflow-hidden hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:border-pink-300 dark:hover:border-pink-700 hover:shadow-lg dark:hover:shadow-xl dark:hover:shadow-black/20 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-300 dark:focus:ring-pink-500 focus:ring-opacity-50 active:scale-[0.98]"
                >
                  {/* Image Section - Left side with 45% width */}
                  <div className="w-[45%] p-2 relative overflow-hidden">
                    <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden">
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover object-center"
                      />
                    </div>
                  </div>
                  
                  {/* Content Section - Right side with 55% width */}
                  <div className="w-[55%] p-6 flex flex-col justify-start text-left">
                    <h3 className="font-poppins font-bold text-2xl lg:text-3xl mb-2 text-gray-800 dark:text-gray-100">
                      {category.name} <span className="ml-2 lg:ml-3 text-2xl lg:text-3xl">→</span>
                    </h3>
                    <ul className="space-y-1 mt-1">
                      <li className="font-inter text-gray-500 dark:text-gray-400 text-base lg:text-lg flex items-center">
                        <span className="w-2 h-2 bg-pink-400 dark:bg-pink-500 rounded-full mr-3 flex-shrink-0"></span>
                        {category.description}
                      </li>
                    </ul>
                    
                    {/* Heading + Suggestions Section */}
                    <div className="mt-4 pt-4 border-t border-pink-100 dark:border-pink-800/30">
                      <h4 className="font-poppins font-semibold text-sm text-pink-600 dark:text-pink-400 mb-2 text-left">Popular Choices</h4>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 text-xs rounded-full border border-pink-200 dark:border-pink-800/30 hover:bg-pink-100 dark:hover:bg-pink-900/40 transition-colors duration-200">Chocolate</span>
                        <span className="px-2 py-1 bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 text-xs rounded-full border border-pink-200 dark:border-pink-800/30 hover:bg-pink-100 dark:hover:bg-pink-900/40 transition-colors duration-200">Vanilla</span>
                        <span className="px-2 py-1 bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 text-xs rounded-full border border-pink-200 dark:border-pink-800/30 hover:bg-pink-100 dark:hover:bg-pink-900/40 transition-colors duration-200">Strawberry</span>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

        {/* Scalloped Separator Border - Bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-8 lg:h-12 overflow-hidden">
          <div className="w-full h-full bg-white dark:bg-gray-900 relative">
            {/* Scalloped edge design - flipped for bottom */}
            <svg 
              className="absolute top-0 left-0 w-full h-full" 
              viewBox="0 0 1200 48" 
              preserveAspectRatio="none"
            >
              <path 
                d="M0,0 Q150,48 300,0 Q450,48 600,0 Q750,48 900,0 Q1050,48 1200,0 L1200,0 L0,0 Z" 
                className="fill-pink-100 dark:fill-gray-800"
              />
            </svg>
          </div>
        </div>
    </section>
  )
}

export default SmallTreatsDesserts
