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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const fetchBanners = async () => {
      try {
        setLoading(true);
        setError(null);
        logger.log('Fetching banners...');
        const activeBanners = await bannersAPI.getActiveBanners();
        logger.log('Fetched banners:', activeBanners);
        const sortedBanners = [...activeBanners].sort((a, b) => a.order_index - b.order_index);
        logger.log('Sorted banners:', sortedBanners);
        setBanners(sortedBanners);
      } catch (err) {
        console.error('Error fetching banners:', err);
        setError(err.message);
        setBanners([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, [mounted]);

  const settings = {
    className: "center",
    centerMode: false,
    infinite: banners.length > 1,
    centerPadding: "0px",
    slidesToShow: 1,
    speed: 500,
    dots: true,
    arrows: false,
    autoplay: banners.length > 1,
    autoplaySpeed: 4500,
    pauseOnHover: true,
    fade: true,
    beforeChange: (_oldIndex, newIndex) => setCurrentSlide(newIndex),
    ref: (slider) => setDesktopSliderRef(slider),
    responsive: [
      {
        breakpoint: 1024,
        settings: { slidesToShow: 1, centerMode: false, dots: false, fade: true }
      }
    ]
  };

  const mobileSettings = {
    dots: true,
    infinite: banners.length > 1,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: banners.length > 1,
    autoplaySpeed: 4500,
    pauseOnHover: true,
    arrows: false,
    fade: true,
    beforeChange: (_oldIndex, newIndex) => setCurrentSlide(newIndex),
    ref: (slider) => setMobileSliderRef(slider),
  };

  useEffect(() => {
    if (!mounted || banners.length === 0) return;
    const trackView = async () => {
      const currentBanner = banners[currentSlide];
      if (currentBanner) {
        const customerData = localStorage.getItem('customer');
        const customerId = customerData ? JSON.parse(customerData).id : null;
        try {
          await bannersAPI.trackView(currentBanner.id, customerId);
        } catch (error) {
          console.error('Error tracking banner view:', error);
        }
      }
    };
    const timer = setTimeout(trackView, 1000);
    return () => clearTimeout(timer);
  }, [mounted, banners, currentSlide]);

  const handleBannerClick = async (banner) => {
    const customerData = localStorage.getItem('customer');
    const customerId = customerData ? JSON.parse(customerData).id : null;
    try {
      await bannersAPI.trackClick(banner.id, customerId);
      sessionStorage.setItem('last_clicked_banner_id', banner.id);
    } catch (error) {
      console.error('Error tracking banner click:', error);
    }
    if (banner.button_url) {
      if (banner.button_url.startsWith('http://') || banner.button_url.startsWith('https://')) {
        window.open(banner.button_url, '_blank');
      } else {
        window.location.href = banner.button_url;
      }
    }
  };

  const isVideoBanner = (banner) => {
    return banner.video_url || (banner.image_url && banner.image_url.match(/\.(mp4|webm|ogg)$/i));
  };

  if (!mounted) return null;

  const renderBannerSection = () => (
    <section className="py-4 lg:pt-8 lg:pb-10 bg-white dark:bg-gray-900 banner-slider-section">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <>
              <div className="hidden lg:flex items-center justify-center min-h-[240px] max-h-[400px] bg-gray-50 dark:bg-gray-800/30 rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 dark:border-pink-400 mx-auto mb-2"></div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Loading…</p>
                </div>
              </div>
              <div className="lg:hidden flex items-center justify-center min-h-[160px] max-h-[280px] bg-gray-50 dark:bg-gray-800/30 rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500 dark:border-pink-400 mx-auto mb-2"></div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">Loading…</p>
                </div>
              </div>
            </>
          ) : banners.length === 0 ? (
            <div className="min-h-[160px] lg:min-h-[240px] flex items-center justify-center bg-gray-50 dark:bg-gray-800/30 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">No banners available</p>
            </div>
          ) : (
            <>
              {/* Desktop: image only, full fit, no crop */}
              <div className="hidden lg:block">
                <div className="slider-container">
                  <Slider {...settings}>
                    {banners.map((banner) => {
                      const isVideo = isVideoBanner(banner);
                      return (
                        <div key={banner.id} className="px-2">
                          <div
                            className="banner-slide flex items-center justify-center min-h-[240px] max-h-[400px] bg-gray-50 dark:bg-gray-800/30 rounded-lg overflow-hidden"
                            onClick={() => handleBannerClick(banner)}
                            role={banner.button_url ? 'button' : undefined}
                            tabIndex={banner.button_url ? 0 : undefined}
                            onKeyDown={(e) => banner.button_url && (e.key === 'Enter' || e.key === ' ') && handleBannerClick(banner)}
                          >
                            {isVideo ? (
                              <video
                                src={banner.video_url || banner.image_url}
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="max-w-full max-h-[400px] w-auto h-auto object-contain"
                              />
                            ) : (
                              <img
                                src={banner.image_url}
                                alt={banner.title || 'Banner'}
                                className="max-w-full max-h-[400px] w-auto h-auto object-contain"
                                onError={(e) => {
                                  const target = e.target;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent && !parent.querySelector('.error-fallback')) {
                                    const fallback = document.createElement('div');
                                    fallback.className = 'error-fallback flex items-center justify-center w-full min-h-[200px] text-gray-400 dark:text-gray-500 text-sm';
                                    fallback.textContent = 'Image unavailable';
                                    parent.appendChild(fallback);
                                  }
                                }}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </Slider>
                </div>
              </div>

              {/* Mobile: image only, full fit, no crop */}
              <div className="lg:hidden">
                <div className="slider-container">
                  <Slider {...mobileSettings}>
                    {banners.map((banner) => {
                      const isVideo = isVideoBanner(banner);
                      const mobileImageUrl = banner.image_url_mobile || banner.image_url;
                      return (
                        <div key={banner.id} className="px-2">
                          <div
                            className="banner-slide flex items-center justify-center min-h-[160px] max-h-[280px] bg-gray-50 dark:bg-gray-800/30 rounded-lg overflow-hidden"
                            onClick={() => handleBannerClick(banner)}
                            role={banner.button_url ? 'button' : undefined}
                            tabIndex={banner.button_url ? 0 : undefined}
                            onKeyDown={(e) => banner.button_url && (e.key === 'Enter' || e.key === ' ') && handleBannerClick(banner)}
                          >
                            {isVideo ? (
                              <video
                                src={banner.video_url || mobileImageUrl}
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="max-w-full max-h-[280px] w-auto h-auto object-contain"
                              />
                            ) : (
                              <img
                                src={mobileImageUrl}
                                alt={banner.title || 'Banner'}
                                className="max-w-full max-h-[280px] w-auto h-auto object-contain"
                                onError={(e) => {
                                  const target = e.target;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent && !parent.querySelector('.error-fallback')) {
                                    const fallback = document.createElement('div');
                                    fallback.className = 'error-fallback flex items-center justify-center w-full min-h-[120px] text-gray-400 dark:text-gray-500 text-xs';
                                    fallback.textContent = 'Image unavailable';
                                    parent.appendChild(fallback);
                                  }
                                }}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </Slider>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );

  return renderBannerSection();
};

export default DynamicBannerSlider;
