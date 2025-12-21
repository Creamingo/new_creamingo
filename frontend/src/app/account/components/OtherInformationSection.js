'use client';

import { useRouter } from 'next/navigation';
import { HelpCircle, Gift, Star, LogOut, ChevronRight } from 'lucide-react';

export default function OtherInformationSection({ onNavigateToFAQs, onLogout }) {
  const router = useRouter();

  const items = [
    {
      id: 'browse-faqs',
      icon: HelpCircle,
      label: 'Browse FAQs',
      href: '#faqs'
    },
    {
      id: 'order-rewards',
      icon: Gift,
      label: 'Order Rewards',
      href: '/rewards'
    },
    {
      id: 'rate-app',
      icon: Star,
      label: 'Rate App',
      href: '/rate-app'
    },
    {
      id: 'logout',
      icon: LogOut,
      label: 'Logout',
      href: '#logout',
      isLogout: true
    }
  ];

  const handleClick = (item) => {
    if (item.isLogout) {
      // Handle logout
      if (onLogout) {
        onLogout();
      }
    } else if (item.href.startsWith('#')) {
      const section = item.href.substring(1);
      if (section === 'faqs' && onNavigateToFAQs) {
        onNavigateToFAQs();
      } else {
        window.dispatchEvent(new CustomEvent('account-section-change', { detail: section }));
      }
    } else {
      router.push(item.href);
    }
  };

  return (
    <div>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-[0_2px_8px_0_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_0_rgba(0,0,0,0.3)] border border-gray-200/60 dark:border-gray-700/60 overflow-hidden">
        {/* Heading inside box */}
        <div className="px-4 pt-4 pb-3 border-b border-gray-200/60 dark:border-gray-700/60">
          <h3 className="font-poppins text-base font-semibold text-gray-900 dark:text-white leading-tight tracking-tight">
            Other Information
          </h3>
        </div>
        {items.map((item, index) => {
          const Icon = item.icon;
          const isLast = index === items.length - 1;
          return (
            <button
              key={item.id}
              onClick={() => handleClick(item)}
              className={`w-full flex items-center gap-3 px-4 py-5 lg:py-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 active:bg-gray-100 dark:active:bg-gray-700 relative ${
                item.isLogout ? 'border-l-4 border-red-500 dark:border-red-600' : ''
              }`}
            >
              {/* Separator Line */}
              {!isLast && (
                <div className="absolute bottom-0 left-4 right-4 h-px bg-gray-200 dark:bg-gray-700" />
              )}
              
              {/* Icon */}
              <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                <Icon className={`w-5 h-5 ${item.isLogout ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`} strokeWidth={2} />
              </div>
              
              {/* Label */}
              <span className={`flex-1 text-left font-inter text-sm font-medium leading-relaxed ${
                item.isLogout ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'
              }`}>
                {item.label}
              </span>
              
              {/* Arrow */}
              <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                <ChevronRight className={`w-5 h-5 ${item.isLogout ? 'text-red-400 dark:text-red-500' : 'text-gray-400 dark:text-gray-500'}`} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

