'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ShoppingBag, Home, Package, Gift, ChevronDown, ChevronUp, MapPin, Calendar, CreditCard, Download, FileText, Loader2, Check } from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import CondensedWalletCard from '../../components/CondensedWalletCard';
import scratchCardApi from '../../api/scratchCardApi';
import orderApi from '../../api/orderApi';
import settingsApi from '../../api/settingsApi';
import { useWallet } from '../../contexts/WalletContext';
import { useToast } from '../../contexts/ToastContext';
import { formatPrice } from '../../utils/priceFormatter';

export default function OrderSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { fetchBalance } = useWallet();
  const { showSuccess, showError } = useToast();
  const [orderNumber, setOrderNumber] = useState('');
  const [scratchCard, setScratchCard] = useState(null);
  const [loadingScratchCard, setLoadingScratchCard] = useState(false);
  const [earnedAmount, setEarnedAmount] = useState(0);
  const [referralBonus, setReferralBonus] = useState(0);
  const [orderSummaryExpanded, setOrderSummaryExpanded] = useState(false);
  const [deliveryInfoExpanded, setDeliveryInfoExpanded] = useState(false);
  const [paymentInfoExpanded, setPaymentInfoExpanded] = useState(false);
  const [scratchCardExpanded, setScratchCardExpanded] = useState(true); // Default to open
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(1500); // Default value, will be fetched from API

  // Accordion handlers - only one section can be open at a time
  const handleOrderSummaryToggle = () => {
    const newValue = !orderSummaryExpanded;
    setOrderSummaryExpanded(newValue);
    if (newValue) {
      // Close other sections when opening this one
      setDeliveryInfoExpanded(false);
      setPaymentInfoExpanded(false);
      setScratchCardExpanded(false);
    }
  };

  const handleDeliveryInfoToggle = () => {
    const newValue = !deliveryInfoExpanded;
    setDeliveryInfoExpanded(newValue);
    if (newValue) {
      // Close other sections when opening this one
      setOrderSummaryExpanded(false);
      setPaymentInfoExpanded(false);
      setScratchCardExpanded(false);
    }
  };

  const handlePaymentInfoToggle = () => {
    const newValue = !paymentInfoExpanded;
    setPaymentInfoExpanded(newValue);
    if (newValue) {
      // Close other sections when opening this one
      setOrderSummaryExpanded(false);
      setDeliveryInfoExpanded(false);
      setScratchCardExpanded(false);
    }
  };

  const handleScratchCardToggle = () => {
    const newValue = !scratchCardExpanded;
    setScratchCardExpanded(newValue);
    if (newValue) {
      // Close other sections when opening this one
      setOrderSummaryExpanded(false);
      setDeliveryInfoExpanded(false);
      setPaymentInfoExpanded(false);
    }
  };
  const [orderDetails, setOrderDetails] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);
  const [receiptDownloaded, setReceiptDownloaded] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

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

    fetchFreeDeliveryThreshold();
  }, []);

  useEffect(() => {
    const orderNum = searchParams.get('orderNumber');
    const scratchCardId = searchParams.get('scratchCardId');
    const scratchCardAmount = searchParams.get('scratchCardAmount');
    const earned = searchParams.get('earned');
    const referral = searchParams.get('referral');
    
    if (orderNum) {
      setOrderNumber(orderNum);
      
      // Set earned amounts if provided
      if (earned) setEarnedAmount(parseFloat(earned));
      if (referral) setReferralBonus(parseFloat(referral));
      
      // Show success animation on mount
      setShowSuccessAnimation(true);
      setTimeout(() => setShowSuccessAnimation(false), 2000);
      
      // Refresh wallet balance
      fetchBalance();
      
      // Fetch order details
      fetchOrderDetails(orderNum);
      
      // If scratch card info is provided, fetch full scratch card details
      if (scratchCardId) {
        fetchScratchCard(parseInt(scratchCardId), orderNum, scratchCardAmount);
      } else if (scratchCardAmount) {
        // If only amount is provided, create a temporary scratch card object for display
        // This shouldn't happen, but handle it gracefully
        setScratchCard({
          id: null,
          orderId: null,
          orderNumber: orderNum,
          amount: parseFloat(scratchCardAmount),
          status: 'pending'
        });
        setEarnedAmount(parseFloat(scratchCardAmount));
      }
    } else {
      // Redirect if no order number
      router.push('/');
    }
  }, [searchParams, router, fetchBalance]);

  const fetchOrderDetails = async (orderNum) => {
    try {
      // Check if user is authenticated before making API call
      const token = localStorage.getItem('customer_token');
      if (!token) {
        // User not authenticated, skip fetching order details
        // This is expected for guest orders
        return;
      }

      setLoadingOrder(true);
      const order = await orderApi.getOrderByNumber(orderNum);
      setOrderDetails(order);
    } catch (error) {
      // Only log non-authentication errors
      if (error.message !== 'Authentication required') {
        console.error('Error fetching order details:', error);
      }
      // Don't show error to user, just don't display details
    } finally {
      setLoadingOrder(false);
    }
  };

  const fetchScratchCard = async (scratchCardId, orderNum, scratchCardAmount) => {
    try {
      // Check if user is authenticated before making API call
      const token = localStorage.getItem('customer_token');
      if (!token) {
        // User not authenticated, create temporary card object if we have the amount
        if (scratchCardAmount) {
          setScratchCard({
            id: scratchCardId,
            orderId: null,
            orderNumber: orderNum,
            amount: parseFloat(scratchCardAmount),
            status: 'pending'
          });
        }
        return;
      }

      setLoadingScratchCard(true);
      const response = await scratchCardApi.getScratchCards();
      if (response.success) {
        const card = response.data.scratchCards.find(c => c.id === scratchCardId);
        if (card) {
          setScratchCard(card);
        } else {
          console.warn(`Scratch card ${scratchCardId} not found in user's scratch cards`);
          // Try to create a temporary card object if we have the amount
          if (scratchCardAmount) {
            setScratchCard({
              id: scratchCardId,
              orderId: null,
              orderNumber: orderNum,
              amount: parseFloat(scratchCardAmount),
              status: 'pending'
            });
          }
        }
      }
    } catch (error) {
      // Only log non-authentication errors
      if (error.message !== 'Access denied. No token provided.' && error.message !== 'Authentication required') {
        console.error('Error fetching scratch card:', error);
      }
      // If fetch fails but we have amount, show temporary card
      if (scratchCardAmount) {
        setScratchCard({
          id: scratchCardId,
          orderId: null,
          orderNumber: orderNum,
          amount: parseFloat(scratchCardAmount),
          status: 'pending'
        });
      }
    } finally {
      setLoadingScratchCard(false);
    }
  };

  const handleScratchCardRevealed = (cardId, amount) => {
    // Refresh scratch card data
    const scratchCardId = searchParams.get('scratchCardId');
    const scratchCardAmount = searchParams.get('scratchCardAmount');
    if (scratchCardId) {
      fetchScratchCard(parseInt(scratchCardId), orderNumber, scratchCardAmount);
    }
  };

  const handleScratchCardCredited = () => {
    // Refresh scratch card data
    const scratchCardId = searchParams.get('scratchCardId');
    const scratchCardAmount = searchParams.get('scratchCardAmount');
    if (scratchCardId) {
      fetchScratchCard(parseInt(scratchCardId), orderNumber, scratchCardAmount);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    if (timeString.includes('PM') || timeString.includes('AM')) {
      return timeString;
    }
    if (timeString.includes(' - ')) {
      return timeString;
    }
    try {
      let timeToFormat = timeString.trim();
      if (timeToFormat.includes('AM') || timeToFormat.includes('PM')) {
        return timeToFormat;
      }
      const timeMatch = timeToFormat.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        if (isNaN(hours) || isNaN(minutes)) {
          return timeString;
        }
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
      }
      return timeString;
    } catch (error) {
      return timeString;
    }
  };

  const handleDownloadReceipt = async () => {
    try {
      setDownloadingReceipt(true);
      setReceiptDownloaded(false);
      
      const token = localStorage.getItem('customer_token');
      if (!token) {
        showError('Authentication Required', 'Please log in to download invoice');
        setDownloadingReceipt(false);
        return;
      }
      
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE_URL}/orders/invoice/${orderNumber}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${orderNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setReceiptDownloaded(true);
        showSuccess('Invoice Downloaded', 'Your invoice has been downloaded successfully!');
        
        // Reset after 2 seconds
        setTimeout(() => {
          setReceiptDownloaded(false);
        }, 2000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        showError('Download Failed', errorData.message || 'Failed to download invoice. Please try again.');
      }
    } catch (error) {
      console.error('Error downloading receipt:', error);
      showError('Download Failed', 'An error occurred while downloading the invoice. Please try again.');
    } finally {
      setDownloadingReceipt(false);
    }
  };

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' }
    }
  };

  const headerVariants = {
    initial: { opacity: 0, scale: 0.9, y: -20 },
    animate: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { 
        duration: 0.6, 
        ease: 'easeOut',
        delay: 0.1
      }
    }
  };

  const sectionVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' }
    }
  };

  const expandVariants = {
    collapsed: { 
      height: 0, 
      opacity: 0,
      transition: { duration: 0.3, ease: 'easeInOut' }
    },
    expanded: { 
      height: 'auto', 
      opacity: 1,
      transition: { duration: 0.4, ease: 'easeOut' }
    }
  };

  const buttonHoverVariants = {
    rest: { scale: 1 },
    hover: { 
      scale: 1.02,
      transition: { duration: 0.2 }
    },
    tap: { scale: 0.98 }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      {/* Success Confetti Animation */}
      <AnimatePresence>
        {showSuccessAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50"
          >
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  backgroundColor: ['#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#3b82f6'][Math.floor(Math.random() * 5)]
                }}
                initial={{
                  y: -100,
                  x: 0,
                  rotate: 0,
                  scale: 0
                }}
                animate={{
                  y: typeof window !== 'undefined' ? window.innerHeight + 100 : 1000,
                  x: (Math.random() - 0.5) * 200,
                  rotate: 360,
                  scale: [0, 1, 1, 0],
                  opacity: [0, 1, 1, 0]
                }}
                transition={{
                  duration: 2 + Math.random(),
                  delay: Math.random() * 0.5,
                  ease: 'easeOut'
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6"
      >
        <motion.div
          variants={headerVariants}
          initial="initial"
          animate="animate"
          className="sm:bg-white sm:dark:bg-gray-800 sm:rounded-xl sm:border-l-4 sm:border-green-500 sm:dark:border-green-400 sm:border sm:border-gray-200 sm:dark:border-gray-700 sm:shadow-sm sm:dark:shadow-xl sm:dark:shadow-black/20 sm:p-4 sm:p-5"
        >
          {/* Compact Header with Integrated Order Number */}
          <motion.div
            variants={sectionVariants}
            initial="initial"
            animate="animate"
            className="mb-4"
          >
            {/* Success Message - Mobile: Full width, Desktop: With order badge on right */}
            <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-3 sm:mb-0">
              <div className="flex items-center gap-3 sm:items-start flex-1 w-full sm:w-auto">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    type: 'spring', 
                    stiffness: 200, 
                    damping: 15,
                    delay: 0.2
                  }}
                  className="w-14 h-14 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg sm:shadow-none sm:bg-green-100 sm:dark:bg-green-900/30"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
                  >
                    <CheckCircle className="w-8 h-8 sm:w-7 sm:h-7 text-white sm:text-green-600 sm:dark:text-green-400" />
                  </motion.div>
                </motion.div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 mb-2 sm:mb-1 leading-tight sm:leading-tight whitespace-nowrap sm:whitespace-normal bg-gradient-to-r from-pink-600 to-rose-600 sm:from-transparent sm:to-transparent bg-clip-text text-transparent sm:text-gray-900 sm:dark:text-gray-100">
                    Order Placed Successfully!
                  </h1>
                  <p className="text-sm sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed sm:leading-relaxed font-medium sm:font-normal">
                    Thank you for your order. We're preparing your delicious cakes!
                  </p>
                </div>
              </div>
              {/* Order Number Badge - Desktop: Right side, Mobile: Hidden (shown below) */}
              {orderNumber && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="hidden sm:block bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 border border-pink-200 dark:border-pink-800 rounded-lg px-3 py-1.5 flex-shrink-0"
                >
                  <p className="text-xs sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium mb-0.5">Order #</p>
                  <p className="text-lg sm:text-xl font-bold text-pink-600 dark:text-pink-400 tracking-tight">{orderNumber}</p>
                </motion.div>
              )}
            </div>
            {/* Order Number Badge - Mobile: Full width below message */}
            {orderNumber && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="sm:hidden bg-gradient-to-r from-pink-500 to-rose-500 dark:from-pink-600 dark:to-rose-600 rounded-xl px-5 py-4 text-center shadow-lg border-2 border-pink-300 dark:border-pink-500"
              >
                <p className="text-xs text-white/90 uppercase tracking-wider font-bold mb-2">Order Number</p>
                <p className="text-2xl font-black text-white tracking-tight">{orderNumber}</p>
              </motion.div>
            )}
          </motion.div>

          {/* Collapsible Order Summary Section */}
          <motion.div
            variants={sectionVariants}
            initial="initial"
            animate="animate"
            className="mb-3"
          >
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleOrderSummaryToggle}
              className="w-full flex items-center justify-between p-4 sm:p-3 bg-white dark:bg-gray-800 rounded-xl sm:rounded-xl border-l-4 border-green-700 dark:border-green-600 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors shadow-md sm:shadow-none"
            >
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: orderSummaryExpanded ? 360 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Package className="w-4 h-4 text-green-700 dark:text-green-500" />
                </motion.div>
                <span className="text-base sm:text-sm font-semibold text-gray-900 dark:text-white">Order Summary</span>
              </div>
              <motion.div
                animate={{ rotate: orderSummaryExpanded ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {orderSummaryExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                )}
              </motion.div>
            </motion.button>
            <AnimatePresence>
              {orderSummaryExpanded && (
                <motion.div
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                  variants={expandVariants}
                  className="overflow-hidden"
                >
                  <div className="mt-2 p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                {loadingOrder ? (
                  <div className="text-center py-2">
                    <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-pink-600"></div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Loading order details...</p>
                  </div>
                ) : orderDetails && orderDetails.items && orderDetails.items.length > 0 ? (
                  <div className="space-y-3">
                    {orderDetails.items.map((item, idx) => {
                      // Calculate item price - use deal price if it's a deal, otherwise use stored price
                      const itemPrice = item.isDeal && item.dealPrice 
                        ? item.dealPrice 
                        : parseFloat(item.price || 0);
                      const itemTotal = itemPrice * item.quantity;
                      
                      // Calculate combo total
                      const comboTotal = (item.combos || []).reduce((sum, combo) => {
                        const comboPrice = parseFloat(combo.discounted_price || combo.price || 0);
                        return sum + (comboPrice * combo.quantity);
                      }, 0);
                      
                      // Total for this item including combos
                      const totalItemPrice = itemTotal + comboTotal;
                      
                      return (
                        <div key={item.id || idx} className="pb-3 border-b border-gray-200 dark:border-gray-600 last:border-0 last:pb-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                <p className="text-base sm:text-sm font-semibold text-gray-900 dark:text-white leading-snug">
                                  {item.product_name || 'Product'}
                                </p>
                                {item.isDeal && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 text-[10px] sm:text-[10px] font-bold rounded">
                                    DEAL
                                  </span>
                                )}
                              </div>
                              {item.variant_name && (
                                <p className="text-sm sm:text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                  Size: {item.variant_name} {item.variant_weight ? `(${item.variant_weight})` : ''}
                                </p>
                              )}
                              {item.tier && (
                                <p className="text-sm sm:text-xs text-gray-600 dark:text-gray-400 leading-relaxed">Tier: {item.tier}</p>
                              )}
                              {item.cake_message && (
                                <p className="text-sm sm:text-xs text-gray-500 dark:text-gray-400 italic leading-relaxed">💬 "{item.cake_message}"</p>
                              )}
                              {/* Combo items */}
                              {item.combos && item.combos.length > 0 && (
                                <div className="mt-1.5 space-y-1">
                                  {item.combos.map((combo, comboIdx) => {
                                    const comboPrice = parseFloat(combo.discounted_price || combo.price || 0);
                                    const comboItemTotal = comboPrice * combo.quantity;
                                    return (
                                      <div key={comboIdx} className="flex items-center justify-between text-sm sm:text-xs pl-3 border-l-2 border-gray-200 dark:border-gray-700">
                                        <span className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                          ➕ {combo.product_name || 'Combo Item'} × {combo.quantity}
                                        </span>
                                        <span className="text-gray-700 dark:text-gray-300 font-medium">
                                          {formatPrice(comboItemTotal)}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm sm:text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium">Qty: {item.quantity}</p>
                              <p className={`text-base sm:text-sm font-bold ${item.isDeal ? 'text-green-600 dark:text-green-400' : 'text-pink-600 dark:text-pink-400'}`}>
                                {formatPrice(totalItemPrice)}
                              </p>
                              {item.isDeal && (
                                <p className="text-sm sm:text-xs text-gray-500 dark:text-gray-400 line-through mt-0.5">
                                  {formatPrice(parseFloat(item.product_base_price || item.product_discounted_price || item.price || 0))}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {/* Price Breakdown - Match Checkout Page Format */}
                    <div className="pt-2 mt-3 border-t-2 border-gray-300 dark:border-gray-600 space-y-2">
                      {/* Calculate totals like checkout page */}
                      {(() => {
                        // Calculate subtotal (sum of all items including combos)
                        const calculatedSubtotal = orderDetails.items.reduce((sum, item) => {
                          const itemPrice = item.isDeal && item.dealPrice 
                            ? item.dealPrice 
                            : parseFloat(item.price || 0);
                          const itemTotal = itemPrice * item.quantity;
                          const comboTotal = (item.combos || []).reduce((s, combo) => {
                            const comboPrice = parseFloat(combo.discounted_price || combo.price || 0);
                            return s + (comboPrice * combo.quantity);
                          }, 0);
                          return sum + itemTotal + comboTotal;
                        }, 0);
                        
                        const subtotal = orderDetails.subtotal || calculatedSubtotal;
                        const promoDiscount = orderDetails.promo_discount || 0;
                        const walletDiscount = orderDetails.wallet_amount_used || 0;
                        const deliveryCharge = orderDetails.delivery_charge !== undefined 
                          ? orderDetails.delivery_charge 
                          : (subtotal >= freeDeliveryThreshold ? 0 : 50); // Default 50 if not available
                        const finalDeliveryCharge = subtotal >= freeDeliveryThreshold ? 0 : deliveryCharge;
                        const totalItemCount = orderDetails.items.reduce((sum, item) => {
                          const itemCount = item.quantity || 0;
                          const comboCount = (item.combos || []).reduce((s, c) => s + (c.quantity || 0), 0);
                          return sum + itemCount + comboCount;
                        }, 0);
                        
                        return (
                          <>
                            {/* Subtotal */}
                            <div className="flex justify-between text-base sm:text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Subtotal ({totalItemCount} items)</span>
                              <span className="font-semibold">{formatPrice(subtotal)}</span>
                            </div>
                            
                            {/* Promo Discount */}
                            {promoDiscount > 0 && (
                              <div className="flex items-center justify-between text-base sm:text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg p-2.5">
                                <span className="font-semibold">Promo Discount</span>
                                <span className="font-bold">-{formatPrice(promoDiscount)}</span>
                              </div>
                            )}
                            
                            {/* Delivery Charge */}
                            <div className="flex justify-between text-base sm:text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Delivery Charge</span>
                              <span className="font-semibold">
                                {finalDeliveryCharge === 0 ? (
                                  <span className="text-green-600 dark:text-green-400 font-bold">FREE</span>
                                ) : (
                                  formatPrice(finalDeliveryCharge)
                                )}
                              </span>
                            </div>
                            
                            {/* Wallet Discount */}
                            {walletDiscount > 0 && (
                              <div className="flex items-center justify-between text-base sm:text-sm text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/20 rounded-lg p-2.5">
                                <span className="font-semibold">Wallet Discount</span>
                                <span className="font-bold">-{formatPrice(walletDiscount)}</span>
                              </div>
                            )}
                            
                            {/* Final Total */}
                            <div className="flex items-center justify-between pt-3 border-t-2 border-gray-300 dark:border-gray-600">
                              <span className="text-lg sm:text-base font-bold text-gray-900 dark:text-white">Amount Paid</span>
                              <span className="text-xl sm:text-lg font-bold text-pink-600 dark:text-pink-400">
                                {formatPrice(parseFloat(orderDetails.total_amount || 0))}
                              </span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-600 dark:text-gray-400 text-center">Order details not available</p>
                )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Collapsible Delivery Info Section */}
          <motion.div
            variants={sectionVariants}
            initial="initial"
            animate="animate"
            className="mb-3"
          >
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleDeliveryInfoToggle}
              className="w-full flex items-center justify-between p-4 sm:p-3 bg-white dark:bg-gray-800 rounded-xl sm:rounded-xl border-l-4 border-blue-500 dark:border-blue-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors shadow-md sm:shadow-none"
            >
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: deliveryInfoExpanded ? 360 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </motion.div>
                <span className="text-base sm:text-sm font-semibold text-gray-900 dark:text-white">Delivery Info</span>
              </div>
              <motion.div
                animate={{ rotate: deliveryInfoExpanded ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {deliveryInfoExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                )}
              </motion.div>
            </motion.button>
            <AnimatePresence>
              {deliveryInfoExpanded && (
                <motion.div
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                  variants={expandVariants}
                  className="overflow-hidden"
                >
                  <div className="mt-2 p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                {loadingOrder ? (
                  <div className="text-center py-2">
                    <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-pink-600"></div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Loading delivery details...</p>
                  </div>
                ) : orderDetails ? (
                  <div className="space-y-2.5">
                    {orderDetails.delivery_date && (
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm sm:text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Delivery Date</p>
                          <p className="text-base sm:text-sm font-semibold text-gray-900 dark:text-white leading-relaxed">{formatDate(orderDetails.delivery_date)}</p>
                        </div>
                      </div>
                    )}
                    {orderDetails.delivery_time && (
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm sm:text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Delivery Time</p>
                          <p className="text-base sm:text-sm font-semibold text-gray-900 dark:text-white leading-relaxed">{formatTime(orderDetails.delivery_time)}</p>
                        </div>
                      </div>
                    )}
                    {orderDetails.delivery_address && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm sm:text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium">Delivery Address</p>
                          {(() => {
                            let address = orderDetails.delivery_address;
                            if (typeof address === 'string') {
                              try {
                                address = JSON.parse(address);
                              } catch {
                                return <p className="text-sm text-gray-900 dark:text-white">{orderDetails.delivery_address}</p>;
                              }
                            }
                            return (
                              <div className="text-base sm:text-sm text-gray-900 dark:text-white space-y-1 leading-relaxed">
                                {address.street && <p className="font-semibold">{address.street}</p>}
                                {address.landmark && (
                                  <p className="text-gray-600 dark:text-gray-400">📍 {address.landmark}</p>
                                )}
                                {(address.city || address.state) && (
                                  <p>{[address.city, address.state].filter(Boolean).join(', ')}</p>
                                )}
                                {address.zip_code && <p className="font-semibold">{address.zip_code}</p>}
                                {address.country && <p>{address.country}</p>}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                    {orderDetails.special_instructions && (
                      <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <p className="text-sm sm:text-xs font-semibold text-yellow-800 dark:text-yellow-300 mb-1.5">Special Instructions</p>
                        <p className="text-sm sm:text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{orderDetails.special_instructions}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-600 dark:text-gray-400 text-center">Delivery details not available</p>
                )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Collapsible Payment Info Section */}
          <motion.div
            variants={sectionVariants}
            initial="initial"
            animate="animate"
            className="mb-3"
          >
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handlePaymentInfoToggle}
              className="w-full flex items-center justify-between p-4 sm:p-3 bg-white dark:bg-gray-800 rounded-xl sm:rounded-xl border-l-4 border-purple-500 dark:border-purple-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors shadow-md sm:shadow-none"
            >
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: paymentInfoExpanded ? 360 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <CreditCard className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </motion.div>
                <span className="text-base sm:text-sm font-semibold text-gray-900 dark:text-white">Payment</span>
              </div>
              <motion.div
                animate={{ rotate: paymentInfoExpanded ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {paymentInfoExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                )}
              </motion.div>
            </motion.button>
            <AnimatePresence>
              {paymentInfoExpanded && (
                <motion.div
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                  variants={expandVariants}
                  className="overflow-hidden"
                >
                  <div className="mt-2 p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                {loadingOrder ? (
                  <div className="text-center py-2">
                    <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-pink-600"></div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Loading payment details...</p>
                  </div>
                ) : orderDetails ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm sm:text-xs text-gray-500 dark:text-gray-400 font-medium">Payment Method</span>
                      <span className="text-base sm:text-sm font-semibold text-gray-900 dark:text-white capitalize">
                        {orderDetails.payment_method || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm sm:text-xs text-gray-500 dark:text-gray-400 font-medium">Payment Status</span>
                      <span className={`text-sm sm:text-xs font-semibold px-2.5 py-1.5 rounded ${
                        orderDetails.payment_status === 'paid' 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                      }`}>
                        {orderDetails.payment_status || 'Pending'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t-2 border-gray-200 dark:border-gray-600">
                      <span className="text-lg sm:text-base font-bold text-gray-900 dark:text-white">Total Amount</span>
                      <span className="text-xl sm:text-lg font-bold text-pink-600 dark:text-pink-400">
                        {formatPrice(parseFloat(orderDetails.total_amount || 0))}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-600 dark:text-gray-400 text-center">Payment details not available</p>
                )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Collapsible Scratch Card Section */}
          {scratchCard && (
            <motion.div
              variants={sectionVariants}
              initial="initial"
              animate="animate"
              className="mb-3"
            >
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleScratchCardToggle}
                className="w-full flex items-center justify-between p-4 sm:p-3 bg-white dark:bg-gray-800 rounded-xl sm:rounded-xl border-l-4 border-pink-500 dark:border-pink-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors shadow-md sm:shadow-none"
              >
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: scratchCardExpanded ? 360 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Gift className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                  </motion.div>
                  <span className="text-base sm:text-sm font-semibold text-gray-900 dark:text-white">Scratch Card</span>
                </div>
                <motion.div
                  animate={{ rotate: scratchCardExpanded ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {scratchCardExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  )}
                </motion.div>
              </motion.button>
              <AnimatePresence>
                {scratchCardExpanded && (
                  <motion.div
                    initial="collapsed"
                    animate="expanded"
                    exit="collapsed"
                    variants={expandVariants}
                    className="overflow-hidden"
                  >
                    <div className="mt-2">
                      <CondensedWalletCard
                        earnedAmount={earnedAmount}
                        referralBonus={referralBonus}
                        scratchCard={scratchCard}
                        onScratchCardRevealed={handleScratchCardRevealed}
                        onScratchCardCredited={handleScratchCardCredited}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {loadingScratchCard && (
            <div className="mb-3 text-center py-2">
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-pink-600"></div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Loading scratch card...</p>
            </div>
          )}

          {/* Compact Info Messages */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-4 text-sm sm:text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-gray-400 dark:text-gray-500" />
              <span>Email confirmation sent</span>
            </div>
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-gray-400 dark:text-gray-500" />
              <span>Track order in account</span>
            </div>
          </div>

          {/* Enhanced Action Buttons */}
          <motion.div
            variants={sectionVariants}
            initial="initial"
            animate="animate"
            className="space-y-2.5 pt-3 border-t border-gray-200 dark:border-gray-700"
          >
            <div className="flex flex-row gap-2.5">
              <motion.button
                variants={buttonHoverVariants}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
                onClick={() => router.push('/')}
                className="flex-1 px-4 py-3.5 sm:py-3 bg-gradient-to-r from-pink-600 to-rose-600 dark:from-pink-700 dark:to-rose-700 text-white rounded-lg hover:from-pink-700 hover:to-rose-700 dark:hover:from-pink-600 dark:hover:to-rose-600 transition-all font-semibold text-base sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                >
                  <Home className="w-4 h-4" />
                </motion.div>
                Continue Shopping
              </motion.button>
              <motion.button
                variants={buttonHoverVariants}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
                onClick={() => router.push('/orders')}
                className="flex-1 px-4 py-3.5 sm:py-3 border-2 border-pink-600 dark:border-pink-500 text-pink-600 dark:text-pink-400 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-all font-semibold text-base sm:text-sm flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                View Orders
              </motion.button>
            </div>
            <motion.button
              variants={buttonHoverVariants}
              initial="rest"
              whileHover="hover"
              whileTap="tap"
              onClick={handleDownloadReceipt}
              disabled={downloadingReceipt}
              className={`w-full px-4 py-3 sm:py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all font-medium text-base sm:text-sm flex items-center justify-center gap-2 ${
                downloadingReceipt || receiptDownloaded ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              <AnimatePresence mode="wait">
                {downloadingReceipt ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </motion.div>
                ) : receiptDownloaded ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                  >
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="download"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Download className="w-4 h-4" />
                  </motion.div>
                )}
              </AnimatePresence>
              {downloadingReceipt ? 'Downloading...' : receiptDownloaded ? 'Downloaded!' : 'Download Invoice'}
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>

      <Footer />
    </div>
  );
}

