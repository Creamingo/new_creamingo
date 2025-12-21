'use client'
import React, { useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css"; 

function SimpleSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: true,
    arrows: false,
    beforeChange: (oldIndex, newIndex) => {
      setCurrentSlide(newIndex);
    },
    responsive: [
      {
        breakpoint: 768,
        settings: {
          dots: true,
          arrows: false,
        }
      }
    ]
  };

  const slides = [
    {
      id: 1,
      image: '/Design 1.webp',
      alt: 'Birthday Cakes',
      title: 'Birthday Cakes'
    },
    {
      id: 2,
      image: '/Design 2.webp',
      alt: 'Fresh Plants',
      title: 'Fresh Plants'
    },
    {
      id: 3,
      image: '/Design 3.webp',
      alt: 'Special Gifts',
      title: 'Special Gifts'
    },
    {
      id: 4,
      image: '/Design 4.webp',
      alt: 'Anniversary Cakes',
      title: 'Anniversary Cakes'
    }
  ];

  return (
    <div>
      <div className="slider-container">
        <Slider {...settings}>
          {slides.map((slide) => (
            <div key={slide.id} className="px-2">
              <div className="relative group">
                <img 
                  src={slide.image} 
                  alt={slide.alt} 
                  className="w-full h-40 object-cover rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105" 
                  style={{ aspectRatio: '16/9' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-2xl"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="font-poppins text-sm font-semibold text-white mb-2">
                    {slide.title}
                  </h3>
                  <button className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-lg font-inter text-xs hover:bg-white/30 transition-all duration-300">
                    Explore Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </div>
      
      {/* Mobile Modern Pagination */}
      <div className="flex justify-center items-center mt-6 space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              const slider = document.querySelector('.lg\\:hidden .slider-container .slick-slider');
              if (slider && slider.slickGoTo) {
                slider.slickGoTo(index);
              }
            }}
            className={`relative group transition-all duration-300 ${
              index === currentSlide ? 'w-8' : 'w-6'
            } h-1.5 rounded-full overflow-hidden`}
          >
            <div className={`absolute inset-0 transition-all duration-300 ${
              index === currentSlide 
                ? 'bg-gradient-to-r from-pink-500 to-orange-500' 
                : 'bg-gray-300 group-hover:bg-gray-400'
            }`}></div>
            <div className={`absolute inset-0 transition-all duration-300 ${
              index === currentSlide 
                ? 'bg-gradient-to-r from-pink-400 to-orange-400 opacity-80' 
                : 'bg-transparent'
            }`}></div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CenterSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [sliderRef, setSliderRef] = useState(null);
  const settings = {
    className: "center",
    centerMode: true,
    infinite: true,
    centerPadding: "60px",
    slidesToShow: 1,
    speed: 500,
    dots: false,
    arrows: false,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: true,
    beforeChange: (oldIndex, newIndex) => {
      setCurrentSlide(newIndex);
    },
    responsive: [
      {
        breakpoint: 1024, // tablets and below - hide slider
        settings: {
          slidesToShow: 1,
          centerMode: false,
          dots: false,
          arrows: false,
          autoplay: false,
        }
      }
    ]
  };

  const slides = [
    {
      id: 1,
      image: '/Design 1.webp',
      alt: 'Birthday Cakes',
      title: 'Birthday Cakes'
    },
    {
      id: 2,
      image: '/Design 2.webp',
      alt: 'Fresh Plants',
      title: 'Fresh Plants'
    },
    {
      id: 3,
      image: '/Design 3.webp',
      alt: 'Special Gifts',
      title: 'Special Gifts'
    },
    {
      id: 4,
      image: '/Design 4.webp',
      alt: 'Anniversary Cakes',
      title: 'Anniversary Cakes'
    }
  ];

  return (
    <section className="bg-gradient-to-b from-pink-50 to-orange-50 py-8 lg:py-12">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Slim Header Section */}
          <div className="relative mb-4 lg:mb-6">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-pink-50 to-orange-50 rounded-xl border border-pink-200/30"></div>
            
            {/* Content */}
            <div className="relative px-4 lg:px-6 py-4 lg:py-6 text-center">
              {/* Inline Decoration and Heading */}
              <div className="flex items-center justify-center space-x-3 mb-2">
                <div className="w-6 h-0.5 bg-gradient-to-r from-pink-400 to-orange-400 rounded-full"></div>
                <h2 className="font-poppins text-lg lg:text-2xl font-bold">
                  <span className="bg-gradient-to-r from-[#6c3e27] via-pink-600 to-[#6c3e27] bg-clip-text text-transparent">
                    Delicious Highlights
                  </span>
                </h2>
                <div className="w-6 h-0.5 bg-gradient-to-r from-pink-400 to-orange-400 rounded-full"></div>
              </div>
              
              {/* Tagline */}
              <p className="font-inter text-sm lg:text-base text-gray-600">
                A taste of our most-loved creations.
              </p>
            </div>
          </div>
          
          {/* Desktop Only Slider */}
          <div className="hidden lg:block relative">
            <div className="slider-container">
              <Slider 
                {...settings}
                ref={(slider) => setSliderRef(slider)}
              >
                {slides.map((slide) => (
                  <div key={slide.id} className="px-2">
                    <div className="relative group">
                      <img 
                        src={slide.image} 
                        alt={slide.alt} 
                        className="w-full h-96 object-cover rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105" 
                        style={{ aspectRatio: '16/9' }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-2xl"></div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="font-poppins text-lg lg:text-xl font-semibold text-white mb-2">
                          {slide.title}
                        </h3>
                        <button className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-inter text-sm hover:bg-white/30 transition-all duration-300">
                          Explore Now
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </Slider>
            </div>
            
            {/* Custom Navigation Arrows */}
            <button
              onClick={() => {
                if (sliderRef) {
                  sliderRef.slickPrev();
                }
              }}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white group border border-gray-200"
              aria-label="Previous slide"
            >
              <div className="flex items-center justify-center w-full h-full">
                <svg className="w-6 h-6 text-gray-700 group-hover:text-[#6c3e27] transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
            </button>
            
            <button
              onClick={() => {
                if (sliderRef) {
                  sliderRef.slickNext();
                }
              }}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white group border border-gray-200"
              aria-label="Next slide"
            >
              <div className="flex items-center justify-center w-full h-full">
                <svg className="w-6 h-6 text-gray-700 group-hover:text-[#6c3e27] transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
            
            {/* Modern Pagination */}
            <div className="flex justify-center items-center mt-8 space-x-3">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (sliderRef) {
                      sliderRef.slickGoTo(index);
                    }
                  }}
                  className={`relative group transition-all duration-300 ${
                    index === currentSlide ? 'w-12' : 'w-8'
                  } h-2 rounded-full overflow-hidden`}
                >
                  <div className={`absolute inset-0 transition-all duration-300 ${
                    index === currentSlide 
                      ? 'bg-gradient-to-r from-pink-500 to-orange-500' 
                      : 'bg-gray-300 group-hover:bg-gray-400'
                  }`}></div>
                  <div className={`absolute inset-0 transition-all duration-300 ${
                    index === currentSlide 
                      ? 'bg-gradient-to-r from-pink-400 to-orange-400 opacity-80' 
                      : 'bg-transparent'
                  }`}></div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Mobile/Tablet Simple Slider */}
          <div className="lg:hidden">
            <SimpleSlider />
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider-container .slick-slide {
          outline: none;
        }
        
        .slider-container .slick-track {
          display: flex;
          align-items: center;
        }
        
        .slider-container .slick-dots {
          bottom: -40px;
        }
        
        .slider-container .slick-dots li button:before {
          color: #6c3e27;
          opacity: 0.3;
        }
        
        .slider-container .slick-dots li.slick-active button:before {
          color: #6c3e27;
          opacity: 1;
        }
        
        /* Desktop Slider Styles */
        .hidden.lg\\:block .slider-container .slick-prev,
        .hidden.lg\\:block .slider-container .slick-next {
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 50%;
          z-index: 10;
        }
        
        .hidden.lg\\:block .slider-container .slick-prev:hover,
        .hidden.lg\\:block .slider-container .slick-next:hover {
          background: white;
        }
        
        .hidden.lg\\:block .slider-container .slick-prev {
          left: -50px;
        }
        
        .hidden.lg\\:block .slider-container .slick-next {
          right: -50px;
        }
        
        /* Mobile Slider Styles */
        .lg\\:hidden .slider-container .slick-dots {
          bottom: -30px;
        }
        
        .lg\\:hidden .slider-container .slick-dots li button:before {
          font-size: 8px;
        }
        
        .lg\\:hidden .slider-container .slick-prev,
        .lg\\:hidden .slider-container .slick-next {
          display: none !important;
        }
      `}</style>
    </section>
  );
}
