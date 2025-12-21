// Timezone utility functions for IST (Indian Standard Time)

/**
 * Get current IST time as SQLite datetime string
 * IST is UTC+5:30
 * Returns format: 'YYYY-MM-DD HH:MM:SS'
 */
const getCurrentIST = () => {
  const now = new Date();
  
  // Get UTC time
  const utcTime = now.getTime();
  
  // Convert to IST (UTC+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
  const istTime = new Date(utcTime + istOffset);
  
  // Format as SQLite datetime string (YYYY-MM-DD HH:MM:SS)
  // Use UTC methods since we've already added the offset
  const year = istTime.getUTCFullYear();
  const month = String(istTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istTime.getUTCDate()).padStart(2, '0');
  const hours = String(istTime.getUTCHours()).padStart(2, '0');
  const minutes = String(istTime.getUTCMinutes()).padStart(2, '0');
  const seconds = String(istTime.getUTCSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * Convert SQLite datetime string to ISO string for frontend display
 * SQLite's datetime('now') stores in UTC
 * Our getCurrentIST() stores IST time directly
 * 
 * The frontend will format with timeZone: 'Asia/Kolkata', so we need to return
 * an ISO string that, when converted to IST, shows the correct time.
 */
const convertToIST = (dateString) => {
  if (!dateString) return null;
  
  // If already in ISO format, return as is
  if (dateString.includes('T') || dateString.includes('Z')) {
    return dateString;
  }
  
  // SQLite format: 'YYYY-MM-DD HH:MM:SS'
  const [datePart, timePart] = dateString.split(' ');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes, seconds = 0] = timePart.split(':').map(Number);
  
  // SQLite's datetime('now') returns UTC time
  // Create ISO string directly from UTC time
  // When frontend formats with timeZone: 'Asia/Kolkata', it will automatically add 5:30
  const dateAsUTC = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
  return dateAsUTC.toISOString();
};

/**
 * Convert any date to IST ISO string
 */
const toISTISO = (date) => {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(d.getTime() + istOffset);
  return istDate.toISOString();
};

module.exports = {
  getCurrentIST,
  convertToIST,
  toISTISO
};

