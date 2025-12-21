/**
 * Dynamic Title Utility for Subcategory-Based Product Title Generation
 * 
 * This utility generates contextually relevant product titles based on the current subcategory.
 * It replaces existing flavor names in product titles with the current subcategory flavor,
 * making titles more relevant to the browsing context.
 * 
 * SEO-Safe: This is frontend-only and doesn't affect URLs, meta tags, or canonical URLs.
 */

/**
 * Generate a dynamic product title based on the current subcategory
 * @param {string} productName - The original product name
 * @param {string} currentSubcategoryName - The name of the current subcategory being viewed
 * @returns {string} - The dynamically generated title
 */
export const generateDynamicTitle = (productName, currentSubcategoryName) => {
  // If no subcategory context, return original name
  if (!currentSubcategoryName || !productName) {
    return productName;
  }

  // Ensure both inputs are strings
  if (typeof productName !== 'string' || typeof currentSubcategoryName !== 'string') {
    return productName;
  }

  // Trim whitespace
  const trimmedProductName = productName.trim();
  const trimmedSubcategoryName = currentSubcategoryName.trim();

  if (!trimmedProductName || !trimmedSubcategoryName) {
    return productName;
  }

  // Define flavor names to look for (case-insensitive)
  const flavorNames = [
    'Chocolate', 'Choco Truffle', 'Vanilla', 'Strawberry', 'Butterscotch',
    'Red Velvet', 'Black Forest', 'Pineapple', 'Mixed Fruit', 'Mixed Fruits', 'Blueberry'
  ];
  
  let updatedTitle = trimmedProductName;
  let foundExistingFlavor = false;
  
  // Find and replace existing flavor in title
  for (const flavor of flavorNames) {
    // Create case-insensitive regex to match the flavor name
    const regex = new RegExp(`\\b${flavor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    
    if (regex.test(updatedTitle)) {
      // Check if the found flavor is the same as the current subcategory
      if (flavor.toLowerCase() === trimmedSubcategoryName.toLowerCase()) {
        // If it's the same flavor, return the original title (no duplication)
        return trimmedProductName;
      } else {
        // Replace the found flavor with the current subcategory flavor
        updatedTitle = updatedTitle.replace(regex, trimmedSubcategoryName);
        foundExistingFlavor = true;
        break; // Only replace the first match
      }
    }
  }
  
  // If no existing flavor found, add current subcategory at the beginning
  if (!foundExistingFlavor) {
    updatedTitle = `${trimmedSubcategoryName} ${trimmedProductName}`;
  }
  
  return updatedTitle;
};

/**
 * Check if a product title contains any flavor keywords
 * @param {string} productName - The product name to check
 * @returns {boolean} - True if the product name contains flavor keywords
 */
export const hasFlavorKeywords = (productName) => {
  if (!productName) return false;
  
  const flavorNames = [
    'Chocolate', 'Choco Truffle', 'Vanilla', 'Strawberry', 'Butterscotch',
    'Red Velvet', 'Black Forest', 'Pineapple', 'Mixed Fruit', 'Mixed Fruits', 'Blueberry'
  ];
  
  return flavorNames.some(flavor => {
    const regex = new RegExp(`\\b${flavor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    return regex.test(productName);
  });
};

/**
 * Get the primary flavor from a product name
 * @param {string} productName - The product name to analyze
 * @returns {string|null} - The primary flavor found, or null if none found
 */
export const getPrimaryFlavor = (productName) => {
  if (!productName) return null;
  
  const flavorNames = [
    'Chocolate', 'Choco Truffle', 'Vanilla', 'Strawberry', 'Butterscotch',
    'Red Velvet', 'Black Forest', 'Pineapple', 'Mixed Fruit', 'Mixed Fruits', 'Blueberry'
  ];
  
  for (const flavor of flavorNames) {
    const regex = new RegExp(`\\b${flavor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    if (regex.test(productName)) {
      return flavor;
    }
  }
  
  return null;
};
