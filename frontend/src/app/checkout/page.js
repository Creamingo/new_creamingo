'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  CreditCard,
  Wallet,
  Loader2,
  CheckCircle,
  AlertCircle,
  Lock,
  ShoppingBag,
  AlertTriangle,
  X,
  ChevronDown,
  ChevronUp,
  Tag,
  Package,
  Gift,
  Navigation,
  Eye,
  EyeOff
} from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { usePinCode } from '../../contexts/PinCodeContext';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useWallet } from '../../contexts/WalletContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import MobileFooter from '../../components/MobileFooter';
import DeliverySlotSelector from '../../components/DeliverySlotSelector';
import orderApi from '../../api/orderApi';
import settingsApi from '../../api/settingsApi';
import customerAuthApi from '../../api/customerAuthApi';
import { formatPrice } from '../../utils/priceFormatter';

// Helper functions for formatting dates and times (same as cart page)
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
      // Parse YYYY-MM-DD format as local date to avoid timezone issues
      const dateParts = date.split('-');
      let dateObj;
      
      if (dateParts.length === 3) {
        // Parse as local date (YYYY-MM-DD format)
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed
        const day = parseInt(dateParts[2], 10);
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
          dateObj = new Date(year, month, day);
        } else {
          // Fallback to standard parsing
          dateObj = new Date(date);
        }
      } else {
        // Fallback to standard parsing for other formats
        dateObj = new Date(date);
      }
      
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

function CheckoutPageContent({ isClient }) {
  const router = useRouter();
  const { cartItems, getCartSummary, clearCart, isInitialized, autoUpdateExpiredSlots } = useCart();
  const { showSuccess } = useToast();
  const {
    deliveryInfo,
    currentPinCode,
    getFormattedDeliveryCharge
  } = usePinCode();
  const { customer, isAuthenticated, login, register } = useCustomerAuth();
  const { balance: walletBalance = 0, fetchBalance } = useWallet();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [errorWasShown, setErrorWasShown] = useState(false);
  const [showSuccessIndicator, setShowSuccessIndicator] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [locationName, setLocationName] = useState(null);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [locationWarning, setLocationWarning] = useState(null);
  const authSectionRef = useRef(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authStep, setAuthStep] = useState('email');
  const [authPassword, setAuthPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [emailCheckResult, setEmailCheckResult] = useState(null);
  const [signupData, setSignupData] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
    referralCode: ''
  });

  // Form states - Initialize with customer data if authenticated
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: {
      street: customer?.address?.street || '',
      city: customer?.address?.city || '',
      state: customer?.address?.state || '',
      zip_code: customer?.address?.zip_code || currentPinCode || '',
      country: customer?.address?.country || 'India',
      landmark: customer?.address?.landmark || '',
      // Optional precise map location for delivery (lat/lng)
      location: customer?.address?.location || null
    },
    deliveryDate: '',
    deliveryTime: '',
    paymentMethod: 'cash',
    specialInstructions: ''
  });

  // Update form data when customer data loads
  // isClient passed from wrapper to keep hook order stable

  useEffect(() => {
    if (customer && isAuthenticated) {
      setFormData(prev => ({
        ...prev,
        name: customer.name || prev.name,
        email: customer.email || prev.email,
        phone: customer.phone || prev.phone,
        address: {
          street: customer.address?.street || prev.address.street,
          city: customer.address?.city || prev.address.city,
          state: customer.address?.state || prev.address.state,
          zip_code: customer.address?.zip_code || prev.address.zip_code || currentPinCode || '',
          country: customer.address?.country || prev.address.country || 'India',
          landmark: customer.address?.landmark || prev.address.landmark || '',
          location: customer.address?.location || prev.address.location || null
        }
      }));
      
      // Restore locationName if location exists and has a stored name
      if (customer.address?.location?.name) {
        setLocationName(customer.address.location.name);
      }
    }
  }, [customer, isAuthenticated, currentPinCode]);

  useEffect(() => {
    if (!authEmail && formData.email) {
      setAuthEmail(formData.email);
    }
  }, [formData.email, authEmail]);

  useEffect(() => {
    if (isAuthenticated) {
      setAuthStep('done');
      setAuthError('');
      setAuthPassword('');
    } else if (authStep === 'done') {
      setAuthStep('email');
    }
  }, [isAuthenticated, authStep]);

  useEffect(() => {
    if (!signupData.name && formData.name) {
      setSignupData(prev => ({ ...prev, name: formData.name }));
    }
    if (!signupData.phone && formData.phone) {
      setSignupData(prev => ({ ...prev, phone: formData.phone }));
    }
  }, [formData.name, formData.phone, signupData.name, signupData.phone]);

  const normalizeEmail = (value) => value.trim().toLowerCase();

  const scrollToAuthSection = () => {
    if (authSectionRef.current) {
      authSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCheckEmail = async (e) => {
    e.preventDefault();
    setAuthError('');
    const emailToCheck = normalizeEmail(authEmail);
    if (!emailToCheck || !emailToCheck.includes('@')) {
      setAuthError('Please enter a valid email address');
      return;
    }

    setAuthLoading(true);
    try {
      const result = await customerAuthApi.checkEmail({ email: emailToCheck });
      setEmailCheckResult(result);
      setAuthStep(result.exists ? 'login' : 'signup');
      setFormData(prev => ({ ...prev, email: emailToCheck }));
      if (!result.exists) {
        setSignupData(prev => ({
          ...prev,
          name: prev.name || formData.name || '',
          phone: prev.phone || formData.phone || ''
        }));
      }
    } catch (err) {
      setAuthError(err.message || 'Unable to check email. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    const emailToLogin = normalizeEmail(authEmail);
    if (!authPassword) {
      setAuthError('Please enter your password');
      return;
    }

    setAuthLoading(true);
    try {
      await login({ email: emailToLogin, password: authPassword });
      setAuthPassword('');
    } catch (err) {
      setAuthError(err.message || 'Login failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    const emailToRegister = normalizeEmail(authEmail);
    if (!signupData.name.trim()) {
      setAuthError('Please enter your name');
      return;
    }
    if (!signupData.password || signupData.password.length < 6) {
      setAuthError('Password must be at least 6 characters');
      return;
    }
    if (signupData.password !== signupData.confirmPassword) {
      setAuthError('Passwords do not match');
      return;
    }

    setAuthLoading(true);
    try {
      await register({
        name: signupData.name.trim(),
        email: emailToRegister,
        phone: signupData.phone?.trim() || undefined,
        password: signupData.password,
        referralCode: signupData.referralCode?.trim() || undefined
      }, { source: 'checkout' });
      setSignupData(prev => ({
        ...prev,
        password: '',
        confirmPassword: ''
      }));
    } catch (err) {
      setAuthError(err.message || 'Signup failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Auto-reverse geocode when location exists but locationName is missing
  useEffect(() => {
    const location = formData.address?.location;
    if (location && typeof location.lat === 'number' && typeof location.lng === 'number') {
      // If location has a stored name, use it
      if (location.name) {
        setLocationName(prev => prev || location.name);
      }
      // If location doesn't have a name, reverse geocode (only once per location)
      else {
        // Add a small delay to respect rate limits
        const timer = setTimeout(async () => {
          const name = await reverseGeocode(location.lat, location.lng);
          if (name) {
            setLocationName(name);
            // Store the name in the location object for persistence
            setFormData(prev => ({
              ...prev,
              address: {
                ...prev.address,
                location: {
                  ...prev.address.location,
                  name: name
                }
              }
            }));
          }
        }, 1000); // 1 second delay to respect Nominatim rate limits
        
        return () => clearTimeout(timer);
      }
    } else if (!location) {
      // Clear locationName if location is removed
      setLocationName(null);
    }
  }, [formData.address?.location?.lat, formData.address?.location?.lng, formData.address?.location?.name]);

  // Load last used address on mount if customer is not authenticated or doesn't have address
  useEffect(() => {
    // Only load saved address if:
    // 1. Customer is not authenticated, OR
    // 2. Customer is authenticated but doesn't have address data
    const shouldLoadSavedAddress = !isAuthenticated || 
      (isAuthenticated && customer && (!customer.address || (!customer.address.street && !customer.address.city && !customer.address.state)));
    
    if (shouldLoadSavedAddress) {
      const savedAddress = loadLastUsedAddress();
      if (savedAddress && (!formData.address.street && !formData.address.city && !formData.address.state)) {
        setFormData(prev => ({
          ...prev,
          address: {
            ...prev.address,
            street: savedAddress.street || prev.address.street,
            landmark: savedAddress.landmark || prev.address.landmark,
            city: savedAddress.city || prev.address.city,
            state: savedAddress.state || prev.address.state,
            zip_code: savedAddress.zip_code || prev.address.zip_code || currentPinCode || ''
          }
        }));
      }
    }
  }, []); // Only run on mount

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [showSlotSelector, setShowSlotSelector] = useState(false);
  const [applyWalletDiscount, setApplyWalletDiscount] = useState(false);
  const [countdown, setCountdown] = useState(null); // { hours: number, minutes: number } or null
  const [dismissExpiringSoonWarning, setDismissExpiringSoonWarning] = useState(false);
  
  // Collapsible sections state for mobile accordion
  const [expandedSections, setExpandedSections] = useState({
    customerInfo: true, // Default open
    deliveryAddress: true, // Default open
    deliverySlot: true, // Default open
    paymentMethod: true, // Default open
    specialInstructions: false // Default closed
  });
  
  // Order summary bottom sheet state for mobile
  const [showOrderSummarySheet, setShowOrderSummarySheet] = useState(false);
  
  // Section navigation state
  const [showSectionNav, setShowSectionNav] = useState(false);
  const [activeSection, setActiveSection] = useState('customerInfo');
  
  // Field-level errors for better placement
  const [fieldErrors, setFieldErrors] = useState({});
  
  // Address completeness score for visual feedback (0-100)
  const [addressScore, setAddressScore] = useState(0);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(1500); // Default value, will be fetched from API
  
  const toggleSection = (section) => {
    setExpandedSections(prev => {
      if (section === 'deliverySlot' && !selectedSlot && !cartDeliverySlot) {
        return { ...prev, [section]: true };
      }
      return { ...prev, [section]: !prev[section] };
    });
  };
  
  // Scroll to section
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 100; // Offset for sticky header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      // Update active section
      setActiveSection(sectionId);
      
      // On mobile, expand the section if collapsed
      if (window.innerWidth < 1024 && !expandedSections[sectionId]) {
        toggleSection(sectionId);
      }
    }
  };
  
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

  // Auto-save form progress to localStorage
  useEffect(() => {
    const saveFormData = () => {
      try {
        // Only save promo if it's valid (has discount > 0)
        const promoToSave = (appliedPromo && appliedPromo.discount > 0) ? appliedPromo : null;
        
        const dataToSave = {
          formData,
          selectedSlot: selectedSlot ? {
            ...selectedSlot,
            date: selectedSlot.date instanceof Date ? selectedSlot.date.toISOString() : selectedSlot.date
          } : null,
          appliedPromo: promoToSave,
          applyWalletDiscount
        };
        localStorage.setItem('checkout_form_progress', JSON.stringify(dataToSave));
      } catch (error) {
        console.error('Error saving form progress:', error);
      }
    };
    
    // Debounce save to avoid too frequent writes
    const timeoutId = setTimeout(saveFormData, 500);
    return () => clearTimeout(timeoutId);
  }, [formData, selectedSlot, appliedPromo, applyWalletDiscount]);
  
  // Load saved form progress on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('checkout_form_progress');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        
        // Only restore if form is empty (user hasn't started filling)
        if (!formData.name && !formData.email && !formData.phone) {
          if (parsed.formData) {
            setFormData(prev => ({
              ...prev,
              ...parsed.formData,
              // Don't restore delivery date/time if slot is expired
              deliveryDate: parsed.formData.deliveryDate || prev.deliveryDate,
              deliveryTime: parsed.formData.deliveryTime || prev.deliveryTime
            }));
            
            // Restore locationName if location exists
            if (parsed.formData?.address?.location?.name) {
              setLocationName(parsed.formData.address.location.name);
            }
          }
          
          if (parsed.selectedSlot) {
            const restoredDate = parsed.selectedSlot.date 
              ? new Date(parsed.selectedSlot.date)
              : null;
            const restoredSlot = {
              ...parsed.selectedSlot,
              date: restoredDate
            };
            
            // Only restore slot if it's not expired
            if (restoredDate && getSlotExpirationStatus(restoredSlot) !== 'expired') {
              setSelectedSlot(restoredSlot);
            }
          }
          
          // DO NOT restore promo from checkout_form_progress
          // Promo should ONLY come from applied_promo localStorage (Cart is source of truth)
          // Clear any stale promo from checkout_form_progress
          if (parsed.appliedPromo) {
            const cleanedData = { ...parsed, appliedPromo: null };
            localStorage.setItem('checkout_form_progress', JSON.stringify(cleanedData));
          }
          
          if (parsed.applyWalletDiscount !== undefined) {
            setApplyWalletDiscount(parsed.applyWalletDiscount);
          }
        }
      }
    } catch (error) {
      console.error('Error loading saved form progress:', error);
    }
  }, []); // Only run on mount
  
  // Save address to localStorage after successful order
  const saveLastUsedAddress = (address) => {
    try {
      const addressToSave = {
        street: address.street || '',
        landmark: address.landmark || '',
        city: address.city || '',
        state: address.state || '',
        zip_code: address.zip_code || ''
      };
      localStorage.setItem('last_used_address', JSON.stringify(addressToSave));
      console.log('Address saved to localStorage:', addressToSave);
    } catch (error) {
      console.error('Error saving address to localStorage:', error);
    }
  };

  // Load last used address from localStorage
  const loadLastUsedAddress = () => {
    try {
      const savedAddress = localStorage.getItem('last_used_address');
      if (savedAddress) {
        const parsed = JSON.parse(savedAddress);
        return parsed;
      }
    } catch (error) {
      console.error('Error loading saved address from localStorage:', error);
    }
    return null;
  };
  
  // Clear saved form progress after successful order
  const clearSavedFormProgress = () => {
    try {
      localStorage.removeItem('checkout_form_progress');
    } catch (error) {
      console.error('Error clearing saved form progress:', error);
    }
  };
  
  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['customerInfo', 'deliveryAddress', 'deliverySlot', 'paymentMethod', 'specialInstructions'];
      const scrollPosition = window.scrollY + 150;
      
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        const element = document.getElementById(section);
        if (element) {
          const offsetTop = element.offsetTop;
          if (scrollPosition >= offsetTop) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const cartSummary = getCartSummary();

  // Check if delivery slot is expired (same logic as CartContext)
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
      
      // Only consider expired if delivery date is more than 1 day in the past
      // This is very conservative to avoid false positives
      const daysDiff = Math.floor((todayOnly - deliveryDateOnly) / (1000 * 60 * 60 * 24));
      return daysDiff > 1;
    } catch (e) {
      console.error('Error checking delivery slot expiry:', e);
      return false; // On error, assume not expired
    }
  };

  // Check if slot is expired for today (using start time)
  const isSlotExpiredForToday = (deliverySlot) => {
    if (!deliverySlot || !deliverySlot.date) return false;
    
    try {
      const today = new Date();
      let deliveryDate;
      
      if (deliverySlot.date instanceof Date) {
        deliveryDate = new Date(deliverySlot.date);
      } else if (typeof deliverySlot.date === 'string') {
        const dateParts = deliverySlot.date.split('-');
        if (dateParts.length === 3) {
          const year = parseInt(dateParts[0], 10);
          const month = parseInt(dateParts[1], 10) - 1;
          const day = parseInt(dateParts[2], 10);
          if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
            deliveryDate = new Date(year, month, day);
          } else {
            deliveryDate = new Date(deliverySlot.date);
          }
        } else {
          deliveryDate = new Date(deliverySlot.date);
        }
      } else {
        return false;
      }
      
      const selectedDateOnly = new Date(deliveryDate.getFullYear(), deliveryDate.getMonth(), deliveryDate.getDate());
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      // Only check expiration for today's date
      if (selectedDateOnly.getTime() !== todayOnly.getTime()) {
        return false;
      }
      
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      
      // Get slot start time
      const slot = deliverySlot.slot;
      if (!slot || !slot.startTime) return false;
      
      try {
        const [startHour, startMin] = slot.startTime.split(':').map(Number);
        const slotStartTime = startHour * 60 + startMin;
        
        return currentTime >= slotStartTime;
      } catch (e) {
        console.warn('Error parsing slot start time:', e);
        return false;
      }
    } catch (e) {
      console.error('Error checking slot expiration for today:', e);
      return false;
    }
  };

  // Helper function to parse delivery date
  const parseDeliveryDate = (dateInput) => {
    if (!dateInput) return null;
    
    if (dateInput instanceof Date) {
      return new Date(dateInput);
    } else if (typeof dateInput === 'string') {
      const dateParts = dateInput.split('-');
      if (dateParts.length === 3) {
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1;
        const day = parseInt(dateParts[2], 10);
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
          return new Date(year, month, day);
        }
      }
      return new Date(dateInput);
    }
    return null;
  };

  // Get slot expiration status: 'expired' | 'expiring_soon' | 'valid'
  const getSlotExpirationStatus = (deliverySlot) => {
    if (!deliverySlot || !deliverySlot.date) return 'valid';
    
    try {
      const deliveryDate = parseDeliveryDate(deliverySlot.date);
      if (!deliveryDate || isNaN(deliveryDate.getTime())) {
        return 'valid';
      }
      
      const today = new Date();
      const deliveryDateOnly = new Date(deliveryDate.getFullYear(), deliveryDate.getMonth(), deliveryDate.getDate());
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const daysDiff = Math.floor((todayOnly - deliveryDateOnly) / (1000 * 60 * 60 * 24));
      
      // Check if date is in the past (yesterday or earlier)
      if (daysDiff > 0) {
        return 'expired';
      }
      
      // Check if expired for today (time passed)
      if (daysDiff === 0 && isSlotExpiredForToday(deliverySlot)) {
        return 'expired';
      }
      
      // Check if expiring soon (< 2 hours for today's slots)
      if (daysDiff === 0) {
        const slot = deliverySlot.slot;
        if (slot && slot.startTime) {
          try {
            const now = new Date();
            const currentTime = now.getHours() * 60 + now.getMinutes();
            const [startHour, startMin] = slot.startTime.split(':').map(Number);
            const slotStartTime = startHour * 60 + startMin;
            const minutesUntilSlot = slotStartTime - currentTime;
            
            // If slot has already started (negative minutes), it's expired
            if (minutesUntilSlot < 0) {
              return 'expired';
            }
            
            // If less than 2 hours (120 minutes) remaining, it's expiring soon
            if (minutesUntilSlot > 0 && minutesUntilSlot < 120) {
              return 'expiring_soon';
            }
          } catch (e) {
            // Ignore errors
          }
        }
      }
      
      // Also check the conservative expiration check (more than 1 day in past)
      if (isDeliverySlotExpired(deliverySlot)) {
        return 'expired';
      }
    } catch (e) {
      console.error('Error checking slot expiration status:', e);
    }
    
    return 'valid';
  };

  // Calculate countdown timer for today's slots
  const calculateCountdown = (deliverySlot) => {
    if (!deliverySlot || !deliverySlot.date || !deliverySlot.slot?.startTime) {
      return null;
    }
    
    try {
      const today = new Date();
      let deliveryDate;
      
      if (deliverySlot.date instanceof Date) {
        deliveryDate = new Date(deliverySlot.date);
      } else if (typeof deliverySlot.date === 'string') {
        const dateParts = deliverySlot.date.split('-');
        if (dateParts.length === 3) {
          const year = parseInt(dateParts[0], 10);
          const month = parseInt(dateParts[1], 10) - 1;
          const day = parseInt(dateParts[2], 10);
          if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
            deliveryDate = new Date(year, month, day);
          } else {
            deliveryDate = new Date(deliverySlot.date);
          }
        } else {
          deliveryDate = new Date(deliverySlot.date);
        }
      } else {
        return null;
      }
      
      const selectedDateOnly = new Date(deliveryDate.getFullYear(), deliveryDate.getMonth(), deliveryDate.getDate());
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      // Only calculate countdown for today's slots
      if (selectedDateOnly.getTime() !== todayOnly.getTime()) {
        return null;
      }
      
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const [startHour, startMin] = deliverySlot.slot.startTime.split(':').map(Number);
      const slotStartTime = startHour * 60 + startMin;
      const minutesUntilSlot = slotStartTime - currentTime;
      
      if (minutesUntilSlot <= 0) {
        return null; // Slot has already started
      }
      
      return {
        hours: Math.floor(minutesUntilSlot / 60),
        minutes: minutesUntilSlot % 60
      };
    } catch (e) {
      console.error('Error calculating countdown:', e);
      return null;
    }
  };

  // Check if cart items already have delivery slots selected
  const getCartDeliverySlot = () => {
    if (cartItems.length > 0 && cartItems[0].deliverySlot) {
      const slot = cartItems[0].deliverySlot;
      // Check if the slot is expired
      if (isDeliverySlotExpired(slot)) {
        // Return null if expired, so user needs to select a new slot
        return null;
      }
      return slot;
    }
    return null;
  };

  const cartDeliverySlot = getCartDeliverySlot();

  // Track previous expiration status to detect changes
  const previousExpirationStatusRef = React.useRef(null);

  // Track if slot was just selected (to prevent false expiration warnings)
  const slotJustSelectedRef = React.useRef(false);
  const hasRunAutoUpdateRef = React.useRef(false);
  const lastCartItemsHashRef = React.useRef('');
  const autoUpdateTimerRef = React.useRef(null);

  // Real-time expiration monitoring - Update countdown and check expiration every minute
  useEffect(() => {
    const currentSlot = selectedSlot || cartDeliverySlot;
    if (!currentSlot) {
      setCountdown(null);
      previousExpirationStatusRef.current = null;
      slotJustSelectedRef.current = false;
      return;
    }
    
    // If slot was just selected, skip expiration check on first render
    if (slotJustSelectedRef.current) {
      slotJustSelectedRef.current = false;
      // Still calculate countdown and set status, but don't show error
      const initialCountdown = calculateCountdown(currentSlot);
      setCountdown(initialCountdown);
      const initialExpirationStatus = getSlotExpirationStatus(currentSlot);
      previousExpirationStatusRef.current = initialExpirationStatus;
      // Don't check expiration immediately after selection
      // Set up interval for future checks
    } else {
      // Calculate initial countdown
      const initialCountdown = calculateCountdown(currentSlot);
      setCountdown(initialCountdown);
      
      // Check initial expiration status
      const initialExpirationStatus = getSlotExpirationStatus(currentSlot);
      previousExpirationStatusRef.current = initialExpirationStatus;
      
      // Only show error if slot is expired AND it wasn't just selected
      if (initialExpirationStatus === 'expired') {
        // Only clear if this is a stale slot (from cart or previous selection)
        // Don't clear if user just actively selected it
        setError('Your delivery slot has expired. Please select a new slot.');
        setShowSlotSelector(true);
        if (selectedSlot) {
          setSelectedSlot(null);
          setFormData(prev => ({
            ...prev,
            deliveryDate: '',
            deliveryTime: ''
          }));
        }
        return;
      }
    }
    
    // Update every minute - Real-time monitoring
    const interval = setInterval(() => {
      // Re-fetch current slot in case it changed
      const latestSlot = selectedSlot || cartDeliverySlot;
      if (!latestSlot) {
        setCountdown(null);
        previousExpirationStatusRef.current = null;
        return;
      }
      
      // Update countdown
      const updatedCountdown = calculateCountdown(latestSlot);
      setCountdown(updatedCountdown);
      
      // Check current expiration status
      const currentExpirationStatus = getSlotExpirationStatus(latestSlot);
      const previousStatus = previousExpirationStatusRef.current;
      
      // Detect expiration status change (only if slot wasn't just selected)
      if (currentExpirationStatus === 'expired' && previousStatus !== 'expired' && !slotJustSelectedRef.current) {
        // Slot just expired - show error and open selector
        setError('Your delivery slot has just expired. Please select a new slot.');
        setShowSlotSelector(true);
        setSelectedSlot(null);
        setFormData(prev => ({
          ...prev,
          deliveryDate: '',
          deliveryTime: ''
        }));
        previousExpirationStatusRef.current = 'expired';
      } else {
        // Update previous status
        previousExpirationStatusRef.current = currentExpirationStatus;
      }
      
      // If countdown reaches 0 or negative, check if slot expired
      if (!updatedCountdown || (updatedCountdown.hours === 0 && updatedCountdown.minutes === 0)) {
        // Slot might have expired, trigger re-check
        if (isSlotExpiredForToday(latestSlot)) {
          setCountdown(null);
          if (currentExpirationStatus === 'expired' && previousStatus !== 'expired' && !slotJustSelectedRef.current) {
            setError('Your delivery slot has just expired. Please select a new slot.');
            setShowSlotSelector(true);
            setSelectedSlot(null);
            setFormData(prev => ({
              ...prev,
              deliveryDate: '',
              deliveryTime: ''
            }));
          }
        }
      }
    }, 60000); // Update every minute (60,000ms)
    
    return () => clearInterval(interval);
  }, [selectedSlot, cartDeliverySlot]);


  // Initialize selectedSlot from cart items on mount (only once)
  const hasInitializedSlot = React.useRef(false);
  
  // Check if current selectedSlot is expired and clear it
  useEffect(() => {
    if (selectedSlot && selectedSlot.date) {
      // Create a temporary slot object to check expiry
      const tempSlot = { date: selectedSlot.date };
      if (isDeliverySlotExpired(tempSlot)) {
        // Slot is expired, clear it
        setSelectedSlot(null);
        setFormData(prev => ({
          ...prev,
          deliveryDate: '',
          deliveryTime: ''
        }));
        hasInitializedSlot.current = false;
        return;
      }
    }
  }, [selectedSlot]);
  
  useEffect(() => {
    // Clear selectedSlot if cartDeliverySlot is null (expired)
    if (!cartDeliverySlot && selectedSlot && hasInitializedSlot.current) {
      setSelectedSlot(null);
      setFormData(prev => ({
        ...prev,
        deliveryDate: '',
        deliveryTime: ''
      }));
      hasInitializedSlot.current = false;
      return;
    }
    
    // Only initialize once, and only if we don't have a selectedSlot already
    if (cartDeliverySlot && !selectedSlot && !hasInitializedSlot.current) {
      // Convert cart delivery slot to format expected by form
      // Parse date string as local date to avoid timezone issues
      let date = null;
      if (cartDeliverySlot.date instanceof Date) {
        date = cartDeliverySlot.date;
      } else if (cartDeliverySlot.date) {
        // Handle YYYY-MM-DD format (stored in localStorage)
        // Parse as local date to avoid timezone issues
        const dateStr = String(cartDeliverySlot.date);
        const dateParts = dateStr.split('-');
        if (dateParts.length === 3) {
          const year = parseInt(dateParts[0], 10);
          const month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed
          const day = parseInt(dateParts[2], 10);
          if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
            date = new Date(year, month, day);
          } else {
            // Fallback to standard parsing
            date = new Date(cartDeliverySlot.date);
          }
        } else {
          // Fallback to standard parsing for other formats
          date = new Date(cartDeliverySlot.date);
        }
      }
      
      const slotData = {
        date: date,
        slot: cartDeliverySlot.slot,
        time: cartDeliverySlot.time || (cartDeliverySlot.slot?.startTime && cartDeliverySlot.slot?.endTime 
          ? `${formatTime(cartDeliverySlot.slot.startTime)} - ${formatTime(cartDeliverySlot.slot.endTime)}`
          : cartDeliverySlot.slot?.startTime),
        pinCode: currentPinCode,
        slotId: cartDeliverySlot.slotId || cartDeliverySlot.slot?.id
      };
      
      setSelectedSlot(slotData);
      setFormData(prev => ({
        ...prev,
        deliveryDate: date ? date.toISOString().split('T')[0] : '',
        deliveryTime: slotData.time || ''
      }));
      
      hasInitializedSlot.current = true;
    }
    // Only depend on cartDeliverySlot and currentPinCode to avoid re-initialization
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartDeliverySlot, currentPinCode]);

  // Auto-update expired delivery slots when checkout page loads
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
        
      // Small delay to ensure everything is loaded
        autoUpdateTimerRef.current = setTimeout(() => {
        autoUpdateExpiredSlots().then(() => {
          // After auto-update, refresh the cart delivery slot
          const updatedCartSlot = getCartDeliverySlot();
          if (updatedCartSlot && !selectedSlot) {
            // Re-initialize selectedSlot with updated slot
            const date = updatedCartSlot.date instanceof Date 
              ? updatedCartSlot.date 
              : updatedCartSlot.date 
                ? (() => {
                    const dateStr = String(updatedCartSlot.date);
                    const dateParts = dateStr.split('-');
                    if (dateParts.length === 3) {
                      const year = parseInt(dateParts[0], 10);
                      const month = parseInt(dateParts[1], 10) - 1;
                      const day = parseInt(dateParts[2], 10);
                      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
                        return new Date(year, month, day);
                      }
                    }
                    return new Date(updatedCartSlot.date);
                  })()
                : null;
            
            const slotData = {
              date: date,
              slot: updatedCartSlot.slot,
              time: updatedCartSlot.time || (updatedCartSlot.slot?.startTime && updatedCartSlot.slot?.endTime 
                ? `${formatTime(updatedCartSlot.slot.startTime)} - ${formatTime(updatedCartSlot.slot.endTime)}`
                : updatedCartSlot.slot?.startTime),
              pinCode: currentPinCode,
              slotId: updatedCartSlot.slotId || updatedCartSlot.slot?.id
            };
            
            setSelectedSlot(slotData);
            setFormData(prev => ({
              ...prev,
              deliveryDate: date ? date.toISOString().split('T')[0] : '',
              deliveryTime: slotData.time || ''
            }));
          } else if (!updatedCartSlot && selectedSlot) {
            // If slot is expired and couldn't be updated, clear selectedSlot
            setSelectedSlot(null);
            setFormData(prev => ({
              ...prev,
              deliveryDate: '',
              deliveryTime: ''
            }));
          }
        }).catch(error => {
          console.error('Error auto-updating expired slots on checkout:', error);
            // Reset flag on error so it can retry if needed
            hasRunAutoUpdateRef.current = false;
            window.__slotUpdateInProgress = false;
          }).finally(() => {
            // Clear the progress flag after a delay
            setTimeout(() => {
              window.__slotUpdateInProgress = false;
            }, 2000);
        });
      }, 1500);
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
  }, [isInitialized, cartItems.length, autoUpdateExpiredSlots, selectedSlot, currentPinCode]);

  const deliveryCharge = deliveryInfo?.deliveryCharge || 0;
  const subtotal = cartSummary.totalPrice;
  const promoDiscount = appliedPromo?.discount || 0;
  const finalDeliveryCharge = subtotal >= freeDeliveryThreshold ? 0 : deliveryCharge;
  
  // Calculate wallet discount (max 10% of order total including delivery charge)
  // Backend calculates: maxWalletUsage = (subtotal - promoDiscount + deliveryCharge) * 0.1
  // So we need to match that calculation on the frontend
  const orderTotalBeforeWallet = Math.max(0, subtotal - promoDiscount + finalDeliveryCharge);
  const maxWalletDiscount = orderTotalBeforeWallet * 0.1; // 10% of order total (including delivery)
  const walletDiscount = applyWalletDiscount && walletBalance > 0 
    ? Math.min(walletBalance, maxWalletDiscount)
    : 0;
  
  const total = Math.max(0, orderTotalBeforeWallet - walletDiscount);

  // Load and validate promo from localStorage
  // Cart page is the source of truth - only use promos from applied_promo localStorage
  useEffect(() => {
    const savedPromo = localStorage.getItem('applied_promo');
    if (savedPromo) {
      try {
        const promoData = JSON.parse(savedPromo);
        const promoDiscount = promoData?.discount || 0;
        
        // Validate: only set promo if discount > 0 and code exists
        if (promoDiscount > 0 && promoData?.code) {
          setAppliedPromo(promoData);
        } else {
          // Clear invalid/stale promo from localStorage
          localStorage.removeItem('applied_promo');
          setAppliedPromo(null);
          
          // Also clear from checkout_form_progress if it exists
          try {
            const savedFormData = localStorage.getItem('checkout_form_progress');
            if (savedFormData) {
              const parsed = JSON.parse(savedFormData);
              if (parsed.appliedPromo) {
                const cleanedData = { ...parsed, appliedPromo: null };
                localStorage.setItem('checkout_form_progress', JSON.stringify(cleanedData));
              }
            }
          } catch (err) {
            // Ignore errors when cleaning checkout_form_progress
          }
        }
      } catch (err) {
        console.error('Error loading saved promo:', err);
        // Clear corrupted promo data
        localStorage.removeItem('applied_promo');
        setAppliedPromo(null);
        
        // Also clear from checkout_form_progress
        try {
          const savedFormData = localStorage.getItem('checkout_form_progress');
          if (savedFormData) {
            const parsed = JSON.parse(savedFormData);
            if (parsed.appliedPromo) {
              const cleanedData = { ...parsed, appliedPromo: null };
              localStorage.setItem('checkout_form_progress', JSON.stringify(cleanedData));
            }
          }
        } catch (cleanErr) {
          // Ignore errors when cleaning checkout_form_progress
        }
      }
    } else {
      // If no promo in applied_promo, ensure it's cleared from state and checkout_form_progress
      setAppliedPromo(null);
      
      // Clear any stale promo from checkout_form_progress to stay in sync
      try {
        const savedFormData = localStorage.getItem('checkout_form_progress');
        if (savedFormData) {
          const parsed = JSON.parse(savedFormData);
          if (parsed.appliedPromo) {
            const cleanedData = { ...parsed, appliedPromo: null };
            localStorage.setItem('checkout_form_progress', JSON.stringify(cleanedData));
          }
        }
      } catch (err) {
        // Ignore errors when cleaning checkout_form_progress
      }
    }
  }, []);

  // Sync promo state with localStorage on every render
  // If applied_promo is removed from localStorage (e.g., user removed it in Cart),
  // clear it from state immediately
  useEffect(() => {
    const savedPromo = localStorage.getItem('applied_promo');
    
    if (!savedPromo) {
      // No promo in localStorage - ensure state is cleared
      if (appliedPromo) {
        setAppliedPromo(null);
      }
      
      // Also clear from checkout_form_progress to stay in sync
      try {
        const savedFormData = localStorage.getItem('checkout_form_progress');
        if (savedFormData) {
          const parsed = JSON.parse(savedFormData);
          if (parsed.appliedPromo) {
            const cleanedData = { ...parsed, appliedPromo: null };
            localStorage.setItem('checkout_form_progress', JSON.stringify(cleanedData));
          }
        }
      } catch (err) {
        // Ignore errors
      }
    } else {
      // Validate the saved promo
      try {
        const promoData = JSON.parse(savedPromo);
        const promoDiscount = promoData?.discount || 0;
        
        if (promoDiscount <= 0 || !promoData?.code) {
          // Invalid promo in localStorage, clear everything
          localStorage.removeItem('applied_promo');
          setAppliedPromo(null);
          
          // Also clear from checkout_form_progress
          try {
            const savedFormData = localStorage.getItem('checkout_form_progress');
            if (savedFormData) {
              const parsed = JSON.parse(savedFormData);
              if (parsed.appliedPromo) {
                const cleanedData = { ...parsed, appliedPromo: null };
                localStorage.setItem('checkout_form_progress', JSON.stringify(cleanedData));
              }
            }
          } catch (cleanErr) {
            // Ignore errors
          }
        } else if (!appliedPromo || appliedPromo.code !== promoData.code || appliedPromo.discount !== promoData.discount) {
          // Promo in localStorage doesn't match state (or state is null) - update state
          setAppliedPromo(promoData);
        }
      } catch (err) {
        // Corrupted data, clear everything
        localStorage.removeItem('applied_promo');
        setAppliedPromo(null);
      }
    }
  }, [appliedPromo]);

  // Redirect if cart is empty
  useEffect(() => {
    if (cartItems.length === 0 && !loading) {
      router.push('/cart');
    }
  }, [cartItems, router, loading]);

  // Track when error is shown and check if form is complete
  useEffect(() => {
    if (error) {
      setErrorWasShown(true);
      setShowSuccessIndicator(false);
      
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        // Try to scroll to the error alert
        const errorAlert = document.querySelector('[data-error-alert]');
        if (errorAlert) {
          errorAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          // Fallback: scroll to Place Order button
          const placeOrderButton = document.querySelector('[data-place-order-button]');
          if (placeOrderButton) {
            placeOrderButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 100);
      return;
    }
    
    // Check if all requirements are met (both in normal cases and after error resolution)
    const currentSlot = selectedSlot || cartDeliverySlot;
    const hasSlot = !!currentSlot;
    const hasName = formData.name.trim().length > 0;
    const hasEmail = formData.email.trim().length > 0 && formData.email.includes('@');
    const hasPhone = formData.phone.trim().length >= 10;
    const hasStreet = formData.address.street.trim().length > 0;
    const hasCity = formData.address.city.trim().length > 0;
    const hasState = formData.address.state.trim().length > 0;
    const hasZip = formData.address.zip_code.trim().length === 6;
    
    const allRequirementsMet = hasSlot && hasName && hasEmail && hasPhone && hasStreet && hasCity && hasState && hasZip;
    
    // If all requirements are met and no error, show success indicator
    if (allRequirementsMet && !showSuccessIndicator) {
      setShowSuccessIndicator(true);
      // Hide indicator after 3 seconds
      const timer = setTimeout(() => {
        setShowSuccessIndicator(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    } else if (!allRequirementsMet && showSuccessIndicator) {
      // If requirements are not met, hide indicator
      setShowSuccessIndicator(false);
    }
  }, [error, selectedSlot, cartDeliverySlot, formData.name, formData.email, formData.phone, formData.address.street, formData.address.city, formData.address.state, formData.address.zip_code, showSuccessIndicator]);

  // Calculate address completeness score (0-100)
  const calculateAddressScore = (street) => {
    if (!street || street.trim().length === 0) return 0;
    
    const address = street.toLowerCase().trim();
    let score = 0;
    
    // Check for house/flat number (contains numbers) - 25 points
    if (/\d/.test(address)) {
      score += 25;
    }
    
    // Check for multiple words (building/area details) - 25 points
    const wordCount = address.split(/\s+/).filter(w => w.length > 2).length;
    if (wordCount >= 4) {
      score += 25;
    } else if (wordCount >= 3) {
      score += 15;
    } else if (wordCount >= 2) {
      score += 10;
    }
    
    // Check for street/road keywords - 25 points
    const streetKeywords = ['street', 'road', 'lane', 'avenue', 'nagar', 'colony', 'society', 'apartment', 'flat', 'house', 'building', 'tower', 'complex'];
    if (streetKeywords.some(keyword => address.includes(keyword))) {
      score += 25;
    }
    
    // Check length - 25 points
    if (address.length >= 40) {
      score += 25;
    } else if (address.length >= 25) {
      score += 20;
    } else if (address.length >= 15) {
      score += 10;
    }
    
    return Math.min(100, score);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Clear error when user starts fixing form fields
    if (error && (
      error.includes('name') || error.includes('email') || error.includes('phone') || 
      error.includes('address') || error.includes('city') || error.includes('state') || 
      error.includes('PIN') || error.includes('pincode')
    )) {
      setError('');
    }
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => {
        const updatedAddress = {
          ...prev.address,
          [addressField]: value
        };
        
        // Calculate address score when street address changes
        if (addressField === 'street') {
          const score = calculateAddressScore(value);
          setAddressScore(score);
        }
        
        return {
          ...prev,
          address: updatedAddress
        };
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Reverse geocode coordinates to get city/locality name
  const reverseGeocode = async (lat, lng) => {
    try {
      // Using OpenStreetMap Nominatim API (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'CreamingoDeliveryApp/1.0' // Required by Nominatim
          }
        }
      );

      if (!response.ok) {
        throw new Error('Reverse geocoding failed');
      }

      const data = await response.json();
      
      // Extract city/locality from address components
      const address = data.address || {};
      const locality = address.locality || address.suburb || address.neighbourhood || address.village;
      const city = address.city || address.town || address.county;
      const state = address.state;
      
      // Build location name: prefer locality, then city, then state
      let locationName = '';
      if (locality) {
        locationName = locality;
        if (city && city !== locality) {
          locationName += `, ${city}`;
        }
      } else if (city) {
        locationName = city;
      } else if (state) {
        locationName = state;
      }
      
      return locationName || null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  };

  // Let user share their precise location (using free browser geolocation API)
  const handleUseMyLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setError('Location services are not available in this browser. Please enter your address manually.');
      return;
    }

    setIsFetchingLocation(true);
    setLocationName(null);
    setLocationAccuracy(null);
    setLocationWarning(null);
    setError(''); // Clear any previous errors

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords || {};

        // Safeguard: only update if we received valid coordinates
        if (typeof latitude === 'number' && typeof longitude === 'number') {
          // Validate and check accuracy
          let accuracyInMeters = typeof accuracy === 'number' ? accuracy : null;
          
          // Validate accuracy - reject obviously invalid values (>100km is clearly wrong)
          // Typical accuracy ranges: GPS (5-10m), WiFi/cell (100-1000m), IP-based (1000-50000m)
          if (accuracyInMeters && (accuracyInMeters > 100000 || accuracyInMeters < 0)) {
            // Invalid accuracy value - ignore it
            accuracyInMeters = null;
            console.warn('Invalid accuracy value received:', accuracy);
          }
          
          setLocationAccuracy(accuracyInMeters);
          
          // Show warning (not error) if accuracy is poor but valid
          if (accuracyInMeters && accuracyInMeters > 1000 && accuracyInMeters <= 100000) {
            const accuracyKm = (accuracyInMeters / 1000).toFixed(1);
            setLocationWarning(`Location accuracy is approximately ${accuracyKm} km. The detected location may not be precise. Please verify the address below.`);
          } else if (accuracyInMeters === null) {
            setLocationWarning('Location accuracy information is unavailable. Please verify the detected location is correct.');
          } else {
            setLocationWarning(null); // Clear warning if accuracy is good
          }

          // Reverse geocode to get city/locality name (with delay to respect rate limits)
          const locationNameResult = await reverseGeocode(latitude, longitude);
          setLocationName(locationNameResult);

          setFormData((prev) => ({
            ...prev,
            address: {
              ...prev.address,
              location: {
                lat: latitude,
                lng: longitude,
                accuracy: accuracyInMeters,
                source: 'browser_geolocation',
                name: locationNameResult || null // Store the name for persistence
              }
            }
          }));
        }

        setIsFetchingLocation(false);
      },
      (geoError) => {
        console.error('Error fetching location:', geoError);
        setIsFetchingLocation(false);
        setLocationName(null);
        setLocationAccuracy(null);
        setLocationWarning(null);
        
        let errorMessage = 'Unable to detect your location. ';
        if (geoError.code === geoError.PERMISSION_DENIED) {
          errorMessage += 'Please allow location access in your browser settings.';
        } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
          errorMessage += 'Location information is unavailable. Please enter the address manually.';
        } else if (geoError.code === geoError.TIMEOUT) {
          errorMessage += 'Location request timed out. Please try again or enter the address manually.';
        } else {
          errorMessage += 'Please check permission settings or enter the address manually.';
        }
        setError(errorMessage);
      },
      {
        enableHighAccuracy: true, // Request GPS if available
        timeout: 20000, // Increased timeout to allow GPS to get fix
        maximumAge: 0 // Force fresh location - don't use cached data
      }
    );
  };

  const handleSlotSelect = (slot) => {
    // Clear any existing error messages when selecting a new slot
    setError('');
    
    // Normalize the date to ensure proper formatting
    const normalizedDate = slot.date instanceof Date 
      ? slot.date 
      : slot.date 
        ? new Date(slot.date) 
        : null;
    
    const normalizedSlot = {
      ...slot,
      date: normalizedDate
    };
    
    // Verify the selected slot is not expired before setting it
    const expirationStatus = getSlotExpirationStatus(normalizedSlot);
    if (expirationStatus === 'expired') {
      // Slot is expired, don't set it and show error
      setError('The selected delivery slot has expired. Please choose a different slot.');
      setShowSlotSelector(true); // Keep selector open
      return;
    }
    
    // Mark that slot was just selected (to prevent false expiration warnings)
    slotJustSelectedRef.current = true;
    
    // Check if this is a change (not initial selection)
    const isSlotChanged = selectedSlot && (
      selectedSlot.date?.toISOString() !== normalizedDate?.toISOString() ||
      selectedSlot.slotId !== slot.slotId ||
      selectedSlot.slot?.id !== slot.slot?.id
    );
    
    // Reset dismissed warning state when slot changes
    if (isSlotChanged) {
      setDismissExpiringSoonWarning(false);
    }
    
    // Set the new slot
    setSelectedSlot(normalizedSlot);
    
    // Reset expiration status tracking for the new slot
    previousExpirationStatusRef.current = expirationStatus;
    
    // Update form data with normalized date (as YYYY-MM-DD string for form input)
    const dateString = normalizedDate ? normalizedDate.toISOString().split('T')[0] : '';
    const timeString = slot.time || slot.slot?.startTime || '';
    
    setFormData(prev => ({
      ...prev,
      deliveryDate: dateString,
      deliveryTime: timeString
    }));
    
    // Show toast notification if slot was changed (not initial selection)
    // Also prevent showing notification if it was auto-updated (to avoid duplicate with CartContext notification)
    if (isSlotChanged && !window.__slotUpdateNotificationShown) {
      const formattedDate = formatDeliveryDate(normalizedDate);
      const formattedTime = formatTimeSlot(normalizedSlot);
      try {
      showSuccess(
        'Delivery Slot Updated',
        `Your delivery slot has been changed to ${formattedDate} • ${formattedTime}`
      );
      } catch (error) {
        // Silently handle toast errors (might be browser extension related)
        console.warn('Toast notification error:', error);
      }
    }
    
    // Hide slot selector after selection
    setShowSlotSelector(false);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Please enter your name');
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.phone.trim() || formData.phone.length < 10) {
      setError('Please enter a valid phone number');
      return false;
    }
    if (!formData.address.street.trim()) {
      setError('Please enter your street address');
      return false;
    }
    if (!formData.address.city.trim()) {
      setError('Please enter your city');
      return false;
    }
    if (!formData.address.state.trim()) {
      setError('Please enter your state');
      return false;
    }
    if (!formData.address.zip_code.trim() || formData.address.zip_code.length !== 6) {
      setError('Please enter a valid 6-digit PIN code');
      return false;
    }
    const currentSlot = selectedSlot || cartDeliverySlot;
    if (!currentSlot) {
      setError('Please select a delivery date and time slot to place your order.');
      setShowSlotSelector(true);
      return false;
    }
    
    // Check if selected slot is expired
    const expirationStatus = getSlotExpirationStatus(currentSlot);
    if (expirationStatus === 'expired') {
      setError('Your delivery slot has expired. Please select a new slot.');
      setShowSlotSelector(true); // Auto-open slot selector
      return false;
    }
    
    return true;
  };

  const handlePlaceOrder = async () => {
    setError('');

    if (!isAuthenticated) {
      setError('Please sign in or create an account to continue checkout.');
      scrollToAuthSection();
      return;
    }
    
    // Check if slot is selected first
    if (!selectedSlot && !cartDeliverySlot) {
      setError('Please select a delivery date and time slot to place your order.');
      setShowSlotSelector(true);
      return;
    }
    
    // Final validation before placing order
    if (!validateForm()) {
      return;
    }

    // Double-check slot expiration right before placing order (in case it expired during form filling)
    const currentSlot = selectedSlot || cartDeliverySlot;
    if (currentSlot) {
      const expirationStatus = getSlotExpirationStatus(currentSlot);
      if (expirationStatus === 'expired') {
        setError('Your delivery slot has expired. Please select a new slot before placing your order.');
        setShowSlotSelector(true);
        setSelectedSlot(null);
        setFormData(prev => ({
          ...prev,
          deliveryDate: '',
          deliveryTime: ''
        }));
        return;
      }
    }

    setLoading(true);

    try {
      // Use authenticated customer ID if available, otherwise create/find customer
      let customerId;
      
      if (isAuthenticated && customer?.id) {
        // Use authenticated customer ID
        customerId = customer.id;
        
        // Optionally update customer profile with latest info
        // (In a real app, you might want to update the customer's address if changed)
      } else {
        // Fallback: create or get customer (for guest checkout - though we require auth now)
        try {
          // Try to find existing customer
          const existingCustomer = await orderApi.getCustomer(formData.email, formData.phone);
          if (existingCustomer && existingCustomer.length > 0) {
            customerId = existingCustomer[0].id;
          } else {
            // Create new customer
            const newCustomer = await orderApi.createCustomer({
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
              address: formData.address
            });
            customerId = newCustomer.id;
          }
        } catch (err) {
          // If get fails, try create
          const newCustomer = await orderApi.createCustomer({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address
          });
          customerId = newCustomer.id;
        }
      }

      // Prepare order items
      const orderItems = cartItems.map(item => {
        // Use deal_price for deal items (₹1), otherwise use regular price
        const itemPrice = item.is_deal_item && item.deal_price 
          ? item.deal_price 
          : (item.variant?.discounted_price || item.product.discounted_price || item.product.base_price);
        
        // Get the flavor-specific product name if flavor is selected
        // This logic should match the flavor replacement logic in FlavorSelector
        let productName = item.product.name;
        if (item.flavor) {
          const flavorNames = [
            'Chocolate', 'Choco Truffle', 'Vanilla', 'Strawberry', 'Butterscotch',
            'Red Velvet', 'Black Forest', 'Pineapple', 'Mixed Fruit', 'Mixed Fruits', 'Blueberry'
          ];
          
          let updatedTitle = item.product.name;
          let foundExistingFlavor = false;
          
          // Find and replace existing flavor in title
          for (const flavor of flavorNames) {
            const regex = new RegExp(`\\b${flavor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
            if (regex.test(updatedTitle)) {
              if (flavor.toLowerCase() === item.flavor.name.toLowerCase()) {
                productName = item.product.name; // Same flavor, keep original
              } else {
                productName = updatedTitle.replace(regex, item.flavor.name);
                foundExistingFlavor = true;
              }
              break;
            }
          }
          
          // If no existing flavor found, add new flavor at the beginning
          if (!foundExistingFlavor) {
            productName = `${item.flavor.name} ${item.product.name}`;
          }
        }
        
        // Format combos for API - ensure add_on_product_id is included
        // Log combo structure for debugging
        if (item.combos && item.combos.length > 0) {
          console.log(`[Order] Item ${item.product.name} - Combo structure:`, JSON.stringify(item.combos, null, 2));
        }
        
        const formattedCombos = (item.combos || [])
          .map((combo, index) => {
            // Log each combo for debugging
            console.log(`[Order] Processing combo ${index + 1}:`, {
              combo: combo,
              has_product_id: !!combo.product_id,
              has_id: !!combo.id,
              has_add_on_product_id: !!combo.add_on_product_id,
              product_id_value: combo.product_id,
              id_value: combo.id,
              add_on_product_id_value: combo.add_on_product_id
            });
            
            // Use add_on_product_id as the source of truth (database field from combo_selections table)
            // This is the correct field name - must be present
            if (!combo.add_on_product_id) {
              console.error(`[Order] Combo ${index + 1} missing add_on_product_id (required database field). Combo object:`, JSON.stringify(combo, null, 2));
              return null;
            }
            
            const productId = combo.add_on_product_id;
            
            // Convert to number and validate
            const numericProductId = Number(productId);
            if (isNaN(numericProductId) || numericProductId <= 0) {
              console.error(`[Order] Combo ${index + 1} has invalid product_id (${productId} -> ${numericProductId}):`, combo);
              return null;
            }
            
            // Validate quantity
            const quantity = Number(combo.quantity || 1);
            if (isNaN(quantity) || quantity <= 0) {
              console.error(`[Order] Combo ${index + 1} has invalid quantity (${combo.quantity} -> ${quantity}):`, combo);
              return null;
            }
            
            // Validate price
            const price = Number(combo.discounted_price || combo.price || 0);
            if (isNaN(price) || price < 0) {
              console.error(`[Order] Combo ${index + 1} has invalid price (${combo.discounted_price || combo.price} -> ${price}):`, combo);
              return null;
            }
            
            const formatted = {
              add_on_product_id: numericProductId,
              quantity: quantity,
              price: price
            };
            
            console.log(`[Order] Combo ${index + 1} formatted successfully:`, formatted);
            return formatted;
          })
          .filter(combo => combo !== null); // Remove any null entries
        
        // Log final formatted combos
        if (formattedCombos.length > 0) {
          console.log(`[Order] Item ${item.product.name} - Final formatted combos:`, JSON.stringify(formattedCombos, null, 2));
        } else if (item.combos && item.combos.length > 0) {
          console.warn(`[Order] Item ${item.product.name} - All combos were filtered out! Original combos:`, item.combos);
        }
        
        return {
          product_id: item.product.id,
          variant_id: item.variant?.id || null,
          quantity: item.quantity,
          price: itemPrice,
          flavor_id: item.flavor?.id || null,
          tier: item.tier || null,
          cake_message: item.cakeMessage || null,
          product_name: productName, // Include flavor-specific product name
          cart_item_id: item.id,
          combos: formattedCombos
        };
      });

      // Use selectedSlot for delivery date and time, fallback to formData
      const deliveryDateToUse = selectedSlot?.date 
        ? (selectedSlot.date instanceof Date 
            ? selectedSlot.date.toISOString().split('T')[0] 
            : selectedSlot.date)
        : formData.deliveryDate;
      
      const deliveryTimeToUse = selectedSlot?.time 
        || selectedSlot?.slot?.startTime 
        || formData.deliveryTime;

      // Calculate order summary for logging
      // Use the same calculations as displayed on the page
      const orderSubtotal = subtotal; // cartSummary.totalPrice (includes combos)
      const orderPromoDiscount = promoDiscount; // appliedPromo?.discount || 0
      const orderDeliveryCharge = finalDeliveryCharge;
      
      // Recalculate wallet limit exactly as backend does to ensure match
      // Backend calculates: maxWalletUsage = (subtotal - promoDiscount + deliveryCharge) * 0.1
      // Backend uses toFixed(2) which rounds, so we need to match that exactly
      const backendOrderTotal = orderSubtotal - orderPromoDiscount + orderDeliveryCharge;
      const backendMaxWalletUsage = backendOrderTotal * 0.1;
      
      // Round to 2 decimal places to match backend precision (toFixed(2) rounds)
      // Use parseFloat(toFixed(2)) equivalent: round to nearest cent
      const roundedBackendMax = parseFloat(backendMaxWalletUsage.toFixed(2));
      
      // Ensure wallet discount doesn't exceed backend limit
      let orderWalletUsed = 0;
      if (applyWalletDiscount && walletDiscount > 0) {
        // Use the minimum of: calculated wallet discount, wallet balance, and backend max
        orderWalletUsed = Math.min(walletDiscount, walletBalance, roundedBackendMax);
        // Round to 2 decimal places to match backend
        orderWalletUsed = parseFloat(orderWalletUsed.toFixed(2));
        
        // Final validation - ensure it doesn't exceed (shouldn't happen, but safety check)
        if (orderWalletUsed > roundedBackendMax) {
          orderWalletUsed = roundedBackendMax;
        }
      }
      
      // Log for debugging
      if (applyWalletDiscount && orderWalletUsed > 0) {
        console.log('[Order] Wallet validation:', {
          originalWalletDiscount: walletDiscount,
          walletBalance,
          backendOrderTotal,
          backendMaxWalletUsage: roundedBackendMax,
          finalWalletUsed: orderWalletUsed
        });
      }
      
      const orderTotal = total; // Final total after all discounts
      
      // Calculate total item count (parent products only) and combo count separately
      const totalItemCount = cartItems.reduce((count, item) => {
        return count + (item.quantity || 0);
      }, 0);
      
      const totalComboCount = cartItems.reduce((count, item) => {
        const comboCount = (item.combos || []).reduce((sum, combo) => sum + (combo.quantity || 0), 0);
        return count + comboCount;
      }, 0);

      // Get banner ID from sessionStorage for conversion tracking (tracked separately, not in order)
      const lastClickedBannerId = sessionStorage.getItem('last_clicked_banner_id');
      
      // Create order
      const orderData = {
        customer_id: customerId,
        items: orderItems,
        delivery_address: formData.address,
        delivery_date: deliveryDateToUse,
        delivery_time: deliveryTimeToUse,
        special_instructions: formData.specialInstructions || null,
        payment_method: formData.paymentMethod,
        wallet_amount_used: orderWalletUsed,
        // Add complete order details for logging
        subtotal: orderSubtotal,
        promo_code: appliedPromo?.code || null,
        promo_discount: orderPromoDiscount,
        delivery_charge: orderDeliveryCharge,
        item_count: totalItemCount,
        combo_count: totalComboCount,
        // Add banner ID for conversion tracking (optional)
        banner_id: lastClickedBannerId ? parseInt(lastClickedBannerId) : null
      };

      // Log order data for debugging
      console.log('[Order] Complete order data being sent:', JSON.stringify(orderData, null, 2));
      
      // Validate order data before sending
      const validationErrors = [];
      orderData.items.forEach((item, itemIndex) => {
        if (!item.product_id) {
          validationErrors.push(`Item ${itemIndex + 1}: Missing product_id`);
        }
        if (item.combos && item.combos.length > 0) {
          item.combos.forEach((combo, comboIndex) => {
            if (!combo.add_on_product_id || isNaN(combo.add_on_product_id) || combo.add_on_product_id <= 0) {
              validationErrors.push(`Item ${itemIndex + 1}, Combo ${comboIndex + 1}: Invalid add_on_product_id (${combo.add_on_product_id})`);
            }
            if (!combo.quantity || isNaN(combo.quantity) || combo.quantity <= 0) {
              validationErrors.push(`Item ${itemIndex + 1}, Combo ${comboIndex + 1}: Invalid quantity (${combo.quantity})`);
            }
            if (isNaN(combo.price) || combo.price < 0) {
              validationErrors.push(`Item ${itemIndex + 1}, Combo ${comboIndex + 1}: Invalid price (${combo.price})`);
            }
          });
        }
      });
      
      if (validationErrors.length > 0) {
        console.error('[Order] Validation errors found:', validationErrors);
        throw new Error(`Order validation failed: ${validationErrors.join('; ')}`);
      }
      
      console.log('[Order] Order data validation passed');

      const orderResponse = await orderApi.createOrder(orderData);

      if (orderResponse.success) {
        // Set redirecting flag to prevent showing empty cart message
        setIsRedirecting(true);
        
        // Save address to localStorage for future use
        saveLastUsedAddress(formData.address);
        
        // Clear saved form progress
        clearSavedFormProgress();
        
        // Clear cart and promo without showing toast notifications
        const itemCount = cartItems.length;
        clearCart(true); // Suppress toast notifications
        localStorage.removeItem('applied_promo');
        
        // Clear global combo selections from localStorage
        // This ensures combo selections don't persist after order is placed
        try {
          // Clear global combo selections (new approach)
          localStorage.removeItem('global_combo_selections');
          
          // Also clear any old product-specific combo selections for backward compatibility
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('combo_selections_')) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => localStorage.removeItem(key));
          
          if (keysToRemove.length > 0 || localStorage.getItem('global_combo_selections')) {
            console.log(`[Order] Cleared global combo selections and ${keysToRemove.length} legacy combo selection(s) from localStorage`);
          }
        } catch (err) {
          console.error('[Order] Error clearing combo selections from localStorage:', err);
          // Don't throw - this is a cleanup operation, shouldn't block order success
        }
        
        // Show success toast and redirect immediately
        showSuccess(
          'Order Placed Successfully!',
          `${itemCount} item(s) removed from cart. Your order is being processed.`
        );
        
        // Redirect immediately to success page with scratch card info
        const scratchCardId = orderResponse.data.scratchCard?.id;
        const scratchCardAmount = orderResponse.data.scratchCard?.amount;
        const queryParams = new URLSearchParams({
          orderNumber: orderResponse.data.order.order_number,
          ...(scratchCardId && { scratchCardId: scratchCardId.toString() }),
          ...(scratchCardAmount && { 
            scratchCardAmount: scratchCardAmount.toString(),
            earned: scratchCardAmount.toString() // Pass as earned amount
          })
        });
        // Clear navigation flag before redirecting to success page
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('navigated_from_cart');
        }
        router.push(`/order-success?${queryParams.toString()}`);
      } else {
        throw new Error(orderResponse.message || 'Failed to create order');
      }
    } catch (err) {
      console.error('[Order] Order creation error:', err);
      console.error('[Order] Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      
      // Extract more detailed error message
      let errorMessage = err.message || 'Failed to place order. Please try again.';
      
      // Handle wallet limit error specifically
      if (errorMessage.includes('Wallet usage exceeds limit')) {
        // Extract the maximum allowed amount from error message
        const maxMatch = errorMessage.match(/₹([\d.]+)/);
        if (maxMatch) {
          const maxAllowed = parseFloat(maxMatch[1]);
          // Automatically adjust wallet discount and retry
          const backendOrderTotal = orderSubtotal - orderPromoDiscount + orderDeliveryCharge;
          const backendMaxWalletUsage = Math.round(backendOrderTotal * 0.1 * 100) / 100;
          
          // Update wallet discount to match backend limit
          const adjustedWallet = Math.min(walletBalance, backendMaxWalletUsage);
          
          if (adjustedWallet > 0 && adjustedWallet < orderWalletUsed) {
            // Retry with adjusted wallet amount
            console.log(`[Order] Retrying with adjusted wallet amount: ${adjustedWallet} (was ${orderWalletUsed})`);
            orderData.wallet_amount_used = adjustedWallet;
            
            try {
              const retryResponse = await orderApi.createOrder(orderData);
              if (retryResponse.success) {
                // Success with adjusted amount - continue with success flow
                setIsRedirecting(true);
                saveLastUsedAddress(formData.address);
                clearSavedFormProgress();
                const itemCount = cartItems.length;
                clearCart(true);
                localStorage.removeItem('applied_promo');
                
                showSuccess(
                  'Order Placed Successfully!',
                  `Wallet discount adjusted to ${formatPrice(adjustedWallet)}. ${itemCount} item(s) removed from cart.`
                );
                
                const scratchCardId = retryResponse.data.scratchCard?.id;
                const scratchCardAmount = retryResponse.data.scratchCard?.amount;
                const queryParams = new URLSearchParams({
                  orderNumber: retryResponse.data.order.order_number,
                  ...(scratchCardId && { scratchCardId: scratchCardId.toString() }),
                  ...(scratchCardAmount && { 
                    scratchCardAmount: scratchCardAmount.toString(),
                    earned: scratchCardAmount.toString()
                  })
                });
                // Clear navigation flag before redirecting to success page
                if (typeof window !== 'undefined') {
                  sessionStorage.removeItem('navigated_from_cart');
                }
                router.push(`/order-success?${queryParams.toString()}`);
                return;
              }
            } catch (retryError) {
              console.error('[Order] Retry failed:', retryError);
              errorMessage = `Wallet discount adjusted to ${formatPrice(adjustedWallet)}, but order still failed. Please try again.`;
            }
          } else {
            errorMessage = `Wallet usage limit: Maximum ${formatPrice(backendMaxWalletUsage)} (10% of order total). Please adjust your wallet usage.`;
          }
        }
      } else if (errorMessage.includes('validation')) {
        errorMessage = errorMessage;
      } else if (errorMessage.includes('Internal server error')) {
        errorMessage = 'Server error occurred. Please check the console for details and try again.';
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  // Don't show empty cart message if we're redirecting after successful order
  if (cartItems.length === 0 && !isRedirecting) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
          <div className="text-center">
            <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Add items to your cart before checkout</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-pink-600 dark:bg-pink-700 text-white rounded-lg hover:bg-pink-700 dark:hover:bg-pink-600 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
        {/* Footer: Hidden visually for better UX, but kept in DOM for SEO */}
        <div className="hidden">
        <Footer />
        </div>
      </div>
    );
  }

  // Show loading/redirecting state while redirecting
  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
          <div className="text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-pink-600 dark:text-pink-400 animate-spin" />
            <p className="text-gray-600 dark:text-gray-400">Redirecting to order confirmation...</p>
          </div>
        </div>
        {/* Footer: Hidden visually for better UX, but kept in DOM for SEO */}
        <div className="hidden">
        <Footer />
        </div>
      </div>
    );
  }

  // Remove the intermediate success state - redirect immediately instead
  // This prevents showing the cart page briefly

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 pb-24 lg:pb-8">
        {/* Page Header */}
        <div className="mb-4 sm:mb-6">
          <button
            onClick={() => router.push('/cart')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors mb-3 sm:mb-4"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base font-medium">Back to Cart</span>
          </button>
          
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Checkout</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1">Complete your order details</p>
        </div>

        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 sm:gap-3">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-sm sm:text-base text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Delivery Slot Warning Banner - Prominent warning for expired/expiring slots */}
        {isClient && (selectedSlot || cartDeliverySlot) && !showSlotSelector && (() => {
          const currentSlot = selectedSlot || cartDeliverySlot;
          if (!currentSlot) return null;
          
          const expirationStatus = getSlotExpirationStatus(currentSlot);
          const isExpired = expirationStatus === 'expired';
          const isExpiringSoon = expirationStatus === 'expiring_soon';
          
          // Debug: Log expiration status (can be removed in production)
          if (process.env.NODE_ENV === 'development') {
            console.log('Slot expiration status:', {
              expirationStatus,
              slotDate: currentSlot.date,
              slotTime: currentSlot.time || currentSlot.slot?.startTime,
              countdown
            });
          }
          
          if (isExpired) {
            return (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-800 rounded-lg animate-pulse">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm sm:text-base font-bold text-red-800 dark:text-red-300 mb-1">
                      ⚠️ Delivery Slot Expired
                    </h3>
                    <p className="text-xs sm:text-sm text-red-700 dark:text-red-400 mb-2">
                      Your selected delivery slot has expired. Please select a new slot to continue with your order.
                    </p>
                    <button
                      onClick={() => setShowSlotSelector(true)}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors font-medium"
                    >
                      Select New Slot
                    </button>
                  </div>
                </div>
              </div>
            );
          } else if (isExpiringSoon && !dismissExpiringSoonWarning) {
            return (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-800 rounded-lg relative">
                <button
                  onClick={() => setDismissExpiringSoonWarning(true)}
                  className="absolute top-2 right-2 sm:top-3 sm:right-3 p-1 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded-full transition-colors"
                  aria-label="Close warning"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <div className="flex items-start gap-3 pr-6 sm:pr-8">
                  <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm sm:text-base font-bold text-yellow-800 dark:text-yellow-300 mb-1">
                      ⏰ Delivery Slot Expiring Soon
                    </h3>
                    <p className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-400 mb-2">
                      {countdown 
                        ? `Your delivery slot expires in ${countdown.hours} hour${countdown.hours !== 1 ? 's' : ''} ${countdown.minutes} minute${countdown.minutes !== 1 ? 's' : ''}. Please complete your order soon or select a new slot.`
                        : 'Your delivery slot is expiring soon. Please complete your order quickly or select a new slot.'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setShowSlotSelector(true)}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border border-yellow-600 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors font-medium"
                      >
                        Change Slot
                      </button>
                      <button
                        onClick={handlePlaceOrder}
                        disabled={loading || !selectedSlot || !isAuthenticated}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-yellow-600 dark:bg-yellow-700 text-white rounded-lg hover:bg-yellow-700 dark:hover:bg-yellow-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Complete Order Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })()}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4 sm:gap-6 lg:gap-8">
          {/* LEFT SECTION: Form */}
          <div className="space-y-4 sm:space-y-6">
            {!isAuthenticated && (
              <div
                id="checkoutAuth"
                ref={authSectionRef}
                className="bg-white dark:bg-gray-800 rounded-xl border-l-4 border-pink-500 dark:border-pink-400 border border-gray-200 dark:border-gray-700 overflow-hidden scroll-mt-24"
              >
                <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/30">
                      <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600 dark:text-pink-400" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                        Sign in to place your order
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Use your email to continue. We will prompt you to sign in or create an account.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-3 sm:px-4 lg:px-6 pb-3 sm:pb-4 lg:pb-6">
                  {authError && (
                    <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs sm:text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <span>{authError}</span>
                    </div>
                  )}

                  {authStep === 'email' && (
                    <form onSubmit={handleCheckEmail} className="space-y-3 sm:space-y-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          required
                          className="w-full px-2.5 sm:px-4 py-1.5 sm:py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500 border-gray-300 dark:border-gray-600 focus:ring-pink-500 dark:focus:ring-pink-400"
                          placeholder="your@email.com"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-semibold bg-pink-600 dark:bg-pink-700 text-white rounded-lg hover:bg-pink-700 dark:hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {authLoading ? 'Checking...' : 'Continue'}
                      </button>
                    </form>
                  )}

                  {authStep === 'login' && (
                    <form onSubmit={handleLoginSubmit} className="space-y-3 sm:space-y-4">
                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        Account found for <span className="font-semibold text-gray-900 dark:text-gray-100">{authEmail}</span>
                        {emailCheckResult?.customer?.name ? ` • Welcome back, ${emailCheckResult.customer.name}` : ''}
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                          Password *
                        </label>
                        <div className="relative">
                          <input
                            type={showLoginPassword ? 'text' : 'password'}
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            required
                            className="w-full pr-10 px-2.5 sm:px-4 py-1.5 sm:py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500 border-gray-300 dark:border-gray-600 focus:ring-pink-500 dark:focus:ring-pink-400"
                            placeholder="Enter your password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowLoginPassword(prev => !prev)}
                            aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          >
                            {showLoginPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-semibold bg-pink-600 dark:bg-pink-700 text-white rounded-lg hover:bg-pink-700 dark:hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {authLoading ? 'Signing in...' : 'Sign in'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthStep('email');
                          setAuthError('');
                        }}
                        className="w-full text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                      >
                        Use a different email
                      </button>
                    </form>
                  )}

                  {authStep === 'signup' && (
                    <form onSubmit={handleSignupSubmit} className="space-y-3 sm:space-y-4">
                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        New account for <span className="font-semibold text-gray-900 dark:text-gray-100">{authEmail}</span>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          autoComplete="name"
                          value={signupData.name}
                          onChange={(e) => setSignupData(prev => ({ ...prev, name: e.target.value }))}
                          required
                          className="w-full px-2.5 sm:px-4 py-1.5 sm:py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500 border-gray-300 dark:border-gray-600 focus:ring-pink-500 dark:focus:ring-pink-400"
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                          Mobile Number
                        </label>
                        <input
                          type="tel"
                          autoComplete="tel"
                          value={signupData.phone}
                          onChange={(e) => setSignupData(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full px-2.5 sm:px-4 py-1.5 sm:py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500 border-gray-300 dark:border-gray-600 focus:ring-pink-500 dark:focus:ring-pink-400"
                          placeholder="Enter mobile number"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                            Password *
                          </label>
                          <div className="relative">
                            <input
                              type={showSignupPassword ? 'text' : 'password'}
                              autoComplete="new-password"
                              value={signupData.password}
                              onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                              required
                              className="w-full pr-10 px-2.5 sm:px-4 py-1.5 sm:py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500 border-gray-300 dark:border-gray-600 focus:ring-pink-500 dark:focus:ring-pink-400"
                              placeholder="Create a password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowSignupPassword(prev => !prev)}
                              aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                              {showSignupPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                            Confirm Password *
                          </label>
                          <div className="relative">
                            <input
                              type={showSignupConfirmPassword ? 'text' : 'password'}
                              autoComplete="new-password"
                              value={signupData.confirmPassword}
                              onChange={(e) => setSignupData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                              required
                              className="w-full pr-10 px-2.5 sm:px-4 py-1.5 sm:py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500 border-gray-300 dark:border-gray-600 focus:ring-pink-500 dark:focus:ring-pink-400"
                              placeholder="Confirm password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowSignupConfirmPassword(prev => !prev)}
                              aria-label={showSignupConfirmPassword ? 'Hide password' : 'Show password'}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                              {showSignupConfirmPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                          Referral Code (optional)
                        </label>
                        <input
                          type="text"
                          value={signupData.referralCode}
                          onChange={(e) => setSignupData(prev => ({ ...prev, referralCode: e.target.value }))}
                          className="w-full px-2.5 sm:px-4 py-1.5 sm:py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500 border-gray-300 dark:border-gray-600 focus:ring-pink-500 dark:focus:ring-pink-400"
                          placeholder="Enter referral code"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-semibold bg-pink-600 dark:bg-pink-700 text-white rounded-lg hover:bg-pink-700 dark:hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {authLoading ? 'Creating account...' : 'Create account'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthStep('email');
                          setAuthError('');
                        }}
                        className="w-full text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                      >
                        Use a different email
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}

            {isAuthenticated && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 sm:p-4 text-xs sm:text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                Signed in as <span className="font-semibold">{customer?.email || 'customer'}</span>
              </div>
            )}

            {/* Customer Information - Collapsible on Mobile */}
            {isAuthenticated && (
              <div id="customerInfo" className="bg-white dark:bg-gray-800 rounded-xl border-l-4 border-blue-500 dark:border-blue-400 border border-gray-200 dark:border-gray-700 overflow-hidden scroll-mt-24">
                {/* Header - Clickable on Mobile */}
                <button
                  onClick={() => toggleSection('customerInfo')}
                  className="w-full lg:pointer-events-none flex items-center justify-between p-3 sm:p-4 lg:p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors lg:hover:bg-transparent"
                >
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-blue-900 dark:text-blue-100">Customer Information</span>
                  </h2>
                  <ChevronDown className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 lg:hidden ${expandedSections.customerInfo ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Content - Collapsible on Mobile */}
                <div className={`px-3 sm:px-4 lg:px-6 pb-3 sm:pb-4 lg:pb-6 transition-all duration-300 lg:block ${expandedSections.customerInfo ? 'block' : 'hidden'}`}>
                  <div className="space-y-3 sm:space-y-4">
                  <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-2.5 sm:px-4 py-1.5 sm:py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
                      fieldErrors.name 
                        ? 'border-red-500 dark:border-red-500 focus:ring-red-500 dark:focus:ring-red-500' 
                        : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400'
                    }`}
                    placeholder="Enter your full name"
                  />
                  {fieldErrors.name && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {fieldErrors.name}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                      <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" />
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-2.5 sm:px-4 py-1.5 sm:py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
                        fieldErrors.email 
                          ? 'border-red-500 dark:border-red-500 focus:ring-red-500 dark:focus:ring-red-500' 
                          : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400'
                      }`}
                      placeholder="your@email.com"
                    />
                    {fieldErrors.email && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                      <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" />
                      Phone *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      maxLength={15}
                      className={`w-full px-2.5 sm:px-4 py-1.5 sm:py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
                        fieldErrors.phone 
                          ? 'border-red-500 dark:border-red-500 focus:ring-red-500 dark:focus:ring-red-500' 
                          : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400'
                      }`}
                      placeholder="10-digit phone number"
                    />
                    {fieldErrors.phone && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {fieldErrors.phone}
                      </p>
                    )}
                  </div>
                  </div>
                  </div>
                </div>
              </div>
            )}

            {/* Delivery Address - Collapsible on Mobile */}
            <div id="deliveryAddress" className="bg-white dark:bg-gray-800 rounded-xl border-l-4 border-green-500 dark:border-green-400 border border-gray-200 dark:border-gray-700 overflow-hidden scroll-mt-24">
              {/* Header - Clickable on Mobile */}
              <button
                onClick={() => toggleSection('deliveryAddress')}
                className="w-full lg:pointer-events-none flex items-center justify-between p-3 sm:p-4 lg:p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors lg:hover:bg-transparent"
              >
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-green-900 dark:text-green-100">Delivery Address</span>
              </h2>
                <ChevronDown className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 lg:hidden ${expandedSections.deliveryAddress ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Content - Collapsible on Mobile */}
              <div className={`px-3 sm:px-4 lg:px-6 pb-3 sm:pb-4 lg:pb-6 transition-all duration-300 lg:block ${expandedSections.deliveryAddress ? 'block' : 'hidden'}`}>
              <div className="space-y-3 sm:space-y-4">
              <div>
                  {/* Optional precise location capture for delivery */}
                  <div className="mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-gray-600 dark:text-gray-300">
                      <MapPin className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                      <span className="font-medium">Delivery location (optional)</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleUseMyLocation}
                      disabled={isFetchingLocation}
                      className={`group relative inline-flex items-center gap-2 text-xs sm:text-sm text-blue-700 dark:text-blue-300 font-semibold px-4 py-2 rounded-lg border-2 border-blue-400 dark:border-blue-600 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-800/30 hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-900/50 dark:hover:to-blue-800/40 hover:border-blue-500 dark:hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-blue-200/50 dark:hover:shadow-blue-900/30 active:scale-95 ${
                        isFetchingLocation ? 'grayscale-[0.3] backdrop-blur-[2px] pointer-events-none' : ''
                      }`}
                    >
                      {/* Overlay when fetching location */}
                      {isFetchingLocation && (
                        <div className="absolute inset-0 bg-white/30 dark:bg-gray-900/30 rounded-lg backdrop-blur-[1px] z-10"></div>
                      )}
                      {/* Subtle pulsing location indicator - only when not fetching */}
                      {!isFetchingLocation && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full animate-pulse opacity-80"></span>
                      )}
                      {/* GPS/Location icon with rotation when fetching */}
                      <div className={`relative ${isFetchingLocation ? 'animate-spin' : ''}`}>
                        <Navigation className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={2.5} />
                      </div>
                      {/* Map pin icon as secondary indicator */}
                      <MapPin className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" strokeWidth={2} />
                      <span className="relative z-10">
                        {isFetchingLocation ? (
                          <span className="flex items-center gap-1.5">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Detecting location…
                          </span>
                        ) : (
                          'Use my current location'
                        )}
                      </span>
                    </button>
                  </div>

                  {formData.address?.location && typeof formData.address.location.lat === 'number' && typeof formData.address.location.lng === 'number' && (
                    <div className="mb-1 space-y-1">
                      <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                        Location captured: {locationName ? `${locationName} ` : ''}({formData.address.location.lat.toFixed(4)}, {formData.address.location.lng.toFixed(4)}). Add street & landmark for accurate delivery.
                      </p>
                      {/* Location Warning (separate from error) */}
                      {locationWarning && (
                        <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                          <p className="text-[10px] sm:text-xs text-yellow-700 dark:text-yellow-300 flex items-start gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                            <span>{locationWarning}</span>
                          </p>
                        </div>
                      )}
                      {/* Accuracy indicator (only show if valid) */}
                      {locationAccuracy && locationAccuracy <= 100000 && (
                        <p className={`text-[10px] sm:text-xs flex items-center gap-1 ${
                          locationAccuracy <= 100 
                            ? 'text-green-600 dark:text-green-400' 
                            : locationAccuracy <= 500 
                              ? 'text-yellow-600 dark:text-yellow-400' 
                              : 'text-orange-600 dark:text-orange-400'
                        }`}>
                          <AlertCircle className="w-3 h-3" />
                          {locationAccuracy <= 100 
                            ? `High accuracy (~${Math.round(locationAccuracy)}m)` 
                            : locationAccuracy <= 500 
                              ? `Moderate accuracy (~${Math.round(locationAccuracy)}m) - Please verify address` 
                              : `Low accuracy (~${(locationAccuracy / 1000).toFixed(1)}km) - Location may be inaccurate, please verify and correct if needed`}
                        </p>
                      )}
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 italic">
                        💡 Tip: If the location seems incorrect, please manually enter your complete address below.
                      </p>
                    </div>
                  )}

                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" />
                    Street Address *
                  </label>
                  
                  <div className="relative">
                  <input
                    type="text"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleInputChange}
                    required
                      className={`w-full px-2.5 sm:px-4 py-1.5 sm:py-2 pr-10 text-sm border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all duration-300 ${
                      fieldErrors['address.street'] 
                        ? 'border-red-500 dark:border-red-500 focus:ring-red-500 dark:focus:ring-red-500' 
                          : formData.address.street && addressScore >= 75
                          ? 'border-green-400 dark:border-green-500 focus:ring-green-500 dark:focus:ring-green-400'
                          : formData.address.street && addressScore >= 50
                          ? 'border-yellow-400 dark:border-yellow-500 focus:ring-yellow-500 dark:focus:ring-yellow-400'
                        : 'border-gray-300 dark:border-gray-600 focus:ring-green-500 dark:focus:ring-green-400'
                    }`}
                      placeholder={formData.address.street ? "Add more details..." : "e.g., Flat 201, Green Valley Apartments, MG Road"}
                    />
                    {/* Checkmark icon when address is ≥75% complete */}
                    {formData.address.street && addressScore >= 75 && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400 animate-in fade-in duration-300" />
                      </div>
                    )}
                  </div>
                  
                  {fieldErrors['address.street'] && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {fieldErrors['address.street']}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                      Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      name="address.landmark"
                      value={formData.address.landmark}
                      onChange={handleInputChange}
                      className="w-full px-2.5 sm:px-4 py-1.5 sm:py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      placeholder="Nearby landmark or location (optional)"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-2.5 sm:px-4 py-1.5 sm:py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
                        fieldErrors['address.city'] 
                          ? 'border-red-500 dark:border-red-500 focus:ring-red-500 dark:focus:ring-red-500' 
                          : 'border-gray-300 dark:border-gray-600 focus:ring-green-500 dark:focus:ring-green-400'
                      }`}
                      placeholder="City"
                    />
                    {fieldErrors['address.city'] && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {fieldErrors['address.city']}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                      State *
                    </label>
                    <input
                      type="text"
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-2.5 sm:px-4 py-1.5 sm:py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
                        fieldErrors['address.state'] 
                          ? 'border-red-500 dark:border-red-500 focus:ring-red-500 dark:focus:ring-red-500' 
                          : 'border-gray-300 dark:border-gray-600 focus:ring-green-500 dark:focus:ring-green-400'
                      }`}
                      placeholder="State"
                    />
                    {fieldErrors['address.state'] && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {fieldErrors['address.state']}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                      PIN Code *
                    </label>
                    <input
                      type="text"
                      name="address.zip_code"
                      value={formData.address.zip_code}
                      onChange={handleInputChange}
                      required
                      maxLength={6}
                      className={`w-full px-2.5 sm:px-4 py-1.5 sm:py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
                        fieldErrors['address.zip_code'] 
                          ? 'border-red-500 dark:border-red-500 focus:ring-red-500 dark:focus:ring-red-500' 
                          : 'border-gray-300 dark:border-gray-600 focus:ring-green-500 dark:focus:ring-green-400'
                      }`}
                      placeholder="6-digit PIN code"
                    />
                    {fieldErrors['address.zip_code'] && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {fieldErrors['address.zip_code']}
                      </p>
                    )}
                  </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Slot - Always Visible - Collapsible on Mobile */}
            <div id="deliverySlot" className="bg-white dark:bg-gray-800 rounded-xl border-l-4 border-purple-500 dark:border-purple-400 border border-gray-200 dark:border-gray-700 overflow-hidden scroll-mt-24">
              {/* Header - Clickable on Mobile */}
              <button
                onClick={() => toggleSection('deliverySlot')}
                className="w-full lg:pointer-events-none flex items-center justify-between p-3 sm:p-4 lg:p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors lg:hover:bg-transparent"
              >
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-purple-900 dark:text-purple-100">Delivery Date & Time *</span>
              </h2>
                <ChevronDown className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 lg:hidden ${expandedSections.deliverySlot ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Content - Collapsible on Mobile */}
              <div className={`px-3 sm:px-4 lg:px-6 pb-3 sm:pb-4 lg:pb-6 transition-all duration-300 lg:block ${expandedSections.deliverySlot ? 'block' : 'hidden'}`}>
              {/* Field error for delivery slot */}
              {fieldErrors.deliverySlot && (
                <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-xs text-red-700 dark:text-red-300">{fieldErrors.deliverySlot}</p>
                </div>
              )}
              {/* Always-visible slot display */}
              {isClient && (selectedSlot || cartDeliverySlot) && !showSlotSelector && (() => {
                const currentSlot = selectedSlot || cartDeliverySlot;
                const expirationStatus = getSlotExpirationStatus(currentSlot);
                const isExpired = expirationStatus === 'expired';
                const isExpiringSoon = expirationStatus === 'expiring_soon';
                const isValid = expirationStatus === 'valid';
                
                // Determine badge colors and text
                let badgeBg, badgeBorder, badgeText, badgeIcon, badgeMessage;
                if (isExpired) {
                  badgeBg = 'bg-red-50 dark:bg-red-900/20';
                  badgeBorder = 'border-2 border-red-300 dark:border-red-800';
                  badgeText = 'text-red-800 dark:text-red-300';
                  badgeIcon = <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400 flex-shrink-0" />;
                  badgeMessage = 'Slot Expired - Please select a new slot';
                } else if (isExpiringSoon) {
                  badgeBg = 'bg-yellow-50 dark:bg-yellow-900/20';
                  badgeBorder = 'border-2 border-yellow-300 dark:border-yellow-800';
                  badgeText = 'text-yellow-800 dark:text-yellow-300';
                  badgeIcon = <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />;
                  badgeMessage = countdown 
                    ? `Expires in ${countdown.hours}h ${countdown.minutes}m`
                    : 'Expiring Soon - Please select a new slot';
                } else {
                  badgeBg = 'bg-green-50 dark:bg-green-900/20';
                  badgeBorder = 'border-2 border-green-200 dark:border-green-800';
                  badgeText = 'text-green-800 dark:text-green-300';
                  badgeIcon = <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400 flex-shrink-0" />;
                  badgeMessage = countdown 
                    ? `Slot expires in ${countdown.hours}h ${countdown.minutes}m`
                    : 'Delivery Slot Selected';
                }
                
                return (
                  <div className={`${badgeBg} ${badgeBorder} rounded-lg p-3 sm:p-4 mb-3 sm:mb-4`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                        {badgeIcon}
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs sm:text-sm font-medium ${badgeText} mb-1`}>
                            {badgeMessage}
                          </p>
                          <p className={`text-xs sm:text-sm ${badgeText} opacity-90`}>
                            {formatDeliveryDate(currentSlot.date)} • {formatTimeSlot(currentSlot)}
                            </p>
                          </div>
                        </div>
                      <button
                        onClick={() => setShowSlotSelector(true)}
                        className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium whitespace-nowrap flex-shrink-0"
                      >
                        Change
                      </button>
                      </div>
                    </div>
                );
              })()}
                  
              {!showSlotSelector ? (
                /* Show Select Button if no slot */
                !(selectedSlot || cartDeliverySlot) && (
                  <button
                    onClick={() => setShowSlotSelector(true)}
                    className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                  >
                    Select Delivery Slot
                  </button>
                )
              ) : (
                /* Show Slot Selector */
                <div className="space-y-3 sm:space-y-4">
                  <DeliverySlotSelector
                    onSlotSelect={handleSlotSelect}
                    selectedSlot={selectedSlot || cartDeliverySlot}
                    pinCode={currentPinCode}
                  />
                  {(selectedSlot || cartDeliverySlot) && (
                    <button
                      onClick={() => {
                        setShowSlotSelector(false);
                        // If selectedSlot exists, keep it; otherwise reset to cart's original slot
                        if (!selectedSlot && cartDeliverySlot) {
                          const date = cartDeliverySlot.date instanceof Date 
                            ? cartDeliverySlot.date 
                            : cartDeliverySlot.date 
                              ? new Date(cartDeliverySlot.date) 
                              : null;
                          const slotData = {
                            date: date,
                            slot: cartDeliverySlot.slot,
                            time: cartDeliverySlot.time || cartDeliverySlot.slot?.startTime,
                            pinCode: currentPinCode
                          };
                          setSelectedSlot(slotData);
                          setFormData(prev => ({
                            ...prev,
                            deliveryDate: date ? date.toISOString().split('T')[0] : '',
                            deliveryTime: cartDeliverySlot.time || cartDeliverySlot.slot?.startTime || ''
                          }));
                        }
                      }}
                      className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                    >
                      Cancel {selectedSlot ? '(Keep Current Slot)' : '(Use Cart Slot)'}
                    </button>
                  )}
                </div>
              )}
              </div>
            </div>

            {/* Payment Method - Collapsible on Mobile */}
            <div id="paymentMethod" className="bg-white dark:bg-gray-800 rounded-xl border-l-4 border-orange-500 dark:border-orange-400 border border-gray-200 dark:border-gray-700 overflow-hidden scroll-mt-24">
              {/* Header - Clickable on Mobile */}
              <button
                onClick={() => toggleSection('paymentMethod')}
                className="w-full lg:pointer-events-none flex items-center justify-between p-3 sm:p-4 lg:p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors lg:hover:bg-transparent"
              >
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                    <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="text-orange-900 dark:text-orange-100">Payment Method *</span>
              </h2>
                <ChevronDown className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 lg:hidden ${expandedSections.paymentMethod ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Content - Collapsible on Mobile */}
              <div className={`px-3 sm:px-4 lg:px-6 pb-3 sm:pb-4 lg:pb-6 transition-all duration-300 lg:block ${expandedSections.paymentMethod ? 'block' : 'hidden'}`}>
                <div className="space-y-2 sm:space-y-3">
                {['cash', 'upi', 'card', 'wallet'].map((method) => (
                  <label
                    key={method}
                    className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.paymentMethod === method
                        ? 'border-pink-500 dark:border-pink-400 bg-pink-50 dark:bg-pink-900/30'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method}
                      checked={formData.paymentMethod === method}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-pink-600 dark:text-pink-400 focus:ring-pink-500 dark:focus:ring-pink-400"
                    />
                    <span className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100 capitalize">
                      {method === 'upi' ? 'UPI' : method}
                    </span>
                  </label>
                ))}
              </div>
              </div>
            </div>

            {/* Special Instructions - Optional - Collapsible on All Devices */}
            <div id="specialInstructions" className="bg-white dark:bg-gray-800 rounded-xl border-l-4 border-gray-400 dark:border-gray-500 border border-gray-200 dark:border-gray-700 overflow-hidden scroll-mt-24">
              {/* Header - Clickable on All Devices */}
              <button
                onClick={() => toggleSection('specialInstructions')}
                className="w-full flex items-center justify-between p-3 sm:p-4 lg:p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                    <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">Special Instructions (Optional)</span>
                </h2>
                <ChevronDown className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${expandedSections.specialInstructions ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Content - Collapsible on All Devices */}
              <div className={`px-3 sm:px-4 lg:px-6 pb-3 sm:pb-4 lg:pb-6 transition-all duration-300 ${expandedSections.specialInstructions ? 'block' : 'hidden'}`}>
              <textarea
                name="specialInstructions"
                value={formData.specialInstructions}
                onChange={handleInputChange}
                  rows={3}
                maxLength={150}
                  className="w-full px-2.5 sm:px-4 py-1.5 sm:py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
                placeholder="Any special delivery instructions or notes (optional)..."
              />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 sm:mt-2">
                {formData.specialInstructions.length}/150 characters
              </p>
              </div>
            </div>
          </div>

          {/* RIGHT SECTION: Order Summary - Visible on All Devices */}
          <div className="lg:sticky lg:top-24 h-fit mb-8 lg:mb-0">
            <div className="bg-white dark:bg-gray-800 rounded-xl border-l-4 border-pink-500 dark:border-pink-400 border border-gray-200 dark:border-gray-700 shadow-lg dark:shadow-xl dark:shadow-black/30 p-3 sm:p-4 lg:p-5 space-y-3 sm:space-y-4">
              {/* Header with Icon */}
              <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                <div className="p-1.5 rounded-lg bg-pink-100 dark:bg-pink-900/30">
                  <ShoppingBag className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">Order Summary</h2>
              </div>

              {/* Cart Items - Organized by Type */}
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                {/* Separate Deal Items */}
                {cartItems.filter(item => item.is_deal_item).length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 pb-1.5 border-b border-green-200 dark:border-green-700">
                      <div className="p-1 rounded-md bg-green-100 dark:bg-green-900/30">
                        <Tag className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold text-green-700 dark:text-green-400 uppercase tracking-wide">
                        Special Deals ({cartItems.filter(item => item.is_deal_item).length})
                      </h3>
                    </div>
                    {cartItems.filter(item => item.is_deal_item).map((item) => {
                      const itemPrice = item.deal_price || 1;
                      const itemTotal = itemPrice * item.quantity;
                      const totalItemPrice = item.totalPrice || itemTotal;

                      return (
                        <div key={item.id} className="flex gap-3 p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 shadow-sm">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100 line-clamp-2 mb-1">
                                  {item.product.name}
                                </h4>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 text-[10px] font-bold rounded-md">
                                  <Gift className="w-3 h-3" />
                                  DEAL
                                </span>
                              </div>
                              <span className="text-base sm:text-lg font-extrabold text-green-600 dark:text-green-400 whitespace-nowrap ml-2">
                                {formatPrice(totalItemPrice)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-green-200 dark:border-green-700">
                              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Quantity: {item.quantity}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Regular Items */}
                {cartItems.filter(item => !item.is_deal_item).length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 pb-1.5 border-b border-pink-200 dark:border-pink-700">
                      <div className="p-1 rounded-md bg-pink-100 dark:bg-pink-900/30">
                        <Package className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400" />
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold text-pink-700 dark:text-pink-400 uppercase tracking-wide">
                        Products ({cartItems.filter(item => !item.is_deal_item).length})
                      </h3>
                    </div>
                    {cartItems.filter(item => !item.is_deal_item).map((item) => {
                      // Calculate price
                      const itemPrice = item.variant?.discounted_price || item.product.discounted_price || item.product.base_price;
                      const itemTotal = itemPrice * item.quantity;
                      
                      // Calculate combo total
                      const calculateComboTotal = (combos) => {
                        if (!combos || combos.length === 0) return 0;
                        return combos.reduce((sum, combo) => {
                          if (combo.unitPrice !== undefined) {
                            return sum + (combo.unitPrice * combo.quantity);
                          }
                          const comboUnitPrice = (combo.discount_percentage > 0 || (combo.discounted_price && combo.discounted_price < combo.price))
                            ? (combo.discounted_price || combo.price)
                            : combo.price;
                          return sum + (comboUnitPrice * combo.quantity);
                        }, 0);
                      };
                      
                      const comboTotal = calculateComboTotal(item.combos);
                      const totalItemPrice = item.totalPrice || (itemTotal + comboTotal);
                      
                      // Get product details
                      const itemWeight = item.variant?.weight || item.product?.base_weight || null;
                      const productDetails = [];
                      if (itemWeight) productDetails.push(itemWeight);
                      if (item.flavor) productDetails.push(item.flavor.name);
                      if (item.tier) productDetails.push(`${item.tier} Tier`);

                      return (
                        <div key={item.id} className="flex gap-3 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                          {/* Product Image */}
                          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                            <img
                              src={item.product.image_url}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100 line-clamp-2 mb-1.5">
                              {item.product.name}
                            </h4>
                            
                            {/* Product Specifications */}
                            {productDetails.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                                {productDetails.map((detail, idx) => (
                                  <span key={idx} className="inline-flex items-center px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[10px] sm:text-xs font-medium rounded">
                                    {detail}
                                  </span>
                                ))}
                              </div>
                            )}
                            
                            {/* Add-ons/Combos */}
                            {item.combos && item.combos.length > 0 && (
                              <div className="mb-2">
                                <div className="flex items-center gap-1 mb-1.5">
                                  <Gift className="w-3 h-3 text-purple-500 dark:text-purple-400" />
                                  <span className="text-[10px] sm:text-xs font-semibold text-purple-600 dark:text-purple-400">
                                    {item.combos.length} Add-on{item.combos.length > 1 ? 's' : ''}
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  {item.combos.map((combo, idx) => {
                                    // Calculate individual combo price
                                    const comboUnitPrice = (combo.discount_percentage > 0 || (combo.discounted_price && combo.discounted_price < combo.price))
                                      ? (combo.discounted_price || combo.price)
                                      : combo.price;
                                    const comboTotalPrice = (comboUnitPrice || 0) * (combo.quantity || 1);
                                    
                                    return (
                                      <div key={idx} className="flex items-center gap-1.5 text-[10px] sm:text-xs">
                                        {idx === 0 ? (
                                          <span className="text-gray-700 dark:text-gray-300 font-medium">
                                            {combo.name || 'Combo Item'} × {combo.quantity || 1} = {formatPrice(comboTotalPrice)}
                                          </span>
                                        ) : (
                                          <>
                                            <span className="text-purple-500 dark:text-purple-400 font-semibold">➕</span>
                                            <span className="text-gray-700 dark:text-gray-300 font-medium">
                                              {combo.name || 'Combo Item'} × {combo.quantity || 1} = {formatPrice(comboTotalPrice)}
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            
                            {/* Quantity and Price */}
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                              <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                                Qty: <span className="font-semibold">{item.quantity}</span>
                              </span>
                              <div className="text-right">
                                {comboTotal > 0 && (
                                  <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">
                                    {formatPrice(itemTotal)} + {formatPrice(comboTotal)}
                                  </div>
                                )}
                                <span className="text-sm sm:text-base font-bold text-pink-600 dark:text-pink-400">
                                  {formatPrice(totalItemPrice)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 pt-2 border-t-2 border-gray-200 dark:border-gray-700">
                {/* 1. Subtotal */}
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300">Subtotal ({cartSummary.totalItems} {cartSummary.totalItems === 1 ? 'item' : 'items'})</span>
                  <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">{formatPrice(subtotal)}</span>
                </div>

                {/* 2. Promo Discount */}
                {appliedPromo && promoDiscount > 0 && (
                  <div className="flex items-center justify-between text-green-700 dark:text-green-400 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-2 border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-green-400"></div>
                      <span className="text-sm sm:text-base font-semibold">Promo Discount</span>
                    </div>
                    <span className="text-sm sm:text-base font-bold">-{formatPrice(promoDiscount)}</span>
                  </div>
                )}

                {/* 3. Delivery Charge */}
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300">Delivery Charge</span>
                  <span className="text-sm sm:text-base font-semibold">
                    {finalDeliveryCharge === 0 ? (
                      <span className="text-green-600 dark:text-green-400 font-bold">FREE</span>
                    ) : (
                      <span className="text-gray-900 dark:text-gray-100">{formatPrice(finalDeliveryCharge)}</span>
                    )}
                  </span>
                </div>

                {/* 4. Wallet Balance (Box) - Fixed height to prevent layout shift */}
                {isAuthenticated && walletBalance > 0 && (
                  <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-2 border border-pink-200 dark:border-pink-800 min-h-[80px]">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Wallet className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                        <span className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100">Wallet Balance</span>
                      </div>
                      <span className="text-sm sm:text-base font-semibold text-pink-600 dark:text-pink-400">{formatPrice(walletBalance)}</span>
                    </div>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={applyWalletDiscount}
                        onChange={(e) => setApplyWalletDiscount(e.target.checked)}
                        className="w-4 h-4 text-pink-600 dark:text-pink-400 rounded focus:ring-pink-500 dark:focus:ring-pink-400"
                      />
                      <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                        Use wallet (up to {formatPrice(maxWalletDiscount)} - 10% of order)
                      </span>
                    </label>
                    {/* Always reserve space for wallet discount line to prevent height fluctuation */}
                    <div className={`flex items-center justify-between mt-1.5 pt-1.5 border-t border-pink-200 dark:border-pink-800 transition-opacity duration-200 ${applyWalletDiscount && walletDiscount > 0 ? 'opacity-100' : 'opacity-0 h-[24px]'}`}>
                      <span className="text-sm sm:text-base font-medium text-pink-600 dark:text-pink-400">Wallet Discount</span>
                      <span className="text-sm sm:text-base font-semibold text-pink-600 dark:text-pink-400">
                        {applyWalletDiscount && walletDiscount > 0 ? `-${formatPrice(walletDiscount)}` : '-₹0'}
                      </span>
                    </div>
                  </div>
                )}

                {/* 5. Final Total (Amount to Pay) */}
                <div className="border-t-2 border-pink-200 dark:border-pink-800 pt-2.5 mt-2.5 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-lg p-3 -mx-1">
                  <div className="flex justify-between items-center">
                    <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">Amount to Pay</span>
                    <span className="text-xl sm:text-2xl font-extrabold text-pink-600 dark:text-pink-400">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Error Alert - Desktop Only - Above Place Order Button */}
              {(error || (!selectedSlot && !cartDeliverySlot)) && (
                <div 
                  data-error-alert
                  className="hidden lg:block mb-3 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-800 rounded-lg"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-sm sm:text-base font-bold text-red-800 dark:text-red-300 mb-1">
                        ⚠️ Unable to Place Order
                      </h3>
                      <p className="text-xs sm:text-sm text-red-700 dark:text-red-400">
                        {error || 'Please select a delivery date and time slot to place your order.'}
                      </p>
                      {!selectedSlot && !cartDeliverySlot && !error && (
                        <button
                          onClick={() => setShowSlotSelector(true)}
                          className="mt-2 px-3 py-1.5 text-xs bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors font-medium"
                        >
                          Select Delivery Slot
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Place Order Button - Hidden on mobile (shown in sticky bar) */}
              <button
                data-place-order-button
                onClick={() => {
                  setShowSuccessIndicator(false);
                  handlePlaceOrder();
                }}
                disabled={loading || !isAuthenticated}
                className={`hidden lg:flex w-full py-3 bg-gradient-to-r from-pink-600 to-rose-600 dark:from-pink-700 dark:to-rose-700 text-white hover:from-pink-700 hover:to-rose-700 dark:hover:from-pink-600 dark:hover:to-rose-600 transition-all duration-200 font-semibold text-lg shadow-lg dark:shadow-xl dark:shadow-black/30 hover:shadow-xl transform hover:scale-[1.02] items-center justify-center gap-2 ${
                  loading || !isAuthenticated
                    ? 'opacity-50 cursor-not-allowed transform-none'
                    : (!selectedSlot && !cartDeliverySlot)
                      ? 'opacity-75 cursor-pointer'
                      : ''
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Placing Order...
                  </>
                ) : showSuccessIndicator ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Ready to Place Order</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Place Order
                  </>
                )}
              </button>

              {/* Security Badge */}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  <Lock className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                  <span>Secure checkout • Your payment information is safe</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Checkout Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-2xl dark:shadow-black/50 z-40">
        <div className="max-w-7xl mx-auto px-3 py-2.5">
          {/* Error Alert - Mobile - Above Place Order Button */}
          {(error || (!selectedSlot && !cartDeliverySlot)) && (
            <div 
              data-error-alert
              className="mb-2 p-3 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-800 rounded-lg"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-bold text-red-800 dark:text-red-300 mb-1">
                    ⚠️ Unable to Place Order
                  </h3>
                  <p className="text-[11px] text-red-700 dark:text-red-400 leading-tight">
                    {error || 'Please select a delivery date and time slot to place your order.'}
                  </p>
                  {!selectedSlot && !cartDeliverySlot && !error && (
                    <button
                      onClick={() => setShowSlotSelector(true)}
                      className="mt-1.5 px-2.5 py-1 text-[10px] bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors font-medium"
                    >
                      Select Slot
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Total and Checkout Button Row */}
          <div className="flex items-center gap-2.5 mb-1">
            {/* Total Box - 30% width */}
            <div className="w-[30%] min-w-[90px] bg-gray-50 dark:bg-gray-700/50 rounded-lg px-2.5 py-2 border border-pink-300 dark:border-pink-500/50 flex flex-col items-center justify-center">
              <div className="flex items-baseline gap-0.5 justify-center mb-0.5">
                <p className="text-base font-bold text-pink-600 dark:text-pink-400 leading-tight">{formatPrice(total)}</p>
                {appliedPromo && promoDiscount > 0 && (
                  <span className="text-[10px] text-green-600 dark:text-green-400 font-semibold">
                    -{formatPrice(promoDiscount)}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
                {cartSummary.totalItems} {cartSummary.totalItems === 1 ? 'item' : 'items'}
              </span>
            </div>
            
            {/* Checkout Button - 70% width */}
            <button
              data-place-order-button
              onClick={() => {
                setShowSuccessIndicator(false);
                handlePlaceOrder();
              }}
              disabled={loading || !isAuthenticated}
              className={`flex-1 w-[70%] h-[56px] bg-gradient-to-r from-pink-600 to-rose-600 dark:from-pink-700 dark:to-rose-700 text-white hover:from-pink-700 hover:to-rose-700 dark:hover:from-pink-600 dark:hover:to-rose-600 transition-all font-bold text-base shadow-lg dark:shadow-xl dark:shadow-black/30 flex items-center justify-center gap-2 ${
                loading || !isAuthenticated
                  ? 'opacity-50 cursor-not-allowed active:scale-100'
                  : (!selectedSlot && !cartDeliverySlot)
                    ? 'opacity-75 cursor-pointer active:scale-95'
                    : 'active:scale-95'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>PLACING...</span>
                </>
              ) : showSuccessIndicator ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>READY TO PLACE</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>PLACE ORDER</span>
                </>
              )}
            </button>
          </div>
          
          {/* Security Badge */}
          <div className="flex items-center justify-center">
            <p className="text-[9px] text-gray-400 dark:text-gray-500">
              🔒 Secure checkout
            </p>
          </div>
        </div>
      </div>

      {/* Order Summary Bottom Sheet for Mobile */}
      {showOrderSummarySheet && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 bg-black/50 dark:bg-black/70 z-50 transition-opacity"
            onClick={() => setShowOrderSummarySheet(false)}
          />
          
          {/* Bottom Sheet */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl dark:shadow-black/50 z-50 max-h-[85vh] flex flex-col transform transition-transform duration-300 ease-out">
            {/* Handle Bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>
            
            {/* Header */}
            <div className="px-4 pb-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Order Summary</h2>
              <button
                onClick={() => setShowOrderSummarySheet(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {/* Cart Items - Organized by Type */}
              <div className="space-y-4 mb-4">
                {/* Separate Deal Items */}
                {cartItems.filter(item => item.is_deal_item).length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 pb-1.5 border-b border-green-200 dark:border-green-700">
                      <div className="p-1 rounded-md bg-green-100 dark:bg-green-900/30">
                        <Tag className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wide">
                        Special Deals ({cartItems.filter(item => item.is_deal_item).length})
                      </h3>
                    </div>
                    {cartItems.filter(item => item.is_deal_item).map((item) => {
                      const itemPrice = item.deal_price || 1;
                      const itemTotal = itemPrice * item.quantity;
                      const totalItemPrice = item.totalPrice || itemTotal;

                      return (
                        <div key={item.id} className="flex gap-3 p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 shadow-sm">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 line-clamp-2 mb-1">
                                  {item.product.name}
                                </h4>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 text-[10px] font-bold rounded-md">
                                  <Gift className="w-3 h-3" />
                                  DEAL
                                </span>
                              </div>
                              <span className="text-base font-extrabold text-green-600 dark:text-green-400 whitespace-nowrap ml-2">
                                {formatPrice(totalItemPrice)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-green-200 dark:border-green-700">
                              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Quantity: {item.quantity}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Regular Items */}
                {cartItems.filter(item => !item.is_deal_item).length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 pb-1.5 border-b border-pink-200 dark:border-pink-700">
                      <div className="p-1 rounded-md bg-pink-100 dark:bg-pink-900/30">
                        <Package className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400" />
                      </div>
                      <h3 className="text-xs font-bold text-pink-700 dark:text-pink-400 uppercase tracking-wide">
                        Products ({cartItems.filter(item => !item.is_deal_item).length})
                      </h3>
                    </div>
                    {cartItems.filter(item => !item.is_deal_item).map((item) => {
                      // Calculate price
                      const itemPrice = item.variant?.discounted_price || item.product.discounted_price || item.product.base_price;
                      const itemTotal = itemPrice * item.quantity;
                      
                      // Calculate combo total
                      const calculateComboTotal = (combos) => {
                        if (!combos || combos.length === 0) return 0;
                        return combos.reduce((sum, combo) => {
                          if (combo.unitPrice !== undefined) {
                            return sum + (combo.unitPrice * combo.quantity);
                          }
                          const comboUnitPrice = (combo.discount_percentage > 0 || (combo.discounted_price && combo.discounted_price < combo.price))
                            ? (combo.discounted_price || combo.price)
                            : combo.price;
                          return sum + (comboUnitPrice * combo.quantity);
                        }, 0);
                      };
                      
                      const comboTotal = calculateComboTotal(item.combos);
                      const totalItemPrice = item.totalPrice || (itemTotal + comboTotal);
                      
                      // Get product details
                      const itemWeight = item.variant?.weight || item.product?.base_weight || null;
                      const productDetails = [];
                      if (itemWeight) productDetails.push(itemWeight);
                      if (item.flavor) productDetails.push(item.flavor.name);
                      if (item.tier) productDetails.push(`${item.tier} Tier`);

                      return (
                        <div key={item.id} className="flex gap-3 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                          {/* Product Image */}
                          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                            <img
                              src={item.product.image_url}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-2 mb-1.5">
                              {item.product.name}
                            </h4>
                            
                            {/* Product Specifications */}
                            {productDetails.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                                {productDetails.map((detail, idx) => (
                                  <span key={idx} className="inline-flex items-center px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[10px] font-medium rounded">
                                    {detail}
                                  </span>
                                ))}
                              </div>
                            )}
                            
                            {/* Add-ons/Combos */}
                            {item.combos && item.combos.length > 0 && (
                              <div className="mb-2">
                                <div className="flex items-center gap-1 mb-1.5">
                                  <Gift className="w-3 h-3 text-purple-500 dark:text-purple-400" />
                                  <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                                    {item.combos.length} Add-on{item.combos.length > 1 ? 's' : ''}
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  {item.combos.map((combo, idx) => {
                                    // Calculate individual combo price
                                    const comboUnitPrice = (combo.discount_percentage > 0 || (combo.discounted_price && combo.discounted_price < combo.price))
                                      ? (combo.discounted_price || combo.price)
                                      : combo.price;
                                    const comboTotalPrice = (comboUnitPrice || 0) * (combo.quantity || 1);
                                    
                                    return (
                                      <div key={idx} className="flex items-center gap-1.5 text-[10px]">
                                        {idx === 0 ? (
                                          <span className="text-gray-700 dark:text-gray-300 font-medium">
                                            {combo.name || 'Combo Item'} × {combo.quantity || 1} = {formatPrice(comboTotalPrice)}
                                          </span>
                                        ) : (
                                          <>
                                            <span className="text-purple-500 dark:text-purple-400 font-semibold">➕</span>
                                            <span className="text-gray-700 dark:text-gray-300 font-medium">
                                              {combo.name || 'Combo Item'} × {combo.quantity || 1} = {formatPrice(comboTotalPrice)}
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            
                            {/* Quantity and Price */}
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                Qty: <span className="font-semibold">{item.quantity}</span>
                              </span>
                              <div className="text-right">
                                {comboTotal > 0 && (
                                  <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">
                                    {formatPrice(itemTotal)} + {formatPrice(comboTotal)}
                                  </div>
                                )}
                                <span className="text-sm font-bold text-pink-600 dark:text-pink-400">
                                  {formatPrice(totalItemPrice)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 pt-1 border-t border-gray-200 dark:border-gray-700">
                {/* 1. Subtotal */}
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal ({cartSummary.totalItems} items)</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>

                {/* 2. Promo Discount */}
                {appliedPromo && promoDiscount > 0 && (
                  <div className="flex items-center justify-between text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
                    <span className="text-sm font-medium">Promo Discount</span>
                    <span className="font-semibold">-{formatPrice(promoDiscount)}</span>
                  </div>
                )}

                {/* 3. Delivery Charge */}
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Delivery Charge</span>
                  <span className="font-medium">
                    {finalDeliveryCharge === 0 ? (
                      <span className="text-green-600 dark:text-green-400 font-semibold">FREE</span>
                    ) : (
                      formatPrice(finalDeliveryCharge)
                    )}
                  </span>
                </div>

                {/* 4. Wallet Balance */}
                {isAuthenticated && walletBalance > 0 && (
                  <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-3 border border-pink-200 dark:border-pink-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Wallet Balance</span>
                      </div>
                      <span className="text-sm font-semibold text-pink-600 dark:text-pink-400">{formatPrice(walletBalance)}</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={applyWalletDiscount}
                        onChange={(e) => setApplyWalletDiscount(e.target.checked)}
                        className="w-4 h-4 text-pink-600 dark:text-pink-400 rounded focus:ring-pink-500 dark:focus:ring-pink-400"
                      />
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        Use wallet (up to {formatPrice(maxWalletDiscount)} - 10% of order)
                      </span>
                    </label>
                    {applyWalletDiscount && walletDiscount > 0 && (
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-pink-200 dark:border-pink-800">
                      <span className="text-sm font-medium text-pink-600 dark:text-pink-400">Wallet Discount</span>
                      <span className="text-sm font-semibold text-pink-600 dark:text-pink-400">
                          -{formatPrice(walletDiscount)}
                      </span>
                    </div>
                    )}
                  </div>
                )}

                {/* 5. Final Total */}
                <div className="border-t-2 border-gray-300 dark:border-gray-600 pt-3 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">Amount to Pay</span>
                    <span className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                      {formatPrice(total)}
                    </span>
                  </div>
                  </div>
                </div>
              </div>

            {/* Footer with Security Badge */}
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                  🔒 Secure checkout • Your payment information is safe
                </p>
              </div>
            </div>
        </>
      )}

      {/* Footer: Hidden visually for better UX, but kept in DOM for SEO */}
      <div className="hidden">
      <Footer />
      <MobileFooter />
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
          <div className="h-6 w-40 bg-gray-200 dark:bg-gray-800 rounded" />
          <div className="mt-4 h-32 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700" />
        </div>
      </div>
    );
  }

  return <CheckoutPageContent isClient />;
}

