'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShoppingBag, 
  Plus, 
  Minus, 
  Trash2, 
  Tag, 
  Sparkles, 
  Package,
  X,
  CheckCircle,
  Truck,
  Gift,
  ChevronRight,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  AlertTriangle,
  Clock,
  ShoppingCart
} from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { usePinCode } from '../../contexts/PinCodeContext';
import { useToast } from '../../contexts/ToastContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import MobileFooter from '../../components/MobileFooter';
import CartDeals from '../../components/CartDeals';
import ConfirmModal from '../../components/ConfirmModal';
import promoCodeApi from '../../api/promoCodeApi';
import promoCodeTrackingApi from '../../api/promoCodeTrackingApi';
import productApi from '../../api/productApi';
import addOnApi from '../../api/addOnApi';
import settingsApi from '../../api/settingsApi';
import { formatPrice } from '../../utils/priceFormatter';
import { resolveImageUrl } from '../../utils/imageUrl';

// Helper functions for formatting dates and times
const formatDeliveryDate = (date) => {
  if (!date) return '';
  
  // Handle Date object
  if (date instanceof Date) {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  }
  
  // Handle date string (YYYY-MM-DD or ISO format)
  if (typeof date === 'string') {
    try {
      const dateObj = new Date(date);
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toLocaleDateString('en-US', { 
          weekday: 'short', 
          day: 'numeric', 
          month: 'short' 
        });
      }
    } catch (e) {
      // If parsing fails, return as is
    }
  }
  
  return String(date);
};

const formatTime = (timeString) => {
  if (!timeString) return '';
  try {
    const [hours, minutes] = timeString.split(':').map(Number);
    const hour = hours % 12 || 12;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    return `${hour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  } catch {
    return timeString;
  }
};

const formatTimeSlot = (deliverySlot) => {
  if (!deliverySlot) return '';
  // Check if there's a time string
  if (deliverySlot.time) return deliverySlot.time;
  // Check if there's a slot object with time properties
  if (deliverySlot.slot) {
    const { startTime, endTime } = deliverySlot.slot;
    if (startTime && endTime) {
      return `${formatTime(startTime)} - ${formatTime(endTime)}`;
    }
    if (startTime) return formatTime(startTime);
  }
  return 'N/A';
};

// Helper function to generate descriptive label for duplicate items
const getDescriptiveLabel = (item, groupIndex, itemIndex) => {
  // Priority: Delivery date > Add-ons > Flavor > Tier > Variant
  if (item.deliverySlot) {
    const date = item.deliverySlot.date || item.deliverySlot.deliveryDate;
    if (date) {
      const dateStr = formatDeliveryDate(date);
      // Extract day name (e.g., "Fri", "Sat")
      const dayMatch = dateStr.match(/^(\w+),/);
      if (dayMatch) {
        return `${dayMatch[1]} Delivery`;
      }
      // Fallback to full date
      return `${dateStr} Delivery`;
    }
  }
  
  if (item.combos && item.combos.length > 0) {
    return `${item.combos.length} Add-on${item.combos.length > 1 ? 's' : ''}`;
  }
  
  if (item.flavor) {
    const flavorName = item.flavor.name || item.flavor;
    return `${flavorName} Flavor`;
  }
  
  if (item.tier) {
    return `${item.tier} Tier`;
  }
  
  if (item.variant) {
    const variantWeight = item.variant.weight || item.variant.id;
    return `${variantWeight} Weight`;
  }
  
  // Fallback to item number
  return `Item ${itemIndex + 1}`;
};

export default function CartPage() {
  const router = useRouter();
  const { 
    cartItems, 
    savedItems,
    updateQuantity, 
    removeFromCart, 
    getCartSummary,
    isLoading,
    isInitialized,
    saveForLater,
    moveToCart,
    removeSavedItem,
    updateComboItemQuantity,
    removeComboItem,
    updateCartItemCombos,
    autoUpdateExpiredSlots,
    addToCart
  } = useCart();

  // Debug: Log savedItems when they change
  useEffect(() => {
    console.log('Saved items updated:', savedItems);
  }, [savedItems]);

  // Track if we've already run auto-update to prevent repeated notifications
  const hasRunAutoUpdateRef = React.useRef(false);
  const lastCartItemsHashRef = React.useRef('');
  const autoUpdateTimerRef = React.useRef(null);
  
  // Auto-update expired delivery slots when cart is initialized and has items
  // Only run once when cart is first loaded, not on every cartItems change
  useEffect(() => {
    // Clear any existing timer
    if (autoUpdateTimerRef.current) {
      clearTimeout(autoUpdateTimerRef.current);
    }
    
    // Create a simple hash of cart items to detect actual changes (not just reference changes)
    const cartItemsHash = cartItems.map(item => `${item.id}-${item.deliverySlot?.date || 'no-slot'}`).join('|');
    
    if (isInitialized && cartItems.length > 0 && autoUpdateExpiredSlots) {
      // Only run if:
      // 1. We haven't run before, OR
      // 2. The cart items actually changed (not just a reference change) AND we haven't run in the last 10 seconds
      const cartItemsChanged = cartItemsHash !== lastCartItemsHashRef.current;
      const shouldRun = (!hasRunAutoUpdateRef.current && cartItemsChanged) || 
                       (cartItemsChanged && !window.__slotUpdateInProgress);
      
      if (shouldRun) {
        // Mark as run to prevent repeated executions
        hasRunAutoUpdateRef.current = true;
        lastCartItemsHashRef.current = cartItemsHash;
        window.__slotUpdateInProgress = true;
        
        // Small delay to ensure cart is fully loaded
        autoUpdateTimerRef.current = setTimeout(() => {
          autoUpdateExpiredSlots().catch(error => {
            console.error('Error auto-updating expired slots:', error);
            // Reset flag on error so it can retry if needed
            hasRunAutoUpdateRef.current = false;
            window.__slotUpdateInProgress = false;
          }).finally(() => {
            // Clear the progress flag after a delay
            setTimeout(() => {
              window.__slotUpdateInProgress = false;
            }, 2000);
          });
        }, 1000);
      }
    }
    
    // Reset flag when cart becomes empty
    if (cartItems.length === 0) {
      hasRunAutoUpdateRef.current = false;
      lastCartItemsHashRef.current = '';
      window.__slotUpdateInProgress = false;
    }
    
    return () => {
      if (autoUpdateTimerRef.current) {
        clearTimeout(autoUpdateTimerRef.current);
      }
    };
  }, [isInitialized, cartItems.length, autoUpdateExpiredSlots]);
  
  const { 
    deliveryInfo, 
    getFormattedDeliveryCharge,
    currentPinCode 
  } = usePinCode();
  
  const { showSuccess, showError, showInfo } = useToast();

  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [suggestedPromos, setSuggestedPromos] = useState([]);
  const [promoValidationState, setPromoValidationState] = useState(null); // 'validating', 'valid', 'invalid', null
  const [previewDiscount, setPreviewDiscount] = useState(null); // Preview discount amount
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [savingItemId, setSavingItemId] = useState(null);
  const [removingItemId, setRemovingItemId] = useState(null);
  const [movingItemId, setMovingItemId] = useState(null);
  const [removingSavedItemId, setRemovingSavedItemId] = useState(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSavedForLaterOpen, setIsSavedForLaterOpen] = useState(true);
  const [isSuggestedPromosOpen, setIsSuggestedPromosOpen] = useState(false);
  const [isYouMayAlsoLikeOpen, setIsYouMayAlsoLikeOpen] = useState(true);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [swipeState, setSwipeState] = useState({});
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [selectedItemForActions, setSelectedItemForActions] = useState(null);
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const [suggestedProductsLoading, setSuggestedProductsLoading] = useState(false);
  // Recommendation sections: addOns, gift (flowers/sweets), smallTreats, premiumCakes
  const [suggestedSections, setSuggestedSections] = useState({
    addOns: [],
    gift: [],
    smallTreats: [],
    premiumCakes: []
  });
  const [suggestedSectionsLoading, setSuggestedSectionsLoading] = useState(false);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(1500); // Default value, will be fetched from API
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
    variant: 'danger',
    onConfirm: null
  });

  const openConfirmModal = (options) => {
    setConfirmModal(prev => ({ ...prev, open: true, ...options }));
  };
  const closeConfirmModal = () => {
    setConfirmModal(prev => ({ ...prev, open: false, onConfirm: null }));
  };
  const handleConfirmModalConfirm = () => {
    confirmModal.onConfirm?.();
    closeConfirmModal();
  };

  // Fetch suggested products (legacy single list, kept for fallback)
  useEffect(() => {
    const fetchSuggestedProducts = async () => {
      if (!mounted || !isInitialized) return;
      
      setSuggestedProductsLoading(true);
      try {
        const [treatsResponse, sweetsResponse] = await Promise.all([
          productApi.getProductsByCategory('small-treats-desserts', null, { page: 1, limit: 8 }),
          productApi.getProductsByCategory('sweets-dry-fruits', null, { page: 1, limit: 8 })
        ]);
        const treatsProducts = treatsResponse?.products || treatsResponse?.data?.products || [];
        const sweetsProducts = sweetsResponse?.products || sweetsResponse?.data?.products || [];
        const allProducts = [...treatsProducts, ...sweetsProducts];
        const shuffled = allProducts.sort(() => Math.random() - 0.5);
        const cartProductIds = new Set(cartItems.map(item => item.product?.id));
        const filteredProducts = shuffled.filter(p => !cartProductIds.has(p.id)).slice(0, 15);
        setSuggestedProducts(filteredProducts);
      } catch (error) {
        console.error('Error fetching suggested products:', error);
        setSuggestedProducts([]);
      } finally {
        setSuggestedProductsLoading(false);
      }
    };
    fetchSuggestedProducts();
  }, [mounted, isInitialized, cartItems.length]);

  // Fetch all 4 recommendation sections: Add-ons, Gift (flowers/sweets), Small Treats, Premium Cakes
  useEffect(() => {
    const extractProducts = (res) => res?.products || res?.data?.products || [];
    const cartProductIds = new Set(cartItems.map(item => item.product?.id));

    const fetchSections = async () => {
      if (!mounted || !isInitialized) return;
      setSuggestedSectionsLoading(true);
      try {
        const [
          addOnProductsAll,
          flowersRes,
          sweetsRes,
          treatsRes,
          premiumRes
        ] = await Promise.all([
          addOnApi.getAddOnProducts(),
          productApi.getProductsByCategory('flowers', null, { page: 1, limit: 6 }),
          productApi.getProductsByCategory('sweets-dry-fruits', null, { page: 1, limit: 6 }),
          productApi.getProductsByCategory('small-treats-desserts', null, { page: 1, limit: 6 }),
          productApi.getProductsByCategory('crowd-favorite-cakes', null, { page: 1, limit: 2, sortBy: 'price-high' })
        ]);

        const flowers = extractProducts(flowersRes);
        const sweets = extractProducts(sweetsRes);
        const giftCombined = [...flowers, ...sweets].sort(() => Math.random() - 0.5).slice(0, 6);
        const giftFiltered = giftCombined.filter(p => !cartProductIds.has(p.id));

        const treats = extractProducts(treatsRes).filter(p => !cartProductIds.has(p.id)).slice(0, 6);
        const premium = extractProducts(premiumRes).filter(p => !cartProductIds.has(p.id)).slice(0, 2);

        const addOns = Array.isArray(addOnProductsAll) ? addOnProductsAll.slice(0, 8) : [];

        setSuggestedSections({
          addOns,
          gift: giftFiltered,
          smallTreats: treats,
          premiumCakes: premium
        });
      } catch (error) {
        console.error('Error fetching recommendation sections:', error);
        setSuggestedSections({ addOns: [], gift: [], smallTreats: [], premiumCakes: [] });
      } finally {
        setSuggestedSectionsLoading(false);
      }
    };
    fetchSections();
  }, [mounted, isInitialized, cartItems.length]);

  // Expand all items by default when cart items change
  useEffect(() => {
    if (cartItems.length > 0) {
      setExpandedItems(prev => {
        const newSet = new Set(prev);
        // Add all item IDs that have expandable content
        cartItems.forEach(item => {
          const hasExpandableContent = (!item.is_deal_item && (item.combos?.length > 0 || item.deliverySlot || item.cakeMessage));
          if (hasExpandableContent) {
            newSet.add(item.id);
          }
        });
        return newSet;
      });
    }
  }, [cartItems]);

  // Track when component is mounted on client to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch free delivery threshold from settings
  useEffect(() => {
    const fetchFreeDeliveryThreshold = async () => {
      try {
        const threshold = await settingsApi.getFreeDeliveryThreshold();
        setFreeDeliveryThreshold(threshold);
      } catch (error) {
        console.error('Error fetching free delivery threshold:', error);
        // Keep default value of 1500 on error
      }
    };

    if (mounted) {
      fetchFreeDeliveryThreshold();
    }
  }, [mounted]);

  // Helper function to calculate combo total (matches CartContext logic)
  const calculateComboTotal = (combos) => {
    if (!combos || combos.length === 0) return 0;
    return combos.reduce((sum, combo) => {
      // Use unitPrice if available (pre-calculated with discount)
      if (combo.unitPrice !== undefined) {
        return sum + (combo.unitPrice * combo.quantity);
      }
      // Otherwise, calculate from discounted_price or price
      const comboUnitPrice = (combo.discount_percentage > 0 || (combo.discounted_price && combo.discounted_price < combo.price))
        ? (combo.discounted_price || combo.price)
        : combo.price;
      return sum + (comboUnitPrice * combo.quantity);
    }, 0);
  };

  // Helper function to get combo unit price for display
  const getComboUnitPrice = (combo) => {
    if (combo.unitPrice !== undefined) {
      return combo.unitPrice;
    }
    return (combo.discount_percentage > 0 || (combo.discounted_price && combo.discounted_price < combo.price))
      ? (combo.discounted_price || combo.price)
      : combo.price;
  };

  // Recalculate cart summary whenever cartItems changes
  // This ensures the Order Summary updates when quantity changes
  const cartSummary = useMemo(() => getCartSummary(), [cartItems]);
  const deliveryCharge = deliveryInfo?.deliveryCharge || 0;
  
  // Separate regular items and deal items
  const regularItemsTotal = useMemo(() => {
    return cartItems
      .filter(item => !item.is_deal_item)
      .reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  }, [cartItems]);
  
  const dealItemsTotal = useMemo(() => {
    return cartItems
      .filter(item => item.is_deal_item)
      .reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  }, [cartItems]);
  
  // Subtotal excludes deal items
  const subtotal = regularItemsTotal;
  const promoDiscount = appliedPromo?.discount || 0;
  const isFreeDeliveryEligible = subtotal >= freeDeliveryThreshold;
  // Only add delivery charge if free delivery is not eligible
  const effectiveDeliveryCharge = isFreeDeliveryEligible ? 0 : deliveryCharge;
  // Total includes subtotal (regular items) + deal items - promo discount + delivery
  const total = Math.max(0, subtotal + dealItemsTotal - promoDiscount + effectiveDeliveryCharge);
  const amountToFreeDelivery = Math.max(0, freeDeliveryThreshold - subtotal);
  
  // Count regular items for subtotal display
  const regularItemsCount = useMemo(() => {
    return cartItems
      .filter(item => !item.is_deal_item)
      .reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  // Calculate item counts by type
  const itemCounts = useMemo(() => {
    let mainProductsCount = 0;
    let comboItemsCount = 0;
    let dealItemsCount = 0;
    
    cartItems.forEach(item => {
      if (item.is_deal_item) {
        // Count deal items
        dealItemsCount += item.quantity || 1;
      } else {
        // Count main products (regular items)
        mainProductsCount += item.quantity || 1;
        // Count combo items attached to this main product
      if (item.combos && Array.isArray(item.combos)) {
        item.combos.forEach(combo => {
            comboItemsCount += combo.quantity || 1;
        });
        }
      }
    });
    
    return {
      mainProducts: mainProductsCount,
      comboItems: comboItemsCount,
      dealItems: dealItemsCount,
      total: mainProductsCount + comboItemsCount + dealItemsCount
    };
  }, [cartItems]);

  // Calculate total item count including combo items (using the new breakdown)
  const totalItemCount = useMemo(() => {
    return itemCounts.total;
  }, [itemCounts]);

  const handleQuantityChange = async (itemId, newQuantity) => {
    // Find the item to check if it's a deal item
    const item = cartItems.find(i => i.id === itemId);
    
    // Deal items are restricted to quantity 1 - prevent quantity changes
    if (item?.is_deal_item) {
      // If trying to increase quantity, show a message and don't update
      if (newQuantity > 1) {
        showError('Deal items are limited to 1 quantity');
        return;
      }
      // If trying to decrease to 0, remove it
      if (newQuantity < 1) {
        handleRemoveItem(itemId);
        return;
      }
    }
    
    if (newQuantity < 1) {
      handleRemoveItem(itemId);
      return;
    }
    updateQuantity(itemId, newQuantity);
  };

  const handleRemoveItem = async (itemId) => {
    openConfirmModal({
      title: 'Remove item?',
      message: 'Do you want to delete this item from your cart?',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'danger',
      onConfirm: () => {
        setRemovingItemId(itemId);
        setTimeout(() => {
          removeFromCart(itemId);
          setRemovingItemId(null);
        }, 300);
      }
    });
  };

  // Handle combo item quantity change
  const handleComboQuantityChange = (itemId, comboId, newQuantity) => {
    if (newQuantity < 1) {
      // Remove combo item if quantity is 0
      handleRemoveComboItem(itemId, comboId);
      return;
    }
    updateComboItemQuantity(itemId, comboId, newQuantity);
  };

  // Handle combo item removal
  const handleRemoveComboItem = (itemId, comboId) => {
    const item = cartItems.find(i => i.id === itemId);
    const combo = item?.combos?.find(c => 
      c.id === comboId || (c.product_id && c.product_id.toString() === comboId.toString())
    );
    if (!combo) return;
    openConfirmModal({
      title: 'Remove from combo?',
      message: `Remove ${combo.product_name} from this combo?`,
      confirmLabel: 'Remove',
      cancelLabel: 'Cancel',
      variant: 'danger',
      onConfirm: () => {
        removeComboItem(itemId, comboId);
        showSuccess('Combo Item Removed', `${combo.product_name} has been removed from the combo.`);
      }
    });
  };

  // Load applied promo from localStorage on mount and sync with localStorage
  useEffect(() => {
    const checkAndLoadPromo = () => {
      const savedPromo = localStorage.getItem('applied_promo');
      
      if (!savedPromo) {
        // No promo in localStorage - clear state if it exists
        if (appliedPromo) {
          setAppliedPromo(null);
          setPromoCode('');
          setPromoError('');
          setPreviewDiscount(null);
          setPromoValidationState(null);
        }
        return;
      }

      try {
        const promoData = JSON.parse(savedPromo);
        const promoDiscount = promoData?.discount || 0;
        
        // Validate promo
        if (promoDiscount <= 0 || !promoData?.code) {
          // Invalid promo, clear everything
          localStorage.removeItem('applied_promo');
          setAppliedPromo(null);
          setPromoCode('');
          setPromoError('');
          setPreviewDiscount(null);
          setPromoValidationState(null);
          return;
        }

        // Valid promo - update state if it doesn't match
        if (!appliedPromo || appliedPromo.code !== promoData.code || appliedPromo.discount !== promoData.discount) {
          setAppliedPromo(promoData);
        }
      } catch (err) {
        console.error('Error loading/validating saved promo:', err);
        // Clear corrupted promo data
        localStorage.removeItem('applied_promo');
        setAppliedPromo(null);
        setPromoCode('');
        setPromoError('');
        setPreviewDiscount(null);
        setPromoValidationState(null);
      }
    };

    // Check and load on mount
    checkAndLoadPromo();

    // Listen for storage events (for cross-tab sync)
    const handleStorageChange = (e) => {
      if (e.key === 'applied_promo') {
        checkAndLoadPromo();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [appliedPromo]);

  // Load suggested promos on mount
  useEffect(() => {
    const loadPromos = async () => {
      try {
        const promos = await promoCodeApi.getPromoCodes(true);
        setSuggestedPromos(promos.slice(0, 3)); // Get first 3 active promos
      } catch (error) {
        console.error('Error loading promo codes:', error);
      }
    };
    loadPromos();
  }, []);

  // Track views when suggested promos are displayed
  useEffect(() => {
    if (isSuggestedPromosOpen && suggestedPromos.length > 0) {
      suggestedPromos.slice(0, 3).forEach((promo) => {
        if (promo.code) {
          promoCodeTrackingApi.trackView(promo.code);
        }
      });
    }
  }, [isSuggestedPromosOpen, suggestedPromos]);

  const handleSaveForLater = (itemId) => {
    setSavingItemId(itemId);
    try {
      const result = saveForLater(itemId);
      if (result.success) {
        // Item successfully saved for later - state will update automatically
        console.log('Item saved for later successfully');
      } else {
        console.error('Failed to save item:', result.error);
      }
    } catch (error) {
      console.error('Error saving item for later:', error);
    } finally {
      setTimeout(() => {
        setSavingItemId(null);
      }, 300);
    }
  };

  const handleMoveToCart = (savedItemId) => {
    setMovingItemId(savedItemId);
    const result = moveToCart(savedItemId);
    setTimeout(() => {
      setMovingItemId(null);
      if (result.success) {
        // Item successfully moved back to cart
      }
    }, 300);
  };

  const handleRemoveSavedItem = (savedItemId) => {
    openConfirmModal({
      title: 'Remove from saved?',
      message: 'Remove this item from saved items?',
      confirmLabel: 'Remove',
      cancelLabel: 'Cancel',
      variant: 'danger',
      onConfirm: () => {
        setRemovingSavedItemId(savedItemId);
        setTimeout(() => {
          removeSavedItem(savedItemId);
          setRemovingSavedItemId(null);
        }, 300);
      }
    });
  };

  // Real-time validation with debouncing
  useEffect(() => {
    if (!promoCode.trim() || appliedPromo) {
      setPromoValidationState(null);
      setPreviewDiscount(null);
      setPromoError('');
      return;
    }

    // Debounce validation
    const validationTimer = setTimeout(async () => {
      if (promoCode.trim().length >= 3) {
        setPromoValidationState('validating');
        try {
          const result = await promoCodeApi.validatePromoCode(promoCode, subtotal);
          const discountAmount = result.discount_amount || 0;
          setPreviewDiscount(discountAmount);
          setPromoValidationState('valid');
          setPromoError('');
        } catch (error) {
          setPromoValidationState('invalid');
          setPreviewDiscount(null);
          // Only show error if code is complete (not while typing)
          if (promoCode.trim().length >= 6) {
            const errorMessage = error.message || 'Invalid promo code';
            setPromoError(errorMessage);
          } else {
            setPromoError('');
          }
        }
      } else {
        setPromoValidationState(null);
        setPreviewDiscount(null);
        setPromoError('');
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(validationTimer);
  }, [promoCode, subtotal, appliedPromo]);

  const handleApplyPromo = async () => {
    setPromoError('');
    setIsApplyingPromo(true);

    try {
      const result = await promoCodeApi.validatePromoCode(promoCode, subtotal);
      const promoData = {
        code: result.promo_code,
        description: result.description,
        discount: result.discount_amount,
        discount_type: result.discount_type,
        discount_value: result.discount_value
      };
      setAppliedPromo(promoData);
      // Save to localStorage for checkout
      localStorage.setItem('applied_promo', JSON.stringify(promoData));
      setPromoCode('');
      setPreviewDiscount(null);
      setPromoValidationState(null);
      
      // Trigger success animation
      setShowSuccessAnimation(true);
      setTimeout(() => setShowSuccessAnimation(false), 3000);
      
      // Show success toast notification
      const discountText = promoData.discount_type === 'percentage' 
        ? `${promoData.discount_value}% off`
        : `${formatPrice(promoData.discount)} off`;
      showSuccess(
        'Promo Code Applied! 🎉',
        `You saved ${formatPrice(promoData.discount)} with ${promoData.code}!`
      );
    } catch (error) {
      // Extract user-friendly error message
      const errorMessage = error.message || 'Invalid promo code';
      setPromoError(errorMessage);
      setPromoValidationState('invalid');
      
      // Only show error toast if it's not a network error (those are handled differently)
      if (!errorMessage.includes('connect') && !errorMessage.includes('network')) {
        showError(
          'Promo Code Invalid',
          errorMessage
        );
      } else {
        showError(
          'Connection Error',
          errorMessage
        );
      }
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    const removedCode = appliedPromo?.code || '';
    const currentSubtotal = subtotal;
    setAppliedPromo(null);
    localStorage.removeItem('applied_promo');
    setPromoCode('');
    setPromoError('');
    setPreviewDiscount(null);
    setPromoValidationState(null);
    
    // Track promo code abandon
    if (removedCode) {
      promoCodeTrackingApi.trackAbandon(removedCode, currentSubtotal);
      showSuccess(
        'Promo Code Removed',
        `${removedCode} has been removed from your order.`
      );
    }
  };

  const handleClearPromoCode = () => {
    setPromoCode('');
    setPromoError('');
    setPreviewDiscount(null);
    setPromoValidationState(null);
  };

  const handleSuggestedPromo = async (promo) => {
    setPromoCode(promo.code);
    setPromoError('');
    setIsApplyingPromo(true);

    try {
      const result = await promoCodeApi.validatePromoCode(promo.code, subtotal);
      const promoData = {
        code: result.promo_code,
        description: result.description,
        discount: result.discount_amount,
        discount_type: result.discount_type,
        discount_value: result.discount_value
      };
      setAppliedPromo(promoData);
      // Save to localStorage for checkout
      localStorage.setItem('applied_promo', JSON.stringify(promoData));
      setPromoCode('');
      setPreviewDiscount(null);
      setPromoValidationState(null);
      
      // Track promo code application
      promoCodeTrackingApi.trackApply(promoData.code, subtotal);
      
      // Trigger success animation
      setShowSuccessAnimation(true);
      setTimeout(() => setShowSuccessAnimation(false), 3000);
      
      // Show success toast notification
      const discountText = promoData.discount_type === 'percentage' 
        ? `${promoData.discount_value}% off`
        : `${formatPrice(promoData.discount)} off`;
      showSuccess(
        'Promo Code Applied! 🎉',
        `You saved ${formatPrice(promoData.discount)} with ${promoData.code}!`
      );
    } catch (error) {
      setPromoError(error.message || 'Failed to apply promo code');
      setPromoValidationState('invalid');
      showError(
        'Promo Code Invalid',
        error.message || 'The promo code could not be applied.'
      );
    } finally {
      setIsApplyingPromo(false);
    }
  };

  // State for duplicate validation modal
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState([]);

  // Function to detect duplicate base products with variations
  // Accepts optional items array to use instead of current cartItems (for real-time updates)
  const detectDuplicateProducts = (itemsToCheck = null) => {
    const groups = [];
    const processed = new Set();

    // Use provided items or fall back to current cartItems
    const items = itemsToCheck || cartItems;
    
    // Filter out deal items for comparison (only check main products)
    const mainProducts = items.filter(item => !item.is_deal_item);

    for (let i = 0; i < mainProducts.length; i++) {
      if (processed.has(i)) continue;

      const item1 = mainProducts[i];
      const baseProductId = item1.product?.id;
      if (!baseProductId) continue;

      const similarItems = [item1];
      let hasVariations = false;
      
      for (let j = i + 1; j < mainProducts.length; j++) {
        if (processed.has(j)) continue;

        const item2 = mainProducts[j];
        if (item2.product?.id !== baseProductId) continue;

        // Check if they have different variations
        const differences = [];
        
        // Check delivery slot
        const slot1 = item1.deliverySlot;
        const slot2 = item2.deliverySlot;
        const slot1Date = slot1?.date || slot1?.deliveryDate;
        const slot2Date = slot2?.date || slot2?.deliveryDate;
        const slot1Time = slot1?.time || slot1?.slot?.startTime || slot1?.slot?.id;
        const slot2Time = slot2?.time || slot2?.slot?.startTime || slot2?.slot?.id;
        
        if (slot1Date !== slot2Date || slot1Time !== slot2Time) {
          differences.push('Delivery Time Slot');
          hasVariations = true;
        }

        // Check combos/add-ons
        const combos1 = item1.combos || [];
        const combos2 = item2.combos || [];
        const normalizeCombo = (combo) => {
          const productId = combo.add_on_product_id || combo.product_id;
          return `${productId}-${combo.quantity}`;
        };
        const combos1Str = combos1.map(normalizeCombo).sort().join(',');
        const combos2Str = combos2.map(normalizeCombo).sort().join(',');
        
        if (combos1Str !== combos2Str) {
          differences.push('Add-ons/Combos');
          hasVariations = true;
        }

        // Check flavor
        const flavor1 = item1.flavor?.id || item1.flavor?.name;
        const flavor2 = item2.flavor?.id || item2.flavor?.name;
        if (flavor1 !== flavor2) {
          differences.push('Flavor');
          hasVariations = true;
        }

        // Check tier
        if (item1.tier !== item2.tier) {
          differences.push('Tier');
          hasVariations = true;
        }

        // Check variant (weight)
        const variant1 = item1.variant?.id || item1.variant?.weight;
        const variant2 = item2.variant?.id || item2.variant?.weight;
        if (variant1 !== variant2) {
          differences.push('Weight/Variant');
          hasVariations = true;
        }

        // Add item2 to similarItems if it's the same product (regardless of differences)
        // This catches both exact duplicates and variations
        similarItems.push(item2);
        processed.add(j);
      }

      // If we found multiple instances of the same product, add to groups
      // This includes both exact duplicates and variations
      if (similarItems.length > 1) {
        // Determine actual differences by comparing items in the group
        const actualDifferences = new Set();
        
        // Compare each item with the first item to find actual differences
        for (let k = 1; k < similarItems.length; k++) {
          const firstItem = similarItems[0];
          const compareItem = similarItems[k];
          
          // Check delivery slot differences
          const slot1 = firstItem.deliverySlot;
          const slot2 = compareItem.deliverySlot;
          const slot1Date = slot1?.date || slot1?.deliveryDate;
          const slot2Date = slot2?.date || slot2?.deliveryDate;
          const slot1Time = slot1?.time || slot1?.slot?.startTime || slot1?.slot?.id;
          const slot2Time = slot2?.time || slot2?.slot?.startTime || slot2?.slot?.id;
          if (slot1Date !== slot2Date || slot1Time !== slot2Time) {
            actualDifferences.add('Delivery Time Slot');
          }
          
          // Check combos/add-ons differences
          const combos1 = firstItem.combos || [];
          const combos2 = compareItem.combos || [];
          const normalizeCombo = (combo) => {
            const productId = combo.add_on_product_id || combo.product_id;
            return `${productId}-${combo.quantity}`;
          };
          const combos1Str = combos1.map(normalizeCombo).sort().join(',');
          const combos2Str = combos2.map(normalizeCombo).sort().join(',');
          if (combos1Str !== combos2Str) {
            actualDifferences.add('Add-ons/Combos');
          }
          
          // Check flavor differences
          const flavor1 = firstItem.flavor?.id || firstItem.flavor?.name;
          const flavor2 = compareItem.flavor?.id || compareItem.flavor?.name;
          if (flavor1 !== flavor2) {
            actualDifferences.add('Flavor');
          }
          
          // Check tier differences
          if (firstItem.tier !== compareItem.tier) {
            actualDifferences.add('Tier');
          }
          
          // Check variant/weight differences
          const variant1 = firstItem.variant?.id || firstItem.variant?.weight;
          const variant2 = compareItem.variant?.id || compareItem.variant?.weight;
          if (variant1 !== variant2) {
            actualDifferences.add('Weight/Variant');
          }
        }

        groups.push({
          productName: item1.product?.name || 'Product',
          productId: baseProductId,
          items: similarItems,
          differences: Array.from(actualDifferences),
          hasVariations: hasVariations
        });
        processed.add(i);
      }
    }

    return groups;
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    
    // Check for duplicate base products with variations
    const duplicates = detectDuplicateProducts();
    
    // Debug logging (can be removed in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('Cart items:', cartItems.map(item => ({
        id: item.id,
        productId: item.product?.id,
        productName: item.product?.name,
        isDeal: item.is_deal_item
      })));
      console.log('Detected duplicates:', duplicates);
    }
    
    if (duplicates.length > 0) {
      setDuplicateGroups(duplicates);
      setShowDuplicateModal(true);
      return;
    }
    
    // No duplicates, proceed normally
    // Use push instead of replace to preserve Cart in history
    // This ensures browser back button from Checkout goes to Cart
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('navigated_from_cart', 'true');
    }
    router.push('/checkout');
  };

  const handleContinueToCheckout = () => {
    setShowDuplicateModal(false);
    // Small delay to allow modal close animation, then redirect to checkout
    // Use push instead of replace to preserve Cart in history
    // This ensures browser back button from Checkout goes to Cart
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('navigated_from_cart', 'true');
      }
      router.push('/checkout');
    }, 200);
  };

  const handleReviewItems = () => {
    setShowDuplicateModal(false);
    // Redirect to cart page to review items
    // Small delay to allow modal close animation
    setTimeout(() => {
      router.push('/cart');
    }, 200);
  };

  const handleContinueShopping = () => {
    router.push('/');
  };

  // Calculate progress percentage for free delivery
  const freeDeliveryProgress = Math.min(100, (subtotal / freeDeliveryThreshold) * 100);

  // Toggle item details expansion
  const toggleItemExpansion = (itemId) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Swipe gesture handlers for mobile
  const handleTouchStart = (e, itemId) => {
    const touch = e.touches[0];
    setSwipeState(prev => ({
      ...prev,
      [itemId]: {
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        isSwiping: false
      }
    }));
  };

  const handleTouchMove = (e, itemId) => {
    if (!swipeState[itemId]) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - swipeState[itemId].startX;
    const deltaY = Math.abs(touch.clientY - swipeState[itemId].startY);
    
    // Only allow horizontal swipe (not vertical scrolling)
    // We don't call preventDefault() to avoid passive listener warnings
    // CSS touch-action: pan-y allows vertical scrolling while we track horizontal swipes
    if (Math.abs(deltaX) > 10 && deltaY < 50) {
      setSwipeState(prev => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          currentX: touch.clientX,
          isSwiping: true
        }
      }));
    }
  };

  const handleTouchEnd = (e, itemId) => {
    if (!swipeState[itemId]) return;
    const deltaX = swipeState[itemId].currentX - swipeState[itemId].startX;
    
    // Reset swipe state first (this triggers the animation back to position 0)
    setSwipeState(prev => {
      const newState = { ...prev };
      delete newState[itemId];
      return newState;
    });
    
    // Only trigger delete confirmation if user swiped past threshold
    // No notification appears during swiping - only when actually attempting to delete
    if (deltaX < -100) {
      // User swiped past threshold - show confirmation dialog
      handleRemoveItem(itemId);
    }
    // If not past threshold, item will animate back to normal position (no notification)
  };

  // Open bottom sheet for item actions
  const openBottomSheet = (item) => {
    setSelectedItemForActions(item);
    setBottomSheetOpen(true);
  };

  const closeBottomSheet = () => {
    setBottomSheetOpen(false);
    setSelectedItemForActions(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 dark:border-pink-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading cart...</p>
          </div>
        </div>
        {/* Footer: Hidden on mobile for better UX, visible on desktop, always in DOM for SEO */}
        <div className="hidden lg:block">
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <div className={`max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 lg:pb-8 ${mounted && isInitialized && cartItems.length > 0 ? 'pb-40' : 'pb-20'}`}>
        {/* Page Header */}
        <div className="mb-3 sm:mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100">Shopping Cart</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-0.5" suppressHydrationWarning>
                {!mounted || !isInitialized ? (
                  <span>0 items</span>
                ) : (
                  <>
                    {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'} in your cart
                    {(itemCounts.mainProducts > 0 || itemCounts.comboItems > 0 || itemCounts.dealItems > 0) && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                        ({itemCounts.mainProducts > 0 && `${itemCounts.mainProducts} main product${itemCounts.mainProducts !== 1 ? 's' : ''}`}
                        {itemCounts.mainProducts > 0 && itemCounts.comboItems > 0 && ', '}
                        {itemCounts.comboItems > 0 && `${itemCounts.comboItems} combo item${itemCounts.comboItems !== 1 ? 's' : ''}`}
                        {(itemCounts.mainProducts > 0 || itemCounts.comboItems > 0) && itemCounts.dealItems > 0 && ', '}
                        {itemCounts.dealItems > 0 && `${itemCounts.dealItems} deal item${itemCounts.dealItems !== 1 ? 's' : ''}`})
                      </span>
                    )}
                  </>
                )}
              </p>
            </div>
            {(mounted && isInitialized && cartItems.length > 0) && (
              <button
                onClick={handleContinueShopping}
                className="hidden md:flex items-center gap-2 px-4 py-2 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/30 rounded-lg transition-colors"
              >
                <ShoppingBag className="w-5 h-5" />
                Continue Shopping
              </button>
            )}
          </div>
        </div>

        {/* Show cart items immediately if we have them, regardless of initialization status */}
        {!mounted || !isInitialized ? (
          /* Loading State - Show during SSR and initial client render */
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-xl dark:shadow-black/20 border border-gray-200 dark:border-gray-700 p-12 text-center">
              <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 dark:border-pink-400"></div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Loading your cart...</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8">Please wait while we load your items</p>
            </div>
          </div>
        ) : cartItems.length === 0 ? (
          /* Empty Cart State */
          <>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-xl dark:shadow-black/20 border border-gray-200 dark:border-gray-700 p-12 text-center">
              <ShoppingBag className="w-24 h-24 mx-auto mb-6 text-gray-300 dark:text-gray-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Your cart is empty</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8">Add some delicious cakes to get started!</p>
              <button
                onClick={handleContinueShopping}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 dark:from-pink-700 dark:to-rose-700 text-white rounded-lg hover:from-pink-700 hover:to-rose-700 dark:hover:from-pink-600 dark:hover:to-rose-600 transition-all duration-200 font-semibold shadow-lg dark:shadow-xl dark:shadow-black/30 hover:shadow-xl"
              >
                <ShoppingBag className="w-5 h-5" />
                Start Shopping
              </button>
            </div>

            {/* Saved for Later Section - Show even when cart is empty */}
            {savedItems && Array.isArray(savedItems) && savedItems.length > 0 && (
              <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Saved for Later</h2>
                    <span className="text-sm sm:text-base text-gray-500 dark:text-gray-300">({savedItems.length} {savedItems.length === 1 ? 'item' : 'items'})</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {savedItems.map((item) => {
                    // Use deal price if it's a deal item
                    const itemPrice = item.is_deal_item && item.deal_price 
                      ? item.deal_price 
                      : (item.variant?.discounted_price || item.product.discounted_price || item.product.base_price);
                    const itemTotal = itemPrice * item.quantity;
                    const comboTotal = calculateComboTotal(item.combos);
                    // Use item.totalPrice if available (more accurate), otherwise calculate
                    const totalItemPrice = item.totalPrice || (itemTotal + comboTotal);
                    const isMoving = movingItemId === item.id;
                    const isRemovingSaved = removingSavedItemId === item.id;

                    return (
                      <div
                        key={item.id}
                        className={`bg-white dark:bg-gray-800 rounded-xl border-l-4 border-gray-400 dark:border-gray-500 border border-gray-200 dark:border-gray-700 p-4 sm:p-6 transition-all duration-300 ${
                          isRemovingSaved ? 'opacity-50 scale-95' : 'hover:shadow-lg dark:hover:shadow-xl dark:hover:shadow-black/30 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row gap-4">
                          {/* Product Image */}
                          <div className="w-full sm:w-24 h-24 bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={resolveImageUrl(item.product.image_url)}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1.5">
                                  {item.product.name}
                                </h3>
                                
                                {/* Product Details */}
                                <div className="space-y-0.5 mb-2">
                                  {/* Weight and Tier - Inline */}
                                  {((item.variant?.weight || item.product?.base_weight) || item.tier) && (
                                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                                      {(item.variant?.weight || item.product?.base_weight) && (
                                        <>
                                          <span className="font-medium">Weight:</span> <span className="text-pink-600 dark:text-pink-400 font-semibold">{item.variant?.weight || item.product?.base_weight}</span>
                                        </>
                                      )}
                                      {(item.variant?.weight || item.product?.base_weight) && item.tier && <span className="mx-2 text-gray-400">•</span>}
                                      {item.tier && (
                                        <>
                                          <span className="font-medium">Tier:</span> <span className="text-pink-600 dark:text-pink-400 font-semibold">{item.tier}</span>
                                        </>
                                      )}
                                    </p>
                                  )}
                                  {item.flavor && (
                                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                                      <span className="font-medium">Flavor:</span> {item.flavor.name}
                                    </p>
                                  )}
                                </div>

                                {/* Price */}
                                <div className="flex items-center gap-4 mb-2">
                                  <span className="text-xl font-bold text-pink-600 dark:text-pink-400">
                                    {formatPrice(itemPrice)}
                                  </span>
                                  {itemPrice < (item.product.base_price || item.variant?.price) && (
                                    <span className="text-xs sm:text-sm text-gray-400 dark:text-gray-400 line-through">
                                      {formatPrice(item.product.base_price || item.variant?.price)}
                                    </span>
                                  )}
                                </div>

                                {/* Item Total */}
                                <div className="mb-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                                      {item.combos && item.combos.length > 0 ? 'Item Total (Product + Combo)' : 'Total: '}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      {item.combos && item.combos.length > 0 ? (
                                        <>
                                          <span className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                                            {formatPrice(itemPrice)}
                                          </span>
                                          <span className="text-xs text-gray-400 dark:text-gray-500">+</span>
                                          <span className="text-base sm:text-lg font-semibold text-purple-600 dark:text-purple-400">
                                            {formatPrice(comboTotal)}
                                          </span>
                                        </>
                                      ) : (
                                        <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                                          {formatPrice(totalItemPrice)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {item.quantity > 1 && (
                                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-300 mt-1 block">
                                      ({item.quantity} × {formatPrice(itemPrice)})
                                    </span>
                                  )}
                                </div>

                                {/* Combo Items */}
                                {item.combos && item.combos.length > 0 && (
                                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center gap-2 mb-1.5">
                                      <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                      <span className="text-sm sm:text-base font-medium text-purple-600 dark:text-purple-400">Combo Items</span>
                                    </div>
                                    <div className="space-y-1.5">
                                      {item.combos.map((combo, index) => {
                                        const comboUnitPrice = getComboUnitPrice(combo);
                                        const comboTotal = comboUnitPrice * combo.quantity;
                                        const hasDiscount = combo.discount_percentage > 0 || (combo.discounted_price && combo.discounted_price < combo.price);
                                        const originalTotal = combo.price * combo.quantity;
                                        
                                        return (
                                        <div
                                          key={index}
                                          className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/60 rounded-lg p-2 border border-gray-200 dark:border-gray-700"
                                        >
                                          <div className="flex items-center gap-2">
                                            <Package className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                            <span className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100">
                                              {combo.product_name}
                                            </span>
                                            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-300">× {combo.quantity}</span>
                                          </div>
                                            <div className="flex items-center gap-2">
                                              {hasDiscount && (
                                                <span className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 line-through">
                                                  {formatPrice(originalTotal)}
                                                </span>
                                              )}
                                          <span className="text-sm sm:text-base font-semibold text-purple-600 dark:text-purple-400">
                                                {formatPrice(comboTotal)}
                                          </span>
                                        </div>
                                      </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Remove Button */}
                              <button
                                onClick={() => handleRemoveSavedItem(item.id)}
                                disabled={isRemovingSaved}
                                className="p-2 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                                title="Remove item"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                              <button
                                onClick={() => handleMoveToCart(item.id)}
                                disabled={isMoving || isRemovingSaved}
                                className="flex-1 px-4 py-2 text-sm bg-pink-600 dark:bg-pink-700 text-white rounded-lg hover:bg-pink-700 dark:hover:bg-pink-600 transition-colors disabled:opacity-50 font-medium"
                              >
                                {isMoving ? 'Moving...' : 'Move to Cart'}
                              </button>
                              <button
                                onClick={() => router.push(`/product/${item.product.slug || item.product.id}`)}
                                className="flex-1 px-4 py-2 text-sm border border-pink-300 dark:border-pink-700 text-pink-600 dark:text-pink-400 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/30 transition-colors"
                              >
                                View Product
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4 sm:gap-6 lg:gap-8">
            {/* LEFT SECTION: Cart Items (70% equivalent) */}
            <div className="space-y-5 sm:space-y-6">
              {/* Deal Items - Grid Layout for Mobile */}
              {cartItems.filter(item => item.is_deal_item).length > 0 && (
                <div className="mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3 flex items-center gap-2">
                    <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600 dark:text-pink-400" />
                    Deal Items
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:gap-5">
                    {cartItems.filter(item => item.is_deal_item).map((item, index) => {
                      // Number sequentially across all main products (deal items start from 1)
                      const productNumber = index + 1;
                      const itemPrice = item.is_deal_item && item.deal_price 
                        ? item.deal_price 
                        : (item.variant?.discounted_price || item.product.discounted_price || item.product.base_price);
                      const itemTotal = itemPrice * item.quantity;
                      const comboTotal = calculateComboTotal(item.combos);
                      // Use item.totalPrice if available (more accurate), otherwise calculate
                      const totalItemPrice = item.totalPrice || (itemTotal + comboTotal);
                      const isRemoving = removingItemId === item.id;

                      // Allow both left (negative) and right (positive) swipes, but clamp to reasonable bounds
                      const rawDealSwipeOffset = swipeState[item.id]?.isSwiping 
                        ? swipeState[item.id].currentX - swipeState[item.id].startX
                        : 0;
                      const dealSwipeOffset = Math.max(-150, Math.min(0, rawDealSwipeOffset)); // Clamp between -150px and 0

                      return (
                        <div
                          key={item.id}
                          className="relative overflow-hidden mb-4 sm:mb-5"
                          onTouchStart={(e) => handleTouchStart(e, item.id)}
                          onTouchMove={(e) => handleTouchMove(e, item.id)}
                          onTouchEnd={(e) => handleTouchEnd(e, item.id)}
                          style={{ touchAction: 'pan-y' }}
                        >
                          {/* Swipe delete indicator */}
                          {swipeState[item.id]?.isSwiping && dealSwipeOffset < -50 && (
                            <div className="absolute right-0 top-0 bottom-0 w-20 bg-red-500 dark:bg-red-600 flex items-center justify-center z-10">
                              <Trash2 className="w-6 h-6 text-white" />
                            </div>
                          )}
                          
                          <div
                          className={`bg-white dark:bg-gray-800 rounded-xl border-l-4 border-pink-500 dark:border-pink-400 border border-gray-200 dark:border-gray-700 p-3 sm:p-4 transition-all duration-300 ${
                            isRemoving ? 'opacity-50 scale-95' : 'hover:shadow-lg dark:hover:shadow-xl dark:hover:shadow-black/30 hover:border-pink-300 dark:hover:border-pink-600'
                          }`}
                            style={{
                              transform: `translateX(${dealSwipeOffset}px)`,
                              transition: swipeState[item.id]?.isSwiping ? 'none' : 'transform 0.3s ease-out'
                            }}
                        >
                            <div className="flex gap-3 sm:gap-4">
                          {/* Product Image with Deal Badge */}
                          <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={resolveImageUrl(item.product.image_url)}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                            {/* Product Number Label */}
                            <div className="absolute top-0 left-0 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-500 dark:to-blue-600 text-white text-[9px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.5 rounded-br-md shadow-sm z-10 leading-tight">
                              Product {productNumber}
                            </div>
                            {/* Deal Badge */}
                            <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white text-xs sm:text-sm font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md shadow-lg flex items-center gap-0.5 sm:gap-1 z-10">
                              <Gift className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                              DEAL
                            </div>
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-start gap-2 flex-1 min-w-0">
                                <div className="p-1.5 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex-shrink-0">
                                  <Gift className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                                </div>
                                <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 line-clamp-2 flex-1">
                                  {item.product.name}
                                </h3>
                              </div>
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                disabled={isRemoving}
                                className="p-1.5 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                                title="Remove item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            
                            {/* Price & Details */}
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className="text-base sm:text-lg font-bold text-green-600 dark:text-green-400">
                                {formatPrice(itemPrice)}
                              </span>
                              {itemPrice < (item.product.base_price || item.variant?.price) && (
                                <span className="text-xs text-gray-400 dark:text-gray-400 line-through">
                                  {formatPrice(item.product.base_price || item.variant?.price)}
                                </span>
                              )}
                              {item.product.base_weight && (
                                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                                  • {item.product.base_weight}
                                </span>
                              )}
                            </div>

                            {/* Quantity & Item Total */}
                            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                              <div className="flex items-center gap-1.5 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1 bg-gray-50 dark:bg-gray-700/50">
                                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                                  Qty: {item.quantity}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium">
                                  {item.combos && item.combos.length > 0 ? 'Total (incl. combo): ' : 'Total: '}
                                </span>
                                <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100">
                                  {formatPrice(totalItemPrice)}
                                </span>
                              </div>
                            </div>
                          </div>
                          </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Regular Items */}
              {cartItems.filter(item => !item.is_deal_item).length > 0 && (
                <div>
                  {cartItems.filter(item => !item.is_deal_item).map((item, index) => {
                    // Number sequentially across all main products (continue after deal items)
                    const dealItemsCount = cartItems.filter(item => item.is_deal_item).length;
                    const productNumber = dealItemsCount + index + 1;
                    // Use deal price if it's a deal item
                    const itemPrice = item.is_deal_item && item.deal_price 
                      ? item.deal_price 
                      : (item.variant?.discounted_price || item.product.discounted_price || item.product.base_price);
                    const itemTotal = itemPrice * item.quantity;
                    const comboTotal = calculateComboTotal(item.combos);
                    // Use item.totalPrice if available (more accurate), otherwise calculate
                    const totalItemPrice = item.totalPrice || (itemTotal + comboTotal);
                    const isRemoving = removingItemId === item.id;
                    const isSaving = savingItemId === item.id;

                    // Get weight from variant or product base_weight
                    const itemWeight = item.variant?.weight || item.product?.base_weight || null;
                    
                    // Combine product details into single line
                    const productDetails = [];
                    if (itemWeight) productDetails.push(`Weight: ${itemWeight}`);
                    if (item.flavor) productDetails.push(`Flavor: ${item.flavor.name}`);
                    if (item.tier) productDetails.push(`Tier: ${item.tier}`);
                    const detailsText = productDetails.join(' • ');

                    const isExpanded = expandedItems.has(item.id);
                    const hasExpandableContent = (!item.is_deal_item && (item.combos?.length > 0 || item.deliverySlot || item.cakeMessage));
                    // Allow both left (negative) and right (positive) swipes, but clamp to reasonable bounds
                    const rawSwipeOffset = swipeState[item.id]?.isSwiping 
                      ? swipeState[item.id].currentX - swipeState[item.id].startX
                      : 0;
                    const swipeOffset = Math.max(-150, Math.min(0, rawSwipeOffset)); // Clamp between -150px and 0

                    return (
                      <div
                        id={`cart-item-${item.id}`}
                        key={item.id}
                        className="relative overflow-hidden mb-4 sm:mb-5"
                        onTouchStart={(e) => handleTouchStart(e, item.id)}
                        onTouchMove={(e) => handleTouchMove(e, item.id)}
                        onTouchEnd={(e) => handleTouchEnd(e, item.id)}
                        style={{ touchAction: 'pan-y' }}
                      >
                        {/* Swipe delete indicator */}
                        {swipeState[item.id]?.isSwiping && swipeOffset < -50 && (
                          <div className="absolute right-0 top-0 bottom-0 w-20 bg-red-500 dark:bg-red-600 flex items-center justify-center z-10">
                            <Trash2 className="w-6 h-6 text-white" />
                          </div>
                        )}
                        
                        <div
                          className={`bg-white dark:bg-gray-800 rounded-xl border-l-4 border-blue-500 dark:border-blue-400 border border-gray-200 dark:border-gray-700 p-3 sm:p-4 lg:p-6 transition-all duration-300 ${
                          isRemoving ? 'opacity-50 scale-95' : 'hover:shadow-lg dark:hover:shadow-xl dark:hover:shadow-black/30 hover:border-blue-300 dark:hover:border-blue-600'
                        }`}
                          style={{
                            transform: `translateX(${swipeOffset}px)`,
                            transition: swipeState[item.id]?.isSwiping ? 'none' : 'transform 0.3s ease-out'
                          }}
                      >
                          {/* Mobile: Image and Product Info Side by Side */}
                          <div className="flex flex-row gap-2 sm:hidden">
                          {/* Product Image */}
                            <div className="relative w-20 h-20 bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 rounded-lg overflow-hidden flex-shrink-0">
                              {/* Product Number Label */}
                              <div className="absolute top-0 left-0 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-500 dark:to-blue-600 text-white text-[9px] font-bold px-1 py-0.5 rounded-br-md shadow-sm z-10 leading-tight">
                                Product {productNumber}
                              </div>
                              <img
                                src={resolveImageUrl(item.product.image_url)}
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            {/* Product Info - Compact Mobile Layout */}
                          <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-1.5 mb-1">
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 line-clamp-2 mb-1.5 leading-tight">
                                  {item.product.name}
                                </h3>
                                
                                  {/* Weight and Tier - Inline */}
                                  {(itemWeight || item.tier) && (
                                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 leading-tight mt-0.5">
                                      {itemWeight && (
                                        <>
                                          Weight: <span className="text-pink-600 dark:text-pink-400 font-semibold">{itemWeight}</span>
                                        </>
                                      )}
                                      {itemWeight && item.tier && <span className="mx-1 text-gray-400">•</span>}
                                  {item.tier && (
                                        <>
                                          Tier: <span className="text-pink-600 dark:text-pink-400 font-semibold">{item.tier}</span>
                                        </>
                                      )}
                                    </p>
                                  )}
                                </div>

                                {/* Remove Button */}
                                <button
                                  onClick={() => handleRemoveItem(item.id)}
                                  disabled={isRemoving}
                                  className="p-0.5 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors disabled:opacity-50 flex-shrink-0"
                                  title="Remove item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Price, Quantity & Total - Compact row */}
                              <div className="space-y-0.5">
                                <div className="flex items-center justify-between gap-1.5">
                                  <div className="flex items-center gap-1">
                                    <span className="text-base font-bold text-pink-600 dark:text-pink-400">
                                      {formatPrice(itemPrice)}
                                    </span>
                                    {itemPrice < (item.product.base_price || item.variant?.price) && (
                                      <span className="text-xs text-gray-400 dark:text-gray-400 line-through">
                                        {formatPrice(item.product.base_price || item.variant?.price)}
                                      </span>
                                    )}
                                  </div>

                                  {/* Quantity Controls */}
                                  {item.is_deal_item ? (
                                    <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5 bg-gray-50 dark:bg-gray-700/50">
                                      <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                                        Qty: {item.quantity}
                                      </span>
                                    </div>
                                  ) : (
                                <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 rounded p-1">
                                      <button
                                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                        disabled={isRemoving}
                                    className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors disabled:opacity-50 text-gray-600 dark:text-gray-300"
                                      >
                                    <Minus className="w-3 h-3" />
                                      </button>
                                  <span className="w-7 text-center text-xs font-semibold text-gray-900 dark:text-gray-100">
                                        {item.quantity}
                                      </span>
                                      <button
                                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                        disabled={isRemoving}
                                    className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors disabled:opacity-50 text-pink-600 dark:text-pink-400"
                                      >
                                    <Plus className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* Item Total */}
                                <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                      {item.combos && item.combos.length > 0 ? 'Item Total (Product + Combo)' : 'Item Total:'}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      {item.combos && item.combos.length > 0 ? (
                                        <>
                                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                            {formatPrice(itemPrice)}
                                          </span>
                                          <span className="text-xs text-gray-400 dark:text-gray-500">+</span>
                                          <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                                            {formatPrice(comboTotal)}
                                          </span>
                                        </>
                                      ) : (
                                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                          {formatPrice(totalItemPrice)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Combo Items Section - Mobile: Full width below inline container */}
                          {!item.is_deal_item && item.combos && item.combos.length > 0 && (
                            <div className="sm:hidden mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 w-full">
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                  <span className="text-sm font-medium text-purple-600 dark:text-purple-400">Combo Items</span>
                                </div>
                                {/* Show More/Less Button - Always show when combo items exist */}
                                <button
                                  onClick={() => toggleItemExpansion(item.id)}
                                  className="flex items-center gap-1 text-sm text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 transition-colors"
                                >
                                  {isExpanded ? (
                                    <>
                                      <span>Show Less</span>
                                      <ChevronUp className="w-3.5 h-3.5" />
                                    </>
                                  ) : (
                                    <>
                                      <span>Show More</span>
                                      <ChevronDown className="w-3.5 h-3.5" />
                                    </>
                                  )}
                                </button>
                              </div>
                              {/* Combo Items - Show/Hide based on expansion state */}
                              {isExpanded && (
                              <div className="space-y-1.5">
                                {item.combos.map((combo, index) => {
                                  const comboId = combo.id || combo.product_id || index;
                                  const comboUnitPrice = getComboUnitPrice(combo);
                                  const comboTotal = comboUnitPrice * combo.quantity;
                                  const hasDiscount = combo.discount_percentage > 0 || (combo.discounted_price && combo.discounted_price < combo.price);
                                  const originalTotal = combo.price * combo.quantity;
                                  
                                  return (
                                  <div
                                    key={comboId}
                                    className="flex flex-col gap-2 bg-gray-50 dark:bg-gray-800/60 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700 items-start"
                                  >
                                    {/* Combo Item Title */}
                                    <div className="flex items-center gap-2 min-w-0 w-full">
                                      <Package className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap overflow-x-auto no-scrollbar">
                                        {combo.product_name}
                                      </span>
                                    </div>

                                    {/* Controls Row */}
                                    <div className="flex items-center gap-2 flex-wrap justify-start w-full">
                                      <div className="flex items-center gap-1 border border-gray-300 dark:border-gray-600 rounded-lg p-1 bg-white dark:bg-gray-700">
                                        <button
                                          onClick={() => handleComboQuantityChange(item.id, comboId, combo.quantity - 1)}
                                          disabled={isRemoving}
                                          className="w-7 h-7 flex items-center justify-center bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded transition-colors disabled:opacity-50 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                                          title="Decrease quantity"
                                        >
                                          <Minus className="w-3.5 h-3.5" />
                                        </button>
                                        <span className="w-8 text-center text-xs font-semibold text-gray-900 dark:text-gray-100">
                                          {combo.quantity}
                                        </span>
                                        <button
                                          onClick={() => handleComboQuantityChange(item.id, comboId, combo.quantity + 1)}
                                          disabled={isRemoving}
                                          className="w-7 h-7 flex items-center justify-center bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded transition-colors disabled:opacity-50 text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300"
                                          title="Increase quantity"
                                        >
                                          <Plus className="w-3.5 h-3.5" />
                                        </button>
                                      </div>

                                      <div className="flex items-center gap-1.5">
                                        {hasDiscount && (
                                          <span className="text-xs text-gray-400 dark:text-gray-500 line-through">
                                            {formatPrice(originalTotal)}
                                          </span>
                                        )}
                                        <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                                          {formatPrice(comboTotal)}
                                        </span>
                                      </div>

                                      <button
                                        onClick={() => handleRemoveComboItem(item.id, comboId)}
                                        disabled={isRemoving}
                                        className="p-1.5 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                                        title="Remove combo item"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                  );
                                })}
                              </div>
                              )}
                            </div>
                          )}

                          {/* Desktop: Image and Product Info Container */}
                          <div className="hidden sm:flex sm:flex-row gap-4">
                            {/* Product Image */}
                            <div className="relative w-24 h-24 bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 rounded-lg overflow-hidden flex-shrink-0">
                            {/* Product Number Label */}
                            <div className="absolute top-0 left-0 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-500 dark:to-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-br-md shadow-sm z-10 leading-tight">
                              Product {productNumber}
                            </div>
                              <img
                                src={resolveImageUrl(item.product.image_url)}
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            {/* Product Info & Combo Items Container */}
                            <div className="flex-1 min-w-0 flex flex-col">
                              {/* Product Info - Desktop: Full layout */}
                              <div className="flex-1 min-w-0">
                                {/* Desktop: Full layout */}
                                <div className="hidden sm:block">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex items-start gap-2 flex-1 min-w-0">
                                  <div className="p-1.5 sm:p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
                                    <Package className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 line-clamp-2 leading-tight">
                                      {item.product.name}
                                    </h3>
                                    
                                    {/* Weight and Tier - Inline */}
                                    {(itemWeight || item.tier) && (
                                      <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mt-1 leading-tight">
                                        {itemWeight && (
                                          <>
                                            Weight: <span className="text-blue-600 dark:text-blue-400 font-semibold">{itemWeight}</span>
                                          </>
                                        )}
                                        {itemWeight && item.tier && <span className="mx-2 text-gray-400">•</span>}
                                        {item.tier && (
                                          <>
                                            Tier: <span className="text-blue-600 dark:text-blue-400 font-semibold">{item.tier}</span>
                                          </>
                                        )}
                                      </p>
                                    )}
                                    
                                    {/* Flavor - Separate line if available */}
                                    {item.flavor && (
                                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 leading-tight">
                                        Flavor: <span className="text-blue-600 dark:text-blue-400 font-semibold">{item.flavor.name}</span>
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Remove Button */}
                                <button
                                  onClick={() => handleRemoveItem(item.id)}
                                  disabled={isRemoving}
                                    className="p-1.5 sm:p-2 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                                  title="Remove item"
                                >
                                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>
                              </div>

                              {/* Price & Quantity Controls */}
                              <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-2 sm:gap-3">
                                  <span className="text-lg sm:text-xl font-bold text-pink-600 dark:text-pink-400">
                                    {formatPrice(itemPrice)}
                                  </span>
                                  {itemPrice < (item.product.base_price || item.variant?.price) && (
                                    <span className="text-xs sm:text-sm text-gray-400 dark:text-gray-400 line-through">
                                      {formatPrice(item.product.base_price || item.variant?.price)}
                                    </span>
                                  )}
                                </div>

                                {/* Quantity Controls */}
                                {item.is_deal_item ? (
                                  // Deal items: Show fixed quantity (no controls)
                                  <div className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 sm:px-3 py-1 sm:py-1.5 bg-gray-50 dark:bg-gray-700/50">
                                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                                      Qty: {item.quantity}
                                    </span>
                                  </div>
                                ) : (
                                  // Regular items: Show quantity controls
                                  <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 rounded-lg p-0.5">
                                    <button
                                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                      disabled={isRemoving}
                                      className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors disabled:opacity-50 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                                    >
                                      <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </button>
                                    <span className="w-10 sm:w-12 text-center text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">
                                      {item.quantity}
                                    </span>
                                    <button
                                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                      disabled={isRemoving}
                                      className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors disabled:opacity-50 text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300"
                                    >
                                      <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Item Total */}
                              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium">
                                    {item.combos && item.combos.length > 0 ? 'Item Total (Product + Combo)' : 'Item Total:'}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    {item.combos && item.combos.length > 0 ? (
                                      <>
                                        <span className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                                          {formatPrice(itemPrice)}
                                        </span>
                                        <span className="text-sm text-gray-400 dark:text-gray-500">+</span>
                                        <span className="text-base sm:text-lg font-semibold text-purple-600 dark:text-purple-400">
                                          {formatPrice(comboTotal)}
                                        </span>
                                      </>
                                    ) : (
                                      <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                                        {formatPrice(totalItemPrice)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                                </div>
                              </div>

                              {/* Combo Items Section - Desktop: Inside container */}
                            {!item.is_deal_item && item.combos && item.combos.length > 0 && (
                                <div className="hidden sm:block mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 w-full">
                                <div className="flex items-center justify-between mb-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400" />
                                    <span className="text-sm sm:text-base font-medium text-purple-600 dark:text-purple-400">Combo Items</span>
                                  </div>
                                  {/* Show More/Less Button - Always show when combo items exist */}
                                  <button
                                    onClick={() => toggleItemExpansion(item.id)}
                                    className="flex items-center gap-1 text-sm sm:text-base text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 transition-colors"
                                  >
                                    {isExpanded ? (
                                      <>
                                        <span>Show Less</span>
                                        <ChevronUp className="w-3.5 h-3.5" />
                                      </>
                                    ) : (
                                      <>
                                        <span>Show More</span>
                                        <ChevronDown className="w-3.5 h-3.5" />
                                      </>
                                    )}
                                  </button>
                                </div>
                                {/* Combo Items - Show/Hide based on expansion state */}
                                {isExpanded && (
                                <div className="space-y-1.5">
                                  {item.combos.map((combo, index) => {
                                    const comboId = combo.id || combo.product_id || index;
                                    const comboUnitPrice = getComboUnitPrice(combo);
                                    const comboTotal = comboUnitPrice * combo.quantity;
                                    const hasDiscount = combo.discount_percentage > 0 || (combo.discounted_price && combo.discounted_price < combo.price);
                                    const originalTotal = combo.price * combo.quantity;
                                    
                                    return (
                                      <div
                                        key={comboId}
                                        className="flex flex-col gap-2 bg-gray-50 dark:bg-gray-800/60 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700 items-start"
                                      >
                                        {/* Combo Item Title */}
                                        <div className="flex items-center gap-2 min-w-0 w-full">
                                          <Package className="w-4 h-4 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                                          <span className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap overflow-x-auto no-scrollbar">
                                            {combo.product_name}
                                          </span>
                                        </div>

                                        {/* Controls Row */}
                                        <div className="flex items-center gap-2 flex-wrap justify-start w-full">
                                          <div className="flex items-center gap-1 border border-gray-300 dark:border-gray-600 rounded-lg p-1 bg-white dark:bg-gray-700">
                                            <button
                                              onClick={() => handleComboQuantityChange(item.id, comboId, combo.quantity - 1)}
                                              disabled={isRemoving}
                                              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded transition-colors disabled:opacity-50 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                                              title="Decrease quantity"
                                            >
                                              <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                            </button>
                                            <span className="w-9 sm:w-11 text-center text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">
                                              {combo.quantity}
                                            </span>
                                            <button
                                              onClick={() => handleComboQuantityChange(item.id, comboId, combo.quantity + 1)}
                                              disabled={isRemoving}
                                              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded transition-colors disabled:opacity-50 text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300"
                                              title="Increase quantity"
                                            >
                                              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                            </button>
                                          </div>

                                          <div className="flex items-center gap-1.5">
                                            {hasDiscount && (
                                              <span className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 line-through">
                                                {formatPrice(originalTotal)}
                                              </span>
                                            )}
                                            <span className="text-sm sm:text-base font-semibold text-purple-600 dark:text-purple-400">
                                              {formatPrice(comboTotal)}
                                            </span>
                                          </div>

                                          <button
                                            onClick={() => handleRemoveComboItem(item.id, comboId)}
                                            disabled={isRemoving}
                                            className="p-1.5 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                                            title="Remove combo item"
                                          >
                                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                            )}
                              </div>
                              )}
                            </div>
                          </div>

                          {/* Expandable Details Section - Only for Delivery Slot & Message */}
                          {hasExpandableContent && (item.deliverySlot || item.cakeMessage) && (
                            <>
                              {/* Show More/Less Button - Only if no combos or combos are shown */}
                              {(!item.combos || item.combos.length === 0) && (
                                <button
                                  onClick={() => toggleItemExpansion(item.id)}
                                  className="mt-2 flex items-center gap-1 text-xs sm:text-sm text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 transition-colors"
                                >
                                  {isExpanded ? (
                                    <>
                                      <span>Show Less</span>
                                      <ChevronUp className="w-3.5 h-3.5" />
                                    </>
                                  ) : (
                                    <>
                                      <span>Show More</span>
                                      <ChevronDown className="w-3.5 h-3.5" />
                                    </>
                                  )}
                                </button>
                              )}

                              {/* Expanded Content */}
                              {isExpanded && (
                                <div className="mt-3 space-y-3">
                            {/* Delivery Slot & Message - Hide for deal items */}
                                {!item.is_deal_item && (item.deliverySlot || item.cakeMessage) && (
                                    <div className="mt-3 px-2.5 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/60 space-y-1.5">
                                {item.deliverySlot && (
                                        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                                          <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                    <span>
                                            {formatDeliveryDate(item.deliverySlot.date)} • {formatTimeSlot(item.deliverySlot)}
                                    </span>
                                  </div>
                                )}
                                {item.cakeMessage && (
                                        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                                          <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                    <span className="italic">"{item.cakeMessage}"</span>
                                  </div>
                                )}
                              </div>
                                  )}
                                </div>
                              )}
                            </>
                            )}

                          {/* Action Buttons - Desktop: Inline, Mobile: Bottom Sheet */}
                            {!item.is_deal_item && (
                            <>
                              {/* Desktop: Inline buttons */}
                              <div className="hidden sm:flex mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 gap-2">
                                <button
                                  onClick={() => handleSaveForLater(item.id)}
                                  disabled={isSaving || isRemoving}
                                  className="flex-1 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                                >
                                  {isSaving ? 'Saving...' : 'Save for Later'}
                                </button>
                                <button
                                  onClick={() => router.push(`/product/${item.product.slug || item.product.id}`)}
                                  className="flex-1 px-4 py-2 text-sm border border-pink-300 dark:border-pink-700 text-pink-600 dark:text-pink-400 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/30 transition-colors"
                                >
                                  Edit
                                </button>
                              </div>
                              
                              {/* Mobile: Bottom Sheet Trigger */}
                              <div className="sm:hidden mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                <button
                                  onClick={() => openBottomSheet(item)}
                                  className="w-full flex items-center justify-between px-3 py-2.5 text-[15px] sm:text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                  <span>More Options</span>
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                  </div>
                );
                  })}
                </div>
              )}

              {/* Continue Shopping Link (Mobile) - Removed as it's redundant with header button */}

              {/* Deal Unlocked Section */}
              {cartItems.length > 0 && (
                <div className="mt-5 sm:mt-7">
                  <CartDeals />
                </div>
              )}

              {/* Saved for Later Section - Collapsible */}
              {savedItems && Array.isArray(savedItems) && savedItems.length > 0 && (
                <div className="mt-7 sm:mt-9 pt-6 sm:pt-8 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setIsSavedForLaterOpen(!isSavedForLaterOpen)}
                    className="flex items-center justify-between w-full mb-3 sm:mb-4"
                  >
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" />
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">Saved for Later</h2>
                      <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-300">({savedItems.length} {savedItems.length === 1 ? 'item' : 'items'})</span>
                    </div>
                    {isSavedForLaterOpen ? (
                      <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" />
                    ) : (
                      <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" />
                    )}
                  </button>
                  
                  {isSavedForLaterOpen && (

                    <div className="space-y-3 sm:space-y-4">
                    {savedItems.map((item) => {
                      // Use deal price if it's a deal item
                      const itemPrice = item.is_deal_item && item.deal_price 
                        ? item.deal_price 
                        : (item.variant?.discounted_price || item.product.discounted_price || item.product.base_price);
                      const itemTotal = itemPrice * item.quantity;
                      const comboTotal = calculateComboTotal(item.combos);
                      // Use item.totalPrice if available (more accurate), otherwise calculate
                      const totalItemPrice = item.totalPrice || (itemTotal + comboTotal);
                      const isMoving = movingItemId === item.id;
                      const isRemovingSaved = removingSavedItemId === item.id;

                        // Get weight from variant or product base_weight
                        const savedItemWeight = item.variant?.weight || item.product?.base_weight || null;
                        
                        // Combine product details into single line (excluding weight which is shown separately)
                        const savedProductDetails = [];
                        if (item.flavor) savedProductDetails.push(`Flavor: ${item.flavor.name}`);
                        if (item.tier) savedProductDetails.push(`Tier: ${item.tier}`);
                        const savedDetailsText = savedProductDetails.join(' • ');

                      return (
                        <div
                          key={item.id}
                            className={`bg-white dark:bg-gray-800 rounded-xl border-l-4 border-gray-400 dark:border-gray-500 border border-gray-200 dark:border-gray-700 p-3 sm:p-4 lg:p-6 transition-all duration-300 ${
                            isRemovingSaved ? 'opacity-50 scale-95' : 'hover:shadow-lg dark:hover:shadow-xl dark:hover:shadow-black/30 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                            <div className="flex gap-3 sm:gap-4">
                            {/* Product Image */}
                              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 rounded-lg overflow-hidden flex-shrink-0">
                              <img
                                src={resolveImageUrl(item.product.image_url)}
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                  <div className="flex items-start gap-2 flex-1 min-w-0">
                                    <div className="p-1.5 sm:p-2 rounded-lg bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                                      <Package className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
                                        {item.product.name}
                                      </h3>
                                      
                                      {/* Weight and Tier - Inline */}
                                      {(savedItemWeight || item.tier) && (
                                        <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mt-1">
                                          {savedItemWeight && (
                                            <>
                                              Weight: <span className="text-gray-700 dark:text-gray-300 font-semibold">{savedItemWeight}</span>
                                            </>
                                          )}
                                          {savedItemWeight && item.tier && <span className="mx-2 text-gray-400">•</span>}
                                          {item.tier && (
                                            <>
                                              Tier: <span className="text-gray-700 dark:text-gray-300 font-semibold">{item.tier}</span>
                                            </>
                                          )}
                                        </p>
                                      )}
                                      
                                      {/* Flavor - Separate line if available */}
                                      {item.flavor && (
                                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                                          Flavor: <span className="text-gray-700 dark:text-gray-300 font-semibold">{item.flavor.name}</span>
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Remove Button */}
                                  <button
                                    onClick={() => handleRemoveSavedItem(item.id)}
                                    disabled={isRemovingSaved}
                                    className="p-1.5 sm:p-2 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                                    title="Remove item"
                                  >
                                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                  </button>
                                </div>

                                  {/* Price & Total */}
                                  <div className="flex items-center justify-between gap-2 mt-2">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                      <span className="text-lg sm:text-xl font-bold text-pink-600 dark:text-pink-400">
                                      {formatPrice(itemPrice)}
                                    </span>
                                    {itemPrice < (item.product.base_price || item.variant?.price) && (
                                        <span className="text-xs sm:text-sm text-gray-400 dark:text-gray-400 line-through">
                                        {formatPrice(item.product.base_price || item.variant?.price)}
                                      </span>
                                    )}
                                  </div>
                                    <div className="text-right">
                                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Total: </span>
                                      <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
                                      {formatPrice(totalItemPrice)}
                                    </span>
                                    </div>
                                  </div>

                                  {/* Combo Items */}
                                  {item.combos && item.combos.length > 0 && (
                                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                                      <div className="flex items-center gap-1.5 mb-1.5">
                                        <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400" />
                                        <span className="text-xs sm:text-sm font-medium text-purple-600 dark:text-purple-400">Combo Items</span>
                                      </div>
                                      <div className="space-y-1.5">
                                        {item.combos.map((combo, index) => {
                                          const comboUnitPrice = getComboUnitPrice(combo);
                                          const comboTotal = comboUnitPrice * combo.quantity;
                                          const hasDiscount = combo.discount_percentage > 0 || (combo.discounted_price && combo.discounted_price < combo.price);
                                          const originalTotal = combo.price * combo.quantity;
                                          
                                          return (
                                          <div
                                            key={index}
                                            className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/60 rounded-lg px-2 py-1.5 border border-gray-200 dark:border-gray-700"
                                          >
                                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                                <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                                                <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                                {combo.product_name}
                                              </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-300 flex-shrink-0">× {combo.quantity}</span>
                                            </div>
                                              <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                                                {hasDiscount && (
                                                  <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 line-through">
                                                    {formatPrice(originalTotal)}
                                                  </span>
                                                )}
                                                <span className="text-xs sm:text-sm font-medium text-purple-600 dark:text-purple-400">
                                                  {formatPrice(comboTotal)}
                                            </span>
                                          </div>
                                      </div>
                                          );
                                        })}
                                    </div>
                                </div>
                                  )}

                              {/* Action Buttons */}
                                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                                <button
                                  onClick={() => handleMoveToCart(item.id)}
                                  disabled={isMoving || isRemovingSaved}
                                      className="flex-1 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-pink-600 dark:bg-pink-700 text-white rounded-lg hover:bg-pink-700 dark:hover:bg-pink-600 transition-colors disabled:opacity-50 font-medium"
                                >
                                      {isMoving ? 'Moving...' : <span className="hidden sm:inline">Move to Cart</span>}
                                      {isMoving ? '' : <span className="sm:hidden">Move</span>}
                                </button>
                                <button
                                  onClick={() => router.push(`/product/${item.product.slug || item.product.id}`)}
                                      className="flex-1 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm border border-pink-300 dark:border-pink-700 text-pink-600 dark:text-pink-400 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/30 transition-colors"
                                >
                                      View
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT SECTION: Summary Box (30% equivalent) */}
            <div className="lg:sticky lg:top-24 h-fit lg:min-w-0 lg:max-w-full">
              <div className="bg-white dark:bg-gray-800 rounded-xl border-l-4 border-pink-500 dark:border-pink-400 border border-gray-200 dark:border-gray-700 shadow-lg dark:shadow-xl dark:shadow-black/30 p-4 sm:p-5 lg:p-6 space-y-3 sm:space-y-4 lg:min-w-0 lg:max-w-full">
                {/* Header with Icon */}
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                  <div className="p-1.5 rounded-lg bg-pink-100 dark:bg-pink-900/30">
                    <ShoppingBag className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">Order Summary</h2>
                </div>

                {/* Free Delivery Progress Indicator */}
                {!isFreeDeliveryEligible && subtotal > 0 && (
                  <div className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-lg p-3 sm:p-4 border border-pink-200 dark:border-pink-800">
                    <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                      <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200">
                        Free Delivery Progress
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-pink-600 dark:text-pink-400">
                        {formatPrice(amountToFreeDelivery)} away
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 sm:h-2.5 mb-1.5 sm:mb-2">
                      <div
                        className="bg-gradient-to-r from-pink-500 to-rose-500 dark:from-pink-600 dark:to-rose-600 h-2 sm:h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${freeDeliveryProgress}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-1">
                      Add {formatPrice(amountToFreeDelivery)} more to unlock free delivery!
                    </p>
                  </div>
                )}

                {isFreeDeliveryEligible && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 sm:p-4 border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-semibold text-green-700 dark:text-green-300">
                        🎉 You've unlocked Free Delivery!
                      </span>
                    </div>
                  </div>
                )}

                {/* Price Breakdown */}
                <div className="space-y-2 pt-2 border-t-2 border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300">Subtotal ({regularItemsCount} {regularItemsCount === 1 ? 'item' : 'items'})</span>
                    <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100">{formatPrice(subtotal)}</span>
                  </div>

                  {/* Deal Price - Separate line for deal items */}
                  {dealItemsTotal > 0 && (
                    <div className="flex justify-between items-center py-1">
                      <span className="flex items-center gap-1.5 text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300">
                        <Gift className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                        <span>Deal Price</span>
                      </span>
                      <span className="text-sm sm:text-base font-semibold text-green-600 dark:text-green-400">{formatPrice(dealItemsTotal)}</span>
                    </div>
                  )}

                  {/* Promo Discount */}
                  {appliedPromo && (
                    <div className="flex items-center justify-between text-green-700 dark:text-green-400 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-2 border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-green-400"></div>
                        <span className="text-sm sm:text-base font-semibold">
                          {appliedPromo.code} (-{appliedPromo.discount}%)
                        </span>
                      </div>
                      <span className="text-sm sm:text-base font-bold">-{formatPrice(promoDiscount)}</span>
                    </div>
                  )}

                  {/* Delivery Charge */}
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300">Delivery Charge</span>
                    <span className="text-sm sm:text-base font-semibold">
                      {isFreeDeliveryEligible ? (
                        <span className="text-green-600 dark:text-green-400 font-bold">FREE</span>
                      ) : (
                        <span className="text-gray-900 dark:text-gray-100">{formatPrice(deliveryCharge)}</span>
                      )}
                    </span>
                  </div>

                  <div className="border-t-2 border-pink-200 dark:border-pink-800 pt-2.5 mt-2.5 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-lg p-3 -mx-1">
                    <div className="flex justify-between items-center">
                      <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">Total</span>
                      <span className="text-xl sm:text-2xl font-extrabold text-pink-600 dark:text-pink-400">
                        {formatPrice(total)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Promo Code Section */}
                <div className="space-y-2 sm:space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" />
                    <span className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Promo Code</span>
                  </div>

                  {appliedPromo ? (
                    <div className={`bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 rounded-lg p-2.5 sm:p-3 transition-all ${showSuccessAnimation ? 'animate-pulse scale-105' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                          <div>
                            <p className="text-xs sm:text-sm font-semibold text-green-700 dark:text-green-300">
                              {appliedPromo.code} Applied 🎉
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-400">
                              You saved {formatPrice(promoDiscount)}!
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleRemovePromo}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex-shrink-0 transition-colors"
                          title="Remove promo"
                        >
                          <X className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <div className="flex items-stretch gap-2 sm:gap-2.5">
                          <div className="flex-[0.75] relative group">
                            {/* Input with modern styling */}
                            <div className={`relative overflow-hidden h-full transition-all duration-300 ${
                              promoValidationState === 'valid' 
                                ? 'ring-2 ring-green-500 dark:ring-green-600 ring-offset-1 dark:ring-offset-gray-800' 
                                : promoValidationState === 'invalid'
                                ? 'ring-2 ring-red-500 dark:ring-red-600 ring-offset-1 dark:ring-offset-gray-800'
                                : 'ring-1 ring-gray-200 dark:ring-gray-700 group-hover:ring-pink-300 dark:group-hover:ring-pink-700'
                            }`}>
                        <input
                          type="text"
                          value={promoCode}
                          onChange={(e) => {
                            setPromoCode(e.target.value.toUpperCase());
                            setPromoError('');
                          }}
                                placeholder="Enter code"
                                className={`w-full h-full py-3 sm:py-2.5 text-sm sm:text-sm font-medium border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-0 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all shadow-sm ${
                                  promoCode.trim().length === 0 
                                    ? 'pl-10 sm:pl-10 pr-10 sm:pr-10' 
                                    : 'pl-10 sm:pl-10 pr-12 sm:pr-12'
                                } ${
                                  promoValidationState === 'valid' 
                                    ? 'text-green-700 dark:text-green-300' 
                                    : promoValidationState === 'invalid'
                                    ? 'text-red-700 dark:text-red-300'
                                    : ''
                                }`}
                              />
                              {/* Tag icon on left - always visible */}
                              <div className="absolute left-3 sm:left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                                <Tag className={`w-4 h-4 sm:w-4 sm:h-4 ${
                                  promoCode.trim().length === 0
                                    ? 'text-gray-400 dark:text-gray-500'
                                    : promoValidationState === 'valid' 
                                    ? 'text-green-500 dark:text-green-400' 
                                    : promoValidationState === 'invalid'
                                    ? 'text-red-500 dark:text-red-400'
                                    : 'text-pink-500 dark:text-pink-400'
                                }`} />
                              </div>
                              {/* Right side: Clear button (when text exists) or Validation Icon */}
                              {promoCode.trim().length > 0 && (
                                <div className="absolute right-3 sm:right-3 top-1/2 -translate-y-1/2 z-20">
                                  {promoValidationState === 'validating' ? (
                                    <div className="w-4 h-4 sm:w-4 sm:h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin pointer-events-none" />
                                  ) : (
                                    // Clear button - always clickable when there's text (even when valid)
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleClearPromoCode();
                                      }}
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                      }}
                                      className={`flex items-center justify-center w-6 h-6 sm:w-6 sm:h-6 rounded-full transition-colors cursor-pointer ${
                                        promoValidationState === 'invalid'
                                          ? 'bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700'
                                          : promoValidationState === 'valid'
                                          ? 'bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700'
                                          : 'bg-gray-400 dark:bg-gray-600 hover:bg-gray-500 dark:hover:bg-gray-700'
                                      }`}
                                      title="Clear promo code"
                                      type="button"
                                      aria-label="Clear promo code"
                                    >
                                      <X className="w-4 h-4 text-white" />
                                    </button>
                                  )}
                                    </div>
                                  )}
                            </div>
                          </div>
                          {/* Modern Apply Button */}
                        <button
                          onClick={handleApplyPromo}
                            disabled={!promoCode.trim() || isApplyingPromo || promoValidationState === 'invalid'}
                            className={`relative flex-[0.25] h-full px-4 sm:px-5 py-3 sm:py-2.5 text-sm sm:text-base font-semibold transition-all duration-300 transform active:scale-95 disabled:active:scale-100 shadow-lg disabled:shadow-sm flex items-center justify-center ${
                              promoValidationState === 'valid'
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 text-white hover:from-green-600 hover:to-emerald-700 dark:hover:from-green-700 dark:hover:to-emerald-800 shadow-green-500/30 dark:shadow-green-600/30'
                                : 'bg-gradient-to-r from-pink-600 to-rose-600 dark:from-pink-700 dark:to-rose-700 text-white hover:from-pink-700 hover:to-rose-700 dark:hover:from-pink-600 dark:hover:to-rose-600 shadow-pink-500/30 dark:shadow-pink-600/30'
                            } disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none`}
                          >
                            {isApplyingPromo ? (
                              <span>Applying...</span>
                            ) : (
                              <span>Apply</span>
                            )}
                            {/* Shine effect on hover */}
                            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 -translate-x-full hover:translate-x-full"></span>
                        </button>
                        </div>
                        {/* Discount Preview with modern design */}
                        {previewDiscount && previewDiscount > 0 && promoValidationState === 'valid' && (
                          <div className="mt-2.5 sm:mt-2 p-2.5 sm:p-2 bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 dark:from-green-900/30 dark:via-emerald-900/20 dark:to-green-900/30 border border-green-200 dark:border-green-700 rounded-lg sm:rounded-md shadow-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-xs sm:text-sm text-green-700 dark:text-green-300 font-semibold flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" />
                                You'll save:
                              </span>
                              <span className="text-base sm:text-lg font-bold text-green-600 dark:text-green-400 bg-white dark:bg-gray-800 px-2 py-0.5 rounded-md">
                                {formatPrice(previewDiscount)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                      {promoError && (
                        <div className="flex items-center justify-between gap-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg sm:rounded-md">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                          <X className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                          <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 font-medium">{promoError}</p>
                          </div>
                          <button
                            onClick={handleClearPromoCode}
                            className="flex-shrink-0 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 rounded p-1 transition-colors"
                            title="Clear and try another code"
                            type="button"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Suggested Promos - Enhanced with One-Click Apply */}
                  {!appliedPromo && suggestedPromos.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400" />
                          Best for You
                        </span>
                        <button
                          onClick={() => setIsSuggestedPromosOpen(!isSuggestedPromosOpen)}
                          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        >
                          {isSuggestedPromosOpen ? 'Hide' : 'View Promos'}
                        </button>
                      </div>
                      {isSuggestedPromosOpen && (
                        <div className="space-y-2">
                          {suggestedPromos.slice(0, 3).map((promo) => {
                            // Calculate potential discount for preview
                            const calculatePreviewDiscount = () => {
                              if (promo.discount_type === 'percentage') {
                                const discount = (subtotal * promo.discount_value) / 100;
                                return promo.max_discount_amount ? Math.min(discount, promo.max_discount_amount) : discount;
                              }
                              return promo.discount_value || 0;
                            };
                            const previewSavings = calculatePreviewDiscount();

                            return (
                          <button
                            key={promo.id || promo.code}
                            onClick={() => handleSuggestedPromo(promo)}
                            disabled={isApplyingPromo}
                                className="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 hover:from-pink-100 hover:to-rose-100 dark:hover:from-pink-900/30 dark:hover:to-rose-900/30 border border-pink-200 dark:border-pink-700 hover:border-pink-300 dark:hover:border-pink-600 rounded-lg transition-all group disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                          >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-sm sm:text-base font-bold text-pink-600 dark:text-pink-400">
                                  {promo.code}
                                      </span>
                                      {previewSavings > 0 && (
                                        <span className="text-xs sm:text-sm font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded">
                                          Save {formatPrice(previewSavings)}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                                      {promo.description || 'Apply this code for instant savings!'}
                                    </p>
                              </div>
                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    {promo.discount_type === 'percentage' ? (
                                      <span className="text-base sm:text-lg font-bold text-pink-600 dark:text-pink-400">
                                        {promo.discount_value}% OFF
                                      </span>
                                    ) : (
                                      <span className="text-base sm:text-lg font-bold text-pink-600 dark:text-pink-400">
                                        ₹{promo.discount_value} OFF
                                      </span>
                                    )}
                                    <ChevronRight className="w-4 h-4 text-pink-600 dark:text-pink-400 group-hover:translate-x-1 transition-transform" />
                                  </div>
                            </div>
                          </button>
                            );
                          })}
                      </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Checkout Button - Hidden on mobile, shown on desktop */}
                <button
                  onClick={handleCheckout}
                  className="hidden lg:block w-full py-3 sm:py-4 bg-gradient-to-r from-pink-600 to-rose-600 dark:from-pink-700 dark:to-rose-700 text-white rounded-lg hover:from-pink-700 hover:to-rose-700 dark:hover:from-pink-600 dark:hover:to-rose-600 transition-all duration-200 font-semibold text-base sm:text-lg shadow-lg dark:shadow-xl dark:shadow-black/30 hover:shadow-xl transform hover:scale-[1.02]"
                >
                  PROCEED TO CHECKOUT
                </button>

                {/* Security Badge - Hidden on mobile, shown on desktop */}
                <div className="hidden lg:block pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-center text-gray-500 dark:text-gray-300">
                    🔒 Secure checkout • Free delivery on orders above ₹{freeDeliveryThreshold}
                  </p>
                </div>
              </div>

              {/* You May Also Like Section - Collapsible */}
              <div className="mt-4 sm:mt-6 mb-12 lg:mb-0 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-xl dark:shadow-black/20 p-4 sm:p-6 lg:overflow-hidden lg:min-w-0 lg:max-w-full lg:w-full">
                <button
                  onClick={() => setIsYouMayAlsoLikeOpen(!isYouMayAlsoLikeOpen)}
                  className="flex items-center justify-between w-full mb-2 sm:mb-4"
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600 dark:text-pink-400" />
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">You May Also Like</h3>
                </div>
                  {isYouMayAlsoLikeOpen ? (
                    <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  )}
                </button>
                {isYouMayAlsoLikeOpen && (
                  <>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-3 sm:mb-4">
                      Add these popular items to complete your order
                    </p>
                    
                    {suggestedSectionsLoading ? (
                      <div className="text-center py-6 sm:py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                        <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 mt-2">Loading suggestions...</p>
                      </div>
                    ) : (suggestedSections.addOns.length === 0 && suggestedSections.gift.length === 0 && suggestedSections.smallTreats.length === 0 && suggestedSections.premiumCakes.length === 0) ? (
                      <div className="text-center py-6 sm:py-8 text-gray-400 dark:text-gray-400">
                        <Package className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-xs sm:text-sm">No suggestions available at the moment</p>
                      </div>
                    ) : (
                      <div className="space-y-6 sm:space-y-7">
                        {/* Section 1: Make Your Cake Extra Special - Add-ons */}
                        {suggestedSections.addOns.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles className="w-4 h-4 text-pink-600 dark:text-pink-400 flex-shrink-0" />
                              <h4 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100">Make Your Cake Extra Special</h4>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Add-ons (candles, balloons, toppers)</p>
                            <div className="overflow-x-auto scrollbar-hide -mx-4 sm:-mx-6 lg:mx-0 px-4 sm:px-6 lg:px-0">
                              <div className="flex gap-3 sm:gap-4 pb-2">
                                {suggestedSections.addOns.map((item) => {
                                  const price = item.discounted_price ?? item.price ?? 0;
                                  const firstCakeItem = cartItems.find(i => !i.is_deal_item);
                                    const handleAddAddOn = () => {
                                    if (!firstCakeItem) {
                                      showInfo('Add a cake first', 'Add a cake to your cart to include add-ons like candles, balloons & toppers.');
                                      return;
                                    }
                                    const newCombo = {
                                      id: Date.now(),
                                      add_on_product_id: item.id,
                                      product_id: item.id,
                                      product_name: item.name || 'Product',
                                      category_name: item.category_name || '',
                                      price: item.price ?? 0,
                                      discounted_price: item.discounted_price ?? null,
                                      discount_percentage: item.discount_percentage ?? 0,
                                      quantity: 1,
                                      image_url: item.image_url || null
                                    };
                                    const existingCombos = firstCakeItem.combos || [];
                                    const existingIndex = existingCombos.findIndex(c => (c.add_on_product_id === item.id || c.product_id === item.id));
                                    const updatedCombos = existingIndex >= 0
                                      ? existingCombos.map((c, i) => i === existingIndex ? { ...c, quantity: (c.quantity || 1) + 1 } : c)
                                      : [...existingCombos, newCombo];
                                    updateCartItemCombos(firstCakeItem.id, updatedCombos);
                                    showSuccess('Added', `${item.name} added to your cake.`);
                                  };
                                  return (
                                    <div key={item.id} className="relative flex-shrink-0 w-[140px] sm:w-[160px] bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-lg dark:hover:shadow-xl dark:hover:shadow-black/30 transition-all duration-300 hover:border-pink-300 dark:hover:border-pink-600 group">
                                      <div className="relative w-full h-[100px] sm:h-[120px] bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 overflow-hidden">
                                        <img src={resolveImageUrl(item.image_url)} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                      </div>
                                      <div className="p-2.5 sm:p-3 space-y-1.5">
                                        <h4 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 leading-tight">{item.name}</h4>
                                        <p className="text-sm font-bold text-pink-600 dark:text-pink-400">{formatPrice(price)}</p>
                                        <button onClick={handleAddAddOn} className="w-full py-2 border-2 border-pink-500 dark:border-pink-600 text-pink-600 dark:text-pink-400 text-xs sm:text-sm font-semibold rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-all duration-200 active:scale-95">
                                          + Include
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Section 2: Complete Your Gift - Flowers, chocolates, dry fruits */}
                        {suggestedSections.gift.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Gift className="w-4 h-4 text-pink-600 dark:text-pink-400 flex-shrink-0" />
                              <h4 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100">Complete Your Gift</h4>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Flowers, chocolates, teddy, dry fruits</p>
                            <div className="overflow-x-auto scrollbar-hide -mx-4 sm:-mx-6 lg:mx-0 px-4 sm:px-6 lg:px-0">
                              <div className="flex gap-3 sm:gap-4 pb-2">
                                {suggestedSections.gift.map((product) => {
                                  const productPrice = product.discounted_price || product.base_price || 0;
                                  const originalPrice = product.base_price;
                                  const hasDiscount = product.discounted_price && product.discounted_price < originalPrice;
                                  const productWeight = product.base_weight || product.variants?.[0]?.weight || null;
                                  return (
                                    <div key={product.id} className="relative flex-shrink-0 w-[140px] sm:w-[160px] lg:w-[170px] bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-lg dark:hover:shadow-xl dark:hover:shadow-black/30 transition-all duration-300 hover:border-pink-300 dark:hover:border-pink-600 group">
                                      {hasDiscount && (
                                        <div className="absolute top-0 right-0 bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-tr-xl rounded-bl-md shadow-md z-10">
                                          {Math.round(((originalPrice - product.discounted_price) / originalPrice) * 100)}% OFF
                                        </div>
                                      )}
                                      <div className="relative w-full h-[140px] sm:h-[160px] bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 cursor-pointer overflow-hidden" onClick={() => router.push(`/product/${product.slug || product.id}`)}>
                                        <img src={resolveImageUrl(product.image_url)} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                      </div>
                                      <div className="p-2.5 sm:p-3 space-y-2">
                                        <h4 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 cursor-pointer hover:text-pink-600 dark:hover:text-pink-400 transition-colors leading-tight" onClick={() => router.push(`/product/${product.slug || product.id}`)}>{product.name}</h4>
                                        {productWeight && (
                                          <div className="flex items-center gap-1">
                                            <Package className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                                            <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 font-medium">{productWeight}</span>
                                          </div>
                                        )}
                                        <div className="flex items-baseline gap-1.5">
                                          <span className="text-sm lg:text-base font-bold text-pink-600 dark:text-pink-400">{formatPrice(productPrice)}</span>
                                          {hasDiscount && <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 line-through">{formatPrice(originalPrice)}</span>}
                                        </div>
                                        <button onClick={() => addToCart({ product, quantity: 1, variant: null, flavor: null, tier: null, combos: [], deliverySlot: null, cakeMessage: '' })} className="w-full py-2 border-2 border-pink-500 dark:border-pink-600 text-pink-600 dark:text-pink-400 text-xs sm:text-sm font-semibold rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:border-pink-600 dark:hover:border-pink-500 transition-all duration-200 active:scale-95">
                                          + Include
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Section 3: Small Treats for Guests */}
                        {suggestedSections.smallTreats.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Package className="w-4 h-4 text-pink-600 dark:text-pink-400 flex-shrink-0" />
                              <h4 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100">Small Treats for Guests</h4>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Brownies, pastries, mini desserts</p>
                            <div className="overflow-x-auto scrollbar-hide -mx-4 sm:-mx-6 lg:mx-0 px-4 sm:px-6 lg:px-0">
                              <div className="flex gap-3 sm:gap-4 pb-2">
                                {suggestedSections.smallTreats.map((product) => {
                                  const productPrice = product.discounted_price || product.base_price || 0;
                                  const originalPrice = product.base_price;
                                  const hasDiscount = product.discounted_price && product.discounted_price < originalPrice;
                                  const productWeight = product.base_weight || product.variants?.[0]?.weight || null;
                                  return (
                                    <div key={product.id} className="relative flex-shrink-0 w-[140px] sm:w-[160px] lg:w-[170px] bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-lg dark:hover:shadow-xl dark:hover:shadow-black/30 transition-all duration-300 hover:border-pink-300 dark:hover:border-pink-600 group">
                                      {hasDiscount && (
                                        <div className="absolute top-0 right-0 bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-tr-xl rounded-bl-md shadow-md z-10">
                                          {Math.round(((originalPrice - product.discounted_price) / originalPrice) * 100)}% OFF
                                        </div>
                                      )}
                                      <div className="relative w-full h-[140px] sm:h-[160px] bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 cursor-pointer overflow-hidden" onClick={() => router.push(`/product/${product.slug || product.id}`)}>
                                        <img src={resolveImageUrl(product.image_url)} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                      </div>
                                      <div className="p-2.5 sm:p-3 space-y-2">
                                        <h4 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 cursor-pointer hover:text-pink-600 dark:hover:text-pink-400 transition-colors leading-tight" onClick={() => router.push(`/product/${product.slug || product.id}`)}>{product.name}</h4>
                                        {productWeight && (
                                          <div className="flex items-center gap-1">
                                            <Package className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                                            <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 font-medium">{productWeight}</span>
                                          </div>
                                        )}
                                        <div className="flex items-baseline gap-1.5">
                                          <span className="text-sm lg:text-base font-bold text-pink-600 dark:text-pink-400">{formatPrice(productPrice)}</span>
                                          {hasDiscount && <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 line-through">{formatPrice(originalPrice)}</span>}
                                        </div>
                                        <button onClick={() => addToCart({ product, quantity: 1, variant: null, flavor: null, tier: null, combos: [], deliverySlot: null, cakeMessage: '' })} className="w-full py-2 border-2 border-pink-500 dark:border-pink-600 text-pink-600 dark:text-pink-400 text-xs sm:text-sm font-semibold rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:border-pink-600 dark:hover:border-pink-500 transition-all duration-200 active:scale-95">
                                          Add Extra
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Section 4: Upgrade Your Cake - Premium cakes (optional, 1–2) */}
                        {suggestedSections.premiumCakes.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingUp className="w-4 h-4 text-pink-600 dark:text-pink-400 flex-shrink-0" />
                              <h4 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100">Upgrade Your Cake</h4>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Premium cakes</p>
                            <div className="overflow-x-auto scrollbar-hide -mx-4 sm:-mx-6 lg:mx-0 px-4 sm:px-6 lg:px-0">
                              <div className="flex gap-3 sm:gap-4 pb-2">
                                {suggestedSections.premiumCakes.map((product) => {
                                  const productPrice = product.discounted_price || product.base_price || 0;
                                  const originalPrice = product.base_price;
                                  const hasDiscount = product.discounted_price && product.discounted_price < originalPrice;
                                  const productWeight = product.base_weight || product.variants?.[0]?.weight || null;
                                  return (
                                    <div key={product.id} className="relative flex-shrink-0 w-[140px] sm:w-[160px] lg:w-[170px] bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-lg dark:hover:shadow-xl dark:hover:shadow-black/30 transition-all duration-300 hover:border-pink-300 dark:hover:border-pink-600 group">
                                      {hasDiscount && (
                                        <div className="absolute top-0 right-0 bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-tr-xl rounded-bl-md shadow-md z-10">
                                          {Math.round(((originalPrice - product.discounted_price) / originalPrice) * 100)}% OFF
                                        </div>
                                      )}
                                      <div className="relative w-full h-[140px] sm:h-[160px] bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 cursor-pointer overflow-hidden" onClick={() => router.push(`/product/${product.slug || product.id}`)}>
                                        <img src={resolveImageUrl(product.image_url)} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                      </div>
                                      <div className="p-2.5 sm:p-3 space-y-2">
                                        <h4 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 cursor-pointer hover:text-pink-600 dark:hover:text-pink-400 transition-colors leading-tight" onClick={() => router.push(`/product/${product.slug || product.id}`)}>{product.name}</h4>
                                        {productWeight && (
                                          <div className="flex items-center gap-1">
                                            <Package className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                                            <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 font-medium">{productWeight}</span>
                                          </div>
                                        )}
                                        <div className="flex items-baseline gap-1.5">
                                          <span className="text-sm lg:text-base font-bold text-pink-600 dark:text-pink-400">{formatPrice(productPrice)}</span>
                                          {hasDiscount && <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 line-through">{formatPrice(originalPrice)}</span>}
                                        </div>
                                        <button onClick={() => addToCart({ product, quantity: 1, variant: null, flavor: null, tier: null, combos: [], deliverySlot: null, cakeMessage: '' })} className="w-full py-2 border-2 border-pink-500 dark:border-pink-600 text-pink-600 dark:text-pink-400 text-xs sm:text-sm font-semibold rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:border-pink-600 dark:hover:border-pink-500 transition-all duration-200 active:scale-95">
                                          + Add
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Sticky Delivery Slot Summary */}
      {mounted && isInitialized && cartItems.length > 0 && (() => {
        // Get common delivery slot from cart items (non-deal items only)
        const regularItems = cartItems.filter(item => !item.is_deal_item && item.deliverySlot);
        const commonSlot = regularItems.length > 0 ? regularItems[0].deliverySlot : null;
        
        // Check if all regular items have the same slot
        const allSameSlot = regularItems.length > 0 && regularItems.every(item => {
          const slot1 = commonSlot;
          const slot2 = item.deliverySlot;
          const date1 = slot1?.date || slot1?.deliveryDate;
          const date2 = slot2?.date || slot2?.deliveryDate;
          const time1 = slot1?.time || slot1?.slot?.startTime;
          const time2 = slot2?.time || slot2?.slot?.startTime;
          return date1 === date2 && time1 === time2;
        });

        return commonSlot && allSameSlot ? (
          <div className="lg:hidden fixed left-0 right-0 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-t border-green-200 dark:border-green-800 shadow-lg dark:shadow-black/30 z-39 bottom-[8.5rem]">
            <div className="max-w-7xl mx-auto px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Clock className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 truncate">
                    <span className="font-semibold">Delivery:</span>{' '}
                    {formatDeliveryDate(commonSlot.date || commonSlot.deliveryDate)} • {formatTimeSlot(commonSlot)}
                  </span>
                </div>
                <button
                  onClick={() => router.push('/checkout')}
                  className="text-xs font-semibold text-green-700 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 underline underline-offset-2 flex-shrink-0"
                >
                  Change
                </button>
              </div>
            </div>
          </div>
        ) : null;
      })()}

      {/* Mobile Sticky Checkout Bar (Amount + Proceed to Checkout) - when cart has items; no bottom nav shown so bar sits at bottom */}
      {mounted && isInitialized && cartItems.length > 0 && (
        <div className="lg:hidden fixed left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-2xl dark:shadow-black/50 z-40 bottom-0">
          <div className="max-w-7xl mx-auto px-2 py-1.5">
            {/* Total Box and Checkout Button Row */}
            <div className="flex items-center gap-1.5 mb-1">
              {/* Total Box - 20vw, height matches PDP Add to Cart button (52px) */}
              <div className="w-[20vw] min-w-[70px] bg-gray-50 dark:bg-gray-700/50 rounded-lg px-1.5 py-1.5 border border-pink-300 dark:border-pink-500/50 min-h-[52px] flex items-center">
                <div className="flex flex-col w-full items-center text-center">
                  <p className="text-sm font-bold text-pink-600 dark:text-pink-400 leading-tight mb-0.5">{formatPrice(total)}</p>
                  <span className="text-[9px] text-gray-500 dark:text-gray-400 leading-tight">
                    {cartSummary.totalItems} {cartSummary.totalItems === 1 ? 'item' : 'items'}
                  </span>
                </div>
              </div>
              
              {/* Checkout Button - 80vw, height matches PDP Add to Cart (52px) */}
              <button
                onClick={handleCheckout}
                className="flex-1 w-[80vw] min-h-[52px] py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 dark:from-pink-700 dark:to-rose-700 text-white hover:from-pink-700 hover:to-rose-700 dark:hover:from-pink-600 dark:hover:to-rose-600 transition-all font-bold text-base shadow-lg dark:shadow-xl dark:shadow-black/30 active:scale-95 flex items-center justify-center gap-2"
              >
                <span>PROCEED TO CHECKOUT</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            
            {/* Free Delivery Message & Security Badge - Inline */}
            <div className="flex items-center justify-center gap-1.5">
            {!isFreeDeliveryEligible && (
                <p className="text-[9px] text-gray-500 dark:text-gray-400">
                Add {formatPrice(amountToFreeDelivery)} more for free delivery
              </p>
            )}
              <p className="text-[8px] text-gray-400 dark:text-gray-500">
                🔒 Secure checkout
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Sheet for Mobile Actions */}
      {bottomSheetOpen && selectedItemForActions && (
        <div 
          className="fixed inset-0 z-50 sm:hidden"
          onClick={closeBottomSheet}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 dark:bg-black/70" />
          
          {/* Bottom Sheet */}
          <div 
            className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-2xl shadow-2xl max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>
            
            {/* Header */}
            <div className="px-4 pb-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
                {selectedItemForActions.product.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Choose an action
              </p>
            </div>
            
            {/* Actions */}
            <div className="px-4 py-3 space-y-2 max-h-[60vh] overflow-y-auto">
              <button
                onClick={() => {
                  handleSaveForLater(selectedItemForActions.id);
                  closeBottomSheet();
                }}
                disabled={savingItemId === selectedItemForActions.id || removingItemId === selectedItemForActions.id}
                className="w-full flex items-center gap-3 px-4 py-3 text-left border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <Package className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div className="flex-1">
                  <p className="font-medium">Save for Later</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Move this item to saved items</p>
                </div>
                {savingItemId === selectedItemForActions.id && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 dark:border-gray-400" />
                )}
              </button>
              
              <button
                onClick={() => {
                  router.push(`/product/${selectedItemForActions.product.slug || selectedItemForActions.product.id}`);
                  closeBottomSheet();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left border border-pink-300 dark:border-pink-700 text-pink-600 dark:text-pink-400 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/30 transition-colors"
              >
                <Gift className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                <div className="flex-1">
                  <p className="font-medium">Edit Item</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Modify product options</p>
                </div>
                <ChevronRight className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => {
                  handleRemoveItem(selectedItemForActions.id);
                  closeBottomSheet();
                }}
                disabled={removingItemId === selectedItemForActions.id}
                className="w-full flex items-center gap-3 px-4 py-3 text-left border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                <div className="flex-1">
                  <p className="font-medium">Remove Item</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Delete from cart</p>
                </div>
                {removingItemId === selectedItemForActions.id && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 dark:border-red-400" />
                )}
              </button>
            </div>
            
            {/* Close Button */}
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={closeBottomSheet}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer: Hidden on mobile for better UX, visible on desktop, always in DOM for SEO */}
      <div className="hidden lg:block">
        <Footer />
      </div>

      {/* Mobile Footer (Home, Wishlist, Cart, etc.) - show only when cart is empty after mount to avoid hydration mismatch */}
      <div className="lg:hidden">
        {mounted && cartItems.length === 0 && <MobileFooter />}
      </div>

      {/* Duplicate Products Validation Modal */}
      {showDuplicateModal && duplicateGroups.length > 0 && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl dark:shadow-black/50 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                  Similar Products Detected
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  You have the same product with different variations
                </p>
              </div>
              <button
                onClick={() => setShowDuplicateModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {duplicateGroups.map((group, groupIndex) => (
                <div key={groupIndex} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    {group.productName}
                  </h3>
                  <div className="space-y-3">
                    {group.items.map((item, itemIndex) => (
                      <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600 relative group">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 flex-shrink-0">
                            <img
                              src={resolveImageUrl(item.product?.image_url)}
                              alt={item.product?.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-700">
                                {getDescriptiveLabel(item, groupIndex, itemIndex)}
                              </span>
                            </div>
                            <div className="space-y-1 text-xs sm:text-sm">
                              {item.deliverySlot && (
                                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                  <Clock className="w-3.5 h-3.5 text-gray-500" />
                                  <span>
                                    {formatDeliveryDate(item.deliverySlot.date || item.deliverySlot.deliveryDate)} • {formatTimeSlot(item.deliverySlot)}
                                  </span>
                                </div>
                              )}
                              {item.combos && item.combos.length > 0 && (
                                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                  <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                                  <span>{item.combos.length} add-on{item.combos.length > 1 ? 's' : ''}</span>
                                </div>
                              )}
                              {item.flavor && (
                                <div className="text-gray-700 dark:text-gray-300">
                                  Flavor: {item.flavor.name || item.flavor}
                                </div>
                              )}
                              {item.tier && (
                                <div className="text-gray-700 dark:text-gray-300">
                                  Tier: {item.tier}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* Delete Button */}
                        <button
                          onClick={() => {
                            const itemLabel = getDescriptiveLabel(item, groupIndex, itemIndex);
                            
                            // Remove item from cart
                            removeFromCart(item.id);
                            
                            // Immediately update modal state by filtering out deleted item
                            const updatedGroups = duplicateGroups.map(group => {
                              // Check if this group contains the deleted item
                              const itemIndexInGroup = group.items.findIndex(i => i.id === item.id);
                              if (itemIndexInGroup === -1) {
                                return group; // Item not in this group, keep as is
                              }
                              
                              // Remove the deleted item from this group
                              const filteredItems = group.items.filter(i => i.id !== item.id);
                              
                              // If only one or zero items left, remove the group (no longer duplicates)
                              if (filteredItems.length <= 1) {
                                return null;
                              }
                              
                              // Recalculate differences for remaining items
                              const remainingDifferences = new Set();
                              for (let k = 1; k < filteredItems.length; k++) {
                                const firstItem = filteredItems[0];
                                const compareItem = filteredItems[k];
                                
                                // Check delivery slot
                                const slot1 = firstItem.deliverySlot;
                                const slot2 = compareItem.deliverySlot;
                                const slot1Date = slot1?.date || slot1?.deliveryDate;
                                const slot2Date = slot2?.date || slot2?.deliveryDate;
                                const slot1Time = slot1?.time || slot1?.slot?.startTime || slot1?.slot?.id;
                                const slot2Time = slot2?.time || slot2?.slot?.startTime || slot2?.slot?.id;
                                if (slot1Date !== slot2Date || slot1Time !== slot2Time) {
                                  remainingDifferences.add('Delivery Time Slot');
                                }
                                
                                // Check combos
                                const combos1 = firstItem.combos || [];
                                const combos2 = compareItem.combos || [];
                                const normalizeCombo = (combo) => {
                                  const productId = combo.add_on_product_id || combo.product_id;
                                  return `${productId}-${combo.quantity}`;
                                };
                                const combos1Str = combos1.map(normalizeCombo).sort().join(',');
                                const combos2Str = combos2.map(normalizeCombo).sort().join(',');
                                if (combos1Str !== combos2Str) {
                                  remainingDifferences.add('Add-ons/Combos');
                                }
                                
                                // Check flavor
                                const flavor1 = firstItem.flavor?.id || firstItem.flavor?.name;
                                const flavor2 = compareItem.flavor?.id || compareItem.flavor?.name;
                                if (flavor1 !== flavor2) {
                                  remainingDifferences.add('Flavor');
                                }
                                
                                // Check tier
                                if (firstItem.tier !== compareItem.tier) {
                                  remainingDifferences.add('Tier');
                                }
                                
                                // Check variant
                                const variant1 = firstItem.variant?.id || firstItem.variant?.weight;
                                const variant2 = compareItem.variant?.id || compareItem.variant?.weight;
                                if (variant1 !== variant2) {
                                  remainingDifferences.add('Weight/Variant');
                                }
                              }
                              
                              return {
                                ...group,
                                items: filteredItems,
                                differences: Array.from(remainingDifferences),
                                hasVariations: remainingDifferences.size > 0
                              };
                            }).filter(group => group !== null);
                            
                            // Update modal state immediately for instant UI feedback
                            if (updatedGroups.length === 0) {
                              // All duplicates resolved - close modal and redirect to checkout
                              // User's original intent was to proceed to checkout
                              setShowDuplicateModal(false);
                              // Small delay to allow modal close animation, then redirect
                              // Use push instead of replace to preserve Cart in history
                              // This ensures browser back button from Checkout goes to Cart
                              setTimeout(() => {
                                if (typeof window !== 'undefined') {
                                  sessionStorage.setItem('navigated_from_cart', 'true');
                                }
                                router.push('/checkout');
                              }, 200);
                            } else {
                              setDuplicateGroups(updatedGroups);
                            }
                            
                            // Also re-verify with actual cart state after a delay to ensure consistency
                            setTimeout(() => {
                              const recheckedDuplicates = detectDuplicateProducts();
                              // Only update if there's a discrepancy (safety check)
                              if (recheckedDuplicates.length === 0 && updatedGroups.length > 0) {
                                // All duplicates resolved - redirect to checkout
                                setShowDuplicateModal(false);
                                setTimeout(() => {
                                  if (typeof window !== 'undefined') {
                                    sessionStorage.setItem('navigated_from_cart', 'true');
                                  }
                                  router.push('/checkout');
                                }, 200);
                              } else if (recheckedDuplicates.length !== updatedGroups.length) {
                                setDuplicateGroups(recheckedDuplicates);
                              }
                            }, 400);
                          }}
                          className="absolute top-2 right-2 p-1.5 sm:p-2 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 active:bg-red-200 dark:active:bg-red-900/40 text-red-600 dark:text-red-400 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 shadow-sm hover:shadow-md"
                          aria-label={`Remove ${getDescriptiveLabel(item, groupIndex, itemIndex)}`}
                          title="Remove this item"
                        >
                          <Trash2 className="w-4 h-4 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {group.hasVariations ? (
                        <>
                          <strong>Differences:</strong> {group.differences.join(', ')}
                        </>
                      ) : (
                        <>
                          <strong>Note:</strong> These items appear to be identical. Consider removing duplicates if not needed.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer with Actions */}
            <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                These items will be processed as separate orders. You can continue to checkout or review your cart.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleReviewItems}
                  className="flex-1 px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Review Items
                </button>
                <button
                  onClick={handleContinueToCheckout}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 dark:from-pink-700 dark:to-rose-700 text-white rounded-lg hover:from-pink-700 hover:to-rose-700 dark:hover:from-pink-600 dark:hover:to-rose-600 transition-all font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  Continue to Checkout
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        cancelLabel={confirmModal.cancelLabel}
        variant={confirmModal.variant}
        onConfirm={handleConfirmModalConfirm}
        onCancel={closeConfirmModal}
      />
    </div>
  );
}

