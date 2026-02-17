import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Image,
  FolderOpen,
  Package,
  Layers,
  TrendingUp,
  ShoppingCart,
  Users,
  UserCog,
  CreditCard,
  Settings,
  Truck,
  MapPin,
  Clock,
  X,
  ShoppingBag,
  Tag,
  ChefHat,
  Gift,
  User,
  LifeBuoy,
  LogOut,
  MessageCircle,
  BarChart3
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../contexts/AuthContext';
import { canSeeMenuItem, getRoleDisplayName } from '../../utils/permissions';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

// Full admin/staff navigation
const BASE_NAVIGATION: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Banners', href: '/banners', icon: Image },
  { name: 'Categories', href: '/categories', icon: FolderOpen },
  { name: 'Subcategories', href: '/subcategories', icon: Layers },
  { name: 'Featured Products', href: '/featured-products', icon: TrendingUp },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Product Add-Ons', href: '/product-add-ons', icon: ShoppingBag },
  { name: 'Collections', href: '/collections', icon: Layers },
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Bakery Production', href: '/bakery-production', icon: ChefHat },
  { name: 'Delivery', href: '/delivery', icon: Truck },
  { name: 'Delivery Settings', href: '/delivery-settings', icon: MapPin },
  { name: 'Delivery Slots', href: '/delivery-slots', icon: Clock },
  { name: 'Promo Codes', href: '/promo-codes', icon: Tag },
  { name: '₹1 Deals', href: '/one-rupee-deals', icon: Gift },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Payments', href: '/payments', icon: CreditCard },
  { name: 'Manage Users', href: '/users', icon: UserCog },
  { name: 'Chatbot Answers', href: '/chatbot-answers', icon: MessageCircle },
  { name: 'Chat Analytics', href: '/chat-analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isDeliveryBoy = user?.role === 'delivery_boy';

  // Dedicated, minimal navigation for delivery boys
  const DELIVERY_NAVIGATION: NavItem[] = [
    { name: 'My Deliveries', href: '/delivery', icon: Truck },
    { name: 'Order History', href: '/delivery?section=history', icon: Clock },
    { name: 'Wallet', href: '/delivery?section=wallet', icon: CreditCard },
    { name: 'Profile', href: '/delivery?section=profile', icon: User },
    { name: 'Help', href: '/delivery?section=help', icon: LifeBuoy },
    { name: 'Logout', href: '#logout', icon: LogOut }
  ];

  const navigation = isDeliveryBoy ? DELIVERY_NAVIGATION : BASE_NAVIGATION;

  const roleLabel = user ? getRoleDisplayName(user.role) : 'Admin';

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-56 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:flex lg:flex-col lg:h-full lg:flex-shrink-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-14 lg:h-14 px-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">C</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">Creamingo</h1>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                {roleLabel}
              </p>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
          >
            <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const menuKey = item.name.toLowerCase().replace(/\s+/g, '');

            // Determine active state (special handling for delivery boy sections)
            let isActive = false;
            if (isDeliveryBoy) {
              const params = new URLSearchParams(location.search);
              const section = params.get('section') || 'my-deliveries';
              switch (item.name) {
                case 'My Deliveries':
                  isActive = section === 'my-deliveries' || !section;
                  break;
                case 'Order History':
                  isActive = section === 'history';
                  break;
                case 'Wallet':
                  isActive = section === 'wallet';
                  break;
                case 'Profile':
                  isActive = section === 'profile';
                  break;
                case 'Help':
                  isActive = section === 'help';
                  break;
                default:
                  isActive = false;
              }
            } else {
              isActive = location.pathname === item.href;
            }
            
            // Check if user can see this menu item (admin/staff menus)
            if (!isDeliveryBoy && !canSeeMenuItem(user, menuKey)) {
              return null;
            }
            
            return (
              <button
                key={item.name}
                onClick={() => {
                  if (isDeliveryBoy && item.name === 'Logout') {
                    logout();
                    if (window.innerWidth < 1024) {
                      onToggle();
                    }
                    return;
                  }

                  navigate(item.href);
                  // Close mobile sidebar after navigation
                  if (window.innerWidth < 1024) {
                    onToggle();
                  }
                }}
                className={cn(
                  'w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700',
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border-r-2 border-primary-500'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1 text-left truncate">{item.name}</span>
                {item.badge && (
                  <span className="bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5 min-w-[18px] text-center flex-shrink-0">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

      </div>
    </>
  );
};
