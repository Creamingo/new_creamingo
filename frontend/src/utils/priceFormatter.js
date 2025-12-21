/**
 * Format price with consistent rules:
 * - Show up to 2 decimal places only when decimals exist
 * - If the value is a whole number, do not show ".00"
 * 
 * @param {number|string} amount - The amount to format
 * @param {string} currencySymbol - Currency symbol to use (default: '₹')
 * @returns {string} Formatted price string
 * 
 * @example
 * formatPrice(100) => "₹100"
 * formatPrice(100.5) => "₹100.5"
 * formatPrice(100.50) => "₹100.5"
 * formatPrice(100.55) => "₹100.55"
 * formatPrice(100.00) => "₹100"
 */
export const formatPrice = (amount, currencySymbol = '₹') => {
  // Handle null, undefined, or invalid values
  if (amount === null || amount === undefined || amount === '') {
    return `${currencySymbol}0`;
  }

  // Convert to number if string
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  // Check if valid number
  if (isNaN(numAmount)) {
    return `${currencySymbol}0`;
  }

  // Check if it's a whole number
  if (numAmount % 1 === 0) {
    return `${currencySymbol}${numAmount.toFixed(0)}`;
  }

  // Has decimals - format to remove trailing zeros
  const formatted = numAmount.toFixed(2);
  // Remove trailing zeros and decimal point if not needed
  const trimmed = formatted.replace(/\.?0+$/, '');
  
  return `${currencySymbol}${trimmed}`;
};

/**
 * Format price without currency symbol (just the number)
 * Useful for cases where currency symbol is added separately
 * 
 * @param {number|string} amount - The amount to format
 * @returns {string} Formatted price string without currency symbol
 */
export const formatPriceNumber = (amount) => {
  if (amount === null || amount === undefined || amount === '') {
    return '0';
  }

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return '0';
  }

  if (numAmount % 1 === 0) {
    return numAmount.toFixed(0);
  }

  const formatted = numAmount.toFixed(2);
  const trimmed = formatted.replace(/\.?0+$/, '');
  
  return trimmed;
};

