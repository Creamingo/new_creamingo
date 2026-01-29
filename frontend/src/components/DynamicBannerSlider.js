'use client';

import React, { useState, useEffect } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import "./DynamicBannerSlider.css";
import bannersAPI from '../api/banners';
import logger from '../utils/logger';

const DynamicBannerSlider = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [desktopSliderRef, setDesktopSliderRef] = useState(null);
  const [mobileSliderRef, setMobileSliderRef] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Mount detection
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch banners from database
  useEffect(() => {
    if (!mounted) return;

    const fetchBanners = async () => {
      try {
        setLoading(true);
        setError(null);
        
        logger.log('Fetching banners...');
        
        // Get active banners from database
        const activeBanners = await bannersAPI.getActiveBanners();
        
        logger.log('Fetched banners:', activeBanners);
        
        // Sort banners by order_index
        const sortedBanners = [...activeBanners].sort((a, b) => a.order_index - b.order_index);
        
        logger.log('Sorted banners:', sortedBanners);
        
        setBanners(sortedBanners);
      } catch (err) {
        console.error('Error fetching banners:', err);
        setError(err.message);
        // Fallback to empty array to prevent crashes
        setBanners([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, [mounted]);

  // Progress bar animation
  useEffect(() => {
    if (!mounted || banners.length === 0 || isPaused) {
      return;
    }

    const autoplaySpeed = 4000; // Match autoplaySpeed
    const interval = 50; // Update every 50ms for smooth animation
    const increment = (100 / autoplaySpeed) * interval;

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 0; // Reset when slide changes
        }
        return prev + increment;
      });
    }, interval);

    return () => clearInterval(progressInterval);
  }, [mounted, banners.length, isPaused, currentSlide]);


  // Slider settings
  const settings = {
    className: "center",
    centerMode: false, // Disabled for fade effect compatibility
    infinite: banners.length > 1,
    centerPadding: "0px",
    slidesToShow: 1,
    speed: 900, // Smooth premium transition
    dots: true,
    arrows: false,
    autoplay: banners.length > 1,
    autoplaySpeed: 4500,
    pauseOnHover: true,
    fade: true, // Enable fade transition
    cssEase: 'cubic-bezier(0.22, 1, 0.36, 1)', // Luxury easing
    beforeChange: (oldIndex, newIndex) => {
      // Update state immediately for perfect thumbnail sync
      setCurrentSlide(newIndex);
      setProgress(0); // Reset progress on slide change
    },
    ref: (slider) => {
      setDesktopSliderRef(slider);
    },
    responsive: [
      {
        breakpoint: 1024, // tablets and below - hide slider
        settings: {
          slidesToShow: 1,
          centerMode: false,
          dots: false,
          fade: true
        }
      }
    ]
  };

  // Mobile slider settings
  const mobileSettings = {
    dots: true,
    infinite: banners.length > 1,
    speed: 900, // Smooth premium transition
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: banners.length > 1,
    autoplaySpeed: 4500,
    pauseOnHover: true,
    arrows: false,
    fade: true, // Enable fade transition
    cssEase: 'cubic-bezier(0.22, 1, 0.36, 1)', // Luxury easing
    beforeChange: (oldIndex, newIndex) => {
      setCurrentSlide(newIndex);
      setProgress(0); // Reset progress on slide change
    },
    ref: (slider) => {
      setMobileSliderRef(slider);
    },
    responsive: [
      {
        breakpoint: 768,
        settings: {
          dots: true,
          arrows: false,
          fade: true
        }
      }
    ]
  };

  // Track banner view when it becomes visible
  useEffect(() => {
    if (!mounted || banners.length === 0) return;

    // Track view for the current slide
    const trackView = async () => {
      const currentBanner = banners[currentSlide];
      if (currentBanner) {
        // Get customer ID from localStorage if available
        const customerData = localStorage.getItem('customer');
        const customerId = customerData ? JSON.parse(customerData).id : null;
        
        // Track view (fail silently to not break UX)
        try {
          await bannersAPI.trackView(currentBanner.id, customerId);
        } catch (error) {
          console.error('Error tracking banner view:', error);
        }
      }
    };

    // Track view when slide changes or component mounts
    const timer = setTimeout(trackView, 1000); // Wait 1 second to ensure banner is visible
    return () => clearTimeout(timer);
  }, [mounted, banners, currentSlide]);

  // Handle banner click
  const handleBannerClick = async (banner) => {
    // Track click
    const customerData = localStorage.getItem('customer');
    const customerId = customerData ? JSON.parse(customerData).id : null;
    
    try {
      await bannersAPI.trackClick(banner.id, customerId);
      
      // Store banner ID in sessionStorage for conversion tracking
      sessionStorage.setItem('last_clicked_banner_id', banner.id);
    } catch (error) {
      console.error('Error tracking banner click:', error);
    }

    if (banner.button_url) {
      // Navigate to banner URL
      if (banner.button_url.startsWith('http://') || banner.button_url.startsWith('https://')) {
        window.open(banner.button_url, '_blank');
      } else {
        window.location.href = banner.button_url;
      }
    }
  };

  // Check if banner is video
  const isVideoBanner = (banner) => {
    return banner.video_url || (banner.image_url && banner.image_url.match(/\.(mp4|webm|ogg)$/i));
  };

  // Don't render during SSR
  if (!mounted) {
    return null;
  }

  // Always render the section structure to maintain layout consistency
  const renderBannerSection = () => (
    <section className="py-4 lg:pt-8 lg:pb-10 bg-white dark:bg-gray-900 banner-slider-section">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <>
              {/* Desktop placeholder - matches actual banner dimensions exactly */}
              <div className="hidden lg:block relative">
                <div className="h-72 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 dark:border-pink-400 mx-auto mb-2"></div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Loading banners...</p>
                  </div>
                </div>
              </div>
              
              {/* Mobile placeholder - matches actual banner dimensions exactly */}
              <div className="lg:hidden">
                <div className="h-40 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500 dark:border-pink-400 mx-auto mb-2"></div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">Loading banners...</p>
                  </div>
                </div>
              </div>
            </>
          ) : banners.length === 0 ? (
            // Empty state - still maintain exact height
            <div className="h-72 lg:h-72 flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">No banners available</p>
            </div>
          ) : (
            // Actual banner content
            <>
              {/* Desktop Slider - Hidden on mobile */}
              <div className="hidden lg:block relative" style={{ position: 'relative', zIndex: 1 }}>
                <div className="slider-container bg-transparent relative" style={{ backgroundColor: 'transparent', position: 'relative', zIndex: 1 }}>
                  <Slider {...settings}>
                    {banners.map((banner, index) => {
                      const isVideo = isVideoBanner(banner);
                      const isAsymmetric = index % 2 === 1; // Alternate asymmetric layout
                      const textPosition = isAsymmetric ? 'top-8 left-8 right-auto' : 'bottom-4 left-4 right-4';
                      
                      return (
                        <div key={banner.id} className="px-2">
                          <div 
                            className="relative group cursor-pointer banner-slide"
                            onClick={() => handleBannerClick(banner)}
                            onMouseEnter={() => setIsPaused(true)}
                            onMouseLeave={() => setIsPaused(false)}
                          >
                            <div className="relative overflow-hidden rounded-2xl banner-container">
                              {/* Video or Image */}
                              {isVideo ? (
                                <video
                                  src={banner.video_url || banner.image_url}
                                  autoPlay
                                  loop
                                  muted
                                  playsInline
                                  className="w-full h-72 object-cover rounded-2xl shadow-lg dark:shadow-xl dark:shadow-black/20 banner-image"
                                />
                              ) : (
                                <img 
                                  src={banner.image_url} 
                                  alt={banner.title} 
                                  className="w-full h-72 object-cover rounded-2xl shadow-lg dark:shadow-xl dark:shadow-black/20 banner-image transition-all duration-300 group-hover:scale-[1.01] group-hover:brightness-[1.02]" 
                                  onError={(e) => {
                                    const target = e.target;
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent && !parent.querySelector('.error-fallback')) {
                                      const fallback = document.createElement('div');
                                      fallback.className = 'error-fallback w-full h-72 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center rounded-2xl border border-gray-200 dark:border-gray-700';
                                      fallback.innerHTML = '<span class="text-gray-400 dark:text-gray-500 text-sm">Image unavailable</span>';
                                      parent.appendChild(fallback);
                                    }
                                  }}
                                />
                              )}
                              
                              {/* Gradient overlays */}
                              <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent rounded-2xl z-0"></div>
                              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent rounded-2xl z-0"></div>
                              
                              {/* Interactive Hotspots */}
                              {banner.hotspots && banner.hotspots.length > 0 && (
                                <div className="absolute inset-0 z-20">
                                  {banner.hotspots.map((hotspot, idx) => (
                                    <div
                                      key={idx}
                                      className="absolute hotspot-pulse cursor-pointer"
                                      style={{
                                        left: `${hotspot.x}%`,
                                        top: `${hotspot.y}%`,
                                        transform: 'translate(-50%, -50%)'
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (hotspot.url) {
                                          window.location.href = hotspot.url;
                                        }
                                      }}
                                    >
                                      <div className="w-4 h-4 bg-white rounded-full shadow-lg"></div>
                                      <div className="absolute inset-0 w-4 h-4 bg-white rounded-full animate-ping opacity-75"></div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {/* Glassmorphism Content Overlay */}
                              <div 
                                className={`absolute ${textPosition} z-10 banner-content glassmorphism-overlay`}
                              >
                                <div className="bg-white/20 dark:bg-black/30 backdrop-blur-xl rounded-2xl p-4 lg:p-5 border border-white/30 dark:border-white/10 shadow-2xl">
                                  <h3 className="font-poppins text-lg lg:text-xl font-semibold text-white mb-1.5 banner-title drop-shadow-lg">
                                    {banner.title}
                                  </h3>
                                  {banner.subtitle && (
                                    <p className="font-inter text-sm lg:text-sm text-white/90 mb-3 banner-subtitle drop-shadow-md">
                                      {banner.subtitle}
                                    </p>
                                  )}
                                  {(banner.badge_text || banner.discount_text || banner.offer_text || (banner.subtitle && /%|off/i.test(banner.subtitle))) && (
                                    <div className="inline-flex items-center rounded-full bg-white/90 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-800 px-3 py-1 shadow-sm mb-3">
                                      {banner.badge_text || banner.discount_text || banner.offer_text || banner.subtitle}
                                    </div>
                                  )}
                                  {banner.button_text && (
                                    <button className="group/btn relative bg-[#ff3f6c] hover:bg-[#ff527d] text-white px-5 py-2.5 rounded-full font-inter text-sm font-semibold transition-all duration-300 banner-button shadow-lg hover:shadow-xl overflow-hidden">
                                      <span className="relative z-10 flex items-center gap-2">
                                        {banner.button_text}
                                        <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                      </span>
                                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </Slider>
                  
                  {/* Minimal dot indicators handled by slick */}
                </div>
                
                {/* Custom Navigation Arrows */}
                {banners.length > 1 && (
                  <>
                    <button
                      onClick={() => {
                        if (desktopSliderRef) {
                          desktopSliderRef.slickPrev();
                        }
                      }}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-lg dark:shadow-xl dark:shadow-black/20 hover:shadow-xl transition-all duration-300 hover:bg-white dark:hover:bg-gray-700 group border border-gray-200 dark:border-gray-700"
                      aria-label="Previous slide"
                    >
                      <div className="flex items-center justify-center w-full h-full">
                        <svg className="w-6 h-6 text-gray-700 dark:text-gray-300 group-hover:text-[#6c3e27] dark:group-hover:text-amber-400 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => {
                        if (desktopSliderRef) {
                          desktopSliderRef.slickNext();
                        }
                      }}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-lg dark:shadow-xl dark:shadow-black/20 hover:shadow-xl transition-all duration-300 hover:bg-white dark:hover:bg-gray-700 group border border-gray-200 dark:border-gray-700"
                      aria-label="Next slide"
                    >
                      <div className="flex items-center justify-center w-full h-full">
                        <svg className="w-6 h-6 text-gray-700 dark:text-gray-300 group-hover:text-[#6c3e27] dark:group-hover:text-amber-400 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  </>
                )}

              </div>

              {/* Mobile Slider - Hidden on desktop */}
              <div className="lg:hidden relative" style={{ position: 'relative', zIndex: 1, overflow: 'visible' }}>
                <div className="slider-container bg-transparent relative" style={{ backgroundColor: 'transparent', position: 'relative', zIndex: 1 }}>
                  <Slider {...mobileSettings}>
                    {banners.map((banner, index) => {
                      const isVideo = isVideoBanner(banner);
                      
                      return (
                        <div key={banner.id} className="px-2">
                          <div 
                            className="relative group cursor-pointer banner-slide"
                            onClick={() => handleBannerClick(banner)}
                            onMouseEnter={() => setIsPaused(true)}
                            onMouseLeave={() => setIsPaused(false)}
                          >
                              <div className="relative overflow-hidden rounded-2xl">
                              {isVideo ? (
                                <video
                                  src={banner.video_url || banner.image_url}
                                  autoPlay
                                  loop
                                  muted
                                  playsInline
                                    className="w-full h-40 object-cover rounded-2xl shadow-lg dark:shadow-xl dark:shadow-black/20 banner-image"
                                />
                              ) : (
                                <img 
                                  src={banner.image_url} 
                                  alt={banner.title} 
                                    className="w-full h-40 object-cover rounded-2xl shadow-lg dark:shadow-xl dark:shadow-black/20 banner-image transition-all duration-300 group-hover:scale-[1.01] group-hover:brightness-[1.02]"
                                  onError={(e) => {
                                    const target = e.target;
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent && !parent.querySelector('.error-fallback')) {
                                      const fallback = document.createElement('div');
                                        fallback.className = 'error-fallback w-full h-40 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center rounded-2xl border border-gray-200 dark:border-gray-700';
                                      fallback.innerHTML = '<span class="text-gray-400 dark:text-gray-500 text-xs">Image unavailable</span>';
                                      parent.appendChild(fallback);
                                    }
                                  }}
                                />
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-2xl z-0 group-hover:from-black/62 transition-all duration-300"></div>
                              
                              {/* Glassmorphism Content Overlay - Mobile */}
                              <div className="absolute bottom-4 left-4 right-4 z-10 banner-content">
                                <div className="bg-white/10 dark:bg-black/20 backdrop-blur-md rounded-xl p-3 border border-white/20 dark:border-white/10 shadow-2xl">
                                  <h3 className="font-poppins text-sm font-bold text-white mb-1 banner-title drop-shadow-lg">
                                    {banner.title}
                                  </h3>
                                  {banner.subtitle && (
                                    <p className="font-inter text-xs text-white/95 mb-2 banner-subtitle drop-shadow-md">
                                      {banner.subtitle}
                                    </p>
                                  )}
                                  {banner.button_text && (
                                    <button className="group/btn relative bg-gradient-to-r from-[#6c3e27] to-amber-600 dark:from-amber-500 dark:to-amber-600 text-white px-3 py-1.5 rounded-lg font-inter text-xs font-semibold hover:scale-105 transition-all duration-300 banner-button shadow-xl hover:shadow-2xl overflow-hidden">
                                      <span className="relative z-10 flex items-center gap-1">
                                        {banner.button_text}
                                        <svg className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                      </span>
                                      <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-[#6c3e27] opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </Slider>
                  
                  {/* Progress Bar - Mobile */}
                  {banners.length > 1 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20 dark:bg-white/10 rounded-b-2xl overflow-hidden z-[90]">
                      <div 
                        className="h-full bg-gradient-to-r from-[#6c3e27] to-amber-500 dark:from-amber-400 dark:to-amber-500 transition-all duration-75 ease-linear"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  )}

                  {/* Slide Counter - Mobile */}
                  {banners.length > 1 && (
                    <div 
                      className="absolute top-2 right-2 pointer-events-auto slider-counter" 
                      style={{ 
                        position: 'absolute', 
                        top: '0.5rem', 
                        right: '0.5rem',
                        zIndex: 10
                      }}
                    >
                      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-full px-3 py-1 shadow-xl border border-gray-200/50 dark:border-gray-700/50">
                        <span className="font-poppins text-xs font-semibold text-[#6c3e27] dark:text-amber-400">
                          {currentSlide + 1} / {banners.length}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Indicator Inside Slider - Mobile (Hidden as requested) */}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );

  // Don't render during SSR
  if (!mounted) {
    return renderBannerSection(); // Still render to maintain layout
  }

  return renderBannerSection();
};

export default DynamicBannerSlider;
