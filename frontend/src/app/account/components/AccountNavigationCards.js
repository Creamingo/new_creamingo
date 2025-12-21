'use client';

import { ShoppingBag, Tag, HelpCircle, Star } from 'lucide-react';

const navigationItems = [
  {
    id: 'orders',
    icon: ShoppingBag,
    title: 'Orders',
    color: 'from-blue-500 to-indigo-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    badge: null // Will be populated dynamically
  },
  {
    id: 'coupons',
    icon: Tag,
    title: 'Coupons',
    color: 'from-orange-500 to-amber-500',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    badge: null
  },
  {
    id: 'faqs',
    icon: HelpCircle,
    title: 'FAQs',
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    badge: null
  },
  {
    id: 'reviews',
    icon: Star,
    title: 'Reviews',
    color: 'from-purple-500 to-violet-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    badge: null
  }
];

export default function AccountNavigationCards({ activeSection, onSectionChange, badgeCounts = {} }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeSection === item.id;
        const badge = badgeCounts[item.id] || item.badge;

        return (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={`relative w-full bg-white rounded-lg p-1.5 lg:p-3 border-2 transition-all duration-300 shadow-sm active:scale-[0.98] hover:shadow-md ${
              isActive
                ? `${item.borderColor} shadow-md ${item.bgColor}`
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            {/* Active Background Color Effect */}
            {isActive && (
              <div className={`absolute inset-0 ${item.bgColor} opacity-100 transition-opacity duration-300 rounded-lg`} />
            )}

            {/* Badge */}
            {badge && (
              <span className={`absolute -top-1.5 -right-1.5 w-5 h-5 bg-gradient-to-r ${item.color} text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg ring-2 ring-white z-20`}>
                {badge}
              </span>
            )}

            {/* Layout: Icon on left, text on right */}
            <div className="flex items-center gap-2 lg:gap-3 relative z-10">
              {/* Icon - White/Neutral colored outline style */}
              <div className="w-8 h-8 lg:w-10 lg:h-10 flex-shrink-0 flex items-center justify-center">
                <Icon className={`w-[18px] h-[18px] lg:w-6 lg:h-6 transition-colors duration-200 ${
                  isActive ? 'text-gray-800' : 'text-gray-500'
                }`} strokeWidth={1.5} />
              </div>

              {/* Title */}
              <h3 className={`font-poppins text-xs lg:text-[15px] font-semibold text-left flex-1 leading-tight ${
                isActive ? 'text-gray-900' : 'text-gray-700'
              }`}>
                {item.title}
              </h3>
            </div>
          </button>
        );
      })}
    </div>
  );
}

