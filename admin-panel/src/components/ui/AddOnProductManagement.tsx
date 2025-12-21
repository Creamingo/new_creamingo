import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Edit2, Trash2, Save, X, Package, Image, DollarSign, Upload, ChevronDown, Check } from 'lucide-react';
import addOnProductService from '../../services/addOnProductService';
import addOnCategoryService from '../../services/addOnCategoryService';
import { AddOnProduct, AddOnCategory, CreateAddOnProductData, UpdateAddOnProductData } from '../../types/addOn';
import { useToastContext } from '../../contexts/ToastContext';
import apiClient from '../../services/api';

// Custom Dropdown Component
interface CustomDropdownProps {
  value: number;
  onChange: (value: number) => void;
  options: { id: number; name: string }[];
  placeholder?: string;
  className?: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({ 
  value, 
  onChange, 
  options, 
  placeholder = "Select category",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.id === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-2 py-1.5 border-2 border-green-500 dark:border-green-600 rounded-lg text-xs bg-white dark:bg-gray-700 text-left focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-green-500 dark:focus:border-green-600 cursor-pointer flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200 font-light text-gray-700 dark:text-gray-300"
      >
        <span className={selectedOption ? "text-gray-700 dark:text-gray-300 font-light" : "text-gray-500 dark:text-gray-400 font-light"}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <ChevronDown 
          className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                onChange(option.id);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 text-xs text-left hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-150 flex items-center justify-between font-light ${
                value === option.id ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              <span>{option.name}</span>
              {value === option.id && (
                <Check className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface AddOnProductManagementProps {
  selectedCategoryId?: number;
}

const AddOnProductManagement: React.FC<AddOnProductManagementProps> = ({ 
  selectedCategoryId 
}) => {
  const { showSuccess, showError } = useToastContext();
  const [products, setProducts] = useState<AddOnProduct[]>([]);
  const [categories, setCategories] = useState<AddOnCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<UpdateAddOnProductData>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState<CreateAddOnProductData>({
    category_id: selectedCategoryId || 1,
    name: '',
    description: '',
    price: 0,
    discount_percentage: 0,
    discounted_price: 0,
    image_url: '',
    display_order: 0
  });
  const [newProductImage, setNewProductImage] = useState<File | null>(null);
  const [editingImage, setEditingImage] = useState<File | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await addOnCategoryService.getAllAddOnCategories();
      setCategories(response.data.categories);
    } catch (error: any) {
      showError(error.message || 'Failed to fetch categories');
    }
  }, [showError]);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await addOnProductService.getAllAddOnProducts(selectedCategoryId);
      if (response.data && response.data.products) {
        // Filter out any undefined or invalid products
        const validProducts = response.data.products.filter(product => 
          product && product.id && typeof product.id === 'number'
        );
        setProducts(validProducts);
      } else {
        setProducts([]);
      }
    } catch (error: any) {
      showError(error.message || 'Failed to fetch products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategoryId, showError]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handle edit
  const handleEdit = (product: AddOnProduct) => {
    setEditingId(product.id);
    setEditingData({
      category_id: product.category_id,
      name: product.name,
      description: product.description,
      price: product.price,
      discount_percentage: product.discount_percentage || 0,
      discounted_price: product.discounted_price || 0,
      image_url: product.image_url,
      display_order: product.display_order
    });
    setEditingImage(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData({});
    setEditingImage(null);
  };

  // Calculate discounted price
  const calculateDiscountedPrice = (price: number, discountPercentage: number) => {
    if (discountPercentage > 0) {
      return price - (price * discountPercentage / 100);
    }
    return price;
  };

  // Handle discount percentage change
  const handleDiscountChange = (value: number, isNewProduct: boolean = false) => {
    if (isNewProduct) {
      const discountedPrice = calculateDiscountedPrice(newProduct.price, value);
      setNewProduct(prev => ({
        ...prev,
        discount_percentage: value,
        discounted_price: discountedPrice
      }));
    } else {
      const discountedPrice = calculateDiscountedPrice(editingData.price || 0, value);
      setEditingData(prev => ({
        ...prev,
        discount_percentage: value,
        discounted_price: discountedPrice
      }));
    }
  };

  // Handle price change
  const handlePriceChange = (value: number, isNewProduct: boolean = false) => {
    if (isNewProduct) {
      const discountedPrice = calculateDiscountedPrice(value, newProduct.discount_percentage || 0);
      setNewProduct(prev => ({
        ...prev,
        price: value,
        discounted_price: discountedPrice
      }));
    } else {
      const discountedPrice = calculateDiscountedPrice(value, editingData.discount_percentage || 0);
      setEditingData(prev => ({
        ...prev,
        price: value,
        discounted_price: discountedPrice
      }));
    }
  };

  // Handle image upload
  const handleImageUpload = (file: File, isNewProduct: boolean = false) => {
    if (isNewProduct) {
      setNewProductImage(file);
    } else {
      setEditingImage(file);
    }
  };

  // Upload image and get URL
  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const response = await apiClient.uploadFile('/upload/single', file);
      if (response.success && response.data) {
        return response.data.url;
      }
      return null;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleSave = async (id: number) => {
    if (!editingData.name?.trim()) {
      showError('Product name is required');
      return;
    }

    if (!editingData.price || editingData.price <= 0) {
      showError('Valid price is required');
      return;
    }

    setActionLoading(`save-${id}`);
    try {
      let imageUrl = editingData.image_url;
      
      // Upload new image if selected
      if (editingImage) {
        const uploadedUrl = await uploadImage(editingImage);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          showError('Failed to upload image');
          return;
        }
      }

      const updateData = {
        ...editingData,
        image_url: imageUrl
      };

      const response = await addOnProductService.updateAddOnProduct(id, updateData);
      if (response.data && response.data.product) {
        setProducts(prev => prev.map(prod => 
          prod.id === id ? response.data.product : prod
        ));
      } else {
        showError('Invalid response from server');
        return;
      }
      
      setEditingId(null);
      setEditingData({});
      setEditingImage(null);
      showSuccess('Product updated successfully!');
    } catch (error: any) {
      showError(error.message || 'Failed to update product');
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
      await addOnProductService.deleteAddOnProduct(id);
      setProducts(prev => prev.filter(prod => prod.id !== id));
      showSuccess('Product deleted successfully!');
    } catch (error: any) {
      showError(error.message || 'Failed to delete product');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle add new
  const handleAddNew = () => {
    setShowAddForm(true);
    setNewProduct({
      category_id: selectedCategoryId || 1,
      name: '',
      description: '',
      price: 0,
      image_url: '',
      display_order: products.length + 1
    });
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setNewProduct({
      category_id: selectedCategoryId || 1,
      name: '',
      description: '',
      price: 0,
      discount_percentage: 0,
      discounted_price: 0,
      image_url: '',
      display_order: 0
    });
    setNewProductImage(null);
  };

  const handleSaveNew = async () => {
    if (!newProduct.name.trim()) {
      showError('Product name is required');
      return;
    }

    if (!newProduct.price || newProduct.price <= 0) {
      showError('Valid price is required');
      return;
    }

    setActionLoading('add-new');
    try {
      let imageUrl = newProduct.image_url;
      
      // Upload image if selected
      if (newProductImage) {
        const uploadedUrl = await uploadImage(newProductImage);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          showError('Failed to upload image');
          return;
        }
      }

      const createData = {
        ...newProduct,
        image_url: imageUrl
      };

      const response = await addOnProductService.createAddOnProduct(createData);
      if (response.data && (response.data as any).product) {
        setProducts(prev => [...prev, (response.data as any).product]);
      } else {
        // Some backends may return success without the created entity. Fallback to refetch.
        await fetchProducts();
      }
      
      setShowAddForm(false);
      setNewProduct({
        category_id: selectedCategoryId || 1,
        name: '',
        description: '',
        price: 0,
        discount_percentage: 0,
        discounted_price: 0,
        image_url: '',
        display_order: 0
      });
      setNewProductImage(null);
      showSuccess('Product created successfully!');
    } catch (error: any) {
      showError(error.message || 'Failed to create product');
    } finally {
      setActionLoading(null);
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 p-3 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            <div>
              <h2 className="text-base font-light">Add-On Products</h2>
              <p className="text-green-100 dark:text-green-200 text-xs">
                {selectedCategoryId 
                  ? `Products in ${categories.find(c => c.id === selectedCategoryId)?.name || 'Selected Category'}`
                  : 'Manage all add-on products'
                }
              </p>
            </div>
          </div>
          <button
            onClick={handleAddNew}
            className="inline-flex items-center px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors duration-200 text-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Product
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Add New Form */}
        {showAddForm && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-3">
            <div className="flex gap-6">
              {/* Left Side - Compact Image Upload */}
              <div className="w-[200px] flex-shrink-0">
                <label className="block text-xs font-light text-gray-600 dark:text-gray-400 mb-2">Product Image</label>
                
                {/* Compact Square Image Preview */}
                <div className="w-[150px] h-[150px] border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center hover:border-green-400 dark:hover:border-green-500 transition-colors mb-2">
                  {newProductImage ? (
                    <img 
                      src={URL.createObjectURL(newProductImage)} 
                      alt="Preview" 
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-1" />
                      <p className="text-xs text-gray-600 dark:text-gray-400">No image</p>
                    </div>
                  )}
                </div>
                
                {/* Size Display */}
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">150×150 px</p>
                
                 {/* Browse and Remove Buttons Row */}
                 <div className="flex gap-2 mt-2">
                   {/* Browse Button */}
                   <input
                     type="file"
                     accept="image/*"
                     onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], true)}
                     className="hidden"
                     id="new-product-image"
                   />
                   <label
                     htmlFor="new-product-image"
                     className="inline-flex items-center px-3 py-1.5 bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600 text-white text-xs font-light rounded-lg cursor-pointer transition-colors w-[150px] justify-center"
                   >
                     <Upload className="w-3 h-3 mr-1" />
                     Browse
                   </label>
                   
                   {/* Remove Image Button (if image exists) */}
                   {newProductImage && (
                     <button
                       onClick={() => setNewProductImage(null)}
                       className="w-[150px] px-3 py-1.5 border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 text-xs font-light rounded-lg hover:bg-red-50 dark:hover:bg-red-900/50 transition-colors"
                     >
                       Remove
                     </button>
                   )}
                 </div>
              </div>

              {/* Right Side - Compact Form Fields */}
              <div className="flex-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-light text-gray-600 dark:text-gray-400 mb-1">Add Product Name</label>
                    <textarea
                      value={newProduct.name}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-xs focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent font-light text-gray-700 dark:text-gray-300"
                      placeholder="Enter product name"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-light text-gray-600 dark:text-gray-400 mb-1">Description</label>
                    <textarea
                      value={newProduct.description}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-xs focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent font-light text-gray-700 dark:text-gray-300"
                      placeholder="Product description"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-light text-gray-600 dark:text-gray-400 mb-1">Price (₹)</label>
                    <input
                      type="number"
                      value={newProduct.price || ''}
                      onChange={(e) => handlePriceChange(parseFloat(e.target.value) || 0, true)}
                      className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-xs focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent font-light text-gray-700 dark:text-gray-300"
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-light text-gray-600 dark:text-gray-400 mb-1">Discount (%)</label>
                    <input
                      type="number"
                      value={newProduct.discount_percentage || ''}
                      onChange={(e) => handleDiscountChange(parseFloat(e.target.value) || 0, true)}
                      className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-xs focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent font-light text-gray-700 dark:text-gray-300"
                      placeholder="0"
                      min="0"
                      max="100"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-light text-gray-600 dark:text-gray-400 mb-1">Final Price (₹)</label>
                    <input
                      type="number"
                      value={newProduct.discounted_price || ''}
                      className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-xs bg-gray-50 dark:bg-gray-700 dark:text-gray-300"
                      readOnly
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-light text-gray-600 dark:text-gray-400 mb-1">Category</label>
                    <CustomDropdown
                      value={newProduct.category_id}
                      onChange={(value) => setNewProduct(prev => ({ ...prev, category_id: value }))}
                      options={categories}
                      placeholder="Select category"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-light text-gray-600 dark:text-gray-400 mb-1">Display Order</label>
                    <input
                      type="number"
                      value={newProduct.display_order || ''}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                      className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-xs focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent font-light text-gray-700 dark:text-gray-300"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>

                {/* Action Buttons Row - Save, Cancel aligned */}
                <div className="flex items-center gap-2 mt-4">
                  {/* Spacer to push Save/Cancel to the right */}
                  <div className="flex-1"></div>
                  
                  {/* Save and Cancel Buttons */}
                  <button
                    onClick={handleSaveNew}
                    disabled={actionLoading === 'add-new'}
                    className="inline-flex items-center px-6 py-1.5 bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600 text-white text-xs font-light rounded-lg transition-colors duration-200 disabled:opacity-50"
                  >
                    <Save className="w-3 h-3 mr-1" />
                    {actionLoading === 'add-new' ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancelAdd}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs font-light rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products List */}
        <div className="space-y-2">
          {products.length === 0 ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              <Package className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-500" />
              <p className="text-sm">No products found</p>
              <p className="text-xs">
                {selectedCategoryId 
                  ? 'This category has no products yet'
                  : 'Click "Add Product" to create your first product'
                }
              </p>
            </div>
          ) : (
            products.filter(product => product && product.id).map((product) => (
              <div
                key={product.id}
                className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all duration-200"
              >
                {editingId === product.id ? (
                  <div>
                    <div className="flex gap-6">
                      {/* Left Side - Compact Image Upload */}
                      <div className="w-[200px] flex-shrink-0">
                        <label className="block text-xs font-light text-gray-600 dark:text-gray-400 mb-2">Product Image</label>
                        
                        {/* Compact Square Image Preview */}
                        <div className="w-[150px] h-[150px] border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center hover:border-green-400 dark:hover:border-green-500 transition-colors mb-2">
                          {editingImage ? (
                            <img 
                              src={URL.createObjectURL(editingImage)} 
                              alt="Preview" 
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : editingData.image_url || product.image_url ? (
                            <img 
                              src={editingData.image_url || product.image_url} 
                              alt="Current" 
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <div className="text-center">
                              <Upload className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-1" />
                              <p className="text-xs text-gray-600 dark:text-gray-400">No image</p>
                            </div>
                          )}
                        </div>
                        
                        {/* Size Display */}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">150×150 px</p>
                        
                         {/* Browse and Remove Buttons Row */}
                         <div className="flex gap-2 mt-2">
                           {/* Browse Button */}
                           <input
                             type="file"
                             accept="image/*"
                             onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], false)}
                             className="hidden"
                             id={`edit-product-image-${product.id}`}
                           />
                           <label
                             htmlFor={`edit-product-image-${product.id}`}
                             className="inline-flex items-center px-3 py-1.5 bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600 text-white text-xs font-light rounded-lg cursor-pointer transition-colors w-[150px] justify-center"
                           >
                             <Upload className="w-3 h-3 mr-1" />
                             Browse
                           </label>
                           
                           {/* Remove Image Button (if new image exists) */}
                           {editingImage && (
                             <button
                               onClick={() => setEditingImage(null)}
                               className="w-[150px] px-3 py-1.5 border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 text-xs font-light rounded-lg hover:bg-red-50 dark:hover:bg-red-900/50 transition-colors"
                             >
                               Remove
                             </button>
                           )}
                         </div>
                      </div>

                      {/* Right Side - Compact Form Fields */}
                      <div className="flex-1">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-light text-gray-600 dark:text-gray-400 mb-1">Edit Product Name</label>
                            <textarea
                              value={editingData.name || ''}
                              onChange={(e) => setEditingData(prev => ({ ...prev, name: e.target.value }))}
                              className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-xs focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent font-light text-gray-700 dark:text-gray-300"
                              rows={2}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-light text-gray-600 dark:text-gray-400 mb-1">Description</label>
                            <textarea
                              value={editingData.description || product.description || ''}
                              onChange={(e) => setEditingData(prev => ({ ...prev, description: e.target.value }))}
                              className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-xs focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent font-light text-gray-700 dark:text-gray-300"
                              rows={2}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mt-3">
                          <div>
                            <label className="block text-xs font-light text-gray-600 dark:text-gray-400 mb-1">Price (₹)</label>
                            <input
                              type="number"
                              value={editingData.price || product.price || ''}
                              onChange={(e) => handlePriceChange(parseFloat(e.target.value) || 0, false)}
                              className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-xs focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent font-light text-gray-700 dark:text-gray-300"
                              placeholder="0"
                              min="0"
                              step="0.01"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-light text-gray-600 dark:text-gray-400 mb-1">Discount (%)</label>
                            <input
                              type="number"
                              value={editingData.discount_percentage || ''}
                              onChange={(e) => handleDiscountChange(parseFloat(e.target.value) || 0, false)}
                              className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-xs focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent font-light text-gray-700 dark:text-gray-300"
                              placeholder="0"
                              min="0"
                              max="100"
                              step="0.01"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-light text-gray-600 dark:text-gray-400 mb-1">Final Price (₹)</label>
                            <input
                              type="number"
                              value={editingData.discounted_price || ''}
                              className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-xs bg-gray-50 dark:bg-gray-700 dark:text-gray-300"
                              readOnly
                              placeholder="0"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mt-3">
                          <div className="col-span-2">
                            <label className="block text-xs font-light text-gray-600 dark:text-gray-400 mb-1">Category</label>
                            <CustomDropdown
                              value={editingData.category_id || product.category_id}
                              onChange={(value) => setEditingData(prev => ({ ...prev, category_id: value }))}
                              options={categories}
                              placeholder="Select category"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-light text-gray-600 dark:text-gray-400 mb-1">Display Order</label>
                            <input
                              type="number"
                              value={editingData.display_order || product.display_order || ''}
                              onChange={(e) => setEditingData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                              className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-xs focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent font-light text-gray-700 dark:text-gray-300"
                              placeholder="0"
                              min="0"
                            />
                          </div>
                        </div>

                        {/* Action Buttons Row - Save, Cancel aligned */}
                        <div className="flex items-center gap-2 mt-4">
                          {/* Spacer to push Save/Cancel to the right */}
                          <div className="flex-1"></div>
                          
                          {/* Save and Cancel Buttons */}
                          <button
                            onClick={() => handleSave(product.id)}
                            disabled={actionLoading === `save-${product.id}`}
                            className="inline-flex items-center px-6 py-1.5 bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600 text-white text-xs font-light rounded-lg transition-colors duration-200 disabled:opacity-50"
                          >
                            <Save className="w-3 h-3 mr-1" />
                            {actionLoading === `save-${product.id}` ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs font-light rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center overflow-hidden">
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Image className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-light text-gray-700 dark:text-gray-300">{product.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{product.category_name}</p>
                        {product.description && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{product.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <DollarSign className="w-3 h-3" />
                            {product.discount_percentage && product.discount_percentage > 0 ? (
                              <div className="flex items-center gap-1">
                                <span className="text-sm font-light line-through text-gray-400 dark:text-gray-500">₹{product.price}</span>
                                <span className="text-sm font-light">₹{product.discounted_price || product.price}</span>
                                <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1 rounded">-{product.discount_percentage}%</span>
                              </div>
                            ) : (
                              <span className="text-sm font-light">₹{product.price}</span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">Order: {product.display_order}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-lg transition-colors duration-200"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        disabled={actionLoading === `delete-${product.id}`}
                        className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg transition-colors duration-200 disabled:opacity-50"
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

export default AddOnProductManagement;
