'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

const FlavorSelector = ({ 
  product, 
  selectedFlavor, 
  onFlavorChange,
  onFlavorContentUpdate
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasUserSelected, setHasUserSelected] = useState(false);
  const dropdownRef = useRef(null);

  // Define flavor subcategory IDs based on the backend mapping
  const FLAVOR_SUBCATEGORY_IDS = [
    9,  // Chocolate
    10, // Choco Truffle
    11, // Pineapple
    12, // Red Velvet
    13, // Butterscotch
    14, // Black Forest
    15, // Strawberry
    16, // Mixed Fruit
    17, // Vanilla
    18, // Blueberry
  ];

  // Get available flavors from product subcategories
  const getAvailableFlavors = () => {
    if (!product.subcategories || !Array.isArray(product.subcategories)) {
      return [];
    }
    
    const flavors = product.subcategories
      .filter(subcat => FLAVOR_SUBCATEGORY_IDS.includes(Number(subcat.id)));
    
    // Sort: Primary flavor first, then others alphabetically
    return flavors.sort((a, b) => {
      const aIsPrimary = a.is_primary === 1;
      const bIsPrimary = b.is_primary === 1;
      
      // Primary flavors come first
      if (aIsPrimary && !bIsPrimary) return -1;
      if (!aIsPrimary && bIsPrimary) return 1;
      
      // Both primary or both not primary - sort alphabetically
      return a.name.localeCompare(b.name);
    });
  };

  const availableFlavors = getAvailableFlavors();

  // Reset hasUserSelected when selectedFlavor is cleared (e.g., on page refresh)
  useEffect(() => {
    if (!selectedFlavor) {
      setHasUserSelected(false);
    }
  }, [selectedFlavor]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  // Don't render if no flavors are available
  if (availableFlavors.length === 0) {
    return null;
  }

  // Generate flavor-specific content (Frontend-only, SEO-safe)
  const generateFlavorContent = (flavor) => {
    if (!flavor || !product) return null;

    const baseName = product.name;
    const flavorName = flavor.name;
    
    // Smart flavor replacement in title (case-insensitive)
    const flavorSpecificName = replaceFlavorInTitle(baseName, flavorName);
    
    // Create flavor-specific description with updated Cake Flavour
    const baseDescription = product.description || '';
    
    // Update the Cake Flavour field in the description
    let updatedDescription = baseDescription;
    
    // Check if description contains "Cake Flavour:" and update it
    if (baseDescription.includes('Cake Flavour:')) {
      // Replace existing Cake Flavour with selected flavor
      updatedDescription = baseDescription.replace(
        /Cake Flavour:\s*[^\n]*/i,
        `Cake Flavour: ${flavorName}`
      );
    } else {
      // If no Cake Flavour field exists, add it at the beginning
      updatedDescription = `Cake Flavour: ${flavorName}\n${baseDescription}`;
    }
    
    return {
      name: flavorSpecificName,
      description: updatedDescription,
      flavor: flavor
    };
  };

  // Helper function to replace flavor in title (SEO-safe, frontend-only)
  const replaceFlavorInTitle = (title, newFlavor) => {
    // Define flavor names to look for (case-insensitive)
    const flavorNames = [
      'Chocolate', 'Choco Truffle', 'Vanilla', 'Strawberry', 'Butterscotch',
      'Red Velvet', 'Black Forest', 'Pineapple', 'Mixed Fruit', 'Mixed Fruits', 'Blueberry'
    ];
    
    let updatedTitle = title;
    let foundExistingFlavor = false;
    
    // Find and replace existing flavor in title
    for (const flavor of flavorNames) {
      // Create case-insensitive regex to match the flavor name
      const regex = new RegExp(`\\b${flavor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      
      if (regex.test(updatedTitle)) {
        // Check if the found flavor is the same as the new flavor
        if (flavor.toLowerCase() === newFlavor.toLowerCase()) {
          // If it's the same flavor, return the original title without duplication
          return title;
        } else {
          // Replace the found flavor with the new flavor
          updatedTitle = updatedTitle.replace(regex, newFlavor);
          foundExistingFlavor = true;
          break; // Only replace the first match
        }
      }
    }
    
    // If no existing flavor found, add new flavor at the beginning
    if (!foundExistingFlavor) {
      updatedTitle = `${newFlavor} ${title}`;
    }
    
    return updatedTitle;
  };

  const handleFlavorSelect = (flavor) => {
    onFlavorChange(flavor);
    setHasUserSelected(true); // Mark that user has actively selected a flavor
    
    // Generate and send flavor-specific content
    const flavorContent = generateFlavorContent(flavor);
    if (flavorContent && onFlavorContentUpdate) {
      onFlavorContentUpdate(flavorContent);
    }
    
    setIsExpanded(false);
  };

  // Helper function removed - no icons needed

  return (
    <div className="space-y-2 w-full">
      <div className="flex items-center justify-between gap-2 w-full min-w-0">
        <label className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex-shrink min-w-0">
          Try this in another flavour (optional)
        </label>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">
          {availableFlavors.length} available
        </span>
      </div>

      {/* Flavor Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-full flex items-center justify-between p-3.5 rounded-lg border-2 bg-white dark:bg-gray-800 transition-all ${
            isExpanded 
              ? 'border-rose-500 dark:border-rose-400 shadow-md dark:shadow-lg dark:shadow-black/20' 
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {selectedFlavor && selectedFlavor.is_primary === 1 && (
              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-green-500 dark:bg-green-400"></div>
            )}
            <span className={`text-sm font-semibold truncate ${
              selectedFlavor 
                ? selectedFlavor.is_primary === 1 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-gray-900 dark:text-gray-100'
                : 'text-gray-500 dark:text-gray-400'
            }`}>
              {selectedFlavor ? selectedFlavor.name : '-- Select Flavour --'}
            </span>
          </div>
          <ChevronDown 
            className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${
              isExpanded 
                ? 'rotate-180 text-rose-500 dark:text-rose-400' 
                : 'text-gray-400 dark:text-gray-500'
            }`} 
          />
        </button>

        {/* Dropdown Menu - Matching Sort By Style */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl dark:shadow-black/40 z-50 overflow-hidden backdrop-blur-sm max-h-60 overflow-y-auto"
          >
            <div className="py-1.5">
              {availableFlavors.map((flavor) => {
                const isPrimary = flavor.is_primary === 1;
                const isSelected = selectedFlavor?.id === flavor.id;
                
                return (
                  <button
                    key={flavor.id}
                    type="button"
                    onClick={() => handleFlavorSelect(flavor)}
                    className={`w-full text-left px-4 py-3 text-sm font-inter transition-all duration-200 flex items-center justify-between ${
                      isSelected 
                        ? 'bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 font-semibold border-l-2 border-pink-500 dark:border-pink-400' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <span>{flavor.name}</span>
                    {isPrimary ? (
                      <span className="text-xs font-semibold text-pink-600 dark:text-pink-400">Primary</span>
                    ) : isSelected ? (
                      <div className="w-2 h-2 rounded-full bg-pink-500 dark:bg-pink-400"></div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>

      {/* Selected Flavor Info - Only show after user actively selects */}
      {selectedFlavor && hasUserSelected && (
        <div className={`text-sm font-medium mt-2 ${
          selectedFlavor.is_primary === 1
            ? 'text-green-600 dark:text-green-400'
            : 'text-amber-700 dark:text-amber-400'
        }`}>
          {selectedFlavor.is_primary === 1
            ? `• Primary flavour – Cake will be made in ${selectedFlavor.name.toLowerCase()}.`
            : `• Your cake will be made in ${selectedFlavor.name.toLowerCase()} flavour.`
          }
        </div>
      )}
    </div>
  );
};

export default FlavorSelector;
