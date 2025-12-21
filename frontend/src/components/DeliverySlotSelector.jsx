'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Truck
} from 'lucide-react';
import deliverySlotApi from '../api/deliverySlotApi';

const DeliverySlotSelector = ({ 
  onSlotSelect, 
  selectedSlot = null, 
  pinCode = null,
  className = '' 
}) => {
  const [slots, setSlots] = useState([]);
  const [availableSlots, setAvailableSlots] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dates, setDates] = useState([]);
  const scrollContainerRef = useRef(null);

  // Generate next 7 days
  const generateDates = () => {
    const today = new Date();
    const next7Days = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      next7Days.push(date);
    }
    
    return next7Days;
  };

  // Format date for API
  const formatDateForAPI = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Format date for display
  const formatDateForDisplay = (date) => {
    const options = { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  // Check if date is today
  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Check if date is tomorrow
  const isTomorrow = (date) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date.toDateString() === tomorrow.toDateString();
  };

  // Get date label
  const getDateLabel = (date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  // Load delivery slots
  const loadDeliverySlots = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading delivery slots...');
      const response = await deliverySlotApi.getDeliverySlots();
      console.log('Delivery slots response:', response);
      
      if (response.success) {
        const activeSlots = response.data.filter(slot => slot.isActive);
        console.log('Active slots:', activeSlots);
        setSlots(activeSlots.sort((a, b) => a.startTime.localeCompare(b.startTime)));
      } else {
        console.error('API returned success: false', response);
        setError('API returned an error');
      }
    } catch (err) {
      console.error('Error loading delivery slots:', err);
      setError(`Failed to load delivery slots: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Load availability for a specific date
  const loadAvailabilityForDate = async (date) => {
    try {
      const dateStr = formatDateForAPI(date);
      const response = await deliverySlotApi.getSlotsForDate(dateStr);
      
      if (response.success) {
        setAvailableSlots(prev => ({
          ...prev,
          [dateStr]: response.data
        }));
      }
    } catch (err) {
      console.error('Error loading availability:', err);
      // Don't set error state for availability, just log it
    }
  };

  // Handle date selection
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null);
    
    const dateStr = formatDateForAPI(date);
    if (!availableSlots[dateStr]) {
      loadAvailabilityForDate(date);
    }
  };

  // Format time for display (helper function)
  const formatTimeDisplay = (timeString) => {
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

  // Handle time slot selection
  const handleTimeSlotSelect = (slot) => {
    setSelectedTimeSlot(slot);
    
    // Format time string for display (e.g., "10:00 AM - 11:45 PM")
    const formatTimeString = (startTime, endTime) => {
      if (!startTime) return '';
      
      if (!endTime) {
        return formatTimeDisplay(startTime);
      }
      
      return `${formatTimeDisplay(startTime)} - ${formatTimeDisplay(endTime)}`;
    };
    
    const slotData = {
      date: selectedDate,
      slot: slot,
      time: formatTimeString(slot.startTime, slot.endTime), // Add formatted time string
      pinCode: pinCode,
      slotId: slot.id // Include slot ID for reference
    };
    
    onSlotSelect(slotData);
  };

  // Scroll to next/previous dates
  const scrollDates = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === 'next' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Initialize component
  useEffect(() => {
    const generatedDates = generateDates();
    setDates(generatedDates);
    setSelectedDate(generatedDates[0]);
    loadDeliverySlots();
  }, []);

  // Load availability when date is selected
  useEffect(() => {
    if (selectedDate) {
      loadAvailabilityForDate(selectedDate);
    }
  }, [selectedDate]);

  // Get available slots for selected date
  const getAvailableSlotsForDate = () => {
    if (!selectedDate) return [];
    const dateStr = formatDateForAPI(selectedDate);
    return availableSlots[dateStr] || [];
  };

  // Get slot availability status
  const getSlotStatus = (slot) => {
    // Check if slot has expired for today
    if (isSlotExpired(slot)) return 'disabled';
    
    const availableSlotsForDate = getAvailableSlotsForDate();
    const availability = availableSlotsForDate.find(av => av.slotId === slot.id);
    
    if (!availability) return 'unknown';
    
    // If slot is disabled, always return 'disabled'
    if (!availability.isAvailable) return 'disabled';
    
    if (availability.availableOrders > 10) return 'available';
    if (availability.availableOrders > 0) return 'limited';
    return 'full';
  };

  // Get availability percentage for color coding
  const getAvailabilityPercentage = (slot) => {
    const availableSlotsForDate = getAvailableSlotsForDate();
    const availability = availableSlotsForDate.find(av => av.slotId === slot.id);
    
    if (!availability) return 0; // Default to 0% if no data
    
    // Use displayOrderLimit as the total capacity for display purposes
    const totalCapacity = slot.displayOrderLimit || 10;
    const usedCapacity = totalCapacity - availability.availableOrders;
    const percentage = Math.round((usedCapacity / totalCapacity) * 100);
    
    return Math.max(0, Math.min(100, percentage)); // Clamp between 0-100
  };

  // Get color scheme based on availability percentage (new logic)
  const getAvailabilityColor = (slot) => {
    // Check if slot has expired for today (automatic disabling)
    if (isSlotExpired(slot)) {
      return {
        background: 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800',
        border: 'border-gray-300 dark:border-gray-600',
        hover: 'hover:border-gray-400 dark:hover:border-gray-500 hover:from-gray-100 hover:to-gray-150 dark:hover:from-gray-600 dark:hover:to-gray-700',
        selected: 'border-gray-500 dark:border-gray-500 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-600 dark:to-gray-700',
        status: 'Slot Closed',
        emoji: '⚪',
        dot: 'bg-gray-400 dark:bg-gray-500'
      };
    }
    
    const availableSlotsForDate = getAvailableSlotsForDate();
    const availability = availableSlotsForDate.find(av => av.slotId === slot.id);
    
    // If no availability data, show as unknown
    if (!availability) {
      return {
        background: 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800',
        border: 'border-gray-300 dark:border-gray-600',
        hover: 'hover:border-gray-400 dark:hover:border-gray-500 hover:from-gray-100 hover:to-gray-150 dark:hover:from-gray-600 dark:hover:to-gray-700',
        selected: 'border-gray-500 dark:border-gray-500 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-600 dark:to-gray-700',
        status: 'Fully Booked',
        emoji: '⚪',
        dot: 'bg-gray-400 dark:bg-gray-500'
      };
    }
    
    // If slot is disabled, always show as grey
    if (!availability.isAvailable) {
      return {
        background: 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800',
        border: 'border-gray-300 dark:border-gray-600',
        hover: 'hover:border-gray-400 dark:hover:border-gray-500 hover:from-gray-100 hover:to-gray-150 dark:hover:from-gray-600 dark:hover:to-gray-700',
        selected: 'border-gray-500 dark:border-gray-500 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-600 dark:to-gray-700',
        status: 'Fully Booked',
        emoji: '⚪',
        dot: 'bg-gray-400 dark:bg-gray-500'
      };
    }
    
    // Calculate availability percentage: (available orders / max orders) * 100
    const availableOrders = availability.availableOrders;
    const maxOrders = availability.maxOrders || availability.displayOrderLimit || 10;
    const availabilityPercentage = Math.round((availableOrders / maxOrders) * 100);
    
    // Fully booked
    if (availableOrders === 0) {
      return {
        background: 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800',
        border: 'border-gray-300 dark:border-gray-600',
        hover: 'hover:border-gray-400 dark:hover:border-gray-500 hover:from-gray-100 hover:to-gray-150 dark:hover:from-gray-600 dark:hover:to-gray-700',
        selected: 'border-gray-500 dark:border-gray-500 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-600 dark:to-gray-700',
        status: 'Fully Booked',
        emoji: '⚪',
        dot: 'bg-gray-400 dark:bg-gray-500'
      };
    } 
    // High availability (80-100%) - Build confidence, no urgency
    else if (availabilityPercentage >= 80) {
      return {
        background: 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-900/20',
        border: 'border-green-200 dark:border-green-800',
        hover: 'hover:border-green-300 dark:hover:border-green-700 hover:from-green-100 hover:to-green-150 dark:hover:from-green-900/40 dark:hover:to-green-900/30',
        selected: 'border-green-500 dark:border-green-500 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/40 dark:to-green-900/30',
        status: `Wide Open • ${availableOrders} Slots Available`,
        emoji: '🟢',
        dot: 'bg-green-500 dark:bg-green-400'
      };
    } 
    // Medium-high availability (50-79%) - Create awareness
    else if (availabilityPercentage >= 50) {
      return {
        background: 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-900/20',
        border: 'border-yellow-200 dark:border-yellow-800',
        hover: 'hover:border-yellow-300 dark:hover:border-yellow-700 hover:from-yellow-100 hover:to-yellow-150 dark:hover:from-yellow-900/40 dark:hover:to-yellow-900/30',
        selected: 'border-yellow-500 dark:border-yellow-500 bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/40 dark:to-yellow-900/30',
        status: `Limited Spots • ${availableOrders} Available`,
        emoji: '🟡',
        dot: 'bg-yellow-500 dark:bg-yellow-400'
      };
    } 
    // Medium-low availability (30-49%) - Build urgency
    else if (availabilityPercentage >= 30) {
      return {
        background: 'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-900/20',
        border: 'border-orange-200 dark:border-orange-800',
        hover: 'hover:border-orange-300 dark:hover:border-orange-700 hover:from-orange-100 hover:to-orange-150 dark:hover:from-orange-900/40 dark:hover:to-orange-900/30',
        selected: 'border-orange-500 dark:border-orange-500 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/40 dark:to-orange-900/30',
        status: availableOrders <= 3 ? `Hurry • Only ${availableOrders} Left` : `Filling Fast • ${availableOrders} Remaining`,
        emoji: '🟠',
        dot: 'bg-orange-500 dark:bg-orange-400'
      };
    } 
    // Low availability (10-29%) - Strong urgency
    else if (availabilityPercentage >= 10) {
      return {
        background: 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-900/20',
        border: 'border-red-200 dark:border-red-800',
        hover: 'hover:border-red-300 dark:hover:border-red-700 hover:from-red-100 hover:to-red-150 dark:hover:from-red-900/40 dark:hover:to-red-900/30',
        selected: 'border-red-500 dark:border-red-500 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-900/30',
        status: availableOrders === 1 ? 'Last Chance • Final Slot!' : `Last Few • Only ${availableOrders} Left`,
        emoji: '🔴',
        dot: 'bg-red-500 dark:bg-red-400'
      };
    } 
    // Critical availability (1-9%) - Maximum urgency
    else {
      return {
        background: 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-900/20',
        border: 'border-red-200 dark:border-red-800',
        hover: 'hover:border-red-300 dark:hover:border-red-700 hover:from-red-100 hover:to-red-150 dark:hover:from-red-900/40 dark:hover:to-red-900/30',
        selected: 'border-red-500 dark:border-red-500 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-900/30',
        status: availableOrders === 1 ? 'Last Chance • Final Slot!' : `Final Slots • ${availableOrders} Remaining`,
        emoji: '🔴',
        dot: 'bg-red-500 dark:bg-red-400'
      };
    }
  };

  // Get slot status color
  const getSlotStatusColor = (status) => {
    switch (status) {
      case 'available': return 'text-green-600 bg-green-50 border-green-200';
      case 'limited': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'full': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Check if a slot has expired for today (using start time)
  const isSlotExpired = (slot) => {
    if (!selectedDate) return false;
    
    const today = new Date();
    const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // Only check expiration for today's date
    if (selectedDateOnly.getTime() !== todayOnly.getTime()) {
      return false;
    }
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    // Parse slot start time
    const [startHour, startMin] = slot.startTime.split(':').map(Number);
    const slotStartTime = startHour * 60 + startMin;
    
    return currentTime >= slotStartTime;
  };

  // Get mobile status text and color - Enhanced with specific numbers and urgency
  const getMobileStatusInfo = (availability, slot) => {
    // Check if slot has expired for today (automatic disabling)
    if (isSlotExpired(slot)) {
      return { text: 'Slot Closed', color: 'text-gray-500 dark:text-gray-400' };
    }
    
    // Check if slot is manually disabled by admin
    if (!availability || !availability.isAvailable) {
      return { text: 'Fully Booked', color: 'text-gray-500 dark:text-gray-400' };
    }
    
    if (availability.availableOrders === 0) {
      return { text: 'Fully Booked', color: 'text-gray-500 dark:text-gray-400' };
    }
    
    const availableOrders = availability.availableOrders;
    const maxOrders = availability.maxOrders || availability.displayOrderLimit || 10;
    const percentage = Math.round((availableOrders / maxOrders) * 100);
    
    // High availability (80-100%) - No urgency, build confidence
    if (percentage >= 80) {
      return { text: 'Available', color: 'text-green-600 dark:text-green-400' };
    } 
    // Medium-high availability (50-79%) - Create awareness
    else if (percentage >= 50) {
      return { text: 'Filling Up', color: 'text-yellow-600 dark:text-yellow-400' };
    } 
    // Medium-low availability (30-49%) - Build urgency with specific numbers
    else if (percentage >= 30) {
      // Always show specific count for better urgency and clarity
      return { 
        text: availableOrders === 1 ? 'Last One!' : `Only ${availableOrders}`, 
        color: 'text-orange-600 dark:text-orange-400' 
      };
    } 
    // Low availability (10-29%) - Strong urgency with specific numbers
    else if (percentage >= 10) {
      return { 
        text: availableOrders === 1 ? 'Last One!' : `Last ${availableOrders}`, 
        color: 'text-red-600 dark:text-red-400' 
      };
    } 
    // Critical availability (1-9%) - Maximum urgency
    else {
      return { 
        text: availableOrders === 1 ? 'Last One!' : `Last ${availableOrders}`, 
        color: 'text-red-600 dark:text-red-400' 
      };
    }
  };

  // Get slot status icon
  const getSlotStatusIcon = (status) => {
    switch (status) {
      case 'available': return <CheckCircle className="w-4 h-4" />;
      case 'limited': return <AlertCircle className="w-4 h-4" />;
      case 'full': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // Format time for display
  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (loading && slots.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl border-l-4 border-green-500 dark:border-green-400 border border-gray-200 dark:border-gray-700 shadow-lg dark:shadow-xl dark:shadow-black/30 p-3 sm:p-4 lg:p-5 ${className}`}>
        <div className="flex items-center gap-2 pb-3 border-b border-gray-200 dark:border-gray-700 mb-4">
          <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30">
            <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">Select Delivery Time</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 dark:border-green-400"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading delivery slots...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl border-l-4 border-green-500 dark:border-green-400 border border-gray-200 dark:border-gray-700 shadow-lg dark:shadow-xl dark:shadow-black/30 p-3 sm:p-4 lg:p-5 ${className}`}>
        <div className="flex items-center gap-2 pb-3 border-b border-gray-200 dark:border-gray-700 mb-4">
          <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30">
            <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">Select Delivery Time</h3>
        </div>
        <div className="flex items-center text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border-l-4 border-green-500 dark:border-green-400 border border-gray-200 dark:border-gray-700 shadow-lg dark:shadow-xl dark:shadow-black/30 p-3 sm:p-4 lg:p-5 transition-all duration-300 hover:shadow-xl dark:hover:shadow-2xl dark:hover:shadow-black/40 hover:border-green-300 dark:hover:border-green-600 ${className}`}>
      {/* Header with Icon */}
      <div className="flex items-center gap-2 pb-3 border-b border-gray-200 dark:border-gray-700 mb-4">
        <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30">
          <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">Select Delivery Time</h3>
      </div>

      {/* Date Picker */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Select Date
          </h4>
          <div className="flex gap-1">
            <button
              onClick={() => scrollDates('prev')}
              className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollDates('next')}
              className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div 
          ref={scrollContainerRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {dates.map((date, index) => {
            const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
            const dateStr = formatDateForAPI(date);
            // Allow all dates to be selectable - availability will be checked when time slots are loaded
            const isDatePast = date < new Date().setHours(0, 0, 0, 0);
            
            return (
              <button
                key={index}
                onClick={() => handleDateSelect(date)}
                disabled={isDatePast}
                  className={`
                    flex-shrink-0 w-20 px-2 py-1.5 rounded-lg border transition-all duration-200 text-center
                    ${isSelected 
                      ? 'border-orange-500 dark:border-orange-400 bg-orange-50 dark:bg-orange-900/30 shadow-md dark:shadow-lg dark:shadow-black/20' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }
                    ${isDatePast ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
              >
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0">
                  {getDateLabel(date)}
                </div>
                <div className={`text-sm font-semibold ${isSelected ? 'text-orange-700 dark:text-orange-300' : 'text-gray-900 dark:text-gray-100'}`}>
                  {date.getDate()}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {date.toLocaleDateString('en-US', { month: 'short' })}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Slots - Compact Design */}
      {selectedDate && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4" />
            Choose Time Slot
          </h4>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-3">
            {slots.map((slot) => {
              const status = getSlotStatus(slot);
              const isSelected = selectedTimeSlot && selectedTimeSlot.id === slot.id;
              const isDisabled = status === 'full' || status === 'unknown' || status === 'disabled';
              const availabilityPercentage = getAvailabilityPercentage(slot);
              const colorScheme = getAvailabilityColor(slot);
              const availableSlotsForDate = getAvailableSlotsForDate();
              const availability = availableSlotsForDate.find(av => av.slotId === slot.id);
              
              return (
                <button
                  key={slot.id}
                  onClick={() => !isDisabled && handleTimeSlotSelect(slot)}
                  disabled={isDisabled}
                  className={`
                    relative p-2 md:p-4 lg:p-4 rounded-lg border text-center group
                    ${isSelected 
                      ? colorScheme.selected + ' border-2 shadow-sm dark:shadow-md dark:shadow-black/20' 
                      : isDisabled
                        ? 'border border-gray-300 dark:border-gray-600 md:border-gray-200 bg-gray-50 dark:bg-gray-700/50 opacity-50 cursor-not-allowed'
                        : colorScheme.background + ' border border-gray-300 dark:border-gray-600 md:border-gray-200 ' + colorScheme.hover + ' cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 md:hover:border-gray-300'
                    }
                  `}
                >
                  {/* Time Display */}
                  <div className={`text-xs md:text-xs lg:text-sm font-semibold leading-tight ${isSelected ? 'text-gray-800 dark:text-gray-200' : 'text-gray-900 dark:text-gray-100'}`}>
                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                  </div>
                  
                  {/* Mobile Status Text - Only visible on mobile */}
                  <div className="block md:hidden mt-0.5">
                    <div className={`text-[9px] font-light leading-none ${getMobileStatusInfo(availability, slot).color}`}>
                      {getMobileStatusInfo(availability, slot).text}
                    </div>
                  </div>
                  
                  {/* Desktop Availability Status Badge - Only visible on desktop */}
                  <div className="absolute top-1 right-1 hidden md:block">
                    <div className={`
                      w-2 h-2 rounded-full
                      ${colorScheme.dot}
                    `} />
                  </div>
                  
                  {/* Hover Tooltip - Only visible on desktop - Enhanced with detailed status */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-800 dark:bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 hidden md:block shadow-lg">
                    <div className="flex items-center gap-1.5">
                      <span>{colorScheme.emoji}</span>
                      <span className="font-medium">{colorScheme.status}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Slot Summary */}
      {selectedTimeSlot && selectedDate && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Delivery Slot Selected</span>
          </div>
          <div className="text-xs text-green-600 dark:text-green-400 mt-1">
            {formatDateForDisplay(selectedDate)} • {selectedTimeSlot.slotName} ({formatTime(selectedTimeSlot.startTime)} - {formatTime(selectedTimeSlot.endTime)})
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliverySlotSelector;
