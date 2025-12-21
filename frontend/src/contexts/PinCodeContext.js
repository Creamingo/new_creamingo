'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import pinCodeAPI from '../api/pinCode';

const PinCodeContext = createContext();

export const usePinCode = () => {
  const context = useContext(PinCodeContext);
  if (!context) {
    throw new Error('usePinCode must be used within a PinCodeProvider');
  }
  return context;
};

export const PinCodeProvider = ({ children }) => {
  const [currentPinCode, setCurrentPinCode] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState(null);
  const [isValidPinCode, setIsValidPinCode] = useState(null);
  const [tempPinCode, setTempPinCode] = useState('');
  const [tempValidationStatus, setTempValidationStatus] = useState(null);
  const [tempDeliveryInfo, setTempDeliveryInfo] = useState(null);
  const debounceTimeoutRef = useRef(null);

  // Load saved PIN code from localStorage on mount
  useEffect(() => {
    const savedPinCode = localStorage.getItem('creamingo_pincode');
    const savedDeliveryInfo = localStorage.getItem('creamingo_delivery_info');
    
    if (savedPinCode && savedDeliveryInfo) {
      try {
        setCurrentPinCode(savedPinCode);
        setDeliveryInfo(JSON.parse(savedDeliveryInfo));
        setIsValidPinCode(true);
      } catch (error) {
        console.error('Error loading saved PIN code data:', error);
        // Clear invalid data
        localStorage.removeItem('creamingo_pincode');
        localStorage.removeItem('creamingo_delivery_info');
      }
    }
  }, []);

  // Save PIN code and delivery info to localStorage
  const savePinCodeData = (pinCode, deliveryData) => {
    localStorage.setItem('creamingo_pincode', pinCode);
    localStorage.setItem('creamingo_delivery_info', JSON.stringify(deliveryData));
  };

  // Clear PIN code data from localStorage
  const clearPinCodeData = () => {
    localStorage.removeItem('creamingo_pincode');
    localStorage.removeItem('creamingo_delivery_info');
  };

  // Debounced validation for real-time feedback
  const validatePinCodeDebounced = (pinCode) => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set the temporary PIN code
    setTempPinCode(pinCode);

    // Reset status for incomplete PIN codes
    if (pinCode.length < 6) {
      setTempValidationStatus(null);
      setError(null);
      setTempDeliveryInfo(null);
      return;
    }

    // Set loading state
    setTempValidationStatus('checking');
    setError(null);

    // Debounce the API call
    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        if (!pinCodeAPI.validatePinCodeFormat(pinCode)) {
          setTempValidationStatus('invalid');
          setError('Invalid PIN code format. Must be exactly 6 digits.');
          return;
        }

        const result = await pinCodeAPI.checkPinCodeAvailability(pinCode);
        
        if (result.available && result.data) {
          setTempValidationStatus('valid');
          setError(null);
          setTempDeliveryInfo(result.data);
        } else {
          setTempValidationStatus('invalid');
          setError(result.message || 'Delivery not available to this PIN code');
          setTempDeliveryInfo(null);
        }
      } catch (err) {
        setTempValidationStatus('invalid');
        setError(err.message || 'Error checking PIN code availability');
      }
    }, 500); // 500ms debounce
  };

  // Check PIN code availability (for manual confirmation)
  const checkPinCode = async (pinCode) => {
    if (!pinCodeAPI.validatePinCodeFormat(pinCode)) {
      setError('Invalid PIN code format. Must be exactly 6 digits.');
      setIsValidPinCode(false);
      return false;
    }

    setIsChecking(true);
    setError(null);

    try {
      const result = await pinCodeAPI.checkPinCodeAvailability(pinCode);
      
      if (result.available && result.data) {
        setCurrentPinCode(pinCode);
        setDeliveryInfo(result.data);
        setIsValidPinCode(true);
        setTempPinCode('');
        setTempValidationStatus(null);
        savePinCodeData(pinCode, result.data);
        return true;
      } else {
        setCurrentPinCode(pinCode);
        setDeliveryInfo(null);
        setIsValidPinCode(false);
        setError(result.message || 'Delivery not available to this PIN code');
        return false;
      }
    } catch (err) {
      setError(err.message || 'Error checking PIN code availability');
      setIsValidPinCode(false);
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  // Confirm temporary PIN code (for "Continue Shopping" button)
  const confirmTempPinCode = async () => {
    console.log('confirmTempPinCode called:', { tempPinCode, tempValidationStatus });
    if (tempPinCode && tempValidationStatus === 'valid') {
      console.log('Confirming PIN code:', tempPinCode);
      return await checkPinCode(tempPinCode);
    }
    console.log('Cannot confirm PIN code - conditions not met');
    return false;
  };

  // Clear current PIN code
  const clearPinCode = () => {
    setCurrentPinCode('');
    setDeliveryInfo(null);
    setIsValidPinCode(null);
    setError(null);
    setTempPinCode('');
    setTempValidationStatus(null);
    setTempDeliveryInfo(null);
    clearPinCodeData();
  };

  // Get formatted delivery charge
  const getFormattedDeliveryCharge = () => {
    if (deliveryInfo && deliveryInfo.deliveryCharge) {
      return `₹${deliveryInfo.deliveryCharge}`;
    }
    return null;
  };

  // Get delivery locality
  const getDeliveryLocality = () => {
    if (deliveryInfo && deliveryInfo.locality) {
      return deliveryInfo.locality;
    }
    return null;
  };

  // Get temporary formatted delivery charge
  const getTempFormattedDeliveryCharge = () => {
    if (tempDeliveryInfo && tempDeliveryInfo.deliveryCharge) {
      return `₹${tempDeliveryInfo.deliveryCharge}`;
    }
    return null;
  };

  // Get temporary delivery locality
  const getTempDeliveryLocality = () => {
    if (tempDeliveryInfo && tempDeliveryInfo.locality) {
      return tempDeliveryInfo.locality;
    }
    return null;
  };

  // Check if delivery is available
  const isDeliveryAvailable = () => {
    return isValidPinCode === true && deliveryInfo !== null;
  };

  const value = {
    // State
    currentPinCode,
    deliveryInfo,
    isChecking,
    error,
    isValidPinCode,
    tempPinCode,
    tempValidationStatus,
    tempDeliveryInfo,
    
    // Actions
    checkPinCode,
    clearPinCode,
    validatePinCodeDebounced,
    confirmTempPinCode,
    
    // Computed values
    getFormattedDeliveryCharge,
    getDeliveryLocality,
    getTempFormattedDeliveryCharge,
    getTempDeliveryLocality,
    isDeliveryAvailable,
    
    // Utilities
    formatPinCode: pinCodeAPI.formatPinCode,
    validatePinCodeFormat: pinCodeAPI.validatePinCodeFormat
  };

  return (
    <PinCodeContext.Provider value={value}>
      {children}
    </PinCodeContext.Provider>
  );
};
