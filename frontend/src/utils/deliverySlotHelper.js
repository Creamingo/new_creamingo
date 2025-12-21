// Utility functions for delivery slot management
import deliverySlotApi from '../api/deliverySlotApi';

/**
 * Format date to YYYY-MM-DD string
 */
const formatDateForAPI = (date) => {
  if (!date) return null;
  
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }
  
  if (typeof date === 'string') {
    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    // Try to parse and format
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  }
  
  return null;
};

/**
 * Check if a slot has expired for today (using start time)
 */
const isSlotExpiredForToday = (slot, date) => {
  if (!slot || !date) return false;
  
  const today = new Date();
  const selectedDate = date instanceof Date ? date : new Date(date);
  
  // Only check expiration for today's date
  const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  if (selectedDateOnly.getTime() !== todayOnly.getTime()) {
    return false; // Not today, so not expired
  }
  
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  // Parse slot start time
  if (!slot.startTime) return false;
  
  try {
    const [startHour, startMin] = slot.startTime.split(':').map(Number);
    const slotStartTime = startHour * 60 + startMin;
    
    return currentTime >= slotStartTime;
  } catch (e) {
    console.warn('Error parsing slot start time:', e);
    return false;
  }
};

/**
 * Find the next available delivery slot
 * @param {string|Date} currentDate - The current delivery date
 * @param {number} currentSlotId - The current slot ID (optional, to skip if expired)
 * @param {number} maxDaysToCheck - Maximum days to look ahead (default: 7)
 * @returns {Promise<Object|null>} Next available slot with date, or null if none found
 */
export const findNextAvailableSlot = async (currentDate, currentSlotId = null, maxDaysToCheck = 7) => {
  try {
    const startDate = formatDateForAPI(currentDate);
    if (!startDate) {
      console.error('Invalid current date format');
      return null;
    }

    // Get all active delivery slots first
    const slotsResponse = await deliverySlotApi.getDeliverySlots();
    if (!slotsResponse.success || !slotsResponse.data) {
      console.error('Failed to fetch delivery slots');
      return null;
    }

    const activeSlots = slotsResponse.data.filter(slot => slot.isActive);
    if (activeSlots.length === 0) {
      console.warn('No active delivery slots available');
      return null;
    }

    // Sort slots by start time
    activeSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));

    // Check availability starting from current date, then next days
    const start = new Date(startDate);
    
    for (let dayOffset = 0; dayOffset < maxDaysToCheck; dayOffset++) {
      const checkDate = new Date(start);
      checkDate.setDate(checkDate.getDate() + dayOffset);
      const dateStr = formatDateForAPI(checkDate);
      
      if (!dateStr) continue;

      try {
        // Get availability for this date
        const availabilityResponse = await deliverySlotApi.getSlotsForDate(dateStr);
        
        if (!availabilityResponse.success || !availabilityResponse.data) {
          continue; // Try next date
        }

        const availabilityData = availabilityResponse.data;

        // Find the first available slot for this date
        for (const slot of activeSlots) {
          // Skip if this is the expired slot and we're checking the same date
          if (dayOffset === 0 && currentSlotId && slot.id === currentSlotId) {
            continue;
          }

          // Check if slot is expired for today
          if (dayOffset === 0 && isSlotExpiredForToday(slot, checkDate)) {
            continue;
          }

          // Find availability for this slot
          const slotAvailability = availabilityData.find(
            av => av.slotId === slot.id
          );

          if (slotAvailability && slotAvailability.isAvailable && slotAvailability.availableOrders > 0) {
            // Found an available slot!
            return {
              date: dateStr,
              dateObj: checkDate,
              slot: {
                id: slot.id,
                slotName: slot.slotName,
                startTime: slot.startTime,
                endTime: slot.endTime,
                displayOrderLimit: slot.displayOrderLimit || 10
              },
              availability: {
                availableOrders: slotAvailability.availableOrders,
                isAvailable: slotAvailability.isAvailable
              }
            };
          }
        }
      } catch (error) {
        console.warn(`Error checking availability for ${dateStr}:`, error);
        continue; // Try next date
      }
    }

    // No available slot found within the search range
    return null;
  } catch (error) {
    console.error('Error finding next available slot:', error);
    return null;
  }
};

/**
 * Format time for display
 */
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

/**
 * Format slot for display
 */
export const formatSlotDisplay = (slotData) => {
  if (!slotData || !slotData.slot) return 'N/A';
  
  const { slot, dateObj } = slotData;
  const dateStr = dateObj ? dateObj.toLocaleDateString('en-US', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short' 
  }) : '';
  
  const timeStr = slot.startTime && slot.endTime
    ? `${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`
    : slot.startTime
    ? formatTime(slot.startTime)
    : 'N/A';
  
  return dateStr ? `${dateStr} • ${timeStr}` : timeStr;
};

// Export formatTime for use in other files
export { formatTime };

export default {
  findNextAvailableSlot,
  formatSlotDisplay,
  formatDateForAPI
};

