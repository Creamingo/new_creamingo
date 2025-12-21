import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChefHat,
  Search,
  RefreshCw,
  Package,
  CheckCircle,
  Clock,
  Calendar,
  User,
  MessageSquare,
  FileText,
  AlertCircle,
  Filter,
  BarChart3,
  ChevronRight,
  ChevronDown,
  X,
  Eye,
  MapPin,
  CreditCard,
  Gift,
  Cake,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal, ModalFooter } from '../components/ui/Modal';
import orderService, { Order } from '../services/orderService';
import dealService, { Deal } from '../services/dealService';
import { useToastContext } from '../contexts/ToastContext';

// Format currency
const formatCurrency = (amount: number | string): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return '₹0';
  return `₹${numAmount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

// Format date and time
const formatDateTime = (dateString: string, timeString?: string): string => {
  try {
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    if (timeString) {
      return `${formattedDate} at ${timeString}`;
    }
    return formattedDate;
  } catch {
    return dateString;
  }
};

// Format delivery address
const formatAddress = (address: string | any): string => {
  if (!address) return 'N/A';
  
  // If it's already a formatted string, return it
  if (typeof address === 'string' && !address.startsWith('{')) {
    return address;
  }

  // Try to parse JSON
  try {
    let addressObj: any;
    if (typeof address === 'string') {
      addressObj = JSON.parse(address);
    } else {
      addressObj = address;
    }

    // Format the address object into a readable string
    const parts: string[] = [];
    if (addressObj.street) parts.push(addressObj.street);
    if (addressObj.city) parts.push(addressObj.city);
    if (addressObj.state) parts.push(addressObj.state);
    if (addressObj.zip_code) parts.push(addressObj.zip_code);
    if (addressObj.country) parts.push(addressObj.country);

    return parts.length > 0 ? parts.join(', ') : 'N/A';
  } catch {
    // If parsing fails, return the original string
    return typeof address === 'string' ? address : 'N/A';
  }
};

// Translation object for Hindi/English
const translations = {
  en: {
    currentStatus: 'Current Status',
    customerName: 'Customer Name',
    orderItems: 'Order Items',
    weight: 'Weight',
    quantity: 'Quantity',
    deliveryInformation: 'Delivery Information',
    date: 'Date',
    time: 'Time',
    address: 'Address',
    specialInstructions: 'Special Instructions',
    cakeMessages: 'Cake Messages',
    paymentInformation: 'Payment Information',
    status: 'Status',
    close: 'Close',
    markAsPreparing: 'Mark as Preparing',
    markAsReady: 'Mark as Ready',
    confirmed: 'Confirmed',
    preparing: 'Preparing',
    ready: 'Ready',
    paid: 'Paid',
    pending: 'Pending',
    failed: 'Failed',
    refunded: 'Refunded'
  },
  hi: {
    currentStatus: 'वर्तमान स्थिति',
    customerName: 'ग्राहक का नाम',
    orderItems: 'ऑर्डर आइटम',
    weight: 'वजन',
    quantity: 'मात्रा',
    deliveryInformation: 'डिलीवरी जानकारी',
    date: 'तारीख',
    time: 'समय',
    address: 'पता',
    specialInstructions: 'विशेष निर्देश',
    cakeMessages: 'केक संदेश',
    paymentInformation: 'भुगतान जानकारी',
    status: 'स्थिति',
    close: 'बंद करें',
    markAsPreparing: 'तैयार करना शुरू करें',
    markAsReady: 'तैयार के रूप में चिह्नित करें',
    confirmed: 'पुष्ट',
    preparing: 'तैयार कर रहे हैं',
    ready: 'तैयार',
    paid: 'भुगतान किया',
    pending: 'लंबित',
    failed: 'असफल',
    refunded: 'वापस किया गया'
  }
};

// Get status badge
const getStatusBadge = (status: string, lang: 'en' | 'hi' = 'en') => {
  const statusConfig = {
    confirmed: { color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700', icon: CheckCircle, label: translations[lang].confirmed },
    preparing: { color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-700', icon: Package, label: translations[lang].preparing },
    ready: { color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700', icon: CheckCircle, label: translations[lang].ready }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.confirmed;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${config.color}`}>
      <Icon className="h-4 w-4" />
      {config.label}
    </span>
  );
};

interface BakeryProductionProps {}

type TabType = 'confirmed' | 'preparing' | 'ready';

const BakeryProduction: React.FC<BakeryProductionProps> = () => {
  const { showSuccess, showError } = useToastContext();

  // State management
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('confirmed');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [showStats, setShowStats] = useState(false);
  const [sortBy, setSortBy] = useState<'delivery' | 'created'>('delivery');
  const [expandedDealItems, setExpandedDealItems] = useState<Set<string>>(new Set());
  const [imageModal, setImageModal] = useState<{ isOpen: boolean; imageUrl: string; productName: string }>({
    isOpen: false,
    imageUrl: '',
    productName: ''
  });
  const [imageZoom, setImageZoom] = useState(100);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [activeDeals, setActiveDeals] = useState<Deal[]>([]);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch orders with status: confirmed, preparing, ready and load deal configs
      const [
        confirmedResponse,
        preparingResponse,
        readyResponse,
        dealsResponse
      ] = await Promise.all([
        orderService.getOrders({ status: 'confirmed', limit: 1000 }),
        orderService.getOrders({ status: 'preparing', limit: 1000 }),
        orderService.getOrders({ status: 'ready', limit: 1000 }),
        dealService
          .getDeals()
          .catch(error => {
            console.error('Error fetching deals for Bakery Production:', error);
            return { success: false, data: [] as Deal[] };
          })
      ]);

      const allOrders = [
        ...(confirmedResponse.orders || []),
        ...(preparingResponse.orders || []),
        ...(readyResponse.orders || [])
      ];

      setOrders(allOrders);

      // Store active deals (used to accurately identify deal items)
      if (dealsResponse && dealsResponse.success) {
        const onlyActiveDeals = (dealsResponse.data || []).filter(deal => deal.is_active);
        setActiveDeals(onlyActiveDeals);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      showError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  // Filter and sort orders
  useEffect(() => {
    let filtered = orders.filter(order => {
      // Filter by active tab
      if (order.status !== activeTab) return false;

      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          order.id.toLowerCase().includes(searchLower) ||
          order.order_number?.toLowerCase().includes(searchLower) ||
          order.customerName.toLowerCase().includes(searchLower) ||
          order.items.some(item => item.productName.toLowerCase().includes(searchLower))
        );
      }

      return true;
    });

    // Sort orders
    filtered.sort((a, b) => {
      if (sortBy === 'delivery') {
        const dateA = new Date(`${a.deliveryDate} ${a.deliveryTime || ''}`).getTime();
        const dateB = new Date(`${b.deliveryDate} ${b.deliveryTime || ''}`).getTime();
        return dateA - dateB;
      } else {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      }
    });

    setFilteredOrders(filtered);
  }, [orders, activeTab, searchTerm, sortBy]);

  // Load orders on mount
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Keyboard shortcuts for image modal
  useEffect(() => {
    if (!imageModal.isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeImageModal();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        handleResetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [imageModal.isOpen]);

  // Get order counts for tabs
  const orderCounts = useMemo(() => {
    return {
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      preparing: orders.filter(o => o.status === 'preparing').length,
      ready: orders.filter(o => o.status === 'ready').length
    };
  }, [orders]);

  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: 'preparing' | 'ready') => {
    try {
      setIsUpdating(true);
      await orderService.updateOrder(orderId, { status: newStatus });
      showSuccess(`Order marked as ${newStatus === 'preparing' ? 'Preparing' : 'Ready'}`);
      
      // Refresh orders
      await fetchOrders();
      
      // Close modal if open
      if (isDetailModalOpen) {
        setIsDetailModalOpen(false);
        setSelectedOrder(null);
      }

      // Clear selection
      setSelectedOrders([]);
    } catch (error) {
      console.error('Error updating order status:', error);
      showError('Failed to update order status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Batch update orders
  const batchUpdateOrders = async (newStatus: 'preparing' | 'ready') => {
    if (selectedOrders.length === 0) return;

    try {
      setIsUpdating(true);
      await Promise.all(
        selectedOrders.map(orderId => orderService.updateOrder(orderId, { status: newStatus }))
      );
      showSuccess(`${selectedOrders.length} order(s) marked as ${newStatus === 'preparing' ? 'Preparing' : 'Ready'}`);
      
      await fetchOrders();
      setSelectedOrders([]);
    } catch (error) {
      console.error('Error batch updating orders:', error);
      showError('Failed to update orders. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Toggle order selection
  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  // Calculate stats
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= today;
    });

    const preparingOrders = orders.filter(o => o.status === 'preparing');
    const readyOrders = orders.filter(o => o.status === 'ready');

    return {
      totalToday: todayOrders.length,
      preparing: preparingOrders.length,
      ready: readyOrders.length
    };
  }, [orders]);

  // Determine if an item is a deal/add-on using both backend deal configs and fallback heuristics
  const isDealItemForDisplay = useCallback(
    (item: any): boolean => {
      if (!item || typeof item === 'string') return false;

      // 1) Check against active One Rupee Deal configurations (authoritative source)
      if (activeDeals.length > 0) {
        const productId = Number(item.productId || item.product_id);
        const price = item.price !== undefined ? Number(item.price) : NaN;

        if (!isNaN(productId) && !isNaN(price)) {
          const matchesConfiguredDeal = activeDeals.some(deal => {
            if (!deal.is_active) return false;
            if (deal.product_id !== productId) return false;
            const dealPrice = Number(deal.deal_price);
            if (isNaN(dealPrice)) return false;
            // Match price within small tolerance (same logic as backfill)
            return Math.abs(dealPrice - price) < 0.01;
          });

          if (matchesConfiguredDeal) {
            return true;
          }
        }
      }

      // 2) Fallback to existing heuristic-based detection
      return isDealOrAddonItem(item);
    },
    [activeDeals]
  );

  // Handle order card click
  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  // Helper to identify deal / add-on items
  const isDealOrAddonItem = (item: any): boolean => {
    if (!item || typeof item === 'string') return false;
    
    const name = (item.productName || item.product_name || '').toString().toLowerCase();
    const flags = [
      item.isDeal,
      item.is_deal,
      item.dealType,
      item.isAddon,
      item.is_addon
    ];
    
    const looksLikeDealName = name.includes('deal') || name.includes('add-on') || name.includes('addon');
    
    // Treat ultra-low price items (like ₹1 deals) as deal/add-ons, but only if explicitly priced
    const numericPrice = item.price !== undefined ? Number(item.price) : NaN;
    const looksLikeLowPriceDeal = !isNaN(numericPrice) && numericPrice > 0 && numericPrice <= 1;
    
    return flags.some(Boolean) || looksLikeDealName || looksLikeLowPriceDeal;
  };

  // Toggle deal items expansion
  const toggleDealItems = (orderId: string) => {
    setExpandedDealItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  // Get flavor display text
  const getFlavorText = (item: any): string => {
    const flavorName = item?.flavor_name;
    const flavorId = item?.flavor_id;
    const productSubcategory = item?.product_subcategory_name;
    
    if (flavorId != null && flavorId !== 0 && flavorName) {
      return flavorName;
    } else if (productSubcategory) {
      return productSubcategory;
    } else {
      return 'Not Selected';
    }
  };

  // Get product image from item
  const getProductImage = (item: any): string | null => {
    const image = item.product_image 
      || item.image_url 
      || item.productImage 
      || item.image
      || null;
    
    // Debug: Log if image is missing (only in development)
    if (!image && process.env.NODE_ENV === 'development') {
      console.debug('No image found for item:', item.productName, 'Available fields:', Object.keys(item));
    }
    
    return image;
  };

  // Open image modal
  const openImageModal = (imageUrl: string, productName: string) => {
    setImageModal({ isOpen: true, imageUrl, productName });
    setImageZoom(100);
  };

  // Close image modal
  const closeImageModal = () => {
    setImageModal({ isOpen: false, imageUrl: '', productName: '' });
    setImageZoom(100);
  };

  // Handle zoom controls
  const handleZoomIn = () => {
    setImageZoom(prev => Math.min(prev + 25, 300));
  };

  const handleZoomOut = () => {
    setImageZoom(prev => Math.max(prev - 25, 50));
  };

  const handleResetZoom = () => {
    setImageZoom(100);
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden">
      {/* Header - Sticky */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 flex-shrink-0">
        <div className="px-4 py-4 md:px-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <ChefHat className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">Bakery Production</h1>
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Manage order preparation workflow</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowStats(!showStats)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Toggle Stats"
              >
                <BarChart3 className="h-5 w-5" />
              </button>
              <button
                onClick={fetchOrders}
                disabled={loading}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Stats Section (Collapsible) */}
          {showStats && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              <Card>
                <CardContent className="p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Today's Orders</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.totalToday}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">In Preparation</p>
                  <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{stats.preparing}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ready</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">{stats.ready}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Tabs, Search and Sort - Sticky Row */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="px-4 md:px-6 py-2.5 md:py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Tabs */}
            <div className="flex w-full md:w-auto overflow-x-auto">
              <button
                onClick={() => {
                  setActiveTab('confirmed');
                  setSelectedOrders([]);
                }}
                className={`flex-1 md:flex-none px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'confirmed'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  Confirmed
                  {orderCounts.confirmed > 0 && (
                    <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                      {orderCounts.confirmed}
                    </span>
                  )}
                </span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('preparing');
                  setSelectedOrders([]);
                }}
                className={`flex-1 md:flex-none px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'preparing'
                    ? 'border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  Preparing
                  {orderCounts.preparing > 0 && (
                    <span className="bg-orange-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                      {orderCounts.preparing}
                    </span>
                  )}
                </span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('ready');
                  setSelectedOrders([]);
                }}
                className={`flex-1 md:flex-none px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'ready'
                    ? 'border-green-500 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  Ready
                  {orderCounts.ready > 0 && (
                    <span className="bg-green-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                      {orderCounts.ready}
                    </span>
                  )}
                </span>
              </button>
            </div>

            {/* Search and Sort */}
            <div className="flex w-full md:w-auto gap-3 md:justify-end">
              <div className="flex-1 md:w-72 lg:w-96 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search by Order ID, Customer, or Product..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm"
                />
              </div>
              
              {/* Custom Sort Dropdown */}
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                  className="w-full md:w-auto px-3 md:px-4 py-2.5 text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 flex items-center justify-between gap-1.5 md:gap-2 shadow-sm hover:shadow-md whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5 md:gap-2 min-w-0 flex-1">
                    <Filter className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    <span className="truncate">
                      {sortBy === 'delivery' ? 'Sort by Delivery Time' : 'Sort by Created Date'}
                    </span>
                  </div>
                  <ChevronDown 
                    className={`h-3.5 w-3.5 md:h-4 md:w-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 flex-shrink-0 ${
                      isSortDropdownOpen ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>
                
                {/* Dropdown Menu */}
                {isSortDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setIsSortDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-full md:w-56 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setSortBy('delivery');
                            setIsSortDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 md:px-4 py-2.5 text-xs md:text-sm flex items-center gap-2 transition-colors whitespace-nowrap ${
                            sortBy === 'delivery'
                              ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-semibold'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
                          <span className="truncate">Sort by Delivery Time</span>
                          {sortBy === 'delivery' && (
                            <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 ml-auto text-primary-600 dark:text-primary-400 flex-shrink-0" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setSortBy('created');
                            setIsSortDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 md:px-4 py-2.5 text-xs md:text-sm flex items-center gap-2 transition-colors whitespace-nowrap ${
                            sortBy === 'created'
                              ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-semibold'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
                          <span className="truncate">Sort by Created Date</span>
                          {sortBy === 'created' && (
                            <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 ml-auto text-primary-600 dark:text-primary-400 flex-shrink-0" />
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Grid - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 pb-20 md:pb-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 text-gray-400 dark:text-gray-500 animate-spin" />
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading orders...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-300 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 font-medium">No {activeTab} orders found</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {searchTerm ? 'Try adjusting your search' : 'Orders will appear here once available'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
            {filteredOrders.map((order) => {
              const isSelected = selectedOrders.includes(order.id);
              const isDealItemsExpanded = expandedDealItems.has(order.id);
              
              // Separate main items and deal items
              const mainItems = order.items.filter(item => !isDealItemForDisplay(item));
              const dealItems = order.items.filter(item => isDealItemForDisplay(item));

              return (
                <div
                  key={order.id}
                  className={`transition-all relative ${
                    isSelected ? 'ring-2 ring-primary-500 ring-offset-2' : ''
                  }`}
                >
                  <Card
                    className={`hover:shadow-xl transition-all duration-300 overflow-hidden border-2 ${
                      isSelected 
                        ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-400' 
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {/* Selection Checkbox (for batch mode) */}
                    {selectedOrders.length > 0 && (
                      <div className="absolute top-3 left-3 z-20">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleOrderSelection(order.id);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="h-6 w-6 rounded border-2 border-gray-300 dark:border-gray-600 text-primary-600 dark:text-primary-400 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 bg-white dark:bg-gray-700 shadow-lg cursor-pointer"
                        />
                      </div>
                    )}

                    {/* Status Header - Color Coded */}
                    <div className={`px-2.5 py-1.5 flex items-center justify-between ${
                      order.status === 'confirmed' 
                        ? 'bg-blue-500 text-white' 
                        : order.status === 'preparing'
                        ? 'bg-orange-500 text-white'
                        : 'bg-green-500 text-white'
                    }`}>
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        {order.status === 'confirmed' && <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />}
                        {order.status === 'preparing' && <Package className="h-3.5 w-3.5 flex-shrink-0" />}
                        {order.status === 'ready' && <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />}
                        <span className="font-bold text-xs uppercase tracking-wide">
                          {order.status === 'confirmed' ? 'Confirmed' : order.status === 'preparing' ? 'Preparing' : 'Ready'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="text-[10px] font-semibold bg-white/20 px-1.5 py-0.5 rounded">
                          #{order.order_number || order.id.slice(-6)}
                        </span>
                        <span className="text-xs font-bold">
                          {formatCurrency(order.total)}
                        </span>
                      </div>
                    </div>

                    <CardContent className="p-3 md:p-4">
                      {/* Main Items Section */}
                      {mainItems.length > 0 ? (
                        <div className="mb-3">
                          <div className="flex items-center gap-1.5 mb-2">
                            <div className="p-1 bg-purple-100 dark:bg-purple-900/30 rounded">
                              <Cake className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                              Main Items {mainItems.length > 1 && `(${mainItems.length})`}
                            </h3>
                          </div>
                          
                          <div
                            className={
                              mainItems.length > 1
                                ? 'space-y-2 md:space-y-0 md:flex md:gap-2.5 md:overflow-x-auto md:pb-1.5 md:-mx-1.5 md:px-1.5'
                                : 'space-y-2'
                            }
                          >
                            {mainItems.map((item, index) => {
                              const productImage = getProductImage(item);
                              return (
                                <div 
                                  key={item.id || index}
                                  className={`bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2.5 border border-gray-200 dark:border-gray-700 ${
                                    mainItems.length > 1 ? 'md:flex-none md:w-[87%]' : ''
                                  }`}
                                >
                                  <div className="flex gap-2.5">
                                    {/* Product Image */}
                                    <div 
                                      className="relative w-16 h-16 sm:w-20 sm:h-20 bg-white dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-90 transition-opacity shadow-sm group"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (productImage) {
                                          openImageModal(productImage, item.productName);
                                        }
                                      }}
                                    >
                                      {productImage ? (
                                        <>
                                          <img 
                                            src={productImage} 
                                            alt={item.productName}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                          />
                                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                                            <ZoomIn className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                          </div>
                                        </>
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                                          <Package className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Product Details */}
                                    <div className="flex-1 min-w-0">
                                      {/* Product Name */}
                                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1.5 leading-tight">
                                        {item.productName}
                                      </p>
                                      
                                      {/* Compact Info Row */}
                                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                                        <div className="flex items-center gap-1">
                                          <span className="text-gray-500 dark:text-gray-400">Flavor:</span>
                                          <span className="text-gray-900 dark:text-gray-100 font-semibold">
                                            {getFlavorText(item)}
                                          </span>
                                        </div>
                                        
                                        <div className="flex items-center gap-1">
                                          <span className="text-gray-500 dark:text-gray-400">Tier:</span>
                                          <span className="text-gray-900 dark:text-gray-100 font-semibold">
                                            {(item as any)?.tier || '1'}
                                          </span>
                                        </div>
                                        
                                        {item.weight && (
                                          <div className="flex items-center gap-1">
                                            <span className="text-gray-500 dark:text-gray-400">Weight:</span>
                                            <span className="text-gray-900 dark:text-gray-100 font-semibold">
                                              {item.weight}
                                            </span>
                                          </div>
                                        )}
                                        
                                        <div className="flex items-center gap-1">
                                          <span className="text-gray-500 dark:text-gray-400">Qty:</span>
                                          <span className="text-gray-900 dark:text-gray-100 font-bold text-sm">
                                            {item.quantity || 1}
                                          </span>
                                        </div>
                                      </div>
                                      
                                      {/* Cake Message - If exists */}
                                      {(item as any)?.cake_message && (
                                        <div className="mt-1.5 pt-1.5 border-t border-gray-200 dark:border-gray-700">
                                          <div className="flex items-start gap-1.5">
                                            <MessageSquare className="h-3.5 w-3.5 text-pink-500 flex-shrink-0 mt-0.5" />
                                            <div>
                                              <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Message:</span>
                                              <p className="text-xs font-semibold text-pink-700 dark:text-pink-400 italic leading-tight">
                                                "{(item as any).cake_message}"
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : order.items.length === 0 ? (
                        <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
                          <Package className="h-6 w-6 text-gray-400 dark:text-gray-500 mx-auto mb-1.5" />
                          <p className="text-xs text-gray-600 dark:text-gray-400">No items in this order</p>
                        </div>
                      ) : null}

                      {/* Deal Items Section - Collapsible */}
                      {dealItems.length > 0 && (
                        <div className="mb-2 mt-1 rounded-lg bg-amber-50/60 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/60">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDealItems(order.id);
                            }}
                            className="w-full flex items-center justify-between gap-1.5 px-2 py-1.5 hover:bg-amber-100/70 dark:hover:bg-amber-900/40 rounded-t-lg transition-colors"
                          >
                            <div className="flex items-center gap-1.5">
                              <div className="p-1 bg-amber-500/90 rounded-md shadow-sm">
                                <Gift className="h-3.5 w-3.5 text-white" />
                              </div>
                              <div className="flex items-center gap-1.5">
                                <h3 className="text-xs font-bold text-amber-900 dark:text-amber-100 uppercase tracking-wide">
                                  Deal Items
                                </h3>
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/90 text-amber-800 border border-amber-200">
                                  {dealItems.length}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-amber-800/80 dark:text-amber-100/80">
                              <span className="hidden sm:inline">Tap to view all</span>
                              {isDealItemsExpanded ? (
                                <ChevronDown className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5" />
                              )}
                            </div>
                          </button>
                          
                          {isDealItemsExpanded && (
                            <div className="space-y-1.5 px-2 pb-2.5 pt-1.5 border-t border-amber-200 dark:border-amber-800">
                              {dealItems.map((item, index) => {
                                const productImage = getProductImage(item);
                                return (
                                  <div 
                                    key={item.id || `deal-${index}`}
                                    className="bg-white/90 dark:bg-amber-950/40 rounded-lg p-1.5 border border-amber-200/90 dark:border-amber-700 shadow-[0_1px_3px_rgba(148,81,7,0.18)]"
                                  >
                                    <div className="flex gap-1.5">
                                      {/* Product Image */}
                                      <div 
                                        className="relative w-11 h-11 sm:w-12 sm:h-12 bg-amber-50 dark:bg-amber-950 rounded-md overflow-hidden flex-shrink-0 border border-amber-200 dark:border-amber-700 cursor-pointer hover:opacity-95 transition-opacity group"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (productImage) {
                                            openImageModal(productImage, item.productName);
                                          }
                                        }}
                                      >
                                        {productImage ? (
                                          <>
                                            <img 
                                              src={productImage} 
                                              alt={item.productName}
                                              className="w-full h-full object-cover"
                                              onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                              }}
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/15 transition-colors">
                                              <ZoomIn className="h-3 w-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                          </>
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/40">
                                            <Gift className="h-3.5 w-3.5 text-amber-600 dark:text-amber-300" />
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* Product Details */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-1 mb-0.5">
                                          <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 leading-tight truncate">
                                            {item.productName}
                                          </p>
                                          <span className="ml-1 inline-flex items-center rounded-full bg-amber-50 dark:bg-amber-900/70 px-1.5 py-0.5 text-[9px] font-semibold text-amber-800 dark:text-amber-100 border border-amber-200/80 dark:border-amber-700/80">
                                            Deal
                                          </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]">
                                          {item.weight && (
                                            <div className="flex items-center gap-0.5">
                                              <span className="text-gray-500 dark:text-gray-400">Weight:</span>
                                              <span className="text-gray-900 dark:text-gray-100 font-semibold">
                                                {item.weight}
                                              </span>
                                            </div>
                                          )}
                                          <div className="flex items-center gap-0.5">
                                            <span className="text-gray-500 dark:text-gray-400">Qty:</span>
                                            <span className="text-gray-900 dark:text-gray-100 font-bold">
                                              {item.quantity || 1}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Delivery Time Slot - Prominent */}
                      <div className="mb-2 p-1.5 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-700">
                        <div className="flex items-center gap-1 mb-1">
                          <Calendar className="h-3.5 w-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                          <span className="text-[10px] font-bold text-green-700 dark:text-green-300 uppercase tracking-wide">
                            Delivery Time
                          </span>
                        </div>
                        <p className="text-xs font-bold text-gray-900 dark:text-gray-100 ml-4.5">
                          {formatDateTime(order.deliveryDate, order.deliveryTime)}
                        </p>
                      </div>

                      {/* Action Buttons - Touch Friendly */}
                      <div className="flex flex-col sm:flex-row gap-1.5 mt-2">
                        {order.status === 'confirmed' && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateOrderStatus(order.id, 'preparing');
                            }}
                            disabled={isUpdating}
                            className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-sm font-bold py-2 shadow-md hover:shadow-lg transition-all min-h-[42px]"
                          >
                            <Package className="h-4 w-4 mr-1.5" />
                            Start Preparing
                          </Button>
                        )}
                        {order.status === 'preparing' && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateOrderStatus(order.id, 'ready');
                            }}
                            disabled={isUpdating}
                            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-sm font-bold py-2 shadow-md hover:shadow-lg transition-all min-h-[42px]"
                          >
                            <CheckCircle className="h-4 w-4 mr-1.5" />
                            Mark as Ready
                          </Button>
                        )}
                        {order.status === 'ready' && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOrderClick(order);
                            }}
                            variant="secondary"
                            className="flex-1 text-sm font-semibold py-2 min-h-[42px]"
                          >
                            <Eye className="h-4 w-4 mr-1.5" />
                            View Details
                          </Button>
                        )}
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOrderClick(order);
                          }}
                          variant="secondary"
                          className="sm:w-auto text-sm font-semibold py-2 min-h-[42px]"
                        >
                          <Eye className="h-4 w-4 sm:mr-1.5" />
                          <span className="hidden sm:inline">View</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Batch Actions Footer (Mobile) */}
      {selectedOrders.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg z-20 md:hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {selectedOrders.length} order(s) selected
            </span>
            <button
              onClick={() => setSelectedOrders([])}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex gap-2">
            {activeTab === 'confirmed' && (
              <Button
                onClick={() => batchUpdateOrders('preparing')}
                disabled={isUpdating}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
              >
                Mark as Preparing
              </Button>
            )}
            {activeTab === 'preparing' && (
              <Button
                onClick={() => batchUpdateOrders('ready')}
                disabled={isUpdating}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
              >
                Mark as Ready
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Batch Actions Bar (Desktop) */}
      {selectedOrders.length > 0 && (
        <div className="hidden md:block fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg z-20">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {selectedOrders.length} order(s) selected
            </span>
            <div className="flex gap-2">
              <Button
                onClick={() => setSelectedOrders([])}
                variant="secondary"
              >
                Clear Selection
              </Button>
              {activeTab === 'confirmed' && (
                <Button
                  onClick={() => batchUpdateOrders('preparing')}
                  disabled={isUpdating}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Mark Selected as Preparing
                </Button>
              )}
              {activeTab === 'preparing' && (
                <Button
                  onClick={() => batchUpdateOrders('ready')}
                  disabled={isUpdating}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  Mark Selected as Ready
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {isDetailModalOpen && selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          mainItems={selectedOrder.items.filter(item => !isDealItemForDisplay(item))}
          dealItems={selectedOrder.items.filter(item => isDealItemForDisplay(item))}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedOrder(null);
          }}
          onStatusUpdate={updateOrderStatus}
          isUpdating={isUpdating}
        />
      )}

      {/* Image Zoom Modal - Modern Design */}
      {imageModal.isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-md animate-in fade-in duration-200"
          onClick={closeImageModal}
        >
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_30%,rgba(255,255,255,0.05)_50%,transparent_70%)]"></div>
          </div>

          <div className="relative w-full h-full flex items-center justify-center p-4 md:p-8">
            {/* Close Button - Modern Floating Style */}
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 md:top-6 md:right-6 z-20 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-110 border border-white/20"
              aria-label="Close"
            >
              <X className="h-5 w-5 md:h-6 md:w-6" />
            </button>

            {/* Zoom Controls - Modern Floating Panel */}
            <div className="absolute top-4 left-4 md:top-6 md:left-6 z-20 flex flex-col gap-2 bg-white/10 backdrop-blur-md rounded-xl p-2 border border-white/20 shadow-xl">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleZoomIn();
                }}
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all duration-200 hover:scale-110 shadow-lg"
                title="Zoom In (+)"
                aria-label="Zoom In"
              >
                <ZoomIn className="h-4 w-4 md:h-5 md:w-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleZoomOut();
                }}
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all duration-200 hover:scale-110 shadow-lg"
                title="Zoom Out (-)"
                aria-label="Zoom Out"
              >
                <ZoomOut className="h-4 w-4 md:h-5 md:w-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleResetZoom();
                }}
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all duration-200 hover:scale-110 shadow-lg"
                title="Reset Zoom (0)"
                aria-label="Reset Zoom"
              >
                <Maximize2 className="h-4 w-4 md:h-5 md:w-5" />
              </button>
            </div>

            {/* Image Container with Modern Frame */}
            <div 
              className="relative max-w-full max-h-full overflow-auto flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative bg-white/5 backdrop-blur-sm rounded-2xl p-4 md:p-6 shadow-2xl border border-white/10">
                <img 
                  src={imageModal.imageUrl} 
                  alt={imageModal.productName}
                  className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl select-none"
                  style={{ 
                    transform: `scale(${imageZoom / 100})`,
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: imageZoom > 100 ? 'zoom-out' : 'zoom-in'
                  }}
                  draggable={false}
                />
              </div>
            </div>

            {/* Product Name and Zoom Info - Modern Card */}
            <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-auto md:right-6 md:w-auto z-20">
              <div className="bg-gradient-to-r from-white/15 to-white/10 backdrop-blur-md rounded-xl p-4 md:p-5 text-center md:text-left border border-white/20 shadow-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-white/20 rounded-lg">
                    <Package className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-white font-bold text-sm md:text-base">{imageModal.productName}</p>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-3 text-xs md:text-sm">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-full">
                    <Maximize2 className="h-3 w-3 text-white/80" />
                    <span className="text-white/90 font-semibold">{imageZoom}%</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-full">
                    <span className="text-white/70">Press ESC to close</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Zoom Percentage Badge - Floating */}
            {imageZoom !== 100 && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                <div className="bg-gradient-to-r from-orange-500/90 to-pink-500/90 backdrop-blur-md rounded-full px-4 py-2 shadow-2xl border border-white/30 animate-pulse">
                  <span className="text-white font-bold text-sm">{imageZoom}%</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Order Detail Modal Component
interface OrderDetailModalProps {
  order: Order;
  mainItems: Order['items'];
  dealItems: Order['items'];
  onClose: () => void;
  onStatusUpdate: (orderId: string, status: 'preparing' | 'ready') => Promise<void>;
  isUpdating: boolean;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  mainItems,
  dealItems,
  onClose,
  onStatusUpdate,
  isUpdating
}) => {
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const hasSpecialInstructions = order.notes && order.notes.trim().length > 0;
  const t = translations[language];

  const getItemImage = (item: any): string | null => {
    return (
      item.product_image ||
      item.image_url ||
      item.productImage ||
      item.image ||
      null
    );
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Order #${order.order_number || order.id}`}
      size="xl"
    >
      {/* Language Switcher */}
      <div className="absolute top-4 right-16 z-10">
        <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setLanguage('en')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
              language === 'en'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('hi')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
              language === 'hi'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            हिं
          </button>
        </div>
      </div>

      <div className="space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto px-1">
        {/* Order Information - Hidden Details (Order Number, Order ID, Status) */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wide flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
            Order Information
          </h3>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Order Number:</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">#{order.order_number || order.id}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Order ID:</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white font-mono">{order.id}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">{t.currentStatus}:</span>
              {getStatusBadge(order.status, language)}
            </div>
          </div>
        </div>

        {/* Customer Information - Hidden Details (Customer Name) */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl p-4 border border-blue-100 dark:border-blue-800 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <div className="p-1.5 bg-blue-500 rounded-lg">
              <User className="h-3.5 w-3.5 text-white" />
            </div>
            {t.customerName}
          </h3>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
            <p className="text-base font-semibold text-gray-900 dark:text-white">{order.customerName}</p>
          </div>
        </div>

        {/* Order Items - Main & Deal, with images */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl p-4 border border-purple-100 dark:border-purple-800 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <div className="p-1.5 bg-purple-500 rounded-lg">
              <Package className="h-3.5 w-3.5 text-white" />
            </div>
            {t.orderItems}
          </h3>

          <div className="space-y-4">
            {/* Main Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Cake className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                  </div>
                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wide">
                    Main Items {mainItems.length > 1 && `(${mainItems.length})`}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5">
                {mainItems.map((item, index) => {
                  const image = getItemImage(item);
                  const cakeMessage = (item as any).cake_message;
                  return (
                    <div
                      key={item.id || `main-${index}`}
                      className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-purple-200 dark:border-purple-700 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex gap-3">
                        {/* Image */}
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-white dark:bg-gray-700 border border-purple-100 dark:border-purple-800 flex-shrink-0">
                          {image ? (
                            <img
                              src={image}
                              alt={item.productName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                              <Package className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <p className="text-sm font-bold text-gray-900 dark:text-white leading-snug line-clamp-2">
                            {item.productName}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-600 dark:text-gray-400">
                            {item.flavor_name && (
                              <span>
                                Flavor:{' '}
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {item.flavor_name}
                                </span>
                              </span>
                            )}
                            {item.tier && (
                              <span>
                                Tier:{' '}
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {item.tier}
                                </span>
                              </span>
                            )}
                            {item.weight && (
                              <span>
                                {t.weight}:{' '}
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {item.weight}
                                </span>
                              </span>
                            )}
                            <span>
                              {t.quantity}:{' '}
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {item.quantity}
                              </span>
                            </span>
                          </div>

                          {cakeMessage && (
                            <div className="mt-1.5 rounded-md bg-pink-50 dark:bg-pink-900/30 px-2.5 py-1.5 border border-pink-100 dark:border-pink-800 flex items-start gap-1.5">
                              <MessageSquare className="h-3.5 w-3.5 text-pink-500 dark:text-pink-400 mt-0.5 flex-shrink-0" />
                              <p className="text-[11px] text-pink-800 dark:text-pink-300 font-medium italic leading-snug">
                                "{cakeMessage}"
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Deal Items */}
            {dealItems.length > 0 && (
              <div className="pt-3 border-t border-amber-100 dark:border-amber-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-amber-500 rounded-lg">
                      <Gift className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-amber-900 dark:text-amber-300 uppercase tracking-wide">
                      Deal Items ({dealItems.length})
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {dealItems.map((item, index) => {
                    const image = getItemImage(item);
                    return (
                      <div
                        key={item.id || `deal-${index}`}
                        className="bg-white dark:bg-gray-800 rounded-xl p-2.5 border border-amber-200 dark:border-amber-700 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex gap-2.5">
                          {/* Image */}
                          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 flex-shrink-0">
                            {image ? (
                              <img
                                src={image}
                                alt={item.productName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/40">
                                <Gift className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                              </div>
                            )}
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <p className="text-xs font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2">
                                {item.productName}
                              </p>
                              <span className="ml-1 inline-flex items-center rounded-full bg-amber-50 dark:bg-amber-900/50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700">
                                Deal
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-600 dark:text-gray-400">
                              {item.weight && (
                                <span>
                                  {t.weight}:{' '}
                                  <span className="font-semibold text-gray-900 dark:text-white">
                                    {item.weight}
                                  </span>
                                </span>
                              )}
                              <span>
                                {t.quantity}:{' '}
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {item.quantity || 1}
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Delivery Information - Enhanced */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl p-4 border border-green-100 dark:border-green-800 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <div className="p-1.5 bg-green-500 rounded-lg">
              <MapPin className="h-3.5 w-3.5 text-white" />
            </div>
            {t.deliveryInformation}
          </h3>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-green-200 dark:border-green-700 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                {t.date}
              </span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{formatDateTime(order.deliveryDate)}</span>
            </div>
            {order.deliveryTime && (
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  {t.time}
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{order.deliveryTime}</span>
              </div>
            )}
            <div className="pt-2">
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide block mb-2 flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                {t.address}
              </span>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-900 dark:text-white leading-relaxed whitespace-pre-wrap">{formatAddress(order.deliveryAddress)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Special Instructions - Enhanced */}
        {hasSpecialInstructions && (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 rounded-xl p-4 border-2 border-amber-200 dark:border-amber-800 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <div className="p-1.5 bg-amber-500 rounded-lg">
                <AlertCircle className="h-3.5 w-3.5 text-white" />
              </div>
              {t.specialInstructions}
            </h3>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-amber-200 dark:border-amber-700">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-300 leading-relaxed whitespace-pre-wrap">{order.notes}</p>
            </div>
          </div>
        )}

        {/* Cake Messages (if any) - Enhanced */}
        {order.items.some(item => (item as any).cake_message) && (
          <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/30 dark:to-rose-900/30 rounded-xl p-4 border border-pink-100 dark:border-pink-800 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <div className="p-1.5 bg-pink-500 rounded-lg">
                <MessageSquare className="h-3.5 w-3.5 text-white" />
              </div>
              {t.cakeMessages}
            </h3>
            <div className="space-y-3">
              {order.items.map((item, index) => {
                const cakeMessage = (item as any).cake_message;
                if (!cakeMessage) return null;
                return (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-pink-200 dark:border-pink-700 shadow-sm">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">{item.productName}:</p>
                    <div className="bg-pink-50 dark:bg-pink-900/30 rounded-lg p-3 border border-pink-200 dark:border-pink-700">
                      <p className="text-sm font-medium text-pink-900 dark:text-pink-300 italic leading-relaxed">"{cakeMessage}"</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Payment Information - Enhanced */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <div className="p-1.5 bg-indigo-500 rounded-lg">
              <CreditCard className="h-3.5 w-3.5 text-white" />
            </div>
            {t.paymentInformation}
          </h3>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-indigo-200 dark:border-indigo-700">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{t.status}:</span>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full shadow-sm border ${
                order.paymentStatus === 'paid' 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700' 
                  : order.paymentStatus === 'pending'
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700'
              }`}>
                {(() => {
                  const status = String(order.paymentStatus || '');
                  if (status === 'paid') return t.paid;
                  if (status === 'pending') return t.pending;
                  if (status === 'failed') return t.failed;
                  if (status === 'refunded') return t.refunded;
                  if (status && status.length > 0) {
                    return status.charAt(0).toUpperCase() + status.slice(1);
                  }
                  return 'N/A';
                })()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose} className="font-semibold">
          {t.close}
        </Button>
        {order.status === 'confirmed' && (
          <Button
            onClick={() => onStatusUpdate(order.id, 'preparing')}
            disabled={isUpdating}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            <Package className="h-4 w-4 mr-2" />
            {t.markAsPreparing}
          </Button>
        )}
        {order.status === 'preparing' && (
          <Button
            onClick={() => onStatusUpdate(order.id, 'ready')}
            disabled={isUpdating}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {t.markAsReady}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
};

export default BakeryProduction;

