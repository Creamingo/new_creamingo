// Cache for delivery-related settings to avoid repeated database queries
let freeDeliveryThresholdCache = {
  value: 1500, // Default value
  lastUpdated: null,
  cacheDuration: 5 * 60 * 1000 // 5 minutes cache
};

// Get free delivery threshold from settings with caching
const getFreeDeliveryThreshold = async () => {
  const { query } = require('../config/db');
  
  try {
    // Check if cache is still valid
    const now = Date.now();
    if (freeDeliveryThresholdCache.lastUpdated && 
        (now - freeDeliveryThresholdCache.lastUpdated) < freeDeliveryThresholdCache.cacheDuration) {
      return freeDeliveryThresholdCache.value;
    }

    // Fetch from database
    const result = await query(
      'SELECT value FROM settings WHERE key = ?',
      ['free_delivery_threshold']
    );

    if (result.rows && result.rows.length > 0) {
      try {
        const value = JSON.parse(result.rows[0].value);
        const threshold = parseFloat(value) || 1500;
        
        // Update cache
        freeDeliveryThresholdCache.value = threshold;
        freeDeliveryThresholdCache.lastUpdated = now;
        
        return threshold;
      } catch (error) {
        // If value is not JSON, try direct parse
        const threshold = parseFloat(result.rows[0].value) || 1500;
        freeDeliveryThresholdCache.value = threshold;
        freeDeliveryThresholdCache.lastUpdated = now;
        return threshold;
      }
    }

    // If not found, use default and cache it
    freeDeliveryThresholdCache.value = 1500;
    freeDeliveryThresholdCache.lastUpdated = now;
    return 1500;
  } catch (error) {
    console.error('Error fetching free delivery threshold:', error);
    // Return cached value or default on error
    return freeDeliveryThresholdCache.value || 1500;
  }
};

// Clear cache (call this when settings are updated)
const clearFreeDeliveryThresholdCache = () => {
  freeDeliveryThresholdCache.lastUpdated = null;
};

module.exports = {
  getFreeDeliveryThreshold,
  clearFreeDeliveryThresholdCache
};

