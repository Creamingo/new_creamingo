import React, { useState, useEffect } from 'react';
import { Check, Star } from 'lucide-react';
import { Subcategory } from '../../types';
import { cn } from '../../utils/cn';

export interface FlavorSelectorProps {
  subcategories: Subcategory[];
  selectedSubcategoryIds?: number[];
  selectedFlavorIds: number[];
  primaryFlavorId?: number;
  onFlavorsChange: (flavorIds: number[]) => void;
  onPrimaryFlavorChange: (flavorId: number) => void;
  error?: string;
  disabled?: boolean;
}

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

export const FlavorSelector: React.FC<FlavorSelectorProps> = ({
  subcategories,
  selectedSubcategoryIds: _selectedSubcategoryIds = [],
  selectedFlavorIds,
  primaryFlavorId,
  onFlavorsChange,
  onPrimaryFlavorChange,
  error,
  disabled = false
}) => {
  const [availableFlavors, setAvailableFlavors] = useState<Subcategory[]>([]);

  // Filter subcategories to only show flavor-related ones
  useEffect(() => {
    const flavorSubcategories = subcategories.filter(subcat => 
      FLAVOR_SUBCATEGORY_IDS.includes(Number(subcat.id))
    );
    setAvailableFlavors(flavorSubcategories);
  }, [subcategories]);

  // Handle flavor selection
  const handleFlavorToggle = (flavorId: number) => {
    if (disabled) return;

    const newSelected = selectedFlavorIds.includes(flavorId)
      ? selectedFlavorIds.filter(id => id !== flavorId)
      : [...selectedFlavorIds, flavorId];

    onFlavorsChange(newSelected);
  };

  // Get selected flavors for display
  const selectedFlavors = availableFlavors.filter(flavor => selectedFlavorIds.includes(Number(flavor.id)));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Available Flavors
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Select additional flavors this cake can be made in
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedFlavorIds.length > 0 && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {selectedFlavorIds.length} selected
            </span>
          )}
          {availableFlavors.length > 1 && (
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => onFlavorsChange(availableFlavors.map(f => Number(f.id)))}
                disabled={disabled || selectedFlavorIds.length === availableFlavors.length}
                className="text-xs px-2 py-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={() => onFlavorsChange([])}
                disabled={disabled || selectedFlavorIds.length === 0}
                className="text-xs px-2 py-1 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {/* Flavors Grid */}
      {availableFlavors.length === 0 ? (
        <div className="flex items-center justify-center h-32 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
          <div className="text-center">
            <div className="text-2xl mb-2">🍰</div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No flavor subcategories available
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {availableFlavors.map(flavor => {
            const isSelected = selectedFlavorIds.includes(Number(flavor.id));
            const isPrimary = primaryFlavorId === Number(flavor.id);
            
            return (
              <div
                key={flavor.id}
                className={cn(
                  "relative cursor-pointer rounded-lg border-2 p-3 transition-all duration-200 hover:shadow-md hover:scale-105",
                  isSelected
                    ? "border-rose-500 bg-rose-50 dark:bg-rose-900/20 shadow-sm"
                    : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => handleFlavorToggle(Number(flavor.id))}
              >
                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  </div>
                )}

                {/* Primary Indicator */}
                {isPrimary && (
                  <div className="absolute top-2 left-2">
                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                  </div>
                )}

                {/* Flavor Content */}
                <div className="text-center">
                  {/* Flavor Icon */}
                  <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center text-lg">
                    {getFlavorIcon(flavor.name)}
                  </div>
                  
                  {/* Flavor Name */}
                  <h4 className={cn(
                    "text-sm font-medium truncate leading-tight",
                    isSelected 
                      ? "text-rose-900 dark:text-rose-100" 
                      : "text-gray-900 dark:text-white"
                  )}>
                    {flavor.name}
                  </h4>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Primary Flavor Selection */}
      {selectedFlavors.length > 1 && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Primary Flavor
            <span className="text-xs text-gray-500 ml-1">(default flavor for display)</span>
          </label>
          
          <div className="flex flex-wrap gap-2">
            {selectedFlavors.map(flavor => (
              <button
                key={flavor.id}
                type="button"
                onClick={() => onPrimaryFlavorChange(Number(flavor.id))}
                disabled={disabled}
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors",
                  primaryFlavorId === Number(flavor.id)
                    ? "bg-rose-100 dark:bg-rose-900 border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200 shadow-sm"
                    : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <Star className={cn(
                  "w-4 h-4",
                  primaryFlavorId === Number(flavor.id) ? "fill-current" : ""
                )} />
                {getFlavorIcon(flavor.name)}
                {flavor.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Show primary flavor indicator */}
      {selectedFlavors.length === 1 && (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-rose-50 dark:bg-rose-900/20 px-3 py-2 rounded-lg">
          <Star className="w-4 h-4 fill-current text-rose-500" />
          <span>Primary Flavor: {selectedFlavors[0].name}</span>
        </div>
      )}

      {/* Summary */}
      {selectedFlavorIds.length > 0 && (
        <div className="p-4 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-lg border border-rose-200 dark:border-rose-800">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            🍰 Flavor Selection Summary
          </h4>
          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <span className="font-medium">Available Flavors:</span> 
              <span className="px-2 py-1 bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200 rounded text-sm font-medium">
                {selectedFlavorIds.length}
              </span>
              {primaryFlavorId && (
                <span className="text-rose-600 dark:text-rose-400">
                  (⭐ {subcategories.find(s => Number(s.id) === primaryFlavorId)?.name})
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Customers will be able to select from these flavors on the product page
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get flavor icons
const getFlavorIcon = (flavorName: string): string => {
  const iconMap: { [key: string]: string } = {
    'Chocolate': '🍫',
    'Choco Truffle': '🍫',
    'Vanilla': '🍦',
    'Strawberry': '🍓',
    'Butterscotch': '🧈',
    'Red Velvet': '❤️',
    'Black Forest': '🌲',
    'Pineapple': '🍍',
    'Mixed Fruit': '🍎',
    'Mixed Fruits': '🍎',
    'Blueberry': '🫐',
  };
  
  return iconMap[flavorName] || '🍰';
};

export default FlavorSelector;
