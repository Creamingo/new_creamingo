'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import cakeFlavorCategoryAPI from '../api/cakeFlavorCategories'

export default function CakeByFlavor() {
  const router = useRouter()
  const [subcategories, setSubcategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [navigatingId, setNavigatingId] = useState(null)

  useEffect(() => {
    const fetchCakeFlavors = async () => {
      try {
        setLoading(true)
        console.log('Fetching cake flavor subcategories from database...')
        const response = await cakeFlavorCategoryAPI.getCakeFlavorCategory()
        console.log('Cake flavor API response:', response)
        
        if (response.success && response.data && response.data.subcategories) {
          console.log('Setting subcategories from database:', response.data.subcategories)
          setSubcategories(response.data.subcategories)
        } else {
          setError('Failed to fetch cake flavor subcategories')
        }
      } catch (err) {
        console.error('Error fetching cake flavor subcategories:', err)
        setError('Failed to load cake flavor subcategories from database')
        // Don't use fallback data - let the error show
      } finally {
        setLoading(false)
      }
    }

    fetchCakeFlavors()
  }, [])

  // Handle flavor button click
  const handleFlavorClick = (subcategory, event) => {
    // Prevent default behavior and stop propagation
    event.preventDefault()
    event.stopPropagation()
    
    // Prevent multiple rapid clicks on the same button
    if (navigatingId === subcategory.id) {
      console.log('Navigation already in progress for this flavor, ignoring click')
      return
    }
    
    setNavigatingId(subcategory.id)
    console.log('Navigating to flavor:', subcategory.name)
    const slug = subcategory.name.toLowerCase().replace(/\s+/g, '-')
    const targetUrl = `/category/cakes-by-flavor/${slug}`
    
    console.log('Target URL:', targetUrl)
    
    // Use router.push for navigation
    try {
      router.push(targetUrl)
      console.log('Navigation initiated to:', targetUrl)
    } catch (error) {
      console.error('Navigation failed:', error)
      setNavigatingId(null)
    }
    
    // Reset navigating state after a short delay
    setTimeout(() => {
      setNavigatingId(null)
    }, 500)
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
                <span className="px-4 text-xs font-semibold text-pink-500 dark:text-pink-400 uppercase tracking-widest leading-relaxed">FLAVOURED</span>
                <div className="w-12 h-px bg-gradient-to-r from-pink-400 to-purple-400 dark:from-pink-500 dark:to-purple-500"></div>
              </div>
              <h2 className="font-poppins text-2xl lg:text-3xl font-bold mb-1 leading-tight tracking-tight">
                <span className="text-purple-700 dark:text-purple-400">Pick a</span>
                <span className="text-pink-600 dark:text-pink-400"> Cake by Flavor</span>
              </h2>
              <p className="font-inter text-gray-600 dark:text-gray-300 text-sm lg:text-lg max-w-2xl mx-auto leading-relaxed font-normal">
                Your celebrations, our speedy cake delivery
              </p>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-pink-500 border-t-transparent"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-300 text-sm leading-relaxed">Loading cake flavors...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="text-center py-12">
              <p className="text-red-600 dark:text-red-400 mb-2 font-medium leading-relaxed">{error}</p>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">Please check your connection and try again</p>
            </div>
          )}

          {/* Mobile Version - Clean Design with Subtle Shadows */}
          {!loading && !error && subcategories.length > 0 && (
            <div className="lg:hidden">
              <div className="grid grid-cols-2 gap-4">
                {subcategories.map((subcategory, index) => (
                  <div key={subcategory.id || index} className="group">
                    <button 
                      onClick={(e) => handleFlavorClick(subcategory, e)}
                      disabled={navigatingId === subcategory.id}
                      className={`w-full bg-white dark:bg-gray-800 rounded-xl border border-[#6c3e27]/20 dark:border-amber-700/30 p-5 text-center shadow-sm dark:shadow-md dark:shadow-black/10 hover:shadow-lg hover:shadow-[#6c3e27]/10 dark:hover:shadow-amber-500/20 hover:border-[#6c3e27]/40 dark:hover:border-amber-500/50 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 cursor-pointer ${navigatingId === subcategory.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <h3 className="font-poppins font-semibold text-base text-[#6c3e27] dark:text-amber-400 group-hover:text-[#8b4513] dark:group-hover:text-amber-300 transition-colors duration-300 leading-relaxed tracking-normal">
                        {navigatingId === subcategory.id ? 'Loading...' : subcategory.name}
                      </h3>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Desktop Version - Clean Grid without Container Box */}
          {!loading && !error && subcategories.length > 0 && (
            <div className="hidden lg:block">
              <div className="grid grid-cols-5 gap-5">
                {subcategories.map((subcategory, index) => (
                  <div key={subcategory.id || index} className="group">
                    <button 
                      onClick={(e) => handleFlavorClick(subcategory, e)}
                      disabled={navigatingId === subcategory.id}
                      className={`w-full bg-white dark:bg-gray-800 rounded-xl border border-[#6c3e27]/20 dark:border-amber-700/30 p-4 text-center shadow-sm dark:shadow-md dark:shadow-black/10 hover:shadow-md hover:shadow-[#6c3e27]/5 dark:hover:shadow-amber-500/10 hover:border-[#6c3e27]/30 dark:hover:border-amber-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 cursor-pointer ${navigatingId === subcategory.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <h3 className="font-poppins font-semibold text-base text-[#6c3e27] dark:text-amber-400 group-hover:text-[#8b4513] dark:group-hover:text-amber-300 transition-colors duration-300 leading-relaxed tracking-normal">
                        {navigatingId === subcategory.id ? 'Loading...' : subcategory.name}
                      </h3>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          
        </div>
      </div>
    </section>
  )
}
