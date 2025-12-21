import React, { useState } from 'react';

// Social Media Icons Component
const SocialIcon = ({ href, children, label }: { href: string; children: React.ReactNode; label: string }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={label}
    className="w-10 h-10 bg-gradient-to-br from-[#F5D08A] to-[#D4A574] rounded-lg flex items-center justify-center text-[#2E1B0C] hover:from-[#F5D08A] hover:to-[#C19A5B] transition-all duration-300 shadow-md hover:shadow-lg hover:scale-110 transform"
  >
    {children}
  </a>
);

// Newsletter Component
const NewsletterSection = () => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // Here you would typically send the email to your backend
      console.log('Subscribing email:', email);
      setIsSubscribed(true);
      setEmail('');
      setTimeout(() => setIsSubscribed(false), 3000);
    }
  };

  return (
    <div className="bg-gradient-to-r from-[#3A2410] to-[#2E1B0C] rounded-xl p-6 mb-8 animate-fade-in">
      <div className="max-w-4xl mx-auto text-center">
        <h3 className="text-[#FFF5E1] text-xl font-semibold mb-4">
          Stay updated with fresh cake offers & new flavors!
        </h3>
        <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="flex-1 px-4 py-3 rounded-lg bg-[#FFF5E1] text-[#2E1B0C] placeholder-[#8B7355] focus:outline-none focus:ring-2 focus:ring-[#F5D08A] transition-all duration-300"
            required
          />
          <button
            type="submit"
            className="px-6 py-3 bg-[#2E1B0C] text-[#FFF5E1] rounded-lg font-medium hover:bg-[#1A0F06] transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 transform"
          >
            {isSubscribed ? 'Subscribed!' : 'Subscribe'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Main Footer Component
const Footer: React.FC = () => {
  return (
    <>
      {/* Schema.org JSON-LD markup for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Creamingo",
            "description": "Order fresh cakes online — fast delivery, custom designs, and delicious moments baked daily by Creamingo.",
            "url": "https://creamingo.com",
            "logo": "https://creamingo.com/logo.png",
            "contactPoint": {
              "@type": "ContactPoint",
              "telephone": "+91-7570030333",
              "contactType": "customer service",
              "email": "info@creamingo.com"
            },
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Asuran Chowk",
              "addressLocality": "Gorakhpur",
              "addressRegion": "Uttar Pradesh",
              "postalCode": "273001",
              "addressCountry": "IN"
            },
            "sameAs": [
              "https://www.instagram.com/creamingo.official/",
              "https://www.facebook.com/creamingo"
            ]
          })
        }}
      />

      <footer className="bg-gradient-to-b from-[#4B2E16] to-[#2E1B0C] text-[#FFF5E1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Newsletter Section */}
          <NewsletterSection />

          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Column 1 - About Creamingo */}
            <section className="space-y-4 animate-fade-in-up">
              <h3 className="text-xl font-bold text-[#FFF5E1] mb-4">About Creamingo</h3>
              <nav className="space-y-3">
                <a href="/our-story" className="block text-[#FFF5E1] hover:text-[#F5D08A] transition-colors duration-300">
                  Our Story
                </a>
                <a href="/why-choose-us" className="block text-[#FFF5E1] hover:text-[#F5D08A] transition-colors duration-300">
                  Why Choose Creamingo
                </a>
                <a href="/franchise" className="block text-[#FFF5E1] hover:text-[#F5D08A] transition-colors duration-300">
                  Franchise & Partnerships
                </a>
                <a href="/careers" className="block text-[#FFF5E1] hover:text-[#F5D08A] transition-colors duration-300">
                  Careers
                </a>
                <a href="/contact" className="block text-[#FFF5E1] hover:text-[#F5D08A] transition-colors duration-300">
                  Contact Us
                </a>
              </nav>
              <p className="text-sm text-[#FFF5E1]/80 mt-6 leading-relaxed">
                Order fresh cakes online — fast delivery, custom designs, and delicious moments baked daily by Creamingo.
              </p>
            </section>

            {/* Column 2 - Quick Links */}
            <section className="space-y-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <h3 className="text-xl font-bold text-[#FFF5E1] mb-4">Quick Links</h3>
              <nav className="space-y-3">
                <a href="/cakes" className="block text-[#FFF5E1] hover:text-[#F5D08A] transition-colors duration-300">
                  All Cakes
                </a>
                <a href="/birthday-cakes" className="block text-[#FFF5E1] hover:text-[#F5D08A] transition-colors duration-300">
                  Birthday Cakes
                </a>
                <a href="/anniversary-cakes" className="block text-[#FFF5E1] hover:text-[#F5D08A] transition-colors duration-300">
                  Anniversary Cakes
                </a>
                <a href="/same-day-delivery" className="block text-[#FFF5E1] hover:text-[#F5D08A] transition-colors duration-300">
                  Same Day Delivery
                </a>
                <a href="/offers" className="block text-[#FFF5E1] hover:text-[#F5D08A] transition-colors duration-300">
                  Offers & Discounts
                </a>
                <a href="/gift-cards" className="block text-[#FFF5E1] hover:text-[#F5D08A] transition-colors duration-300">
                  Gift Cards
                </a>
              </nav>
            </section>

            {/* Column 3 - Support & Policies */}
            <section className="space-y-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <h3 className="text-xl font-bold text-[#FFF5E1] mb-4">Support & Policies</h3>
              <nav className="space-y-3">
                <a href="/faq" className="block text-[#FFF5E1] hover:text-[#F5D08A] transition-colors duration-300">
                  FAQs
                </a>
                <a href="/refund-policy" className="block text-[#FFF5E1] hover:text-[#F5D08A] transition-colors duration-300">
                  Refund & Cancellation Policy
                </a>
                <a href="/shipping" className="block text-[#FFF5E1] hover:text-[#F5D08A] transition-colors duration-300">
                  Shipping & Delivery
                </a>
                <a href="/terms" className="block text-[#FFF5E1] hover:text-[#F5D08A] transition-colors duration-300">
                  Terms & Conditions
                </a>
                <a href="/privacy" className="block text-[#FFF5E1] hover:text-[#F5D08A] transition-colors duration-300">
                  Privacy Policy
                </a>
                <a href="/track-order" className="block text-[#FFF5E1] hover:text-[#F5D08A] transition-colors duration-300">
                  Track Order
                </a>
              </nav>
            </section>

            {/* Column 4 - Let's Connect */}
            <section className="space-y-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <h3 className="text-xl font-bold text-[#FFF5E1] mb-4">Let's Connect</h3>
              
              {/* Contact Information */}
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-[#F5D08A] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[#FFF5E1]/90">
                    Asuran Chowk,<br />
                    Gorakhpur, Uttar Pradesh - 273001
                  </span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-[#F5D08A] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  <a href="tel:+917570030333" className="text-[#FFF5E1]/90 hover:text-[#F5D08A] transition-colors duration-300">
                    +91-7570030333
                  </a>
                </div>
                
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-[#F5D08A] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <a href="mailto:info@creamingo.com" className="text-[#FFF5E1]/90 hover:text-[#F5D08A] transition-colors duration-300">
                    info@creamingo.com
                  </a>
                </div>
              </div>

              {/* Social Media Icons */}
              <div className="pt-4">
                <h4 className="text-sm font-semibold text-[#FFF5E1] mb-3">Follow Us</h4>
                <div className="flex space-x-3">
                  <SocialIcon href="https://www.instagram.com/creamingo.official/" label="Follow us on Instagram">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </SocialIcon>
                  
                  <SocialIcon href="https://www.facebook.com/creamingo" label="Follow us on Facebook">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </SocialIcon>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#FFF5E1]/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-center text-sm text-[#FFF5E1]/80 animate-fade-in">
              © 2025 Creamingo. All rights reserved. Crafted with ❤️ in India | Baked Fresh, Delivered Fast.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
