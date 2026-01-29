'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import kidsCakeCollectionAPI from '../api/kidsCakeCollection'
import { resolveImageUrl } from '../utils/imageUrl'

export default function KidsCakeCollection() {
  const router = useRouter()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Static fallback data
  const staticCategories = [
    {
      id: 1,
      name: 'Barbie Doll Cakes',
      slug: 'barbie-doll',
      image: '/Design 1.webp',
      description: 'Elegant Barbie-themed magical cakes'
    },
    {
      id: 2,
      name: 'Cartoon Cakes',
      slug: 'cartoon-cakes',
      image: '/Design 2.webp',
      description: 'Fun cartoon character celebrations'
    },
    {
      id: 3,
      name: 'Designer Cakes',
      slug: 'designer-cakes',
      image: '/Design 3.webp',
      description: 'Artistic, custom-made, and elegant cakes'
    },
    {
      id: 4,
      name: 'Number Cakes',
      slug: 'number-cakes',
      image: '/Design 4.webp',
      description: 'Personalized number alphabet fun'
    },
    {
      id: 5,
      name: 'Super Hero Cakes',
      slug: 'super-hero-cakes',
      image: '/Design 1.webp',
      description: 'Powerful superhero dynamic designs'
    }
  ]

  // Navigation handler
  const handleCategoryClick = (category) => {
    const slug = category.slug || category.name.toLowerCase().replace(/\s+/g, '-')
    const targetUrl = `/category/kids-cake-collection/${slug}`
    console.log('Navigating to kids category:', targetUrl)
    router.push(targetUrl)
  }

  useEffect(() => {
    const fetchKidsCakeCollection = async () => {
      try {
        setLoading(true)
        const response = await kidsCakeCollectionAPI.getKidsCakeCollection()
        if (response.success && response.data && response.data.subcategories) {
          // Transform subcategories to match the expected format
          const transformedCategories = response.data.subcategories.map(subcategory => ({
            id: subcategory.id,
            name: subcategory.name,
            slug: subcategory.name.toLowerCase().replace(/\s+/g, '-'),
            image: resolveImageUrl(subcategory.image_url) || '/Design 1.webp',
            description: subcategory.description || 'Delicious kids cake collection'
          }))
          setCategories(transformedCategories)
        } else {
          setError('Failed to fetch kids cake collection')
        }
      } catch (err) {
        console.error('Error fetching kids cake collection:', err)
        setError('Failed to load kids cake collection')
        // Use static data as fallback
        setCategories(staticCategories)
      } finally {
        setLoading(false)
      }
    }

    fetchKidsCakeCollection()
  }, [])

  // Use static data if no data from API
  const displayCategories = categories.length > 0 ? categories : staticCategories

  // Show loading state
  if (loading) {
    return (
      <section className="bg-gradient-to-br from-pink-50 via-purple-50 to-pink-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 py-8 lg:py-12 relative overflow-hidden">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 dark:border-pink-400"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-300">Loading kids cake collection...</p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Show error state
  if (error) {
    return (
      <section className="bg-gradient-to-br from-pink-50 via-purple-50 to-pink-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 py-8 lg:py-12 relative overflow-hidden">
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
    <>
      <section className="bg-gradient-to-br from-pink-50 via-purple-50 to-pink-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 pt-12 pb-10 lg:pt-16 lg:pb-12 relative overflow-hidden">
      {/* Simplified playful background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Single subtle accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-pink-100/30 to-purple-100/30 dark:from-pink-900/10 dark:to-purple-900/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-100/30 to-pink-100/30 dark:from-purple-900/10 dark:to-pink-900/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="w-full px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Section Header - Improved Typography Hierarchy */}
          <div className="text-center mb-3 lg:mb-2 -mt-2 lg:-mt-4">
            <div className="inline-block mb-3">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-px bg-gradient-to-r from-purple-400 to-pink-400 dark:from-purple-500 dark:to-pink-500"></div>
                <span className="px-4 text-xs font-semibold text-pink-500 dark:text-pink-400 uppercase tracking-widest leading-relaxed">KIDS COLLECTION</span>
                <div className="w-12 h-px bg-gradient-to-r from-pink-400 to-purple-400 dark:from-pink-500 dark:to-purple-500"></div>
              </div>
              <h2 className="font-poppins text-2xl lg:text-3xl font-bold mb-1 leading-tight tracking-tight">
                <span className="text-purple-700 dark:text-purple-400">Kid's Cake</span>
                <span className="text-pink-600 dark:text-pink-400"> Collection</span>
              </h2>
              <p className="font-inter text-gray-600 dark:text-gray-300 text-sm lg:text-lg max-w-2xl mx-auto leading-relaxed font-normal">
                Magical cakes that bring smiles to little faces
              </p>
            </div>
          </div>

                     {/* Category Cards - Mobile: Vertical List, Desktop: 1x5 Grid */}
           <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-5 lg:gap-6">
             {displayCategories.map((category) => (
              <div key={category.id} className="group">
                                                                                                                                               <button 
                                                                                                                                                 onClick={() => handleCategoryClick(category)}
                className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-md dark:shadow-black/5 border border-[#6c3e27]/20 dark:border-amber-700/30 overflow-hidden hover:shadow-lg hover:shadow-[#6c3e27]/10 dark:hover:shadow-amber-500/20 hover:border-[#6c3e27]/40 dark:hover:border-amber-500/50 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 relative group focus:outline-none focus:ring-2 focus:ring-[#6c3e27]/20 dark:focus:ring-amber-500/40 focus:ring-offset-2"
                >
                                       {/* Mobile Layout - Side by side */}
                <div className={`flex lg:hidden ${category.id % 2 === 1 ? 'flex-row-reverse' : 'flex-row'}`}>
                                            {/* Image Section - 40% width with 1:1 aspect ratio */}
                                               <div className="w-2/5 relative overflow-hidden aspect-square rounded-l-2xl">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  />
                        </div>
                      
                {/* Content Section - 60% width */}
                <div className="w-3/5 px-3 pt-3 pb-4 flex flex-col justify-between bg-gradient-to-b from-white via-gray-50/30 to-white dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-800">
                  <div className="flex-1">
                    {/* Title */}
                    <h3 className="font-poppins font-bold text-lg mb-2 leading-tight text-gray-900 dark:text-gray-100 group-hover:text-[#6c3e27] dark:group-hover:text-amber-400 transition-colors duration-300">
                      {category.name}
                    </h3>
                    
                    {/* Description */}
                    <p className="font-inter text-gray-600 dark:text-gray-300 text-xs leading-relaxed mb-0 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300 line-clamp-2">
                      {category.description}
                    </p>
                  </div>
                  
                  {/* Subtle divider */}
                  <div className="w-10 h-px bg-gradient-to-r from-transparent via-[#6c3e27]/20 to-transparent dark:via-amber-500/30 my-2.5 mx-auto"></div>
                  
                  {/* Action indicator */}
                  <div className="flex items-center justify-center">
                    <div className="flex items-center space-x-2 text-xs font-semibold text-[#6c3e27] dark:text-amber-400 group-hover:text-[#5a2e1f] dark:group-hover:text-amber-300 transition-colors duration-300 bg-gradient-to-r from-[#6c3e27]/10 to-amber-600/10 dark:from-amber-500/10 dark:to-amber-600/10 px-3 py-1.5 rounded-full shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300 border border-[#6c3e27]/30 dark:border-amber-500/40 group-hover:border-[#6c3e27]/50 dark:group-hover:border-amber-500/60 group-hover:from-[#6c3e27]/15 group-hover:to-amber-600/15 dark:group-hover:from-amber-500/15 dark:group-hover:to-amber-600/15">
                      <span className="font-medium">Explore</span>
                      <div className="w-4 h-4 bg-[#6c3e27] dark:bg-amber-500 rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </button>
                   
                                        {/* Desktop Layout - 1x5 Grid with image on top, content below */}
                     <button 
                       onClick={() => handleCategoryClick(category)}
                       className="hidden lg:block w-full bg-white dark:bg-gray-800 rounded-xl overflow-hidden hover:shadow-sm hover:shadow-[#6c3e27]/5 dark:hover:shadow-amber-500/10 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#6c3e27]/30 dark:focus:ring-amber-500/50 focus:ring-offset-2 border border-gray-300 dark:border-gray-600 hover:border-[#6c3e27]/25 dark:hover:border-amber-500/35 group"
                       style={{ padding: 0 }}
                     >
                {/* Image Section - Top with 1:1 aspect ratio */}
                <div className="w-full relative overflow-hidden aspect-square bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800" style={{ margin: 0, padding: 0 }}>
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover object-center group-hover:scale-[1.01] transition-transform duration-500 ease-out"
                    style={{ display: 'block', margin: 0, padding: 0, verticalAlign: 'top' }}
                  />
                  {/* Modern gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-white/0 via-transparent to-transparent group-hover:from-white/5 transition-all duration-500 pointer-events-none"></div>
                </div>
                     
                {/* Content Section - Bottom with modern clean design */}
                <div className="px-5 pt-4 pb-5 text-center relative z-30 bg-white dark:bg-gray-800">
                  {/* Subtle top border accent */}
                  {/* <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-0.5 bg-gradient-to-r from-transparent via-[#6c3e27]/20 to-transparent dark:via-amber-500/30 group-hover:via-[#6c3e27]/40 dark:group-hover:via-amber-500/50 transition-all duration-300"></div> */}
                  
                  <h3 className="font-poppins font-bold text-lg mb-2.5 leading-tight text-gray-900 dark:text-gray-100 group-hover:text-[#6c3e27] dark:group-hover:text-amber-400 transition-colors duration-300">
                    {category.name}
                  </h3>
                  
                  <p className="font-inter text-gray-600 dark:text-gray-300 text-xs leading-relaxed max-w-xs mx-auto mb-4 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300 line-clamp-2">
                    {category.description}
                  </p>
                  
                  {/* Modern Explore Button */}
                  <div className="flex items-center justify-center">
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6c3e27]/5 to-amber-600/5 dark:from-amber-500/5 dark:to-amber-600/5 border border-[#6c3e27]/20 dark:border-amber-500/25 group-hover:border-[#6c3e27]/25 dark:group-hover:border-amber-500/35 group-hover:from-[#6c3e27]/6 group-hover:to-amber-600/6 dark:group-hover:from-amber-500/6 dark:group-hover:to-amber-600/6 transition-all duration-300 shadow-sm">
                      <span className="text-xs font-semibold text-[#6c3e27] dark:text-amber-400 group-hover:text-[#5a2e1f] dark:group-hover:text-amber-300 transition-colors duration-300">
                        Explore
                      </span>
                      <div className="w-4 h-4 rounded-full bg-[#6c3e27] dark:bg-amber-500 flex items-center justify-center group-hover:scale-[1.02] transition-transform duration-300 shadow-sm">
                        <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
                     </button>
                   </div>
             ))}
           </div>
        </div>
      </div>
     </section>
     </>
   )
 }
