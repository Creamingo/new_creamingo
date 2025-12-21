'use client';

import { useRouter } from 'next/navigation';
import { ShoppingBag, Tag, Wallet, ChevronRight } from 'lucide-react';

export default function OrderHistoryCouponsSection({ badgeCounts = {} }) {
  const router = useRouter();

  const items = [
    {
      id: 'orders',
      icon: ShoppingBag,
      label: 'Orders',
      color: 'from-blue-500 to-indigo-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      hoverBg: 'hover:bg-blue-100',
      href: '#orders',
      badge: badgeCounts.orders
    },
    {
      id: 'coupons',
      icon: Tag,
      label: 'Coupons',
      color: 'from-orange-500 to-amber-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      hoverBg: 'hover:bg-orange-100',
      href: '#coupons',
      badge: badgeCounts.coupons
    },
    {
      id: 'collected-coupons',
      icon: Wallet,
      label: 'Collected Coupons',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      hoverBg: 'hover:bg-green-100',
      href: '#coupons',
      badge: null
    }
  ];

  const handleClick = (item) => {
    if (item.href.startsWith('#')) {
      // Scroll to section or trigger section change
      const section = item.href.substring(1);
      if (section === 'orders' || section === 'coupons') {
        // Trigger section change via custom event or state management
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
            Order History & Coupons
          </h3>
        </div>
        {items.map((item, index) => {
          const Icon = item.icon;
          const isLast = index === items.length - 1;
          return (
            <button
              key={item.id}
              onClick={() => handleClick(item)}
              className="w-full flex items-center gap-3 px-4 py-5 lg:py-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 active:bg-gray-100 dark:active:bg-gray-700 relative"
            >
              {/* Separator Line */}
              {!isLast && (
                <div className="absolute bottom-0 left-4 right-4 h-px bg-gray-200 dark:bg-gray-700" />
              )}
              
              {/* Icon */}
              <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                <Icon className="w-5 h-5 text-gray-700 dark:text-gray-300" strokeWidth={2} />
              </div>
              
              {/* Label */}
              <span className="flex-1 text-left font-inter text-sm font-medium text-gray-900 dark:text-gray-100 leading-relaxed">
                {item.label}
              </span>
              
              {/* Badge */}
              {item.badge && (
                <span className="flex-shrink-0 px-2 py-0.5 bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300 rounded-full text-xs font-semibold">
                  {item.badge}
                </span>
              )}
              
              {/* Arrow */}
              <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

