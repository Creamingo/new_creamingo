import React, { useState } from 'react';
import { Package, ShoppingBag, BarChart3, Users } from 'lucide-react';
import AddOnCategoryManagement from '../components/ui/AddOnCategoryManagement';
import AddOnProductManagement from '../components/ui/AddOnProductManagement';
import { AddOnCategory } from '../types/addOn';

const ProductAddOns: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<AddOnCategory | null>(null);

  const handleCategorySelect = (category: AddOnCategory | null) => {
    setSelectedCategory(category);
  };

  const handleClearSelection = () => {
    setSelectedCategory(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 pt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">Product Add-Ons</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Manage add-on categories and products for combo features</p>
                </div>
              </div>
              
              {/* Stats Cards */}
              <div className="hidden lg:flex items-center gap-3">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-2">
                  <div className="flex items-center gap-1">
                    <ShoppingBag className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-medium text-blue-800 dark:text-blue-300">Categories</span>
                  </div>
                  <p className="text-sm font-bold text-blue-900 dark:text-blue-200">4</p>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200 dark:border-green-700 rounded-lg p-2">
                  <div className="flex items-center gap-1">
                    <Package className="w-3 h-3 text-green-600 dark:text-green-400" />
                    <span className="text-xs font-medium text-green-800 dark:text-green-300">Products</span>
                  </div>
                  <p className="text-sm font-bold text-green-900 dark:text-green-200">12</p>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/30 dark:to-violet-900/30 border border-purple-200 dark:border-purple-700 rounded-lg p-2">
                  <div className="flex items-center gap-1">
                    <BarChart3 className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs font-medium text-purple-800 dark:text-purple-300">Active</span>
                  </div>
                  <p className="text-sm font-bold text-purple-900 dark:text-purple-200">100%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Breadcrumb */}
        <div className="mb-3">
          <nav className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
            <span>Admin</span>
            <span>/</span>
            <span className="text-gray-900 dark:text-white font-medium">Product Add-Ons</span>
            {selectedCategory && (
              <>
                <span>/</span>
                <span className="text-gray-900 dark:text-white font-medium">{selectedCategory.name}</span>
              </>
            )}
          </nav>
        </div>

        {/* Category Selection Info */}
        {selectedCategory && (
          <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Package className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Viewing: {selectedCategory.name}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Display Order: {selectedCategory.display_order}</p>
                </div>
              </div>
              <button
                onClick={handleClearSelection}
                className="px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors duration-200"
              >
                View All Products
              </button>
            </div>
          </div>
        )}

        {/* Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Categories Management */}
          <div className="space-y-4">
            <AddOnCategoryManagement 
              onCategorySelect={handleCategorySelect}
              selectedCategoryId={selectedCategory?.id ?? null}
            />
          </div>

          {/* Products Management */}
          <div className="space-y-4">
            <AddOnProductManagement 
              selectedCategoryId={selectedCategory?.id}
            />
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-6 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800/50 dark:to-blue-900/30 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">How to Use Product Add-Ons</h3>
              <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                <p>• <strong className="text-gray-900 dark:text-white">Categories:</strong> Create and manage add-on categories like "Candles", "Balloons", etc.</p>
                <p>• <strong className="text-gray-900 dark:text-white">Products:</strong> Add individual products within each category with pricing and details.</p>
                <p>• <strong className="text-gray-900 dark:text-white">Combo Feature:</strong> These add-ons will be available in the "Make it a Combo" section on product pages.</p>
                <p>• <strong className="text-gray-900 dark:text-white">Display Order:</strong> Control the order in which categories and products appear to customers.</p>
                <p>• <strong className="text-gray-900 dark:text-white">Selection:</strong> Click on a category to view and manage only its products.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductAddOns;
