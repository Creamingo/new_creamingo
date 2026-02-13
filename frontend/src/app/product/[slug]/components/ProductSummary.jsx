'use client';

import { useState, useEffect, useRef, useMemo, useLayoutEffect } from 'react';
import { 
  Heart, 
  Share, 
  Star,
  CheckCircle,
  AlertCircle,
  Gift,
  X,
  Layers,
  MapPin,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { usePinCode } from '../../../../contexts/PinCodeContext';
import { useWishlist } from '../../../../contexts/WishlistContext';
import { useCustomerAuth } from '../../../../contexts/CustomerAuthContext';
import { useAuthModal } from '../../../../contexts/AuthModalContext';
import DeliverySlotPreview from '../../../../components/DeliverySlotPreview';
import ProductCombos from './ProductCombos';
import FlavorSelector from './FlavorSelector';
import MakeItAComboModal from './MakeItAComboModal';
import weightTierApi from '../../../../api/weightTierApi';
import addOnApi from '../../../../api/addOnApi';
import { formatPrice } from '../../../../utils/priceFormatter';

const ProductSummary = ({ 
  product, 
  selectedVariant, 
  quantity, 
  onQuantityChange, 
  onAddToCart, 
  onBuyNow, 
  onShare,
  onVariantChange,
  selectedFlavor,
  onFlavorChange,
  onDynamicContentUpdate,
  displayTitle,
  selectedTier,
  onTierChange
}) => {
  const { currentPinCode, isDeliveryAvailable, formatPinCode, getDeliveryLocality, getFormattedDeliveryCharge, validatePinCodeDebounced, tempValidationStatus, tempPinCode, checkPinCode } = usePinCode();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isAuthenticated } = useCustomerAuth();
  const { openAuthModal } = useAuthModal();
  const [localPin, setLocalPin] = useState('');
  const isFavorite = product ? isInWishlist(product.id) : false;
  const [showShareMenu, setShowShareMenu] = useState(false);
  const MESSAGE_LIMIT = 25;
  const [cakeMessage, setCakeMessage] = useState('');
  const [selectedCombos, setSelectedCombos] = useState([]);
  const [showComboModal, setShowComboModal] = useState(false);
  // Load global combo selections synchronously on initial render to prevent layout shift
  const [comboSelections, setComboSelections] = useState(() => {
    // Synchronous initialization to prevent layout shift
    if (typeof window !== 'undefined') {
      try {
        const storageKey = 'global_combo_selections';
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (err) {
        console.error('Error loading global combo selections from localStorage:', err);
      }
    }
    return [];
  });
  const [showToast, setShowToast] = useState(false);
  const [showAddToCartConfirm, setShowAddToCartConfirm] = useState(false);
  const [showDeliveryNotification, setShowDeliveryNotification] = useState(false);
  const pinCodeRef = useRef(null);

  // Sync combo selections from localStorage on mount (backup for SSR/hydration)
  // Primary loading is done synchronously in useState initializer above
  useLayoutEffect(() => {
    const storageKey = 'global_combo_selections';
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Only update if different to prevent unnecessary re-renders
          setComboSelections(prev => {
            const prevIds = prev.map(s => s.id || s.add_on_product_id).sort().join(',');
            const newIds = parsed.map(s => s.id || s.add_on_product_id).sort().join(',');
            return prevIds === newIds ? prev : parsed;
          });
        }
      }
    } catch (err) {
      console.error('Error syncing global combo selections from localStorage:', err);
    }
  }, []); // Run once on mount

  // Save global combo selections to localStorage whenever they change
  useEffect(() => {
    const storageKey = 'global_combo_selections';
    try {
      if (comboSelections.length > 0) {
        localStorage.setItem(storageKey, JSON.stringify(comboSelections));
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch (err) {
      console.error('Error saving global combo selections to localStorage:', err);
    }
  }, [comboSelections]); // Save whenever combo selections change, regardless of product/variant

  // Prevent layout shifts when combo selections update (mobile layout shift fix)
  useEffect(() => {
    // On mobile, ensure viewport doesn't recalculate when combo selections change
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      // Force a stable viewport by preventing layout recalculation
      // This is handled by the fixed footer height and reserved space
      // No scroll position manipulation needed as content height is now stable
    }
  }, [comboSelections.length]); // Only trigger when combo count changes

  // Clear delivery notification once pincode is available
  useEffect(() => {
    if (currentPinCode) {
      setShowDeliveryNotification(false);
    }
  }, [currentPinCode]);

  // Check if all required fields are completed for Add to Cart
  const isAddToCartEnabled = !!currentPinCode;
  const [dynamicContent, setDynamicContent] = useState(null);
  const [isPriceSectionVisible, setIsPriceSectionVisible] = useState(true);
  const priceSectionRef = useRef(null);
  const [weightTierMappings, setWeightTierMappings] = useState({});

  // Get available tiers for selected weight from API
  const getAvailableTiers = async (weight) => {
    if (!weight) return ['1 Tier'];
    
    // Check if we already have the mapping cached
    if (weightTierMappings[weight]) {
      return weightTierMappings[weight].map(tier => `${tier} Tier`);
    }
    
    try {
      const mapping = await weightTierApi.getWeightTierMapping(weight);
      if (mapping && mapping.available_tiers) {
        // Cache the mapping
        setWeightTierMappings(prev => ({
          ...prev,
          [weight]: mapping.available_tiers
        }));
        return mapping.available_tiers.map(tier => `${tier} Tier`);
      }
    } catch (error) {
      console.error('Error fetching weight-tier mapping:', error);
    }
    
    // Fallback to default if API fails
    return ['1 Tier'];
  };

  // Synchronous version for immediate use (only from API data)
  const getAvailableTiersSync = (weight) => {
    if (!weight) return ['1 Tier'];
    
    // Only use cached API data - no hardcoded fallbacks
    if (weightTierMappings[weight]) {
      return weightTierMappings[weight].map(tier => `${tier} Tier`);
    }
    
    // If no cached data, return default and trigger API fetch
    // This ensures we always use real data from the management table
    return ['1 Tier']; // Temporary default until API data loads
  };

  // Calculate pricing
  const getCurrentPrice = () => {
    if (selectedVariant) {
      return selectedVariant.discount_percent > 0 
        ? selectedVariant.discounted_price 
        : selectedVariant.price;
    }
    return product.discount_percent > 0 ? product.discounted_price : product.base_price;
  };

  const getOriginalPrice = () => {
    if (selectedVariant) {
      return selectedVariant.price;
    }
    return product.base_price;
  };

  // Helper: check if delivery details are selected
  const areDeliveryDetailsComplete = () => {
    return !!currentPinCode;
  };

  const scrollToMissingDeliveryDetail = () => {
    try {
      pinCodeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {
      console.error('Error scrolling to missing delivery detail:', e);
    }
  };

  // Enhanced order handlers with delivery detail checks
  const handleAddToCart = async (orderData) => {
    try {
      // Check if delivery details are complete (pincode)
      if (isDeliveryAvailable() && !areDeliveryDetailsComplete()) {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
        scrollToMissingDeliveryDetail();
        return;
      }

      // Format combo selections with correct price structure for cart
      // API returns add_on_product_id (from database combo_selections table)
      // This is the correct field name - use it consistently
      const formattedCombos = comboSelections.map(selection => {
        // Validate that add_on_product_id exists (required database field)
        if (!selection.add_on_product_id) {
          console.error('Combo selection missing add_on_product_id (required database field):', selection);
          return null;
        }
        
        const unitPrice = (selection.discount_percentage > 0 || (selection.discounted_price && selection.discounted_price < selection.price)) 
          ? (selection.discounted_price || selection.price) 
          : selection.price;
        
        return {
          id: selection.id,
          add_on_product_id: selection.add_on_product_id, // Primary field from database (combo_selections table)
          product_name: selection.product_name,
          category_name: selection.category_name,
          image_url: selection.image_url,
          price: selection.price, // Original price
          discounted_price: selection.discounted_price || null,
          discount_percentage: selection.discount_percentage || 0,
          quantity: selection.quantity,
          // Store the actual price to use (discounted or regular)
          unitPrice: unitPrice,
          // Calculate item total
          itemTotal: unitPrice * selection.quantity
        };
      }).filter(combo => combo !== null); // Remove any null entries

      // Call the original onAddToCart function with properly formatted combo data
      if (onAddToCart) {
        await onAddToCart({
          ...orderData,
          combos: formattedCombos,
          totalPrice: totalPrice
        });
      }

    } catch (error) {
      console.error('Error in handleAddToCart:', error);
      throw error;
    }
  };

  const handleBuyNow = async (orderData) => {
    try {
      // Call the original onBuyNow function
      if (onBuyNow) {
        await onBuyNow(orderData);
      }

    } catch (error) {
      console.error('Error in handleBuyNow:', error);
      throw error;
    }
  };

  const handleComboUpdate = (combos) => {
    setSelectedCombos(combos);
    setComboSelections(combos);
    // Save to global localStorage (handled by useEffect, but ensure it's saved immediately)
    const storageKey = 'global_combo_selections';
    try {
      if (combos.length > 0) {
        localStorage.setItem(storageKey, JSON.stringify(combos));
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch (err) {
      console.error('Error saving global combo selections to localStorage:', err);
    }
    // Don't close modal here - let user continue adding products
    // Modal will close only when user clicks "Continue with Combo" button
  };

  const getDiscountPercent = () => {
    if (selectedVariant) {
      return selectedVariant.discount_percent;
    }
    return product.discount_percent;
  };

  const currentPrice = getCurrentPrice();
  const originalPrice = getOriginalPrice();
  const discountPercent = getDiscountPercent();
  const hasDiscount = discountPercent > 0;

  // Memoize combo calculations to prevent unnecessary re-renders and layout shifts
  const comboTotal = useMemo(() => {
    return comboSelections.reduce((sum, selection) => {
      const unitPrice = (selection.discount_percentage > 0 || (selection.discounted_price && selection.discounted_price < selection.price)) 
        ? (selection.discounted_price || selection.price) 
        : selection.price;
      return sum + (unitPrice * selection.quantity);
    }, 0);
  }, [comboSelections]);
  
  // Calculate product-only price (without combos) - for display below title
  const productOnlyPrice = useMemo(() => currentPrice * quantity, [currentPrice, quantity]);
  
  // Calculate total price including combos - for Add to Cart button and other uses
  const totalPrice = useMemo(() => productOnlyPrice + comboTotal, [productOnlyPrice, comboTotal]);

  // Infer servings dynamically from weight when variant changes
  const inferServingsFromWeight = (weightText) => {
    if (!weightText) return null;
    // Normalize to kilograms number
    const lower = String(weightText).toLowerCase().trim();
    let kg = 0;
    const kgMatch = lower.match(/([0-9]*\.?[0-9]+)\s*(kg|kilogram|kilograms)/);
    const gmMatch = lower.match(/([0-9]*\.?[0-9]+)\s*(g|gm|gram|grams)/);
    if (kgMatch) {
      kg = parseFloat(kgMatch[1]);
    } else if (gmMatch) {
      kg = parseFloat(gmMatch[1]) / 1000;
    } else {
      // try parsing like "1500 gm" or "1.5kg" without space
      const compactKg = lower.match(/([0-9]*\.?[0-9]+)kg/);
      if (compactKg) kg = parseFloat(compactKg[1]);
    }
    if (!kg || isNaN(kg)) return null;
    // Heuristic mapping (common cake servings)
    if (kg <= 0.6) return '4–6 servings';
    if (kg <= 1.0) return '8–10 servings';
    if (kg <= 1.5) return '12–15 servings';
    if (kg <= 2.0) return '16–20 servings';
    if (kg <= 2.5) return '20–25 servings';
    if (kg <= 3.0) return '24–30 servings';
    return `${Math.round(kg * 10)}+ servings`;
  };

  // Generate badges
  const badges = [];
  if (product.is_bestseller) badges.push({ text: 'Bestseller', color: 'bg-orange-500' });
  if (product.is_new_launch) badges.push({ text: 'New Launch', color: 'bg-green-500' });
  if (product.is_trending) badges.push({ text: 'Trending', color: 'bg-purple-500' });
  if (product.is_eggless) badges.push({ text: 'Eggless Available', color: 'bg-blue-500' });

  const handleFavoriteToggle = async () => {
    if (!product) return;
    if (!isAuthenticated) {
      if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('pending_wishlist_add', String(product.id));
      openAuthModal();
      return;
    }
    await toggleWishlist(product.id);
  };

  const handleShare = (platform) => {
    setShowShareMenu(false);
    onShare(platform);
  };

  const handleFlavorContentUpdate = (content) => {
    setDynamicContent(content);
    if (onDynamicContentUpdate) {
      onDynamicContentUpdate(content);
    }
  };

  // Handle variant change and reset tier
  const handleVariantChange = (variant) => {
    onVariantChange(variant);
    // Reset to highest available tier when weight changes (if multiple tiers exist)
    const currentWeight = variant?.weight || product.base_weight;
    const availableTiers = getAvailableTiersSync(currentWeight);
    if (onTierChange) {
      // Use the highest tier (last in array) if multiple tiers are available, otherwise first tier
      const targetTier = availableTiers.length > 1 ? availableTiers[availableTiers.length - 1] : availableTiers[0];
      onTierChange(targetTier);
    }
  };

  // Fetch all weight-tier mappings on component mount
  useEffect(() => {
    const fetchAllMappings = async () => {
      try {
        const mappings = await weightTierApi.getAllWeightTierMappings();
        if (mappings && mappings.length > 0) {
          const mappingsObj = {};
          mappings.forEach(mapping => {
            // Store mapping for both exact weight and normalized versions
            mappingsObj[mapping.weight] = mapping.available_tiers;
            
            // Also store normalized versions for different formats
            const normalizedWeight = mapping.weight.toLowerCase().replace(/\s+/g, '').replace('gm', 'g');
            if (normalizedWeight !== mapping.weight) {
              mappingsObj[normalizedWeight] = mapping.available_tiers;
            }
            
            // Store common variations
            if (mapping.weight.includes(' ')) {
              mappingsObj[mapping.weight.replace(/\s+/g, '')] = mapping.available_tiers;
            }
            if (mapping.weight.includes('g') && !mapping.weight.includes('gm')) {
              mappingsObj[mapping.weight.replace('g', 'gm')] = mapping.available_tiers;
            }
          });
          
          setWeightTierMappings(mappingsObj);
          console.log('Loaded weight-tier mappings:', mappingsObj);
        }
      } catch (error) {
        console.error('Error fetching all weight-tier mappings:', error);
      }
    };

    fetchAllMappings();
  }, []); // Run once on mount

  // Set initial tier based on current weight (after mappings are loaded)
  useEffect(() => {
    const currentWeight = selectedVariant?.weight || product.base_weight;
    const availableTiers = getAvailableTiersSync(currentWeight);
    console.log('Setting tier for weight:', currentWeight, 'available tiers:', availableTiers, 'current selectedTier:', selectedTier);
    
    if (availableTiers.length > 0 && (selectedTier === null || !availableTiers.includes(selectedTier)) && onTierChange) {
      // Use the highest tier (last in array) if multiple tiers are available, otherwise first tier
      const targetTier = availableTiers.length > 1 ? availableTiers[availableTiers.length - 1] : availableTiers[0];
      console.log('Setting target tier to:', targetTier);
      onTierChange(targetTier);
    }
  }, [product.base_weight, selectedVariant?.weight, selectedTier, onTierChange, weightTierMappings]);

  // Scroll detection to check if price section is visible
  useEffect(() => {
    const handleScroll = () => {
      if (priceSectionRef.current) {
        const rect = priceSectionRef.current.getBoundingClientRect();
        const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
        setIsPriceSectionVisible(isVisible);
      }
    };

    // Initial check
    handleScroll();

    // Add scroll listener
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  // Render compact star rating with precise half/partial fill using gradients
  const renderStars = (rating, size = 16) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      const fillRatio = Math.max(0, Math.min(1, rating - i)); // 0..1
      const id = `star-grad-${i}`;
      // SVG star path (material design)
      const starPath = "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z";
      stars.push(
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          className="text-yellow-400"
          aria-hidden="true"
        >
          {fillRatio > 0 && fillRatio < 1 && (
            <defs>
              <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset={`${fillRatio * 100}%`} stopColor="currentColor" />
                <stop offset={`${fillRatio * 100}%`} stopColor="#E5E7EB" />
              </linearGradient>
            </defs>
          )}
          <path
            d={starPath}
            fill={
              fillRatio >= 1
                ? 'currentColor'
                : fillRatio <= 0
                  ? '#E5E7EB'
                  : `url(#${id})`
            }
          />
        </svg>
      );
    }
    return stars;
  };

  return (
    <div className="flex flex-col h-full w-full overflow-x-hidden max-w-full">
      {/* Scrollable Content Container */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-6 pb-4 lg:pb-4 pb-32 lg:pb-14 w-full max-w-full" style={{ minWidth: 0 }}>
      {/* Product Title Row (aligned with image top) */}
      <div className="space-y-1 w-full overflow-visible mt-0.5 lg:mt-0 max-w-full">
        <div className="flex items-start justify-between gap-3 w-full min-w-0 overflow-visible max-w-full">
          <div className="flex-1 min-w-0 pr-2 overflow-visible max-w-full">
            <h1 className="text-[17px] sm:text-lg lg:text-[22px] font-semibold text-gray-900 dark:text-gray-100 leading-snug flex items-center gap-2 overflow-visible">
              {/* Veg/Non-Veg icon sized to text using em units for perfect alignment */}
            <span
                className={`inline-flex items-center justify-center align-middle w-[0.95em] h-[0.95em] border-2 ${product.is_eggless ? 'border-green-600 dark:border-green-500' : 'border-red-600 dark:border-red-500'} rounded-[3px] flex-shrink-0`}
            aria-label={product.is_eggless ? 'Eggless (Vegetarian)' : 'Contains Egg (Non‑Vegetarian)'}
            title={product.is_eggless ? 'Eggless (Vegetarian)' : 'Contains Egg (Non‑Vegetarian)'}
          >
                <span className={`block rounded-full ${product.is_eggless ? 'bg-green-600 dark:bg-green-500' : 'bg-red-600 dark:bg-red-500'}`}
                  style={{ width: '0.5em', height: '0.5em' }} />
          </span>
              <span className="leading-snug line-clamp-2">
                {dynamicContent ? dynamicContent.name : (displayTitle || product.name)}
              </span>
        </h1>
        
            {/* Rating and Reviews compact under title (desktop spacing tight) */}
            <div className="mt-1 flex items-center gap-1.5">
              <div className="flex items-center gap-1 flex-shrink-0">
                {renderStars(product.rating || 4.5, 12)}
              </div>
              <span className="text-gray-400 dark:text-gray-500 flex-shrink-0 text-xs">•</span>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 flex-shrink-0">{product.rating_count || 0} ratings</span>
              <span className="text-gray-400 dark:text-gray-500 flex-shrink-0 text-xs">•</span>
              <a className="text-xs font-medium text-gray-600 dark:text-gray-400 underline underline-offset-2 hover:no-underline flex-shrink-0" href="#customer-reviews">
                {product.review_count || 0} reviews
              </a>
            </div>
      </div>

          {/* Desktop actions next to title - flex-shrink-0 prevents cutting */}
          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleFavoriteToggle}
              className={`h-10 px-3 rounded-lg border transition-colors flex items-center justify-center flex-shrink-0 ${
                isFavorite ? 'border-rose-500 dark:border-rose-400 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              aria-label="Save to wishlist"
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center flex-shrink-0"
                aria-label="Share product"
              >
                <Share className="w-5 h-5" />
              </button>
              {showShareMenu && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-xl dark:shadow-black/30 border border-gray-200 dark:border-gray-700 py-2 z-10">
                  <button onClick={() => handleShare('whatsapp')} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">WhatsApp</button>
                  <button onClick={() => handleShare('instagram')} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Instagram</button>
                  <button onClick={() => handleShare('copy')} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Copy Link</button>
                </div>
              )}
            </div>
          </div>
        </div>


        {/* Divider */}
        <div className="h-px bg-gray-200 dark:bg-gray-700" />
      </div>

       {/* Price (left) and Quantity (right) - mobile: single row; laptop: horizontal */}
       <div ref={priceSectionRef} className="flex items-center justify-between gap-3 pt-1 lg:pt-1 pb-2 border-b border-gray-200 dark:border-gray-700 w-full min-w-0 max-w-full overflow-x-hidden overflow-y-visible">
        {/* Pricing */}
        <div className="flex-1 min-w-0 max-w-full overflow-x-hidden">
          {/* Mobile: compact single-row pricing */}
          <div className="lg:hidden">
            {quantity > 1 ? (
              <>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">{formatPrice(productOnlyPrice)}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">({quantity} × {formatPrice(currentPrice)})</span>
                </div>
                {hasDiscount && (
                  <div className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
                    You save {formatPrice((originalPrice - currentPrice) * quantity)} on {quantity} item{quantity > 1 ? 's' : ''}
                  </div>
                )}
                {/* Add-ons breakdown - Mobile - Always render to reserve space and prevent layout shift */}
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 min-h-[16px]">
                  {comboSelections.length > 0 && (
                    <>+ {formatPrice(comboTotal)} add-ons ({comboSelections.length} item{comboSelections.length !== 1 ? 's' : ''})</>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">{formatPrice(currentPrice)}</span>
                  {hasDiscount && (
                    <>
                      <span className="text-xs line-through text-gray-500 dark:text-gray-400">{formatPrice(originalPrice)}</span>
                      <span className="px-2 py-0.5 text-[10px] font-semibold text-white bg-red-500 dark:bg-red-600 rounded-full">
                        {discountPercent}% OFF
                      </span>
                    </>
                  )}
                </div>
                {hasDiscount && (
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                    You save {formatPrice(originalPrice - currentPrice)}
                  </div>
                )}
                {/* Add-ons breakdown - Mobile - Always render to reserve space and prevent layout shift */}
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 min-h-[16px]">
                  {comboSelections.length > 0 && (
                    <>+ {formatPrice(comboTotal)} add-ons ({comboSelections.length} item{comboSelections.length !== 1 ? 's' : ''})</>
                  )}
                </div>
              </>
          )}
        </div>
        
          {/* Laptop/Desktop: horizontal pricing */}
          <div className="hidden lg:flex lg:flex-col lg:gap-1 max-w-full overflow-x-hidden">
            <div className="flex lg:items-baseline lg:flex-wrap gap-3 max-w-full">
              {quantity > 1 ? (
                <>
                  <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">{formatPrice(productOnlyPrice)}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">({quantity} × {formatPrice(currentPrice)})</span>
                  {hasDiscount && (
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                      You save {formatPrice((originalPrice - currentPrice) * quantity)}
                    </span>
                  )}
                </>
              ) : (
                <>
              <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">{formatPrice(currentPrice)}</span>
          {hasDiscount && (
                <div className="flex items-center gap-2">
                  <span className="text-lg text-gray-500 dark:text-gray-400 line-through">{formatPrice(originalPrice)}</span>
                  <span className="px-2 py-0.5 text-xs font-semibold text-white bg-red-500 dark:bg-red-600 rounded-full">{discountPercent}% OFF</span>
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">You save {formatPrice(originalPrice - currentPrice)}</span>
                </div>
              )}
                </>
              )}
            </div>
            {/* Add-ons breakdown - Desktop - Always render to reserve space and prevent layout shift */}
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 min-h-[16px]">
              {comboSelections.length > 0 && (
                <>+ {formatPrice(comboTotal)} add-ons ({comboSelections.length} item{comboSelections.length !== 1 ? 's' : ''})</>
              )}
            </div>
          </div>
      </div>

        {/* Quantity - Compact - pulled up on mobile to align with price; pt on laptop avoids clipping */}
        <div className="shrink-0 -mt-4 lg:mt-0 pt-0.5 lg:pt-0.5">
          <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-900/20 rounded-full px-1.5 py-1 border border-rose-200 dark:border-rose-700">
          <button
            onClick={() => onQuantityChange(quantity - 1)}
            disabled={quantity <= 1}
                className={`${
                  quantity > 1
                    ? 'bg-white dark:bg-gray-800 text-rose-700 dark:text-rose-200 hover:bg-rose-100 dark:hover:bg-rose-900/40'
                    : 'bg-rose-100 dark:bg-rose-900/30 text-rose-400 dark:text-rose-400'
                } w-10 h-10 lg:w-9 lg:h-9 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed rounded-full flex items-center justify-center text-base lg:text-sm`}
                aria-label="Decrease quantity"
              >
                −
          </button>
              <div className="px-2 text-rose-700 dark:text-rose-200 min-w-[28px] text-center text-sm font-semibold select-none">
                {quantity}
              </div>
          <button
            onClick={() => onQuantityChange(quantity + 1)}
                className="w-10 h-10 lg:w-9 lg:h-9 bg-rose-500 dark:bg-rose-600 text-white hover:bg-rose-600 dark:hover:bg-rose-700 rounded-full flex items-center justify-center text-base lg:text-sm active:scale-95"
                aria-label="Increase quantity"
              >
                +
              </button>
          </div>
        </div>
      </div>

      {/* Weight & Servings info */}
      <div className="mt-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border-l-4 border-gray-500 dark:border-gray-600 border border-gray-200 dark:border-gray-700 shadow-lg dark:shadow-xl dark:shadow-black/30 p-3 sm:p-4 lg:p-5 transition-all duration-300 hover:shadow-xl dark:hover:shadow-2xl dark:hover:shadow-black/40 hover:border-gray-400 dark:hover:border-gray-500">
          <div className="space-y-4">
            {/* Variant selector when multiple weights exist */}
            {(() => {
              const variantList = Array.isArray(product?.variants) ? product.variants : [];
              const includesBase = !!product?.base_weight && variantList.some(v => (v.weight || '').toString() === (product.base_weight || '').toString());
              const hasMultiple = (variantList.length + (includesBase ? 0 : (product?.base_weight ? 1 : 0))) > 1;
              return hasMultiple;
            })() ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Weight</span>
                </div>
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 lg:overflow-x-visible">
                  {/* Base weight option (if not duplicated in variants) */}
                  {product.base_weight && !(product.variants || []).some(v => (v.weight || '').toString() === (product.base_weight || '').toString()) && (
                     <button
                       key="base-weight"
                       onClick={() => handleVariantChange(null)}
                       className={`flex-shrink-0 px-3 py-2 rounded-lg border text-sm font-medium transition-colors w-[calc((100vw-3rem)/4)] lg:flex-1 lg:max-w-[calc(25%-0.375rem)] ${
                         !selectedVariant
                           ? 'border-rose-500 dark:border-rose-400 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300'
                           : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                       }`}
                     >
                      {product.base_weight}
                    </button>
                  )}
                  {(product.variants || []).map((variant) => (
                     <button
                       key={variant.id}
                       onClick={() => handleVariantChange(variant)}
                       className={`flex-shrink-0 px-3 py-2 rounded-lg border text-sm font-medium transition-colors w-[calc((100vw-3rem)/4)] lg:flex-1 lg:max-w-[calc(25%-0.375rem)] ${
                         selectedVariant?.id === variant.id
                           ? 'border-rose-500 dark:border-rose-400 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300'
                           : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                       }`}
                     >
                      {variant.weight}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {/* Inline Weight & Servings Display - Always show */}
            <div className="flex items-center gap-6 text-sm">
                <div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Weight: </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{selectedVariant?.weight || product.base_weight || '—'}</span>
                </div>
              <div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Servings: </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {(() => {
                  const fromVariant = inferServingsFromWeight(selectedVariant?.weight);
                  const fromBase = inferServingsFromWeight(product.base_weight);
                  return fromVariant || product.serving_size_description || product.serving_size || fromBase || '—';
                })()}
              </span>
              </div>
            </div>

            {/* Cake Tiers - Inline Radio Style */}
            <div className="text-sm flex items-center">
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Cake Tiers:</span>
              <div className="flex items-center gap-4 ml-3">
                {getAvailableTiersSync(selectedVariant?.weight || product.base_weight).map((tier) => (
                  <label key={tier} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="cakeTiers"
                      value={tier}
                      checked={selectedTier === tier}
                      onChange={() => onTierChange && onTierChange(tier)}
                      className="w-4 h-4 text-rose-600 dark:text-rose-500 border-gray-300 dark:border-gray-600 focus:ring-rose-500 dark:focus:ring-rose-400"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{tier}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Pincode Availability */}
      <div ref={pinCodeRef} className="mt-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border-l-4 border-blue-600 dark:border-blue-500 border border-gray-200 dark:border-gray-700 shadow-lg dark:shadow-xl dark:shadow-black/30 p-3 sm:p-4 lg:p-5 transition-all duration-300 hover:shadow-xl dark:hover:shadow-2xl dark:hover:shadow-black/40 hover:border-blue-400 dark:hover:border-blue-400">
          {/* Header with Icon */}
          <div className="flex items-center gap-2 pb-3 border-b border-gray-200 dark:border-gray-700 mb-4">
            <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">Delivery Location</h3>
          </div>

          {/* Content */}
          {isDeliveryAvailable() && currentPinCode ? (
            <div className="flex items-center justify-between px-3 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">Delivering to {formatPinCode(currentPinCode)}</span>
              </div>
              <button
                onClick={() => {
                  try {
                    setLocalPin('');
                    if (typeof window !== 'undefined') {
                      const ev = new Event(
                        window.innerWidth >= 1024 ? 'open-desktop-pincode-modal' : 'open-pincode-modal'
                      );
                      window.dispatchEvent(ev);
                    }
                  } catch (_) {}
                }}
                className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 underline underline-offset-2"
                type="button"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="w-full min-w-0 h-[52px] sm:h-[56px] rounded-xl border-2 border-pink-200 dark:border-pink-700/60 bg-white dark:bg-gray-800 shadow-sm flex items-stretch overflow-hidden focus-within:border-pink-500 dark:focus-within:border-pink-400 focus-within:ring-2 focus-within:ring-pink-500/20 dark:focus-within:ring-pink-400/20 transition-all duration-200">
              <input
                type="text"
                value={localPin}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setLocalPin(v);
                  validatePinCodeDebounced && validatePinCodeDebounced(v);
                }}
                placeholder="Enter delivery pincode"
                className={`flex-1 min-w-0 bg-transparent outline-none border-none px-3 sm:px-4 h-full text-base sm:text-lg font-poppins font-medium tracking-[0.08em] sm:tracking-[0.12em] text-gray-900 dark:text-gray-100 placeholder:font-poppins placeholder:font-medium placeholder:tracking-wide placeholder:text-pink-300 dark:placeholder:text-pink-600/50 ${
                  tempValidationStatus === 'valid'
                    ? 'text-green-700 dark:text-green-400'
                    : tempValidationStatus === 'invalid'
                      ? 'text-red-700 dark:text-red-400'
                      : ''
                }`}
                maxLength={6}
              />
              <button
                onClick={async () => {
                  if (localPin.length === 6) await (checkPinCode && checkPinCode(localPin));
                }}
                disabled={localPin.length !== 6}
                className="flex-shrink-0 px-4 sm:px-8 h-full min-w-[80px] sm:min-w-[128px] rounded-none rounded-r-[10px] border-l-2 border-pink-300 dark:border-pink-600 bg-pink-600 dark:bg-pink-700 text-white text-sm sm:text-[15px] font-poppins font-semibold tracking-wide disabled:opacity-60 disabled:cursor-not-allowed hover:bg-pink-700 dark:hover:bg-pink-600 active:bg-pink-800 dark:active:bg-pink-800 transition-colors shadow-sm flex items-center justify-center"
                type="button"
                aria-label="Check delivery for pincode"
              >
                Check
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Message on Cake */}
      <div className="mt-6">
        <div className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-xl border border-rose-200 dark:border-rose-800 shadow-lg dark:shadow-xl dark:shadow-black/30 p-3 sm:p-4 lg:p-5 transition-all duration-300 hover:shadow-xl dark:hover:shadow-2xl dark:hover:shadow-black/40">
          {/* Header with Icon */}
          <div className="flex items-center gap-2 pb-3 border-b border-rose-200/70 dark:border-rose-800/60 mb-4">
            <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/40">
              <Gift className="w-4 h-4 text-rose-600 dark:text-rose-300" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
              Personalize Your Cake
              <span className="ml-2 font-normal text-gray-500 dark:text-gray-400">(Optional)</span>
            </h3>
          </div>

          {/* Content */}
          <div className="relative">
            <input
              type="text"
              value={cakeMessage}
              onChange={(e) => setCakeMessage(e.target.value.slice(0, MESSAGE_LIMIT))}
              placeholder="Message on Cake (Optional)"
              maxLength={MESSAGE_LIMIT}
              className="w-full pr-14 pl-4 py-3 text-base sm:text-sm rounded-lg border border-rose-200 dark:border-rose-800 bg-white/90 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-500 dark:focus:ring-rose-400 focus:border-rose-500 dark:focus:border-rose-600 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-gray-100"
            />
            <div
              className={`absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-pink-500 ${
                MESSAGE_LIMIT - cakeMessage.length <= 5 
                  ? 'from-rose-600 to-pink-600' 
                  : ''
              } border border-white/20 backdrop-blur-sm`}
            >
              {MESSAGE_LIMIT - cakeMessage.length}
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Slot Preview - Select at checkout */}
      <div className="mt-6">
        <DeliverySlotPreview className="mb-6" />
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-200 dark:bg-gray-700 my-6" />

      {/* Flavor Selection */}
      <FlavorSelector
        product={product}
        selectedFlavor={selectedFlavor}
        onFlavorChange={onFlavorChange}
        onFlavorContentUpdate={handleFlavorContentUpdate}
      />



      </div>

      {/* Sticky Action Buttons - Desktop Only */}
      <div className="hidden lg:block sticky-buttons w-full">
        {/* Delivery Details Notification - Desktop */}
        {showDeliveryNotification && (
          <div className="px-4 pt-2 pb-1">
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-sm px-3 py-1.5">
              <p className="text-xs font-medium text-red-800 dark:text-red-200">
                Please enter pincode to proceed.
              </p>
            </div>
          </div>
        )}
        <div className="p-4 space-y-3 w-full">
          <div className="flex gap-3 w-full">
            {/* Updated Amount Button - Display Only (20% width) */}
            <div className="w-1/5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 py-1 px-4 rounded-lg font-light text-center border border-gray-300 dark:border-gray-700">
              <div className="text-lg font-medium">{formatPrice(totalPrice)}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-light">Total Price</div>
            </div>
            
            {/* Make it Combo Button (40% width) */}
            <button
              onClick={() => {
                if (!areDeliveryDetailsComplete()) {
                  setShowDeliveryNotification(true);
                  scrollToMissingDeliveryDetail();
                } else {
                  setShowComboModal(true);
                }
              }}
              className="w-2/5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 py-1 px-5 rounded-none border border-rose-300 dark:border-rose-600/50 hover:border-rose-400 dark:hover:border-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-900/20 transition-colors flex items-center justify-center gap-2"
            >
              {comboSelections.length > 0 ? (
                <>
                  <span className="text-sm">✅</span>
                  <span className="font-semibold text-sm tracking-wide">Combo Added ({comboSelections.length})</span>
                </>
              ) : (
                <>
                  <Layers className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" strokeWidth={2.5} />
                  <span className="font-semibold text-sm tracking-wider uppercase">MAKE IT A COMBO</span>
                </>
              )}
            </button>
            
            {/* Add to Cart Button (40% width) */}
            <button
              onClick={async () => {
                if (!areDeliveryDetailsComplete()) {
                  setShowDeliveryNotification(true);
                  scrollToMissingDeliveryDetail();
                  return;
                }
                
                // If combos are selected, show confirmation popup
                if (comboSelections.length > 0) {
                  setShowAddToCartConfirm(true);
                } else {
                  // No combos, add directly to cart
                  try {
                    await handleAddToCart({
                      cakeMessage: cakeMessage
                    });
                  } catch (error) {
                    console.error('Error adding to cart:', error);
                  }
                }
              }}
              className="w-2/5 py-1 px-5 rounded-none transition-colors flex items-center justify-center gap-2 bg-gradient-to-r from-pink-600 to-rose-600 dark:from-pink-700 dark:to-rose-700 text-white hover:from-pink-700 hover:to-rose-700 dark:hover:from-pink-600 dark:hover:to-rose-600 cursor-pointer"
            >
              {/* Modern shopping bag/cart icon */}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="font-semibold text-sm tracking-wider uppercase">ADD TO CART</span>
              <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

       {/* Mobile Sticky Footer - Above category menu (z-[60]) so Add Combo / Add to Cart stay on top when menu is open */}
       <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg dark:shadow-xl dark:shadow-black/30 z-[60]" style={{ willChange: 'transform', transform: 'translateZ(0)', backfaceVisibility: 'hidden', maxWidth: '100vw' }}>
        {/* Delivery Details Notification - Mobile - Always render to reserve space and prevent layout shift */}
         <div className={`px-3 transition-all duration-200 ease-in-out ${showDeliveryNotification ? 'pt-2 pb-1 opacity-100 max-h-20' : 'pt-0 pb-0 opacity-0 max-h-0 overflow-hidden'}`}>
           <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-sm px-3 py-1.5">
             <p className="text-xs font-medium text-red-800 dark:text-red-200">
              Please enter pincode to proceed.
             </p>
           </div>
         </div>
        <div className="px-2 py-2 min-h-[64px]">
          {/* Unified Button Layout - Compact and refined */}
          <div className="w-full flex items-stretch gap-2 h-full">
             {/* Add Combo Button - Fixed height to prevent layout shift */}
             <button
               onClick={() => {
                 if (!areDeliveryDetailsComplete()) {
                   setShowDeliveryNotification(true);
                   scrollToMissingDeliveryDetail();
                 } else {
                   setShowComboModal(true);
                 }
               }}
              className="flex-1 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 py-2.5 px-3 font-semibold border-2 border-rose-200 dark:border-rose-700 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all duration-200 flex items-center justify-center gap-2 text-base shadow-sm hover:shadow-md active:scale-[0.98] min-h-[52px]"
             >
               {comboSelections.length > 0 ? (
                 <>
                   <span className="text-lg flex-shrink-0">✅</span>
                   <span className="font-semibold text-base whitespace-nowrap">Add Combo ({comboSelections.length})</span>
                 </>
               ) : (
                 <>
                   <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 shadow-sm flex-shrink-0">
                     <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                       <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                     </svg>
                   </div>
                  <span className="font-semibold text-lg text-rose-700 dark:text-rose-300 whitespace-nowrap">Add Combo</span>
                 </>
               )}
             </button>
            
             {/* Add to Cart Button - Total price integrated below text */}
             <button
               onClick={async () => {
               if (!areDeliveryDetailsComplete()) {
                  setShowDeliveryNotification(true);
                  scrollToMissingDeliveryDetail();
                  return;
                }
                
                // If combos are selected, show confirmation popup
                if (comboSelections.length > 0) {
                  setShowAddToCartConfirm(true);
                } else {
                  // No combos, add directly to cart
                   try {
                     await handleAddToCart({
                       cakeMessage: cakeMessage
                     });
                   } catch (error) {
                     console.error('Error adding to cart:', error);
                   }
                 }
               }}
              className={`flex-1 py-2.5 px-3 font-medium transition-all duration-200 flex flex-col items-center justify-center gap-0.5 text-sm min-h-[52px] text-center cursor-pointer ${
                isAddToCartEnabled
                  ? 'bg-gradient-to-r from-pink-600 to-rose-600 dark:from-pink-700 dark:to-rose-700 text-white hover:from-pink-700 hover:to-rose-700 dark:hover:from-pink-600 dark:hover:to-rose-600 active:from-pink-700 active:to-rose-700 dark:active:from-pink-800 dark:active:to-rose-800'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}
              style={{ boxShadow: '0 0 0 0 rgba(219, 39, 119, 0.4)' }}
              onMouseEnter={(e) => {
                if (!isAddToCartEnabled) return;
                e.target.style.boxShadow = '0 0 15px rgba(219, 39, 119, 0.4)';
              }}
              onMouseLeave={(e) => {
                if (!isAddToCartEnabled) return;
                e.target.style.boxShadow = '0 0 0 0 rgba(219, 39, 119, 0.4)';
              }}
            >
              {/* Button content - Centered text with icon, price below */}
              <div className="flex flex-col items-center justify-center">
                {/* ADD TO CART text with icon - Centered and larger */}
              <div className="flex items-center justify-center gap-1.5 flex-nowrap">
                  {/* Modern shopping bag/cart icon */}
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
                  <span className="font-medium text-[13px] sm:text-base leading-none mt-0.5 whitespace-nowrap">ADD TO CART</span>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
                </div>
                {/* Total price below - Smaller font */}
                <div className={`text-[10px] font-medium mt-0.5 leading-tight ${
                  isAddToCartEnabled 
                    ? 'text-white/90' 
                    : 'text-gray-400 dark:text-gray-500'
                }`}>
                  {formatPrice(totalPrice)}
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Combo Selection Modal */}
      <MakeItAComboModal
        isOpen={showComboModal}
        onClose={() => setShowComboModal(false)}
        product={product}
        selectedVariant={selectedVariant}
        onComboUpdate={handleComboUpdate}
        baseProductPrice={currentPrice}
        quantity={quantity}
        initialComboSelections={comboSelections}
        onAddToCart={handleAddToCart}
        cakeMessage={cakeMessage}
        currentPinCode={currentPinCode}
        isDeliveryAvailable={isDeliveryAvailable()}
      />

      {/* Add to Cart Confirmation Popup */}
      {showAddToCartConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 dark:bg-black/70 transition-opacity duration-300 z-40"
            onClick={() => setShowAddToCartConfirm(false)}
          />
          
          {/* Popup Content */}
          <div className="relative bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-2xl dark:shadow-2xl dark:shadow-black/50 z-50">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Add to Cart with {comboSelections.length} {comboSelections.length === 1 ? 'Add-on' : 'Add-ons'}?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Your cart will include the main product and {comboSelections.length} selected {comboSelections.length === 1 ? 'add-on' : 'add-ons'}.
            </p>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={async () => {
                  setShowAddToCartConfirm(false);
                  try {
                    await handleAddToCart({
                      cakeMessage: cakeMessage
                    });
                  } catch (error) {
                    console.error('Error adding to cart:', error);
                  }
                }}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-700 dark:to-pink-700 text-white rounded-md hover:from-purple-700 hover:to-pink-700 dark:hover:from-purple-800 dark:hover:to-pink-800 transition-all duration-200 font-semibold"
              >
                Yes, Add to Cart
              </button>
              
              <button
                onClick={() => {
                  setShowAddToCartConfirm(false);
                  setShowComboModal(true);
                }}
                className="w-full py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium rounded-md"
              >
                Edit Combo
              </button>
              
              <button
                onClick={async () => {
                  setShowAddToCartConfirm(false);
                  // Clear global combos and add without add-ons
                  try {
                    // Clear global combo selections from localStorage
                    localStorage.removeItem('global_combo_selections');
                    setComboSelections([]);
                    setSelectedCombos([]);
                    await handleAddToCart({
                      cakeMessage: cakeMessage
                    });
                  } catch (error) {
                    console.error('Error adding to cart:', error);
                  }
                }}
                className="w-full py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium rounded-md"
              >
                Add Without Add-ons
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification for Delivery Slot Requirement */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 bg-orange-500 dark:bg-orange-600 text-white px-6 py-4 rounded-lg shadow-lg dark:shadow-xl dark:shadow-black/30 flex items-center gap-3 max-w-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Delivery Details Required</p>
            <p className="text-sm opacity-90">
              Please enter pincode to continue.
            </p>
          </div>
          <button
            onClick={() => setShowToast(false)}
            className="ml-2 text-white hover:text-gray-200 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductSummary;
