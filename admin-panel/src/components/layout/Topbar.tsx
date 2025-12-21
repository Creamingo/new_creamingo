import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, Sun, Moon, User, LogOut, Settings, Package, Truck, CreditCard, ShoppingCart, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import notificationService, { AdminNotification, NotificationModule } from '../../services/notificationService';

interface TopbarProps {
  onMenuClick: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuClick }) => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsKey, setNotificationsKey] = useState(0); // Force re-render when notifications change
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const isDeliveryBoy = user?.role === 'delivery_boy';

  // Get current module from pathname for context-aware notifications
  const getCurrentModule = useCallback((): NotificationModule => {
    const path = location.pathname;
    if (path.startsWith('/orders') || path === '/') return 'orders';
    if (path.startsWith('/delivery')) return 'delivery';
    if (path.startsWith('/payments')) return 'payments';
    if (path.startsWith('/products')) return 'products';
    if (path.startsWith('/customers')) return 'customers';
    if (path.startsWith('/promo-codes')) return 'promo_codes';
    if (path.startsWith('/one-rupee-deals')) return 'deals';
    return 'all';
  }, [location.pathname]);

  // Get notifications - context-aware and role-aware
  const getNotifications = useCallback((): AdminNotification[] => {
    if (isDeliveryBoy) {
      // Delivery boy notifications - check localStorage for recent activity
      const recentNotifications = JSON.parse(
        localStorage.getItem('deliveryBoyNotifications') || '[]'
      ) as Array<{
        id: string;
        title: string;
        message: string;
        time: string;
        unread: boolean;
        timestamp: number;
      }>;

      // Filter out notifications older than 24 hours
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const validNotifications = recentNotifications.filter(
        (n) => n.timestamp > oneDayAgo
      );

      // If no recent notifications, show default delivery-focused ones
      if (validNotifications.length === 0) {
        return [
          {
            id: 'delivery-1',
            type: 'delivery_assigned' as const,
            title: 'Welcome to My Deliveries',
            message: 'Check your active orders and start delivering!',
            time: 'Just now',
            timestamp: Date.now(),
            unread: false,
            module: 'delivery' as const,
          },
        ];
      }

      // Sort by timestamp (newest first) and format time
      return validNotifications
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10)
        .map((n): AdminNotification => ({
          id: n.id,
          type: 'delivery_assigned',
          title: n.title,
          message: n.message,
          time: n.time,
          timestamp: n.timestamp,
          unread: n.unread,
          module: 'delivery',
        }));
    } else {
      // Admin/staff notifications - context-aware
      const currentModule = getCurrentModule();
      
      // Get notifications for current module, but also show important ones from other modules
      const moduleNotifications = notificationService.getNotifications({
        module: currentModule,
        limit: 5,
      });
      
      // Get important notifications from other modules (unread only)
      const otherNotifications = currentModule !== 'all' 
        ? notificationService.getNotifications({
            unreadOnly: true,
            limit: 3,
          }).filter(n => n.module !== currentModule && n.unread)
        : [];

      // Combine and sort by timestamp
      const allNotifications = [...moduleNotifications, ...otherNotifications]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10);

      return allNotifications;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDeliveryBoy, getCurrentModule, notificationsKey]); // notificationsKey is intentionally included to trigger re-renders

  // Refresh notifications when they change
  useEffect(() => {
    const handleNotificationUpdate = () => {
      setNotificationsKey((prev) => prev + 1);
    };
    
    // Listen for storage events (from other tabs/windows)
    window.addEventListener('storage', handleNotificationUpdate);
    
    // Listen for custom events (from same tab)
    window.addEventListener('adminNotificationUpdate', handleNotificationUpdate);
    window.addEventListener('deliveryNotificationUpdate', handleNotificationUpdate);
    
    // Poll for updates every 30 seconds
    const interval = setInterval(() => {
      setNotificationsKey((prev) => prev + 1);
    }, 30000);
    
    return () => {
      window.removeEventListener('storage', handleNotificationUpdate);
      window.removeEventListener('adminNotificationUpdate', handleNotificationUpdate);
      window.removeEventListener('deliveryNotificationUpdate', handleNotificationUpdate);
      clearInterval(interval);
    };
  }, []);

  const notifications = getNotifications();
  const currentModule = getCurrentModule();
  const unreadCount = isDeliveryBoy
    ? notifications.filter((n) => n.unread).length
    : notificationService.getUnreadCount(currentModule === 'all' ? undefined : currentModule);

  return (
    <header className="h-14 sm:h-16 lg:h-14 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 dark:from-amber-600 dark:via-orange-600 dark:to-amber-600 border-b border-amber-400/30 dark:border-amber-700/30 flex items-center justify-between px-3 sm:px-4 md:px-6 lg:px-3 z-50 flex-shrink-0 fixed top-0 left-0 lg:left-56 right-0 shadow-md lg:bg-white lg:dark:bg-gray-800 lg:border-gray-200 lg:dark:border-gray-700 lg:shadow-none backdrop-blur-sm bg-opacity-100">
      {/* Left side */}
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-white/20 dark:hover:bg-white/10 active:bg-white/30 dark:active:bg-white/20 transition-all duration-200 flex items-center justify-center flex-shrink-0"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5 text-white" />
        </button>

        {/* Logo/Brand - Mobile */}
        <div className="flex items-center gap-2.5 lg:hidden flex-shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg border border-white/30">
            <span className="text-white font-bold text-base sm:text-lg">C</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-bold text-white leading-tight">Creamingo</span>
            <span className="text-[10px] sm:text-xs font-medium text-white/90 leading-tight">Admin</span>
          </div>
        </div>

        {/* Search - Desktop */}
        <div className="relative hidden md:block flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200"
          />
        </div>

        {/* Search Button - Mobile */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-white/20 dark:hover:bg-white/10 active:bg-white/30 dark:active:bg-white/20 transition-all duration-200 flex items-center justify-center flex-shrink-0 ml-auto"
          aria-label="Search"
        >
          <Search className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3 flex-shrink-0">
        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg hover:bg-white/20 dark:hover:bg-white/10 active:bg-white/30 dark:active:bg-white/20 lg:hover:bg-gray-100 lg:dark:hover:bg-gray-700 lg:active:bg-gray-200 lg:dark:active:bg-gray-600 transition-all duration-200 flex items-center justify-center"
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? (
            <Sun className="h-5 w-5 text-white lg:text-gray-600 lg:dark:text-gray-300" />
          ) : (
            <Moon className="h-5 w-5 text-white lg:text-gray-600 lg:dark:text-gray-300" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg hover:bg-white/20 dark:hover:bg-white/10 active:bg-white/30 dark:active:bg-white/20 lg:hover:bg-gray-100 lg:dark:hover:bg-gray-700 lg:active:bg-gray-200 lg:dark:active:bg-gray-600 transition-all duration-200 flex items-center justify-center"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5 text-white lg:text-gray-600 lg:dark:text-gray-300" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold shadow-sm border-2 border-white lg:border-white dark:lg:border-gray-800">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications dropdown */}
          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40 md:hidden" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] sm:w-80 max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-soft-lg border border-gray-200 dark:border-gray-700 z-50" style={{ right: '0.75rem', left: 'auto', maxWidth: 'min(calc(100vw - 1.5rem), 20rem)' }}>
                <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
                </div>
                <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {isDeliveryBoy ? 'No new notifications' : 'No notifications'}
                      </p>
                    </div>
                  ) : (
                    notifications.map((notification) => {
                      const handleMarkAsRead = () => {
                        if (isDeliveryBoy) {
                          if (!notification.unread) return;
                          try {
                            const existing = JSON.parse(
                              localStorage.getItem('deliveryBoyNotifications') || '[]'
                            ) as Array<{
                              id: string;
                              title: string;
                              message: string;
                              time: string;
                              unread: boolean;
                              timestamp: number;
                            }>;
                            
                            const updated = existing.map((n) =>
                              n.id === notification.id ? { ...n, unread: false } : n
                            );
                            localStorage.setItem('deliveryBoyNotifications', JSON.stringify(updated));
                            window.dispatchEvent(new Event('deliveryNotificationUpdate'));
                            setNotificationsKey((prev) => prev + 1);
                          } catch (error) {
                            console.error('Error marking notification as read:', error);
                          }
                        } else {
                          notificationService.markAsRead(notification.id);
                          setNotificationsKey((prev) => prev + 1);
                        }
                      };

                      const handleClick = () => {
                        handleMarkAsRead();
                        if (notification.link && !isDeliveryBoy) {
                          navigate(notification.link);
                          setShowNotifications(false);
                        }
                      };

                      // Get icon for notification type
                      const getNotificationIcon = () => {
                        if (isDeliveryBoy) return <Truck className="h-4 w-4" />;
                        switch (notification.type) {
                          case 'order_new':
                          case 'order_status_changed':
                          case 'order_cancelled':
                            return <ShoppingCart className="h-4 w-4" />;
                          case 'payment_received':
                          case 'payment_failed':
                            return <CreditCard className="h-4 w-4" />;
                          case 'delivery_assigned':
                          case 'delivery_status_changed':
                          case 'delivery_completed':
                            return <Truck className="h-4 w-4" />;
                          case 'low_stock':
                          case 'product_added':
                          case 'product_updated':
                            return <Package className="h-4 w-4" />;
                          case 'system_alert':
                            return <AlertTriangle className="h-4 w-4" />;
                          default:
                            return <Bell className="h-4 w-4" />;
                        }
                      };

                      // Get color for notification type
                      const getNotificationColor = () => {
                        switch (notification.type) {
                          case 'order_new':
                            return 'text-blue-500';
                          case 'payment_received':
                            return 'text-green-500';
                          case 'delivery_assigned':
                          case 'delivery_completed':
                            return 'text-purple-500';
                          case 'low_stock':
                          case 'order_cancelled':
                          case 'payment_failed':
                            return 'text-red-500';
                          case 'system_alert':
                            return 'text-orange-500';
                          default:
                            return 'text-gray-500';
                        }
                      };
                      
                      return (
                        <div
                          key={notification.id}
                          onClick={handleClick}
                          className={cn(
                            'p-3 sm:p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
                            notification.link && !isDeliveryBoy ? 'cursor-pointer' : 'cursor-default',
                            notification.unread && 'bg-primary-50/30 dark:bg-primary-900/20'
                          )}
                        >
                          <div className="flex items-start gap-2 sm:gap-3">
                            <div className={cn(
                              'mt-0.5 flex-shrink-0',
                              getNotificationColor()
                            )}>
                              {getNotificationIcon()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {notification.title}
                                </p>
                                {notification.unread && (
                                  <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1" />
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
                                {notification.message}
                              </p>
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                                  {notification.time || 'Just now'}
                                </p>
                                {notification.module && !isDeliveryBoy && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                    {notification.module}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-xs sm:text-sm"
                      onClick={() => {
                        if (isDeliveryBoy) {
                          try {
                            const existing = JSON.parse(
                              localStorage.getItem('deliveryBoyNotifications') || '[]'
                            ) as Array<{
                              id: string;
                              title: string;
                              message: string;
                              time: string;
                              unread: boolean;
                              timestamp: number;
                            }>;
                            
                            const updated = existing.map((n) => ({ ...n, unread: false }));
                            localStorage.setItem('deliveryBoyNotifications', JSON.stringify(updated));
                            window.dispatchEvent(new Event('deliveryNotificationUpdate'));
                            setNotificationsKey((prev) => prev + 1);
                          } catch (error) {
                            console.error('Error marking all as read:', error);
                          }
                        } else {
                          notificationService.markAllAsRead(currentModule === 'all' ? undefined : currentModule);
                          setNotificationsKey((prev) => prev + 1);
                        }
                      }}
                    >
                      Mark all as read
                    </Button>
                    {!isDeliveryBoy && currentModule !== 'all' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs sm:text-sm"
                        onClick={() => {
                          navigate('/');
                          setShowNotifications(false);
                        }}
                      >
                        View all
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="flex items-center gap-2 md:gap-3 p-1.5 md:p-2 rounded-lg hover:bg-white/20 dark:hover:bg-white/10 active:bg-white/30 dark:active:bg-white/20 lg:hover:bg-gray-100 lg:dark:hover:bg-gray-700 lg:active:bg-gray-200 lg:dark:active:bg-gray-600 transition-all duration-200"
            aria-label="User menu"
          >
            <div className="w-8 h-8 bg-white/20 backdrop-blur-sm lg:bg-gradient-to-br lg:from-primary-500 lg:to-primary-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ring-2 ring-white/50 lg:ring-white dark:lg:ring-gray-800">
              <span className="text-white text-sm font-semibold">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </span>
            </div>
            <div className="hidden md:block text-left min-w-0">
              <p className="text-sm font-medium text-white lg:text-gray-900 lg:dark:text-gray-100 truncate">
                {user?.name || 'Admin User'}
              </p>
              <p className="text-xs text-white/80 lg:text-gray-500 lg:dark:text-gray-400 truncate">
                {user?.email || 'admin@creamingo.com'}
              </p>
            </div>
          </button>

          {/* Profile dropdown menu */}
          {showProfileDropdown && (
            <>
              <div className="fixed inset-0 z-40 md:hidden" onClick={() => setShowProfileDropdown(false)} />
              <div className="absolute right-0 mt-2 w-48 sm:w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-soft-lg border border-gray-200 dark:border-gray-700 z-50">
                {/* User info - Mobile */}
                <div className="md:hidden p-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-medium">
                        {user?.name?.charAt(0).toUpperCase() || 'A'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {user?.name || 'Admin User'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user?.email || 'admin@creamingo.com'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <User className="h-4 w-4" />
                    Profile
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <Settings className="h-4 w-4" />
                    Settings
                  </button>
                  <hr className="my-2 border-gray-200 dark:border-gray-700" />
                  <button 
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Click outside to close dropdowns - Desktop */}
      {(showProfileDropdown || showNotifications) && (
        <div
          className="hidden md:block fixed inset-0 z-40"
          onClick={() => {
            setShowProfileDropdown(false);
            setShowNotifications(false);
          }}
        />
      )}
    </header>
  );
};
