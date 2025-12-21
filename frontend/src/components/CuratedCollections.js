import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import sweetsAndDryFruitsAPI from '../api/sweetsAndDryFruits'
import flowersAPI from '../api/flowers'

const CuratedCollections = () => {
  const router = useRouter()
  const [collections, setCollections] = useState([
    {
      name: 'Flowers',
      image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=600&h=600&fit=crop',
      suggestions: [
        { name: 'All Flowers Combos', slug: 'all-flowers-combos' },
        { name: 'Bridal Bouquet', slug: 'bridal-bouquet' },
        { name: 'Rose Bouquet', slug: 'rose-bouquet' },
        { name: 'Mixed Flower Bouquet', slug: 'mixed-flower-bouquet' }
      ],
      imagePosition: 'left'
    },
    {
      name: 'Sweets and Dry Fruits',
      image: 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=600&h=600&fit=crop',
      suggestions: [
        { name: 'Chocolates & Combos', slug: 'chocolates-and-combos' },
        { name: 'Sweets & Combos', slug: 'sweets-and-combos' },
        { name: 'Dry Fruits and Combos', slug: 'dry-fruits-and-combos' }
      ],
      imagePosition: 'right'
    }
  ])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Navigation handler for Flowers subcategories
  const handleFlowerSubcategoryClick = (subcategory) => {
    const targetUrl = `/category/flowers/${subcategory.slug}`
    console.log('Navigating to flowers subcategory:', targetUrl)
    router.push(targetUrl)
  }

  // Navigation handler for entire Flowers box - navigates to first subcategory
  const handleFlowerBoxClick = () => {
    // Get the first subcategory from the Flowers collection
    const flowersCollection = collections.find(collection => collection.name === 'Flowers')
    const firstSubcategory = flowersCollection?.suggestions?.[0]
    
    if (firstSubcategory) {
      const targetUrl = `/category/flowers/${firstSubcategory.slug}`
      console.log('Navigating to first flowers subcategory:', targetUrl)
      router.push(targetUrl)
    } else {
      // Fallback to main category if no subcategories found
      const targetUrl = `/category/flowers`
      console.log('Fallback: Navigating to flowers category:', targetUrl)
      router.push(targetUrl)
    }
  }

  // Navigation handler for Sweets and Dry Fruits subcategories
  const handleSweetsSubcategoryClick = (subcategory) => {
    const targetUrl = `/category/sweets-dry-fruits/${subcategory.slug}`
    console.log('Navigating to sweets subcategory:', targetUrl)
    router.push(targetUrl)
  }

  // Navigation handler for entire Sweets and Dry Fruits box - navigates to first subcategory
  const handleSweetsBoxClick = () => {
    // Get the first subcategory from the Sweets and Dry Fruits collection
    const sweetsCollection = collections.find(collection => collection.name === 'Sweets and Dry Fruits')
    const firstSubcategory = sweetsCollection?.suggestions?.[0]
    
    if (firstSubcategory) {
      const targetUrl = `/category/sweets-dry-fruits/${firstSubcategory.slug}`
      console.log('Navigating to first sweets subcategory:', targetUrl)
      router.push(targetUrl)
    } else {
      // Fallback to main category if no subcategories found
      const targetUrl = `/category/sweets-dry-fruits`
      console.log('Fallback: Navigating to sweets category:', targetUrl)
      router.push(targetUrl)
    }
  }

  useEffect(() => {
    const fetchCollectionsData = async () => {
      try {
        setLoading(true)
        
        // Fetch both Flowers and Sweets and Dry Fruits data in parallel
        const [flowersResponse, sweetsResponse] = await Promise.all([
          flowersAPI.getFlowers(),
          sweetsAndDryFruitsAPI.getSweetsAndDryFruits()
        ])

        // Process Flowers data
        if (flowersResponse.success && flowersResponse.data && flowersResponse.data.subcategories) {
          const flowersSuggestions = flowersResponse.data.subcategories.map(subcategory => ({
            name: subcategory.name,
            slug: subcategory.name.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and')
          }))
          
          setCollections(prevCollections => 
            prevCollections.map(collection => 
              collection.name === 'Flowers' 
                ? {
                    ...collection,
                    suggestions: flowersSuggestions.length > 0 ? flowersSuggestions : collection.suggestions,
                    image: flowersResponse.data.category.image_url || collection.image
                  }
                : collection
            )
          )
        }

        // Process Sweets and Dry Fruits data
        if (sweetsResponse.success && sweetsResponse.data && sweetsResponse.data.subcategories) {
          const sweetsSuggestions = sweetsResponse.data.subcategories.map(subcategory => ({
            name: subcategory.name,
            slug: subcategory.name.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and')
          }))
          
          setCollections(prevCollections => 
            prevCollections.map(collection => 
              collection.name === 'Sweets and Dry Fruits' 
                ? {
                    ...collection,
                    suggestions: sweetsSuggestions.length > 0 ? sweetsSuggestions : collection.suggestions,
                    image: sweetsResponse.data.category.image_url || collection.image
                  }
                : collection
            )
          )
        }
      } catch (err) {
        console.error('Error fetching collections data:', err)
        setError('Failed to load collections data')
        // Keep using static data as fallback
      } finally {
        setLoading(false)
      }
    }

    fetchCollectionsData()
  }, [])

  // Show loading state
  if (loading) {
    return (
      <section className="relative bg-white dark:bg-gray-900 py-12 lg:py-16">
        <div className="w-full px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 dark:border-pink-400"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-300">Loading curated collections...</p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Show error state
  if (error) {
    return (
      <section className="relative bg-white dark:bg-gray-900 py-12 lg:py-16">
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
    <section className="relative bg-white dark:bg-gray-900 py-12 lg:py-16">
      <div className="w-full px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-8 lg:mb-16">
            <div className="inline-flex items-center justify-center px-4 py-1.5 bg-white dark:bg-gray-800 rounded-full mb-6 shadow-md dark:shadow-lg dark:shadow-black/20 relative border border-pink-200 dark:border-pink-800/30">
              <span className="text-xs font-bold text-pink-500 dark:text-pink-400 uppercase tracking-wider">Gifts That Connect</span>
              {/* Left gradient line */}
              <div className="absolute left-full ml-2 w-16 h-px bg-gradient-to-r from-pink-300 dark:from-pink-500 to-transparent"></div>
              {/* Right gradient line */}
              <div className="absolute right-full mr-2 w-16 h-px bg-gradient-to-l from-pink-300 dark:from-pink-500 to-transparent"></div>
            </div>
            <h2 className="font-poppins text-3xl lg:text-5xl font-bold mb-1">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 dark:from-purple-400 dark:to-pink-400">Curated</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-orange-500 dark:from-pink-400 dark:to-orange-400"> Collections</span>
            </h2>
            <p className="font-inter text-gray-600 dark:text-gray-300 text-base lg:text-xl max-w-2xl mx-auto leading-relaxed">
              Thoughtful gifts, timeless memories
            </p>
          </div>

          {/* Collections Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {collections.map((collection, index) => (
              <div key={index} className="group">
                <div className="bg-white dark:bg-gray-800 border border-pink-200 dark:border-pink-800/30 rounded-3xl overflow-hidden shadow-lg dark:shadow-xl dark:shadow-black/20">
                  {/* Desktop Layout - Image left, content right */}
                  {collection.name === 'Flowers' ? (
                    <div 
                      onClick={handleFlowerBoxClick}
                      className="hidden lg:flex w-full hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 cursor-pointer"
                    >
                      {/* Image Section - 45% width with 1:1 aspect ratio */}
                      <div className="w-[45%] p-3 relative overflow-hidden">
                        <img
                          src={collection.image}
                          alt={collection.name}
                          className="w-full h-full object-cover object-center rounded-2xl"
                        />
                      </div>
                      
                      {/* Content Section - 55% width */}
                      <div className="w-[55%] p-8 flex flex-col justify-start ml-4">
                        <h3 className="font-poppins font-bold text-3xl lg:text-4xl mb-6 text-gray-900 dark:text-gray-100">
                          {collection.name} <span className="ml-2 lg:ml-3 text-3xl lg:text-4xl">→</span>
                        </h3>
                        <ul className="space-y-3">
                          {collection.suggestions.map((suggestion, idx) => (
                            <li key={idx} className="font-inter text-gray-600 dark:text-gray-300 text-lg flex items-center">
                              <div className="w-2 h-2 bg-pink-400 dark:bg-pink-500 rounded-full mr-4"></div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleFlowerSubcategoryClick(suggestion)
                                }}
                                className="text-left hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200 cursor-pointer"
                              >
                                {suggestion.name}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : collection.name === 'Sweets and Dry Fruits' ? (
                    <div 
                      onClick={handleSweetsBoxClick}
                      className="hidden lg:flex w-full hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 cursor-pointer"
                    >
                      {/* Image Section - 45% width with 1:1 aspect ratio */}
                      <div className="w-[45%] p-3 relative overflow-hidden">
                        <img
                          src={collection.image}
                          alt={collection.name}
                          className="w-full h-full object-cover object-center rounded-2xl"
                        />
                      </div>
                      
                      {/* Content Section - 55% width */}
                      <div className="w-[55%] p-8 flex flex-col justify-start">
                        <h3 className="font-poppins font-bold text-3xl lg:text-4xl mb-6 text-gray-900 dark:text-gray-100">
                          {collection.name} <span className="ml-2 lg:ml-3 text-3xl lg:text-4xl">→</span>
                        </h3>
                        <ul className="space-y-3">
                          {collection.suggestions.map((suggestion, idx) => (
                            <li key={idx} className="font-inter text-gray-600 dark:text-gray-300 text-lg flex items-center">
                              <div className="w-2 h-2 bg-pink-400 dark:bg-pink-500 rounded-full mr-4"></div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleSweetsSubcategoryClick(suggestion)
                                }}
                                className="text-left text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200 cursor-pointer"
                              >
                                {suggestion.name}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="hidden lg:flex">
                      {/* Image Section - 45% width with 1:1 aspect ratio */}
                      <div className="w-[45%] p-3 relative overflow-hidden">
                        <img
                          src={collection.image}
                          alt={collection.name}
                          className="w-full h-full object-cover object-center rounded-2xl"
                        />
                      </div>
                      
                      {/* Content Section - 55% width */}
                      <div className="w-[55%] p-8 flex flex-col justify-start">
                        <h3 className="font-poppins font-bold text-3xl lg:text-4xl mb-6 text-gray-900 dark:text-gray-100">
                          {collection.name} <span className="ml-2 lg:ml-3 text-3xl lg:text-4xl">→</span>
                        </h3>
                        <ul className="space-y-3">
                          {collection.suggestions.map((suggestion, idx) => (
                            <li key={idx} className="font-inter text-gray-600 dark:text-gray-300 text-lg flex items-center">
                              <div className="w-2 h-2 bg-pink-400 dark:bg-pink-500 rounded-full mr-4"></div>
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Mobile Layout - Compact cards side by side with alternating layout */}
                  <div className="lg:hidden">
                    <div className="p-2">
                      {/* Alternating Layout based on index */}
                      {index === 0 ? (
                        // First card (Flowers) - Image left, content right
                        <div 
                          onClick={handleFlowerBoxClick}
                          className="flex items-center space-x-4 w-full hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 cursor-pointer"
                        >
                          {/* Image - Left side with 50% width */}
                          <div className="w-1/2 relative overflow-hidden aspect-square rounded-2xl">
                            <img
                              src={collection.image}
                              alt={collection.name}
                              className="w-full h-full object-cover object-center"
                            />
                          </div>
                          
                          {/* Content - Right side with 50% width */}
                          <div className="w-1/2 flex flex-col justify-start">
                            <h3 className="font-poppins font-bold text-xl mb-3 text-gray-900 dark:text-gray-100">
                              {collection.name} <span className="ml-2 text-xl">→</span>
                            </h3>
                            <ul className="space-y-2">
                              {collection.suggestions.map((suggestion, idx) => (
                                <li key={idx} className="font-inter text-gray-600 dark:text-gray-300 text-sm flex items-center">
                                  <div className="w-2 h-2 bg-pink-400 dark:bg-pink-500 rounded-full mr-3"></div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleFlowerSubcategoryClick(suggestion)
                                    }}
                                    className="text-left hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200 cursor-pointer"
                                  >
                                    {suggestion.name}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ) : (
                        // Second card (Sweets and Dry Fruits) - Image right, content left
                        <div 
                          onClick={handleSweetsBoxClick}
                          className="flex items-center space-x-4 w-full hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 cursor-pointer"
                        >
                          {/* Content - Left side with 50% width */}
                          <div className="w-1/2 flex flex-col justify-start">
                            <h3 className="font-poppins font-bold text-lg mb-3 text-gray-900 dark:text-gray-100">
                              {collection.name} <span className="ml-2 text-lg">→</span>
                            </h3>
                            <ul className="space-y-2">
                              {collection.suggestions.map((suggestion, idx) => (
                                <li key={idx} className="font-inter text-gray-600 dark:text-gray-300 text-sm flex items-center">
                                  <div className="w-2 h-2 bg-pink-400 dark:bg-pink-500 rounded-full mr-3"></div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleSweetsSubcategoryClick(suggestion)
                                    }}
                                    className="text-left text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200 cursor-pointer"
                                  >
                                    {suggestion.name}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          {/* Image - Right side with 50% width */}
                          <div className="w-1/2 relative overflow-hidden aspect-square rounded-2xl">
                            <img
                              src={collection.image}
                              alt={collection.name}
                              className="w-full h-full object-cover object-center"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default CuratedCollections
