'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Get current IST time components (hours and minutes)
 */
const getISTTime = () => {
  const now = new Date();
  // IST is UTC+5:30
  // Get UTC time components
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const utcSeconds = now.getUTCSeconds();
  
  // Add IST offset (5 hours 30 minutes)
  let istHours = utcHours + 5;
  let istMinutes = utcMinutes + 30;
  
  // Handle overflow
  if (istMinutes >= 60) {
    istHours += 1;
    istMinutes -= 60;
  }
  if (istHours >= 24) {
    istHours -= 24;
  }
  
  return {
    hours: istHours,
    minutes: istMinutes,
    seconds: utcSeconds
  };
};

/**
 * Custom hook to manage delivery badge state
 * Simple logic: Once last slot begins, show "Next Day Delivery"
 * At midnight IST, switch back to "Same Day Delivery Available"
 */
export const useDeliveryBadge = () => {
  const [deliveryInfo, setDeliveryInfo] = useState({
    isSameDay: false,
    isNextDay: false,
    loading: true,
    error: null
  });

  // Check delivery availability based on last slot
  const checkDeliveryAvailability = useCallback(async () => {
    try {
      setDeliveryInfo(prev => ({ ...prev, loading: true, error: null }));

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      
      // Fetch all active delivery slots
      const response = await fetch(`${API_BASE_URL}/delivery-slots?isActive=true`);
      const data = await response.json();

      if (!data.success || !data.data || data.data.length === 0) {
        setDeliveryInfo({
          isSameDay: false,
          isNextDay: false,
          loading: false,
          error: 'No delivery slots available'
        });
        return;
      }

      // Get active slots and sort by start time
      const activeSlots = data.data
        .filter(slot => slot.isActive)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      if (activeSlots.length === 0) {
        setDeliveryInfo({
          isSameDay: false,
          isNextDay: false,
          loading: false,
          error: 'No active delivery slots'
        });
        return;
      }

      // Get the last slot (latest start time)
      const lastSlot = activeSlots[activeSlots.length - 1];
      const [lastSlotHours, lastSlotMinutes] = lastSlot.startTime.split(':').map(Number);

      // Get current IST time
      const istTime = getISTTime();
      const currentTimeInMinutes = istTime.hours * 60 + istTime.minutes;
      const lastSlotTimeInMinutes = lastSlotHours * 60 + lastSlotMinutes;

      // Check if current time has passed the last slot start time
      const hasLastSlotStarted = currentTimeInMinutes >= lastSlotTimeInMinutes;

      setDeliveryInfo({
        isSameDay: !hasLastSlotStarted,
        isNextDay: hasLastSlotStarted,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error checking delivery availability:', error);
      setDeliveryInfo(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to fetch delivery information'
      }));
    }
  }, []);

  // Initial check
  useEffect(() => {
    checkDeliveryAvailability();
  }, [checkDeliveryAvailability]);

  // Check every minute to catch when last slot starts
  useEffect(() => {
    const interval = setInterval(() => {
      checkDeliveryAvailability();
    }, 60 * 1000); // Check every minute

    return () => clearInterval(interval);
  }, [checkDeliveryAvailability]);

  // Check at midnight IST to reset to same day
  useEffect(() => {
    const checkMidnight = () => {
      const istTime = getISTTime();
      
      // If it's midnight (00:00 IST), refresh
      if (istTime.hours === 0 && istTime.minutes === 0) {
        checkDeliveryAvailability();
      }
    };

    // Check every minute for midnight
    const midnightCheck = setInterval(checkMidnight, 60 * 1000);
    
    return () => clearInterval(midnightCheck);
  }, [checkDeliveryAvailability]);

  return {
    ...deliveryInfo,
    refresh: checkDeliveryAvailability
  };
};

