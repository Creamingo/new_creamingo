import React, { useState, useEffect } from 'react';
import { Star, Check } from 'lucide-react';
import { Category, Subcategory } from '../../types';
import { cn } from '../../utils/cn';

export interface CategoryGridSelectorProps {
  categories: Category[];
  subcategories: Subcategory[];
  selectedCategoryIds: number[];
  selectedSubcategoryIds: number[];
  primaryCategoryId?: number;
  primarySubcategoryId?: number;
  onCategoriesChange: (categoryIds: number[]) => void;
  onSubcategoriesChange: (subcategoryIds: number[]) => void;
  onPrimaryCategoryChange: (categoryId: number) => void;
  onPrimarySubcategoryChange: (subcategoryId: number) => void;
  error?: string;
  disabled?: boolean;
}

export const CategoryGridSelector: React.FC<CategoryGridSelectorProps> = ({
  categories,
  subcategories,
  selectedCategoryIds,
  selectedSubcategoryIds,
  primaryCategoryId,
  primarySubcategoryId,
  onCategoriesChange,
  onSubcategoriesChange,
  onPrimaryCategoryChange,
  onPrimarySubcategoryChange,
  error,
  disabled = false
}) => {
  const [availableSubcategories, setAvailableSubcategories] = useState<Subcategory[]>([]);

  // Filter subcategories based on selected categories
  useEffect(() => {
    if (selectedCategoryIds.length === 0) {
      setAvailableSubcategories([]);
      return;
    }

    const filtered = subcategories.filter(subcat => 
      selectedCategoryIds.includes(Number(subcat.category_id))
    );
    setAvailableSubcategories(filtered);
  }, [selectedCategoryIds, subcategories]);

  // Clear subcategories that are no longer valid when categories change
  useEffect(() => {
    const validSubcategoryIds = selectedSubcategoryIds.filter(subcatId => {
      const subcat = subcategories.find(s => s.id === subcatId);
      return subcat && selectedCategoryIds.includes(Number(subcat.category_id));
    });

    if (validSubcategoryIds.length !== selectedSubcategoryIds.length) {
      onSubcategoriesChange(validSubcategoryIds);
    }
  }, [selectedCategoryIds, selectedSubcategoryIds, subcategories, onSubcategoriesChange]);

  // Clear primary subcategory if it's no longer valid
  useEffect(() => {
    if (primarySubcategoryId && availableSubcategories.length > 0) {
      const isValid = availableSubcategories.some(subcat => subcat.id === primarySubcategoryId);
      if (!isValid) {
        onPrimarySubcategoryChange(Number(availableSubcategories[0].id));
      }
    }
  }, [availableSubcategories, primarySubcategoryId, onPrimarySubcategoryChange]);

  // Handle category selection
  const handleCategoryToggle = (categoryId: number) => {
    if (disabled) return;

    const newSelected = selectedCategoryIds.includes(categoryId)
      ? selectedCategoryIds.filter(id => id !== categoryId)
      : [...selectedCategoryIds, categoryId];

    onCategoriesChange(newSelected);
  };

  // Handle subcategory selection
  const handleSubcategoryToggle = (subcategoryId: number) => {
    if (disabled) return;

    const newSelected = selectedSubcategoryIds.includes(subcategoryId)
      ? selectedSubcategoryIds.filter(id => id !== subcategoryId)
      : [...selectedSubcategoryIds, subcategoryId];

    onSubcategoriesChange(newSelected);
  };


  // Get subcategories for a specific category
  const getSubcategoriesForCategory = (categoryId: number) => {
    return availableSubcategories.filter(subcat => Number(subcat.category_id) === categoryId);
  };

  // Get selected categories for display
  const selectedCategories = categories.filter(cat => selectedCategoryIds.includes(Number(cat.id)));
  const selectedSubcategories = availableSubcategories.filter(subcat => selectedSubcategoryIds.includes(Number(subcat.id)));

  return (
    <div className="space-y-4">
      {/* Two-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
        
        {/* Left Panel: Categories (40% width) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Categories
            </label>
            <div className="flex items-center gap-2">
              {selectedCategoryIds.length > 0 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedCategoryIds.length} selected
                </span>
              )}
              {categories.length > 1 && (
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => onCategoriesChange(categories.map(c => Number(c.id)))}
                    disabled={disabled || selectedCategoryIds.length === categories.length}
                    className="text-xs px-2 py-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => onCategoriesChange([])}
                    disabled={disabled || selectedCategoryIds.length === 0}
                    className="text-xs px-2 py-1 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Categories Grid - 3x3 for maximum compactness */}
          <div className="grid grid-cols-3 gap-1.5">
          {categories.map(category => {
            const isSelected = selectedCategoryIds.includes(Number(category.id));
            const isPrimary = primaryCategoryId === Number(category.id);
            const categorySubcategories = getSubcategoriesForCategory(Number(category.id));
            const hasSubcategories = categorySubcategories.length > 0;
            
            return (
              <div key={category.id} className="relative">
                {/* Category Card */}
                <div
                  className={cn(
                    "relative cursor-pointer rounded-md border-2 p-1.5 transition-all duration-200 hover:shadow-sm hover:scale-105",
                    isSelected
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md"
                      : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500",
                    disabled && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => handleCategoryToggle(Number(category.id))}
                >
                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="absolute top-0.5 right-0.5">
                      <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check className="w-2 h-2 text-white" />
                      </div>
                    </div>
                  )}

                  {/* Primary Indicator */}
                  {isPrimary && (
                    <div className="absolute top-0.5 left-0.5">
                      <Star className="w-2.5 h-2.5 text-yellow-500 fill-current" />
                    </div>
                  )}

                  {/* Category Image */}
                  <div className="w-full h-10 mb-1 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700">
                    {category.image_url ? (
                      <img
                        src={category.image_url}
                        alt={category.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-400 text-xs">📁</span>
                      </div>
                    )}
                  </div>

                  {/* Category Name */}
                  <div className="text-center">
                    <h3 className={cn(
                      "text-xs font-medium truncate leading-tight",
                      isSelected 
                        ? "text-blue-900 dark:text-blue-100" 
                        : "text-gray-900 dark:text-white"
                    )}>
                      {category.name}
                    </h3>
                    {hasSubcategories && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {categorySubcategories.length}
                      </p>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          {/* Primary Category Selection */}
          {selectedCategories.length > 1 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Primary Category
                <span className="text-xs text-gray-500 ml-1">(for display purposes)</span>
              </label>
              
              <div className="flex flex-wrap gap-1.5">
                {selectedCategories.map(category => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => onPrimaryCategoryChange(Number(category.id))}
                    disabled={disabled}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors",
                      primaryCategoryId === Number(category.id)
                        ? "bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200 shadow-sm"
                        : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700",
                      disabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Star className={cn(
                      "w-3 h-3",
                      primaryCategoryId === Number(category.id) ? "fill-current" : ""
                    )} />
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Show primary category indicator */}
          {selectedCategories.length === 1 && (
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md">
              <Star className="w-3 h-3 fill-current text-blue-500" />
              <span>Primary: {selectedCategories[0].name}</span>
            </div>
          )}
        </div>

        {/* Right Panel: Subcategories (60% width) */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Subcategories
            </label>
            <div className="flex items-center gap-2">
              {selectedSubcategoryIds.length > 0 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedSubcategoryIds.length} selected
                </span>
              )}
              {availableSubcategories.length > 1 && (
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => onSubcategoriesChange(availableSubcategories.map(s => Number(s.id)))}
                    disabled={disabled || selectedSubcategoryIds.length === availableSubcategories.length}
                    className="text-xs px-2 py-1 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => onSubcategoriesChange([])}
                    disabled={disabled || selectedSubcategoryIds.length === 0}
                    className="text-xs px-2 py-1 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Subcategories Content */}
          {selectedCategoryIds.length === 0 ? (
            <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
              <div className="text-center">
                <div className="text-4xl mb-2">📂</div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Select categories to view subcategories
                </p>
              </div>
            </div>
          ) : availableSubcategories.length === 0 ? (
            <div className="flex items-center gap-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <div className="w-4 h-4 text-yellow-600 dark:text-yellow-400">⚠️</div>
              <span className="text-sm text-yellow-800 dark:text-yellow-200">
                No subcategories available for the selected categories
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Subcategories by Category */}
              {selectedCategoryIds.map(categoryId => {
                const category = categories.find(c => Number(c.id) === categoryId);
                const categorySubcategories = getSubcategoriesForCategory(categoryId);
                
                if (categorySubcategories.length === 0) return null;

                return (
                  <div key={categoryId} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {category?.name} Subcategories
                      </h4>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {categorySubcategories.filter(sub => selectedSubcategoryIds.includes(Number(sub.id))).length} / {categorySubcategories.length} selected
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-5 gap-1.5">
                      {categorySubcategories.map(subcategory => {
                        const isSelected = selectedSubcategoryIds.includes(Number(subcategory.id));
                        const isPrimary = primarySubcategoryId === Number(subcategory.id);
                        
                        return (
                          <div
                            key={subcategory.id}
                            className={cn(
                              "relative cursor-pointer rounded-md border p-1 transition-all duration-200 hover:shadow-sm hover:scale-105",
                              isSelected
                                ? "border-green-500 bg-green-50 dark:bg-green-900/20 shadow-sm"
                                : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500",
                              disabled && "opacity-50 cursor-not-allowed"
                            )}
                            onClick={() => handleSubcategoryToggle(Number(subcategory.id))}
                          >
                            {/* Selection Indicator */}
                            {isSelected && (
                              <div className="absolute top-0.5 right-0.5">
                                <div className="w-2.5 h-2.5 bg-green-500 rounded-full flex items-center justify-center">
                                  <Check className="w-1.5 h-1.5 text-white" />
                                </div>
                              </div>
                            )}

                            {/* Primary Indicator */}
                            {isPrimary && (
                              <div className="absolute top-0.5 left-0.5">
                                <Star className="w-2 h-2 text-yellow-500 fill-current" />
                              </div>
                            )}

                            {/* Subcategory Name */}
                            <div className="text-center pt-0.5">
                              <h5 className={cn(
                                "text-xs font-medium truncate leading-tight",
                                isSelected 
                                  ? "text-green-900 dark:text-green-100" 
                                  : "text-gray-900 dark:text-white"
                              )}>
                                {subcategory.name}
                              </h5>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Primary Subcategory Selection */}
              {selectedSubcategories.length > 1 && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Primary Subcategory
                    <span className="text-xs text-gray-500 ml-1">(for display purposes)</span>
                  </label>
                  
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSubcategories.map(subcategory => (
                      <button
                        key={subcategory.id}
                        type="button"
                        onClick={() => onPrimarySubcategoryChange(Number(subcategory.id))}
                        disabled={disabled}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors",
                          primarySubcategoryId === Number(subcategory.id)
                            ? "bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200 shadow-sm"
                            : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700",
                          disabled && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <Star className={cn(
                          "w-3 h-3",
                          primarySubcategoryId === Number(subcategory.id) ? "fill-current" : ""
                        )} />
                        {subcategory.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Show primary subcategory indicator */}
              {selectedSubcategories.length === 1 && (
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md">
                  <Star className="w-3 h-3 fill-current text-green-500" />
                  <span>Primary: {selectedSubcategories[0].name}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      {(selectedCategoryIds.length > 0 || selectedSubcategoryIds.length > 0) && (
        <div className="p-3 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            📋 Assignment Summary
          </h4>
          <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <span className="font-medium">Categories:</span> 
              <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs font-medium">
                {selectedCategoryIds.length}
              </span>
              {primaryCategoryId && (
                <span className="text-blue-600 dark:text-blue-400">
                  (⭐ {categories.find(c => Number(c.id) === primaryCategoryId)?.name})
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Subcategories:</span> 
              <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs font-medium">
                {selectedSubcategoryIds.length}
              </span>
              {primarySubcategoryId && (
                <span className="text-green-600 dark:text-green-400">
                  (⭐ {subcategories.find(s => Number(s.id) === primarySubcategoryId)?.name})
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryGridSelector;
