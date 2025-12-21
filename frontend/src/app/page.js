'use client';

import { Suspense, lazy } from 'react';

// Critical components that load immediately
import Header from '../components/Header'
import MobileFooter from '../components/MobileFooter'
import LocationBar from '../components/LocationBar'
import MainCategories from '../components/MainCategories'

// Lazy load non-critical components for better performance
const DynamicBannerSlider = lazy(() => import('../components/DynamicBannerSlider'))
const TopProducts = lazy(() => import('../components/TopProducts'))
const CakeByFlavor = lazy(() => import('../components/CakeByFlavor'))
const CakesForOccasion = lazy(() => import('../components/CakesForOccasion'))
const CakesForMilestone = lazy(() => import('../components/CakesForMilestone'))
const KidsCakeCollection = lazy(() => import('../components/KidsCakeCollection'))
const CrowdFavoriteCakes = lazy(() => import('../components/CrowdFavoriteCakes'))
const BestSeller = lazy(() => import('../components/BestSeller'))
const CakeFinder = lazy(() => import('../components/CakeFinder'))
const LoveAndRelationshipCakes = lazy(() => import('../components/LoveAndRelationshipCakes'))
const CuratedCollections = lazy(() => import('../components/CuratedCollections'))
const SmallTreatsDesserts = lazy(() => import('../components/SmallTreatsDesserts'))
const Testimonials = lazy(() => import('../components/Testimonials'))
const Footer = lazy(() => import('../components/Footer'))

// Loading component for lazy loaded components
const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-8">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500 dark:border-pink-400"></div>
  </div>
)

// Skeleton loader for better UX
const SkeletonLoader = () => (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto mb-4"></div>
    <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
    <div className="flex space-x-2 justify-center">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
    </div>
  </div>
)

export default function Home() {
  return (
    <main>
      <Header />
      <LocationBar />
      
      {/* Main Categories - All 9 Main Categories from Database */}
      <MainCategories />

      {/* Dynamic Banner Slider - From Database */}
      <Suspense fallback={<SkeletonLoader />}>
        <DynamicBannerSlider />
      </Suspense>

      {/* Top Products Section */}
      <Suspense fallback={<SkeletonLoader />}>
        <TopProducts />
      </Suspense>

      {/* Visual Differentiator */}
      <section className="bg-gradient-to-r from-orange-100 via-pink-100 to-orange-100 dark:from-orange-900/20 dark:via-pink-900/20 dark:to-orange-900/20 py-2">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-12 h-0.5 bg-gradient-to-r from-transparent to-[#8B4513] dark:to-amber-400 rounded-full"></div>
              <div className="w-6 h-6 bg-gradient-to-br from-pink-200 to-orange-200 dark:from-pink-700 dark:to-orange-700 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-[#8B4513] dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="w-12 h-0.5 bg-gradient-to-l from-transparent to-[#8B4513] dark:to-amber-400 rounded-full"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Cake by Flavor Section */}
      <Suspense fallback={<LoadingSpinner />}>
        <CakeByFlavor />
      </Suspense>

      {/* Cakes for Any Occasion Section */}
      <Suspense fallback={<LoadingSpinner />}>
        <CakesForOccasion />
      </Suspense>

      {/* Cake Finder Section */}
      <Suspense fallback={<LoadingSpinner />}>
        <CakeFinder />
      </Suspense>
               
      {/* Kid's Cake Collection Section */}
      <Suspense fallback={<LoadingSpinner />}>
        <KidsCakeCollection />
      </Suspense>
      
      {/* Crowd-Favorite Cakes Section */}
      <Suspense fallback={<LoadingSpinner />}>
        <CrowdFavoriteCakes />
      </Suspense>

      {/* Best Seller Section */}
      <Suspense fallback={<LoadingSpinner />}>
        <BestSeller />
      </Suspense>

      {/* Love and Relationship Cakes Section */}
      <Suspense fallback={<LoadingSpinner />}>
        <LoveAndRelationshipCakes />
      </Suspense>

      {/* Cakes for Every Milestone Year Section */}
      <Suspense fallback={<LoadingSpinner />}>
        <CakesForMilestone />
      </Suspense>

      {/* Diamond Pattern Visual Differentiator */}
      <section className="bg-gradient-to-br from-pink-100 via-orange-100 to-purple-100 dark:from-pink-900/20 dark:via-orange-900/20 dark:to-purple-900/20 py-4 relative overflow-hidden">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-center">
              {/* Left decorative elements */}
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-br from-pink-400 to-orange-400 dark:from-pink-600 dark:to-orange-600 transform rotate-45 shadow-md"></div>
                <div className="w-2 h-2 bg-gradient-to-br from-orange-400 to-purple-400 dark:from-orange-600 dark:to-purple-600 transform rotate-45 shadow-sm"></div>
              </div>
              
              {/* Central cake icon */}
              <div className="mx-6 relative">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-300 via-orange-300 to-purple-300 dark:from-pink-600 dark:via-orange-600 dark:to-purple-600 rounded-full flex items-center justify-center shadow-xl border-2 border-white dark:border-gray-800">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                {/* Floating sparkles */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-300 dark:bg-yellow-500 rounded-full animate-pulse"></div>
                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-pink-300 dark:bg-pink-500 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
              </div>
              
              {/* Right decorative elements */}
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gradient-to-br from-purple-400 to-pink-400 dark:from-purple-600 dark:to-pink-600 transform rotate-45 shadow-sm"></div>
                <div className="w-3 h-3 bg-gradient-to-br from-orange-400 to-pink-400 dark:from-orange-600 dark:to-pink-600 transform rotate-45 shadow-md"></div>
              </div>
            </div>
            
            {/* Bottom accent line */}
            <div className="mt-3 flex justify-center">
              <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-pink-400 via-orange-400 to-transparent dark:via-pink-500 dark:via-orange-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Curated Collections Section */}
      <Suspense fallback={<LoadingSpinner />}>
        <CuratedCollections />
      </Suspense>

      {/* Small Treats & Desserts Section */}
      <Suspense fallback={<LoadingSpinner />}>
        <SmallTreatsDesserts />
      </Suspense>

      {/* Testimonials Section */}
      <Suspense fallback={<LoadingSpinner />}>
        <Testimonials />
      </Suspense>

      {/* New Creamingo Footer */}
      <Suspense fallback={<LoadingSpinner />}>
        <Footer />
      </Suspense>
      
      {/* Mobile Footer */}
      <MobileFooter />
    </main>
  )
}
