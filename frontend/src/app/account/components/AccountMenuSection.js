'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import {
  Package,
  ShoppingBag,
  Truck,
  FileText,
  RotateCcw,
  Wallet,
  History,
  Award,
  Tag,
  Bookmark,
  Sparkles,
  MapPin,
  Heart,
  Palette,
  Star,
  MessageCircle,
  Ticket,
  MessageSquare,
  Users,
  Gift,
  HelpCircle,
  RefreshCw,
  Settings,
  Bell,
  Globe,
  Trash2,
  LogOut,
} from 'lucide-react';
import { accountMenuGroups } from '../config/accountMenuConfig';

const iconMap = {
  Package,
  ShoppingBag,
  Truck,
  FileText,
  RotateCcw,
  Wallet,
  History,
  Award,
  Tag,
  Bookmark,
  Sparkles,
  MapPin,
  Heart,
  Palette,
  Star,
  MessageCircle,
  Ticket,
  MessageSquare,
  Users,
  Gift,
  HelpCircle,
  RefreshCw,
  Settings,
  Bell,
  Globe,
  Trash2,
  LogOut,
};

function getIcon(name) {
  return iconMap[name] || FileText;
}

export default function AccountMenuSection({
  badgeCounts = {},
  onSectionChange,
  onNavigateToFAQs,
  onLogout,
  onDeleteAccount,
  isGuest = false,
  onSignInClick,
}) {
  const router = useRouter();

  const handleItemClick = (item) => {
    if (isGuest && onSignInClick) {
      onSignInClick();
      return;
    }
    if (item.action === 'logout') {
      onLogout?.();
      return;
    }
    if (item.action === 'deleteAccount') {
      onDeleteAccount?.();
      return;
    }
    if (item.href?.startsWith('#')) {
      const section = item.href.slice(1);
      if (section === 'appearance') {
        const el = document.getElementById('appearance-section');
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      if (section === 'faqs' && onNavigateToFAQs) {
        onNavigateToFAQs();
      } else {
        onSectionChange?.(section);
      }
      return;
    }
    if (item.href) {
      router.push(item.href);
    }
  };

  return (
    <div className="space-y-4">
      {accountMenuGroups.map((group) => {
        const GroupIcon = getIcon(group.icon);
        return (
          <div
            key={group.id}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-[0_2px_8px_0_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_0_rgba(0,0,0,0.3)] border border-gray-200/60 dark:border-gray-700/60 overflow-hidden"
          >
            <div className="px-4 pt-3 pb-2 border-b border-gray-200/60 dark:border-gray-700/60 flex items-center gap-2">
              <GroupIcon className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0" strokeWidth={2} />
              <h3 className="font-poppins text-base font-semibold text-gray-900 dark:text-white leading-tight tracking-tight">
                {group.title}
              </h3>
            </div>
            {group.items.map((item, index) => {
              const Icon = getIcon(item.icon);
              const isLast = index === group.items.length - 1;
              const isLogout = item.action === 'logout';
              const isDeleteAccount = item.action === 'deleteAccount';
              const isDanger = isLogout || isDeleteAccount;
              const badge = item.badgeKey ? badgeCounts[item.badgeKey] : null;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleItemClick(item)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 lg:py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 active:bg-gray-100 dark:active:bg-gray-700 relative ${
                    isDanger ? 'border-l-4 border-red-500 dark:border-red-600' : ''
                  } ${isGuest ? 'opacity-90' : ''}`}
                >
                  {!isLast && (
                    <div className="absolute bottom-0 left-4 right-4 h-px bg-gray-200 dark:bg-gray-700" />
                  )}
                  <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                    <Icon
                      className={`w-5 h-5 ${isDanger ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}
                      strokeWidth={2}
                    />
                  </div>
                  <span
                    className={`flex-1 text-left font-inter text-sm font-medium leading-relaxed ${
                      isDanger ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    {item.label}
                  </span>
                  {badge != null && badge > 0 && (
                    <span className="flex-shrink-0 px-2 py-0.5 bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300 rounded-full text-xs font-semibold">
                      {badge}
                    </span>
                  )}
                  {!isGuest && (
                    <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                      <ChevronRight
                        className={`w-5 h-5 ${isDanger ? 'text-red-400 dark:text-red-500' : 'text-gray-400 dark:text-gray-500'}`}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
