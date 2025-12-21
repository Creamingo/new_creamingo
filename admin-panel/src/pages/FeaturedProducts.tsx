import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Star, Plus, Edit, Trash2, Package, TrendingUp, Award, Loader2, Search, Filter, ArrowUpDown, ChevronDown, RefreshCw, ExternalLink, Grid3x3, List, Download, CheckSquare, Square, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { useToastContext } from '../contexts/ToastContext';
import featuredProductService from '../services/featuredProductService';

// Tooltip Component - Matching Dashboard Style
const DashboardTooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
  const [show, setShow] = useState(false);
  
  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-lg whitespace-nowrap bottom-full left-1/2 transform -translate-x-1/2 mb-2">
          {text}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
          </div>
        </div>
      )}
    </div>
  );
};


// Helper function to format currency
const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0.00';
  }
  return `₹${amount.toFixed(2)}`;
};

interface FeaturedProduct {
  id: number;
  product_id: number;
  section: 'top_products' | 'bestsellers';
  display_order: number;
  is_active: boolean;
  is_featured: boolean;
  is_top_product: boolean;
  is_bestseller: boolean;
  created_at: string;
  updated_at: string;
  product_name: string;
  product_image: string;
  product_description: string;
  product_price: number;
  product_weight?: string;
  product_discount_percent?: number;
  product_discounted_price?: number;
  product_is_active: boolean;
  product_is_featured: boolean;
  product_is_top_product: boolean;
  product_is_bestseller: boolean;
  product_slug: string;
  category_id?: number;
  subcategory_id?: number;
  category_name?: string;
  subcategory_name?: string;
  variants?: Array<{
    id: number;
    name: string;
    weight: string;
    price: number;
    discount_percent?: number;
    discounted_price?: number;
    stock_quantity: number;
    is_available: boolean;
  }>;
  gallery_images?: string[];
}

interface AvailableProduct {
  id: number;
  name: string;
  image_url: string;
  description: string;
  base_price: number;
  slug: string;
  is_active: boolean;
}

interface SectionStats {
  top_products: { total: number; active: number; max: number };
  bestsellers: { total: number; active: number; max: number };
}

export const FeaturedProducts: React.FC = () => {
  const { showSuccess, showError, showWarning, showConfirm } = useToastContext();
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);
  const [availableProducts, setAvailableProducts] = useState<AvailableProduct[]>([]);
  const [sectionStats, setSectionStats] = useState<SectionStats>({
    top_products: { total: 0, active: 0, max: 5 },
    bestsellers: { total: 0, active: 0, max: 10 }
  });
  const [selectedSection, setSelectedSection] = useState<'top_products' | 'bestsellers'>('top_products');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'order' | 'newest' | 'oldest' | 'name' | 'price'>('order');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState<FeaturedProduct | null>(null);
  const [editingProduct, setEditingProduct] = useState<FeaturedProduct | null>(null);
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    product_id: '',
    display_order: 0
  });
  const [editFormData, setEditFormData] = useState({
    display_order: 0,
    is_active: true
  });



  const fetchFeaturedProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await featuredProductService.getFeaturedProducts(selectedSection);
      setFeaturedProducts(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching featured products:', error);
      setLoading(false);
    }
  }, [selectedSection]);

  const fetchAvailableProducts = useCallback(async () => {
    try {
      const data = await featuredProductService.getAvailableProducts(selectedSection);
      setAvailableProducts(data);
    } catch (error) {
      console.error('Error fetching available products:', error);
    }
  }, [selectedSection]);

  const fetchSectionStats = useCallback(async () => {
    try {
      const data = await featuredProductService.getSectionStats();
      setSectionStats({
        top_products: { total: data.top_products.total, active: data.top_products.active, max: 8 },
        bestsellers: { total: data.bestsellers.total, active: data.bestsellers.active, max: 6 }
      });
    } catch (error) {
      console.error('Error fetching section stats:', error);
    }
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update bulk actions visibility
  useEffect(() => {
    setShowBulkActions(selectedProducts.size > 0);
  }, [selectedProducts]);

  useEffect(() => {
    fetchFeaturedProducts();
    fetchAvailableProducts();
    fetchSectionStats();
  }, [fetchFeaturedProducts, fetchAvailableProducts, fetchSectionStats]);

  // Filter and sort products
  const filteredProducts = featuredProducts
    .filter(product => {
      const matchesSearch = product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.subcategory_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && product.is_active) ||
        (statusFilter === 'inactive' && !product.is_active);
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'name':
          return a.product_name.localeCompare(b.product_name);
        case 'price':
          return (a.product_discounted_price || a.product_price) - (b.product_discounted_price || b.product_price);
        case 'order':
        default:
          return a.display_order - b.display_order;
      }
    });

  // Handle select all
  const handleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    }
  };

  // Handle individual selection
  const handleSelectProduct = (productId: number, selected: boolean) => {
    const newSelected = new Set(selectedProducts);
    if (selected) {
      newSelected.add(productId);
    } else {
      newSelected.delete(productId);
    }
    setSelectedProducts(newSelected);
  };

  // Bulk actions
  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) return;
    
    const confirmMessage = `Are you sure you want to remove ${selectedProducts.size} product(s) from featured list?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setActionLoading('bulk-delete');
      const promises = Array.from(selectedProducts).map(id =>
        featuredProductService.deleteFeaturedProduct(id)
      );
      await Promise.all(promises);
      
      await fetchFeaturedProducts();
      await fetchAvailableProducts();
      await fetchSectionStats();
      
      setSelectedProducts(new Set());
      showSuccess('Products Removed', `${selectedProducts.size} products have been removed from featured list successfully.`);
    } catch (error: any) {
      console.error('Error bulk deleting products:', error);
      showError('Error', 'Failed to delete some products. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // Export function
  const handleExport = () => {
    const csvContent = [
      ['Product Name', 'Category', 'Subcategory', 'Price', 'Discounted Price', 'Status', 'Section', 'Display Order', 'Created At'].join(','),
      ...filteredProducts.map(product => [
        product.product_name,
        product.category_name || '',
        product.subcategory_name || '',
        product.product_price,
        product.product_discounted_price || product.product_price,
        product.is_active ? 'Active' : 'Inactive',
        product.section === 'top_products' ? 'Top Products' : 'Bestsellers',
        product.display_order,
        new Date(product.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `featured-products-${selectedSection}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showSuccess('Export Complete', 'Featured products data has been exported successfully.');
  };

  const handleSectionChange = (section: 'top_products' | 'bestsellers') => {
    setSelectedSection(section);
    setFormData({ product_id: '', display_order: 0 });
    setSelectedProducts(new Set());
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.product_id) {
      showWarning('Validation Error', 'Please select a product');
      return;
    }

    const maxLimit = selectedSection === 'top_products' ? 8 : 6;
    if (featuredProducts.length >= maxLimit) {
      showWarning('Limit Reached', `Maximum of ${maxLimit} products allowed for ${selectedSection} section`);
      return;
    }

    try {
      await featuredProductService.createFeaturedProduct({
        product_id: parseInt(formData.product_id),
        section: selectedSection,
        display_order: formData.display_order,
        is_active: true
      });

      // Refresh the data
      await fetchFeaturedProducts();
      await fetchAvailableProducts();
      await fetchSectionStats();
      
      setFormData({ product_id: '', display_order: 0 });
      setShowAddModal(false);
      showSuccess('Product Added', 'Product has been added to featured list successfully!');
    } catch (error) {
      console.error('Error adding featured product:', error);
      showError('Error', 'Failed to add product to featured list. Please try again.');
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingProduct) return;

    try {
      await featuredProductService.updateFeaturedProduct(editingProduct.id, editFormData);
      
      // Refresh the data
      await fetchFeaturedProducts();
      await fetchSectionStats();
      
      setShowEditModal(false);
      setEditingProduct(null);
      showSuccess('Product Updated', 'Featured product has been updated successfully!');
    } catch (error) {
      console.error('Error updating featured product:', error);
      showError('Error', 'Failed to update featured product. Please try again.');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this product from featured list?')) {
      return;
    }

    try {
      await featuredProductService.deleteFeaturedProduct(id);
      
      // Refresh the data
      await fetchFeaturedProducts();
      await fetchAvailableProducts();
      await fetchSectionStats();
      
      showSuccess('Product Removed', 'Product has been removed from featured list successfully!');
    } catch (error) {
      console.error('Error deleting featured product:', error);
      showError('Error', 'Failed to remove product from featured list. Please try again.');
    }
  };


  const handleToggleTopProduct = async (productId: number) => {
    // Only allow Top toggle in Top Products section
    if (selectedSection !== 'top_products') {
      showWarning('Restricted Action', 'These changes can only be made from the Products tab.');
      return;
    }

    // Find the product to get its name for the confirmation dialog
    const product = featuredProducts.find(p => p.id === productId);
    const productName = product?.product_name || 'this product';

    // If the product is currently a top product, show confirmation before removing
    if (product?.section === 'top_products' || product?.product_is_top_product) {
      showConfirm(
        'Remove from Top Products',
        `Are you sure you want to remove "${productName}" from Top Products?\n\nThis will move the product back to the Products tab.`,
        () => {
          // User confirmed, proceed with the toggle
          proceedWithToggle(productId);
        },
        () => {
          // User cancelled, do nothing
        },
        'Yes',
        'No'
      );
      return; // Don't proceed immediately, wait for user confirmation
    }

    // If not currently a top product, proceed directly
    proceedWithToggle(productId);
  };

  const proceedWithToggle = async (productId: number) => {
    try {
      setActionLoading(`top-${productId}`);
      const response = await featuredProductService.toggleTopProductStatus(productId);
      
      if (response.success) {
        const newStatus = response.featured_product?.is_top_product ?? false;
        
        if (!newStatus) {
          // If Top toggle is disabled, remove product from featured list and show warning
          setFeaturedProducts(prev => prev.filter(product => product.id !== productId));
          showWarning('Product Removed', 'Product has been removed from Top Products and returned to the Products tab.');
          
          // Refresh the data to update counts
          await fetchAvailableProducts();
          await fetchSectionStats();
        } else {
          // If Top toggle is enabled, update the product in the list
          setFeaturedProducts(prev => prev.map(product => 
            product.id === productId 
              ? { ...product, is_top_product: newStatus }
              : product
          ));
        }
      }
    } catch (error) {
      console.error('Error toggling top product status:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleBestseller = async (productId: number) => {
    // Only allow Best toggle in Bestsellers section
    if (selectedSection !== 'bestsellers') {
      showWarning('Restricted Action', 'These changes can only be made from the Products tab.');
      return;
    }

    // Find the product to get its name for the confirmation dialog
    const product = featuredProducts.find(p => p.id === productId);
    const productName = product?.product_name || 'this product';

    // If the product is currently a bestseller, show confirmation before removing
    if (product?.section === 'bestsellers' || product?.product_is_bestseller) {
      showConfirm(
        'Remove from Bestsellers',
        `Are you sure you want to remove "${productName}" from Bestsellers?\n\nThis will move the product back to the Products tab.`,
        () => {
          // User confirmed, proceed with the toggle
          proceedWithBestsellerToggle(productId);
        },
        () => {
          // User cancelled, do nothing
        },
        'Yes',
        'No'
      );
      return; // Don't proceed immediately, wait for user confirmation
    }

    // If not currently a bestseller, proceed directly
    proceedWithBestsellerToggle(productId);
  };

  const proceedWithBestsellerToggle = async (productId: number) => {
    try {
      setActionLoading(`bestseller-${productId}`);
      const response = await featuredProductService.toggleBestsellerStatus(productId);
      
      if (response.success) {
        const newStatus = response.featured_product?.is_bestseller ?? false;
        
        if (!newStatus) {
          // If Best toggle is disabled, remove product from featured list and show warning
          setFeaturedProducts(prev => prev.filter(product => product.id !== productId));
          showWarning('Product Removed', 'Product has been removed from Bestsellers and returned to the Products tab.');
          
          // Refresh the data to update counts
          await fetchAvailableProducts();
          await fetchSectionStats();
        } else {
          // If Best toggle is enabled, update the product in the list
          setFeaturedProducts(prev => prev.map(product => 
            product.id === productId 
              ? { ...product, is_bestseller: newStatus }
              : product
          ));
        }
      }
    } catch (error) {
      console.error('Error toggling bestseller status:', error);
    } finally {
      setActionLoading(null);
    }
  };


  const toggleProductExpansion = (productId: number) => {
    setExpandedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const openEditModal = (product: FeaturedProduct) => {
    setEditingProduct(product);
    setEditFormData({
      display_order: product.display_order,
      is_active: product.is_active
    });
    setShowEditModal(true);
  };

  const getSectionIcon = (section: string) => {
    return section === 'top_products' ? <TrendingUp className="h-5 w-5" /> : <Award className="h-5 w-5" />;
  };

  const getSectionTitle = (section: string) => {
    return section === 'top_products' ? 'Top Products' : 'Bestsellers';
  };

  const getMaxLimit = (section: string) => {
    return section === 'top_products' ? 8 : 6;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-amber-600 dark:text-amber-400">Loading featured products...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="w-full px-3 sm:px-4 lg:px-6">
          <div className="py-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Featured Products</h1>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  Manage products displayed in Top Products and Bestsellers sections
                </p>
              </div>
              <Button
                onClick={() => setShowAddModal(true)}
                disabled={featuredProducts.length >= getMaxLimit(selectedSection)}
                className="group relative overflow-hidden bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 hover:from-pink-700 hover:via-rose-700 hover:to-pink-700 text-white font-semibold px-4 sm:px-6 py-2.5 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-pink-500/30 hover:border-pink-400/50 flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <Star className="w-4 h-4 relative z-10" />
                <Plus className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Add Product</span>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
              <Card>
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Total Featured</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none mt-0.5">
                        {featuredProducts.length}
                      </p>
                    </div>
                    <Package className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Active Products</p>
                      <p className="text-2xl font-bold text-green-600 leading-none mt-0.5">
                        {featuredProducts.filter(p => p.is_active).length}
                      </p>
                    </div>
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Inactive Products</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400 leading-none mt-0.5">
                        {featuredProducts.filter(p => !p.is_active).length}
                      </p>
                    </div>
                    <XCircle className="w-4 h-4 text-red-400 dark:text-red-500 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Available to Add</p>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 leading-none mt-0.5">
                        {Math.max(0, getMaxLimit(selectedSection) - featuredProducts.length)}
                      </p>
                      {(getMaxLimit(selectedSection) - featuredProducts.length) > 0 && (
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-none mt-0.5">
                          Max: {getMaxLimit(selectedSection)}
                        </p>
                      )}
                    </div>
                    <Plus className="w-4 h-4 text-orange-400 dark:text-orange-500 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full px-3 sm:px-4 lg:px-6 py-4 space-y-4">
        {/* Section Selector */}
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex gap-2 flex-wrap">
              {(['top_products', 'bestsellers'] as const).map((section) => (
                <button
                  key={section}
                  onClick={() => handleSectionChange(section)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    selectedSection === section
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                >
                  {getSectionIcon(section)}
                  {getSectionTitle(section)}
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    selectedSection === section
                      ? 'bg-primary-200 dark:bg-primary-800'
                      : 'bg-gray-200 dark:bg-gray-600'
                  }`}>
                    {sectionStats[section].active}/{sectionStats[section].max}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

      {/* Enhanced Filters */}
      <Card>
        <CardContent className="p-4 sm:p-5 md:p-6">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="flex-1">
              <Input
                placeholder="Search products by name, category, or subcategory..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            
            {/* Filter and Sort Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Status Filter - Custom Dropdown */}
              <div className="relative" ref={statusDropdownRef}>
                <button
                  onClick={() => {
                    setShowStatusDropdown(!showStatusDropdown);
                    setShowSortDropdown(false);
                  }}
                  className="flex items-center justify-between h-10 min-w-[180px] bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md px-4 hover:bg-gray-100 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 cursor-pointer group shadow-sm active:scale-[0.98] active:shadow-xs"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="p-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                      <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex flex-col items-start justify-center">
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide leading-none">Status</span>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-tight mt-0.5">
                        {statusFilter === 'all' && 'All Status'}
                        {statusFilter === 'active' && 'Active'}
                        {statusFilter === 'inactive' && 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform duration-300 flex-shrink-0 ${showStatusDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Status Dropdown Menu */}
                {showStatusDropdown && (
                  <div className="absolute top-full left-0 mt-2 min-w-[180px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl dark:shadow-black/40 z-50 overflow-hidden backdrop-blur-sm">
                    <div className="py-1.5">
                      <button
                        onClick={() => {
                          setStatusFilter('all');
                          setShowStatusDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 flex items-center justify-between ${
                          statusFilter === 'all' 
                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold border-l-2 border-primary-500 dark:border-primary-400' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <span>All Status</span>
                        {statusFilter === 'all' && (
                          <div className="w-2 h-2 rounded-full bg-primary-500 dark:bg-primary-400"></div>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setStatusFilter('active');
                          setShowStatusDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 flex items-center justify-between ${
                          statusFilter === 'active' 
                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold border-l-2 border-primary-500 dark:border-primary-400' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <span>Active</span>
                        {statusFilter === 'active' && (
                          <div className="w-2 h-2 rounded-full bg-primary-500 dark:bg-primary-400"></div>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setStatusFilter('inactive');
                          setShowStatusDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 flex items-center justify-between ${
                          statusFilter === 'inactive' 
                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold border-l-2 border-primary-500 dark:border-primary-400' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <span>Inactive</span>
                        {statusFilter === 'inactive' && (
                          <div className="w-2 h-2 rounded-full bg-primary-500 dark:bg-primary-400"></div>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sort Options - Custom Dropdown */}
              <div className="relative" ref={sortDropdownRef}>
                <button
                  onClick={() => {
                    setShowSortDropdown(!showSortDropdown);
                    setShowStatusDropdown(false);
                  }}
                  className="flex items-center justify-between h-10 min-w-[200px] bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md px-4 hover:bg-gray-100 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 cursor-pointer group shadow-sm active:scale-[0.98] active:shadow-xs"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="p-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                      <ArrowUpDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex flex-col items-start justify-center">
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide leading-none">Sort by</span>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-tight mt-0.5">
                        {sortBy === 'order' && 'Display Order'}
                        {sortBy === 'newest' && 'Newest First'}
                        {sortBy === 'oldest' && 'Oldest First'}
                        {sortBy === 'name' && 'Name A-Z'}
                        {sortBy === 'price' && 'Price Low-High'}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform duration-300 flex-shrink-0 ${showSortDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Sort Dropdown Menu */}
                {showSortDropdown && (
                  <div className="absolute top-full left-0 mt-2 min-w-[200px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl dark:shadow-black/40 z-50 overflow-hidden backdrop-blur-sm">
                    <div className="py-1.5">
                      <button
                        onClick={() => {
                          setSortBy('order');
                          setShowSortDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 flex items-center justify-between ${
                          sortBy === 'order' 
                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold border-l-2 border-primary-500 dark:border-primary-400' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <span>Display Order</span>
                        {sortBy === 'order' && (
                          <div className="w-2 h-2 rounded-full bg-primary-500 dark:bg-primary-400"></div>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setSortBy('newest');
                          setShowSortDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 flex items-center justify-between ${
                          sortBy === 'newest' 
                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold border-l-2 border-primary-500 dark:border-primary-400' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <span>Newest First</span>
                        {sortBy === 'newest' && (
                          <div className="w-2 h-2 rounded-full bg-primary-500 dark:bg-primary-400"></div>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setSortBy('oldest');
                          setShowSortDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 flex items-center justify-between ${
                          sortBy === 'oldest' 
                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold border-l-2 border-primary-500 dark:border-primary-400' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <span>Oldest First</span>
                        {sortBy === 'oldest' && (
                          <div className="w-2 h-2 rounded-full bg-primary-500 dark:bg-primary-400"></div>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setSortBy('name');
                          setShowSortDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 flex items-center justify-between ${
                          sortBy === 'name' 
                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold border-l-2 border-primary-500 dark:border-primary-400' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <span>Name A-Z</span>
                        {sortBy === 'name' && (
                          <div className="w-2 h-2 rounded-full bg-primary-500 dark:bg-primary-400"></div>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setSortBy('price');
                          setShowSortDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 flex items-center justify-between ${
                          sortBy === 'price' 
                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold border-l-2 border-primary-500 dark:border-primary-400' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <span>Price Low-High</span>
                        {sortBy === 'price' && (
                          <div className="w-2 h-2 rounded-full bg-primary-500 dark:bg-primary-400"></div>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Results Count */}
              <div className="ml-auto text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredProducts.length} of {featuredProducts.length} products
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Toolbar */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  fetchFeaturedProducts();
                  fetchAvailableProducts();
                  fetchSectionStats();
                }}
                disabled={loading}
                className="text-xs sm:text-sm font-semibold"
              >
                <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.open('/', '_blank')}
                className="text-xs sm:text-sm font-semibold"
              >
                <ExternalLink className="h-4 w-4 mr-1.5" />
                View Site
              </Button>
              <DashboardTooltip text="Export featured products data to CSV">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleExport}
                  className="text-xs sm:text-sm font-semibold"
                >
                  <Download className="h-4 w-4 mr-1.5" />
                  Export
                </Button>
              </DashboardTooltip>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                  title="Table view"
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                  title="Grid view"
                >
                  <Grid3x3 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <Card className="border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-900/20">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {selectedProducts.size} product(s) selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={actionLoading === 'bulk-delete'}
                  className="text-xs sm:text-sm font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  {actionLoading === 'bulk-delete' ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-1.5" />
                  )}
                  Remove
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedProducts(new Set())}
                  className="text-xs sm:text-sm font-semibold"
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Featured Products Table/Grid View */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {getSectionIcon(selectedSection)}
              {getSectionTitle(selectedSection)} ({filteredProducts.length}/{getMaxLimit(selectedSection)})
            </CardTitle>
            {filteredProducts.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                {selectedProducts.size === filteredProducts.length ? (
                  <>
                    <CheckSquare className="h-4 w-4" />
                    Deselect All
                  </>
                ) : (
                  <>
                    <Square className="h-4 w-4" />
                    Select All
                  </>
                )}
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No featured products found</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Add products to display them in the {getSectionTitle(selectedSection)} section
              </p>
            </div>
          ) : viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200 dark:divide-gray-700 table-fixed">
                <thead className="bg-chocolate-50 dark:bg-chocolate-900/20">
                  <tr>
                    <th className="w-12 px-6 py-3 text-center text-xs font-medium text-chocolate-700 dark:text-chocolate-300 uppercase tracking-wider">
                      <span></span>
                    </th>
                    <th className="w-20 px-6 py-3 text-left text-xs font-medium text-chocolate-700 dark:text-chocolate-300 uppercase tracking-wider">
                      Image
                    </th>
                    <th className="w-1/4 px-6 py-3 text-left text-xs font-medium text-chocolate-700 dark:text-chocolate-300 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="w-1/5 px-6 py-3 text-left text-xs font-medium text-chocolate-700 dark:text-chocolate-300 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="w-1/6 px-6 py-3 text-left text-xs font-medium text-chocolate-700 dark:text-chocolate-300 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="w-1/6 px-6 py-3 text-left text-xs font-medium text-chocolate-700 dark:text-chocolate-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="w-24 px-6 py-3 text-right text-xs font-medium text-chocolate-700 dark:text-chocolate-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredProducts.map((product, index) => {
                    const isSelected = selectedProducts.has(product.id);
                    return (
                      <React.Fragment key={product.id}>
                        {/* Main Product Row */}
                        <tr className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${isSelected ? 'bg-primary-50/30 dark:bg-primary-900/20' : ''}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => handleSelectProduct(product.id, !isSelected)}
                              className="flex items-center justify-center"
                            >
                              {isSelected ? (
                                <CheckSquare className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                              ) : (
                                <Square className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400" />
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            {product.product_image ? (
                      <img
                        src={product.product_image}
                        alt={product.product_name}
                                className="h-12 w-12 rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                                onError={(e) => {
                                  e.currentTarget.src = '/api/placeholder/48/48';
                                }}
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center border border-gray-300 dark:border-gray-600">
                                <Package className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <button
                            onClick={() => toggleProductExpansion(product.id)}
                            className="mr-3 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-400 dark:text-gray-500"
                            disabled={!product.variants || product.variants.length === 0}
                          >
                            {product.variants && product.variants.length > 0 ? (
                              expandedProducts.has(product.id) ? (
                                <span className="text-gray-400 dark:text-gray-500">▼</span>
                              ) : (
                                <span className="text-gray-400 dark:text-gray-500">▶</span>
                              )
                            ) : (
                              <span className="text-gray-300 dark:text-gray-600">•</span>
                            )}
                          </button>
                          <div className="min-w-0">
                            <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                          {product.product_name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {product.product_weight} • {formatCurrency(product.product_price)}
                              {product.variants && product.variants.length > 0 && (
                                <span className="ml-2 text-blue-600 dark:text-blue-400">
                                  ({product.variants.length} variation{product.variants.length !== 1 ? 's' : ''})
                                </span>
                              )}
                            </div>
                      </div>
                    </div>
                  </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="min-w-0">
                          <div className="text-sm text-gray-900 dark:text-white truncate">
                            {product.category_name || 'Unknown'}
                          </div>
                          {product.subcategory_name && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {product.subcategory_name}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatCurrency(product.product_discounted_price || product.product_price)}
                          </div>
                          {product.product_discount_percent && product.product_discount_percent > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                              {product.product_discount_percent}% OFF
                    </span>
                          )}
                        </div>
                        {product.product_discount_percent && product.product_discount_percent > 0 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 line-through">
                            {formatCurrency(product.product_price)}
                          </div>
                        )}
                  </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {/* Top Product Button */}
                          <button
                            onClick={() => handleToggleTopProduct(product.id)}
                            disabled={actionLoading === `top-${product.id}` || selectedSection !== 'top_products'}
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium transition-all duration-200 ${
                              product.section === 'top_products' || product.product_is_top_product
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400 shadow-sm'
                                : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 opacity-60'
                            } ${actionLoading === `top-${product.id}` || selectedSection !== 'top_products' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
                            title={selectedSection === 'top_products' ? (product.is_top_product ? 'Remove from Top Products' : 'Mark as Top Product') : 'Changes can only be made from the Products tab'}
                          >
                            {actionLoading === `top-${product.id}` ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <Star className={`h-3 w-3 mr-1 ${product.section === 'top_products' || product.product_is_top_product ? 'fill-current' : ''}`} />
                            )}
                            Top
                          </button>

                          {/* Bestseller Button */}
                          <button
                            onClick={() => {
                              if (selectedSection !== 'bestsellers') {
                                showWarning('Restricted Action', 'These can only be managed in the main Products tab.');
                                return;
                              }
                              if (actionLoading === `bestseller-${product.id}`) {
                                return;
                              }
                              handleToggleBestseller(product.id);
                            }}
                            disabled={actionLoading === `bestseller-${product.id}`}
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium transition-all duration-200 ${
                              product.section === 'bestsellers' || product.product_is_bestseller
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 shadow-sm'
                                : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 opacity-60'
                            } ${actionLoading === `bestseller-${product.id}` ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
                            title={selectedSection === 'bestsellers' ? (product.is_bestseller ? 'Remove from Bestsellers' : 'Mark as Bestseller') : 'Changes can only be made from the Products tab'}
                          >
                            {actionLoading === `bestseller-${product.id}` ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <Award className={`h-3 w-3 mr-1 ${product.section === 'bestsellers' || product.product_is_bestseller ? 'fill-current' : ''}`} />
                            )}
                            Best
                          </button>

                          {/* Featured Button */}
                          <button
                            onClick={() => showWarning('Restricted Action', 'These can only be managed in the main Products tab.')}
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium transition-all duration-200 ${
                              product.is_featured
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 shadow-sm'
                                : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 opacity-60'
                            } opacity-50 cursor-pointer hover:opacity-80`}
                            title="Changes can only be made from the Products tab"
                          >
                            <Star className={`h-3 w-3 mr-1 ${product.is_featured ? 'fill-current' : ''}`} />
                            Featured
                          </button>

                          {/* Active/Inactive Button */}
                          <button
                            onClick={() => showWarning('Restricted Action', 'These can only be managed in the main Products tab.')}
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium transition-all duration-200 ${
                      product.is_active
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 shadow-sm'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 shadow-sm'
                            } opacity-50 cursor-pointer hover:opacity-80`}
                            title="Changes can only be made from the Products tab"
                          >
                            <div className={`h-2 w-2 mr-1 rounded-full ${product.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                      {product.is_active ? 'Active' : 'Inactive'}
                          </button>
                        </div>
                  </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => openEditModal(product)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                            disabled={actionLoading === `edit-${product.id}`}
                      >
                            {actionLoading === `edit-${product.id}` ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                        <Edit className="h-4 w-4" />
                            )}
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            disabled={actionLoading === `delete-${product.id}`}
                      >
                            {actionLoading === `delete-${product.id}` ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                        <Trash2 className="h-4 w-4" />
                            )}
                      </button>
                    </div>
                  </td>
                </tr>

                    {/* Product Variations Rows */}
                    {expandedProducts.has(product.id) && product.variants && product.variants.length > 0 && (
                      <>
                        {product.variants.map((variant, variantIndex) => (
                          <tr key={`${product.id}-variant-${variant.id}`} className="bg-gray-50 dark:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  {product.product_image ? (
                                    <img
                                      src={product.product_image}
                                      alt={variant.name || variant.weight}
                                      className="h-10 w-10 rounded-lg object-cover border border-gray-200 dark:border-gray-600 opacity-75"
                                      onError={(e) => {
                                        e.currentTarget.src = '/api/placeholder/40/40';
                                      }}
                                    />
                                  ) : (
                                    <div className="h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center opacity-75">
                                      <Package className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center pl-8 min-w-0">
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm text-gray-600 dark:text-gray-300 truncate">
                                    <span className="font-medium">Variation {variantIndex + 1}:</span> {variant.name || variant.weight}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {variant.weight}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                <span className="text-xs">Variant of:</span> {product.product_name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {formatCurrency(variant.discounted_price || variant.price)}
                                </div>
                                {variant.discount_percent && variant.discount_percent > 0 && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                    {variant.discount_percent}% OFF
                                  </span>
                                )}
                              </div>
                              {variant.discount_percent && variant.discount_percent > 0 && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 line-through">
                                  {formatCurrency(variant.price)}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  variant.is_available
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                }`}>
                                  {variant.is_available ? 'Available' : 'Unavailable'}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  Stock: {variant.stock_quantity}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Variant
                              </div>
                            </td>
                          </tr>
                        ))}
                      </>
                    )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 sm:p-5 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
                  {filteredProducts.map((product) => {
                    const isSelected = selectedProducts.has(product.id);
                    return (
                      <Card key={product.id} className={`hover:shadow-lg transition-all duration-200 overflow-hidden group ${isSelected ? 'ring-2 ring-primary-500 dark:ring-primary-400' : ''}`}>
                        <div className="relative">
                          {product.product_image ? (
                            <div className="w-full h-40 sm:h-48 bg-gray-100 dark:bg-gray-700 overflow-hidden">
                              <img 
                                src={product.product_image} 
                                alt={product.product_name} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                onError={(e) => {
                                  e.currentTarget.src = '/api/placeholder/200/200';
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-full h-40 sm:h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                              <Package className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2 flex items-center gap-2">
                            <button
                              onClick={() => handleSelectProduct(product.id, !isSelected)}
                              className="bg-white dark:bg-gray-800 rounded-lg p-1.5 shadow-md hover:shadow-lg transition-shadow"
                            >
                              {isSelected ? (
                                <CheckSquare className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                              ) : (
                                <Square className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                              )}
                            </button>
                            {product.is_active ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                                Inactive
                              </span>
                            )}
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base line-clamp-1">
                                {product.product_name}
                              </h3>
                              {product.category_name && (
                                <div className="mt-1">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                                    {product.category_name}
                                    {product.subcategory_name && ` > ${product.subcategory_name}`}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-lg font-bold text-gray-900 dark:text-white">
                                  {formatCurrency(product.product_discounted_price || product.product_price)}
                                </div>
                                {product.product_discount_percent && product.product_discount_percent > 0 && (
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-gray-500 dark:text-gray-400 line-through">
                                      {formatCurrency(product.product_price)}
                                    </span>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                                      {product.product_discount_percent}% OFF
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                              <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                                <Clock className="h-3 w-3" />
                                <span>Order: {product.display_order}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={() => openEditModal(product)}
                                  className="p-1.5 text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                  title="Edit"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                  title="Remove"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
        </CardContent>
      </Card>
      </div>

      {/* Add Product Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={`Add Product to ${getSectionTitle(selectedSection)}`}
      >
        <form onSubmit={handleAddProduct} className="space-y-4">
          {/* Section Info */}
          <div className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2">
              {getSectionIcon(selectedSection)}
              <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                {getSectionTitle(selectedSection)} Section
              </span>
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              Maximum {getMaxLimit(selectedSection)} products allowed for {getSectionTitle(selectedSection)} section
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Product
            </label>
            <select
              value={formData.product_id}
              onChange={(e) => setFormData(prev => ({ ...prev, product_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 focus:border-transparent dark:bg-gray-800 dark:text-white bg-white"
              required
            >
              <option value="">Choose a product...</option>
              {availableProducts.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} - {formatCurrency(product.base_price)}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <Input
              label="Display Order"
              type="number"
              value={formData.display_order}
              onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
              min="0"
              placeholder="0"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Add Product
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Featured Product"
      >
        {editingProduct && (
          <form onSubmit={handleUpdateProduct} className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <img
                src={editingProduct.product_image}
                alt={editingProduct.product_name}
                className="w-10 h-10 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
              />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {editingProduct.product_name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatCurrency(editingProduct.product_price)}
                </p>
              </div>
            </div>
            
            <div>
              <Input
                label="Display Order"
                type="number"
                value={editFormData.display_order}
                onChange={(e) => setEditFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                min="0"
                placeholder="0"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={editFormData.is_active}
                onChange={(e) => setEditFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="rounded border-gray-300 text-amber-500 focus:ring-amber-500"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Active
              </label>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                Update Product
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Product Details Modal */}
      <Modal
        isOpen={showDetailsModal !== null}
        onClose={() => setShowDetailsModal(null)}
        title={`Product Details - ${showDetailsModal?.product_name}`}
        size="xl"
      >
        {showDetailsModal && (
          <div className="space-y-6">
            {/* Product Info */}
            <div className="flex items-start gap-4">
              <img
                src={showDetailsModal.product_image}
                alt={showDetailsModal.product_name}
                className="w-24 h-24 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
              />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {showDetailsModal.product_name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {showDetailsModal.category_name} {showDetailsModal.subcategory_name && `> ${showDetailsModal.subcategory_name}`}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatCurrency(showDetailsModal.product_price)}
                  </span>
                  {showDetailsModal.product_discount_percent && showDetailsModal.product_discount_percent > 0 && (
                    <span className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded">
                      -{showDetailsModal.product_discount_percent}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Variants */}
            {showDetailsModal.variants && showDetailsModal.variants.length > 0 && (
              <div>
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                  Product Variants ({showDetailsModal.variants.length})
                </h4>
                <div className="space-y-2">
                  {showDetailsModal.variants.map((variant) => (
                    <div key={variant.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{variant.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{variant.weight}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(variant.price)}</p>
                        {variant.discount_percent && variant.discount_percent > 0 && (
                          <p className="text-sm text-red-600 dark:text-red-400">-{variant.discount_percent}%</p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400">Stock: {variant.stock_quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gallery Images */}
            {showDetailsModal.gallery_images && showDetailsModal.gallery_images.length > 0 && (
              <div>
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                  Gallery Images ({showDetailsModal.gallery_images.length})
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {showDetailsModal.gallery_images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${showDetailsModal.product_name} - ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">Description</h4>
              <div 
                className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
                dangerouslySetInnerHTML={{ __html: showDetailsModal.product_description }}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
