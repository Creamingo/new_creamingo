'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ToastContext } from './ToastContext';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  // Get toast functions (use useContext directly to avoid hook order issues)
  // Use a ref to safely access toast without causing render issues
  const toastContextValue = useContext(ToastContext);
  const toastRef = React.useRef(toastContextValue);
  
  // Update ref when context changes, but don't cause re-renders
  React.useEffect(() => {
    toastRef.current = toastContextValue;
  }, [toastContextValue]);
  
  // Helper function to safely get toast functions
  const getToast = () => toastRef.current;
  
  // Ref to track recent removals and prevent duplicate toasts
  const recentRemovalsRef = React.useRef(new Set());

  // Initialize state with empty array, will be loaded from localStorage on mount
  const [cartItems, setCartItems] = useState(() => {
    // Only run on client side during initial render
    if (typeof window === 'undefined') return [];
    
    try {
      const savedCart = localStorage.getItem('creamingo_cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        if (Array.isArray(parsedCart) && parsedCart.length > 0) {
          return parsedCart;
        }
      }
    } catch (err) {
      console.error('Error loading cart from localStorage on init:', err);
    }
    return [];
  });

  const [savedItems, setSavedItems] = useState(() => {
    // Only run on client side during initial render
    if (typeof window === 'undefined') return [];
    
    try {
      const savedItemsData = localStorage.getItem('creamingo_saved_items');
      if (savedItemsData) {
        const parsedSaved = JSON.parse(savedItemsData);
        if (Array.isArray(parsedSaved) && parsedSaved.length > 0) {
          return parsedSaved;
        }
      }
    } catch (err) {
      console.error('Error loading saved items from localStorage on init:', err);
    }
    return [];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [duplicateDetected, setDuplicateDetected] = useState(false);
  // Initialize based on whether we successfully loaded cart items
  const [isInitialized, setIsInitialized] = useState(() => {
    // If we're on client and we have cart items, we're initialized
    if (typeof window !== 'undefined') {
      try {
        const savedCart = localStorage.getItem('creamingo_cart');
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          if (Array.isArray(parsedCart)) {
            return true; // We have cart data, consider initialized
          }
        }
      } catch (err) {
        // Silent error - will be handled in useEffect
      }
    }
    return false;
  });

  // Helper function to serialize item for storage (converts Date objects and complex objects to strings)
  const serializeItemForStorage = (item) => {
    if (!item) return item;
    
    const serialized = { ...item };
    
    // Convert deliverySlot.date from Date to string if it exists
    if (serialized.deliverySlot) {
      serialized.deliverySlot = { ...serialized.deliverySlot };
      if (serialized.deliverySlot.date instanceof Date) {
        serialized.deliverySlot.date = serialized.deliverySlot.date.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format
      } else if (serialized.deliverySlot.date && typeof serialized.deliverySlot.date === 'object') {
        // Handle if it's already an object but not a Date
        serialized.deliverySlot.date = serialized.deliverySlot.date.toString();
      }
      
      // Ensure all other deliverySlot properties are serializable
      if (serialized.deliverySlot.slot) {
        serialized.deliverySlot.slot = JSON.parse(JSON.stringify(serialized.deliverySlot.slot));
      }
    }
    
    // Ensure product and variant are properly serialized
    if (serialized.product) {
      serialized.product = JSON.parse(JSON.stringify(serialized.product));
    }
    if (serialized.variant) {
      serialized.variant = JSON.parse(JSON.stringify(serialized.variant));
    }
    if (serialized.flavor) {
      serialized.flavor = JSON.parse(JSON.stringify(serialized.flavor));
    }
    if (serialized.combos && Array.isArray(serialized.combos)) {
      serialized.combos = serialized.combos.map(combo => JSON.parse(JSON.stringify(combo)));
    }
    
    return serialized;
  };

  // Helper function to deserialize items from storage
  const deserializeItemFromStorage = (item) => {
    if (!item) return item;
    
    const deserialized = { ...item };
    
    // Restore deliverySlot.date if it exists
    if (deserialized.deliverySlot && deserialized.deliverySlot.date) {
      // Keep date as string - it will be used as string in most cases
      // If Date object is needed, it can be converted when needed
      deserialized.deliverySlot = { ...deserialized.deliverySlot };
    }
    
    return deserialized;
  };

  // Load cart and saved items from localStorage on mount (sync with localStorage if needed)
  // Note: We use a ref to track if we've already initialized to prevent duplicate loading
  const hasInitializedRef = React.useRef(false);
  
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      setIsInitialized(true);
      return;
    }

    // Skip if already initialized from useState initializer
    if (hasInitializedRef.current) {
      setIsInitialized(true);
      return;
    }

    try {
      const savedCart = localStorage.getItem('creamingo_cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        if (Array.isArray(parsedCart) && parsedCart.length > 0) {
          const deserializedCart = parsedCart.map(deserializeItemFromStorage);
          // Only update if cartItems is empty (wasn't loaded in initializer)
          setCartItems(prev => {
            // If prev already has items from initializer, don't overwrite
            if (prev.length > 0) {
              return prev;
            }
            return deserializedCart;
          });
        }
      }
    } catch (err) {
      console.error('Error loading cart from localStorage:', err);
      // Only clear if there's actual corruption, not just missing data
      try {
        const savedCart = localStorage.getItem('creamingo_cart');
        if (savedCart && savedCart !== '[]' && savedCart !== 'null') {
          localStorage.removeItem('creamingo_cart');
          console.warn('Cleared corrupted cart data');
        }
      } catch (e) {
        console.error('Error removing corrupted cart:', e);
      }
    }

    try {
      const savedItemsData = localStorage.getItem('creamingo_saved_items');
      if (savedItemsData) {
        const parsedSaved = JSON.parse(savedItemsData);
        if (Array.isArray(parsedSaved) && parsedSaved.length > 0) {
          const deserializedSaved = parsedSaved.map(deserializeItemFromStorage);
          // Only update if savedItems is empty (wasn't loaded in initializer)
          setSavedItems(prev => {
            // If prev already has items from initializer, don't overwrite
            if (prev.length > 0) {
              return prev;
            }
            return deserializedSaved;
          });
        }
      }
    } catch (err) {
      console.error('Error loading saved items from localStorage:', err);
      // Only clear if there's actual corruption
      try {
        const savedItemsData = localStorage.getItem('creamingo_saved_items');
        if (savedItemsData && savedItemsData !== '[]' && savedItemsData !== 'null') {
          localStorage.removeItem('creamingo_saved_items');
          console.warn('Cleared corrupted saved items data');
        }
      } catch (e) {
        console.error('Error removing corrupted saved items:', e);
      }
    }

    hasInitializedRef.current = true;
    setIsInitialized(true);
  }, []);

  // Remove duplicates from cart items (based on unique ID)
  const deduplicateCartItems = React.useCallback((items) => {
    const seen = new Set();
    return items.filter(item => {
      if (!item || !item.id) return false;
      if (seen.has(item.id)) {
        console.warn('Duplicate cart item found and removed:', item.id);
        return false;
      }
      seen.add(item.id);
      return true;
    });
  }, []);

  // Save cart to localStorage whenever cartItems change (with deduplication)
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    // Skip if not initialized yet
    if (!hasInitializedRef.current) return;

    try {
      // Deduplicate before saving
      const deduplicatedCart = deduplicateCartItems(cartItems);
      
      // Update state if duplicates were found (use functional update to prevent loops)
      if (deduplicatedCart.length !== cartItems.length) {
        setCartItems(() => deduplicatedCart);
        return; // Let the next render save the deduplicated cart
      }
      
      // Only save if cart items actually changed
      const serializedCart = deduplicatedCart.map(serializeItemForStorage);
      const cartString = JSON.stringify(serializedCart);
      const savedCart = localStorage.getItem('creamingo_cart');
      
      // Avoid unnecessary writes to localStorage
      if (savedCart !== cartString) {
        localStorage.setItem('creamingo_cart', cartString);
      }
    } catch (err) {
      console.error('Error saving cart to localStorage:', err);
    }
  }, [cartItems, deduplicateCartItems]);

  // Save saved items to localStorage whenever savedItems change
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    // Skip if not initialized yet
    if (!hasInitializedRef.current) return;

    try {
      const serializedSaved = savedItems.map(serializeItemForStorage);
      const savedItemsString = JSON.stringify(serializedSaved);
      const existingSaved = localStorage.getItem('creamingo_saved_items');
      
      // Avoid unnecessary writes to localStorage
      if (existingSaved !== savedItemsString) {
        localStorage.setItem('creamingo_saved_items', savedItemsString);
      }
    } catch (err) {
      console.error('Error saving saved items to localStorage:', err);
    }
  }, [savedItems]);

  // Check if delivery slot is expired
  // VERY CONSERVATIVE: Only removes items if delivery date is clearly more than 1 day in the past
  const isDeliverySlotExpired = (deliverySlot) => {
    if (!deliverySlot || !deliverySlot.date) return false;
    
    try {
      // Get delivery date - handle various formats
      let deliveryDate;
      if (deliverySlot.date instanceof Date) {
        deliveryDate = new Date(deliverySlot.date);
      } else if (typeof deliverySlot.date === 'string') {
        // Handle YYYY-MM-DD format (stored in localStorage)
        // Parse as local date to avoid timezone issues
        const dateParts = deliverySlot.date.split('-');
        if (dateParts.length === 3) {
          const year = parseInt(dateParts[0], 10);
          const month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed
          const day = parseInt(dateParts[2], 10);
          if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
            deliveryDate = new Date(year, month, day);
          } else {
            // Fallback to standard parsing
            deliveryDate = new Date(deliverySlot.date);
          }
        } else {
          // Fallback to standard parsing for other formats
          deliveryDate = new Date(deliverySlot.date);
        }
        
        // Check if date is valid
        if (isNaN(deliveryDate.getTime())) {
          console.warn('Invalid delivery date format:', deliverySlot.date);
          return false; // Can't determine expiry if date is invalid
        }
      } else {
        return false; // Can't determine expiry
      }

      // Get current date/time in local timezone
      const now = new Date();
      
      // Compare dates only (without time) using local timezone
      // This avoids timezone issues when comparing dates
      const deliveryDateOnly = new Date(
        deliveryDate.getFullYear(), 
        deliveryDate.getMonth(), 
        deliveryDate.getDate()
      );
      const todayOnly = new Date(
        now.getFullYear(), 
        now.getMonth(), 
        now.getDate()
      );
      
      // Calculate difference in days
      const diffTime = deliveryDateOnly.getTime() - todayOnly.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      // VERY CONSERVATIVE: Only expire if delivery date is more than 1 day in the past
      // This prevents false positives due to timezone or timing issues
      // We don't check time of day - only the date difference
      if (diffDays < -1) {
        // More than 1 day in the past - definitely expired
        return true;
      }
      
      // If delivery date is today, yesterday, or in the future, don't expire
      // This is very conservative to prevent removing valid items
      return false;
    } catch (err) {
      console.error('Error checking slot expiry:', err, deliverySlot);
      // On error, don't expire the item (be safe)
      return false;
    }
  };

  // Check if item is duplicate (same product, variant, flavor, tier, combos, and delivery slot)
  const isDuplicateItem = (newItem, existingItem) => {
    // Check product and variant
    if (newItem.product.id !== existingItem.product.id) return false;
    const newVariantId = newItem.variant?.id || null;
    const existingVariantId = existingItem.variant?.id || null;
    if (newVariantId !== existingVariantId) return false;

    // Check flavor
    const newFlavorId = newItem.flavor?.id || null;
    const existingFlavorId = existingItem.flavor?.id || null;
    if (newFlavorId !== existingFlavorId) return false;
    
    // Check combos - items with different combos are NOT duplicates
    const newCombos = newItem.combos || [];
    const existingCombos = existingItem.combos || [];
    
    // If combo counts differ, they're not duplicates
    if (newCombos.length !== existingCombos.length) return false;
    
    // If both have combos, check if they're the same
    if (newCombos.length > 0) {
      // Sort by add_on_product_id (primary field) or product_id (fallback) and quantity for comparison
      const normalizeCombo = (combo) => {
        // Use add_on_product_id as primary field (from database combo_selections table)
        // Fallback to product_id for backward compatibility
        const productId = combo.add_on_product_id || combo.product_id;
        return {
          product_id: productId,
        quantity: combo.quantity
        };
      };
      const newCombosNormalized = newCombos.map(normalizeCombo).sort((a, b) => 
        (a.product_id || 0) - (b.product_id || 0) || a.quantity - b.quantity
      );
      const existingCombosNormalized = existingCombos.map(normalizeCombo).sort((a, b) => 
        (a.product_id || 0) - (b.product_id || 0) || a.quantity - b.quantity
      );
      
      // Compare normalized combos
      if (JSON.stringify(newCombosNormalized) !== JSON.stringify(existingCombosNormalized)) {
        return false; // Different combos = not duplicate
      }
    }

    // Check tier
    if (newItem.tier !== existingItem.tier) return false;

    // Check delivery slot (compare date and slot ID/time)
    const newSlotDate = newItem.deliverySlot?.date;
    const existingSlotDate = existingItem.deliverySlot?.date;
    
    // Normalize dates for comparison
    const normalizeDate = (date) => {
      if (!date) return null;
      if (date instanceof Date) return date.toISOString().split('T')[0];
      if (typeof date === 'string') {
        const parsed = new Date(date);
        if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
      }
      return String(date);
    };
    
    const newDateStr = normalizeDate(newSlotDate);
    const existingDateStr = normalizeDate(existingSlotDate);
    if (newDateStr !== existingDateStr) return false;

    // Check slot ID or time
    const newSlotId = newItem.deliverySlot?.slotId || newItem.deliverySlot?.slot?.id || null;
    const existingSlotId = existingItem.deliverySlot?.slotId || existingItem.deliverySlot?.slot?.id || null;
    if (newSlotId && existingSlotId && newSlotId !== existingSlotId) return false;

    // If both have time strings, compare them
    const newTime = newItem.deliverySlot?.time || null;
    const existingTime = existingItem.deliverySlot?.time || null;
    if (newTime && existingTime && newTime !== existingTime) return false;

    return true; // All matching criteria met
  };

  // Check if items match except for delivery slot (for informative messaging)
  const isSameItemDifferentSlot = (newItem, existingItem) => {
    // First check if they would be duplicates if we ignore delivery slot
    // Check product and variant
    if (newItem.product.id !== existingItem.product.id) return false;
    const newVariantId = newItem.variant?.id || null;
    const existingVariantId = existingItem.variant?.id || null;
    if (newVariantId !== existingVariantId) return false;

    // Check flavor
    const newFlavorId = newItem.flavor?.id || null;
    const existingFlavorId = existingItem.flavor?.id || null;
    if (newFlavorId !== existingFlavorId) return false;
    
    // Check combos
    const newCombos = newItem.combos || [];
    const existingCombos = existingItem.combos || [];
    if (newCombos.length !== existingCombos.length) return false;
    
    if (newCombos.length > 0) {
      const normalizeCombo = (combo) => {
        const productId = combo.add_on_product_id || combo.product_id;
        return {
          product_id: productId,
          quantity: combo.quantity
        };
      };
      const newCombosNormalized = newCombos.map(normalizeCombo).sort((a, b) => 
        (a.product_id || 0) - (b.product_id || 0) || a.quantity - b.quantity
      );
      const existingCombosNormalized = existingCombos.map(normalizeCombo).sort((a, b) => 
        (a.product_id || 0) - (b.product_id || 0) || a.quantity - b.quantity
      );
      
      if (JSON.stringify(newCombosNormalized) !== JSON.stringify(existingCombosNormalized)) {
        return false;
      }
    }

    // Check tier
    if (newItem.tier !== existingItem.tier) return false;

    // If we reach here, all fields match except potentially delivery slot
    // Now check if delivery slot is actually different
    const newSlotDate = newItem.deliverySlot?.date;
    const existingSlotDate = existingItem.deliverySlot?.date;
    
    const normalizeDate = (date) => {
      if (!date) return null;
      if (date instanceof Date) return date.toISOString().split('T')[0];
      if (typeof date === 'string') {
        const parsed = new Date(date);
        if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
      }
      return String(date);
    };
    
    const newDateStr = normalizeDate(newSlotDate);
    const existingDateStr = normalizeDate(existingSlotDate);
    
    // If dates don't match, definitely different slot
    if (newDateStr !== existingDateStr) {
      return true; // Different delivery slot
    }
    
    // Dates match, check slot ID/time
    const newSlotId = newItem.deliverySlot?.slotId || newItem.deliverySlot?.slot?.id || null;
    const existingSlotId = existingItem.deliverySlot?.slotId || existingItem.deliverySlot?.slot?.id || null;
    
    // If both have slot IDs and they differ, different slot
    if (newSlotId && existingSlotId && newSlotId !== existingSlotId) {
      return true; // Different delivery slot
    }
    
    // Check time strings
    const newTime = newItem.deliverySlot?.time || null;
    const existingTime = existingItem.deliverySlot?.time || null;
    if (newTime && existingTime && newTime !== existingTime) {
      return true; // Different delivery slot
    }
    
    // If one has slot info and other doesn't, consider different
    if ((newSlotId || newTime) && !(existingSlotId || existingTime)) {
      return true; // Different delivery slot
    }
    if (!(newSlotId || newTime) && (existingSlotId || existingTime)) {
      return true; // Different delivery slot
    }
    
    // If we reach here, delivery slots are the same (or both null)
    return false; // Not a "different slot" case
  };

  // Update delivery slot for a cart item
  const updateCartItemDeliverySlot = React.useCallback((itemId, newDeliverySlot) => {
    setCartItems(prev => 
      prev.map(item => {
        if (item.id === itemId) {
          return { ...item, deliverySlot: newDeliverySlot };
        }
        return item;
      })
    );
  }, []);

  // Auto-update expired delivery slots with next available slot
  const autoUpdateExpiredSlots = React.useCallback(async () => {
    if (!cartItems || cartItems.length === 0) return;

    const expiredItems = [];
    const updatePromises = [];

    // Check each cart item for expired delivery slots
    for (const item of cartItems) {
      // Skip deal items and items without delivery slots
      if (item.is_deal_item || !item.deliverySlot || !item.deliverySlot.date) {
        continue;
      }

      // Check if slot is expired
      if (isDeliverySlotExpired(item.deliverySlot)) {
        expiredItems.push(item);
        
        // Find next available slot
        const { findNextAvailableSlot } = await import('../utils/deliverySlotHelper');
        const currentDate = item.deliverySlot.date;
        const currentSlotId = item.deliverySlot.slotId || item.deliverySlot.slot?.id;
        
        const nextSlot = await findNextAvailableSlot(currentDate, currentSlotId);
        
        if (nextSlot) {
          // Import formatTime from helper
          const { formatTime: helperFormatTime } = await import('../utils/deliverySlotHelper');
          
          // Format the new delivery slot object
          const newDeliverySlot = {
            date: nextSlot.date,
            slotId: nextSlot.slot.id,
            slot: {
              id: nextSlot.slot.id,
              slotName: nextSlot.slot.slotName,
              startTime: nextSlot.slot.startTime,
              endTime: nextSlot.slot.endTime,
              displayOrderLimit: nextSlot.slot.displayOrderLimit
            },
            time: nextSlot.slot.startTime && nextSlot.slot.endTime
              ? `${helperFormatTime(nextSlot.slot.startTime)} - ${helperFormatTime(nextSlot.slot.endTime)}`
              : nextSlot.slot.startTime
              ? helperFormatTime(nextSlot.slot.startTime)
              : null,
            pinCode: item.deliverySlot.pinCode || null
          };

          // Update the cart item
          updatePromises.push(
            Promise.resolve().then(() => {
              updateCartItemDeliverySlot(item.id, newDeliverySlot);
              return { item, newSlot: nextSlot };
            })
          );
        } else {
          // No available slot found - we'll notify user but keep the expired slot
          // User can manually change it or we can remove the item (but that's too aggressive)
          console.warn(`No available slot found for item ${item.id}`);
        }
      }
    }

    // Wait for all updates to complete
    if (updatePromises.length > 0) {
      const results = await Promise.all(updatePromises);
      
      // Only show notification if we actually updated slots
      // Use a flag to prevent duplicate notifications within a short time window
      if (results.length > 0 && !window.__slotUpdateNotificationShown) {
        window.__slotUpdateNotificationShown = true;
        
        // Show notification for updated items
        const toast = getToast();
        if (toast) {
          setTimeout(() => {
            const { formatSlotDisplay } = require('../utils/deliverySlotHelper');
            const updatedCount = results.length;
            const firstUpdate = results[0];
            const slotDisplay = formatSlotDisplay(firstUpdate.newSlot);
            
            toast.showInfo(
              'Delivery Slot Updated',
              updatedCount === 1
                ? `Your previous delivery slot is no longer available. We've updated it to ${slotDisplay}.`
                : `${updatedCount} item(s) had expired delivery slots. We've updated them to the earliest available slots.`
            );
            
            // Clear the flag after a delay to allow future legitimate updates
            setTimeout(() => {
              window.__slotUpdateNotificationShown = false;
            }, 5000);
          }, 100);
        }
      }
    }
  }, [cartItems, isDeliverySlotExpired, updateCartItemDeliverySlot]);

  // Helper function to format time (same as in cart page)
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

  // Remove expired delivery slots from cart
  const removeExpiredSlots = React.useCallback(() => {
    setCartItems(prev => {
      // Don't process if cart is empty
      if (!prev || prev.length === 0) {
        return prev;
      }

      const validItems = [];
      const expiredItems = [];

      prev.forEach(item => {
        // Only check expiration if item has a delivery slot
        // Items without delivery slots should remain in cart
        if (item.deliverySlot) {
          try {
            if (isDeliverySlotExpired(item.deliverySlot)) {
              expiredItems.push(item);
            } else {
              validItems.push(item);
            }
          } catch (error) {
            // If there's an error checking expiration, keep the item
            console.warn('Error checking delivery slot expiration, keeping item:', error);
            validItems.push(item);
          }
        } else {
          // Items without delivery slots stay in cart
          validItems.push(item);
        }
      });

      // Use setTimeout to ensure toast is called outside of render phase
      if (expiredItems.length > 0) {
        const toast = getToast();
        if (toast) {
          setTimeout(() => {
            toast.showWarning(
              'Expired Delivery Slots Removed',
              `${expiredItems.length} item(s) with expired delivery slots have been removed from your cart.`
            );
          }, 0);
        }
      }

      // Always return at least the valid items (even if empty, to maintain state consistency)
      return validItems;
    });
  }, []);

  // Check for expired slots after initialization and periodically
  // DISABLED: Automatic expiration check on page load to prevent false positives
  // Users can manually remove expired items if needed, or we can enable this with better validation
  useEffect(() => {
    if (typeof window === 'undefined' || !hasInitializedRef.current) return;
    
    // Wait for cart to be fully initialized
    if (!isInitialized) return;
    
    // Only check if cart has items
    if (cartItems.length === 0) return;
    
    // DISABLED: Don't check immediately on page load to prevent false positives
    // The expiration check was too aggressive and removing valid items
    // Uncomment below if you want to re-enable with better validation
    
    // Check periodically (every 30 minutes) - less frequent to reduce false positives
    const interval = setInterval(() => {
      // Only check if cart is initialized and has items
      if (isInitialized && cartItems.length > 0) {
        // Only check if user has been on page for a while (not immediately after load)
        removeExpiredSlots();
      }
    }, 30 * 60 * 1000); // Check every 30 minutes instead of on page load

    return () => {
      clearInterval(interval);
    };
  }, [removeExpiredSlots, cartItems.length, isInitialized]);

  // Add item to cart
  const addToCart = (item, quantity = 1, variant = null, flavor = null, tier = null, dealPrice = null, dealId = null, dealThreshold = null) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Handle both object format (legacy) and parameter format (new)
      let product, itemVariant, itemQuantity, itemFlavor, itemTier, itemDeliverySlot, itemCakeMessage, itemCombos, itemTotalPrice;
      let isDealItem = false;
      let dealItemId = null;
      let dealItemThreshold = null;
      let dealItemPrice = null;

      if (typeof item === 'object' && item.product) {
        // Legacy object format
        product = item.product;
        itemVariant = item.variant || variant;
        itemQuantity = item.quantity || quantity;
        itemFlavor = item.flavor || flavor;
        itemTier = item.tier || tier;
        itemDeliverySlot = item.deliverySlot;
        itemCakeMessage = item.cakeMessage;
        itemCombos = item.combos || [];
        itemTotalPrice = item.totalPrice;
        isDealItem = item.is_deal_item || false;
        dealItemId = item.deal_id || dealId;
        dealItemThreshold = item.deal_threshold || dealThreshold;
        dealItemPrice = item.deal_price || dealPrice;
      } else {
        // New parameter format
        product = item;
        itemVariant = variant;
        itemQuantity = quantity;
        itemFlavor = flavor;
        itemTier = tier;
        itemDeliverySlot = null;
        itemCakeMessage = null;
        itemCombos = [];
        isDealItem = dealId !== null;
        dealItemId = dealId;
        dealItemThreshold = dealThreshold;
        dealItemPrice = dealPrice;
      }

      // For deal items, check if already in cart
      if (isDealItem) {
        const existingDealItem = cartItems.find(cartItem => 
          cartItem.is_deal_item && cartItem.deal_id === dealItemId
        );
        if (existingDealItem) {
          const toast = getToast();
          if (toast) {
            setTimeout(() => {
              toast.showWarning(
                'Deal Already Added',
                'This deal item is already in your cart.'
              );
            }, 0);
          }
          return { success: false, error: 'Deal already in cart', isDuplicate: true };
        }
      } else {
        // Check for duplicates (non-deal items) - include combos in comparison
        const duplicateItem = cartItems.find(existingItem => 
          !existingItem.is_deal_item && isDuplicateItem({ 
            product, 
            variant: itemVariant, 
            flavor: itemFlavor, 
            tier: itemTier,
            combos: itemCombos,
            deliverySlot: itemDeliverySlot
          }, existingItem)
        );
        
        if (duplicateItem) {
          // Set duplicate detected state for header animation
          setDuplicateDetected(true);
          // Reset after animation duration (2 seconds)
          setTimeout(() => setDuplicateDetected(false), 2000);
          
          const toast = getToast();
          if (toast) {
            // Create "View Cart" button for the toast
            const viewCartButton = (
              <button
                onClick={() => {
                  // Close toast before navigating
                  if (typeof window !== 'undefined') {
                    window.location.href = '/cart';
                  }
                }}
                className="mt-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-semibold rounded-md transition-colors duration-200 shadow-sm hover:shadow-md active:scale-95"
              >
                View Cart
              </button>
            );
            
            setTimeout(() => {
              // Pass 0 duration to keep toast visible until dismissed or button clicked
              toast.showWarning(
                'Item Already in Cart',
                'This product is already in your cart with the same delivery slot. Select a different delivery slot to add it as a separate item, or view your cart.',
                0,
                viewCartButton
              );
            }, 0);
          }
          return { success: false, error: 'Item already in cart', isDuplicate: true };
        }

        // Check if same item with different delivery slot (informative message)
        const sameItemDifferentSlot = cartItems.find(existingItem => 
          !existingItem.is_deal_item && isSameItemDifferentSlot({ 
            product, 
            variant: itemVariant, 
            flavor: itemFlavor, 
            tier: itemTier,
            combos: itemCombos,
            deliverySlot: itemDeliverySlot
          }, existingItem)
        );
        
        if (sameItemDifferentSlot) {
          const toast = getToast();
          if (toast) {
            setTimeout(() => {
              toast.showInfo(
                'Different Delivery Slot',
                'Adding as new item due to different delivery slot.'
              );
            }, 0);
          }
          // Continue to add the item (not blocking, just informative)
        }
      }

      // Calculate price - use deal price if it's a deal item
      let finalPrice = dealItemPrice;
      if (!finalPrice) {
        finalPrice = itemVariant?.discounted_price || product.discounted_price || product.base_price;
      }
      
      // Calculate combo total if combos are provided
      const comboTotal = itemCombos?.reduce((sum, combo) => {
        // Use unitPrice if available (pre-calculated), otherwise calculate
        if (combo.unitPrice !== undefined) {
          return sum + (combo.unitPrice * combo.quantity);
        }
        // Otherwise, calculate from discounted_price or price
        const comboUnitPrice = (combo.discount_percentage > 0 || (combo.discounted_price && combo.discounted_price < combo.price))
          ? (combo.discounted_price || combo.price)
          : combo.price;
        return sum + (comboUnitPrice * combo.quantity);
      }, 0) || 0;
      
      // Total price = main product price + combo total
      itemTotalPrice = (finalPrice * itemQuantity) + comboTotal;

      const cartItem = {
        id: isDealItem 
          ? `deal_${dealItemId}_${Date.now()}`
          : `${product.id}_${itemVariant?.id || 'default'}_${Date.now()}`,
        product: product,
        variant: itemVariant,
        quantity: itemQuantity,
        flavor: itemFlavor,
        tier: itemTier,
        deliverySlot: itemDeliverySlot,
        cakeMessage: itemCakeMessage,
        combos: itemCombos || [],
        totalPrice: itemTotalPrice,
        addedAt: new Date().toISOString(),
        // Deal item properties
        is_deal_item: isDealItem,
        deal_id: dealItemId,
        deal_threshold: dealItemThreshold,
        deal_price: dealItemPrice
      };

      setCartItems(prev => [...prev, cartItem]);
      
      const toast = getToast();
      if (toast) {
        setTimeout(() => {
          toast.showSuccess(
            'Added to Cart',
            `${product.name} has been added to your cart${isDealItem ? ' for ₹' + dealItemPrice : ''}.`
          );
        }, 0);
      }
      
      return { success: true, item: cartItem };
    } catch (err) {
      setError(err.message);
      const toast = getToast();
      if (toast) {
        setTimeout(() => {
          toast.showError('Error', err.message || 'Failed to add item to cart');
        }, 0);
      }
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Validate and remove deal items if cart total drops below threshold
  const validateDealItems = React.useCallback(() => {
    // Calculate cart total directly to avoid dependency on getCartSummary
    const cartTotal = cartItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

    const invalidDealItems = cartItems.filter(item => {
      if (!item.is_deal_item || !item.deal_threshold) return false;
      return cartTotal < item.deal_threshold;
    });

    if (invalidDealItems.length > 0) {
      const invalidIds = invalidDealItems.map(item => item.id);
      const itemNames = invalidDealItems.map(item => item.product.name);
      const threshold = invalidDealItems[0].deal_threshold;
      
      // Remove invalid deal items directly using setCartItems
      setCartItems(prev => prev.filter(item => !invalidIds.includes(item.id)));
      
      // Show toast notification
      const toast = getToast();
      if (toast) {
        setTimeout(() => {
          toast.showWarning(
            'Deal Removed',
            `${itemNames.join(', ')} ${itemNames.length === 1 ? 'has' : 'have'} been removed. Cart total is below ₹${threshold}.`
          );
        }, 100);
      }
    }
  }, [cartItems]);

  // Validate deal items when cart total changes
  useEffect(() => {
    if (cartItems.length > 0) {
      // Use a timeout to avoid validation during rapid changes
      const timeoutId = setTimeout(() => {
        validateDealItems();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [cartItems.map(item => item.totalPrice || 0).join(','), validateDealItems]);

  // Update item quantity
  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCartItems(prev => {
      const item = prev.find(i => i.id === itemId);
      
      // Deal items are restricted to quantity 1
      if (item?.is_deal_item && newQuantity > 1) {
        // Don't update - keep quantity at 1
        return prev;
      }
      
      return prev.map(item => {
        if (item.id === itemId) {
          // Recalculate totalPrice when quantity changes (includes combos)
          const updatedItem = { ...item, quantity: newQuantity };
          updatedItem.totalPrice = calculateItemTotal(updatedItem);
          return updatedItem;
        }
        return item;
      });
    });
  };

  // Remove item from cart
  const removeFromCart = React.useCallback((itemId) => {
    // Prevent duplicate calls (e.g., from React Strict Mode)
    if (recentRemovalsRef.current.has(itemId)) {
      // Already processing this removal, just remove from cart without toast
      setCartItems(prev => prev.filter(item => item.id !== itemId));
      return;
    }
    
    // Mark as being processed
    recentRemovalsRef.current.add(itemId);
    
    // Find item before removing it to get the name for toast
    const itemToRemove = cartItems.find(item => item.id === itemId);
    
    // Remove the item from cart
    setCartItems(prev => prev.filter(item => item.id !== itemId));
    
    // Show toast only if item was found (outside of setState to avoid duplicates)
    if (itemToRemove) {
      const toast = getToast();
      if (toast) {
        setTimeout(() => {
          toast.showSuccess(
            'Item Removed',
            `${itemToRemove.product.name} has been removed from your cart.`
          );
          // Clear the removal flag after showing toast
          setTimeout(() => {
            recentRemovalsRef.current.delete(itemId);
          }, 100);
        }, 0);
      } else {
        // Clear immediately if no toast
        recentRemovalsRef.current.delete(itemId);
      }
    } else {
      // Clear if item not found
      recentRemovalsRef.current.delete(itemId);
    }
  }, [cartItems]);

  // Clear entire cart
  const clearCart = (suppressToast = false) => {
    const itemCount = cartItems.length;
    setCartItems([]);
    
    if (itemCount > 0 && !suppressToast) {
      const toast = getToast();
      if (toast) {
        setTimeout(() => {
          toast.showSuccess(
            'Cart Cleared',
            `All ${itemCount} item(s) have been removed from your cart.`
          );
        }, 0);
      }
    }
  };

  // Get cart summary
  const getCartSummary = () => {
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cartItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    const totalCombos = cartItems.reduce((sum, item) => sum + (item.combos?.length || 0), 0);

    return {
      totalItems,
      totalPrice,
      totalCombos,
      items: cartItems
    };
  };

  // Get item count for display
  const getItemCount = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  // Check if product is in cart
  const isInCart = (productId, variantId = null) => {
    return cartItems.some(item => 
      item.product.id === productId && 
      (variantId ? item.variant?.id === variantId : true)
    );
  };

  // Get cart item by product and variant
  const getCartItem = (productId, variantId = null) => {
    return cartItems.find(item => 
      item.product.id === productId && 
      (variantId ? item.variant?.id === variantId : true)
    );
  };

  // Update combo selections for a cart item
  const updateCartItemCombos = (itemId, combos) => {
    setCartItems(prev => 
      prev.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, combos };
          updatedItem.totalPrice = calculateItemTotal(updatedItem);
          return updatedItem;
        }
        return item;
      })
    );
  };

  // Update quantity of a specific combo item
  const updateComboItemQuantity = (itemId, comboId, newQuantity) => {
    if (newQuantity <= 0) {
      // If quantity is 0 or less, remove the combo item
      return removeComboItem(itemId, comboId);
    }

    setCartItems(prev => 
      prev.map(item => {
        if (item.id === itemId && item.combos) {
          const updatedCombos = item.combos.map(combo => {
            // Match by id if available, otherwise by product_id and index
            if (combo.id === comboId || (combo.product_id && combo.product_id.toString() === comboId.toString())) {
              return { ...combo, quantity: newQuantity };
            }
            return combo;
          });
          const updatedItem = { ...item, combos: updatedCombos };
          updatedItem.totalPrice = calculateItemTotal(updatedItem);
          return updatedItem;
        }
        return item;
      })
    );
  };

  // Remove a specific combo item
  const removeComboItem = (itemId, comboId) => {
    setCartItems(prev => 
      prev.map(item => {
        if (item.id === itemId && item.combos) {
          const updatedCombos = item.combos.filter(combo => {
            // Match by id if available, otherwise by product_id
            return combo.id !== comboId && 
                   !(combo.product_id && combo.product_id.toString() === comboId.toString());
          });
          const updatedItem = { ...item, combos: updatedCombos };
          updatedItem.totalPrice = calculateItemTotal(updatedItem);
          return updatedItem;
        }
        return item;
      })
    );
  };

  // Calculate total price for an item including combos
  const calculateItemTotal = (item) => {
    // Use deal price if it's a deal item
    const basePrice = item.is_deal_item && item.deal_price 
      ? item.deal_price 
      : (item.variant?.discounted_price || item.product.discounted_price || item.product.base_price);
    const itemTotal = basePrice * item.quantity;
    
    // Calculate combo total - use unitPrice if available (for discounted combos), otherwise use price
    const comboTotal = item.combos?.reduce((sum, combo) => {
      // Check if combo has unitPrice (pre-calculated with discount)
      if (combo.unitPrice !== undefined) {
        return sum + (combo.unitPrice * combo.quantity);
      }
      // Otherwise, calculate from discounted_price or price
      const comboUnitPrice = (combo.discount_percentage > 0 || (combo.discounted_price && combo.discounted_price < combo.price))
        ? (combo.discounted_price || combo.price)
        : combo.price;
      return sum + (comboUnitPrice * combo.quantity);
    }, 0) || 0;
    
    return itemTotal + comboTotal;
  };

  // Recalculate all item totals
  const recalculateTotals = () => {
    setCartItems(prev => 
      prev.map(item => ({
        ...item,
        totalPrice: calculateItemTotal(item)
      }))
    );
  };

  // Save item for later
  const saveForLater = (itemId) => {
    const item = cartItems.find(item => item.id === itemId);
    if (item) {
      const serializedItem = serializeItemForStorage(item);
      setSavedItems(prev => [...prev, { ...serializedItem, savedAt: new Date().toISOString() }]);
      
      // Remove from cart without showing toast (we'll show a different message)
      setCartItems(prev => prev.filter(cartItem => cartItem.id !== itemId));
      
      const toast = getToast();
      if (toast) {
        setTimeout(() => {
          toast.showSuccess(
            'Saved for Later',
            `${item.product.name} has been saved for later.`
          );
        }, 0);
      }
      
      return { success: true };
    }
    return { success: false, error: 'Item not found in cart' };
  };

  // Move saved item back to cart
  const moveToCart = (savedItemId) => {
    const savedItem = savedItems.find(item => 
      item.id === savedItemId || (item.savedAt && item.id === savedItemId)
    );
    if (savedItem) {
      // Remove savedAt to make it a regular cart item
      const { savedAt, ...cartItem } = savedItem;
      const newCartItem = {
        ...cartItem,
        id: `${cartItem.product.id}_${cartItem.variant?.id || 'default'}_${Date.now()}`
      };
      setCartItems(prev => [...prev, newCartItem]);
      setSavedItems(prev => prev.filter(item => 
        !(item.id === savedItemId || (item.savedAt && item.id === savedItemId))
      ));
      
      const toast = getToast();
      if (toast) {
        setTimeout(() => {
          toast.showSuccess(
            'Added to Cart',
            `${savedItem.product.name} has been moved back to your cart.`
          );
        }, 0);
      }
      
      return { success: true };
    }
    return { success: false, error: 'Saved item not found' };
  };

  // Remove saved item
  const removeSavedItem = (savedItemId) => {
    setSavedItems(prev => {
      const itemToRemove = prev.find(item => 
        item.id === savedItemId || (item.savedAt && item.id === savedItemId)
      );
      
      if (itemToRemove) {
        const toast = getToast();
        if (toast) {
          setTimeout(() => {
            toast.showSuccess(
              'Removed from Saved',
              `${itemToRemove.product.name} has been removed from saved items.`
            );
          }, 0);
        }
      }
      
      return prev.filter(item => 
        !(item.id === savedItemId || (item.savedAt && item.id === savedItemId))
      );
    });
  };

  // Get saved items count
  const getSavedItemsCount = () => {
    return savedItems.length;
  };

  const value = {
    cartItems,
    savedItems,
    isLoading,
    error,
    isInitialized,
    duplicateDetected,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartSummary,
    getItemCount,
    isInCart,
    getCartItem,
    updateCartItemCombos,
    updateComboItemQuantity,
    removeComboItem,
    calculateItemTotal,
    recalculateTotals,
    saveForLater,
    moveToCart,
    removeSavedItem,
    getSavedItemsCount,
    removeExpiredSlots,
    isDeliverySlotExpired,
    validateDealItems,
    updateCartItemDeliverySlot,
    autoUpdateExpiredSlots
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;
