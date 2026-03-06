'use client';

import { useRouter } from 'next/navigation';
import { Star, FileText, MessageSquare, ChevronRight } from 'lucide-react';

export default function MyActivitiesSection({ badgeCounts = {} }) {
  const router = useRouter();

  const activities = [
    {
      id: 'reviews',
      icon: Star,
      label: 'Reviews',
      color: 'from-purple-500 to-violet-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      hoverBg: 'hover:bg-purple-100',
      href: '#reviews',
      badge: badgeCounts.reviews
    },
    {
      id: 'raise-ticket',
      icon: FileText,
      label: 'Raise Ticket',
      color: 'from-red-500 to-rose-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-300',
      hoverBg: 'hover:bg-red-100',
      href: '/support',
      badge: null,
      isHighlighted: true
    },
    {
      id: 'share-feedback',
      icon: MessageSquare,
      label: 'Share Feedback',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      hoverBg: 'hover:bg-blue-100',
      href: '/feedback',
      badge: null
    }
  ];

  const handleClick = (activity) => {
    if (activity.href.startsWith('#')) {
      const section = activity.href.substring(1);
      window.dispatchEvent(new CustomEvent('account-section-change', { detail: section }));
    } else {
      router.push(activity.href);
    }
  };

  return (
    <div>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-[0_2px_8px_0_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_0_rgba(0,0,0,0.3)] border border-gray-200/60 dark:border-gray-700/60 overflow-hidden">
        {/* Heading inside box */}
        <div className="px-4 pt-4 pb-3 border-b border-gray-200/60 dark:border-gray-700/60">
          <h3 className="font-poppins text-base font-semibold text-gray-900 dark:text-white leading-tight tracking-tight">
            My Activities
          </h3>
        </div>
        {activities.map((activity, index) => {
          const Icon = activity.icon;
          const isLast = index === activities.length - 1;
          return (
            <button
              key={activity.id}
              onClick={() => handleClick(activity)}
              className={`w-full flex items-center gap-3 px-4 py-5 lg:py-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 active:bg-gray-100 dark:active:bg-gray-700 relative ${
                activity.isHighlighted ? 'border-l-4 border-red-500 dark:border-red-600' : ''
              }`}
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
                {activity.label}
              </span>
              
              {/* Badge */}
              {activity.badge && (
                <span className="flex-shrink-0 px-2 py-0.5 bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300 rounded-full text-xs font-semibold">
                  {activity.badge}
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

