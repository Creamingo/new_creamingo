'use client'

import { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { 
  Search, 
  Truck, 
  Heart, 
  ShoppingCart, 
  Wallet, 
  User, 
  Menu, 
  X,
  MapPin,
  Navigation,
  Plus,
  Minus,
  ClipboardList,
  Star,
  Store,
  LogOut,
  LogIn,
  UserPlus,
  CheckCircle,
  AlertCircle,
  Loader2,
  ShoppingBag,
  Clock
} from 'lucide-react'
import { usePinCode } from '../contexts/PinCodeContext'
import { useCategoryMenu } from '../contexts/CategoryMenuContext'
import { useCart } from '../contexts/CartContext'
import { useCustomerAuth } from '../contexts/CustomerAuthContext'
import CartDisplay from './CartDisplay'
import categoryApi from '../api/categoryApi'
import productApi from '../api/productApi'
import { formatPrice } from '../utils/priceFormatter'
import logger from '../utils/logger'

const Header = () => {
  const router = useRouter()
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLocationOpen, setIsLocationOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchSuggestions, setSearchSuggestions] = useState([])
  const [autocompleteData, setAutocompleteData] = useState({ products: [], flavors: [], categories: [] })
  const [isSearchLoading, setIsSearchLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState([])
  const [pincode, setPincode] = useState('')
  const [isCartOpen, setIsCartOpen] = useState(false)
  const { getItemCount, duplicateDetected } = useCart()
  const [cartItemCount, setCartItemCount] = useState(0)
  const [mounted, setMounted] = useState(false)
  
  // Check if we're on PDP page
  const isOnPDP = pathname?.startsWith('/product/')
  
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
  const [categories, setCategories] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  const [recentlyExpandedCategory, setRecentlyExpandedCategory] = useState(null)
  const [isMenuClosing, setIsMenuClosing] = useState(false)
  
  // Ref to track scroll position for desktop menu to prevent auto-scroll issues
  const desktopMenuScrollRef = useRef(0)
  const isRestoringScrollRef = useRef(false)
  const menuCloseTimeoutRef = useRef(null)
  const wasMenuOpenRef = useRef(false)
  
  // Use CategoryMenu context
  const {
    isCategoryMenuOpen,
    expandedCategories,
    toggleCategoryMenu,
    closeCategoryMenu,
    toggleCategory,
    setExpandedCategories
  } = useCategoryMenu()

  // Use PinCode context
  const {
    currentPinCode,
    deliveryInfo,
    isChecking,
    error,
    isValidPinCode,
    tempPinCode,
    tempValidationStatus,
    tempDeliveryInfo,
    checkPinCode,
    clearPinCode,
    validatePinCodeDebounced,
    confirmTempPinCode,
    getFormattedDeliveryCharge,
    getDeliveryLocality,
    getTempFormattedDeliveryCharge,
    getTempDeliveryLocality,
    isDeliveryAvailable,
    formatPinCode
  } = usePinCode()

  // Handle scroll effect for sticky header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Open desktop location popup when PDP triggers a custom event
  useEffect(() => {
    const openDesktopLocation = () => setIsLocationOpen(true)
    if (typeof window !== 'undefined') {
      window.addEventListener('open-desktop-pincode-modal', openDesktopLocation)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('open-desktop-pincode-modal', openDesktopLocation)
      }
    }
  }, [])

  // Update local pincode state when context changes
  useEffect(() => {
    setPincode(currentPinCode)
  }, [currentPinCode])

  // Fetch categories from database on component mount
  useEffect(() => {
    fetchCategories()
    // Load recent searches from localStorage
    const savedSearches = localStorage.getItem('recentSearches')
    if (savedSearches) {
      try {
        setRecentSearches(JSON.parse(savedSearches))
      } catch (e) {
        console.error('Error loading recent searches:', e)
      }
    }
  }, [])

  // Get authentication state
  const { isAuthenticated, customer, logout } = useCustomerAuth()

  // Dynamic useful links based on authentication state
  const usefulLinks = isAuthenticated ? [
    { icon: User, label: 'Profile', href: '/profile' },
    { icon: ClipboardList, label: 'Order History', href: '/orders' },
    { icon: Star, label: 'Midnight Wish', href: '/midnight-wish' },
    { icon: Store, label: 'Become a Vendor', href: '/vendor' },
    { icon: LogOut, label: 'Logout', href: '#', isLogout: true }
  ] : [
    { icon: LogIn, label: 'Login', href: '/login' },
    { icon: UserPlus, label: 'Sign Up', href: '/signup' }
  ]

  const trendingSearches = [
    'Chocolate Cake', 'Red Velvet', 'Black Forest', 'Birthday Cake', 'Anniversary Cake',
    'Wedding Cake', 'Photo Cake', 'Designer Cake', 'Fondant Cake', 'Cupcakes'
  ]

  const quickCategories = [
    'Chocolate Cake', 'Red Velvet', 'Black Forest', 'Birthday Cake', 'Anniversary Cake',
    'Wedding Cake', 'Photo Cake', 'Designer Cake', 'Fondant Cake', 'Cupcakes'
  ]

  // Fetch categories from database
  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true)
      logger.log('Fetching categories from database...')
      
      // Map category IDs to their corresponding API endpoints
      const categoryEndpoints = {
        19: 'cakes-by-flavor',
        20: 'cakes-for-occasion', 
        21: 'kids-cake-collection',
        22: 'crowd-favorite-cakes',
        23: 'love-relationship-cakes',
        24: 'milestone-year-cakes',
        26: 'small-treats-desserts',
        27: 'flowers',
        28: 'sweets-dry-fruits'
      }

      const categoryPromises = Object.entries(categoryEndpoints).map(async ([id, slug]) => {
        try {
          const response = await categoryApi.getSubcategories(slug)
          if (response.success && response.data) {
            return {
              id: slug,
              name: response.data.category.name,
              description: response.data.category.description,
              subcategories: response.data.subcategories.map(sub => sub.name),
              // Add colors and styling based on category
              color: getCategoryColor(slug),
              bgColor: getCategoryBgColor(slug),
              borderColor: getCategoryBorderColor(slug)
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch subcategories for ${slug}:`, error)
          return null
        }
      })

      const fetchedCategories = (await Promise.all(categoryPromises)).filter(Boolean)
      // Ensure all categories have bgColor, borderColor, and color set
      const categoriesWithColors = fetchedCategories.map(cat => ({
        ...cat,
        bgColor: cat.bgColor || getCategoryBgColor(cat.id),
        borderColor: cat.borderColor || getCategoryBorderColor(cat.id),
        color: cat.color || getCategoryColor(cat.id)
      }))
      logger.log('Fetched categories from database:', categoriesWithColors)
      setCategories(categoriesWithColors)
    } catch (error) {
      console.error('Error fetching categories:', error)
      // Fallback to empty array if API fails
      setCategories([])
    } finally {
      setCategoriesLoading(false)
    }
  }

  // Helper functions to assign colors to categories
  const getCategoryColor = (slug) => {
    const colorMap = {
      'cakes-by-flavor': 'from-pink-500 to-rose-500',
      'cakes-for-occasion': 'from-purple-500 to-indigo-500',
      'kids-cake-collection': 'from-green-500 to-emerald-500',
      'crowd-favorite-cakes': 'from-orange-500 to-amber-500',
      'love-relationship-cakes': 'from-red-500 to-pink-500',
      'milestone-year-cakes': 'from-blue-600 to-blue-700', // Changed to vibrant blue
      'small-treats-desserts': 'from-orange-600 to-orange-700', // Changed to vibrant orange
      'flowers': 'from-teal-600 to-teal-700', // Changed to vibrant teal
      'sweets-dry-fruits': 'from-amber-600 to-amber-700' // Changed to more vibrant amber
    }
    return colorMap[slug] || 'from-gray-500 to-gray-600'
  }

  const getCategoryBgColor = (slug) => {
    const bgColorMap = {
      'cakes-by-flavor': 'bg-pink-50',
      'cakes-for-occasion': 'bg-purple-50',
      'kids-cake-collection': 'bg-green-50',
      'crowd-favorite-cakes': 'bg-orange-50',
      'love-relationship-cakes': 'bg-red-50',
      'milestone-year-cakes': 'bg-blue-50', // Changed from indigo to blue for better visibility
      'small-treats-desserts': 'bg-orange-50', // Changed from yellow to orange for better visibility
      'flowers': 'bg-teal-50', // Changed from emerald to teal for better visibility
      'sweets-dry-fruits': 'bg-amber-50'
    }
    return bgColorMap[slug] || 'bg-gray-50'
  }

  const getCategoryBorderColor = (slug) => {
    const borderColorMap = {
      'cakes-by-flavor': 'border-pink-200',
      'cakes-for-occasion': 'border-purple-200',
      'kids-cake-collection': 'border-green-200',
      'crowd-favorite-cakes': 'border-orange-200',
      'love-relationship-cakes': 'border-red-200',
      'milestone-year-cakes': 'border-blue-200', // Changed from indigo to blue
      'small-treats-desserts': 'border-orange-200', // Changed from yellow to orange
      'flowers': 'border-teal-200', // Changed from emerald to teal
      'sweets-dry-fruits': 'border-amber-200'
    }
    return borderColorMap[slug] || 'border-gray-200'
  }



  // Function to convert names to URL-friendly slugs
  const createSlug = (name) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim()
  }

  // Mapping of category names to their URL slugs (updated to match database)
  const categorySlugMap = {
    'Pick a Cake by Flavor': 'cakes-by-flavor',
    'Cakes for Any Occasion': 'cakes-for-occasion',
    'Kid\'s Cake Collection': 'kids-cake-collection',
    'Crowd-Favorite Cakes': 'crowd-favorite-cakes',
    'Love and Relationship Cakes': 'love-relationship-cakes',
    'Small Treats Desserts': 'small-treats-desserts',
    'Flowers': 'flowers',
    'Sweets and Dry Fruits': 'sweets-dry-fruits',
    'Cakes for Every Milestone Year': 'milestone-year-cakes'
  }

  const handleSubcategoryClick = useCallback((categoryName, subcategoryName) => {
    logger.log(`Navigating to ${subcategoryName} in ${categoryName}`)
    
    // Get the category slug from the mapping
    const categorySlug = categorySlugMap[categoryName] || createSlug(categoryName)
    const subcategorySlug = createSlug(subcategoryName)
    
    // Navigate to the subcategory listing page
    const url = `/category/${categorySlug}/${subcategorySlug}`
    logger.log(`Navigating to: ${url}`)
    
    router.push(url)
    setIsMobileMenuOpen(false)
    // Reset expanded categories on desktop when navigating
    if (window.innerWidth >= 1024) {
      setExpandedCategories({})
      setRecentlyExpandedCategory(null)
    }
    closeCategoryMenu()
  }, [router, closeCategoryMenu, setExpandedCategories])

  // Add search to recent searches
  const addRecentSearch = (query) => {
    if (!query || query.trim() === '') return
    
    const trimmedQuery = query.trim()
    const updated = [trimmedQuery, ...recentSearches.filter(s => s !== trimmedQuery)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
  }

  // Handle search submission
  const handleSearchSubmit = (query = searchQuery) => {
    const trimmedQuery = query.trim()
    if (!trimmedQuery) return
    
    addRecentSearch(trimmedQuery)
    setIsSearchOpen(false)
    setSearchQuery('')
    setSearchSuggestions([])
    // Always navigate to search results page
    router.push(`/search-results?query=${encodeURIComponent(trimmedQuery)}`)
  }

  // Debounced autocomplete suggestions
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchSuggestions([])
      setAutocompleteData({ products: [], flavors: [], categories: [] })
      return
    }

    const timeoutId = setTimeout(async () => {
      try {
        setIsSearchLoading(true)
        const autocompleteResults = await productApi.getSearchAutocomplete(searchQuery.trim())
        const data = autocompleteResults.data || { products: [], flavors: [], categories: [] }
        setAutocompleteData(data)
        // Also keep product suggestions for backward compatibility
        setSearchSuggestions(data.products || [])
      } catch (error) {
        console.error('Error fetching autocomplete suggestions:', error)
        setSearchSuggestions([])
        setAutocompleteData({ products: [], flavors: [], categories: [] })
      } finally {
        setIsSearchLoading(false)
      }
    }, 200) // Faster response for autocomplete

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const handlePincodeSubmit = async () => {
    if (pincode.length === 6) {
      const success = await checkPinCode(pincode)
      if (success) {
        setIsLocationOpen(false)
      }
    }
  }

  const handlePincodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setPincode(value)
    validatePinCodeDebounced(value)
  }

  const handleClearPinCode = () => {
    clearPinCode()
    setPincode('')
    setIsLocationOpen(false)
  }

  const handleContinueShopping = async () => {
    logger.log('Continue Shopping clicked (Header)');
    logger.log('Current state:', { pincode, tempValidationStatus, tempPinCode });
    const success = await confirmTempPinCode()
    logger.log('Confirmation result:', success);
    if (success) {
      setIsLocationOpen(false)
    }
  }

  // Prevent body scroll when mobile menu is open and prevent scroll jumps
  useEffect(() => {
    // Only apply scroll lock on mobile devices
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024
    
    if (isCategoryMenuOpen && isMobile) {
      // Mobile: Store current scroll position and lock scroll
      const scrollY = window.scrollY
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
    } else if (!isCategoryMenuOpen && isMobile) {
      // Mobile: Restore scroll position
      const scrollY = document.body.style.top
      document.body.style.overflow = 'unset'
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1)
    }
    }
    // Desktop: Don't lock scroll - menu is side panel, content can scroll normally

    // Cleanup on unmount
    return () => {
      if (isMobile) {
      document.body.style.overflow = 'unset'
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
      }
    }
  }, [isCategoryMenuOpen])

  // Handle Escape key to close menu (desktop) and focus management
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && isCategoryMenuOpen) {
        // Reset expanded categories on desktop menu close
        if (window.innerWidth >= 1024) {
          setExpandedCategories({})
          setRecentlyExpandedCategory(null)
        }
        closeCategoryMenu()
        // Return focus to menu button
        const menuButton = document.querySelector('[aria-controls="desktop-category-menu"]')
        if (menuButton) {
          menuButton.focus()
        }
      }
    }

    if (isCategoryMenuOpen) {
      // Only handle desktop menu focus management
      const isDesktop = window.innerWidth >= 1024
      if (isDesktop) {
        document.addEventListener('keydown', handleEscapeKey)
        // Focus management: focus first focusable element in desktop menu ONLY when menu first opens
        // Use a ref to track if we've already focused to prevent re-focusing during category expansion
        const menuPanel = document.getElementById('desktop-category-menu')
        if (menuPanel) {
          // Only focus if menu was just opened (check if there's no active element in menu)
          const activeElement = document.activeElement
          const isMenuFocused = menuPanel.contains(activeElement)
          
          if (!isMenuFocused) {
        const firstButton = document.querySelector('#desktop-category-menu button')
        if (firstButton) {
              // Use a small delay to ensure menu is fully rendered
              const timeoutId = setTimeout(() => {
                firstButton.focus()
              }, 150)
              return () => {
                clearTimeout(timeoutId)
                document.removeEventListener('keydown', handleEscapeKey)
              }
            }
          }
        }
        return () => {
          document.removeEventListener('keydown', handleEscapeKey)
        }
      }
    }
  }, [isCategoryMenuOpen, closeCategoryMenu, setExpandedCategories])
  
  // Handle menu closing animation
  useEffect(() => {
    // Check if menu transitioned from open to closed
    const wasOpen = wasMenuOpenRef.current
    const isNowOpen = isCategoryMenuOpen
    
    // Update ref to track current state
    wasMenuOpenRef.current = isNowOpen
    
    if (isNowOpen) {
      // Menu is opening, reset closing state
      setIsMenuClosing(false)
      // Clear any pending close timeout
      if (menuCloseTimeoutRef.current) {
        clearTimeout(menuCloseTimeoutRef.current)
        menuCloseTimeoutRef.current = null
      }
    } else if (wasOpen && !isNowOpen) {
      // Menu just transitioned from open to closed - start closing animation
      setIsMenuClosing(true)
      
      // Clear any existing timeout
      if (menuCloseTimeoutRef.current) {
        clearTimeout(menuCloseTimeoutRef.current)
      }
      
      // Wait for closing animation to complete before resetting
      menuCloseTimeoutRef.current = setTimeout(() => {
        setIsMenuClosing(false)
        if (window.innerWidth >= 1024) {
          setExpandedCategories({})
          setRecentlyExpandedCategory(null)
          desktopMenuScrollRef.current = 0
        }
        menuCloseTimeoutRef.current = null
      }, 300) // Match the closing animation duration
    }
    
    return () => {
      if (menuCloseTimeoutRef.current) {
        clearTimeout(menuCloseTimeoutRef.current)
        menuCloseTimeoutRef.current = null
      }
    }
  }, [isCategoryMenuOpen, setExpandedCategories])

  // Restore scroll position after category expansion/collapse (desktop only)
  useEffect(() => {
    if (!isCategoryMenuOpen || typeof window === 'undefined') return
    
    const isDesktop = window.innerWidth >= 1024
    if (!isDesktop || isRestoringScrollRef.current) return

    const menuPanel = document.getElementById('desktop-category-menu')
    if (!menuPanel) return

    // Wait for DOM to update after category expansion
    const restoreScroll = () => {
      if (desktopMenuScrollRef.current > 0 && menuPanel) {
        isRestoringScrollRef.current = true
        // Use double requestAnimationFrame to ensure DOM has fully updated
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            menuPanel.scrollTop = desktopMenuScrollRef.current
            isRestoringScrollRef.current = false
            desktopMenuScrollRef.current = 0
          })
        })
      }
    }

    // Small delay to ensure React has finished rendering
    const timeoutId = setTimeout(restoreScroll, 50)
    
    return () => clearTimeout(timeoutId)
  }, [expandedCategories, isCategoryMenuOpen])

  // Handle swipe to close (mobile)
  const minSwipeDistance = 50

  const onTouchStart = (e) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    if (isLeftSwipe && isCategoryMenuOpen) {
      closeCategoryMenu()
    }
  }

  // Handle click outside and escape key to close search dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only handle click-outside for desktop search dropdown
      // Mobile search overlay is full-screen and should only close via close button
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024
      
      if (isMobile) {
        // On mobile, don't close on click-outside - only close via close button or Escape
        return
      }
      
      // Desktop: Close if clicking outside the search container
      const desktopSearchContainer = document.querySelector('.desktop-search-container')
      const target = event.target
      
      if (desktopSearchContainer && !desktopSearchContainer.contains(target)) {
        setIsSearchOpen(false)
      }
    }

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        setIsSearchOpen(false)
      }
    }

    if (isSearchOpen) {
      // Only add click-outside listener for desktop
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024
      if (!isMobile) {
        document.addEventListener('mousedown', handleClickOutside)
      }
      document.addEventListener('keydown', handleEscapeKey)

      return () => {
        if (!isMobile) {
          document.removeEventListener('mousedown', handleClickOutside)
        }
        document.removeEventListener('keydown', handleEscapeKey)
      }
    }
  }, [isSearchOpen])

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 bg-red-800 dark:bg-red-900 transition-all duration-300 ${
        isScrolled ? 'shadow-lg dark:shadow-lg dark:shadow-black/20' : 'shadow-sm dark:shadow-sm dark:shadow-black/10'
      }`}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Mobile Layout */}
          <div className="lg:hidden flex items-center justify-between w-full">
            {/* Left Side: Menu + Logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(!isMobileMenuOpen)
                  toggleCategoryMenu()
                }}
                className={`p-3 rounded-xl bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-300 shadow-sm hover:shadow-md active:scale-95 group ${
                  isCategoryMenuOpen ? 'bg-pink-500/20 dark:bg-pink-500/30 shadow-md ring-2 ring-pink-500/30' : ''
                }`}
              >
                <div className="relative w-5 h-5 flex items-center justify-center">
                  <Menu 
                    className={`w-5 h-5 text-white group-hover:text-pink-200 transition-all duration-300 absolute ${
                      isCategoryMenuOpen ? 'opacity-0 rotate-90 scale-75' : 'opacity-100 rotate-0 scale-100'
                    }`}
                  />
                  <X 
                    className={`w-5 h-5 text-white group-hover:text-pink-200 transition-all duration-300 absolute ${
                      isCategoryMenuOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75'
                    }`}
                  />
                </div>
              </button>
              
              {/* Mobile Logo */}
              <div className="flex items-center">
                <button 
                  onClick={() => router.push('/')}
                  className="py-1 hover:opacity-90 active:opacity-75 transition-all duration-200 cursor-pointer"
                >
                  <img 
                    src="/Creamingo LOGO white.png" 
                    alt="Creamingo" 
                    className="h-12 sm:h-14 w-auto max-w-[140px] sm:max-w-[160px] transition-all duration-200"
                  />
                </button>
              </div>
            </div>

            {/* Right Side: Search Icon + Cart Icon (PDP only) + Account Icon */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => isSearchOpen ? setIsSearchOpen(false) : setIsSearchOpen(true)}
                className="p-3 rounded-xl bg-white/10 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-300 shadow-sm hover:shadow-md active:scale-95"
              >
                {isSearchOpen ? (
                  <X className="w-5 h-5 text-white" />
                ) : (
                  <Search className="w-5 h-5 text-white" />
                )}
              </button>
              {/* Cart Icon - Always visible on PDP, enhanced when items exist */}
              {mounted && isOnPDP && (
                <button
                  onClick={() => router.push('/cart')}
                  className={`relative p-3 rounded-xl bg-white/10 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-300 shadow-sm hover:shadow-md active:scale-95 ${
                    cartItemCount > 0 ? 'bg-white/20 dark:bg-white/10 border-white/30 dark:border-white/20' : ''
                  } ${
                    duplicateDetected ? 'animate-pulse' : ''
                  }`}
                >
                  <ShoppingCart className="w-5 h-5 text-white" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-yellow-500 dark:bg-yellow-600 text-white text-xs font-bold rounded-full border-2 border-red-800 dark:border-red-900">
                      {cartItemCount > 99 ? '99+' : cartItemCount}
                    </span>
                  )}
                </button>
              )}
              {/* Profile Icon - Hidden on PDP (mobile only) after mount, visible on all other pages */}
              {(!mounted || !isOnPDP) && (
                <button
                  onClick={() => {
                    // On mobile, if on account page, navigate back; otherwise navigate to account
                    if (pathname === '/account') {
                      router.push('/')
                    } else {
                      router.push('/account')
                    }
                  }}
                  className="p-3 rounded-xl bg-white/10 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-300 shadow-sm hover:shadow-md active:scale-95"
                >
                  {pathname === '/account' ? (
                    <X className="w-5 h-5 text-white" />
                  ) : (
                    <User className="w-5 h-5 text-white" />
                  )}
                </button>
              )}
            </div>
          </div>

                      {/* Desktop Layout */}
            <div className="hidden lg:flex items-center justify-between w-full">
              {/* Left Side: Menu + Logo */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(!isMobileMenuOpen)
                      toggleCategoryMenu()
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setIsMobileMenuOpen(!isMobileMenuOpen)
                        toggleCategoryMenu()
                      }
                    }}
                    aria-label={isCategoryMenuOpen ? 'Close menu' : 'Open menu'}
                    aria-expanded={isCategoryMenuOpen}
                    aria-controls="desktop-category-menu"
                    className={`p-3 rounded-xl bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-300 shadow-sm hover:shadow-md active:scale-95 group focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 ${
                      isCategoryMenuOpen ? 'bg-pink-500/20 dark:bg-pink-500/30 shadow-md ring-2 ring-pink-500/30' : ''
                    }`}
                  >
                    <div className="relative w-5 h-5 flex items-center justify-center">
                      <Menu 
                        className={`w-5 h-5 text-white group-hover:text-pink-200 transition-all duration-300 absolute ${
                          isCategoryMenuOpen ? 'opacity-0 rotate-90 scale-75' : 'opacity-100 rotate-0 scale-100'
                        }`}
                      />
                      <X 
                        className={`w-5 h-5 text-white group-hover:text-pink-200 transition-all duration-300 absolute ${
                          isCategoryMenuOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75'
                        }`}
                      />
                    </div>
                  </button>
                  
                  {/* Desktop Menu Side Panel */}
                  {(isCategoryMenuOpen || isMenuClosing) && (
                    <div 
                      id="desktop-category-menu"
                      role="dialog"
                      aria-modal="true"
                      aria-label="Category menu"
                      className="fixed top-16 bottom-0 left-0 w-[30vw] min-w-[320px] max-w-[500px] bg-white dark:bg-gray-800 shadow-2xl dark:shadow-black/50 z-[9999] lg:block hidden overflow-y-auto"
                      style={{ 
                        animation: isMenuClosing 
                          ? 'slideOutLeft 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)' 
                          : 'slideInLeft 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                        willChange: 'transform'
                      }}
                    >
                      {/* Desktop Menu Header */}
                      <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center z-10">
                        <h2 className="font-poppins font-medium text-gray-900 dark:text-gray-100 text-xl leading-normal flex items-center gap-2">
                          <div className="w-1.5 h-6 bg-gradient-to-b from-pink-500 to-pink-600 rounded-full"></div>
                          <span>Explore</span>
                        </h2>
                      </div>
                      {/* Categories Box */}
                      <div className="p-4">
                        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                          <h3 className="font-poppins font-normal text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wide mb-3 flex items-center leading-normal" id="categories-heading-desktop">
                            <div className="w-1 h-4 bg-pink-500 rounded-full mr-2" aria-hidden="true"></div>
                            Shop By Categories
                          </h3>
                          <div className="space-y-2" role="list" aria-labelledby="categories-heading-desktop">
                            {categoriesLoading ? (
                              <div className="text-center py-4">
                                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500"></div>
                                <p className="mt-2 text-gray-600 dark:text-gray-300 text-sm leading-relaxed">Loading categories...</p>
                              </div>
                            ) : (
                              categories.map((category, index) => (
                              <div 
                                key={category.id} 
                                role="listitem" 
                                className={`rounded-xl transition-all duration-300 ${
                                  category.id === 'cakes-by-flavor' 
                                    ? 'bg-transparent dark:bg-transparent shadow-none hover:shadow-none' 
                                    : expandedCategories[category.id]
                                    ? 'bg-transparent dark:bg-transparent shadow-none hover:shadow-none' 
                                    : 'bg-white dark:bg-gray-700/30 shadow-sm hover:shadow-sm'
                                } ${
                                  recentlyExpandedCategory === category.id ? 'animate-[pinkBlink_0.6s_ease-out]' : ''
                                }`}
                                style={{ 
                                  willChange: 'transform', 
                                  overflow: 'visible',
                                  backgroundColor: category.id === 'cakes-by-flavor' ? 'transparent' : undefined
                                }}
                              >
                                {/* Category Header */}
                                <button
                                  id={`category-${category.id}-button`}
                                                  onClick={() => {
                                    // Save scroll position before expansion (desktop only)
                                    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
                                    const menuPanel = document.getElementById('desktop-category-menu')
                                      if (menuPanel) {
                                        desktopMenuScrollRef.current = menuPanel.scrollTop || 0
                                      }
                                    }
                                    
                                    toggleCategory(category.id)
                                    // Track recently expanded category for animation
                                    if (!expandedCategories[category.id]) {
                                      setRecentlyExpandedCategory(category.id)
                                      // Reset after animation completes
                                      setTimeout(() => setRecentlyExpandedCategory(null), 600)
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault()
                                      // Save scroll position before expansion (desktop only)
                                      if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
                                      const menuPanel = document.getElementById('desktop-category-menu')
                                        if (menuPanel) {
                                          desktopMenuScrollRef.current = menuPanel.scrollTop || 0
                                        }
                                      }
                                      const wasExpanded = expandedCategories[category.id]
                                      toggleCategory(category.id)
                                      if (!wasExpanded) {
                                        setRecentlyExpandedCategory(category.id)
                                        setTimeout(() => setRecentlyExpandedCategory(null), 600)
                                      }
                                    } else if (e.key === 'ArrowDown' && !expandedCategories[category.id]) {
                                      e.preventDefault()
                                      // Save scroll position before expansion (desktop only)
                                      if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
                                      const menuPanel = document.getElementById('desktop-category-menu')
                                        if (menuPanel) {
                                          desktopMenuScrollRef.current = menuPanel.scrollTop || 0
                                        }
                                      }
                                      toggleCategory(category.id)
                                      setRecentlyExpandedCategory(category.id)
                                      setTimeout(() => setRecentlyExpandedCategory(null), 600)
                                    } else if (e.key === 'ArrowUp' && expandedCategories[category.id]) {
                                      e.preventDefault()
                                      toggleCategory(category.id)
                                    }
                                  }}
                                  aria-expanded={expandedCategories[category.id] || false}
                                  aria-controls={`category-${category.id}-subcategories`}
                                  aria-label={`${category.name} category, ${expandedCategories[category.id] ? 'expanded' : 'collapsed'}. Press Enter or Space to ${expandedCategories[category.id] ? 'collapse' : 'expand'}`}
                                  className={`w-full flex items-center justify-between px-4 py-3.5 text-left transition-all duration-300 hover:bg-gray-50/60 dark:hover:bg-gray-700/30 active:scale-[0.98] group focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 ${
                                    category.id === 'cakes-by-flavor'
                                      ? expandedCategories[category.id] 
                                        ? 'bg-transparent dark:bg-transparent border-l-4 border-gray-300 dark:border-gray-600 shadow-none' 
                                        : 'bg-transparent dark:bg-transparent hover:shadow-none hover:border-l-2 hover:border-gray-200 dark:hover:border-gray-500'
                                      : expandedCategories[category.id] 
                                        ? `${category.bgColor} dark:bg-gray-700/40 ${category.borderColor} dark:border-gray-600 border-l-4 shadow-md ring-1 ring-pink-500/20` 
                                        : 'bg-transparent dark:bg-transparent hover:shadow-sm hover:border-l-2 hover:border-gray-200 dark:hover:border-gray-500'
                                  }`}
                                  style={{
                                    overflow: 'visible',
                                    ...(category.id === 'cakes-by-flavor' && { backgroundColor: 'transparent' })
                                  }}
                                >
                                  <div className="flex items-center gap-3">
                                    {/* Enhanced Category Marker */}
                                    <div className="relative flex-shrink-0" style={{ width: '12px', height: '28px', minWidth: '12px', overflow: 'visible' }}>
                                      {(() => {
                                        // Use more vibrant colors for better visibility
                                        const slug = category.id || category.slug || '';
                                        let markerColor = 'bg-gray-500';
                                        
                                        // Use specific vibrant colors for problematic categories (check slug first)
                                        if (slug === 'milestone-year-cakes') {
                                          markerColor = 'bg-blue-600'; // Vibrant blue
                                        } else if (slug === 'small-treats-desserts') {
                                          markerColor = 'bg-orange-600'; // Vibrant orange
                                        } else if (slug === 'flowers') {
                                          markerColor = 'bg-cyan-600'; // Changed to cyan for better visibility
                                        } else if (slug === 'sweets-dry-fruits') {
                                          markerColor = 'bg-orange-700'; // Changed to darker orange for better visibility
                                        } else if (category.bgColor) {
                                          markerColor = category.bgColor.replace('-50', '-500');
                                        } else {
                                          markerColor = getCategoryBgColor(slug).replace('-50', '-500') || 'bg-gray-500';
                                        }
                                        return (
                                          <>
                                            <div 
                                              className={`rounded-full ${markerColor} shadow-md transition-all duration-300 group-hover:scale-105 group-hover:shadow-md`} 
                                              style={{ 
                                                width: '12px', 
                                                height: '28px', 
                                                display: 'block', 
                                                position: 'relative', 
                                                zIndex: 10,
                                                minWidth: '12px',
                                                minHeight: '28px',
                                                flexShrink: 0,
                                                imageRendering: 'crisp-edges',
                                                WebkitFontSmoothing: 'antialiased'
                                              }}
                                            ></div>
                                            {/* Removed blur layer for clearer markers */}
                                          </>
                                        );
                                      })()}
                                    </div>
                                    <span className="font-poppins font-normal text-gray-900 dark:text-gray-100 text-sm leading-normal truncate antialiased">
                                      {category.name}
                                    </span>
                                  </div>
                                  <div className="flex-shrink-0 relative w-4 h-4 flex items-center justify-center">
                                    <Plus 
                                      className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-all duration-300 absolute ${
                                        expandedCategories[category.id] ? 'opacity-0 rotate-90 scale-75' : 'opacity-100 rotate-0 scale-100'
                                      }`}
                                    />
                                    <Minus 
                                      className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-all duration-300 absolute ${
                                        expandedCategories[category.id] ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75'
                                      }`}
                                    />
                                  </div>
                                </button>

                                {/* Subcategories */}
                                <div 
                                  id={`category-${category.id}-subcategories`}
                                  role="region"
                                  aria-labelledby={`category-${category.id}-button`}
                                  className={`${category.id === 'cakes-by-flavor' ? 'bg-transparent' : category.bgColor} dark:bg-gray-700/50 border-l-4 ${category.id === 'cakes-by-flavor' ? 'border-gray-300' : category.borderColor} dark:border-gray-600 shadow-inner overflow-hidden transition-all duration-300 ease-out ${
                                    expandedCategories[category.id] 
                                      ? 'max-h-[1000px] opacity-100' 
                                      : 'max-h-0 opacity-0'
                                  }`}
                                  style={{
                                    transition: 'max-height 0.3s ease-out, opacity 0.3s ease-out, padding 0.3s ease-out',
                                    paddingTop: expandedCategories[category.id] ? '0.75rem' : '0',
                                    paddingBottom: expandedCategories[category.id] ? '0.75rem' : '0',
                                    willChange: 'max-height, opacity'
                                  }}
                                >
                                    <div className="p-3 space-y-1" role="list" aria-label={`${category.name} subcategories`}>
                                    {expandedCategories[category.id] && category.subcategories.map((subcategory, subIndex) => (
                                        <button
                                          key={subIndex}
                                          onClick={() => handleSubcategoryClick(category.name, subcategory)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                              e.preventDefault()
                                              handleSubcategoryClick(category.name, subcategory)
                                            }
                                          }}
                                          aria-label={`${subcategory} in ${category.name}`}
                                          role="listitem"
                                          tabIndex={expandedCategories[category.id] ? 0 : -1}
                                          className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/70 dark:hover:bg-gray-600/50 transition-all duration-200 group hover:shadow-sm hover:translate-x-1 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-1 opacity-100"
                                        style={{
                                          animationDelay: `${subIndex * 0.05}s`,
                                          animation: 'slideDownFade 0.3s ease-out both',
                                          transform: 'translateY(0)',
                                          willChange: 'transform, opacity'
                                        }}
                                        >
                                        <div className="flex items-center gap-3">
                                            {/* Enhanced Subcategory Marker */}
                                            <div className="relative flex-shrink-0">
                                              {(() => {
                                                // Use more vibrant colors for better visibility
                                                const slug = category.id || category.slug || '';
                                                let markerColor = 'bg-gray-500';
                                                
                                                // Use specific vibrant colors for problematic categories (check slug first)
                                                if (slug === 'milestone-year-cakes') {
                                                  markerColor = 'bg-blue-600'; // Vibrant blue
                                                } else if (slug === 'small-treats-desserts') {
                                                  markerColor = 'bg-orange-600'; // Vibrant orange
                                                } else if (slug === 'flowers') {
                                                  markerColor = 'bg-cyan-600'; // Changed to cyan for better visibility
                                                } else if (slug === 'sweets-dry-fruits') {
                                                  markerColor = 'bg-orange-700'; // Changed to darker orange for better visibility
                                                } else if (category.bgColor) {
                                                  markerColor = category.bgColor.replace('-50', '-500');
                                                } else {
                                                  markerColor = getCategoryBgColor(slug).replace('-50', '-500') || 'bg-gray-500';
                                                }
                                                return (
                                                  <div className={`w-1.5 h-4 rounded-full ${markerColor} opacity-70 shadow-sm transition-all duration-200 group-hover:opacity-100 group-hover:scale-110`}></div>
                                                );
                                              })()}
                                            </div>
                                            <span className="font-inter font-normal text-sm text-gray-800 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-gray-100 leading-normal truncate transition-colors duration-200 antialiased">
                                              {subcategory}
                                            </span>
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                              </div>
                            ))
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Useful Links Box */}
                      <div className="p-4 pb-16">
                        <div className="bg-pink-50 dark:bg-pink-900/20 rounded-xl p-4 border border-pink-200 dark:border-pink-800/30">
                          <h3 className="font-poppins font-normal text-pink-700 dark:text-pink-300 text-xs uppercase tracking-wider mb-4 flex items-center leading-normal">
                            <div className="w-1.5 h-5 bg-gradient-to-b from-pink-500 to-pink-600 rounded-full mr-3 shadow-sm"></div>
                            Useful Links
                          </h3>
                          <div className="space-y-1">
                            {isAuthenticated && customer && (
                              <div className="px-3 py-2 mb-2 bg-white/50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600" suppressHydrationWarning>
                                <p className="font-inter text-xs font-semibold text-gray-800 dark:text-gray-100 leading-snug truncate">
                                  {customer.name || customer.email}
                                </p>
                                <p className="font-inter text-xs text-gray-500 dark:text-gray-400 truncate leading-snug">
                                  {customer.email}
                                </p>
                              </div>
                            )}
                            {usefulLinks.map((link, index) => (
                              <button
                                key={index}
                                onClick={async (e) => {
                                  e.preventDefault()
                                  setIsMobileMenuOpen(false)
                                  closeCategoryMenu()
                                  
                                  if (link.isLogout) {
                                    // Handle logout
                                    await logout()
                                  } else {
                                    // Navigate to link
                                    router.push(link.href)
                                  }
                                }}
                                className="w-full flex items-center gap-3 p-3 hover:bg-pink-500/20 dark:hover:bg-pink-500/30 rounded-xl transition-colors duration-200 group text-left"
                              >
                                <link.icon className="w-4 h-4 text-pink-500 dark:text-pink-400 flex-shrink-0" />
                                <span className="font-inter text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 leading-normal">
                                  {link.label}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      {/* Bottom padding to ensure all content is scrollable */}
                      <div className="h-12"></div>
                    </div>
                  )}
                </div>
                
                {/* Desktop Logo */}
                <div className="flex items-center">
                  <button 
                    onClick={() => router.push('/')}
                    className="cursor-pointer hover:opacity-90 transition-all duration-300"
                  >
                    <img 
                      src="/Creamingo LOGO white.png" 
                      alt="Creamingo" 
                      className="h-12 lg:h-[52px] w-auto drop-shadow-lg hover:drop-shadow-xl transition-all duration-300" 
                    />
                  </button>
                </div>
              </div>

            {/* Search Box */}
            <div className="flex-1 max-w-xl mx-4 lg:mx-6">
              <div className="relative search-container desktop-search-container">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearchSubmit()
                    }
                  }}
                  placeholder="Search cakes, pastries, gifts..."
                  className="w-full pl-4 pr-20 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-600 focus:border-transparent font-inter text-sm bg-gray-50 dark:bg-gray-700 hover:bg-white dark:hover:bg-gray-600 transition-colors text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 leading-relaxed"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      setSearchSuggestions([])
                    }}
                    className="absolute right-12 top-1/2 transform -translate-y-1/2 p-1 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                  >
                    <X className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  </button>
                )}
                <button
                  onClick={() => handleSearchSubmit()}
                  disabled={!searchQuery || searchQuery.trim() === ''}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-xl bg-pink-500 dark:bg-pink-600 text-white hover:bg-pink-600 dark:hover:bg-pink-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm dark:shadow-md dark:shadow-black/30 hover:shadow-md dark:hover:shadow-lg"
                  title="Search"
                >
                  <Search className="w-4 h-4" />
                </button>
                
                {/* Desktop Search Dropdown */}
                {isSearchOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl dark:shadow-2xl dark:shadow-black/30 border border-gray-200 dark:border-gray-700 z-[9999] max-h-[calc(100vh-14rem)] flex flex-col transform transition-all duration-200 ease-out">
                    {/* Search Suggestions */}
                    {searchQuery && searchQuery.trim() !== '' && (
                      <div className="flex flex-col flex-1 min-h-0">
                        <div className="px-4 pt-4 pb-2 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-2">
                              <Search className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                              <h3 className="font-poppins font-semibold text-gray-700 dark:text-gray-200 text-sm">SEARCH RESULTS</h3>
                            </div>
                            {isSearchLoading && (
                              <Loader2 className="w-4 h-4 text-gray-400 dark:text-gray-500 animate-spin" />
                            )}
                          </div>
                        </div>
                        {isSearchLoading ? (
                          <div className="flex items-center justify-center py-8 flex-1">
                            <Loader2 className="w-6 h-6 text-pink-500 animate-spin" />
                            <span className="ml-2 text-gray-600 dark:text-gray-300 text-sm">Searching...</span>
                          </div>
                        ) : (autocompleteData.products?.length > 0 || autocompleteData.categories?.length > 0) ? (
                          <>
                            {/* Scrollable Content Area */}
                            <div className="flex-1 overflow-y-auto px-4 pb-2">
                              <div className="space-y-4 pt-1">
                                {/* Products */}
                                {autocompleteData.products && autocompleteData.products.length > 0 && (
                                  <div className="space-y-2">
                                    {autocompleteData.products.map((product) => (
                                      <button
                                        key={product.id}
                                        onClick={() => {
                                          addRecentSearch(product.name)
                                          router.push(`/product/${product.slug || product.id}`)
                                          setIsSearchOpen(false)
                                          setSearchQuery('')
                                          setSearchSuggestions([])
                                        }}
                                        className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 text-left group"
                                      >
                                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                                          {product.image_url || product.image ? (
                                            <img 
                                              src={product.image_url || product.image} 
                                              alt={product.name}
                                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                                            />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                              <ShoppingBag className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="font-inter font-medium text-gray-900 dark:text-gray-100 text-sm truncate group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                                            {product.name}
                                          </p>
                                          <p className="font-inter text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                            {product.category_name || product.category}
                                          </p>
                                        </div>
                                        <div className="flex-shrink-0">
                                          <span className="font-inter font-semibold text-pink-600 text-sm">
                                            ₹{product.discounted_price || product.base_price || '0'}
                                          </span>
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                )}

                                {/* Categories */}
                                {autocompleteData.categories && autocompleteData.categories.length > 0 && (
                                  <div>
                                    <div className="flex items-center space-x-2 mb-2">
                                      <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                                        <span className="text-white text-xs">📦</span>
                                      </div>
                                      <h4 className="font-poppins font-semibold text-gray-700 dark:text-gray-200 text-xs uppercase tracking-wide">Categories</h4>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {autocompleteData.categories.map((category) => (
                                        <button
                                          key={category.id}
                                          onClick={() => {
                                            addRecentSearch(category.name)
                                            router.push(`/category/${category.slug}`)
                                            setIsSearchOpen(false)
                                            setSearchQuery('')
                                            setSearchSuggestions([])
                                          }}
                                          className="px-3 py-1.5 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 border border-purple-200 dark:border-purple-700 rounded-lg text-purple-700 dark:text-purple-300 text-sm font-inter font-medium hover:from-purple-100 hover:to-blue-100 dark:hover:from-purple-900/40 dark:hover:to-blue-900/40 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md transition-all duration-200"
                                        >
                                          {category.name}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}

                              </div>
                            </div>

                            {/* Fixed View All Results Button */}
                            <div className="p-4 pt-2 pb-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800 rounded-b-xl">
                              <button
                                onClick={() => handleSearchSubmit()}
                                className="w-full px-4 py-2.5 bg-pink-500 dark:bg-pink-600 text-white rounded-xl font-inter font-medium text-sm hover:bg-pink-600 dark:hover:bg-pink-500 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                              >
                                <span>View all results for "{searchQuery}"</span>
                                <Search className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-6 flex-1">
                            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">No results found</p>
                            <button
                              onClick={() => handleSearchSubmit()}
                              className="mt-3 px-4 py-2 bg-pink-500 dark:bg-pink-600 text-white rounded-xl font-inter font-medium text-sm hover:bg-pink-600 dark:hover:bg-pink-500 transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                              Search anyway
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Recent Searches */}
                    {(!searchQuery || searchQuery.trim() === '') && recentSearches.length > 0 && (
                      <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            <h3 className="font-poppins font-semibold text-gray-700 dark:text-gray-200 text-sm">RECENT SEARCHES</h3>
                          </div>
                          <button
                            onClick={() => {
                              setRecentSearches([])
                              localStorage.removeItem('recentSearches')
                            }}
                            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                          >
                            Clear
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {recentSearches.map((search, index) => (
                            <button
                              key={index}
                              onClick={() => handleSearchSubmit(search)}
                              className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 text-sm font-inter hover:bg-pink-50 dark:hover:bg-pink-900/30 hover:border-pink-300 dark:hover:border-pink-700 hover:text-pink-700 dark:hover:text-pink-400 transition-all duration-200"
                            >
                              {search}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Trending Searches */}
                    {(!searchQuery || searchQuery.trim() === '') && (
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">🔥</span>
                            <h3 className="font-poppins font-semibold text-gray-700 dark:text-gray-200 text-sm">TRENDING SEARCHES</h3>
                          </div>
                          <button
                            onClick={() => setIsSearchOpen(false)}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                          >
                            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          </button>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {trendingSearches.map((search, index) => (
                            <button
                              key={index}
                              onClick={() => handleSearchSubmit(search)}
                              className="px-3 py-2 bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 text-sm font-inter hover:bg-pink-50 dark:hover:bg-pink-900/30 hover:border-pink-300 dark:hover:border-pink-700 hover:text-pink-700 dark:hover:text-pink-400 transition-all duration-200 text-center whitespace-nowrap leading-relaxed"
                            >
                              {search}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Side: Cart Icon (PDP only) + Location Picker */}
            <div className="flex items-center gap-3">
              {/* Cart Icon - Desktop (PDP only) */}
              {isOnPDP && (
                <button
                  onClick={() => router.push('/cart')}
                  className={`relative p-3 rounded-xl bg-white/10 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-300 shadow-sm hover:shadow-md active:scale-95 ${
                    mounted && cartItemCount > 0 ? 'bg-white/20 dark:bg-white/10 border-white/30 dark:border-white/20' : ''
                  } ${
                    duplicateDetected ? 'animate-pulse' : ''
                  }`}
                >
                  <ShoppingCart className="w-5 h-5 text-white" />
                  {mounted && cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-yellow-500 dark:bg-yellow-600 text-white text-xs font-bold rounded-full border-2 border-red-800 dark:border-red-900">
                      {cartItemCount > 99 ? '99+' : cartItemCount}
                    </span>
                  )}
                </button>
              )}

              {/* Location Picker */}
              <div className="relative">
                <button 
                  onClick={() => setIsLocationOpen(!isLocationOpen)}
                  className={`flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-pink-300 dark:hover:border-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors duration-200 group ${
                    isLocationOpen ? 'border-pink-300 dark:border-pink-600 bg-pink-50 dark:bg-pink-900/20 shadow-sm dark:shadow-md dark:shadow-black/20' : ''
                  }`}
                >
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-pink-50 dark:bg-pink-900/30 group-hover:bg-pink-100 dark:group-hover:bg-pink-900/40 transition-colors">
                  <MapPin className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                </div>
                <div className="flex flex-col text-left min-w-0">
                  <span className="font-inter text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide leading-tight">Delivery to</span>
                  <span className="font-inter text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight truncate">
                    {isDeliveryAvailable() ? formatPinCode(currentPinCode) : 'Select Location'}
                  </span>
                </div>
                {isDeliveryAvailable() && (
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex-shrink-0">
                    <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                  </div>
                )}
              </button>
              
              {/* Desktop Location Popup */}
              {isLocationOpen && (
                <div className="absolute top-full right-0 w-80 max-w-80 rounded-xl shadow-lg dark:shadow-xl dark:shadow-black/30 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 mt-2 z-[9999] overflow-hidden">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-md bg-red-600 dark:bg-red-700 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-inter text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                            {isDeliveryAvailable() ? 'Change Location' : 'Delivery Location'}
                          </h3>
                          <p className="font-inter text-xs text-gray-600 dark:text-gray-400 mt-0.5 leading-tight">
                            {isDeliveryAvailable() ? 'Update pincode' : 'Enter pincode'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsLocationOpen(false)}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 flex-shrink-0"
                      >
                        <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-4">
                    
                    {/* Show delivery info - prioritize new PIN code info if available */}
                    {((tempValidationStatus === 'valid' && tempDeliveryInfo) || isDeliveryAvailable()) && (
                      <div className="mb-3 p-2.5 bg-green-50 dark:bg-green-900/20 border-l-[3px] border-green-500 dark:border-green-600 rounded-r-md">
                        <div className="flex items-start space-x-2">
                          <div className="flex-shrink-0 mt-0.5">
                            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-inter text-xs font-semibold text-green-800 dark:text-green-300 mb-0.5 leading-snug">
                              {tempValidationStatus === 'valid' && tempDeliveryInfo && pincode !== currentPinCode 
                                ? `New: ${formatPinCode(pincode)}`
                                : `To ${formatPinCode(currentPinCode)}`
                              }
                            </div>
                            <div className="font-inter text-xs text-green-700 dark:text-green-400 leading-snug">
                              {tempValidationStatus === 'valid' && tempDeliveryInfo && pincode !== currentPinCode
                                ? `${getTempDeliveryLocality()} (… + nearby) • ${getTempFormattedDeliveryCharge()}`
                                : `${getDeliveryLocality()} (… + nearby) • ${getFormattedDeliveryCharge()}`
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-3">
                      <div className="relative">
                        <label className="block font-inter text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          Pincode
                        </label>
                        <div className="relative">
                          <Navigation className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                          <input
                            type="text"
                            value={pincode}
                            onChange={handlePincodeChange}
                            placeholder="Enter 6-digit pincode"
                            className={`w-full pl-9 pr-10 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-0 font-inter text-sm font-medium tracking-wider text-left transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500 leading-relaxed ${
                              tempValidationStatus === 'valid' 
                                ? 'border-green-400 dark:border-green-600 focus:ring-green-500 dark:focus:ring-green-400 focus:border-green-500 dark:focus:border-green-600 text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20' 
                                : tempValidationStatus === 'invalid' 
                                ? 'border-red-400 dark:border-red-600 focus:ring-red-500 dark:focus:ring-red-400 focus:border-red-500 dark:focus:border-red-600 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20' 
                                : 'border-gray-300 dark:border-gray-600 focus:ring-pink-500 dark:focus:ring-pink-400 focus:border-pink-500 dark:focus:border-pink-600 text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 hover:bg-white dark:hover:bg-gray-600'
                            }`}
                            maxLength={6}
                          />
                          {tempValidationStatus === 'checking' && (
                            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 animate-spin" />
                          )}
                          {tempValidationStatus === 'valid' && (
                            <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-600 dark:text-green-400" />
                          )}
                          {tempValidationStatus === 'invalid' && (
                            <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-red-600 dark:text-red-400" />
                          )}
                        </div>
                      </div>
                      
                      {pincode.length === 6 && tempValidationStatus === 'valid' && (
                        <button
                          onClick={handleContinueShopping}
                          className="w-full bg-green-600 dark:bg-green-700 text-white py-2.5 rounded-xl font-inter text-sm font-medium hover:bg-green-700 dark:hover:bg-green-600 transition-colors duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          <span>Continue Shopping</span>
                        </button>
                      )}
                      
                      {pincode.length === 6 && tempValidationStatus === 'invalid' && (
                        <button
                          onClick={handlePincodeSubmit}
                          disabled={isChecking}
                          className="w-full bg-red-600 dark:bg-red-700 text-white py-2.5 rounded-xl font-inter text-sm font-medium hover:bg-red-700 dark:hover:bg-red-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                        >
                          {isChecking ? 'Checking...' : 'Check Availability'}
                        </button>
                      )}
                      
                      {pincode.length === 6 && (tempValidationStatus === 'checking' || tempValidationStatus === null) && (
                        <div className="flex gap-2">
                          <button
                            disabled={true}
                            className="flex-1 bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 py-2.5 rounded-xl font-inter text-sm font-medium cursor-not-allowed"
                          >
                            {tempValidationStatus === 'checking' ? 'Checking...' : 'Enter PIN Code'}
                          </button>
                          {isDeliveryAvailable() && (
                            <button
                              onClick={handleClearPinCode}
                              className="flex-1 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 py-2.5 rounded-xl font-inter text-sm font-medium hover:text-gray-800 dark:hover:text-gray-100 hover:border-gray-400 dark:hover:border-gray-500 dark:hover:bg-gray-700 transition-colors duration-200"
                            >
                              Clear Location
                            </button>
                          )}
                        </div>
                      )}
                      
                      
                      {isValidPinCode === false && (
                        <div className="flex items-start gap-2 p-2.5 bg-red-50 dark:bg-red-900/20 border-l-[3px] border-red-500 dark:border-red-600 rounded-r-xl">
                          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                          <span className="font-inter text-xs text-red-700 dark:text-red-300 leading-relaxed">
                            {error || "Sorry, we don't deliver to this pincode yet."}
                          </span>
                        </div>
                      )}
                      
                      {isDeliveryAvailable() && pincode.length !== 6 && (
                        <button
                          onClick={handleClearPinCode}
                          className="w-full border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 py-2 rounded-xl font-inter text-sm font-medium hover:text-gray-800 dark:hover:text-gray-100 hover:border-gray-400 dark:hover:border-gray-500 dark:hover:bg-gray-700 transition-colors duration-200"
                        >
                          Clear Location
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Search Overlay - Clean Design */}
        {isSearchOpen && (
          <>
            {/* Backdrop - Dimmed Background (below header only) */}
            <div 
              className="fixed top-16 left-0 right-0 bottom-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
              onClick={() => {
                setIsSearchOpen(false)
                setSearchQuery('')
                setSearchSuggestions([])
              }}
            />
            
            {/* Clean Search Container */}
            <div 
              className="fixed top-16 left-0 right-0 z-50 lg:hidden"
              style={{ maxHeight: 'calc(100vh - 4rem)' }}
            >
              <div className={`bg-white shadow-2xl mx-0 overflow-hidden ${searchQuery && searchQuery.trim().length >= 2 ? 'rounded-b-xl' : 'rounded-b-xl'}`}>
                {/* Search Input Section */}
                <div className="px-4 pt-4 pb-3 border-b border-gray-100">
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                      <Search className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSearchSubmit()
                        }
                      }}
                      placeholder="Search for gifts..."
                      className="w-full pl-12 pr-20 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 font-inter text-base bg-gray-50 focus:bg-white transition-colors leading-relaxed"
                      autoFocus
                    />
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery('')
                          setSearchSuggestions([])
                          setAutocompleteData({ products: [], flavors: [], categories: [] })
                        }}
                        className="absolute right-12 top-1/2 transform -translate-y-1/2 p-1.5 rounded-xl hover:bg-gray-100 transition-colors duration-200"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setIsSearchOpen(false)
                        setSearchQuery('')
                        setSearchSuggestions([])
                      }}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-xl hover:bg-gray-100 transition-colors duration-200"
                      title="Close"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                </div>

                {/* Scrollable Content Area - Products Only */}
                {searchQuery && searchQuery.trim().length >= 2 && (
                  <div className="flex flex-col flex-1 min-h-0" style={{ maxHeight: 'calc(100vh - 16rem)' }}>
                    {/* Scrollable Products/Categories */}
                    <div className="flex-1 overflow-y-auto">
                      <div className="px-4 pt-4">
                        {isSearchLoading ? (
                          <div className="flex flex-col items-center justify-center py-12">
                            <div className="relative">
                              <Loader2 className="w-12 h-12 text-pink-500 animate-spin" />
                              <div className="absolute inset-0 rounded-full border-4 border-pink-200"></div>
                            </div>
                            <p className="mt-4 text-gray-600 text-sm font-medium">Searching...</p>
                          </div>
                        ) : (
                          <div className="space-y-4 pb-4">
                            {/* Products Section */}
                            {autocompleteData.products && autocompleteData.products.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-4">
                                  <div className="w-8 h-8 rounded-xl bg-pink-500 flex items-center justify-center shadow-sm">
                                    <span className="text-white text-base">🍰</span>
                                  </div>
                                  <h3 className="font-poppins font-semibold text-gray-700 text-xs uppercase tracking-wider leading-relaxed">PRODUCTS</h3>
                                </div>
                                <div className="space-y-3">
                                  {autocompleteData.products.map((product) => {
                                    const price = product.discounted_price || product.base_price
                                    const formattedPrice = price ? (typeof price === 'number' ? formatPrice(price) : price) : null
                                    
                                    return (
                                      <button
                                        key={product.id}
                                        onClick={() => {
                                          addRecentSearch(product.name)
                                          router.push(`/product/${product.slug || product.id}`)
                                          setIsSearchOpen(false)
                                          setSearchQuery('')
                                          setAutocompleteData({ products: [], flavors: [], categories: [] })
                                        }}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-pink-50 border border-pink-200 hover:bg-pink-100 hover:shadow-md transition-all duration-200 text-left group"
                                      >
                                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                                          {product.image_url ? (
                                            <img 
                                              src={product.image_url} 
                                              alt={product.name}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-pink-100">
                                              <span className="text-2xl">🍰</span>
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="font-inter font-semibold text-gray-900 text-sm leading-relaxed group-hover:text-pink-600 transition-colors mb-1 truncate">
                                            {product.name}
                                          </p>
                                          {formattedPrice && (
                                            <p className="font-inter font-semibold text-pink-600 text-sm leading-relaxed">
                                              ₹{formattedPrice}
                                            </p>
                                          )}
                                        </div>
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Categories Section */}
                            {autocompleteData.categories && autocompleteData.categories.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="w-8 h-8 rounded-xl bg-pink-500 flex items-center justify-center shadow-sm">
                                    <span className="text-white text-base">📦</span>
                                  </div>
                                  <h3 className="font-poppins font-bold text-gray-800 text-xs uppercase tracking-wide leading-relaxed">Categories</h3>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {autocompleteData.categories.map((category) => (
                                    <button
                                      key={category.id}
                                      onClick={() => {
                                        addRecentSearch(category.name)
                                        router.push(`/category/${category.slug}`)
                                        setIsSearchOpen(false)
                                        setSearchQuery('')
                                        setAutocompleteData({ products: [], flavors: [], categories: [] })
                                      }}
                                      className="px-4 py-2 bg-purple-50 border border-purple-200 rounded-xl text-purple-700 text-sm font-inter font-semibold hover:bg-purple-100 hover:border-purple-300 hover:shadow-md transition-all duration-200"
                                    >
                                      {category.name}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* No Results */}
                            {(!autocompleteData.products || autocompleteData.products.length === 0) &&
                             (!autocompleteData.categories || autocompleteData.categories.length === 0) && (
                              <div className="text-center py-8">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pink-100 flex items-center justify-center shadow-sm">
                                  <Search className="w-8 h-8 text-gray-400" />
                                </div>
                                <p className="text-gray-600 text-sm font-medium mb-4 leading-relaxed">No suggestions found</p>
                                <button
                                  onClick={() => handleSearchSubmit()}
                                  className="px-6 py-3 bg-pink-500 text-white rounded-xl font-inter font-bold text-sm hover:bg-pink-600 hover:shadow-lg transition-all duration-200 shadow-sm"
                                >
                                  Search anyway
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Fixed View All Results Button - Above Footer */}
                    {(autocompleteData.products?.length > 0 || autocompleteData.categories?.length > 0) && (
                      <div className="px-4 pt-3 pb-4 border-t border-gray-200 bg-white flex-shrink-0">
                        <button
                          onClick={() => handleSearchSubmit()}
                          className="w-full px-4 py-3.5 bg-pink-500 text-white rounded-xl font-inter font-bold text-base hover:bg-pink-600 hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
                        >
                          <span>View all results for "{searchQuery}"</span>
                          <Search className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Trending Searches - Clean Design */}
                {(!searchQuery || searchQuery.trim() === '') && (
                  <div className="max-h-[calc(100vh-12rem)] overflow-y-auto">
                    <div className="px-4 pt-4 pb-12">
                      <div className="flex items-center space-x-2 mb-5">
                        <span className="text-lg">🔥</span>
                        <h3 className="font-poppins font-semibold text-gray-700 text-sm uppercase tracking-wider">TRENDING SEARCHES</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {trendingSearches.map((search, index) => (
                          <button
                            key={index}
                            onClick={() => handleSearchSubmit(search)}
                            className="px-4 py-2 bg-gray-50 rounded-xl text-gray-700 text-sm font-inter font-medium hover:bg-gray-100 transition-colors border border-gray-200 leading-relaxed"
                          >
                            {search}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Recent Searches */}
                    {(!searchQuery || searchQuery.trim() === '') && recentSearches.length > 0 && (
                      <div className="px-4 pt-4 pb-8 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-poppins font-semibold text-gray-700 text-xs uppercase tracking-wider">RECENT SEARCHES</h3>
                          <button
                            onClick={() => {
                              setRecentSearches([])
                              localStorage.removeItem('recentSearches')
                            }}
                            className="text-xs text-gray-500 hover:text-gray-700 transition-colors font-medium"
                          >
                            Clear
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {recentSearches.map((search, index) => (
                            <button
                              key={index}
                              onClick={() => handleSearchSubmit(search)}
                              className="px-4 py-2 bg-gray-50 rounded-xl text-gray-700 text-sm font-inter font-medium hover:bg-gray-100 transition-colors border border-gray-200 leading-relaxed"
                            >
                              {search}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Mobile Backdrop Overlay */}
        {(isCategoryMenuOpen || isMenuClosing) && (
          <div 
            className="fixed top-16 left-0 right-0 bottom-0 bg-black/50 backdrop-blur-sm z-[45] lg:hidden"
            style={{ 
              animation: isMenuClosing 
                ? 'fadeOut 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)' 
                : 'fadeIn 200ms ease-out' 
            }}
            onClick={closeCategoryMenu}
          />
        )}

        {/* Mobile Menu Side Panel */}
        {(isCategoryMenuOpen || isMenuClosing) && (
          <div
            id="mobile-category-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Category menu"
            className="fixed top-16 bottom-16 left-0 w-[90vw] max-w-sm bg-white dark:bg-gray-800 shadow-2xl dark:shadow-black/50 z-50 lg:hidden overflow-y-auto"
            style={{ 
              animation: isMenuClosing 
                ? 'slideOutLeft 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)' 
                : 'slideInLeft 300ms cubic-bezier(0.4, 0, 0.2, 1)',
              willChange: 'transform'
            }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* Mobile Menu Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center z-10">
              <h2 className="font-poppins font-medium text-gray-900 dark:text-gray-100 text-xl leading-normal flex items-center gap-2">
                <div className="w-1.5 h-6 bg-gradient-to-b from-pink-500 to-pink-600 rounded-full"></div>
                <span>Explore</span>
              </h2>
            </div>
            {/* Cake Categories */}
            <div className="p-4">
              <div className="space-y-0">
                {categoriesLoading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 dark:border-pink-400"></div>
                    <p className="mt-2 text-gray-600 dark:text-gray-300 leading-relaxed">Loading categories...</p>
                  </div>
                ) : (
                  categories.map((category, index) => (
                  <div key={category.id}>
                    <div className="rounded-xl" style={{ willChange: 'transform', overflow: 'visible' }}>
                      {/* Category Header */}
                      <button
                        style={{ overflow: 'visible' }}
                        onClick={() => toggleCategory(category.id)}
                        className={`w-full flex items-center justify-between px-4 py-3.5 text-left transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 active:scale-[0.98] group ${
                          expandedCategories[category.id] ? 'bg-transparent dark:bg-transparent border-l-4 border-gray-300 dark:border-gray-600 shadow-sm' : 'bg-white dark:bg-gray-800 hover:border-l-2 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Enhanced Category Marker */}
                          <div className="relative flex-shrink-0" style={{ width: '12px', height: '28px', minWidth: '12px', overflow: 'visible' }}>
                            {(() => {
                              // Use more vibrant colors for better visibility
                              const slug = category.id || category.slug || '';
                              let markerColor = 'bg-gray-500';
                              
                              // Use specific vibrant colors for problematic categories (check slug first)
                              if (slug === 'milestone-year-cakes') {
                                markerColor = 'bg-blue-600'; // Vibrant blue
                              } else if (slug === 'small-treats-desserts') {
                                markerColor = 'bg-orange-600'; // Vibrant orange
                              } else if (slug === 'flowers') {
                                markerColor = 'bg-cyan-600'; // Changed to cyan for better visibility
                              } else if (slug === 'sweets-dry-fruits') {
                                markerColor = 'bg-orange-700'; // Changed to darker orange for better visibility
                              } else if (category.bgColor) {
                                markerColor = category.bgColor.replace('-50', '-500');
                              } else {
                                markerColor = getCategoryBgColor(slug).replace('-50', '-500') || 'bg-gray-500';
                              }
                              return (
                                <>
                                  <div 
                                    className={`rounded-full ${markerColor} shadow-md transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg`} 
                                    style={{ 
                                      width: '12px', 
                                      height: '28px', 
                                      display: 'block', 
                                      position: 'relative', 
                                      zIndex: 10,
                                      minWidth: '12px',
                                      minHeight: '28px',
                                      flexShrink: 0,
                                      imageRendering: 'crisp-edges',
                                      WebkitFontSmoothing: 'antialiased'
                                    }}
                                  ></div>
                                  {/* Removed blur layer for clearer markers */}
                                </>
                              );
                            })()}
                          </div>
                          <span className="font-poppins font-normal text-gray-900 dark:text-gray-100 text-base leading-normal truncate antialiased">
                            {category.name}
                          </span>
                        </div>
                        <div className="flex-shrink-0 relative w-5 h-5 flex items-center justify-center">
                          <Plus 
                            className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-all duration-300 absolute ${
                              expandedCategories[category.id] ? 'opacity-0 rotate-90 scale-75' : 'opacity-100 rotate-0 scale-100'
                            }`}
                          />
                          <Minus 
                            className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-all duration-300 absolute ${
                              expandedCategories[category.id] ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75'
                            }`}
                          />
                        </div>
                      </button>

                      {/* Subcategories */}
                      <div 
                        id={`category-${category.id}-subcategories-mobile`}
                        role="region"
                        aria-labelledby={`category-${category.id}-button-mobile`}
                        className={`bg-transparent dark:bg-gray-700/50 border-l-4 border-gray-300 dark:border-gray-600 overflow-hidden transition-all duration-300 ease-out ${
                          expandedCategories[category.id] 
                            ? 'max-h-[1000px] opacity-100' 
                            : 'max-h-0 opacity-0'
                        }`}
                        style={{
                          transition: 'transform 0.3s ease-out, opacity 0.3s ease-out, padding 0.3s ease-out',
                          transform: expandedCategories[category.id] ? 'translateY(0)' : 'translateY(-8px)',
                          paddingTop: expandedCategories[category.id] ? '0.75rem' : '0',
                          paddingBottom: expandedCategories[category.id] ? '0.75rem' : '0',
                          willChange: 'transform, opacity'
                        }}
                      >
                        <div className="p-3 space-y-1">
                          {category.subcategories.map((subcategory, subIndex) => (
                              <button
                              key={subIndex}
                              role="listitem"
                                onClick={() => handleSubcategoryClick(category.name, subcategory)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  handleSubcategoryClick(category.name, subcategory)
                                }
                              }}
                              aria-label={`${subcategory} in ${category.name}. Press Enter to navigate`}
                              tabIndex={expandedCategories[category.id] ? 0 : -1}
                              className={`w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/70 dark:hover:bg-gray-600/50 transition-all duration-200 group hover:shadow-sm hover:translate-x-1 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-1 ${
                                expandedCategories[category.id] ? 'opacity-100' : 'opacity-0'
                              }`}
                              style={{
                                animationDelay: `${subIndex * 0.05}s`,
                                animation: 'slideDownFade 0.3s ease-out both',
                                transform: 'translateY(0)',
                                willChange: 'transform, opacity'
                              }}
                              >
                              <div className="flex items-center gap-3">
                                {/* Enhanced Subcategory Marker */}
                                <div className="relative flex-shrink-0">
                                  {(() => {
                                    // Use more vibrant colors for better visibility
                                    const slug = category.id || category.slug || '';
                                    let markerColor = 'bg-gray-500';
                                    
                                    // Use specific vibrant colors for problematic categories (check slug first)
                                    if (slug === 'milestone-year-cakes') {
                                      markerColor = 'bg-blue-600'; // Vibrant blue
                                    } else if (slug === 'small-treats-desserts') {
                                      markerColor = 'bg-orange-600'; // Vibrant orange
                                    } else if (slug === 'flowers') {
                                      markerColor = 'bg-cyan-600'; // Changed to cyan for better visibility
                                    } else if (slug === 'sweets-dry-fruits') {
                                      markerColor = 'bg-orange-700'; // Changed to darker orange for better visibility
                                    } else if (category.bgColor) {
                                      markerColor = category.bgColor.replace('-50', '-500');
                                    } else {
                                      markerColor = getCategoryBgColor(slug).replace('-50', '-500') || 'bg-gray-500';
                                    }
                                    return (
                                      <div className={`w-1.5 h-4 rounded-full ${markerColor} opacity-70 shadow-sm transition-all duration-200 group-hover:opacity-100 group-hover:scale-110`}></div>
                                    );
                                  })()}
                                </div>
                                <span className="font-inter font-normal text-sm text-gray-800 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-gray-100 leading-normal truncate transition-colors duration-200 antialiased">
                                    {subcategory}
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                    </div>
                    {/* Line Separator */}
                    {index < categories.length - 1 && (
                      <div className="h-px bg-gray-200 dark:bg-gray-700 my-2"></div>
                    )}
                  </div>
                ))
                )}
              </div>
            </div>

            {/* Useful Links Section */}
            <div className="p-4 pb-6 pt-6 mt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="font-poppins font-normal text-gray-700 dark:text-gray-300 text-xs uppercase tracking-wider mb-4 leading-normal flex items-center">
                <div className="w-1.5 h-5 bg-gradient-to-b from-pink-500 to-pink-600 rounded-full mr-3 shadow-sm"></div>
                Useful Links
              </h3>
              {isAuthenticated && customer && (
                <div className="px-3 py-2 mb-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600" suppressHydrationWarning>
                  <p className="font-inter text-sm font-semibold text-gray-800 dark:text-gray-100 leading-snug truncate">
                    {customer.name || customer.email}
                  </p>
                  <p className="font-inter text-xs text-gray-500 dark:text-gray-400 truncate leading-snug">
                    {customer.email}
                  </p>
                </div>
              )}
              <div className="space-y-2">
                {usefulLinks.map((link, index) => (
                  <button
                    key={index}
                    onClick={async (e) => {
                      e.preventDefault()
                      setIsMobileMenuOpen(false)
                      closeCategoryMenu()
                      
                      if (link.isLogout) {
                        // Handle logout
                        await logout()
                      } else {
                        // Navigate to link
                        router.push(link.href)
                      }
                    }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-pink-500/20 dark:hover:bg-pink-500/30 rounded-xl transition-colors text-left"
                  >
                    <link.icon className="w-5 h-5 text-pink-500 dark:text-pink-400 flex-shrink-0" />
                    <span className="font-inter text-sm text-gray-700 dark:text-gray-300 leading-normal">
                      {link.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            {/* Bottom padding to ensure all content is scrollable */}
            <div className="h-4"></div>
          </div>
        )}
      </div>

      {/* Cart Display Modal */}
      <CartDisplay isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </header>
  )
}

export default Header
