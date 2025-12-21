'use client'
import React, { useState, useEffect } from 'react'
import occasionCategoryAPI from '../api/occasionCategories'
import cakeFlavorCategoryAPI from '../api/cakeFlavorCategories'

export default function CakeFinder() {
  const [selectedOccasion, setSelectedOccasion] = useState('')
  const [selectedFlavor, setSelectedFlavor] = useState('')
  const [expandedSection, setExpandedSection] = useState('') // 'occasion' or 'flavor' or ''
  const [occasions, setOccasions] = useState([])
  const [flavors, setFlavors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch occasions and flavors from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch both occasions and flavors in parallel
        const [occasionsResponse, flavorsResponse] = await Promise.all([
          occasionCategoryAPI.getOccasionCategories(),
          cakeFlavorCategoryAPI.getCakeFlavorCategory()
        ])

        // Process occasions
        if (occasionsResponse.success && occasionsResponse.data && occasionsResponse.data.subcategories) {
          const occasionNames = occasionsResponse.data.subcategories.map(sub => sub.name)
          setOccasions(occasionNames)
        } else {
          // Fallback to default occasions
          setOccasions(['Birthday', 'Anniversary', 'Engagement', 'Wedding', 'New Beginning', 'No Reason Cake'])
        }

        // Process flavors
        if (flavorsResponse.success && flavorsResponse.data && flavorsResponse.data.subcategories) {
          const flavorNames = flavorsResponse.data.subcategories.map(sub => sub.name)
          setFlavors(flavorNames)
        } else {
          // Fallback to default flavors
          setFlavors(['Chocolate', 'Choco Truffle', 'Pineapple', 'Red Velvet', 'Butterscotch', 'Black Forest', 'Strawberry', 'Mixed Fruits', 'Vanilla', 'Blueberry'])
        }
      } catch (err) {
        console.error('Error fetching CakeFinder data:', err)
        setError('Failed to load options')
        // Use fallback data
        setOccasions(['Birthday', 'Anniversary', 'Engagement', 'Wedding', 'New Beginning', 'No Reason Cake'])
        setFlavors(['Chocolate', 'Choco Truffle', 'Pineapple', 'Red Velvet', 'Butterscotch', 'Black Forest', 'Strawberry', 'Mixed Fruits', 'Vanilla', 'Blueberry'])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleFindCakes = () => {
    if (selectedOccasion && selectedFlavor) {
      // Navigate to search results page with selected filters
      const queryParams = new URLSearchParams({
        occasion: selectedOccasion,
        flavor: selectedFlavor
      })
      window.location.href = `/search-results?${queryParams.toString()}`
    }
  }

  const handleReset = () => {
    setSelectedOccasion('')
    setSelectedFlavor('')
    setExpandedSection('')
  }

  const toggleSection = (section) => {
    if (expandedSection === section) {
      setExpandedSection('')
    } else {
      setExpandedSection(section)
    }
  }

  // Loading state
  if (loading) {
    return (
      <section className="bg-white dark:bg-gray-900 pt-8 pb-8 lg:pt-12 lg:pb-12 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-purple-50/40 to-pink-50/40 dark:from-purple-900/10 dark:to-pink-900/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-orange-50/40 to-pink-50/40 dark:from-orange-900/10 dark:to-pink-900/10 rounded-full blur-3xl"></div>
        </div>
        <div className="w-full px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg border border-[#8B4513] p-4 lg:p-6">
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                <p className="mt-2 text-gray-600">Loading cake finder...</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
         <section className="bg-white dark:bg-gray-900 pt-8 pb-8 lg:pt-12 lg:pb-12 relative overflow-hidden">
      {/* Subtle background accent for differentiation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-purple-50/40 to-pink-50/40 dark:from-purple-900/10 dark:to-pink-900/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-orange-50/40 to-pink-50/40 dark:from-orange-900/10 dark:to-pink-900/10 rounded-full blur-3xl"></div>
      </div>
      <div className="w-full px-4 sm:px-6 lg:px-8 relative z-10">
                 <div className="max-w-6xl mx-auto">
                           {/* Compact Main Card */}
                 <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-xl dark:shadow-black/20 border border-[#8B4513] dark:border-amber-700 p-4 lg:p-6">
                                       {/* Compact Search Header */}
                                         <div className="text-center mb-6">
                       <div className="inline-block">
                                                   <h3 className="font-poppins text-2xl lg:text-3xl font-bold mb-2">
                            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
                              Cake Finder
                            </span>
                          </h3>
                                                   <p className="font-inter text-sm lg:text-base text-gray-600 dark:text-gray-300">
                            <span className="text-purple-700 dark:text-purple-400 font-semibold">Select an occasion</span>
                            <span className="text-pink-600 dark:text-pink-400 mx-1">+</span>
                            <span className="text-orange-600 dark:text-orange-400 font-semibold">A flavor</span>
                            <span className="text-gray-600 dark:text-gray-400 mx-1">=</span>
                            <span className="text-[#8B4513] dark:text-amber-400 font-semibold">the cake that's all yours.</span>
                          </p>
                       </div>
                     </div>

                         {/* Expandable Selection Boxes */}
             <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-4">
               {/* Occasion Section */}
               <div className="bg-gradient-to-br from-pink-50 to-orange-50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-lg border border-[#8B4513] dark:border-amber-700 overflow-hidden">
                <button
                  onClick={() => toggleSection('occasion')}
                  className={`w-full p-3 lg:p-4 flex items-center justify-between transition-all duration-300 ${
                    expandedSection === 'occasion' 
                      ? 'bg-gradient-to-r from-[#8B4513] to-[#A0522D] dark:from-amber-700 dark:to-amber-800 text-white' 
                      : 'hover:bg-pink-100 dark:hover:bg-gray-600/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-pink-100 to-orange-100 dark:from-pink-900/30 dark:to-orange-900/30 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 lg:w-6 lg:h-6 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <h4 className="font-poppins font-semibold text-sm lg:text-base dark:text-gray-100">Occasion</h4>
                      {selectedOccasion && (
                        <p className="font-inter text-xs lg:text-sm text-[#8B4513] dark:text-amber-400 font-medium">
                          Selected: {selectedOccasion}
                        </p>
                      )}
                    </div>
                  </div>
                  <svg 
                    className={`w-5 h-5 lg:w-6 lg:h-6 transition-transform duration-300 ${
                      expandedSection === 'occasion' ? 'rotate-180' : ''
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Expandable Content */}
                <div className={`transition-all duration-300 overflow-hidden ${
                  expandedSection === 'occasion' ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div className="p-3 lg:p-4 bg-white dark:bg-gray-700/30">
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                      {occasions.map((occasion) => (
                        <button
                          key={occasion}
                          onClick={() => {
                            setSelectedOccasion(occasion)
                            setExpandedSection('')
                          }}
                          className={`p-2 lg:p-3 rounded-lg text-xs lg:text-sm font-inter transition-all duration-200 ${
                            selectedOccasion === occasion
                              ? 'bg-gradient-to-r from-[#8B4513] to-[#A0522D] dark:from-amber-700 dark:to-amber-800 text-white shadow-md'
                              : 'bg-gray-50 dark:bg-gray-600/50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-[#8B4513] dark:border-amber-700'
                          }`}
                        >
                          {occasion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Flavor Section */}
              <div className="bg-gradient-to-br from-pink-50 to-orange-50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-lg border border-[#8B4513] dark:border-amber-700 overflow-hidden">
                <button
                  onClick={() => toggleSection('flavor')}
                  className={`w-full p-3 lg:p-4 flex items-center justify-between transition-all duration-300 ${
                    expandedSection === 'flavor' 
                      ? 'bg-gradient-to-r from-[#8B4513] to-[#A0522D] dark:from-amber-700 dark:to-amber-800 text-white' 
                      : 'hover:bg-pink-100 dark:hover:bg-gray-600/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-orange-100 to-pink-100 dark:from-orange-900/30 dark:to-pink-900/30 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 lg:w-6 lg:h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zM6 10h7a2 2 0 012 2v1H6v-1a2 2 0 012-2z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <h4 className="font-poppins font-semibold text-sm lg:text-base dark:text-gray-100">Flavor</h4>
                      {selectedFlavor && (
                        <p className="font-inter text-xs lg:text-sm text-[#8B4513] dark:text-amber-400 font-medium">
                          Selected: {selectedFlavor}
                        </p>
                      )}
                    </div>
                  </div>
                  <svg 
                    className={`w-5 h-5 lg:w-6 lg:h-6 transition-transform duration-300 ${
                      expandedSection === 'flavor' ? 'rotate-180' : ''
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Expandable Content */}
                <div className={`transition-all duration-300 overflow-hidden ${
                  expandedSection === 'flavor' ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div className="p-3 lg:p-4 bg-white dark:bg-gray-700/30">
                                         <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
                       {flavors.map((flavor) => (
                         <button
                           key={flavor}
                           onClick={() => {
                             setSelectedFlavor(flavor)
                             setExpandedSection('')
                           }}
                           className={`p-2 lg:p-3 rounded-lg text-xs lg:text-sm font-inter transition-all duration-200 ${
                             selectedFlavor === flavor
                               ? 'bg-gradient-to-r from-[#8B4513] to-[#A0522D] dark:from-amber-700 dark:to-amber-800 text-white shadow-md'
                               : 'bg-gray-50 dark:bg-gray-600/50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-[#8B4513] dark:border-amber-700'
                           }`}
                         >
                           {flavor}
                         </button>
                       ))}
                     </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Compact Find and Reset Buttons */}
            <div className="mt-4 flex space-x-3">
              {/* Reset Button - 30% width */}
              <button
                onClick={handleReset}
                className="w-[30%] py-3 lg:py-4 rounded-lg font-poppins font-bold text-[#8B4513] dark:text-amber-400 bg-white dark:bg-gray-700 border border-[#8B4513] dark:border-amber-700 hover:bg-[#8B4513] dark:hover:bg-amber-700 hover:text-white transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-lg"
              >
                <span className="text-sm lg:text-base">Reset</span>
              </button>
              
              {/* Find Cakes Button - 70% width */}
              <button
                onClick={handleFindCakes}
                disabled={!selectedOccasion || !selectedFlavor}
                className={`w-[70%] py-3 lg:py-4 rounded-lg font-poppins font-bold text-white transition-all duration-300 transform ${
                  selectedOccasion && selectedFlavor
                    ? 'bg-gradient-to-r from-[#8B4513] via-[#A0522D] to-[#6c3e27] dark:from-amber-700 dark:via-amber-800 dark:to-amber-900 hover:from-[#6c3e27] hover:via-[#A0522D] hover:to-[#8B4513] dark:hover:from-amber-900 dark:hover:via-amber-800 dark:hover:to-amber-700 hover:scale-[1.02] shadow-lg hover:shadow-lg'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                <span className="text-sm lg:text-base">Find Cakes</span>
              </button>
            </div>

            {/* Compact Selection Summary */}
            {(selectedOccasion || selectedFlavor) && (
              <div className="mt-3 p-2 lg:p-3 bg-gradient-to-r from-pink-50 to-orange-50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-lg border border-[#8B4513] dark:border-amber-700">
                <p className="font-inter text-xs lg:text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Ready to find:</span>
                  {selectedOccasion && <span className="ml-1 text-[#8B4513] dark:text-amber-400">{selectedOccasion}</span>}
                  {selectedOccasion && selectedFlavor && <span className="mx-1">•</span>}
                  {selectedFlavor && <span className="ml-1 text-[#8B4513] dark:text-amber-400">{selectedFlavor}</span>}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
