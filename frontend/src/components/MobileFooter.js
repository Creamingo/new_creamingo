'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Home, Wallet, ShoppingCart, Headphones, Heart, MessageSquare, Phone, Ticket, ClipboardList, User, Star, Bell } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { useWishlist } from '../contexts/WishlistContext'
import { useNotifications } from '../contexts/NotificationContext'
import { useCustomerAuth } from '../contexts/CustomerAuthContext'
import { useAuthModal } from '../contexts/AuthModalContext'
import CartDisplay from './CartDisplay'

const MobileFooter = ({ walletAmount = 0, wishlistCount: propWishlistCount = 0 }) => {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('home')
  const [isHelpExpanded, setIsHelpExpanded] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { getItemCount } = useCart()
  const { wishlistCount: contextWishlistCount, isInitialized: wishlistInitialized } = useWishlist()
  const { unreadCount: notificationCount, openNotificationCenter } = useNotifications()
  const { isAuthenticated } = useCustomerAuth()
  const { isAuthModalOpen, openAuthModal } = useAuthModal()
  const [cartItemCount, setCartItemCount] = useState(0)
  
  // Use context wishlist count if available, otherwise use prop (for backwards compatibility)
  const wishlistCount = wishlistInitialized ? contextWishlistCount : propWishlistCount

  // Handle client-side only cart count to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
    setCartItemCount(getItemCount())
  }, [])

  // Update cart count when it changes (but only after mounting)
  useEffect(() => {
    if (mounted) {
      setCartItemCount(getItemCount())
    }
  }, [getItemCount, mounted])
  
  // Subscribe to cart context updates
  useEffect(() => {
    if (!mounted) return
    
    const interval = setInterval(() => {
      const currentCount = getItemCount()
      if (currentCount !== cartItemCount) {
        setCartItemCount(currentCount)
      }
    }, 500)
    
    return () => clearInterval(interval)
  }, [mounted, cartItemCount, getItemCount])

  const helpOptions = [
    { 
      icon: Phone, 
      label: 'Call', 
      action: () => window.open('tel:+91-22-4343-3333', '_blank')
    },
    { 
      icon: MessageSquare, 
      label: 'WhatsApp', 
      action: () => window.open('https://wa.me/919876543210', '_blank')
    },
    { 
      icon: Ticket, 
      label: 'Raise Ticket', 
      action: () => window.open('/support/ticket', '_blank')
    }
  ]

  const footerItems = [
    { icon: Home, label: 'Home', href: '/', id: 'home' },
    { icon: Star, label: 'Midnight Wish', href: '/midnight-wish', id: 'midnight-wish', desktopOnly: true },
    { icon: ClipboardList, label: 'Orders', href: '/orders', id: 'orders', desktopOnly: true },
    { 
      icon: Heart, 
      label: 'Wishlist', 
      href: '/wishlist', 
      badge: mounted && wishlistInitialized ? wishlistCount : 0,
      id: 'wishlist'
    },
    { 
      icon: ShoppingCart, 
      label: 'Cart', 
      href: '/cart', 
      badge: mounted ? cartItemCount : 0,
      id: 'cart'
    },
    { 
      icon: Wallet, 
      label: 'Wallet', 
      href: '/wallet', 
      badge: notificationCount > 0 ? notificationCount : undefined,
      id: 'wallet'
    },
    { icon: User, label: 'Account', href: '/account', id: 'account', desktopOnly: true },
    { icon: Headphones, label: 'Help', href: '#', id: 'help', isHelp: true }
  ]

  const handleTabClick = (tabId, href) => {
    if (tabId === 'help') {
      setIsHelpExpanded(!isHelpExpanded)
      setActiveTab('help')
    } else if (tabId === 'account') {
      if (!isAuthenticated) {
        openAuthModal('/account')
        return
      }
      router.push('/account')
      setIsHelpExpanded(false)
      setActiveTab('account')
    } else if (tabId === 'cart') {
      // Navigate to cart page instead of opening modal
      router.push('/cart')
      setIsHelpExpanded(false)
      setActiveTab('cart')
    } else if (href && href !== '#') {
      // Navigate to the href if it exists and is not a placeholder
      router.push(href)
      setIsHelpExpanded(false)
      setActiveTab(tabId)
    } else {
      setIsHelpExpanded(false)
      setActiveTab(tabId)
    }
  }

  // Hide sticky footer when Login/Sign up modal is open so the layout feels connected
  if (isAuthModalOpen) {
    return (
      <CartDisplay
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
    )
  }

  return (
    <>
      {/* Expandable Help Menu */}
      {isHelpExpanded && (
        <div className="fixed bottom-[4.5rem] right-4 z-40">
          <div className="flex flex-col space-y-2 mb-4">
            {helpOptions.map((option, index) => (
              <button
                key={index}
                onClick={option.action}
                className="bg-pink-100 dark:bg-pink-900/30 hover:bg-pink-200 dark:hover:bg-pink-900/50 text-pink-700 dark:text-pink-300 p-3 rounded-xl shadow-md dark:shadow-lg dark:shadow-black/20 hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 min-w-[110px] border border-pink-200 dark:border-pink-700/50"
              >
                <option.icon className="w-4 h-4" />
                <span className="font-inter text-xs font-medium whitespace-nowrap">
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <footer
        className="fixed bottom-0 left-0 right-0 w-full z-50 h-[3.6rem] max-w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-t-2xl shadow-lg dark:shadow-xl dark:shadow-black/20 border border-white/20 dark:border-gray-700/50 border-t-2 border-t-pink-200 dark:border-t-pink-700"
      >
        <div className="flex items-center justify-around h-full px-2 gap-1">
          {footerItems.map((item, index) => {
            const isActive = activeTab === item.id
            return (
              <button
                key={index}
                onClick={() => handleTabClick(item.id, item.href)}
                className={`flex flex-col items-center justify-center p-1 rounded-xl transition-all duration-300 group relative min-w-[52px] px-2 ${
                  isActive 
                    ? 'bg-pink-500/20 dark:bg-pink-500/30 backdrop-blur-sm text-pink-600 dark:text-pink-400 scale-110 shadow-sm' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-pink-500 dark:hover:text-pink-400 hover:scale-105 hover:bg-white/30 dark:hover:bg-gray-700/30'
                } ${item.desktopOnly ? 'hidden lg:flex' : 'flex'}`}
              >
                <div className="relative flex items-center justify-center">
                  <item.icon className={`w-[22px] h-[22px] transition-all duration-300 flex-shrink-0 ${
                    isActive ? 'text-pink-600 dark:text-pink-400' : 'text-gray-600 dark:text-gray-300 group-hover:text-pink-500 dark:group-hover:text-pink-400'
                  }`} />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`absolute -top-1.5 -right-1.5 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-inter font-semibold transition-all duration-300 shadow-sm ${
                      isActive ? 'bg-pink-600' : 'bg-red-500'
                    }`} suppressHydrationWarning>
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
                <span className={`font-inter text-xs mt-0.5 font-medium transition-all duration-300 ${
                  isActive ? 'text-pink-600 dark:text-pink-400' : 'text-gray-600 dark:text-gray-300 group-hover:text-pink-500 dark:group-hover:text-pink-400'
                }`}>
                  {item.label}
                </span>
                
                {/* Active indicator dot */}
                {isActive && (
                  <div className="absolute -bottom-1 w-1 h-1 bg-pink-600 rounded-full"></div>
                )}
              </button>
            )
          })}
        </div>
      </footer>
      
      {/* Cart Display Modal */}
      <CartDisplay
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
    </>
  )
}

export default MobileFooter
