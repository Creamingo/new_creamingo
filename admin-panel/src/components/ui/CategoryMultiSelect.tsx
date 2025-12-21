import React, { useState, useEffect } from 'react';
import { Star, AlertCircle } from 'lucide-react';
import { MultiSelect, MultiSelectOption } from './MultiSelect';
import { Category, Subcategory } from '../../types';
import { cn } from '../../utils/cn';

export interface CategoryMultiSelectProps {
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

export const CategoryMultiSelect: React.FC<CategoryMultiSelectProps> = ({
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
      selectedCategoryIds.includes(subcat.category_id)
    );
    setAvailableSubcategories(filtered);
  }, [selectedCategoryIds, subcategories]);

  // Clear subcategories that are no longer valid when categories change
  useEffect(() => {
    const validSubcategoryIds = selectedSubcategoryIds.filter(subcatId => {
      const subcat = subcategories.find(s => s.id === subcatId);
      return subcat && selectedCategoryIds.includes(subcat.category_id);
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

  // Prepare category options
  const categoryOptions: MultiSelectOption[] = categories.map(cat => ({
    value: cat.id,
    label: cat.name,
    disabled: !cat.is_active
  }));

  // Prepare subcategory options
  const subcategoryOptions: MultiSelectOption[] = availableSubcategories.map(subcat => ({
    value: subcat.id,
    label: subcat.name,
    disabled: !subcat.is_active
  }));

  // Get selected categories for primary selection
  const selectedCategories = categories.filter(cat => selectedCategoryIds.includes(Number(cat.id)));
  const selectedSubcategories = availableSubcategories.filter(subcat => selectedSubcategoryIds.includes(Number(subcat.id)));

  return (
    <div className="space-y-6">
      {/* Categories Section */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Categories
        </label>
        
        <MultiSelect
          options={categoryOptions}
          selected={selectedCategoryIds}
          onChange={(selected) => onCategoriesChange(selected.map(id => Number(id)))}
          placeholder="Select categories..."
          disabled={disabled}
          error={error}
          className="w-full"
        />

        {/* Primary Category Selection */}
        {selectedCategories.length > 1 && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Primary Category
              <span className="text-xs text-gray-500 ml-1">(for display purposes)</span>
            </label>
            
            <div className="flex flex-wrap gap-2">
              {selectedCategories.map(category => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => onPrimaryCategoryChange(Number(category.id))}
                  disabled={disabled}
                  className={cn(
                    "inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-medium transition-colors",
                    primaryCategoryId === category.id
                      ? "bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200"
                      : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700",
                    disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Star className={cn(
                    "w-4 h-4",
                    primaryCategoryId === category.id ? "fill-current" : ""
                  )} />
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Show primary category indicator */}
        {selectedCategories.length === 1 && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Star className="w-4 h-4 fill-current text-blue-500" />
            <span>Primary: {selectedCategories[0].name}</span>
          </div>
        )}
      </div>

      {/* Subcategories Section */}
      {selectedCategoryIds.length > 0 && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Subcategories
          </label>
          
          {availableSubcategories.length === 0 ? (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm text-yellow-800 dark:text-yellow-200">
                No subcategories available for the selected categories
              </span>
            </div>
          ) : (
            <>
              <MultiSelect
                options={subcategoryOptions}
                selected={selectedSubcategoryIds}
                onChange={(selected) => onSubcategoriesChange(selected.map(id => Number(id)))}
                placeholder="Select subcategories..."
                disabled={disabled}
                className="w-full"
              />

              {/* Primary Subcategory Selection */}
              {selectedSubcategories.length > 1 && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Primary Subcategory
                    <span className="text-xs text-gray-500 ml-1">(for display purposes)</span>
                  </label>
                  
                  <div className="flex flex-wrap gap-2">
                    {selectedSubcategories.map(subcategory => (
                      <button
                        key={subcategory.id}
                        type="button"
                        onClick={() => onPrimarySubcategoryChange(Number(subcategory.id))}
                        disabled={disabled}
                        className={cn(
                          "inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-medium transition-colors",
                          primarySubcategoryId === subcategory.id
                            ? "bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200"
                            : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700",
                          disabled && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <Star className={cn(
                          "w-4 h-4",
                          primarySubcategoryId === subcategory.id ? "fill-current" : ""
                        )} />
                        {subcategory.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Show primary subcategory indicator */}
              {selectedSubcategories.length === 1 && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Star className="w-4 h-4 fill-current text-blue-500" />
                  <span>Primary: {selectedSubcategories[0].name}</span>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Summary */}
      {(selectedCategoryIds.length > 0 || selectedSubcategoryIds.length > 0) && (
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Assignment Summary
          </h4>
          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <span className="font-medium">Categories:</span> {selectedCategoryIds.length}
              {primaryCategoryId && (
                <span className="ml-2 text-blue-600 dark:text-blue-400">
                  (Primary: {categories.find(c => c.id === primaryCategoryId)?.name})
                </span>
              )}
            </div>
            <div>
              <span className="font-medium">Subcategories:</span> {selectedSubcategoryIds.length}
              {primarySubcategoryId && (
                <span className="ml-2 text-blue-600 dark:text-blue-400">
                  (Primary: {subcategories.find(s => s.id === primarySubcategoryId)?.name})
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryMultiSelect;
