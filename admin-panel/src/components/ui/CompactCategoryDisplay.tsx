import React from 'react';
import { Star } from 'lucide-react';
import { Product } from '../../types';

interface CompactCategoryDisplayProps {
  product: Product;
  maxItems?: number;
  showTooltip?: boolean;
}

export const CompactCategoryDisplay: React.FC<CompactCategoryDisplayProps> = ({
  product,
  maxItems = 2,
  showTooltip = true
}) => {
  const categories = product.categories || [];
  const subcategories = product.subcategories || [];
  
  // If no new multi-category data, fall back to legacy
  if (categories.length === 0 && subcategories.length === 0) {
    return (
      <div className="text-sm text-gray-900 dark:text-white">
        <div className="truncate" title={product.category_name || 'Unknown'}>
          {product.category_name || 'Unknown'}
        </div>
        {product.subcategory_name && (
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate" title={product.subcategory_name}>
            {product.subcategory_name}
          </div>
        )}
      </div>
    );
  }

  // Group categories with their subcategories
  const primaryCategory = categories.find(cat => cat.is_primary);
  const otherCategories = categories.filter(cat => !cat.is_primary);
  
  // Get subcategories for primary category
  const primarySubcategories = subcategories.filter(sub => 
    primaryCategory && Number(sub.category_id) === Number(primaryCategory.id)
  );
  const primarySubcategory = primarySubcategories.find(sub => sub.is_primary);
  const otherPrimarySubcategories = primarySubcategories.filter(sub => !sub.is_primary);

  // Group other categories with their subcategories
  const categoryGroups = otherCategories.map(category => {
    const categorySubcategories = subcategories.filter(sub => 
      Number(sub.category_id) === Number(category.id)
    );
    return {
      category,
      subcategories: categorySubcategories
    };
  });

  return (
    <div className="space-y-3 text-left">
      {/* Primary Category Section */}
      {primaryCategory && (
        <div className="space-y-1">
          {/* Primary Category */}
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium text-gray-900 dark:text-white truncate" title={showTooltip ? primaryCategory.name : undefined}>
              {primaryCategory.name}
            </span>
            <Star className="w-3 h-3 text-yellow-500 fill-current flex-shrink-0" />
          </div>
          
          {/* All subcategories for primary category in a single row */}
          {(primarySubcategory || otherPrimarySubcategories.length > 0) && (
            <div className="flex items-center gap-1 flex-wrap">
              {/* Primary subcategory - highlighted */}
              {primarySubcategory && (
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700"
                  title={showTooltip ? `${primarySubcategory.name} (Primary)` : undefined}
                >
                  {primarySubcategory.name}
                </span>
              )}
              {/* Other subcategories */}
              {otherPrimarySubcategories.slice(0, 3).map((subcategory) => (
                <span
                  key={subcategory.id}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600"
                  title={showTooltip ? subcategory.name : undefined}
                >
                  {subcategory.name}
                </span>
              ))}
              {otherPrimarySubcategories.length > 3 && (
                <span
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600"
                  title={`+${otherPrimarySubcategories.length - 3} more subcategories`}
                >
                  +{otherPrimarySubcategories.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Other Categories Section */}
      {categoryGroups.length > 0 && (
        <div className="space-y-3">
          {categoryGroups.slice(0, 2).map((group) => (
            <div key={group.category.id} className="space-y-1">
              {/* Category Name */}
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate" title={showTooltip ? group.category.name : undefined}>
                {group.category.name}
              </div>
              
              {/* Subcategories for this category in a single row */}
              {group.subcategories.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  {group.subcategories.slice(0, 4).map((subcategory) => (
                    <span
                      key={subcategory.id}
                      className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600"
                      title={showTooltip ? subcategory.name : undefined}
                    >
                      {subcategory.name}
                    </span>
                  ))}
                  {group.subcategories.length > 4 && (
                    <span
                      className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600"
                      title={`+${group.subcategories.length - 4} more subcategories`}
                    >
                      +{group.subcategories.length - 4}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
          
          {/* Show remaining categories count if there are more */}
          {categoryGroups.length > 2 && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              +{categoryGroups.length - 2} more categories
            </div>
          )}
        </div>
      )}

      {/* Summary for many items */}
      {(categories.length > 3 || subcategories.length > 5) && (
        <div className="text-xs text-gray-500 dark:text-gray-400 pt-1 border-t border-gray-100 dark:border-gray-700">
          <span className="inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            {categories.length} cat{categories.length !== 1 ? 's' : ''}
          </span>
          {subcategories.length > 0 && (
            <>
              <span className="mx-1">•</span>
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                {subcategories.length} sub{subcategories.length !== 1 ? 's' : ''}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CompactCategoryDisplay;
