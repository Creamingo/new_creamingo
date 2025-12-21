import React, { useState, useEffect, useCallback } from 'react';
import { Edit2, Trash2, Save, X, Package, ChevronDown } from 'lucide-react';
import addOnCategoryService from '../../services/addOnCategoryService';
import { AddOnCategory, CreateAddOnCategoryData, UpdateAddOnCategoryData } from '../../types/addOn';
import { useToastContext } from '../../contexts/ToastContext';

interface AddOnCategoryManagementProps {
  onCategorySelect?: (category: AddOnCategory | null) => void;
  selectedCategoryId?: number | null;
}

const AddOnCategoryManagement: React.FC<AddOnCategoryManagementProps> = ({ 
  onCategorySelect, 
  selectedCategoryId 
}) => {
  const { showSuccess, showError } = useToastContext();
  const [categories, setCategories] = useState<AddOnCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingOrder, setEditingOrder] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newOrder, setNewOrder] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await addOnCategoryService.getAllAddOnCategories();
      // Guard against malformed data (e.g., undefined/null items)
      const sanitized = (response.data.categories || []).filter(
        (c): c is AddOnCategory => !!c && typeof (c as any).id === 'number'
      );
      setCategories(sanitized);
      // Auto-select first category by default if none selected
      if (!selectedCategoryId && onCategorySelect && sanitized.length > 0) {
        onCategorySelect(sanitized[0]);
      }
    } catch (error: any) {
      showError(error.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  }, [selectedCategoryId, onCategorySelect, showError]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Handle edit
  const handleEdit = (category: AddOnCategory) => {
    setEditingId(category.id);
    setEditingName(category.name);
    setEditingOrder(category.display_order);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
    setEditingOrder(0);
  };

  const handleSave = async (id: number) => {
    if (!editingName.trim()) {
      showError('Category name is required');
      return;
    }

    setActionLoading(`save-${id}`);
    try {
      const updateData: UpdateAddOnCategoryData = {
        name: editingName.trim(),
        display_order: editingOrder
      };

      const response = await addOnCategoryService.updateAddOnCategory(id, updateData);
      setCategories(prev =>
        prev
          .filter((c): c is AddOnCategory => !!c && typeof (c as any).id === 'number')
          .map(cat => (cat.id === id ? response.data.category : cat))
      );
      
      setEditingId(null);
      setEditingName('');
      setEditingOrder(0);
      showSuccess('Category updated successfully!');
    } catch (error: any) {
      showError(error.message || 'Failed to update category');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle delete
  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    setActionLoading(`delete-${id}`);
    try {
      await addOnCategoryService.deleteAddOnCategory(id);
      setCategories(prev => prev.filter(cat => !!cat && cat.id !== id));
      showSuccess('Category deleted successfully!');
    } catch (error: any) {
      showError(error.message || 'Failed to delete category');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle add new
  const handleAddNew = () => {
    setShowAddForm(true);
    setNewName('');
    setNewOrder(categories.length + 1);
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setNewName('');
    setNewOrder(0);
  };

  const handleSaveNew = async () => {
    if (!newName.trim()) {
      showError('Category name is required');
      return;
    }

    setActionLoading('add-new');
    try {
      const createData: CreateAddOnCategoryData = {
        name: newName.trim(),
        display_order: newOrder
      };

      const response = await addOnCategoryService.createAddOnCategory(createData);
      setCategories(prev => [
        ...prev.filter((c): c is AddOnCategory => !!c && typeof (c as any).id === 'number'),
        response.data.category,
      ]);
      
      setShowAddForm(false);
      setNewName('');
      setNewOrder(0);
      showSuccess('Category created successfully!');
    } catch (error: any) {
      showError(error.message || 'Failed to create category');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle category selection
  const handleCategoryClick = (category: AddOnCategory) => {
    if (onCategorySelect) {
      onCategorySelect(category);
    }
  };

  const handleAllClick = () => {
    if (onCategorySelect) {
      onCategorySelect(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-blue-300 dark:border-blue-700 bg-blue-100 dark:bg-blue-900/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md border border-blue-200 flex items-center justify-center">
              <Package className="w-4 h-4 text-blue-600" />
            </div>
            <div className="leading-tight">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Add-On Categories</h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Manage product add-on categories</p>
            </div>
          </div>
          <button
            onClick={handleAddNew}
            className="inline-flex items-center px-3 py-1.5 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400 rounded-md text-xs hover:bg-blue-50 dark:hover:bg-blue-900/50"
          >
            <ChevronDown className="w-3 h-3 mr-1" />
            Add Category
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Add New Form */}
        {showAddForm && (
          <div className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mb-3">
            <h3 className="text-xs font-semibold text-gray-800 dark:text-white mb-2">Add New Category</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Category Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md text-xs focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-300 dark:focus:border-blue-600"
                  placeholder="Enter category name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Display Order</label>
                <input
                  type="number"
                  value={newOrder}
                  onChange={(e) => setNewOrder(parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md text-xs focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-300 dark:focus:border-blue-600"
                  min="0"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={handleSaveNew}
                  disabled={actionLoading === 'add-new'}
                  className="flex-1 inline-flex items-center justify-center px-2 py-1.5 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white text-xs font-medium rounded-md disabled:opacity-50"
                >
                  <Save className="w-3 h-3 mr-1" />
                  {actionLoading === 'add-new' ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancelAdd}
                  className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="mb-2 flex items-center gap-2">
          <button
            onClick={handleAllClick}
            className={`px-2 py-1 text-xs rounded-md border ${
              !selectedCategoryId 
                ? 'border-blue-500 dark:border-blue-400 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30' 
                : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-600'
            }`}
          >
            All
          </button>
        </div>

        {/* Categories List */}
        <div className="space-y-1">
          {categories.length === 0 ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              <Package className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-500" />
              <p className="text-sm">No categories found</p>
              <p className="text-xs">Click "Add Category" to create your first category</p>
            </div>
          ) : (
            categories
              .filter((c): c is AddOnCategory => !!c && typeof (c as any).id === 'number')
              .map((category) => (
              <div
                key={category.id}
                className={`p-3 border rounded-md cursor-pointer ${
                  selectedCategoryId === category.id
                    ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                }`}
                onClick={() => handleCategoryClick(category)}
              >
                {editingId === category.id ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Category Name</label>
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md text-xs focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-300 dark:focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Display Order</label>
                      <input
                        type="number"
                        value={editingOrder}
                        onChange={(e) => setEditingOrder(parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md text-xs focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-300 dark:focus:border-blue-600"
                        min="0"
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <button
                        onClick={() => handleSave(category.id)}
                        disabled={actionLoading === `save-${category.id}`}
                        className="flex-1 inline-flex items-center justify-center px-2 py-1.5 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white text-xs font-medium rounded-md disabled:opacity-50"
                      >
                        <Save className="w-3 h-3 mr-1" />
                        {actionLoading === `save-${category.id}` ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-md border border-blue-200 dark:border-blue-700 flex items-center justify-center bg-white dark:bg-gray-700">
                        <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{category.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Order: {category.display_order}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(category);
                        }}
                        className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-md"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(category.id, category.name);
                        }}
                        disabled={actionLoading === `delete-${category.id}`}
                        className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-md disabled:opacity-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AddOnCategoryManagement;
