'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import MobileFooter from '../../components/MobileFooter';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import UserProfileCard from './components/UserProfileCard';
import BirthdaySection from './components/BirthdaySection';
import AppearanceSection from './components/AppearanceSection';
import OrderHistoryCouponsSection from './components/OrderHistoryCouponsSection';
import MyActivitiesSection from './components/MyActivitiesSection';
import OtherInformationSection from './components/OtherInformationSection';
import AccountNavigationCards from './components/AccountNavigationCards';
import OrdersSection from './components/sections/OrdersSection';
import CouponsSection from './components/sections/CouponsSection';
import FAQsSection from './components/sections/FAQsSection';
import ReviewsSection from './components/sections/ReviewsSection';
import ReferAndEarn from '../../components/ReferAndEarn';

function AccountPageContent() {
  const router = useRouter();
  const { customer, logout } = useCustomerAuth();
  const [activeSection, setActiveSection] = useState(null); // null = main profile page
  const [badgeCounts, setBadgeCounts] = useState({
    orders: null,
    coupons: null,
    reviews: null
  });

  // Listen for section change events from new components
  useEffect(() => {
    const handleSectionChange = (event) => {
      setActiveSection(event.detail);
    };
    
    window.addEventListener('account-section-change', handleSectionChange);
    return () => window.removeEventListener('account-section-change', handleSectionChange);
  }, []);

  const handleSectionChange = (section) => {
    setActiveSection(section);
  };

  const handleNavigateToFAQs = () => {
    setActiveSection('faqs');
    // Scroll to FAQs section
    setTimeout(() => {
      const faqsElement = document.getElementById('faqs-section');
      if (faqsElement) {
        faqsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'orders':
        return <OrdersSection onBadgeUpdate={(count) => setBadgeCounts(prev => ({ ...prev, orders: count }))} />;
      case 'coupons':
        return <CouponsSection onBadgeUpdate={(count) => setBadgeCounts(prev => ({ ...prev, coupons: count > 0 ? count : null }))} />;
      case 'faqs':
        return <FAQsSection />;
      case 'reviews':
        return <ReviewsSection onBadgeUpdate={(count) => setBadgeCounts(prev => ({ ...prev, reviews: count }))} />;
      default:
        return <OrdersSection onBadgeUpdate={(count) => setBadgeCounts(prev => ({ ...prev, orders: count }))} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header />
      
      {/* Sticky Greeting Line */}
      <div className="sticky top-16 z-40 bg-white dark:bg-gray-800 border-b border-gray-200/60 dark:border-gray-700/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <p className="font-poppins text-base lg:text-lg font-medium text-gray-700 dark:text-gray-200 leading-tight tracking-tight">
            Hello, {customer?.name || 'User'} 👋
          </p>
        </div>
      </div>

      {/* Mobile Layout - New Design */}
      <div className="lg:hidden">
        {activeSection === 'orders' || activeSection === 'coupons' || activeSection === 'faqs' || activeSection === 'reviews' ? (
          // Show section content when active
          <div className="max-w-7xl mx-auto px-4 pt-5 pb-24">
            <button
              onClick={() => setActiveSection(null)}
              className="mb-4 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors font-inter text-sm font-medium"
            >
              <span className="text-xl">←</span>
              <span>Back to Profile</span>
            </button>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-[0_2px_8px_0_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_0_rgba(0,0,0,0.3)] border border-gray-200/60 dark:border-gray-700/60 p-5">
              {renderActiveSection()}
            </div>
          </div>
        ) : (
          // Show main profile page
          <div className="max-w-7xl mx-auto px-4 pt-3 pb-20 space-y-4">
            {/* Profile Card */}
            <UserProfileCard />

            {/* Birthday Section */}
            <div className="relative">
              <BirthdaySection />
            </div>

            {/* Appearance Mode Section */}
            <div className="relative">
              <AppearanceSection />
            </div>

            {/* Order History & Coupons Section */}
            <div className="relative">
              <OrderHistoryCouponsSection badgeCounts={badgeCounts} />
            </div>

            {/* My Activities Section */}
            <div className="relative">
              <MyActivitiesSection badgeCounts={badgeCounts} />
            </div>

            {/* Refer & Earn Section */}
            <div className="relative">
              <ReferAndEarn compact={true} />
            </div>

            {/* Other Information Section */}
            <div className="relative">
              <OtherInformationSection 
                onNavigateToFAQs={handleNavigateToFAQs}
                onLogout={handleLogout}
              />
            </div>
          </div>
        )}
      </div>

      {/* Desktop/Laptop Layout - New Design */}
      <div className="hidden lg:block">
        {activeSection === 'orders' || activeSection === 'coupons' || activeSection === 'faqs' || activeSection === 'reviews' ? (
          // Show section content when active
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-6">
            <button
              onClick={() => setActiveSection(null)}
              className="mb-4 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors font-inter text-sm font-medium"
            >
              <span className="text-xl">←</span>
              <span>Back to Profile</span>
            </button>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-[0_2px_8px_0_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_0_rgba(0,0,0,0.3)] border border-gray-200/60 dark:border-gray-700/60 p-6 lg:p-8">
              {renderActiveSection()}
            </div>
          </div>
        ) : (
          // Show main profile page
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-6 lg:pb-24">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Main Sections */}
              <div className="lg:col-span-2 space-y-6">
                {/* Profile Card */}
                <div className="relative">
                  <UserProfileCard />
                </div>

                {/* Birthday Section */}
                <div className="relative">
                  <BirthdaySection />
                </div>

                {/* My Activities Section */}
                <div className="relative">
                  <MyActivitiesSection badgeCounts={badgeCounts} />
                </div>

                {/* Refer & Earn Section */}
                <div className="relative">
                  <ReferAndEarn compact={false} />
                </div>
              </div>

              {/* Right Column - Sidebar Sections */}
              <div className="lg:col-span-1 space-y-6">
                {/* Appearance Mode Section */}
                <div className="relative">
                  <AppearanceSection />
                </div>

                {/* Order History & Coupons Section */}
                <div className="relative">
                  <OrderHistoryCouponsSection badgeCounts={badgeCounts} />
                </div>

                {/* Other Information Section */}
                <div className="relative">
                  <OtherInformationSection 
                    onNavigateToFAQs={handleNavigateToFAQs}
                    onLogout={handleLogout}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Website Footer - Visually hidden but kept in DOM for SEO */}
      <div className="sr-only">
        <Footer />
      </div>
      
      {/* Mobile Footer - Sticky */}
      <MobileFooter />
    </div>
  );
}

export default function AccountPage() {
  return (
    <ProtectedRoute>
      <AccountPageContent />
    </ProtectedRoute>
  );
}

