'use client';

import React from 'react';
import { useDeliveryBadge } from '../hooks/useDeliveryBadge';

/**
 * Delivery Badge Component
 * Displays "Same Day Delivery Available" or "Next Day Delivery" at bottom of image
 */
const DeliveryBadge = ({ className = '' }) => {
  const {
    isSameDay,
    isNextDay,
    loading,
    error
  } = useDeliveryBadge();

  // Don't render if loading or error
  if (loading) {
    return null;
  }

  if (error || (!isSameDay && !isNextDay)) {
    return null; // Don't show badge if no delivery available
  }

  return (
    <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 via-black/70 to-transparent px-2 py-1.5 z-10 ${className}`}>
      <div className="flex items-center justify-center">
        <span className="text-white text-[10px] sm:text-xs font-medium leading-tight whitespace-nowrap">
          {isSameDay ? "Today's Assured Delivery" : 'Get It Tomorrow'}
        </span>
      </div>
    </div>
  );
};

export default DeliveryBadge;

