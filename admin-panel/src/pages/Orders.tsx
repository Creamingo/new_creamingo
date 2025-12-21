import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Search, Filter, Eye, Package, Clock, CheckCircle, XCircle, Truck, Phone, Mail, MessageSquare, Printer, Download, HelpCircle, FileText, RefreshCw, ExternalLink, Grid3x3, List, ChevronDown, ChevronRight, ArrowUpDown, DollarSign, ShoppingCart, Gift, Calendar, CreditCard, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table, Pagination } from '../components/ui/Table';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { TableColumn } from '../types';
import orderService, { Order, OrderStats } from '../services/orderService';
import dealService, { Deal } from '../services/dealService';
import { useToastContext } from '../contexts/ToastContext';
import OrderTimeline from '../components/order/OrderTimeline';
import { useNotifications } from '../hooks/useNotifications';

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

// Date utility functions
const getToday = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const getYesterday = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
};

const getTomorrow = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

// Removed unused formatDateForDisplay function

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
    if (addressObj.landmark) parts.push(`Near ${addressObj.landmark}`);
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

// Helper to identify deal / add-on items so we can show main items first
const isDealOrAddonItem = (item: any): boolean => {
  if (!item || typeof item === 'string') return false;

  const name = (item.productName || item.product_name || '').toString().toLowerCase();
  const flags = [
    item.isDeal,
    item.is_deal,
    item.dealType,
    item.isAddon,
    item.is_addon,
    item.is_deal_item
  ];

  const looksLikeDealName =
    name.includes('deal') || name.includes('add-on') || name.includes('addon');

  // Treat ultra-low price items (like ₹1 deals) as deal/add-ons, but only if explicitly priced
  const numericPrice = item.price !== undefined ? Number(item.price) : NaN;
  const looksLikeLowPriceDeal = !isNaN(numericPrice) && numericPrice > 0 && numericPrice <= 1;

  return flags.some(Boolean) || looksLikeDealName || looksLikeLowPriceDeal;
};

// CSV Export Functions
const generateCSV = (orders: Order[]) => {
  const headers = ['Order Number', 'Customer Name', 'Customer Email', 'Customer Phone', 'Items', 'Total', 'Status', 'Payment Method', 'Payment Status', 'Delivery Date', 'Delivery Time', 'Delivery Address'];
  const rows = orders.map(order => {
    const itemsList = order.items?.map(item => {
      const itemStr = item.productName || 'Unknown';
      const flavor = item.flavor_name ? ` (${item.flavor_name})` : '';
      return `${itemStr}${flavor}`;
    }).join('; ') || 'No items';
    
    return [
      order.order_number || order.id,
    order.customerName,
    order.customerEmail,
    order.customerPhone,
      itemsList,
    Number((order.total || 0).toFixed(2)),
    order.status,
      order.payment_method || 'COD',
    order.paymentStatus,
    order.deliveryDate,
    order.deliveryTime,
      formatAddress(order.deliveryAddress)
    ];
  });
  
  return [headers, ...rows].map(row => 
    row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
};

const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


const getStatusBadge = (status: string) => {
  const statusConfig = {
    pending: { 
      color: 'bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700', 
      icon: Clock,
      shadow: 'shadow-sm'
    },
    confirmed: { 
      color: 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700', 
      icon: CheckCircle,
      shadow: 'shadow-sm'
    },
    preparing: { 
      color: 'bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-700', 
      icon: Package,
      shadow: 'shadow-sm'
    },
    ready: { 
      color: 'bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700', 
      icon: CheckCircle,
      shadow: 'shadow-sm'
    },
    delivered: { 
      color: 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600', 
      icon: Truck,
      shadow: 'shadow-sm'
    },
    cancelled: { 
      color: 'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700', 
      icon: XCircle,
      shadow: 'shadow-sm'
    }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.color} ${config.shadow} transition-all hover:scale-105`}>
      <Icon className="h-3.5 w-3.5" />
      <span className="tracking-wide">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
    </span>
  );
};

// Helper function to calculate and format pending time (time elapsed since order creation)
const formatPendingTime = (createdAt: string, status: string): string => {
  if (status !== 'pending') return '';
  
  try {
    const now = new Date();
    let created: Date;
    
    // Handle different date formats that might come from the API
    if (typeof createdAt === 'string') {
      // Try parsing ISO string first
      created = new Date(createdAt);
      
      // If invalid, try other formats
      if (isNaN(created.getTime())) {
        // Try parsing as timestamp
        const timestamp = parseInt(createdAt, 10);
        if (!isNaN(timestamp)) {
          created = new Date(timestamp);
        } else {
          console.error('Invalid createdAt date format:', createdAt);
          return '';
        }
      }
    } else {
      created = new Date(createdAt);
    }
    
    // Validate the parsed date
    if (isNaN(created.getTime())) {
      console.error('Invalid createdAt date after parsing:', createdAt);
      return '';
    }
    
    const diffMs = now.getTime() - created.getTime();
    
    // If negative, order is in the future (shouldn't happen but handle it)
    if (diffMs < 0) {
      return '0m';
    }
    
    const totalSeconds = Math.floor(diffMs / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const days = Math.floor(totalHours / 24);
    
    const remainingHours = totalHours % 24;
    const remainingMinutes = totalMinutes % 60;
    const remainingSeconds = totalSeconds % 60;
    
    // Format: Show days if > 0, otherwise show hours and minutes
    if (days > 0) {
      if (remainingHours > 0) {
        return `${days}d ${remainingHours}h`;
      } else {
        return `${days}d`;
      }
    } else if (totalHours > 0) {
      // Show hours and minutes (always show minutes if > 0)
      if (remainingMinutes > 0) {
        return `${totalHours}h ${remainingMinutes}m`;
      } else {
        return `${totalHours}h`;
      }
    } else if (totalMinutes > 0) {
      // Show minutes and seconds for recent orders (< 1 hour)
      return `${totalMinutes}m ${remainingSeconds}s`;
    } else {
      // Show just seconds for very recent orders (< 1 minute)
      return `${remainingSeconds}s`;
    }
  } catch (error) {
    console.error('Error formatting pending time:', error, 'createdAt:', createdAt);
    return '';
  }
};

// Removed unused PendingTimer component

// Status Button Component - Shows Confirm button for pending orders, status display for confirmed+ orders
const ConfirmButton: React.FC<{
  orderId: string;
  createdAt: string | undefined;
  status: string;
  onConfirm: () => void;
  isLoading: boolean;
}> = ({ orderId, createdAt, status, onConfirm, isLoading }) => {
  const [pendingTime, setPendingTime] = useState('');
  const isPending = status === 'pending';
  
  // Statuses that should show the status button (after pending)
  const statusDisplayStates = ['confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
  const shouldShowStatus = statusDisplayStates.includes(status);
  
  useEffect(() => {
    if (!isPending || !createdAt) {
      setPendingTime('');
      if (process.env.NODE_ENV === 'development' && !createdAt) {
        console.warn('ConfirmButton: Missing createdAt for order', { orderId, status, isPending });
      }
      return;
    }
    
    const updateTimer = () => {
      const formatted = formatPendingTime(createdAt, status);
      setPendingTime(formatted);
    };
    
    updateTimer(); // Initial update immediately
    
    // Update every second for real-time accuracy
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createdAt, status, isPending]); // orderId is intentionally excluded as it's stable
  
  // Fixed width to ensure consistency
  const buttonWidth = "w-[120px]";
  
  // Status configuration with stage numbers and colors
  const statusConfig: { [key: string]: { icon: any; label: string; stage: number; circleColor: string; progressColor: string } } = {
    pending: { icon: Clock, label: 'Confirm', stage: 1, circleColor: 'bg-green-500 text-white', progressColor: 'bg-green-400' },
    confirmed: { icon: CheckCircle, label: 'Confirmed', stage: 2, circleColor: 'bg-blue-500 text-white', progressColor: 'bg-blue-400' },
    preparing: { icon: Package, label: 'Preparing', stage: 3, circleColor: 'bg-yellow-500 text-white', progressColor: 'bg-yellow-400' },
    ready: { icon: CheckCircle, label: 'Ready', stage: 4, circleColor: 'bg-purple-500 text-white', progressColor: 'bg-purple-400' },
    delivered: { icon: CheckCircle, label: 'Delivered Successfully', stage: 5, circleColor: 'bg-green-600 text-white', progressColor: 'bg-green-500' },
    cancelled: { icon: XCircle, label: 'Cancelled', stage: 0, circleColor: 'bg-red-500 text-white', progressColor: 'bg-red-400' }
  };
  
  // Special handling for delivered status - show only icons (5, Truck, Tick)
  // This will be combined with Invoice button to match Confirm button width
  if (status === 'delivered') {
    const config = statusConfig.delivered;
    
    return (
      <div className="flex flex-col items-center gap-1 relative">
        <button 
          disabled
          className={`flex items-center justify-center gap-1.5 px-2 py-2 bg-gradient-to-r from-green-100 to-green-50 border-2 border-green-300 cursor-not-allowed shadow-sm relative w-[89px]`}
          title="Order completed successfully - Stage 5 of 5"
        >
          {/* Truck icon */}
          <Truck className="h-4 w-4 text-green-600" />
          {/* CheckCircle/Tick icon */}
          <CheckCircle className="h-4 w-4 text-green-600" />
          {/* Stage number 5 icon - positioned at bottom-left like other status boxes */}
          <div className={`absolute bottom-0.5 left-1 flex items-center justify-center w-5 h-5 rounded-full ${config.circleColor} border-2 border-white shadow-md`}>
            <span className="text-[9px] font-bold text-white leading-none">
              5
            </span>
          </div>
        </button>
        {/* Progress indicator - all stages completed */}
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((stage) => (
            <div
              key={stage}
              className="h-1 w-4 rounded-full bg-green-500 transition-all"
              title={`Stage ${stage} ✓ Completed`}
            />
          ))}
        </div>
      </div>
    );
  }
  
  // Show status button for confirmed+ orders (excluding delivered which is handled above)
  if (shouldShowStatus && status !== 'delivered') {
    const config = statusConfig[status] || statusConfig.confirmed;
    const StatusIcon = config.icon;
    const totalStages = 5; // pending, confirmed, preparing, ready, delivered
    
    return (
      <div className="flex flex-col items-center gap-1 relative">
        <button 
          disabled
          className={`flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm font-semibold rounded-lg border-2 border-gray-200 dark:border-gray-600 cursor-not-allowed shadow-sm relative ${buttonWidth}`}
          title={`Stage ${config.stage} of ${totalStages}: ${config.label}`}
        >
          <StatusIcon className="h-4 w-4" />
          <span>{config.label}</span>
          {/* Stage number in bottom-left corner with colored badge */}
          <div className={`absolute bottom-0.5 left-1 flex items-center justify-center w-5 h-5 rounded-full ${config.circleColor} border-2 border-white shadow-md`}>
            <span className="text-[9px] font-bold text-white leading-none">
              {config.stage}
            </span>
          </div>
        </button>
        {/* Progress indicator */}
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((stage) => {
            const stageConfig = statusConfig[
              stage === 1 ? 'pending' : 
              stage === 2 ? 'confirmed' : 
              stage === 3 ? 'preparing' : 
              stage === 4 ? 'ready' : 'delivered'
            ];
            return (
              <div
                key={stage}
                className={`h-1 w-4 rounded-full transition-all ${
                  stage < config.stage
                    ? stageConfig.progressColor
                    : stage === config.stage
                    ? config.progressColor
                    : 'bg-gray-200 dark:bg-gray-600'
                }`}
                title={`Stage ${stage}${stage <= config.stage ? ' ✓' : ''}`}
              />
            );
          })}
        </div>
      </div>
    );
  }
  
  // Show Confirm button for pending orders
  if (isPending) {
    const config = statusConfig.pending;
    
    return (
      <div className="flex flex-col items-center gap-1 relative">
        <button 
          onClick={onConfirm}
          className={`flex flex-col items-center justify-center gap-0.5 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-sm font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:-translate-y-0.5 relative ${buttonWidth}`}
          disabled={isLoading}
          title={`Stage ${config.stage} of 5: Click to confirm this order`}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Confirming...</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Confirm</span>
              </div>
              {pendingTime ? (
                <span className="text-[9px] text-green-100 font-normal leading-tight opacity-90">
                  {pendingTime}
                </span>
              ) : (
                <span className="text-[9px] text-green-100 font-normal leading-tight opacity-0">
                  &nbsp;
                </span>
              )}
              {/* Stage number in bottom-left corner with colored badge */}
              <div className={`absolute bottom-0.5 left-1 flex items-center justify-center w-5 h-5 rounded-full ${config.circleColor} border-2 border-white shadow-md`}>
                <span className="text-[9px] font-bold text-white leading-none">
                  1
                </span>
              </div>
            </>
          )}
        </button>
        {/* Progress indicator for pending */}
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((stage) => {
            const stageColors = [
              config.progressColor, // Stage 1 - Green
              statusConfig.confirmed.progressColor, // Stage 2 - Blue
              statusConfig.preparing.progressColor, // Stage 3 - Yellow
              statusConfig.ready.progressColor, // Stage 4 - Purple
              statusConfig.delivered.progressColor // Stage 5 - Grey
            ];
            return (
              <div
                key={stage}
                className={`h-1 w-4 rounded-full transition-all ${
                  stage === 1 ? stageColors[0] : 'bg-gray-200 dark:bg-gray-600'
                }`}
                title={`Stage ${stage}${stage === 1 ? ' (Current)' : ''}`}
              />
            );
          })}
        </div>
      </div>
    );
  }
  
  // Default: don't show button for other states
  return null;
};

// Removed unused getPaymentStatusBadge function

// OrderCard Component for Grid View
interface OrderCardProps {
  order: Order;
  onView: (order: Order) => void;
  onStatusUpdate: (orderId: string, newStatus: string) => void;
  onViewInvoice: (order: Order) => void;
  actionLoading: string | null;
  isSelected: boolean;
  onSelect: (orderId: string) => void;
  selectMode: boolean;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onView,
  onStatusUpdate,
  onViewInvoice,
  actionLoading,
  isSelected,
  onSelect,
  selectMode
}) => {
  const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;
  const remainingCount = order.items && order.items.length > 1 ? order.items.length - 1 : 0;
  const paymentMethod = order.payment_method || 'COD';
  const isPaid = order.paymentStatus === 'paid';
  const deliveryDate = order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('en-US', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  }) : 'N/A';

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {selectMode && (
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onSelect(order.id)}
                  className="w-4 h-4 rounded border-2 border-gray-300 dark:border-gray-600 text-primary-600 dark:text-primary-400 focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 transition-all cursor-pointer hover:border-primary-400 dark:hover:border-primary-500"
                />
              )}
              <h3 className="font-semibold text-gray-900 dark:text-white text-base truncate">
                {order.customerName}
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              #{order.order_number || order.id}
            </p>
          </div>
          <div className="text-right">
            <p className="font-bold text-gray-900 dark:text-white text-lg mb-2">
              ₹{(order.total || 0).toFixed(2).replace(/\.?0+$/, '')}
            </p>
            {getStatusBadge(order.status)}
          </div>
        </div>

        {firstItem && (
          <div className="mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Items
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {firstItem.productName}
            </p>
            {firstItem.flavor_name && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                {firstItem.flavor_name} Flavour
              </p>
            )}
            {remainingCount > 0 && (
              <p className="text-xs text-primary-600 dark:text-primary-400 font-medium mt-1">
                +{remainingCount} more item{remainingCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Payment
            </p>
            <p className="text-gray-900 dark:text-white font-medium text-sm">
              {paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}
            </p>
            <p className={`text-xs mt-0.5 ${isPaid ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
              ({isPaid ? 'Paid' : 'Unpaid'})
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Delivery
            </p>
            <p className="text-gray-900 dark:text-white font-medium text-sm">
              {deliveryDate}
            </p>
            {order.deliveryTime && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                {order.deliveryTime}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2 flex-wrap">
            {order.status === 'delivered' ? (
              <div className="flex items-center gap-1">
                <ConfirmButton
                  orderId={order.id}
                  createdAt={order.createdAt}
                  status={order.status}
                  onConfirm={() => onStatusUpdate(order.id, 'confirmed')}
                  isLoading={actionLoading === order.id}
                />
                <button
                  onClick={() => onViewInvoice(order)}
                  className="flex items-center justify-center w-[27px] py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 hover:text-blue-800 dark:text-blue-400 rounded-lg border-2 border-blue-200 hover:border-blue-300 dark:border-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
                  title="View Invoice"
                >
                  <FileText className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <ConfirmButton
                orderId={order.id}
                createdAt={order.createdAt}
                status={order.status}
                onConfirm={() => onStatusUpdate(order.id, 'confirmed')}
                isLoading={actionLoading === order.id}
              />
            )}
            <button 
              onClick={() => onView(order)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-xs font-semibold rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>View</span>
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const OrdersComponent: React.FC = () => {
  const { showSuccess, showInfo, showConfirm } = useToastContext();
  const { notifyOrderStatusChanged } = useNotifications();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeDeals, setActiveDeals] = useState<Deal[]>([]);
  const [orderStats, setOrderStats] = useState<OrderStats>({
    total: 0,
    pending: 0,
    confirmed: 0,
    preparing: 0,
    ready: 0,
    delivered: 0,
    cancelled: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearchTerm, setAppliedSearchTerm] = useState(''); // The search term that's actually applied for filtering
  const [searchType, setSearchType] = useState('all'); // all, phone, address, total
  const [statusFilter, setStatusFilter] = useState('all');
  const [creationDateFilter, setCreationDateFilter] = useState('all');
  const [customCreationDate, setCustomCreationDate] = useState('');
  const [deliveryDateFilter, setDeliveryDateFilter] = useState('all');
  const [customDeliveryDate, setCustomDeliveryDate] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);

  // Helper function to fetch and set order details with full data including images
  const handleViewOrder = useCallback(async (order: Order) => {
    try {
      setLoadingOrderDetails(true);
      // Fetch full order details to ensure we have all data including product images
      const fullOrder = await orderService.getOrder(order.id);
      setSelectedOrder(fullOrder);
    } catch (error) {
      console.error('Error fetching order details:', error);
      // Fallback to using the order from list if fetch fails
      setSelectedOrder(order);
    } finally {
      setLoadingOrderDetails(false);
    }
  }, []);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [orderViewType, setOrderViewType] = useState<'all' | 'upcoming'>('all');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [todayDeliveryFilter, setTodayDeliveryFilter] = useState(false);
  const [expandedDealItems, setExpandedDealItems] = useState<Set<string | number>>(new Set());
  const itemsPerPage = 10;
  
  // Toggle deal items expansion
  const toggleDealItems = useCallback((orderId: string | number) => {
    setExpandedDealItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  }, []);
  
  // View mode and UI states
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'total' | 'customer'>('newest');
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  
  // Date range filter states
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Custom dropdown states (kept for future use but setters are used in click handlers)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [searchTypeDropdownOpen, setSearchTypeDropdownOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [statusFilterDropdownOpen, setStatusFilterDropdownOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Utility function to get order statistics - will be calculated after filteredOrders is defined

  // Check if any filters are applied
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const hasActiveFilters = useMemo(() => {
    return appliedSearchTerm !== '' || 
           searchType !== 'all' || 
           statusFilter !== 'all' || 
           todayDeliveryFilter ||
           startDate !== '' ||
           endDate !== '';
  }, [appliedSearchTerm, searchType, statusFilter, todayDeliveryFilter, startDate, endDate]);


  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container') && !target.closest('.date-picker-container')) {
        setSearchTypeDropdownOpen(false);
        setStatusFilterDropdownOpen(false);
        setShowDatePicker(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(target as Node)) {
        setShowStatusDropdown(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(target as Node)) {
        setShowSortDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSearchTypeChange = useCallback((value: string) => {
    setSearchType(value);
    setTimeout(() => {
      showSuccess('Search Type Updated', `Changed to: ${getSearchTypeLabel(value)}`);
    }, 0);
  }, [showSuccess]);

  const handleStatusFilterChange = useCallback((value: string) => {
    setStatusFilter(value);
    // Use setTimeout to prevent immediate re-render
    setTimeout(() => {
      showSuccess('Status Filter Updated', `Changed to: ${getStatusFilterLabel(value)}`);
    }, 0);
  }, [showSuccess]);

  // Handle search button click
  const handleSearchClick = useCallback(() => {
    setAppliedSearchTerm(searchTerm);
    showSuccess('Search Applied', `Searching for: ${searchTerm || 'all orders'}`);
  }, [searchTerm, showSuccess]);


  // Helper functions for dropdown options
  const getSearchTypeLabel = (value: string) => {
    switch (value) {
      case 'all': return 'All Fields';
      case 'phone': return 'Phone';
      case 'address': return 'Address';
      case 'order_id': return 'Order ID';
      default: return 'All Fields';
    }
  };

  const getStatusFilterLabel = (value: string) => {
    switch (value) {
      case 'all': return 'All Status';
      case 'pending': return 'Pending';
      case 'confirmed': return 'Confirmed';
      case 'preparing': return 'Preparing';
      case 'ready': return 'Ready';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return 'All Status';
    }
  };

  // Calculate today's delivery count
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const todayDeliveryCount = orders.filter(order => {
    const today = new Date().toISOString().split('T')[0];
    const orderDeliveryDate = new Date(order.deliveryDate).toISOString().split('T')[0];
    return orderDeliveryDate === today;
  }).length;

  // Fetch orders from API
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      
      // Determine creation date filter
      let dateFrom: string | undefined;
      let dateTo: string | undefined;
      if (creationDateFilter === 'today') {
        dateFrom = getToday();
        dateTo = getToday();
      } else if (creationDateFilter === 'yesterday') {
        dateFrom = getYesterday();
        dateTo = getYesterday();
      } else if (creationDateFilter === 'custom' && customCreationDate) {
        dateFrom = customCreationDate;
        dateTo = customCreationDate;
      }
      
      // Determine delivery date filter
      let deliveryDate: string | undefined;
      if (deliveryDateFilter === 'today') {
        deliveryDate = getToday();
      } else if (deliveryDateFilter === 'yesterday') {
        deliveryDate = getYesterday();
      } else if (deliveryDateFilter === 'tomorrow') {
        deliveryDate = getTomorrow();
      } else if (deliveryDateFilter === 'custom' && customDeliveryDate) {
        deliveryDate = customDeliveryDate;
      }
      
      const filters = {
        page: currentPage,
        limit: itemsPerPage,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        date_from: dateFrom,
        date_to: dateTo,
        delivery_date: deliveryDate,
        sort_by: 'created_at',
        sort_order: 'DESC' as const
      };
      
      const [response, dealsResponse] = await Promise.all([
        orderService.getOrders(filters),
        dealService
          .getDeals()
          .catch(error => {
            console.error('Error fetching deals for Orders view:', error);
            return { success: false, data: [] as Deal[] };
          })
      ]);

      setOrders(response.orders);
      setTotalPages(Math.ceil(response.total / itemsPerPage));
      setTotalOrders(response.total);

      if (dealsResponse && dealsResponse.success) {
        const onlyActiveDeals = (dealsResponse.data || []).filter(deal => deal.is_active);
        setActiveDeals(onlyActiveDeals);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, creationDateFilter, customCreationDate, deliveryDateFilter, customDeliveryDate]);

  // Fetch order statistics
  const fetchOrderStats = useCallback(async () => {
    try {
      const stats = await orderService.getOrderStats();
      setOrderStats(stats);
    } catch (error) {
      console.error('Error fetching order stats:', error);
    }
  }, []);

  // Determine if an item is a deal/add-on using both backend deal configs and fallback heuristics
  const isDealItemForDisplay = useCallback(
    (item: any): boolean => {
      if (!item || typeof item === 'string') return false;

      // Prefer matching against active deals (authoritative)
      if (activeDeals.length > 0) {
        const productId = Number((item as any).productId || (item as any).product_id);
        const price = item.price !== undefined ? Number(item.price) : NaN;

        if (!isNaN(productId) && !isNaN(price)) {
          const matchesConfiguredDeal = activeDeals.some(deal => {
            if (!deal.is_active) return false;
            if (deal.product_id !== productId) return false;
            const dealPrice = Number(deal.deal_price);
            if (isNaN(dealPrice)) return false;
            // Match price within small tolerance (same as backend backfill)
            return Math.abs(dealPrice - price) < 0.01;
          });

          if (matchesConfiguredDeal) {
            return true;
          }
        }
      }

      // Fallback to heuristic
      return isDealOrAddonItem(item);
    },
    [activeDeals]
  );

  // Handle custom date selection
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleCustomCreationDateSelect = (date: string) => {
    setCustomCreationDate(date);
    setCreationDateFilter('custom');
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleCustomDeliveryDateSelect = (date: string) => {
    setCustomDeliveryDate(date);
    setDeliveryDateFilter('custom');
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchOrders();
    fetchOrderStats();
  }, [fetchOrders, fetchOrderStats]);


  // Filter orders locally for search (since API doesn't support search yet)
  const filteredOrders = useMemo(() => {
    let filtered = orders.filter(order => {
      // Check status filter first
      if (statusFilter !== 'all' && order.status !== statusFilter) {
        return false;
      }
      
      // Check date range filter
      if (startDate || endDate) {
        const orderCreatedDate = new Date(order.createdAt).toISOString().split('T')[0];
        if (startDate && orderCreatedDate < startDate) return false;
        if (endDate && orderCreatedDate > endDate) return false;
      }
      
      // Check today's delivery filter
      if (todayDeliveryFilter) {
        const today = new Date().toISOString().split('T')[0];
        const orderDeliveryDate = new Date(order.deliveryDate).toISOString().split('T')[0];
        if (orderDeliveryDate !== today) return false;
      }
      
      // Check upcoming orders filter
      if (orderViewType === 'upcoming') {
        const now = new Date();
        
        if (!order.deliveryDate) {
          return false; // No delivery date means not upcoming
        }
        
        // Create delivery date object
        const deliveryDate = new Date(order.deliveryDate);
        deliveryDate.setHours(0, 0, 0, 0); // Reset to start of day
        
        // Get today's date (start of day)
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        
        // If delivery date is today, check if delivery time is in the future
        if (deliveryDate.getTime() === today.getTime()) {
          if (order.deliveryTime) {
            // Try to parse delivery time (format might be like "10:00 AM - 12:00 PM" or "14:00-16:00")
            const timeMatch = order.deliveryTime.match(/(\d{1,2}):(\d{2})/);
            if (timeMatch) {
              const [, hours, minutes] = timeMatch;
              const deliveryHour = parseInt(hours, 10);
              const deliveryMinute = parseInt(minutes, 10);
              
              // Create a date with delivery time for today
              const deliveryDateTime = new Date(now);
              deliveryDateTime.setHours(deliveryHour, deliveryMinute, 0, 0);
              
              // Only show if delivery time is in the future
              if (deliveryDateTime <= now) {
                return false;
              }
            }
            // If time parsing fails, show it if it's today (safer approach)
          } else {
            // No delivery time specified, only show if date is future
            if (deliveryDate.getTime() <= today.getTime()) {
              return false;
            }
          }
        } else {
          // Delivery date is in the future (after today)
          if (deliveryDate.getTime() <= today.getTime()) {
            return false;
          }
        }
      }
      
      // If no search term, return true (order passes other filters)
      if (!appliedSearchTerm || appliedSearchTerm.trim() === '') {
        return true;
      }
      
      const searchLower = appliedSearchTerm.toLowerCase().trim();
      let matchesSearch = false;
      
      try {
        switch (searchType) {
          case 'phone':
            matchesSearch = order.customerPhone ? order.customerPhone.includes(appliedSearchTerm.trim()) : false;
            break;
          case 'address':
            const addressStr = typeof order.deliveryAddress === 'string' 
              ? order.deliveryAddress 
              : formatAddress(order.deliveryAddress);
            matchesSearch = addressStr && addressStr !== 'N/A' ? addressStr.toLowerCase().includes(searchLower) : false;
            break;
          case 'order_id':
            const orderIdStr = String(order.id || order.order_number || order.orderId || '').toLowerCase();
            matchesSearch = orderIdStr.includes(searchLower);
            break;
          default: // 'all'
            const orderIdStrAll = String(order.id || order.order_number || order.orderId || '').toLowerCase();
            const customerName = (order.customerName || '').toLowerCase();
            const customerEmail = (order.customerEmail || '').toLowerCase();
            const customerPhone = (order.customerPhone || '');
            let addressStrAll = 'N/A';
            try {
              addressStrAll = typeof order.deliveryAddress === 'string' 
                ? order.deliveryAddress 
                : formatAddress(order.deliveryAddress);
            } catch {
              addressStrAll = 'N/A';
            }
            
            matchesSearch = 
              orderIdStrAll.includes(searchLower) ||
              customerName.includes(searchLower) ||
              customerEmail.includes(searchLower) ||
              customerPhone.includes(appliedSearchTerm.trim()) ||
              (addressStrAll && addressStrAll !== 'N/A' ? addressStrAll.toLowerCase().includes(searchLower) : false);
        }
      } catch (error) {
        console.error('Error in search filter:', error);
        matchesSearch = false;
      }
      
      return matchesSearch;
    });
    
    // Sort orders
    if (orderViewType === 'upcoming') {
      // For upcoming orders, sort by delivery date/time, then by creation date (first-come-first-serve)
      filtered.sort((a, b) => {
        // First sort by delivery date
        const dateA = a.deliveryDate ? new Date(a.deliveryDate).getTime() : 0;
        const dateB = b.deliveryDate ? new Date(b.deliveryDate).getTime() : 0;
        
        if (dateA !== dateB) {
          return dateA - dateB;
        }
        
        // If same delivery date, compare by delivery time if available
        if (a.deliveryTime && b.deliveryTime) {
          // Extract first time from slot string (e.g., "10:00 AM - 12:00 PM" -> "10:00")
          const extractFirstTime = (timeStr: string): number => {
            const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
            if (timeMatch) {
              const [, hours, minutes] = timeMatch;
              return parseInt(hours, 10) * 60 + parseInt(minutes, 10); // Convert to minutes for comparison
            }
            return 0;
          };
          
          const timeA = extractFirstTime(a.deliveryTime);
          const timeB = extractFirstTime(b.deliveryTime);
          
          if (timeA !== timeB) {
            return timeA - timeB;
          }
        }
        
        // If same delivery date/time, sort by creation date (first-come-first-serve)
        const createdA = new Date(a.createdAt).getTime();
        const createdB = new Date(b.createdAt).getTime();
        return createdA - createdB;
      });
    } else {
      // Apply sorting based on sortBy state
      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'newest':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'oldest':
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case 'total':
            return (b.total || 0) - (a.total || 0);
          case 'customer':
            return (a.customerName || '').localeCompare(b.customerName || '');
          default:
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      });
    }
    
    return filtered;
  }, [orders, statusFilter, startDate, endDate, todayDeliveryFilter, orderViewType, appliedSearchTerm, searchType, sortBy]);

  // Utility function to get order statistics
  const getOrderStats = useMemo(() => {
    return {
      total: orderStats.total,
      pending: orderStats.pending,
      confirmed: orderStats.confirmed,
      delivered: orderStats.delivered,
      revenue: orderStats.totalRevenue,
      today: filteredOrders.filter(order => {
        const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
        return orderDate === getToday();
      }).length
    };
  }, [orderStats, filteredOrders]);

  // Export orders function
  const handleExportOrders = useCallback(() => {
    const csvContent = generateCSV(filteredOrders);
    downloadCSV(csvContent, 'orders-export.csv');
    showSuccess('Export Successful', 'Orders have been exported successfully');
  }, [filteredOrders, showSuccess]);

  // Export confirmation function
  const handleExportConfirmation = useCallback(() => {
    showConfirm(
      'Export Orders',
      `Are you sure you want to export ${filteredOrders.length} orders to CSV?`,
      () => {
        handleExportOrders();
      }
    );
  }, [filteredOrders.length, handleExportOrders, showConfirm]);

  // Date range handlers
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDateRangeChange = useCallback((start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    setShowDatePicker(false);
    
    // Show toast notification
    if (start && end) {
      const startFormatted = new Date(start).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      const endFormatted = new Date(end).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      showInfo('Date Range Applied', `Showing orders from ${startFormatted} to ${endFormatted}`);
    } else if (start) {
      const startFormatted = new Date(start).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      showInfo('Date Filter Applied', `Showing orders from ${startFormatted}`);
    }
  }, [showInfo]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleClearDateRange = useCallback(() => {
    setStartDate('');
    setEndDate('');
    showInfo('Date Filter Cleared', 'Showing all orders');
  }, [showInfo]);

  // Helper function to format date range display
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const formatDateRangeDisplay = useCallback((start: string, end: string) => {
    if (!start && !end) return 'Select Date Range';
    
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear().toString().slice(-2);
      return `${day}/${month}/${year}`;
    };

    if (start && end) {
      return `${formatDate(start)} - ${formatDate(end)}`;
    } else if (start) {
      return `From ${formatDate(start)}`;
    }
    return 'Select Date Range';
  }, []);

  // Bulk action functions
  const handleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(order => order.id));
    }
  };

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    try {
      setActionLoading('bulk');
      let successCount = 0;
      let failCount = 0;
      
      for (const orderId of selectedOrders) {
        try {
        await orderService.updateOrder(orderId, { status: newStatus as any });
          successCount++;
        } catch (error) {
          failCount++;
          console.error(`Error updating order ${orderId}:`, error);
        }
      }
      
      if (successCount > 0) {
        showSuccess('Bulk Update', `Successfully updated ${successCount} order${successCount !== 1 ? 's' : ''} to ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`);
      }
      
      if (failCount > 0) {
        showInfo('Partial Update', `${failCount} order${failCount !== 1 ? 's' : ''} could not be updated`);
      }
      
      await fetchOrders();
      await fetchOrderStats();
      setSelectedOrders([]);
      setShowBulkActions(false);
    } catch (error: any) {
      console.error('Error updating bulk status:', error);
      showInfo('Bulk Update Failed', error?.message || 'Failed to update orders. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const allOrderColumns: TableColumn[] = [
    {
      key: 'select',
      label: 'Select',
      width: selectMode ? '40px' : '0px',
      render: (_, item) => (
        <input
          type="checkbox"
          checked={selectedOrders.includes(item.id)}
          onChange={() => handleSelectOrder(item.id)}
          className="w-4 h-4 rounded border-2 border-gray-300 text-primary-600 dark:text-primary-400 focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 transition-all cursor-pointer hover:border-primary-400"
        />
      )
    },
    { 
      key: 'customer', 
      label: 'Customer',
      width: selectMode ? '13%' : '15%',
      sortable: true,
      render: (_, item) => (
        <div className="flex flex-col min-w-0">
          <span className="font-medium text-gray-900 dark:text-white truncate">{item.customerName}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5 truncate">#{item.order_number || item.id}</span>
        </div>
      )
    },
    { 
      key: 'items', 
      label: 'Item',
      width: selectMode ? '18%' : '20%',
      render: (_, item) => {
        const firstItem = item.items && item.items.length > 0 ? item.items[0] : null;
        const remainingCount = item.items && item.items.length > 1 ? item.items.length - 1 : 0;
        const flavorName = firstItem?.flavor_name || null;
        
        return (
          <div className="flex flex-col min-w-0 max-w-[200px]">
            {firstItem ? (
              <>
                <span className="font-medium text-gray-900 text-sm truncate">{firstItem.productName}</span>
                {flavorName && (
                  <span className="text-xs text-gray-600 mt-0.5 truncate">{flavorName} Flavour</span>
                )}
                {remainingCount > 0 && (
                  <div className="group relative mt-1">
                    <span className="text-xs text-blue-600 font-medium cursor-help">
                      +{remainingCount} more
                    </span>
                    <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white dark:text-gray-100 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap shadow-lg">
                      {item.items.slice(1).map((it: any, idx: number) => (
                        <div key={idx} className="py-0.5">
                          {it.productName}
                          {it.flavor_name && ` (${it.flavor_name})`}
                        </div>
                      ))}
                      <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <span className="text-sm text-gray-500 dark:text-gray-400">No items</span>
            )}
          </div>
        );
      }
    },
    { 
      key: 'total', 
      label: 'Total',
      width: selectMode ? '7%' : '8%',
      sortable: true, 
      render: (value) => {
      const num = Number(value) || 0;
      const formatted = num.toFixed(2).replace(/\.?0+$/, '');
        return (
          <span className="font-bold text-gray-900 dark:text-white text-sm">₹{formatted}</span>
        );
      }
    },
    { 
      key: 'status', 
      label: 'Status',
      width: selectMode ? '11%' : '12%',
      render: (value) => getStatusBadge(value)
    },
    { 
      key: 'payment', 
      label: 'Payment',
      width: selectMode ? '9%' : '10%',
      render: (_, item) => {
        const paymentMethod = item.payment_method || 'COD';
        const isPaid = item.paymentStatus === 'paid';
        const paymentDisplay = paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1);
        
        return (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">{paymentDisplay}</span>
            <span className={`text-xs mt-0.5 whitespace-nowrap ${isPaid ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
              ({isPaid ? 'Paid' : 'Unpaid'})
            </span>
          </div>
        );
      }
    },
    { 
      key: 'delivery', 
      label: 'Delivery',
      width: selectMode ? '13%' : '15%',
      sortable: true,
      render: (_, item) => {
        const deliveryDate = item.deliveryDate ? new Date(item.deliveryDate).toLocaleDateString('en-US', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric' 
        }) : 'N/A';
        const deliveryTime = item.deliveryTime || '';
        
        return (
          <div className="flex flex-col min-w-0 max-w-[150px]">
            <span className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">{deliveryDate}</span>
            {deliveryTime && (
              <span className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 break-words">
                Slot: {deliveryTime}
              </span>
            )}
          </div>
        );
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      width: selectMode ? '18%' : '20%',
      render: (_, item) => {
        const isDelivered = item.status === 'delivered';
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const orderNumber = item.order_number || item.orderId || item.id;
        
        return (
          <div className="flex items-center gap-2">
            {isDelivered ? (
        <div className="flex items-center gap-1">
                <ConfirmButton
                  orderId={item.id}
                  createdAt={item.createdAt}
                  status={item.status}
                  onConfirm={() => updateOrderStatus(item.id, 'confirmed')}
                  isLoading={actionLoading === item.id}
                />
                <button
                  onClick={() => handleViewInvoice(item)}
                  className="flex items-center justify-center w-[27px] py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 rounded-lg border-2 border-blue-200 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md"
                  title="View Invoice"
                >
                  <FileText className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <ConfirmButton
                orderId={item.id}
                createdAt={item.createdAt}
                status={item.status}
                onConfirm={() => updateOrderStatus(item.id, 'confirmed')}
                isLoading={actionLoading === item.id}
              />
            )}
            <div className="flex flex-col items-center gap-1">
          <button 
                onClick={() => handleViewOrder(item)}
                disabled={loadingOrderDetails}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-xs font-semibold rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>View</span>
              </button>
              {/* Color indicator bar based on status */}
              <div className={`h-1 w-full rounded-full transition-all ${
                item.status === 'pending' ? 'bg-green-500' :
                item.status === 'confirmed' ? 'bg-blue-500' :
                item.status === 'preparing' ? 'bg-yellow-500' :
                item.status === 'ready' ? 'bg-purple-500' :
                item.status === 'delivered' ? 'bg-green-500' :
                item.status === 'cancelled' ? 'bg-red-500' :
                'bg-gray-300'
              }`} />
        </div>
          </div>
        );
      }
    }
  ];

  // Use all columns, but filter out 'select' column if select mode is disabled
  const orderColumns = selectMode 
    ? allOrderColumns 
    : allOrderColumns.filter(col => col.key !== 'select');

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setActionLoading(orderId);
      const order = orders.find(o => o.id === orderId);
      const oldStatus = order?.status || 'unknown';
      
      const updatedOrder = await orderService.updateOrder(orderId, { status: newStatus as any });
      
      // Trigger notification for status change
      if (order && oldStatus !== newStatus) {
        notifyOrderStatusChanged(
          order.order_number || order.id,
          oldStatus,
          newStatus,
          orderId
        );
      }
      
      // Show success message
      showSuccess('Order Updated', `Order status changed to ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`);
      
      // Refresh the data
      await fetchOrders();
      await fetchOrderStats();
      
      // Update selected order if it's the one being updated
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, ...updatedOrder });
      }
    } catch (error: any) {
      console.error('Error updating order status:', error);
      const errorMessage = error?.message || 'Failed to update order status. Please try again.';
      showInfo('Update Failed', errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle invoice view (read)
  const handleViewInvoice = (order: Order) => {
    setSelectedInvoiceOrder(order);
    setShowInvoiceModal(true);
  };

  // Handle invoice download
  const handleDownloadInvoice = async (orderNumber: string | undefined, orderId: string) => {
    try {
      if (!orderNumber) {
        showInfo('Invoice Download', 'Order number not available');
        return;
      }
      
      setActionLoading(orderId);
      const blob = await orderService.downloadInvoice(orderNumber);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      showSuccess('Invoice Downloaded', `Invoice for order ${orderNumber} downloaded successfully`);
    } catch (error: any) {
      console.error('Error downloading invoice:', error);
      const errorMessage = error?.message || 'Failed to download invoice. Please try again.';
      showInfo('Download Failed', errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
  return (
    <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg animate-pulse">
                  <div className="h-6 w-6 bg-blue-200 rounded"></div>
        </div>
                <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
              <div className="h-6 w-96 bg-gray-200 rounded animate-pulse mb-3"></div>
            <div className="flex items-center gap-4">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
              </div>
            <div className="flex gap-3">
              <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-28 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg animate-pulse">
                      <div className="h-5 w-5 bg-gray-200 rounded"></div>
              </div>
              <div>
                      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-1"></div>
                      <div className="h-6 w-8 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="h-3 w-20 bg-gray-200 rounded animate-pulse mb-1"></div>
              </div>
            </div>
          </CardContent>
        </Card>
          ))}
        </div>

        {/* Search Section Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="flex gap-2">
                    <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-10 flex-1 bg-gray-200 rounded animate-pulse"></div>
                  </div>
              </div>
              <div>
                  <div className="h-4 w-28 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading Message */}
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-flex items-center gap-3 text-blue-600">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-lg font-semibold text-gray-800">Loading orders...</span>
              </div>
            <p className="text-gray-500 mt-2 font-normal">Please wait while we fetch your order data</p>
              </div>
            </div>
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orders</h1>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  Manage customer orders and delivery status
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
              <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Total Orders</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none mt-0.5">
                        {getOrderStats.total}
                      </p>
                    </div>
                    <ShoppingCart className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Pending Orders</p>
                      <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 leading-none mt-0.5">
                        {getOrderStats.pending}
                      </p>
                    </div>
                    <Clock className="w-4 h-4 text-yellow-400 dark:text-yellow-500 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Confirmed Orders</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 leading-none mt-0.5">
                        {getOrderStats.confirmed}
                      </p>
                    </div>
                    <CheckCircle className="w-4 h-4 text-blue-400 dark:text-blue-500 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Total Revenue</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400 leading-none mt-0.5">
                        ₹{getOrderStats.revenue.toFixed(0)}
                      </p>
                    </div>
                    <DollarSign className="w-4 h-4 text-green-400 dark:text-green-500 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full px-3 sm:px-4 lg:px-6 py-4 space-y-4">
      {/* Quick Actions Toolbar / Compact Filters + Count + Export + View Toggle */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search - compact pill */}
        <div className="flex-1 min-w-[220px] max-w-md">
          <Input
            placeholder="Search orders by ID, customer, phone, or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearchClick();
              }
            }}
            className="h-9 text-sm"
          />
        </div>

        {/* Status Filter - compact button + dropdown */}
        <div className="relative" ref={statusDropdownRef}>
          <button
            onClick={() => {
              setShowStatusDropdown(!showStatusDropdown);
              setShowSortDropdown(false);
              setSearchTypeDropdownOpen(false);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <Filter className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
            <span className="truncate max-w-[120px]">
              {getStatusFilterLabel(statusFilter)}
            </span>
            <ChevronDown className={`w-3 h-3 text-gray-500 dark:text-gray-400 transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          {showStatusDropdown && (
            <div className="absolute top-full left-0 mt-2 min-w-[180px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl dark:shadow-black/40 z-50 overflow-hidden backdrop-blur-sm">
              <div className="py-1.5">
                {['all', 'pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'].map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      handleStatusFilterChange(status);
                      setShowStatusDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-all duration-200 flex items-center justify-between ${
                      statusFilter === status 
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold border-l-2 border-primary-500 dark:border-primary-400' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <span>{getStatusFilterLabel(status)}</span>
                    {statusFilter === status && (
                      <div className="w-2 h-2 rounded-full bg-primary-500 dark:bg-primary-400"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sort - compact button + dropdown */}
        <div className="relative" ref={sortDropdownRef}>
          <button
            onClick={() => {
              setShowSortDropdown(!showSortDropdown);
              setShowStatusDropdown(false);
              setSearchTypeDropdownOpen(false);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
            <span className="truncate max-w-[120px]">
              {sortBy === 'newest' && 'Newest'}
              {sortBy === 'oldest' && 'Oldest'}
              {sortBy === 'total' && 'Total'}
              {sortBy === 'customer' && 'Customer'}
            </span>
            <ChevronDown className={`w-3 h-3 text-gray-500 dark:text-gray-400 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          {showSortDropdown && (
            <div className="absolute top-full left-0 mt-2 min-w-[200px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl dark:shadow-black/40 z-50 overflow-hidden backdrop-blur-sm">
              <div className="py-1.5">
                {[
                  { value: 'newest', label: 'Newest First' },
                  { value: 'oldest', label: 'Oldest First' },
                  { value: 'total', label: 'Total Amount' },
                  { value: 'customer', label: 'Customer Name' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value as any);
                      setShowSortDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-all duration-200 flex items-center justify-between ${
                      sortBy === option.value 
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold border-l-2 border-primary-500 dark:border-primary-400' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <span>{option.label}</span>
                    {sortBy === option.value && (
                      <div className="w-2 h-2 rounded-full bg-primary-500 dark:bg-primary-400"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
          {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'} found
        </div>

        {/* Export */}
        <DashboardTooltip text="Export orders to CSV">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportConfirmation}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </DashboardTooltip>

        {/* Quick Actions */}
        <DashboardTooltip text="Refresh orders list">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              fetchOrders();
              fetchOrderStats();
            }}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </DashboardTooltip>

        <DashboardTooltip text="View website in new tab">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.open('/', '_blank')}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="hidden sm:inline">View Site</span>
          </Button>
        </DashboardTooltip>

        {/* View Mode Toggle */}
        <div className="ml-auto flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full p-1">
          <DashboardTooltip text="Table view">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </DashboardTooltip>
          <DashboardTooltip text="Grid view">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Grid3x3 className="h-4 w-4" />
            </button>
          </DashboardTooltip>
        </div>
      </div>


      {/* Orders Table/Grid */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700 pt-3 pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-br from-primary-600 to-orange-600 rounded-lg shadow-sm">
                <Package className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">Orders Management</span>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                ({filteredOrders.length} of {totalOrders} orders)
              </span>
            </CardTitle>
            
            {/* Table Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Select Mode Button */}
              <Button
                variant={selectMode ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => {
                  const newSelectMode = !selectMode;
                  setSelectMode(newSelectMode);
                  if (!newSelectMode) {
                    setSelectedOrders([]);
                    setShowBulkActions(false);
                  }
                }}
                className={`text-sm font-medium border-2 px-6 py-2 rounded-lg transition-all ${
                  selectMode
                    ? 'bg-green-600 hover:bg-green-700 text-white border-green-600 shadow-md' 
                    : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600'
                }`}
              >
                {selectMode ? '✓ Select Mode' : 'Select'}
              </Button>
              
              {/* All Orders Button */}
              <Button
                variant={orderViewType === 'all' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setOrderViewType('all')}
                className={`text-sm font-medium border-2 px-6 py-2 rounded-lg transition-all ${
                  orderViewType === 'all'
                    ? 'bg-primary-600 hover:bg-primary-700 text-white border-primary-600 shadow-md' 
                    : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600'
                }`}
              >
                All Orders
              </Button>
              
              {/* Upcoming Orders Button */}
              <Button
                variant={orderViewType === 'upcoming' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setOrderViewType('upcoming')}
                className={`text-sm font-medium border-2 px-6 py-2 rounded-lg transition-all ${
                  orderViewType === 'upcoming'
                    ? 'bg-primary-600 hover:bg-primary-700 text-white border-primary-600 shadow-md' 
                    : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600'
                }`}
              >
                Upcoming Orders
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Bulk Actions Bar - Only show when select mode is active */}
          {selectMode && selectedOrders.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {selectedOrders.length} order{selectedOrders.length !== 1 ? 's' : ''} selected
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleBulkStatusUpdate('confirmed')}
                      className="text-sm font-medium border-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={actionLoading === 'bulk'}
                    >
                      {actionLoading === 'bulk' ? (
                        <span className="flex items-center gap-2">
                          <span className="h-3 w-3 border-2 border-gray-800 dark:border-gray-200 border-t-transparent rounded-full animate-spin"></span>
                          Updating...
                        </span>
                      ) : (
                        'Mark Confirmed'
                      )}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleBulkStatusUpdate('preparing')}
                      className="text-sm font-medium border-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={actionLoading === 'bulk'}
                    >
                      {actionLoading === 'bulk' ? (
                        <span className="flex items-center gap-2">
                          <span className="h-3 w-3 border-2 border-gray-800 dark:border-gray-200 border-t-transparent rounded-full animate-spin"></span>
                          Updating...
                        </span>
                      ) : (
                        'Mark Preparing'
                      )}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleBulkStatusUpdate('ready')}
                      className="text-sm font-medium border-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={actionLoading === 'bulk'}
                    >
                      {actionLoading === 'bulk' ? (
                        <span className="flex items-center gap-2">
                          <span className="h-3 w-3 border-2 border-gray-800 dark:border-gray-200 border-t-transparent rounded-full animate-spin"></span>
                          Updating...
                        </span>
                      ) : (
                        'Mark Ready'
                      )}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleBulkStatusUpdate('delivered')}
                      className="text-sm font-medium border-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={actionLoading === 'bulk'}
                    >
                      {actionLoading === 'bulk' ? (
                        <span className="flex items-center gap-2">
                          <span className="h-3 w-3 border-2 border-gray-800 dark:border-gray-200 border-t-transparent rounded-full animate-spin"></span>
                          Updating...
                        </span>
                      ) : (
                        'Mark Delivered'
                      )}
                    </Button>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedOrders([])}
                  className="text-sm text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          )}
          
          {/* Grid View */}
          {viewMode === 'grid' ? (
            <div className="p-4 sm:p-5 md:p-6">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                  <p className="text-lg font-medium">No orders found</p>
                  <p className="text-sm mt-2">Try adjusting your filters or search terms</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
                  {filteredOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onView={handleViewOrder}
                      onStatusUpdate={updateOrderStatus}
                      onViewInvoice={handleViewInvoice}
                      actionLoading={actionLoading}
                      isSelected={selectedOrders.includes(order.id)}
                      onSelect={handleSelectOrder}
                      selectMode={selectMode}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                {/* Select All Header - Only show when select mode is active */}
                {selectMode && filteredOrders.length > 0 && (
                  <div className="px-6 py-3.5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-2 border-gray-300 dark:border-gray-600 text-primary-600 dark:text-primary-400 focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 transition-all cursor-pointer hover:border-primary-400"
                      />
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Select All ({filteredOrders.length} orders)
                      </span>
                    </div>
                  </div>
                )}
                <Table
                  data={filteredOrders}
                  columns={orderColumns}
                  emptyMessage="No orders found"
                  className="border-0 shadow-none"
                />
              </div>
              
              {/* Mobile Card View - Redesigned */}
              <div className="md:hidden">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <Package className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-3" />
                <p className="text-lg font-medium dark:text-gray-300">No orders found</p>
                <p className="text-sm mt-2 dark:text-gray-400">Try adjusting your filters or search terms</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-4">
                {filteredOrders.map((order) => {
                  const isSelected = selectedOrders.includes(order.id);
                  const isDealItemsExpanded = expandedDealItems.has(order.id);
                  
                  // Helper function to get product image
                  const getProductImage = (item: any): string | null => {
                    return (
                      item.product_image ||
                      (item as any).image_url ||
                      (item as any).productImage ||
                      (item as any).image ||
                      null
                    );
                  };

                  // Separate main items and deal items
                  const mainItems = (order.items || []).filter(item => !isDealItemForDisplay(item));
                  const dealItems = (order.items || []).filter(item => isDealItemForDisplay(item));
                  
                  const paymentMethod = order.payment_method || 'COD';
                  const isPaid = order.paymentStatus === 'paid';
                  const deliveryDate = order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('en-US', { 
                    day: '2-digit', 
                    month: 'short', 
                    year: 'numeric' 
                  }) : 'N/A';
                  
                  // Get status color
                  const getStatusColor = (status: string) => {
                    switch(status) {
                      case 'pending': return 'bg-gray-500';
                      case 'confirmed': return 'bg-blue-500';
                      case 'preparing': return 'bg-orange-500';
                      case 'ready': return 'bg-purple-500';
                      case 'delivered': return 'bg-green-500';
                      case 'cancelled': return 'bg-red-500';
                      default: return 'bg-gray-500';
                    }
                  };

                  const getStatusIcon = (status: string) => {
                    switch(status) {
                      case 'pending': return <Clock className="h-3.5 w-3.5 flex-shrink-0" />;
                      case 'confirmed': return <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />;
                      case 'preparing': return <Package className="h-3.5 w-3.5 flex-shrink-0" />;
                      case 'ready': return <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />;
                      case 'delivered': return <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />;
                      case 'cancelled': return <XCircle className="h-3.5 w-3.5 flex-shrink-0" />;
                      default: return <Package className="h-3.5 w-3.5 flex-shrink-0" />;
                    }
                  };

                  const getStatusLabel = (status: string) => {
                    return status.charAt(0).toUpperCase() + status.slice(1);
                  };
                  
                  return (
                  <Card
                    key={order.id}
                    className={`hover:shadow-xl transition-all duration-300 overflow-hidden border-2 w-[98vw] md:w-full ${
                      isSelected 
                        ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-400' 
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {/* Selection Checkbox */}
                    {selectedOrders.length > 0 && (
                      <div className="absolute top-3 left-3 z-20">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOrder(order.id)}
                          className="h-6 w-6 rounded border-2 border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 shadow-lg cursor-pointer"
                        />
                      </div>
                    )}

                    {/* Status Header - Color Coded */}
                    <div className={`px-2.5 py-1.5 flex items-center justify-between ${getStatusColor(order.status)} text-white`}>
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        {getStatusIcon(order.status)}
                        <span className="font-bold text-xs uppercase tracking-wide">
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="text-[10px] font-semibold bg-white/20 px-1.5 py-0.5 rounded">
                          #{order.order_number || order.id.slice(-6)}
                        </span>
                        <span className="text-xs font-bold">
                          ₹{(order.total || 0).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        </span>
                      </div>
                    </div>

                    <CardContent className="p-3 md:p-4">
                      {/* Customer Name */}
                      <div className="mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{order.customerName || 'Guest Customer'}</p>
                        </div>
                      </div>

                      {/* Main Items Section */}
                      {mainItems.length > 0 ? (
                        <div className="mb-3">
                          <div className="flex items-center gap-1.5 mb-2">
                            <div className="p-1 bg-purple-100 dark:bg-purple-900/30 rounded">
                              <Package className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                              Order Items {mainItems.length > 1 && `(${mainItems.length})`}
                            </h3>
                          </div>
                          
                          <div className="space-y-2">
                            {mainItems.slice(0, 2).map((item, index) => {
                              const productImage = getProductImage(item);
                              return (
                                <div 
                                  key={item.id || index}
                                  className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2.5 border border-gray-200 dark:border-gray-700"
                                >
                                  <div className="flex gap-2.5">
                                    {/* Product Image */}
                                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-white dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-700 shadow-sm">
                                      {productImage ? (
                                        <img 
                                          src={productImage} 
                                          alt={item.productName}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                          }}
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                                          <Package className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Product Details */}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1.5 leading-tight">
                                        {item.productName}
                                      </p>
                                      
                                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                                        {item.flavor_name && (
                                          <div className="flex items-center gap-1">
                                            <span className="text-gray-500 dark:text-gray-400">Flavor:</span>
                                            <span className="text-gray-900 dark:text-gray-100 font-semibold">
                                              {item.flavor_name}
                                            </span>
                                          </div>
                                        )}
                                        
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
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            {mainItems.length > 2 && (
                              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium text-center pt-1">
                                +{mainItems.length - 2} more item{mainItems.length - 2 !== 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : order.items?.length === 0 ? (
                        <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
                          <Package className="h-6 w-6 text-gray-400 mx-auto mb-1.5" />
                          <p className="text-xs text-gray-600 dark:text-gray-400">No items in this order</p>
                        </div>
                      ) : null}

                      {/* Deal Items Section - Expandable */}
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
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/90 text-amber-800 dark:text-amber-100 border border-amber-200 dark:border-amber-700">
                                  {dealItems.length}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-amber-800/80 dark:text-amber-100/80">
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
                                      <div className="relative w-11 h-11 sm:w-12 sm:h-12 bg-amber-50 dark:bg-amber-950 rounded-md overflow-hidden flex-shrink-0 border border-amber-200 dark:border-amber-700">
                                        {productImage ? (
                                          <img 
                                            src={productImage} 
                                            alt={item.productName}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                          />
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

                      {/* Payment & Delivery Info */}
                      <div className="mb-2 p-1.5 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-700">
                        <div className="flex items-center gap-1 mb-1">
                          <Calendar className="h-3.5 w-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                          <span className="text-[10px] font-bold text-green-700 dark:text-green-300 uppercase tracking-wide">
                            Delivery
                          </span>
                        </div>
                        <p className="text-xs font-bold text-gray-900 dark:text-gray-100 ml-4.5">
                          {deliveryDate} {order.deliveryTime && `• ${order.deliveryTime}`}
                        </p>
                      </div>

                      <div className="mb-2 p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <CreditCard className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                            <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                              Payment
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                              {paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}
                            </span>
                            <span className={`text-[10px] block mt-0.5 ${isPaid ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                              ({isPaid ? 'Paid' : 'Unpaid'})
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons - Touch Friendly */}
                      <div className="flex flex-row gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        {order.status === 'delivered' ? (
                          <>
                            <div className="flex-1">
                              <ConfirmButton
                                orderId={order.id}
                                createdAt={order.createdAt}
                                status={order.status}
                                onConfirm={() => updateOrderStatus(order.id, 'confirmed')}
                                isLoading={actionLoading === order.id}
                              />
                            </div>
                            <Button
                              onClick={() => handleViewInvoice(order)}
                              variant="secondary"
                              className="flex-1 text-sm font-semibold py-2 h-[42px]"
                            >
                              <FileText className="h-4 w-4 mr-1.5" />
                              Invoice
                            </Button>
                            <Button
                              onClick={() => handleViewOrder(order)}
                              variant="secondary"
                              className="flex-1 text-sm font-semibold py-2 h-[42px]"
                            >
                              <Eye className="h-4 w-4 mr-1.5" />
                              View
                            </Button>
                          </>
                        ) : (
                          <>
                            <div className="flex-1 flex items-center">
                              <div className="w-full">
                                <ConfirmButton
                                  orderId={order.id}
                                  createdAt={order.createdAt}
                                  status={order.status}
                                  onConfirm={() => updateOrderStatus(order.id, 'confirmed')}
                                  isLoading={actionLoading === order.id}
                                />
                              </div>
                            </div>
                            <Button
                              onClick={() => handleViewOrder(order)}
                              variant="secondary"
                              className="flex-1 text-sm font-semibold py-2 h-[42px] flex items-center justify-center"
                            >
                              <Eye className="h-4 w-4 mr-1.5" />
                              View
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  );
                })}
              </div>
            )}
              </div>
            </>
          )}
          {totalPages > 1 && (
            <div className="w-[98vw] md:w-full mx-auto mt-4 md:mt-0">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalOrders}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </CardContent>
      </Card>
      </div>

      {/* Order Details Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Order Details - ${selectedOrder?.order_number || selectedOrder?.id}`}
        size="wide"
      >
        {selectedOrder ? (() => {
          // Helper function to parse SQLite DATETIME and convert to user's local timezone
          // Since SQLite datetime('now') returns server's local time (which could be UTC or any timezone),
          // we need to intelligently detect and convert. For best UX, we'll try multiple approaches:
          // 1. If timestamp matches current local time pattern, treat as local
          // 2. Otherwise, treat as UTC (common server default) and convert
          const parseLocalDateTime = (dateTimeStr: string): Date => {
            if (!dateTimeStr) return new Date();
            
            // Remove any milliseconds if present: "2025-11-02 14:20:00.123" -> "2025-11-02 14:20:00"
            const cleanStr = dateTimeStr.split('.')[0].trim();
            
            // Check if it's SQLite format: "YYYY-MM-DD HH:MM:SS" (space-separated, no timezone)
            const sqliteMatch = cleanStr.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
            if (sqliteMatch) {
              const [, year, month, day, hours, minutes, seconds] = sqliteMatch.map(Number);
              
              // Strategy: Try both interpretations and pick the one that makes more sense
              // Most servers run in UTC, so that's our default assumption
              // Create as UTC first (most common case)
              const asUtc = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds || 0));
              
              // Also create as local time for comparison
              const asLocal = new Date(year, month - 1, day, hours, minutes, seconds || 0);
              
              // Check which one is closer to "now" (more likely to be correct)
              const now = new Date();
              const utcDiff = Math.abs(now.getTime() - asUtc.getTime());
              const localDiff = Math.abs(now.getTime() - asLocal.getTime());
              
              // If the local interpretation is much closer (within 1 hour), use local
              // Otherwise, assume UTC (which is more common for servers)
              if (localDiff < utcDiff && localDiff < 3600000) { // 1 hour in ms
                // The timestamp is very close to current local time, so it's likely stored as local
                return asLocal;
              }
              
              // Default: treat as UTC (server timezone is usually UTC)
              return asUtc;
            }
            
            // Check if it's ISO format: "2025-11-02T14:20:00" or "2025-11-02T14:20:00Z"
            if (cleanStr.includes('T')) {
              // ISO format - if it ends with 'Z', it's UTC
              if (cleanStr.endsWith('Z') || cleanStr.match(/[+-]\d{2}:\d{2}$/)) {
                // Has timezone info - parse normally (will convert to local time)
                return new Date(cleanStr);
              } else {
                // ISO without timezone - assume UTC (consistent with SQLite behavior)
                const isoParts = cleanStr.split('T');
                if (isoParts.length === 2) {
                  const [datePart, timePart] = isoParts;
                  const [year, month, day] = datePart.split('-').map(Number);
                  const [hours, minutes, seconds = '0'] = timePart.split(':').map(s => s.split('.')[0]);
                  return new Date(Date.UTC(year, month - 1, day, Number(hours), Number(minutes), Number(seconds)));
                }
              }
            }
            
            // Try to parse as UTC first (most common case for servers)
            // If that fails, try local parsing
            let parsed = new Date(cleanStr + ' UTC'); // Try appending UTC
            if (isNaN(parsed.getTime())) {
              parsed = new Date(cleanStr); // Fallback to standard parsing
            }
            
            if (isNaN(parsed.getTime())) {
              console.warn('Could not parse date:', dateTimeStr, 'using current time');
              return new Date();
            }
            return parsed;
          };

          // Split main items and deal items for clearer presentation
          const mainItems = (selectedOrder.items || []).filter(item => !isDealItemForDisplay(item));
          const dealItems = (selectedOrder.items || []).filter(item => isDealItemForDisplay(item));

          const getItemImage = (item: any): string | null => {
            return (
              item.product_image ||
              (item as any).image_url ||
              (item as any).productImage ||
              (item as any).image ||
              null
            );
          };

          return (
          <div id="order-details-print" className="space-y-3 md:space-y-4">
            {/* Header Section - Compact Order Summary - Mobile Optimized */}
            <div className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border border-primary-200 dark:border-primary-700 rounded-lg p-3 md:p-4">
              {/* Order Status Flow - At Top - Hidden on mobile for space */}
              <div className="hidden md:block mb-4 pb-4 border-b border-primary-200 dark:border-primary-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                  Order Status Flow
                </h3>
                <div className="max-h-[120px] overflow-y-auto">
                  <OrderTimeline order={selectedOrder} />
                </div>
              </div>
              
              {/* Order Summary Info - Mobile Stacked */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <div className="lg:col-span-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                      <FileText className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Order Number</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">#{selectedOrder.order_number || selectedOrder.id}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">Total Amount</p>
                  <p className="text-xl font-bold text-primary-600 dark:text-primary-400">₹{(selectedOrder.total || 0).toFixed(2).replace(/\.?0+$/, '')}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">Status</p>
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
                    selectedOrder.status === 'delivered' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                    selectedOrder.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                    selectedOrder.status === 'ready' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                    selectedOrder.status === 'preparing' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    selectedOrder.status === 'confirmed' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Main Content Grid - 2 Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Left Column */}
              <div className="space-y-3">
                {/* Customer Information - Compact - Mobile Optimized */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 md:p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                      Customer
                    </h3>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => window.open(`tel:${selectedOrder.customerPhone}`)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                        title="Call"
                      >
                        <Phone className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                      </button>
                      <button
                        onClick={() => window.open(`mailto:${selectedOrder.customerEmail}`)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                        title="Email"
                      >
                        <Mail className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                      </button>
                      <button
                        onClick={() => {
                          const message = `Hi ${selectedOrder.customerName}, regarding your order ${selectedOrder.order_number || selectedOrder.id}. `;
                          window.open(`https://wa.me/${selectedOrder.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`);
                        }}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                        title="WhatsApp"
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <div>
                      <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">Name</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedOrder.customerName}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">Phone</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedOrder.customerPhone}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">Email</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white break-all text-xs">{selectedOrder.customerEmail}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">Delivery Address</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white leading-relaxed">
                        {formatAddress(selectedOrder.deliveryAddress)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Delivery Information - Compact - Mobile Optimized */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 md:p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                    <Truck className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                    Delivery
                  </h3>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">Date</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {new Date(selectedOrder.deliveryDate).toLocaleDateString('en-US', { 
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">Time</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedOrder.deliveryTime}</p>
                    </div>
                  </div>
                  {selectedOrder.notes && (
                    <div className="mt-2.5 pt-2.5 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">Notes</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white whitespace-pre-wrap">{selectedOrder.notes}</p>
                    </div>
                  )}
                </div>

                {/* Status Update - Compact - Mobile Optimized */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 md:p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                      Update Status
                    </h3>
                    <div className="hidden md:block" title="Hover over buttons for details">
                      <HelpCircle className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2">
                    {(() => {
                      const statusInfo: { [key: string]: { label: string, description: string, icon: React.ReactNode, color: string } } = {
                        'pending': { 
                          label: 'Pending', 
                          description: 'Initial state when customer places order. Verify payment & order details, then click "Confirmed" to proceed.',
                          icon: <Clock className="h-3.5 w-3.5" />,
                          color: 'gray'
                        },
                        'confirmed': { 
                          label: 'Confirmed', 
                          description: 'Order verified and confirmed. Click "Preparing" when production starts.',
                          icon: <CheckCircle className="h-3.5 w-3.5" />,
                          color: 'purple'
                        },
                        'preparing': { 
                          label: 'Preparing', 
                          description: 'Production in progress. Click "Ready" when order is completed and ready for delivery.',
                          icon: <Package className="h-3.5 w-3.5" />,
                          color: 'yellow'
                        },
                        'ready': { 
                          label: 'Ready', 
                          description: 'Order is ready for pickup/delivery. Click "Delivered" once customer receives it.',
                          icon: <Truck className="h-3.5 w-3.5" />,
                          color: 'blue'
                        },
                        'delivered': { 
                          label: 'Delivered', 
                          description: 'Order has been delivered to customer. Final status.',
                          icon: <CheckCircle className="h-3.5 w-3.5" />,
                          color: 'green'
                        }
                      };
                      
                      return ['pending', 'confirmed', 'preparing', 'ready', 'delivered'].map((status) => {
                        const info = statusInfo[status];
                        const isActive = selectedOrder.status === status;
                        const isLoading = actionLoading === selectedOrder.id && !isActive;
                        const isDisabled = isLoading || isActive;
                        
                        const colorClasses = {
                          gray: isActive 
                            ? 'bg-gray-700 hover:bg-gray-800 text-white border-gray-700 shadow-md shadow-gray-500/30' 
                            : 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600',
                          purple: isActive 
                            ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600 shadow-md shadow-purple-500/30' 
                            : 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-700',
                          yellow: isActive 
                            ? 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500 shadow-md shadow-yellow-500/30' 
                            : 'bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700',
                          blue: isActive 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-md shadow-blue-500/30' 
                            : 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700',
                          green: isActive 
                            ? 'bg-green-600 hover:bg-green-700 text-white border-green-600 shadow-md shadow-green-500/30' 
                            : 'bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700'
                        };
                        
                        return (
                          <div key={status} className="group relative">
                            <Button
                              variant={isActive ? 'primary' : 'secondary'}
                              size="sm"
                              onClick={() => updateOrderStatus(selectedOrder.id, status)}
                              disabled={isDisabled}
                              className={`px-4 py-2.5 text-xs rounded-lg font-bold tracking-wide transition-all duration-200 border-2 ${
                                colorClasses[info.color as keyof typeof colorClasses]
                              } ${isActive ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800' : ''} ${
                                isActive && info.color === 'gray' ? 'ring-gray-400' :
                                isActive && info.color === 'purple' ? 'ring-purple-400' :
                                isActive && info.color === 'yellow' ? 'ring-yellow-400' :
                                isActive && info.color === 'blue' ? 'ring-blue-400' :
                                isActive && info.color === 'green' ? 'ring-green-400' : ''
                              } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 hover:scale-105 active:scale-95 flex items-center gap-2`}
                            >
                              {isLoading ? (
                                <span className="flex items-center gap-1.5">
                                  <span className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                                  <span>Updating...</span>
                                </span>
                              ) : (
                                <>
                                  {info.icon}
                                  <span>{info.label}</span>
                                </>
                              )}
                            </Button>
                            {!isActive && !isLoading && (
                              <div className="absolute bottom-full left-0 mb-2 w-64 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white dark:text-gray-100 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-10 shadow-xl">
                                <div className="font-bold mb-1 flex items-center gap-1.5">
                                  {info.icon}
                                  {info.label}
                                </div>
                                <div className="text-gray-300 dark:text-gray-300 leading-relaxed">{info.description}</div>
                                <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-3">
                {/* Order Items - Main & Deal, compact with images - Mobile Optimized */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 md:p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                    <Package className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                    Order Items
                  </h3>

                  <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                    {/* Main Items */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                          Main Items {mainItems.length > 1 && `(${mainItems.length})`}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {mainItems.map((item) => {
                          const productImage = getItemImage(item);
                          return (
                            <div
                              key={item.id}
                              className="flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-md border border-gray-200 dark:border-gray-600"
                            >
                              {/* Image */}
                              <div className="w-12 h-12 flex-shrink-0 bg-white dark:bg-gray-800 rounded-md overflow-hidden border border-gray-200 dark:border-gray-600 shadow-sm relative">
                                {productImage ? (
                                  <img
                                    src={productImage}
                                    alt={item.productName || 'Product'}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500 bg-gradient-to-br from-gray-50 dark:from-gray-800 to-gray-100 dark:to-gray-700">
                                    <Package className="w-5 h-5" />
                                  </div>
                                )}
                              </div>

                              {/* Product Info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                  {item.productName}
                                </p>
                                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-600 dark:text-gray-400">
                                  {item.flavor_name && (
                                    <span>
                                      Flavor:{' '}
                                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                                        {item.flavor_name}
                                      </span>
                                    </span>
                                  )}
                                  {item.weight && (
                                    <span>
                                      {item.weight}
                                    </span>
                                  )}
                                  <span>
                                    Qty:{' '}
                                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                                      {item.quantity}
                                    </span>
                                  </span>
                                </div>
                              </div>

                              {/* Price */}
                              <div className="text-right ml-2 flex-shrink-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                  ₹{(item.price || 0).toFixed(2).replace(/\.?0+$/, '')}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Deal Items */}
                    {dealItems.length > 0 && (
                      <div className="pt-2 border-t border-amber-100 dark:border-amber-800">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <div className="p-1 bg-amber-500 rounded-md">
                              <ShoppingCart className="h-3.5 w-3.5 text-white" />
                            </div>
                            <span className="text-[11px] font-semibold text-amber-900 dark:text-amber-100 uppercase tracking-wide">
                              Deal Items ({dealItems.length})
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          {dealItems.map((item) => {
                            const productImage = getItemImage(item);
                            return (
                              <div
                                key={item.id}
                                className="flex items-center gap-2.5 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-200 dark:border-amber-700"
                              >
                                {/* Image */}
                                <div className="w-10 h-10 flex-shrink-0 rounded-md overflow-hidden bg-amber-50 border border-amber-200 dark:border-amber-700">
                                  {productImage ? (
                                    <img
                                      src={productImage}
                                      alt={item.productName || 'Deal item'}
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-amber-600 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40">
                                      <ShoppingCart className="w-4 h-4" />
                                    </div>
                                  )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                                      {item.productName}
                                    </p>
                                    <span className="ml-1 inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 text-[9px] font-semibold text-amber-800 dark:text-amber-100 border border-amber-200 dark:border-amber-700">
                                      Deal
                                    </span>
                                  </div>
                                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-amber-900 dark:text-amber-100">
                                    {item.weight && (
                                      <span>{item.weight}</span>
                                    )}
                                    <span>
                                      Qty:{' '}
                                      <span className="font-semibold">
                                        {item.quantity || 1}
                                      </span>
                                    </span>
                                  </div>
                                </div>

                                {/* Price */}
                                <div className="text-right ml-1 flex-shrink-0">
                                  <p className="text-xs font-semibold text-amber-900 dark:text-amber-100">
                                    ₹{(item.price || 0).toFixed(2).replace(/\.?0+$/, '')}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">Total</span>
                      <span className="text-lg font-bold text-primary-600 dark:text-primary-400">₹{(selectedOrder.total || 0).toFixed(2).replace(/\.?0+$/, '')}</span>
                    </div>
                  </div>
                </div>

                {/* Timeline - Compact */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                    Timeline
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2.5">
                      <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-1.5"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 dark:text-white">Order Created</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{(() => {
                          const orderCreatedDate = parseLocalDateTime(selectedOrder.createdAt || '');
                          return orderCreatedDate.toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          });
                        })()}</p>
                      </div>
                      <span className="text-[10px] font-medium text-green-800 dark:text-green-300 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full whitespace-nowrap">Pending</span>
                    </div>
                    
                    {selectedOrder.status !== 'pending' && (
                      <div className="flex items-start gap-2.5">
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 dark:text-white">Status Updated</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{(() => {
                            const orderUpdatedDate = parseLocalDateTime(selectedOrder.updatedAt || '');
                            return orderUpdatedDate.toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            });
                          })()}</p>
                        </div>
                        <span className="text-[10px] font-medium text-gray-600 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 px-2 py-0.5 rounded-full capitalize whitespace-nowrap">{selectedOrder.status}</span>
                      </div>
                    )}
                    
                    {selectedOrder.status === 'delivered' && (
                      <div className="flex items-start gap-2.5">
                        <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-1.5"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 dark:text-white">Order Delivered</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{(() => {
                            const orderDeliveredDate = parseLocalDateTime(selectedOrder.updatedAt || '');
                            return orderDeliveredDate.toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            });
                          })()}</p>
                        </div>
                        <span className="text-[10px] font-medium text-green-800 dark:text-green-300 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full whitespace-nowrap">Completed</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
          );
        })() : null}
        <ModalFooter>
          <div className="flex justify-between w-full">
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  const printContent = document.getElementById('order-details-print');
                  if (printContent) {
                    const printWindow = window.open('', '_blank');
                    printWindow?.document.write(`
                      <html>
                        <head>
                          <title>Order #{selectedOrder?.id}</title>
                          <style>
                            body { font-family: Arial, sans-serif; margin: 20px; }
                            .header { text-align: center; margin-bottom: 30px; }
                            .section { margin-bottom: 20px; }
                            .section h3 { border-bottom: 2px solid #333; padding-bottom: 5px; }
                            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                            .item { border: 1px solid #ddd; padding: 10px; margin: 5px 0; }
                            .total { background: #f5f5f5; padding: 15px; font-weight: bold; }
                          </style>
                        </head>
                        <body>
                          ${printContent.innerHTML}
                        </body>
                      </html>
                    `);
                    printWindow?.document.close();
                    printWindow?.print();
                  }
                }}
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  const csvContent = generateCSV([selectedOrder!]);
                  downloadCSV(csvContent, `order-${selectedOrder?.id}.csv`);
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          <Button 
            onClick={() => setSelectedOrder(null)}
            className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 text-white font-bold text-sm rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2 border-2 border-gray-800 dark:border-gray-600"
          >
            <XCircle className="h-4 w-4" />
            <span>Close</span>
          </Button>
          </div>
        </ModalFooter>
      </Modal>

      {/* Invoice Modal */}
      <Modal
        isOpen={showInvoiceModal}
        onClose={() => {
          setShowInvoiceModal(false);
          setSelectedInvoiceOrder(null);
        }}
        title={`Invoice - ${selectedInvoiceOrder?.order_number || selectedInvoiceOrder?.id || 'N/A'}`}
        size="lg"
      >
        {selectedInvoiceOrder && (
          <div className="space-y-4">
            {/* Order Info */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Order Information</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Order Number:</span>
                  <p className="font-semibold text-gray-900 dark:text-white">#{selectedInvoiceOrder.order_number || selectedInvoiceOrder.id}</p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Date:</span>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {selectedInvoiceOrder.createdAt ? new Date(selectedInvoiceOrder.createdAt).toLocaleDateString('en-US', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    }) : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Status:</span>
                  <p className="font-semibold text-gray-900 dark:text-white capitalize">{selectedInvoiceOrder.status}</p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Total Amount:</span>
                  <p className="font-semibold text-gray-900 dark:text-white">₹{(selectedInvoiceOrder.total || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Customer Information</h3>
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-gray-900 dark:text-white">{selectedInvoiceOrder.customerName}</p>
                <p className="text-gray-600 dark:text-gray-400">{selectedInvoiceOrder.customerEmail}</p>
                <p className="text-gray-600 dark:text-gray-400">{selectedInvoiceOrder.customerPhone}</p>
                <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Delivery Address:</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{formatAddress(selectedInvoiceOrder.deliveryAddress)}</p>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Order Items</h3>
              <div className="space-y-3">
                {selectedInvoiceOrder.items && selectedInvoiceOrder.items.length > 0 ? (
                  selectedInvoiceOrder.items.map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{item.productName}</p>
                        {item.flavor_name && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Flavor: {item.flavor_name}</p>
                        )}
                        {item.variant_name && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">Variant: {item.variant_name}</p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">₹{(item.total || item.price * item.quantity || 0).toFixed(2)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">₹{(item.price || 0).toFixed(2)} each</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No items found</p>
                )}
              </div>
              <div className="mt-4 pt-4 border-t-2 border-gray-300 dark:border-gray-600">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">Total:</span>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">₹{(selectedInvoiceOrder.total || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowInvoiceModal(false);
                  setSelectedInvoiceOrder(null);
                }}
              >
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => handleDownloadInvoice(selectedInvoiceOrder.order_number || selectedInvoiceOrder.orderId || selectedInvoiceOrder.id, selectedInvoiceOrder.id)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export const Orders = React.memo(OrdersComponent);

