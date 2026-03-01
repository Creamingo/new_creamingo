'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import MobileFooter from '../../components/MobileFooter';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import { useAuthModal } from '../../contexts/AuthModalContext';
import UserProfileCard from './components/UserProfileCard';
import BirthdaySection from './components/BirthdaySection';
import AppearanceSection from './components/AppearanceSection';
import AccountMenuSection from './components/AccountMenuSection';
import OrdersSection from './components/sections/OrdersSection';
import CouponsSection from './components/sections/CouponsSection';
import FAQsSection from './components/sections/FAQsSection';
import ReviewsSection from './components/sections/ReviewsSection';

function GuestAccountView() {
  const { openAuthModal } = useAuthModal();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header />
      {/* Same sticky greeting as logged-in Account – guest mode */}
      <div className="sticky top-[3.6rem] lg:top-16 z-40 bg-white dark:bg-gray-800 border-b border-gray-200/60 dark:border-gray-700/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <p className="font-poppins text-base lg:text-lg font-medium text-gray-700 dark:text-gray-200 leading-tight tracking-tight">
            Hello, Guest 👋
          </p>
        </div>
      </div>

      {/* Same section structure as logged-in Account page */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-20 lg:pb-24 space-y-4 lg:space-y-6">
        {/* Guest profile card – same style as UserProfileCard */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-[0_2px_8px_0_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_0_rgba(0,0,0,0.3)] border border-gray-200/60 dark:border-gray-700/60 p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
              <User className="w-7 h-7 text-gray-500 dark:text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-poppins text-lg font-semibold text-gray-900 dark:text-white">Guest</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Sign in to see your profile, orders & rewards.</p>
              <button
                onClick={() => openAuthModal('/account')}
                className="mt-3 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium"
              >
                Sign in / Create account
              </button>
              <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">or</p>
              <button
                onClick={() => router.push('/')}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:underline"
              >
                Continue browsing
              </button>
            </div>
          </div>
        </div>

        {/* Appearance – same as logged-in (no auth required) */}
        <div id="appearance-section" className="relative">
          <AppearanceSection />
        </div>

        {/* Account Menu – guest: any click prompts sign in */}
        <div className="relative">
          <AccountMenuSection
            isGuest
            onSignInClick={() => openAuthModal('/account')}
            onLogout={() => {}}
          />
        </div>
      </div>

      <MobileFooter />
    </div>
  );
}

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

  const handleDeleteAccount = () => {
    router.push('/privacy');
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
      
      {/* Sticky bar: Back to Profile when in a section, else greeting */}
      <div className="sticky top-[3.6rem] lg:top-16 z-40 bg-white dark:bg-gray-800 border-b border-gray-200/60 dark:border-gray-700/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          {activeSection === 'orders' || activeSection === 'coupons' || activeSection === 'faqs' || activeSection === 'reviews' ? (
            <button
              onClick={() => setActiveSection(null)}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors font-inter text-sm font-medium"
            >
              <span className="text-xl">←</span>
              <span>Back to Profile</span>
            </button>
          ) : (
            <p className="font-poppins text-base lg:text-lg font-medium text-gray-700 dark:text-gray-200 leading-tight tracking-tight">
              Hello, {customer?.name || 'User'} 👋
            </p>
          )}
        </div>
      </div>

      {/* Mobile Layout - New Design */}
      <div className="lg:hidden">
        {activeSection === 'orders' || activeSection === 'coupons' || activeSection === 'faqs' || activeSection === 'reviews' ? (
          // Show section content when active (Back to Profile is in sticky bar above)
          <div className="max-w-7xl mx-auto px-4 pt-4 pb-24">
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
            <div id="appearance-section" className="relative">
              <AppearanceSection />
            </div>

            {/* Account Menu (Orders, Wallet, Coupons, Addresses, Wishlist, Activity, Refer & Earn, Help, Settings) */}
            <div className="relative">
              <AccountMenuSection
                badgeCounts={badgeCounts}
                onSectionChange={handleSectionChange}
                onNavigateToFAQs={handleNavigateToFAQs}
                onLogout={handleLogout}
                onDeleteAccount={handleDeleteAccount}
              />
            </div>
          </div>
        )}
      </div>

      {/* Desktop/Laptop Layout - New Design */}
      <div className="hidden lg:block">
        {activeSection === 'orders' || activeSection === 'coupons' || activeSection === 'faqs' || activeSection === 'reviews' ? (
          // Show section content when active (Back to Profile is in sticky bar above)
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-6">
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

                {/* Account Menu (Orders, Wallet, Coupons, Addresses, Wishlist, Activity, Refer & Earn, Help, Settings) */}
                <div className="relative">
                  <AccountMenuSection
                    badgeCounts={badgeCounts}
                    onSectionChange={handleSectionChange}
                    onNavigateToFAQs={handleNavigateToFAQs}
                    onLogout={handleLogout}
                    onDeleteAccount={handleDeleteAccount}
                  />
                </div>
              </div>

              {/* Right Column - Sidebar Sections */}
              <div className="lg:col-span-1 space-y-6">
                {/* Appearance Mode Section */}
                <div id="appearance-section" className="relative">
                  <AppearanceSection />
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
  const { isAuthenticated, isLoading } = useCustomerAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <GuestAccountView />;
  }

  return <AccountPageContent />;
}

