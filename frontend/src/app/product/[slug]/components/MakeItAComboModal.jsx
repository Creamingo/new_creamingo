'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, ShoppingBag, Plus, Minus, Trash2, Package, Sparkles, ChevronDown, ChevronUp, CheckCircle, ArrowRight, ArrowLeft, Cake, ArrowLeftRight } from 'lucide-react';
import addOnApi from '../../../../api/addOnApi';
import { formatPrice } from '../../../../utils/priceFormatter';
import { resolveImageUrl } from '../../../../utils/imageUrl';

const MakeItAComboModal = ({ 
  isOpen, 
  onClose, 
  product, 
  selectedVariant, 
  onComboUpdate, 
  baseProductPrice = 0, 
  quantity = 1, 
  initialComboSelections = [],
  selectedDeliverySlot = null,
  onAddToCart = null,
  cakeMessage = '',
  currentPinCode = null,
  isDeliveryAvailable = false
}) => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [comboSelections, setComboSelections] = useState(initialComboSelections);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [isComboExpanded, setIsComboExpanded] = useState(false);
  const [newlyAddedItem, setNewlyAddedItem] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [mobileActiveTab, setMobileActiveTab] = useState('browse'); // 'browse' or 'combo'
  const [isPriceBreakdownExpanded, setIsPriceBreakdownExpanded] = useState(true);
  const modalRef = useRef(null);
  const emptyStateRef = useRef(null);

  // Handle opening animation
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Small delay to ensure the component is mounted before animating
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    } else {
      // Start closing animation
      setIsAnimating(false);
      // Wait for animation to complete before unmounting (300ms matches transition duration)
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Load categories/products when modal opens
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // Load global combo selections when modal opens
  useEffect(() => {
    if (isOpen) {
      // If we already have selections from parent, use them, otherwise load from localStorage
      if (initialComboSelections.length > 0) {
        setComboSelections(initialComboSelections);
      } else {
        // Load from localStorage (global combo selections)
        // After an order is placed, localStorage is cleared, so loadComboSelections will start fresh
        loadComboSelections();
      }
      setSaveSuccess(false);
      setError(null);
    }
    // Note: We don't reset selections when modal closes - let localStorage persist during session
    // After order placement, localStorage is cleared, so next open will be fresh
    // Global combos are not dependent on product/variant, so removed those dependencies
  }, [isOpen]);

  // Sync with parent's combo selections when they change (but only if modal is open)
  useEffect(() => {
    if (isOpen && initialComboSelections.length > 0) {
      const currentIds = comboSelections.map(s => s.id || s.add_on_product_id || s.product_id).sort().join(',');
      const initialIds = initialComboSelections.map(s => s.id || s.add_on_product_id || s.product_id).sort().join(',');
      if (currentIds !== initialIds) {
        setComboSelections(initialComboSelections);
      }
    }
  }, [isOpen, initialComboSelections.length]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [categoriesData, productsData] = await Promise.all([
        addOnApi.getAddOnCategories(),
        addOnApi.getAddOnProducts()
      ]);
      
      setCategories(categoriesData);
      
      // Default to first category (not All) and load its products
      if (categoriesData.length > 0) {
        const firstId = categoriesData[0].id;
        setSelectedCategoryId(firstId);
        const firstProducts = await addOnApi.getAddOnProducts(firstId);
        setProducts(firstProducts);
      } else {
        setProducts(productsData);
      }
    } catch (err) {
      setError('Failed to load add-on products');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadComboSelections = async () => {
    try {
      // Load global combo selections from localStorage (persists across all products)
      const storageKey = 'global_combo_selections';
      let savedSelections = [];
      
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            savedSelections = parsed;
          }
        }
      } catch (err) {
        console.error('Error loading global combo selections from localStorage:', err);
      }

      // Global combos are stored in localStorage only
      // API sync is not needed for global combos as they apply to all products
      // and are managed client-side until order placement
      
      // Always set selections (even if empty) to ensure fresh state
      if (Array.isArray(savedSelections)) {
        setComboSelections(savedSelections);

        // Only notify parent if we have selections
        if (savedSelections.length > 0 && onComboUpdate) {
          onComboUpdate(savedSelections);
        } else if (savedSelections.length === 0 && onComboUpdate) {
          // Notify parent that selections are cleared (fresh start)
          onComboUpdate([]);
        }
      }
    } catch (err) {
      console.error('Error loading global combo selections:', err);
      // On error, ensure we start with empty state
      setComboSelections([]);
    }
  };

  // Tabs click -> fetch by category or all
  const handleTabClick = async (tabId) => {
    try {
      setSelectedCategoryId(tabId);
      setLoading(true);
      setError(null);
      const list = await addOnApi.getAddOnProducts(tabId);
      setProducts(list);
    } catch (err) {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCombo = async (addOnProduct) => {
    // Check if user is authenticated
    const token = localStorage.getItem('customer_token');
    if (!token) {
      setError('Please log in to add items to your combo');
      setTimeout(() => setError(null), 5000);
      return;
    }

    setActionLoading(addOnProduct.id);
    setError(null);
    try {
      // For global combos, we manage selections in localStorage only
      // API sync happens when adding to cart (combos are passed with cart item)
      // This allows combos to persist across all products
      
      const currentSelections = [...comboSelections];
      
      // Check if this product is already in current selections
      const existingIndex = currentSelections.findIndex(s => 
        (s.add_on_product_id === addOnProduct.id || s.product_id === addOnProduct.id)
      );
      
      let updatedSelections;
      if (existingIndex >= 0) {
        // Product already exists, increment quantity
        updatedSelections = [...currentSelections];
        updatedSelections[existingIndex] = {
          ...updatedSelections[existingIndex],
          quantity: updatedSelections[existingIndex].quantity + 1
        };
      } else {
        // New product, add it to current selections
        // Create item manually (no API call needed for global combos)
        updatedSelections = [...currentSelections, {
          id: Date.now(), // Temporary ID (will be replaced when added to cart)
          add_on_product_id: addOnProduct.id,
          product_id: addOnProduct.id,
          product_name: addOnProduct.name || 'Product',
          category_name: addOnProduct.category_name || '',
          price: addOnProduct.price || 0,
          discounted_price: addOnProduct.discounted_price || null,
          discount_percentage: addOnProduct.discount_percentage || 0,
          quantity: 1,
          image_url: addOnProduct.image_url || null
        }];
      }
      
      console.log('Updated selections (merged with local state):', updatedSelections);
      setComboSelections(updatedSelections);
      
      // Save to global localStorage for persistence (applies to all products)
      const storageKey = 'global_combo_selections';
      try {
        localStorage.setItem(storageKey, JSON.stringify(updatedSelections));
      } catch (err) {
        console.error('Error saving global combo selections to localStorage:', err);
      }
      
      // Set newly added item for animation
      const addedItem = updatedSelections.find(s => 
        s.add_on_product_id === addOnProduct.id || s.product_id === addOnProduct.id
      );
      if (addedItem) {
        setNewlyAddedItem(addedItem.id);
        setTimeout(() => setNewlyAddedItem(null), 2000);
      }
      
      // Haptic feedback on mobile
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      
      // Notify parent component
      if (onComboUpdate) {
        onComboUpdate(updatedSelections);
      }
    } catch (err) {
      console.error('Error adding to combo:', err);
      let errorMessage = err.message || 'Failed to add product to combo';
      
      // Provide user-friendly error messages
      if (errorMessage.includes('Authentication required') || errorMessage.includes('401')) {
        errorMessage = 'Please log in to add items to your combo';
      } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
        errorMessage = 'You do not have permission to perform this action';
      } else if (errorMessage.includes('404')) {
        errorMessage = 'Product not found. Please refresh and try again';
      }
      
      setError(errorMessage);
      // Show error message for 5 seconds then clear
      setTimeout(() => setError(null), 5000);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateQuantity = async (selectionId, newQuantity) => {
    setActionLoading(selectionId);
    setError(null);
    try {
      // For global combos, manage in localStorage only (no API calls)
      // API sync happens when adding to cart
      let updatedSelections;
      if (newQuantity === 0) {
        updatedSelections = comboSelections.filter(s => s.id !== selectionId);
        setComboSelections(updatedSelections);
      } else {
        updatedSelections = comboSelections.map(s => 
          s.id === selectionId ? { ...s, quantity: newQuantity } : s
        );
        setComboSelections(updatedSelections);
      }
      
      // Save to global localStorage for persistence (applies to all products)
      const storageKey = 'global_combo_selections';
      try {
        if (updatedSelections.length > 0) {
          localStorage.setItem(storageKey, JSON.stringify(updatedSelections));
        } else {
          localStorage.removeItem(storageKey);
        }
      } catch (err) {
        console.error('Error saving global combo selections to localStorage:', err);
      }
      
      // Notify parent component
      if (onComboUpdate) {
        onComboUpdate(updatedSelections);
      }
    } catch (err) {
      setError(err.message || 'Failed to update quantity');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveFromCombo = async (selectionId) => {
    setActionLoading(selectionId);
    setError(null);
    try {
      // For global combos, manage in localStorage only (no API calls)
      // API sync happens when adding to cart
      const updatedSelections = comboSelections.filter(s => s.id !== selectionId);
      setComboSelections(updatedSelections);
      
      // Save to global localStorage for persistence (applies to all products)
      const storageKey = 'global_combo_selections';
      try {
        if (updatedSelections.length > 0) {
          localStorage.setItem(storageKey, JSON.stringify(updatedSelections));
        } else {
          localStorage.removeItem(storageKey);
        }
      } catch (err) {
        console.error('Error saving global combo selections to localStorage:', err);
      }
      
      // Notify parent component
      if (onComboUpdate) {
        onComboUpdate(updatedSelections);
      }
    } catch (err) {
      setError(err.message || 'Failed to remove product');
    } finally {
      setActionLoading(null);
    }
  };

  const handleClearAllAddOns = () => {
    // Clear all global combo selections
    setComboSelections([]);
    localStorage.removeItem('global_combo_selections');
    
    // Notify parent component
    if (onComboUpdate) {
      onComboUpdate([]);
    }
    
    // Show success feedback
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const getFilteredProducts = () => {
    if (!selectedCategoryId) return products;
    return products.filter(product => product.category_id === selectedCategoryId);
  };

  // Note: Product name truncation is now handled by CSS truncate class based on available space

  const getComboTotalPrice = () => {
    return comboSelections.reduce((total, selection) => {
      const price = (selection.discount_percentage > 0 || (selection.discounted_price && selection.discounted_price < selection.price)) 
        ? (selection.discounted_price || selection.price) 
        : selection.price;
      return total + (price * selection.quantity);
    }, 0);
  };

  const getBaseProductTotal = () => {
    return baseProductPrice * quantity;
  };

  const getGrandTotal = () => {
    return getBaseProductTotal() + getComboTotalPrice();
  };

  const getTotalAddOnsCount = () => {
    return comboSelections.reduce((total, selection) => total + selection.quantity, 0);
  };

  const getSelectedCategory = () => {
    return categories.find(cat => cat.id === selectedCategoryId);
  };

  // Check if a product is already in combo and get its selection
  const getComboSelectionForProduct = (productId) => {
    return comboSelections.find(selection => 
      selection.add_on_product_id === productId || 
      selection.product_id === productId ||
      (selection.id && selection.add_on_product_id === productId)
    );
  };

  const getContinueButtonText = () => {
    const count = comboSelections.length;
    if (count === 0) {
      return 'Skip Add-ons';
    } else if (count === 1) {
      return 'Save & Return';
    } else {
      return 'Save & Return';
    }
  };

  // Check if Add to Cart button should be enabled
  const canAddToCart = () => {
    return selectedDeliverySlot && currentPinCode && isDeliveryAvailable && onAddToCart;
  };

  // Handle Add to Cart from modal
  const handleAddToCartFromModal = async () => {
    if (!canAddToCart()) {
      setError('Please select a delivery time slot and pincode to add to cart');
      setTimeout(() => setError(null), 5000);
      return;
    }

    setSaveLoading(true);
    setError(null);
    try {
      // First save combo selections
      if (onComboUpdate) {
        await onComboUpdate(comboSelections);
      }

      // Format combo selections for cart
      const formattedCombos = comboSelections.map(selection => {
        if (!selection.add_on_product_id) {
          console.error('Combo selection missing add_on_product_id:', selection);
          return null;
        }
        
        const unitPrice = (selection.discount_percentage > 0 || (selection.discounted_price && selection.discounted_price < selection.price)) 
          ? (selection.discounted_price || selection.price) 
          : selection.price;
        
        return {
          id: selection.id,
          add_on_product_id: selection.add_on_product_id,
          product_name: selection.product_name,
          category_name: selection.category_name,
          image_url: selection.image_url,
          price: selection.price,
          discounted_price: selection.discounted_price || null,
          discount_percentage: selection.discount_percentage || 0,
          quantity: selection.quantity,
          unitPrice: unitPrice,
          itemTotal: unitPrice * selection.quantity
        };
      }).filter(combo => combo !== null);

      // Close modal immediately before redirect to prevent showing PDP
      onClose();
      
      // Small delay to ensure modal starts closing before redirect
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Call add to cart with all required data (this will redirect to cart page on success)
      if (onAddToCart) {
        await onAddToCart({
          deliverySlot: selectedDeliverySlot,
          cakeMessage: cakeMessage,
          combos: formattedCombos,
          totalPrice: getGrandTotal()
        });
      }
    } catch (err) {
      console.error('Error adding to cart from modal:', err);
      setError(err.message || 'Failed to add to cart. Please try again.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setSaveLoading(false);
    }
  };

  if (!shouldRender) return null;

  return (
    <>
      {/* Custom Animations Styles */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes bounce-subtle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }
        @keyframes pulse-scale {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }
        @keyframes scale-in {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes slide-in {
          from {
            transform: translateX(-10px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }
        .animate-pulse-scale {
          animation: pulse-scale 0.6s ease-in-out;
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
        .animate-slide-in {
          animation: slide-in 0.4s ease-out;
        }
      `}</style>
      <div className="fixed inset-0 z-50">
      {/* Backdrop - dimmed on mobile, same on laptop */}
      <div 
        className="fixed inset-0 bg-black/50 dark:bg-black/70 transition-opacity duration-300 z-40"
        onClick={onClose}
      />
      
      {/* Modal Content - Bottom sheet on mobile, slides from right on laptop */}
      <div 
        ref={modalRef}
        className={`fixed bottom-0 left-0 right-0 lg:fixed lg:bottom-0 lg:top-0 lg:left-auto lg:right-0 bg-white dark:bg-gray-800 rounded-t-2xl lg:rounded-none lg:rounded-l-2xl max-w-6xl lg:w-[70vw] w-full h-[90vh] lg:h-full lg:max-h-full overflow-hidden shadow-2xl dark:shadow-2xl dark:shadow-black/50 transform transition-transform duration-300 ease-out z-50 flex flex-col ${
          isAnimating ? 'translate-y-0 lg:translate-x-0' : 'translate-y-full lg:translate-x-[100%]'
        }`}
        onTouchStart={(e) => {
          // Only handle swipe on mobile
          if (window.innerWidth < 1024) {
            setTouchStart(e.targetTouches[0].clientY);
          }
        }}
        onTouchMove={(e) => {
          // Only handle swipe on mobile
          if (window.innerWidth < 1024) {
            setTouchEnd(e.targetTouches[0].clientY);
          }
        }}
        onTouchEnd={() => {
          // Swipe down to close (mobile only)
          if (window.innerWidth < 1024 && touchStart && touchEnd) {
            const swipeDistance = touchStart - touchEnd;
            const minSwipeDistance = 100; // Minimum swipe distance to trigger close
            
            if (swipeDistance < -minSwipeDistance) {
              // Swiped down significantly, close modal
              onClose();
            }
          }
          setTouchStart(null);
          setTouchEnd(null);
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-50 via-amber-50/95 to-amber-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 border-b border-amber-200/60 dark:border-gray-700 shadow-sm relative overflow-hidden">
          {/* Drag Indicator - Mobile Only */}
          <div className="lg:hidden absolute top-1.5 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
          
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-5 dark:opacity-10">
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
          </div>
          
          {/* Header Content */}
          <div className="relative px-3 pt-2 pb-1.5 lg:py-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <div className="w-7 h-7 bg-gradient-to-br from-rose-400 to-pink-500 dark:from-rose-500 dark:to-pink-600 rounded-lg flex items-center justify-center shadow-md ring-1 ring-rose-200/50 dark:ring-rose-800/30 flex-shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm sm:text-base font-semibold tracking-wide text-gray-900 dark:text-gray-100 leading-tight mb-0.5">Make it a Combo</h2>
                  <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 leading-tight">Enhance your order with curated add‑ons</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 rounded-lg transition-all duration-200 text-white shadow-md hover:shadow-lg hover:scale-110 active:scale-95 flex-shrink-0 mt-0.5 ring-2 ring-red-400/50 dark:ring-red-500/50 hover:ring-red-500 dark:hover:ring-red-400"
                aria-label="Close modal"
              >
                <X className="w-3.5 h-3.5 sm:w-5 sm:h-5" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Mobile Tab Switcher - Integrated with header */}
          <div className="lg:hidden border-t border-amber-200/40 dark:border-gray-700/50 bg-amber-50/50 dark:bg-gray-800/50 relative z-10">
            <div className="flex items-center">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMobileActiveTab('browse');
                }}
                className={`flex-1 px-3 py-2 text-xs font-semibold transition-all duration-200 relative z-10 ${
                  mobileActiveTab === 'browse'
                    ? 'text-red-600 dark:text-red-400 border-b-2 border-red-500 dark:border-red-400 bg-white dark:bg-gray-800'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Browse Add-ons
              </button>
              {/* Interchange Icon - Trendy separator */}
              <div className="flex items-center justify-center px-1.5 py-2">
                <ArrowLeftRight className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" strokeWidth={2.5} />
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMobileActiveTab('combo');
                }}
                className={`flex-1 px-3 py-2 text-xs font-semibold transition-all duration-200 relative z-10 ${
                  mobileActiveTab === 'combo'
                    ? 'text-red-600 dark:text-red-400 border-b-2 border-red-500 dark:border-red-400 bg-white dark:bg-gray-800'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Your Combo
                {comboSelections.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-[9px] font-bold bg-red-500 dark:bg-red-600 text-white rounded-full">
                    {comboSelections.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden relative lg:h-[calc(100vh-80px)]">

          {/* Left Side - Categories and Products (Redesigned) */}
          <div className={`flex-1 p-2 pt-1 overflow-y-auto ${mobileActiveTab !== 'browse' ? 'lg:block hidden' : ''}`}>
            {/* Category Tabs */}
            <div className="mb-2">
              <div className="relative overflow-x-auto no-scrollbar">
                {/* edge fade to indicate scroll */}
                <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-white dark:from-gray-800 to-transparent z-10" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white dark:from-gray-800 to-transparent z-10" />
                <div className="flex items-end gap-0.5 border-b-2 border-amber-200/50 dark:border-gray-700 relative bg-amber-50/40 dark:bg-gray-800/50 backdrop-blur-sm" role="tablist">
                  {categories.map(cat => {
                    const isActive = selectedCategoryId === cat.id;
                    return (
                       <button
                         key={cat.id}
                         onClick={() => handleTabClick(cat.id)}
                         aria-selected={isActive}
                         role="tab"
                         className={`shrink-0 px-3 py-1.5 text-xs font-semibold rounded-t-lg -mb-0.5 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 dark:focus-visible:ring-red-500 relative ${
                           isActive
                             ? 'bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 border-2 border-amber-200 dark:border-gray-700 border-b-white dark:border-b-gray-800 shadow-sm shadow-amber-100/50 dark:shadow-gray-900/50 transform scale-105'
                             : 'bg-transparent text-gray-600 dark:text-gray-400 border-2 border-transparent hover:text-gray-900 dark:hover:text-gray-200 hover:bg-amber-100/50 dark:hover:bg-gray-700/50 hover:scale-102'
                         }`}
                       >
                         <span className="relative z-10">{cat.name}</span>
                         {isActive && (
                           <>
                             <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-gradient-to-r from-red-500 to-pink-500 dark:from-red-400 dark:to-pink-400 rounded-full" />
                             <div className="absolute inset-0 bg-gradient-to-b from-amber-50/50 to-transparent dark:from-gray-800/50 rounded-t-lg" />
                           </>
                         )}
                       </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-300 text-xs">
                <div className="flex items-start gap-1.5">
                  <span className="text-red-600 dark:text-red-400">⚠️</span>
                  <span className="leading-snug">{error}</span>
                </div>
              </div>
            )}

            {/* Products Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-1 bg-amber-50 dark:bg-gray-800 -mt-px pt-2 pb-1.5">
              {loading ? (
                // Skeleton Loaders
                Array.from({ length: 10 }).map((_, index) => (
                  <div key={`skeleton-${index}`} className="h-full flex flex-col border bg-white dark:bg-gray-800 p-1.5 animate-pulse">
                    <div className="w-3/4 mx-auto aspect-square bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
                    <div className="mt-1 flex-1 space-y-2">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mt-1.5"></div>
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-full mt-1"></div>
                    </div>
                  </div>
                ))
              ) : (
                products.map((p) => {
                const isSelected = selectedProductId === p.id;
                return (
                <div 
                  key={p.id} 
                  onClick={() => {
                    // On mobile, toggle selection on tap
                    if (window.innerWidth < 1024) {
                      setSelectedProductId(isSelected ? null : p.id);
                    }
                  }}
                  className={`h-full flex flex-col border bg-white dark:bg-gray-800 p-1 transition-all duration-200 cursor-pointer ${
                    isSelected 
                      ? 'border-red-500 dark:border-red-400 shadow-[0_0_0_2px_rgba(239,68,68,0.15)] dark:shadow-[0_0_0_2px_rgba(239,68,68,0.3)] lg:shadow-none lg:border-gray-200 dark:lg:border-gray-700' 
                      : 'border-gray-200 dark:border-gray-700 lg:hover:border-red-500 dark:lg:hover:border-red-400 lg:hover:shadow-[0_0_0_2px_rgba(239,68,68,0.15)] dark:lg:hover:shadow-[0_0_0_2px_rgba(239,68,68,0.3)] lg:hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  <div className="w-3/4 mx-auto aspect-square overflow-hidden bg-gray-50 dark:bg-gray-700">
                    {p.image_url ? (
                      <img src={resolveImageUrl(p.image_url)} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center px-1.5">
                        <p className="text-[8px] font-medium text-gray-500 dark:text-gray-400 leading-tight text-center break-words">{p.name}</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-0.5 flex-1">
                    <h4 className="text-[10px] font-medium text-gray-900 dark:text-gray-100 whitespace-normal break-words leading-tight line-clamp-2 min-h-[24px]">{p.name}</h4>
                    <div className="mt-1">
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs font-semibold text-red-600 dark:text-red-400 leading-none">₹ {(p.discount_percentage > 0 || (p.discounted_price && p.discounted_price < p.price)) ? (p.discounted_price || p.price) : p.price}</span>
                        {(p.discount_percentage > 0 || (p.discounted_price && p.discounted_price < p.price)) && (
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 line-through leading-none">₹ {p.price}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {(() => {
                    const existingSelection = getComboSelectionForProduct(p.id);
                    const isInCombo = existingSelection !== undefined;
                    
                    if (isInCombo) {
                      // Show quantity controls (- quantity +) - Match ADD button exact size and shape
                      return (
                        <div className="mt-0.5 w-full flex items-stretch bg-red-500 dark:bg-red-600 overflow-hidden shadow-sm">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              const newQuantity = existingSelection.quantity - 1;
                              handleUpdateQuantity(existingSelection.id, newQuantity);
                            }}
                            disabled={actionLoading === existingSelection.id}
                            className="flex-1 py-1.5 text-[10px] font-semibold text-white hover:bg-red-600 dark:hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center border-r border-red-400 dark:border-red-500 transition-colors"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="flex-1 py-1.5 text-[10px] font-semibold text-white flex items-center justify-center border-r border-red-400 dark:border-red-500">
                            {existingSelection.quantity}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleUpdateQuantity(existingSelection.id, existingSelection.quantity + 1);
                            }}
                            disabled={actionLoading === existingSelection.id}
                            className="flex-1 py-1.5 text-[10px] font-semibold text-white hover:bg-red-600 dark:hover:bg-red-700 disabled:opacity-50 flex items-center justify-center transition-colors"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      );
                    } else {
                      // Show ADD button - Match quantity controls design exactly
                      return (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleAddToCombo(p);
                    }}
                    disabled={actionLoading === p.id || loading}
                          className="mt-0.5 w-full py-1.5 text-[10px] font-semibold bg-red-500 dark:bg-red-600 text-white hover:bg-red-600 dark:hover:bg-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-0.5 shadow-sm hover:shadow-md"
                  >
                    {actionLoading === p.id ? (
                      <>
                              <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full"></span>
                        <span>Adding...</span>
                      </>
                    ) : (
                      'ADD'
                    )}
                  </button>
                      );
                    }
                  })()}
                </div>
                );
              })
              )}
            </div>
          </div>

          {/* Mobile Combo View - Only visible on mobile when "Your Combo" tab is active */}
          <div className={`lg:hidden flex-1 overflow-y-auto p-3 ${mobileActiveTab !== 'combo' ? 'hidden' : ''}`}>
            <div className="mb-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30 rounded-md flex items-center justify-center">
                    <ShoppingBag className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  </div>
                  Your Combo
                </h3>
                {comboSelections.length > 0 && (
                  <button
                    onClick={handleClearAllAddOns}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    title="Clear all add-ons"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Add-ons</span>
                  </button>
                )}
              </div>
            </div>
              
              {comboSelections.length === 0 ? (
              <div ref={emptyStateRef} className="text-center py-8 text-gray-500 dark:text-gray-400 animate-fade-in">
                <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30 rounded-full flex items-center justify-center animate-bounce-subtle">
                  <ShoppingBag className="w-8 h-8 text-rose-400 dark:text-rose-500" />
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1.5">Your combo is empty</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-snug max-w-xs mx-auto mb-3">Browse the categories and add products to create your perfect combo</p>
                <button
                  onClick={() => setMobileActiveTab('browse')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-rose-500 to-pink-500 dark:from-rose-600 dark:to-pink-600 text-white rounded-md hover:from-rose-600 hover:to-pink-600 dark:hover:from-rose-700 dark:hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 text-xs font-medium"
                >
                  <span>Browse Add-ons</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
                </div>
              ) : (
              <div className="space-y-2">
                    {comboSelections.map((selection) => {
                      const unitPrice = (selection.discount_percentage > 0 || (selection.discounted_price && selection.discounted_price < selection.price)) 
                        ? (selection.discounted_price || selection.price) 
                        : selection.price;
                      const itemTotal = unitPrice * selection.quantity;
                      return (
                      <div
                        key={selection.id}
                      className={`bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600 hover:border-purple-200 dark:hover:border-purple-700 hover:shadow-sm transition-all duration-200 ${
                        newlyAddedItem === selection.id ? 'animate-pulse-scale ring-2 ring-rose-400 dark:ring-rose-500' : ''
                      }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate mb-1">{selection.product_name}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{selection.category_name}</p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs text-gray-600 dark:text-gray-400">Item Total:</span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatPrice(itemTotal)}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              ({formatPrice(unitPrice)} × {selection.quantity})
                            </span>
                            {(selection.discount_percentage > 0 || (selection.discounted_price && selection.discounted_price < selection.price)) && (
                              <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded">
                                      {Math.round(((selection.price - (selection.discounted_price || selection.price)) / selection.price) * 100)}% OFF
                                    </span>
                            )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col items-center gap-1">
                              <div className="flex items-center border border-gray-300 rounded">
                                <button
                                  onClick={() => handleUpdateQuantity(selection.id, selection.quantity - 1)}
                                  disabled={actionLoading === selection.id || selection.quantity <= 1}
                                  className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="px-3 py-1 text-sm font-medium text-gray-900 min-w-[2rem] text-center">
                                  {selection.quantity}
                                </span>
                                <button
                                  onClick={() => handleUpdateQuantity(selection.id, selection.quantity + 1)}
                                  disabled={actionLoading === selection.id}
                                  className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveFromCombo(selection.id)}
                              disabled={actionLoading === selection.id}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                              title="Remove from combo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
            )}
          </div>

          {/* Right Side - Combo Summary - Hidden on mobile, visible on desktop */}
          <div className="hidden lg:flex lg:w-80 bg-gray-50 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex-col lg:h-full">
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-2.5 pb-0 lg:pb-2.5 max-h-[50vh] lg:max-h-full">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                  <div className="w-6 h-6 bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30 rounded-md flex items-center justify-center">
                    <ShoppingBag className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  </div>
                  Your Combo
                </h3>
                {comboSelections.length > 0 && (
                  <button
                    onClick={handleClearAllAddOns}
                    className="flex items-center gap-1 text-[10px] font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors px-2 py-1"
                    title="Clear all add-ons"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              {comboSelections.length === 0 ? (
                <div ref={emptyStateRef} className="text-center py-6 lg:py-8 text-gray-500 dark:text-gray-400 animate-fade-in">
                  <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30 rounded-full flex items-center justify-center animate-bounce-subtle">
                    <ShoppingBag className="w-8 h-8 text-rose-400 dark:text-rose-500" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1.5">Your combo is empty</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-snug max-w-xs mx-auto mb-3">Browse the categories and add products to create your perfect combo</p>
                  <button
                    onClick={() => {
                      // Scroll to first category tab
                      const firstTab = document.querySelector('[role="tab"]');
                      if (firstTab) {
                        firstTab.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-rose-500 to-pink-500 dark:from-rose-600 dark:to-pink-600 text-white rounded-md hover:from-rose-600 hover:to-pink-600 dark:hover:from-rose-700 dark:hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 text-xs font-medium"
                  >
                    <span>Browse Categories</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <>
                  {/* Full Combo Items List - Always visible on desktop */}
                  <div className="space-y-1.5 mb-2 lg:block">
                    {comboSelections.map((selection) => {
                      const unitPrice = (selection.discount_percentage > 0 || (selection.discounted_price && selection.discounted_price < selection.price)) 
                        ? (selection.discounted_price || selection.price) 
                        : selection.price;
                      const itemTotal = unitPrice * selection.quantity;
                      return (
                      <div
                        key={selection.id}
                        className={`bg-white dark:bg-gray-700 rounded-md p-2 border border-gray-200 dark:border-gray-600 hover:border-purple-200 dark:hover:border-purple-700 hover:shadow-sm transition-all duration-200 ${
                          newlyAddedItem === selection.id ? 'animate-pulse-scale ring-2 ring-rose-400 dark:ring-rose-500' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate mb-0.5">{selection.product_name}</h4>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">{selection.category_name}</p>
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="text-[10px] text-gray-600 dark:text-gray-400">Item Total:</span>
                              <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{formatPrice(itemTotal)}</span>
                              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                ({formatPrice(unitPrice)} × {selection.quantity})
                              </span>
                              {(selection.discount_percentage > 0 || (selection.discounted_price && selection.discounted_price < selection.price)) && (
                                <span className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1 py-0.5 rounded">
                                  {Math.round(((selection.price - (selection.discounted_price || selection.price)) / selection.price) * 100)}% OFF
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="flex flex-col items-center gap-0.5">
                              <div className="flex items-center border border-gray-300 rounded">
                                <button
                                  onClick={() => handleUpdateQuantity(selection.id, selection.quantity - 1)}
                                  disabled={actionLoading === selection.id || selection.quantity <= 1}
                                  className="px-1 py-0.5 text-[10px] text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Minus className="w-2.5 h-2.5" />
                                </button>
                                <span className="px-1.5 py-0.5 text-xs font-medium text-gray-900 min-w-[1.5rem] text-center">
                                  {selection.quantity}
                                </span>
                                <button
                                  onClick={() => handleUpdateQuantity(selection.id, selection.quantity + 1)}
                                  disabled={actionLoading === selection.id}
                                  className="px-1 py-0.5 text-[10px] text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                                >
                                  <Plus className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveFromCombo(selection.id)}
                              disabled={actionLoading === selection.id}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                              title="Remove from combo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        </div>
                      </div>
                      );
                    })}
                      </div>

                      {/* Success Message */}
                      {saveSuccess && (
                    <div className="mb-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300 text-xs animate-slide-in">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 animate-scale-in" />
                        <span className="font-medium">Combo selections saved successfully!</span>
                      </div>
                        </div>
                      )}

                      {/* Error Message */}
                      {error && (
                    <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-300 text-xs">
                          {error}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Sticky Footer with Price Breakdown and Button - Hidden on mobile (moved to sticky footer), visible on laptop */}
            <div className="hidden lg:block lg:sticky lg:bottom-0 bg-gradient-to-b from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-900/50 border-t border-gray-200 dark:border-gray-700 p-2.5 lg:mt-auto backdrop-blur-sm">
              {/* Price Breakdown - Sticky */}
              <div className="bg-white dark:bg-gray-700 rounded-lg p-2.5 mb-2.5 border border-gray-200 dark:border-gray-600 shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50">
                <button
                  onClick={() => setIsPriceBreakdownExpanded(!isPriceBreakdownExpanded)}
                  className="w-full flex items-center justify-between gap-1.5 mb-1.5 pb-1.5 border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50/50 dark:hover:bg-gray-600/30 rounded-t-lg transition-colors -mx-2.5 px-2.5"
                >
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-md flex items-center justify-center">
                      <Package className="w-2.5 h-2.5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100">Price Breakdown</h4>
                  </div>
                  {isPriceBreakdownExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                  )}
                </button>
                <div className="overflow-hidden transition-all duration-300 ease-in-out" style={{ maxHeight: isPriceBreakdownExpanded ? '500px' : '0' }}>
                  <div className="space-y-1">
                    {/* Base Item Row */}
                    <div className="flex items-center justify-between py-1 px-1.5 rounded-md">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {quantity} Base Item
                      </span>
                      <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{formatPrice(getBaseProductTotal())}</span>
                    </div>
                    {/* Add-ons Row */}
                    <div className="flex items-center justify-between py-1 px-1.5 rounded-md">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {comboSelections.length} Item{comboSelections.length !== 1 ? 's' : ''} ({getTotalAddOnsCount()} Add-ons)
                      </span>
                      <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{formatPrice(getComboTotalPrice())}</span>
                    </div>
                  </div>
                </div>
                <div className="border-t-2 border-gray-300 dark:border-gray-600 pt-1.5 mt-1.5 bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-md px-2 py-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900 dark:text-gray-100">Total:</span>
                    <span className="text-sm font-bold text-red-600 dark:text-red-400">
                      {formatPrice(getBaseProductTotal())} + {formatPrice(getComboTotalPrice())} = {formatPrice(getGrandTotal())}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              {canAddToCart() && comboSelections.length > 0 ? (
                // Show two buttons when slot is selected and combos exist
                <div className="flex gap-2.5">
                  {/* Save & Return Button - Modern Outline Style with Enhanced Border */}
                  <button
                    onClick={async () => {
                      setSaveLoading(true);
                      setSaveSuccess(false);
                      setError(null);
                      try {
                        if (onComboUpdate) {
                          await onComboUpdate(comboSelections);
                        }
                        setSaveSuccess(true);
                        setTimeout(() => {
                          onClose();
                        }, 800);
                      } catch (err) {
                        setError(err.message || 'Failed to save combo selections');
                      } finally {
                        setSaveLoading(false);
                      }
                    }}
                    disabled={saveLoading}
                    className="flex-1 py-2 px-3 text-sm bg-white dark:bg-gray-800 border-2 border-gray-400 dark:border-gray-500 text-gray-800 dark:text-gray-200 rounded hover:border-gray-500 dark:hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:shadow-sm transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-0.5 ring-1 ring-inset ring-gray-200/50 dark:ring-gray-600/30 min-h-[56px]"
                  >
                    <div className="flex items-center gap-1.5">
                      <ArrowLeft className="w-4 h-4" />
                      <span className="leading-tight">{saveLoading ? 'Saving...' : getContinueButtonText()}</span>
                    </div>
                    <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400 leading-tight">
                      {getTotalAddOnsCount()} {getTotalAddOnsCount() === 1 ? 'Add-on' : 'Add-ons'}
                    </span>
                  </button>
                  
                  {/* Add to Cart Button - Filled Style */}
                  <button
                    onClick={handleAddToCartFromModal}
                    disabled={saveLoading}
                    className="flex-1 py-2 px-3 text-sm bg-rose-500 dark:bg-rose-600 text-white rounded hover:bg-rose-600 dark:hover:bg-rose-700 active:bg-rose-700 dark:active:bg-rose-800 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-0.5 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] min-h-[56px]"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="leading-tight">{saveLoading ? 'Adding...' : 'Add to Cart'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-medium text-white/95 leading-tight">
                      {formatPrice(getGrandTotal())}
                    </span>
                  </button>
                </div>
              ) : comboSelections.length === 0 ? (
                // Show single button when no combos
                <button
                  onClick={onClose}
                  className="w-full py-2 px-3 text-sm bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-700 dark:to-pink-700 text-white rounded hover:from-purple-700 hover:to-pink-700 dark:hover:from-purple-800 dark:hover:to-pink-800 transition-all duration-200 font-semibold shadow-sm hover:shadow-md"
                >
                  {getContinueButtonText()}
                </button>
              ) : (
                // Show single Save & Return button when combos exist but no slot
                <button
                  onClick={async () => {
                    setSaveLoading(true);
                    setSaveSuccess(false);
                    setError(null);
                    try {
                      if (onComboUpdate) {
                        await onComboUpdate(comboSelections);
                      }
                      setSaveSuccess(true);
                      setTimeout(() => {
                        onClose();
                      }, 800);
                    } catch (err) {
                      setError(err.message || 'Failed to save combo selections');
                    } finally {
                      setSaveLoading(false);
                    }
                  }}
                  disabled={saveLoading}
                  className="w-full py-2 px-3 text-sm bg-white dark:bg-gray-800 border-2 border-gray-400 dark:border-gray-500 text-gray-800 dark:text-gray-200 rounded hover:border-gray-500 dark:hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:shadow-sm transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-0.5 ring-1 ring-inset ring-gray-200/50 dark:ring-gray-600/30"
                >
                  <div className="flex items-center gap-1.5">
                    <ArrowLeft className="w-4 h-4" />
                    <span className="leading-tight">{saveLoading ? 'Saving...' : getContinueButtonText()}</span>
                  </div>
                  <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400 leading-tight">
                    {getTotalAddOnsCount()} {getTotalAddOnsCount() === 1 ? 'Add-on' : 'Add-ons'}
                  </span>
                </button>
              )}
            </div>
          </div>
          
          {/* Sticky Footer with Price Breakdown and Button - Mobile Only */}
          <div className="lg:hidden bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50 border-t border-gray-200 dark:border-gray-700 p-3 shadow-lg backdrop-blur-sm">
            {/* Price Breakdown - Sticky on Mobile */}
            <div className="bg-white dark:bg-gray-700 rounded-lg p-2.5 mb-2.5 border border-gray-200 dark:border-gray-600 shadow-md">
              <button
                onClick={() => setIsPriceBreakdownExpanded(!isPriceBreakdownExpanded)}
                className="w-full flex items-center justify-between gap-1.5 mb-1.5 pb-1.5 border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50/50 dark:hover:bg-gray-600/30 rounded-t-lg transition-colors -mx-2.5 px-2.5"
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-md flex items-center justify-center">
                    <Package className="w-2.5 h-2.5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100">Price Breakdown</h4>
                </div>
                {isPriceBreakdownExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                )}
              </button>
              <div className="overflow-hidden transition-all duration-300 ease-in-out" style={{ maxHeight: isPriceBreakdownExpanded ? '500px' : '0' }}>
                <div className="space-y-1">
                  {/* Base Item Row */}
                  <div className="flex items-center justify-between py-1 px-1.5 rounded-md">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {quantity} Base Item
                    </span>
                    <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{formatPrice(getBaseProductTotal())}</span>
                  </div>
                  {/* Add-ons Row */}
                  <div className="flex items-center justify-between py-1 px-1.5 rounded-md">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {comboSelections.length} Item{comboSelections.length !== 1 ? 's' : ''} ({getTotalAddOnsCount()} Add-ons)
                    </span>
                    <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{formatPrice(getComboTotalPrice())}</span>
                  </div>
                </div>
              </div>
              <div className="border-t-2 border-gray-300 dark:border-gray-600 pt-1.5 mt-1.5 bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-md px-2 py-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900 dark:text-gray-100">Total:</span>
                  <span className="text-sm font-bold text-red-600 dark:text-red-400">
                    {formatPrice(getBaseProductTotal())} + {formatPrice(getComboTotalPrice())} = {formatPrice(getGrandTotal())}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            {canAddToCart() && comboSelections.length > 0 ? (
              // Show two buttons when slot is selected and combos exist
              <div className="flex gap-2">
                {/* Save & Return Button - Modern Outline Style with Enhanced Border */}
                <button
                  onClick={async () => {
                    setSaveLoading(true);
                    setSaveSuccess(false);
                    setError(null);
                    try {
                      if (onComboUpdate) {
                        await onComboUpdate(comboSelections);
                      }
                      setSaveSuccess(true);
                      setTimeout(() => {
                        onClose();
                      }, 800);
                    } catch (err) {
                      setError(err.message || 'Failed to save combo selections');
                    } finally {
                      setSaveLoading(false);
                    }
                  }}
                  disabled={saveLoading}
                  className="flex-1 py-2.5 px-3 text-base bg-white dark:bg-gray-800 border-2 border-gray-400 dark:border-gray-500 text-gray-800 dark:text-gray-200 rounded hover:border-gray-500 dark:hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:shadow-sm transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-0.5 min-h-[56px]"
                >
                  <div className="flex items-center gap-1.5">
                    <ArrowLeft className="w-4 h-4" />
                    <span className="leading-tight text-base">{saveLoading ? 'Saving...' : getContinueButtonText()}</span>
                  </div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400 leading-tight">
                    {getTotalAddOnsCount()} {getTotalAddOnsCount() === 1 ? 'Add-on' : 'Add-ons'}
                  </span>
                </button>
                
                {/* Add to Cart Button - Filled Style */}
                <button
                  onClick={handleAddToCartFromModal}
                  disabled={saveLoading}
                  className="flex-1 py-2.5 px-3 text-base bg-rose-500 dark:bg-rose-600 text-white rounded hover:bg-rose-600 dark:hover:bg-rose-700 active:bg-rose-700 dark:active:bg-rose-800 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-0.5 cursor-pointer min-h-[56px]"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="leading-tight text-base">{saveLoading ? 'Adding...' : 'Add to Cart'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-white/95 leading-tight">
                    {formatPrice(getGrandTotal())}
                  </span>
                </button>
              </div>
            ) : comboSelections.length === 0 ? (
              // Show single button when no combos
              <button
                onClick={onClose}
                className="w-full py-2.5 px-3 text-base bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-700 dark:to-pink-700 text-white rounded hover:from-purple-700 hover:to-pink-700 dark:hover:from-purple-800 dark:hover:to-pink-800 transition-all duration-200 font-semibold shadow-sm hover:shadow-md"
              >
                {getContinueButtonText()}
              </button>
            ) : (
              // Show single Save & Return button when combos exist but no slot
              <button
                onClick={async () => {
                  setSaveLoading(true);
                  setSaveSuccess(false);
                  setError(null);
                  try {
                    if (onComboUpdate) {
                      await onComboUpdate(comboSelections);
                    }
                    setSaveSuccess(true);
                    setTimeout(() => {
                      onClose();
                    }, 800);
                  } catch (err) {
                    setError(err.message || 'Failed to save combo selections');
                  } finally {
                    setSaveLoading(false);
                  }
                }}
                disabled={saveLoading}
                className="w-full py-2.5 px-3 text-base bg-white dark:bg-gray-800 border-2 border-gray-400 dark:border-gray-500 text-gray-800 dark:text-gray-200 rounded hover:border-gray-500 dark:hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:shadow-sm transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-0.5 ring-1 ring-inset ring-gray-200/50 dark:ring-gray-600/30"
              >
                <div className="flex items-center gap-1.5">
                  <ArrowLeft className="w-4 h-4" />
                  <span className="leading-tight text-base">{saveLoading ? 'Saving...' : getContinueButtonText()}</span>
                </div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 leading-tight">
                  {getTotalAddOnsCount()} {getTotalAddOnsCount() === 1 ? 'Add-on' : 'Add-ons'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default MakeItAComboModal;
