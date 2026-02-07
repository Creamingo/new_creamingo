import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Truck, 
  MapPin, 
  Phone, 
  Camera, 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  Navigation,
  User,
  Package,
  AlertCircle,
  Search,
  Filter,
  ChevronDown,
  ArrowUpDown,
  ExternalLink,
  Eye,
  IndianRupee,
  Loader2,
  ChevronRight,
  ChevronUp,
  X,
  MessageSquare,
  Zap,
  Target,
  UserPlus,
  Users,
  History,
  CheckSquare,
  ArrowRightLeft,
  BarChart3,
  AlertTriangle,
  Gift,
  Trophy,
  Cake,
  ZoomIn,
  ZoomOut,
  Maximize2,
  LifeBuoy,
  Mail,
  Shield
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../contexts/AuthContext';
import { useToastContext } from '../contexts/ToastContext';
import { resolveImageUrl } from '../utils/imageUrl';
import orderService, { Order } from '../services/orderService';
import { deliveryService } from '../services/deliveryService';
import productService from '../services/productService';
import dealService, { Deal } from '../services/dealService';
import deliveryWalletService, { DeliveryWalletSummary, DeliveryWalletTransaction } from '../services/deliveryWalletService';
import deliveryTargetTierService, { DailyProgress } from '../services/deliveryTargetTierService';

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

// Helper function to format date/time in IST (Indian Standard Time)
const formatISTDateTime = (dateString: string | Date, options?: {
  includeTime?: boolean;
  includeDate?: boolean;
  format?: 'short' | 'medium' | 'long' | 'full';
}): string => {
  try {
    let date: Date;
    
    if (typeof dateString === 'string') {
      // Handle SQLite datetime strings (format: "YYYY-MM-DD HH:MM:SS")
      // SQLite stores timestamps in UTC, so we need to treat them as UTC
      let dateStr = dateString.trim();
      
      // Check if it's SQLite format: "YYYY-MM-DD HH:MM:SS" or "YYYY-MM-DD HH:MM:SS.SSS" (has space, no T, no Z, no timezone)
      const sqliteFormatRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?$/;
      if (sqliteFormatRegex.test(dateStr)) {
        // Convert SQLite format to ISO format with Z (UTC indicator)
        // SQLite stores timestamps in UTC, so we explicitly mark it as UTC
        dateStr = dateStr.replace(' ', 'T') + 'Z';
      } else if (dateStr.includes('T') && !dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.match(/[+-]\d{2}:?\d{2}$/)) {
        // ISO format without timezone - assume UTC
        dateStr += 'Z';
      }
      
      date = new Date(dateStr);
    } else {
      date = dateString;
    }
    
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateString);
      return 'Invalid Date';
    }
    
    const { includeTime = true, includeDate = true } = options || {};
    
    const dateTimeOptions: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Kolkata', // IST timezone (UTC+5:30)
      ...(includeDate && {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      ...(includeTime && {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    };
    
    return date.toLocaleString('en-IN', dateTimeOptions);
  } catch (error) {
    console.error('Error formatting IST date:', error, dateString);
    return 'Invalid Date';
  }
};

// Helper function to format date in IST
const formatISTDate = (dateString: string | Date): string => {
  return formatISTDateTime(dateString, { includeTime: false, includeDate: true });
};

// Helper function to format time in IST
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const formatISTTime = (dateString: string | Date): string => {
  return formatISTDateTime(dateString, { includeTime: true, includeDate: false });
};

// Helper function to parse date string as UTC (for time calculations)
// This ensures SQLite timestamps (which are UTC) are correctly parsed
const parseAsUTC = (dateString: string | Date): Date => {
  if (typeof dateString === 'string') {
    let dateStr = dateString.trim();
    
    // Check if it's SQLite format: "YYYY-MM-DD HH:MM:SS" or "YYYY-MM-DD HH:MM:SS.SSS"
    const sqliteFormatRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?$/;
    if (sqliteFormatRegex.test(dateStr)) {
      // Convert SQLite format to ISO format with Z (UTC indicator)
      dateStr = dateStr.replace(' ', 'T') + 'Z';
    } else if (dateStr.includes('T') && !dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.match(/[+-]\d{2}:?\d{2}$/)) {
      // ISO format without timezone - assume UTC
      dateStr += 'Z';
    }
    
    return new Date(dateStr);
  }
  return dateString;
};

// Helper function to format delivery address
const formatAddress = (address: string | any): string => {
  if (!address) return 'N/A';
  
  if (typeof address === 'string' && !address.startsWith('{')) {
    return address;
  }

  try {
    let addressObj: any;
    if (typeof address === 'string') {
      addressObj = JSON.parse(address);
    } else {
      addressObj = address;
    }

    const parts: string[] = [];
    if (addressObj.street) parts.push(addressObj.street);
    if (addressObj.landmark) parts.push(`Near ${addressObj.landmark}`);
    if (addressObj.city) parts.push(addressObj.city);
    if (addressObj.state) parts.push(addressObj.state);
    if (addressObj.zip_code) parts.push(addressObj.zip_code);
    if (addressObj.country) parts.push(addressObj.country);

    return parts.length > 0 ? parts.join(', ') : 'N/A';
  } catch {
    return typeof address === 'string' ? address : 'N/A';
  }
};

// Map Order status to Delivery status
const mapOrderStatusToDeliveryStatus = (status: Order['status']): 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'delayed' => {
  switch (status) {
    case 'ready':
      return 'assigned';
    case 'preparing':
      return 'picked_up';
    case 'confirmed':
      return 'in_transit';
    case 'delivered':
      return 'delivered';
    case 'cancelled':
      return 'delayed'; // Treat cancelled as delayed/failed
    default:
      return 'assigned';
  }
};

// Calculate distance between two coordinates (Haversine formula)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

// Estimate delivery time based on distance
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const estimateDeliveryTime = (distance: number): number => {
  // Assuming average speed of 20 km/h in city traffic
  const avgSpeed = 20; // km/h
  const timeInHours = distance / avgSpeed;
  return Math.ceil(timeInHours * 60); // Return in minutes
};

// Zomato/Swiggy-style Delivery Card Component
interface DeliveryCardProps {
  order: Order;
  onView: (order: Order) => void;
  onStatusUpdate: (orderId: string, deliveryStatus: 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'delayed') => void;
  onCall: (phone: string) => void;
  onNavigate: (order: Order) => void;
  onTakePhoto: (orderId: string) => void;
  onAssign?: (order: Order) => void;
  onReassign?: (order: Order) => void;
  onViewHistory?: (order: Order) => void;
  actionLoading: string | null;
  getStatusBadge: (order: Order) => React.ReactElement;
  getStatusProgress: (order: Order, assignmentInfo?: DeliveryCardProps['assignmentInfo']) => React.ReactElement;
  currentLocation: { lat: number; lng: number } | null;
  isExpanded?: boolean;
  rank?: number; // Rank number when sorted by priority
  showRank?: boolean; // Whether to show rank number
  onToggleExpand?: (orderId: string) => void;
  assignmentInfo?: {
    deliveryBoyId: number;
    deliveryBoyName: string;
    deliveryStatus: string;
    assignedAt: string;
  } | null;
  canAssign?: boolean;
  isAdminView?: boolean; // New prop to distinguish admin vs delivery boy view
  productImagesCache?: Record<string, string>;
  fetchProductImage?: (productId: string) => Promise<string | null>;
  isDealItemForDisplay?: (item: any) => boolean;
  // Image modal functions
  openImageModal?: (imageUrl: string, productName: string) => void;
  getProductImage?: (item: any) => string | null;
  getFlavorText?: (item: any) => string;
  expandedDealItems?: Set<string>;
  toggleDealItems?: (orderId: string) => void;
}

interface RiderOrderDetailSheetProps {
  order: Order;
  onClose: () => void;
  onCall: (phone: string) => void;
  onOpenMaps: () => void;
  isDealItemForDisplay?: (item: any) => boolean;
}

// Bottom-sheet style order detail view for delivery boys
const RiderOrderDetailSheet: React.FC<RiderOrderDetailSheetProps> = ({
  order,
  onClose,
  onCall,
  onOpenMaps,
  isDealItemForDisplay
}) => {
  const deliveryStatus = mapOrderStatusToDeliveryStatus(order.status);
  const address = formatAddress(order.deliveryAddress);
  const deliveryDate = order.deliveryDate ? formatISTDate(order.deliveryDate) : 'N/A';

  const items: any[] = Array.isArray((order as any).items) ? (order as any).items : [];
  const mainItems: any[] = [];
  const dealItems: any[] = [];

  const isDealOrAddonItem = (item: any): boolean => {
    if (!item || typeof item === 'string') return false;
    if (isDealItemForDisplay) return isDealItemForDisplay(item);
    const name = (item.productName || item.product_name || '').toString().toLowerCase();
    const flags = [item.isDeal, item.is_deal, item.dealType, item.isAddon, item.is_addon];
    const looksLikeDealName = name.includes('deal') || name.includes('combo') || name.includes('add-on') || name.includes('addon');
    return flags.some(Boolean) || looksLikeDealName;
  };

  items.forEach((item) => {
    if (isDealOrAddonItem(item)) {
      dealItems.push(item);
    } else {
      mainItems.push(item);
    }
  });

  const subtotal =
    (order as any).subtotal_after_wallet ??
    (order as any).subtotal_after_promo ??
    (order as any).subtotal ??
    (order as any).subtotal_after_discounts ??
    (order as any).total ??
    0;

  const deliveryCharge =
    (order as any).final_delivery_charge ??
    (order as any).delivery_charge ??
    0;

  const promoDiscount = (order as any).promo_discount ?? 0;
  const cashback = (order as any).cashback_amount ?? 0;

  const total =
    (order as any).total ??
    (order as any).total_amount ??
    subtotal + deliveryCharge - promoDiscount - cashback;

  const createdAtLabel = order.createdAt
    ? formatISTDateTime(order.createdAt, { includeDate: true, includeTime: true })
    : null;
  const deliveredAtRaw = (order as any).deliveredAt;
  const deliveredAtLabel = deliveredAtRaw
    ? formatISTDateTime(deliveredAtRaw, { includeDate: true, includeTime: true })
    : null;

  const statusLabel =
    deliveryStatus === 'assigned'
      ? 'Ready for Delivery'
      : deliveryStatus === 'picked_up'
      ? 'Picked Up'
      : deliveryStatus === 'in_transit'
      ? 'Out for Delivery'
      : deliveryStatus === 'delivered'
      ? 'Delivered'
      : 'Delayed';

  return (
    <div className="space-y-4">
      {/* Header with status and customer */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              {statusLabel}
            </span>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Order #{order.order_number || order.id}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {deliveryDate} • {order.deliveryTime || 'N/A'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Total
            </p>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
              ₹{(total || 0).toFixed(0)}
            </p>
            <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
              {order.paymentStatus === 'paid' ? 'Prepaid' : 'Cash on Delivery'}
            </p>
          </div>
        </div>

        {/* Address & actions */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60 p-3 space-y-2">
          <div className="flex items-start gap-2">
            <div className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded-md flex-shrink-0">
              <MapPin className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Delivery Address
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white leading-snug">
                {address}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {order.customerName} • {order.customerPhone}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Button
              onClick={onOpenMaps}
              className="flex-1 h-9 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center justify-center"
            >
              <Navigation className="h-4 w-4 mr-1.5" />
              Navigate
            </Button>
            <Button
              onClick={() => onCall(order.customerPhone)}
              variant="secondary"
              className="flex-1 h-9 text-xs font-semibold"
            >
              <Phone className="h-4 w-4 mr-1.5" />
              Call
            </Button>
          </div>
        </div>
      </div>

      {/* Items section */}
      {items.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                Items
              </span>
            </div>
            <span className="text-[11px] text-gray-500 dark:text-gray-400">
              {items.length} item{items.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Main items with larger images */}
          {mainItems.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                Main Items
              </p>
              <div className="space-y-2">
                {mainItems.map((item, index) => {
                  const name = item.productName || item.product_name || 'Item';
                  const quantity = item.quantity || 1;
                  const productImage = item.product_image || item.image_url || null;
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2.5"
                    >
                      <div className="w-14 h-14 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                        {productImage ? (
                          <img
                            src={resolveImageUrl(productImage)}
                            alt={name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                            {name.substring(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white line-clamp-2">
                          {name}
                        </p>
                        <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                          Qty: <span className="font-semibold">{quantity}</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Deal / combo items */}
          {dealItems.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-200 uppercase tracking-wide flex items-center gap-1">
                <Gift className="h-3.5 w-3.5" />
                Deal / Combo Items
              </p>
              <div className="space-y-1.5 rounded-lg border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-2">
                {dealItems.map((item, index) => {
                  const name = item.productName || item.product_name || 'Item';
                  const quantity = item.quantity || 1;
                  return (
                    <div key={index} className="flex items-center justify-between text-[11px]">
                      <span className="text-amber-900 dark:text-amber-50 truncate">
                        • {name}
                      </span>
                      <span className="font-semibold text-amber-900 dark:text-amber-50 ml-2">
                        ×{quantity}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bill breakdown */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60 p-3 space-y-1.5">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
          Bill Details
        </p>
        <div className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
          <div className="flex items-center justify-between">
            <span>Subtotal</span>
            <span>₹{Number(subtotal || 0).toFixed(0)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Delivery Charge</span>
            <span>₹{Number(deliveryCharge || 0).toFixed(0)}</span>
          </div>
          {(promoDiscount || cashback) ? (
            <>
              {promoDiscount ? (
                <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300">
                  <span>Promo Discount</span>
                  <span>-₹{Number(promoDiscount).toFixed(0)}</span>
                </div>
              ) : null}
              {cashback ? (
                <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300">
                  <span>Cashback</span>
                  <span>-₹{Number(cashback).toFixed(0)}</span>
                </div>
              ) : null}
            </>
          ) : null}
          <div className="border-t border-dashed border-gray-300 dark:border-gray-700 my-1.5" />
          <div className="flex items-center justify-between text-sm font-bold text-gray-900 dark:text-white">
            <span>Total</span>
            <span>₹{Number(total || 0).toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* Timeline (simple) */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 space-y-1.5">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
          Timeline
        </p>
        <div className="space-y-1 text-[11px] text-gray-700 dark:text-gray-300">
          {createdAtLabel && (
            <div className="flex items-start gap-2">
              <Clock className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400 mt-0.5" />
              <div>
                <p className="font-semibold">Assigned</p>
                <p>{createdAtLabel}</p>
              </div>
            </div>
          )}
          {deliveredAtLabel && (
            <div className="flex items-start gap-2">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <div>
                <p className="font-semibold">Delivered</p>
                <p>{deliveredAtLabel}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Report issue */}
      <div className="rounded-xl border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-3 space-y-2">
        <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 uppercase tracking-wide">
          Report an Issue
        </p>
        <p className="text-[11px] text-amber-900 dark:text-amber-100">
          If you are facing a problem with this delivery, choose an option below so the support team can assist you.
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <Button
            variant="secondary"
            size="sm"
            className="h-8 text-[11px]"
            onClick={() => {
              console.log('Report issue: Wrong address', order.id);
              alert('Issue reported: Wrong address');
            }}
          >
            Wrong address
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="h-8 text-[11px]"
            onClick={() => {
              console.log('Report issue: Customer unreachable', order.id);
              alert('Issue reported: Customer unreachable');
            }}
          >
            Customer unreachable
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="h-8 text-[11px]"
            onClick={() => {
              console.log('Report issue: Return to store', order.id);
              alert('Issue reported: Return to store');
            }}
          >
            Return to store
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="h-8 text-[11px]"
            onClick={() => {
              console.log('Report issue: Other', order.id);
              alert('Issue reported: Other');
            }}
          >
            Other
          </Button>
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="ghost" onClick={onClose} className="text-xs">
          Close
        </Button>
      </div>
    </div>
  );
};

const DeliveryCard: React.FC<DeliveryCardProps> = ({
  order,
  onView,
  onStatusUpdate,
  onCall,
  onNavigate,
  onTakePhoto,
  onAssign,
  onReassign,
  onViewHistory,
  actionLoading,
  getStatusBadge,
  getStatusProgress,
  currentLocation,
  isExpanded = false,
  onToggleExpand,
  assignmentInfo,
  canAssign = false,
  isAdminView = false,
  productImagesCache = {},
  fetchProductImage,
  rank,
  showRank = false,
  isDealItemForDisplay,
  openImageModal,
  getProductImage,
  getFlavorText,
  expandedDealItems = new Set(),
  toggleDealItems
}) => {
  const deliveryStatus = mapOrderStatusToDeliveryStatus(order.status);
  const address = formatAddress(order.deliveryAddress);
  const deliveryDate = order.deliveryDate ? formatISTDate(order.deliveryDate) : 'N/A';
  
  // State for expanded items section (only for admin view)
  const [itemsExpanded, setItemsExpanded] = useState(false);
  
  // Header color based on order progress status
  const getHeaderColor = (status: Order['status']): string => {
    switch (status) {
      case 'pending':
        return 'bg-gradient-to-r from-green-500 to-green-600';      // Green - Pending
      case 'confirmed':
        return 'bg-gradient-to-r from-blue-500 to-blue-600';         // Blue - Confirmed
      case 'preparing':
        return 'bg-gradient-to-r from-amber-500 to-amber-600';       // Golden - Preparing
      case 'ready':
        return 'bg-gradient-to-r from-purple-500 to-purple-600';     // Purple - Ready for delivery
      case 'delivered':
        return 'bg-gradient-to-r from-emerald-600 to-emerald-700';   // Emerald - Delivered
      case 'cancelled':
        return 'bg-gradient-to-r from-red-600 to-red-700';           // Red - Cancelled
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600';         // Gray - Default fallback
    }
  };
  
  // Calculate urgency level for admin view
  const getUrgencyLevel = (): 'critical' | 'urgent' | 'normal' | null => {
    if (!isAdminView) return null;
    
    const isAssigned = !!assignmentInfo;
    const now = Date.now();
    
    // Critical: Unassigned for more than 1 hour
    if (!isAssigned && deliveryStatus === 'assigned') {
      try {
        const orderCreatedAt = parseAsUTC(order.createdAt).getTime();
        const ageInHours = (now - orderCreatedAt) / (1000 * 60 * 60);
        if (ageInHours > 1) return 'critical';
        if (ageInHours > 0.5) return 'urgent';
      } catch {}
    }
    
    // Critical: Delivery time passed
    if (order.deliveryDate && order.deliveryTime) {
      try {
        const deliveryDateStr = order.deliveryDate;
        const [timePart] = order.deliveryTime.split(' - ');
        const [hours, minutes] = timePart.includes(':') 
          ? timePart.split(':').map(Number)
          : [12, 0];
        
        const deliveryDateTime = new Date(deliveryDateStr);
        deliveryDateTime.setHours(hours, minutes || 0, 0, 0);
        const deliveryTime = parseAsUTC(deliveryDateTime.toISOString()).getTime();
        
        if (deliveryTime < now) return 'critical';
        if ((deliveryTime - now) / (1000 * 60 * 60) <= 2) return 'urgent';
      } catch {}
    }
    
    // Urgent: Assigned but not picked up for more than 30 minutes
    if (isAssigned && deliveryStatus === 'assigned' && assignmentInfo?.assignedAt) {
      try {
        const assignedTime = parseAsUTC(assignmentInfo.assignedAt).getTime();
        const ageInMinutes = (now - assignedTime) / (1000 * 60);
        if (ageInMinutes > 30) return 'urgent';
      } catch {}
    }
    
    return null;
  };
  
  const urgencyLevel = getUrgencyLevel();
  
  // Get explicit priority from order
  const explicitPriority = (order as any).priority || 'medium';
  
  // Get priority badge color
  const getPriorityBadgeColor = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700';
      case 'low':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700';
      default:
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700';
    }
  };
  
  // Calculate time in current stage (for admin view) in Day · Hour · Minute format
  const getTimeInStage = () => {
    if (!assignmentInfo?.assignedAt) return null;
    try {
      // Parse assignedAt as UTC to ensure correct time calculation
      const assignedTime = parseAsUTC(assignmentInfo.assignedAt).getTime();
      const now = Date.now();
      const diffMs = now - assignedTime;
      if (diffMs < 0) return null; // Invalid time

      const totalMinutes = Math.floor(diffMs / (1000 * 60));
      const days = Math.floor(totalMinutes / (60 * 24));
      const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
      const minutes = totalMinutes % 60;

      const parts: string[] = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0) parts.push(`${hours}h`);
      // Always show minutes so very recent assignments aren't blank
      if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);

      return parts.join(' · ');
    } catch (error) {
      console.error('Error calculating time in stage:', error, assignmentInfo?.assignedAt);
      return null;
    }
  };
  
  const timeInStage = getTimeInStage();
  
  // Calculate distance if coordinates are available
  let distance: number | null = null;
  let estimatedTime: number | null = null;
  
  if (currentLocation && order.deliveryAddress) {
    // Try to extract coordinates from address or use a geocoding service
    // For now, we'll show a placeholder. In production, you'd geocode the address
    // or store coordinates with the order
    distance = null; // Will be calculated if coordinates are available
  }

  // Status color coding (left border) – neutral card background for a cleaner, CRM-style layout
  // Enhanced with priority and urgency indicators
  const getStatusColor = () => {
    // Priority-based border colors (for admin view)
    if (isAdminView) {
      // Critical urgency overrides everything - red border
      if (urgencyLevel === 'critical') {
        return 'border-l-4 border-red-600 bg-white dark:bg-gray-900 shadow-md shadow-red-500/20';
      }
      // Urgent urgency - orange border
      if (urgencyLevel === 'urgent') {
        return 'border-l-4 border-orange-500 bg-white dark:bg-gray-900 shadow-sm shadow-orange-500/10';
      }
      // High priority - red border (lighter than critical)
      if (explicitPriority === 'high') {
        return 'border-l-4 border-red-500 bg-white dark:bg-gray-900';
      }
      // Low priority - green border
      if (explicitPriority === 'low') {
        return 'border-l-4 border-green-500 bg-white dark:bg-gray-900';
      }
    }
    
    // Default status-based colors
    const statusColors = {
      assigned: 'border-l-4 border-blue-500 bg-white dark:bg-gray-900',
      picked_up: 'border-l-4 border-amber-500 bg-white dark:bg-gray-900',
      in_transit: 'border-l-4 border-purple-500 bg-white dark:bg-gray-900',
      delivered: 'border-l-4 border-green-500 bg-white dark:bg-gray-900',
      delayed: 'border-l-4 border-red-500 bg-white dark:bg-gray-900'
    };
    
    return statusColors[deliveryStatus] || statusColors.assigned;
  };

  const statusColor = getStatusColor();

  // Get primary action button based on status (only for delivery boys)
  const getPrimaryAction = () => {
    if (isAdminView) return null; // No operational buttons for admin
    const isLoading = actionLoading === order.id;
    
    switch (deliveryStatus) {
      case 'assigned':
        return (
          <Button
            onClick={() => onStatusUpdate(order.id, 'picked_up')}
            disabled={isLoading}
            className="w-full h-10 md:h-9 text-sm font-bold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-200 rounded-lg"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Package className="h-4 w-4 md:h-3.5 md:w-3.5 mr-2 md:mr-1.5" />
                Pick Up Order
              </>
            )}
          </Button>
        );
      case 'picked_up':
        return (
          <Button
            onClick={async () => {
              await onStatusUpdate(order.id, 'in_transit');
              // Optional: prompt to open maps after starting delivery
              if (window && window.confirm('Start navigation to the customer in maps?')) {
                const encodedAddress = encodeURIComponent(address);
                window.open(`https://maps.google.com/?q=${encodedAddress}`, '_blank');
              }
            }}
            disabled={isLoading}
            className="w-full h-10 md:h-9 text-sm font-bold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-md hover:shadow-lg transition-all duration-200 rounded-lg"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Truck className="h-4 w-4 md:h-3.5 md:w-3.5 mr-2 md:mr-1.5" />
                Start Delivery
              </>
            )}
          </Button>
        );
      case 'in_transit':
        return (
          <Button
            onClick={() => {
              // For delivered status, we need photo capture
              onTakePhoto(order.id);
            }}
            disabled={isLoading}
            className="w-full h-10 md:h-9 text-sm font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-md hover:shadow-lg transition-all duration-200 rounded-lg"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <CheckCircle className="h-4 w-4 md:h-3.5 md:w-3.5 mr-2 md:mr-1.5" />
                Complete Delivery
              </>
            )}
          </Button>
        );
      default:
        return null;
    }
  };

  // Helper to identify deal / add-on items so we can show main items first
  const isDealOrAddonItem = (item: any): boolean => {
    if (!item || typeof item === 'string') return false;

    // Prefer enhanced classifier from parent (uses active deal configurations)
    if (isDealItemForDisplay) {
      return isDealItemForDisplay(item);
    }
    
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

  // Admin View - Compact Management-Focused Design (inspired by CRM-style cards)
  if (isAdminView) {
    return (
      <Card className={`${statusColor} rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200/60 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600`}>
        {/* Compact Status Header */}
        <div className={`px-4 sm:px-5 py-1.5 flex items-center justify-between gap-2.5 border-b border-white/20 backdrop-blur-sm shadow-lg ${getHeaderColor(order.status)}`}>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap flex-1 min-w-0">
            {/* Rank Number - Show when sorted by priority */}
            {showRank && rank !== undefined && (
              <div className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/20 dark:bg-white/10 border-2 border-white/40 text-white font-bold text-xs sm:text-sm shadow-md">
                {rank}
              </div>
            )}
            
            {/* Primary status pill */}
            {getStatusBadge(order)}
            
            {/* Order number - enhanced styling */}
            <span className="text-xs sm:text-sm font-bold text-white tracking-wide px-1.5 py-0.5 bg-white/10 rounded-md backdrop-blur-sm border border-white/20">
              #{order.order_number || order.id}
            </span>
            
            {/* Priority Badge - Always visible for admin view */}
            {isAdminView && (
              <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 flex-shrink-0 whitespace-nowrap shadow-sm ${getPriorityBadgeColor(explicitPriority)}`}>
                <Target className="h-2.5 w-2.5 flex-shrink-0" />
                <span className="uppercase tracking-wide">{explicitPriority}</span>
              </span>
            )}
            
            {/* Urgency Indicators */}
            {urgencyLevel === 'critical' && (
              <span className="text-white text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 bg-red-500/95 rounded-md animate-pulse flex items-center gap-1 flex-shrink-0 whitespace-nowrap shadow-sm border border-red-400/50">
                <AlertTriangle className="h-2.5 w-2.5 flex-shrink-0" />
                <span>Critical</span>
              </span>
            )}
            {urgencyLevel === 'urgent' && (
              <span className="text-white text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 bg-orange-500/95 rounded-md flex items-center gap-1 flex-shrink-0 whitespace-nowrap shadow-sm border border-orange-400/50">
                <AlertCircle className="h-2.5 w-2.5 flex-shrink-0" />
                <span>Urgent</span>
              </span>
            )}
            {!assignmentInfo && deliveryStatus === 'assigned' && (
              <span className="text-white text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 bg-amber-500/95 rounded-md flex-shrink-0 shadow-sm border border-amber-400/50">
                <span className="inline">Unassigned</span>
              </span>
            )}
            {timeInStage && deliveryStatus === 'picked_up' && (
              <span className="text-[10px] sm:text-[11px] text-white/95 flex items-center gap-1 px-1.5 py-0.5 bg-white/10 rounded-md backdrop-blur-sm border border-white/20">
                <Clock className="h-2.5 w-2.5 flex-shrink-0" />
                <span className="font-medium">Picked {timeInStage} ago</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="hidden sm:inline-flex items-center rounded-lg bg-white/15 backdrop-blur-sm px-2 py-1 text-[10px] font-semibold text-white gap-1 border border-white/20 shadow-sm">
              <Package className="h-3 w-3 opacity-90" />
              <span className="opacity-90">Items</span>
              <span className="font-bold text-white">
                {(() => {
                  const orderWithCount = order as Order & { itemsCount?: number };
                  const count = orderWithCount.itemsCount !== undefined && orderWithCount.itemsCount !== null && orderWithCount.itemsCount > 0
                    ? orderWithCount.itemsCount
                    : (order.items?.length || 0);
                  return `${count}`;
                })()}
              </span>
            </span>
            <span className="text-white font-bold text-base sm:text-lg tracking-tight drop-shadow-sm">
              ₹{(order.total || 0).toFixed(0)}
            </span>
            {/* Header action icons: call, history, view - enhanced styling */}
            <div className="hidden sm:flex items-center gap-1 ml-1">
              <button
                type="button"
                onClick={() => onCall(order.customerPhone)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 text-white transition-all duration-200 shadow-sm hover:shadow-md border border-white/20 backdrop-blur-sm"
                title={`Call ${order.customerName}`}
              >
                <Phone className="h-3.5 w-3.5" />
              </button>
              {canAssign && onViewHistory && assignmentInfo && (
                <button
                  type="button"
                  onClick={() => onViewHistory(order)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 text-white transition-all duration-200 shadow-sm hover:shadow-md border border-white/20 backdrop-blur-sm"
                  title="View assignment history"
                >
                  <History className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => onView(order)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 text-white transition-all duration-200 shadow-sm hover:shadow-md border border-white/20 backdrop-blur-sm"
                title="View details"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        <CardContent className="pt-3 pb-4 px-3 sm:px-4 bg-gradient-to-b from-white to-gray-50/30 dark:from-gray-950 dark:to-gray-900/50">
          {/* Compact Status Progress - inline green rail similar to CRM screenshot */}
          <div className="mb-2.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-200/70 dark:border-gray-800/70 px-2.5 py-1.5 shadow-xs">
            {getStatusProgress(order, assignmentInfo)}
          </div>

          {/* Compact Info Grid */}
          <div className="space-y-3">
            {/* Order Items Section - Always Visible on Desktop, Expandable on Mobile (Moved to Top) */}
            {order.items && order.items.length > 0 && (
              <div className="border-b border-gray-200/80 dark:border-gray-700/80 pb-2.5">
                {(() => {
                  // Re-order items: main items first, then deal/add-on items
                  const sortedItems = [...order.items].sort((a: any, b: any) => {
                    const aDeal = isDealOrAddonItem(a) ? 1 : 0;
                    const bDeal = isDealOrAddonItem(b) ? 1 : 0;
                    return aDeal - bDeal;
                  });
                  // Store sorted items on a temporary property for this render scope
                  (order as any).__sortedItems = sortedItems;
                  return null;
                })()}
                {/* Desktop: Always show items */}
                <div className="hidden md:block">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                      <Package className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      Items
                    </p>
                    <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-300">
                      {(() => {
                        const orderWithCount = order as Order & { itemsCount?: number };
                        const count = orderWithCount.itemsCount !== undefined && orderWithCount.itemsCount !== null && orderWithCount.itemsCount > 0
                          ? orderWithCount.itemsCount
                          : (order.items?.length || 0);
                        return `(${count} item${count !== 1 ? 's' : ''})`;
                      })()}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                    {((order as any).__sortedItems || order.items).map((item: any, index: number) => {
                      // Handle both string format ("Product x2 (500g)") and object format
                      const isString = typeof item === 'string';
                      const itemName = isString 
                        ? item 
                        : (item.productName || item.product_name || 'Unknown Product');
                      const itemQuantity = isString ? null : (item.quantity || 1);
                      
                      // Get weight from multiple possible sources
                      // Priority: variant_weight > weight (direct field) > product_base_weight > base_weight > others
                      let itemWeight = null;
                      if (!isString) {
                        // Extract all possible weight fields
                        const variantWeight = item.variant_weight;
                        const weight = item.weight; // Direct weight field (from orderService.getOrders)
                        const productBaseWeight = item.product_base_weight;
                        const baseWeight = item.base_weight;
                        const weightInGrams = item.weightInGrams;
                        const productWeight = item.productWeight;
                        
                        // Priority order: variant_weight (for variants) > weight (direct) > product_base_weight > base_weight > others
                        itemWeight = variantWeight || weight || productBaseWeight || baseWeight || weightInGrams || productWeight || null;
                        
                        // If itemWeight is an empty string, treat it as null
                        if (itemWeight === '' || itemWeight === 'null' || itemWeight === 'undefined') {
                          itemWeight = null;
                        }
                        
                        // Debug: Always log for first item to see what we're getting
                        if (index === 0) {
                          const debugProductId = isString ? null : (item.productId || item.product_id);
                          console.log('[Delivery Desktop] Weight detection for first item:', {
                            productName: itemName,
                            productId: debugProductId,
                            variant_weight: variantWeight,
                            weight: weight,
                            product_base_weight: productBaseWeight,
                            base_weight: baseWeight,
                            weightInGrams: weightInGrams,
                            productWeight: productWeight,
                            finalItemWeight: itemWeight,
                            itemObject: item
                          });
                        }
                        
                        // Format weight based on type
                        if (itemWeight) {
                          if (typeof itemWeight === 'number') {
                            // Numeric weight (from variant_weight) - format as grams or kg
                            itemWeight = itemWeight >= 1000 ? `${(itemWeight / 1000).toFixed(1)}kg` : `${itemWeight}g`;
                          } else if (typeof itemWeight === 'string') {
                            // String weight (from base_weight like "500g" or "1 kg") - use as-is after trimming
                            itemWeight = itemWeight.trim();
                            // If after trimming it's empty, set to null
                            if (itemWeight === '') {
                              itemWeight = null;
                            }
                          }
                        }
                      }
                      
                      const itemPriceEach = isString ? null : (parseFloat(item.price || 0));
                      const itemPriceTotal = isString ? null : (itemPriceEach !== null ? itemPriceEach * (itemQuantity || 1) : null);
                      const productId = isString ? null : (item.productId || item.product_id);
                      
                      // Identify deal/add-on items for styling
                      const isDealItem = !isString && isDealOrAddonItem(item);

                      // Try to get product image from multiple possible sources
                      // Backend returns 'product_image' field, so check that first
                      let productImage = null;
                      if (!isString) {
                        // Check all possible field names, prioritizing product_image (from backend)
                        productImage = item.product_image || item.image_url || item.imageUrl || item.productImage || item.image || null;
                        
                        // If no image found in direct fields and we have a productId, check cache
                        // Don't trigger fetch during render - images are fetched in batch via fetchMissingProductImages
                        if (!productImage && productId) {
                          // Check cache first (may have been fetched previously)
                          productImage = productImagesCache[productId] || null;
                        }
                        
                        // Debug: Log item structure to see what fields are available (remove in production)
                        if (!productImage && productId && index === 0) {
                          console.log('Item structure (first item):', {
                            productId,
                            product_image: item.product_image,
                            image_url: item.image_url,
                            cacheValue: productImagesCache[productId],
                            allKeys: Object.keys(item)
                          });
                        }
                      }
                      
                      return (
                        <div 
                          key={index} 
                          className={`flex flex-col justify-between h-full rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 ${
                            isDealItem
                              ? 'border-amber-200/80 dark:border-amber-600/80 bg-amber-50/60 dark:bg-amber-900/30'
                              : index === 0
                              ? 'border-blue-300 dark:border-blue-600 bg-white dark:bg-gray-900/90 shadow-md ring-1 ring-blue-200/50 dark:ring-blue-700/30'
                              : 'border-gray-200/80 dark:border-gray-700/80 bg-white dark:bg-gray-900/90 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <div className="flex items-center gap-2 p-2 pb-1.5">
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center border border-gray-300/50 dark:border-gray-600/50 shadow-sm">
                            {productImage ? (
                              <img 
                                src={resolveImageUrl(productImage)} 
                                alt={itemName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Hide image and show text placeholder on error
                                  const imgElement = e.target as HTMLImageElement;
                                  imgElement.style.display = 'none';
                                  const parent = imgElement.parentElement;
                                  if (parent && !parent.querySelector('.text-placeholder')) {
                                    const placeholder = document.createElement('div');
                                    placeholder.className = 'text-placeholder w-full h-full flex items-center justify-center bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 text-xs font-bold';
                                    placeholder.textContent = itemName.substring(0, 2).toUpperCase();
                                    parent.appendChild(placeholder);
                                  }
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 text-xs font-bold">
                                {itemName.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-[12px] font-semibold text-gray-900 dark:text-white break-words leading-tight line-clamp-2">
                                {itemName}
                              </p>
                              {isDealItem && (
                                <span className="ml-1 inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/70 px-1.5 py-0.5 text-[9px] font-semibold text-amber-800 dark:text-amber-50 border border-amber-200 dark:border-amber-700">
                                  Deal
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-500 dark:text-gray-400 flex-wrap">
                              {itemWeight && (
                                <span className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-[9px] font-medium">{itemWeight}</span>
                              )}
                              {/* Clear quantity indicator for main items (text-only, no pill) */}
                              {!isDealItem && itemQuantity && itemQuantity > 1 && (
                                <span className="font-semibold text-blue-700 dark:text-blue-300">
                                  ×{itemQuantity}
                                </span>
                              )}
                              {!isString && item.flavor_name && (
                                <span className="text-gray-400 dark:text-gray-500 text-[9px]">({item.flavor_name})</span>
                              )}
                            </div>
                          </div>
                          </div>
                          {itemPriceTotal !== null && itemPriceTotal > 0 && (
                            <div className="flex items-center justify-between px-2 pb-2 pt-1 border-t border-gray-100/80 dark:border-gray-800/80 bg-gray-50/50 dark:bg-gray-800/30 text-[10px] rounded-b-xl">
                              <span className="truncate text-gray-600 dark:text-gray-300 font-medium">
                                {itemPriceEach
                                  ? `₹${itemPriceEach.toFixed(0)} each${
                                      itemQuantity && itemQuantity > 1 ? ` × ${itemQuantity}` : ''
                                    }`
                                  : ''}
                              </span>
                              <span className="font-bold text-gray-900 dark:text-white">
                                ₹{itemPriceTotal.toFixed(0)}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Mobile: Expandable items */}
                <div className="md:hidden">
                  <button
                    onClick={() => setItemsExpanded(!itemsExpanded)}
                    className="w-full flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-md p-1.5 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <Package className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                      <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Items
                      </p>
                      <span className="text-xs font-semibold text-gray-900 dark:text-white">
                        {(() => {
                          const orderWithCount = order as Order & { itemsCount?: number };
                          const count = orderWithCount.itemsCount !== undefined && orderWithCount.itemsCount !== null && orderWithCount.itemsCount > 0
                            ? orderWithCount.itemsCount
                            : (order.items?.length || 0);
                          return `${count} item${count !== 1 ? 's' : ''}`;
                        })()}
                      </span>
                    </div>
                    {itemsExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5 text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300 transition-colors" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300 transition-colors" />
                    )}
                  </button>
                  
                  {itemsExpanded && (
                    <div className="mt-2 space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                      {order.items.map((item: any, index: number) => {
                        // Handle both string format ("Product x2 (500g)") and object format
                        const isString = typeof item === 'string';
                        const itemName = isString 
                          ? item 
                          : (item.productName || item.product_name || 'Unknown Product');
                        const itemQuantity = isString ? null : (item.quantity || 1);
                        
                        // Get weight from multiple possible sources
                        // Priority: variant_weight > weight (direct field) > product_base_weight > base_weight > others
                        let itemWeight = null;
                        if (!isString) {
                          // Extract all possible weight fields
                          const variantWeight = item.variant_weight;
                          const weight = item.weight; // Direct weight field (from orderService.getOrders)
                          const productBaseWeight = item.product_base_weight;
                          const baseWeight = item.base_weight;
                          const weightInGrams = item.weightInGrams;
                          const productWeight = item.productWeight;
                          
                          // Priority order: variant_weight (for variants) > weight (direct) > product_base_weight > base_weight > others
                          itemWeight = variantWeight || weight || productBaseWeight || baseWeight || weightInGrams || productWeight || null;
                          
                          // If itemWeight is an empty string, treat it as null
                          if (itemWeight === '' || itemWeight === 'null' || itemWeight === 'undefined') {
                            itemWeight = null;
                          }
                          
                          // Debug: Always log for first item to see what we're getting
                          if (index === 0) {
                            const debugProductId = isString ? null : (item.productId || item.product_id);
                            console.log('[Delivery Mobile] Weight detection for first item:', {
                              productName: itemName,
                              productId: debugProductId,
                              variant_weight: variantWeight,
                              weight: weight,
                              product_base_weight: productBaseWeight,
                              base_weight: baseWeight,
                              weightInGrams: weightInGrams,
                              productWeight: productWeight,
                              finalItemWeight: itemWeight,
                              itemObject: item
                            });
                          }
                          
                          // Format weight based on type
                          if (itemWeight) {
                            if (typeof itemWeight === 'number') {
                              // Numeric weight (from variant_weight) - format as grams or kg
                              itemWeight = itemWeight >= 1000 ? `${(itemWeight / 1000).toFixed(1)}kg` : `${itemWeight}g`;
                            } else if (typeof itemWeight === 'string') {
                              // String weight (from base_weight like "500g" or "1 kg") - use as-is after trimming
                              itemWeight = itemWeight.trim();
                              // If after trimming it's empty, set to null
                              if (itemWeight === '') {
                                itemWeight = null;
                              }
                            }
                          }
                        }
                        
                        const itemPrice = isString ? null : (item.price || 0);
                        const productId = isString ? null : (item.productId || item.product_id);
                        const isDealItem = !isString && isDealOrAddonItem(item);
                        
                        // Try to get product image from multiple possible sources
                        // Backend returns 'product_image' field, so check that first
                        let productImage = null;
                        if (!isString) {
                          // Check all possible field names, prioritizing product_image (from backend)
                          productImage = item.product_image || item.image_url || item.imageUrl || item.productImage || item.image || null;
                          
                          // If no image found and we have a productId, check cache
                          // Don't trigger fetch during render - images are fetched in batch via fetchMissingProductImages
                          if (!productImage && productId) {
                            // Check cache first (may have been fetched previously)
                            productImage = productImagesCache[productId] || null;
                          }
                        }
                        
                        return (
                          <div 
                            key={index} 
                            className="flex items-center gap-2 p-1.5 bg-gray-50 dark:bg-gray-800/50 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            <div className="flex-shrink-0 w-8 h-8 rounded-md overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              {productImage ? (
                                <img 
                                  src={resolveImageUrl(productImage)} 
                                  alt={itemName}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    // Hide image and show text placeholder on error
                                    const imgElement = e.target as HTMLImageElement;
                                    imgElement.style.display = 'none';
                                    const parent = imgElement.parentElement;
                                    if (parent && !parent.querySelector('.text-placeholder')) {
                                      const placeholder = document.createElement('div');
                                      placeholder.className = 'text-placeholder w-full h-full flex items-center justify-center bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 text-[10px] font-bold';
                                      placeholder.textContent = itemName.substring(0, 2).toUpperCase();
                                      parent.appendChild(placeholder);
                                    }
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 text-[10px] font-bold">
                                  {itemName.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                                {itemName}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 flex-wrap">
                                {itemWeight && (
                                  <span className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded font-medium">{itemWeight}</span>
                                )}
                                {/* Clear quantity indicator for main items (text-only, no pill) */}
                                {!isDealItem && itemQuantity && itemQuantity > 1 && (
                                  <span className="font-semibold text-blue-700 dark:text-blue-300">
                                    ×{itemQuantity}
                                  </span>
                                )}
                                {!isString && item.flavor_name && (
                                  <span className="text-gray-400 dark:text-gray-500">({item.flavor_name})</span>
                                )}
                                {itemPrice > 0 && (
                                  <span className="ml-auto font-semibold text-gray-800 dark:text-gray-100">
                                    ₹{itemPrice.toFixed(0)} each
                                    {itemQuantity && itemQuantity > 1 && ` × ${itemQuantity} = ₹${(itemPrice * itemQuantity).toFixed(0)}`}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Horizontal Info Row - Desktop Layout: Scan-friendly inline format */}
            <div className="hidden md:flex items-center gap-3 pb-2.5 border-b border-gray-200/80 dark:border-gray-700/80 text-xs">
              {/* Customer - Desktop */}
              <div className="flex items-center gap-2 min-w-0 pr-4 border-r border-gray-200/60 dark:border-gray-700/60">
                <div className="p-1 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <User className="h-3 w-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                </div>
                <p className="text-xs text-gray-800 dark:text-gray-100 font-medium truncate">
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 mr-1.5">Customer:</span>
                  <span className="font-semibold">{order.customerName}</span>
                  <span className="mx-1.5 text-gray-300 dark:text-gray-600">•</span>
                  <a 
                    href={`tel:${order.customerPhone}`}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                    title={`Call ${order.customerName}`}
                  >
                    {order.customerPhone}
                  </a>
                </p>
              </div>

              {/* Address - Desktop */}
              <div className="flex items-center gap-2 min-w-0 flex-1 px-4 border-r border-gray-200/60 dark:border-gray-700/60">
                <div className="p-1 bg-purple-50 dark:bg-purple-900/20 rounded-md">
                  <MapPin className="h-3 w-3 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                </div>
                <p className="text-xs text-gray-800 dark:text-gray-100 font-medium truncate">
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 mr-1.5">Address:</span>
                  <span className="font-medium">{address}</span>
                </p>
              </div>

              {/* Delivery Time Slot - Desktop (show date + time range) */}
              <div className="flex items-center gap-2 min-w-0 px-4 border-r border-gray-200/60 dark:border-gray-700/60">
                <div className="p-1 bg-amber-50 dark:bg-amber-900/20 rounded-md">
                  <Clock className="h-3 w-3 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                </div>
                <p className="text-xs text-gray-800 dark:text-gray-100 font-medium whitespace-nowrap">
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 mr-1.5">Slot:</span>
                  <span className="font-medium">
                    {deliveryDate} • {order.deliveryTime || 'N/A'}
                  </span>
                </p>
              </div>

              {/* Payment - Desktop */}
              <div className="flex items-center gap-2 min-w-0 pl-4">
                <div className="p-1 bg-green-50 dark:bg-green-900/20 rounded-md flex items-center justify-center">
                  <span className="text-[11px] font-bold text-green-600 dark:text-green-400">
                    ₹
                  </span>
                </div>
                <p className="text-xs text-gray-800 dark:text-gray-100 font-medium whitespace-nowrap">
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 mr-1.5">Payment:</span>
                  {order.paymentStatus === 'paid' ? (
                    <span className="text-green-600 dark:text-green-400 font-bold">Prepaid</span>
                  ) : (
                    <span className="text-orange-600 dark:text-orange-400 font-bold">COD</span>
                  )}
                  <span className="ml-1.5 font-bold">₹{(order.total || 0).toFixed(0)}</span>
                </p>
              </div>
            </div>

            {/* Assignment Status - Desktop: Lean assignment strip */}
            <div className="hidden md:flex items-center justify-between mt-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-900/10 border border-blue-200/60 dark:border-blue-800/60 shadow-sm">
                {assignmentInfo ? (
                  <>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 bg-blue-200/60 dark:bg-blue-800/40 rounded-md">
                        <Truck className="h-3.5 w-3.5 text-blue-700 dark:text-blue-300 flex-shrink-0" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-gray-800 dark:text-gray-200 font-medium">
                          <span className="text-[11px] text-gray-500 dark:text-gray-400 mr-1.5">Assigned to:</span>
                          <span className="font-bold text-blue-700 dark:text-blue-300">{assignmentInfo.deliveryBoyName}</span>
                          <span className="text-[11px] text-gray-500 dark:text-gray-400 ml-2">
                            {formatISTDateTime(assignmentInfo.assignedAt, { includeTime: true, includeDate: true })}
                          </span>
                        </p>
                      </div>
                    </div>
                    {(timeInStage || (canAssign && onReassign)) && (
                      <button
                        type="button"
                        onClick={() => onReassign && onReassign(order)}
                        className="flex flex-col items-end justify-center px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-200 transition-all shadow-sm hover:shadow"
                        title="Reassign delivery partner"
                      >
                        {timeInStage && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold leading-tight text-gray-700 dark:text-gray-100">
                            <History className="h-3 w-3 text-blue-600 dark:text-blue-300" />
                            <span>{timeInStage} ago</span>
                          </span>
                        )}
                        {canAssign && onReassign && (
                          <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold">
                            <span>Reassign</span>
                            <ChevronRight className="h-3 w-3" />
                          </span>
                        )}
                      </button>
                    )}
                  </>
                ) : canAssign && order.status === 'ready' ? (
                  <>
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide mb-1">
                        Status
                      </p>
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1">
                        Ready to Assign
                      </p>
                      {onAssign && (
                      <button
                        type="button"
                          onClick={() => onAssign(order)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                        >
                        <span>Assign</span>
                        <ChevronRight className="h-3 w-3" />
                      </button>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        Status
                      </p>
                      <p className="text-xs font-normal text-gray-600 dark:text-gray-400">
                        {deliveryStatus === 'assigned' ? 'Ready for Pickup' : 
                         deliveryStatus === 'picked_up' ? 'Picked Up' : 
                         deliveryStatus === 'in_transit' ? 'Out for Delivery' : 
                         deliveryStatus === 'delayed' ? 'Delayed / Failed' :
                         'Delivered'}
                      </p>
                    </div>
                  </>
                )}
            </div>

            {/* Vertical Stack - Mobile Layout */}
            <div className="md:hidden space-y-2.5">
              {/* Address - Mobile */}
              <div className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">
                    Address
                  </p>
                  <p className="text-xs font-normal text-gray-900 dark:text-white leading-tight" style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {address}
                  </p>
                </div>
              </div>

              {/* Customer - Mobile */}
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">
                    Customer
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                      {order.customerName}
                    </p>
                    <a 
                      href={`tel:${order.customerPhone}`}
                      className="flex items-center gap-1 text-xs font-normal text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline flex-shrink-0 transition-colors"
                      title={`Call ${order.customerName}`}
                    >
                      <Phone className="h-3 w-3" />
                      {order.customerPhone}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Assignment Status - Mobile Only (Desktop shown in horizontal row above) */}
            <div className="md:hidden">
              {assignmentInfo ? (
                <div className="flex items-center gap-2.5 p-2.5 bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-900/10 rounded-lg border border-blue-200/60 dark:border-blue-800/60 shadow-sm">
                  <div className="p-1.5 bg-blue-200/60 dark:bg-blue-800/40 rounded-md">
                    <Truck className="h-3.5 w-3.5 text-blue-700 dark:text-blue-300 flex-shrink-0" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                      Assigned To
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-bold text-blue-700 dark:text-blue-300">
                        {assignmentInfo.deliveryBoyName}
                      </p>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        • {formatISTDateTime(assignmentInfo.assignedAt)}
                      </span>
                      {timeInStage && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 dark:text-blue-300 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                          <History className="h-3 w-3" />
                          <span>{timeInStage} ago</span>
                        </span>
                      )}
                    </div>
                  </div>
                  {canAssign && onReassign && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onReassign(order)}
                      className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 flex-shrink-0"
                      title="Reassign"
                    >
                      <ArrowRightLeft className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ) : canAssign && order.status === 'ready' && (
                <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-300 dark:border-amber-800">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium text-amber-700 dark:text-amber-300 uppercase tracking-wide mb-0.5">
                      Not Assigned
                    </p>
                    {onAssign && (
                      <Button
                        onClick={() => onAssign(order)}
                        size="sm"
                        className="h-6 px-2.5 text-[10px] font-bold bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white"
                      >
                        <UserPlus className="h-3 w-3 mr-1" />
                        Assign
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Delivery Time & Payment - Mobile Only (Desktop shown in horizontal row above) */}
            <div className="md:hidden flex items-center gap-4 pt-1.5 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Delivery
                  </p>
                  <p className="text-xs font-normal text-gray-900 dark:text-white">
                    {deliveryDate} • {order.deliveryTime || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 text-[11px] font-bold text-gray-500 dark:text-gray-400 flex items-center justify-center">
                  ₹
                </span>
                <div>
                  <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Payment
                  </p>
                  <div className="flex items-center gap-1.5">
                    {order.paymentStatus === 'paid' ? (
                      <>
                        <span className="text-xs font-medium text-green-600 dark:text-green-400">Prepaid</span>
                        <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded font-medium">
                        <span>Cash on Delivery</span>
                        <span className="text-[9px] tracking-wide uppercase opacity-80">(COD)</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>
    );
  }

  // Delivery Boy View – Mobile-first, compact, action-first
  // Split items into main vs deal/combo for quick visual scan
  const mainItems: any[] = [];
  const dealItems: any[] = [];
  (order.items || []).forEach((item: any) => {
    if (isDealOrAddonItem(item)) {
      dealItems.push(item);
    } else {
      mainItems.push(item);
    }
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const mainPreview = mainItems.slice(0, 3);

  // Simple time-urgency indicator for riders based on delivery slot
  const getRiderUrgency = (): 'late' | 'soon' | null => {
    if (!order.deliveryDate || !order.deliveryTime) return null;
    try {
      const [timePart] = order.deliveryTime.split(/-|–/);
      const timeMatch = timePart.match(/(\d{1,2}):(\d{2})/);
      if (!timeMatch) return null;
      const [, hoursStr, minutesStr] = timeMatch;
      const hours = parseInt(hoursStr, 10);
      const minutes = parseInt(minutesStr, 10) || 0;

      const due = new Date(order.deliveryDate);
      due.setHours(hours, minutes, 0, 0);

      const now = new Date();
      const diffMinutes = (due.getTime() - now.getTime()) / (1000 * 60);

      if (diffMinutes < 0) return 'late';
      if (diffMinutes <= 30) return 'soon';
      return null;
    } catch {
      return null;
    }
  };

  const riderUrgency = getRiderUrgency();

  // Status label for header
  const statusLabel =
    deliveryStatus === 'assigned'
      ? 'Ready for Delivery'
      : deliveryStatus === 'picked_up'
      ? 'Picked Up'
      : deliveryStatus === 'in_transit'
      ? 'Out for Delivery'
      : deliveryStatus === 'delivered'
      ? 'Delivered'
      : 'Delayed';

  return (
    <Card className="rounded-xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 w-full max-w-[95vw] mx-auto">
      {/* Mobile Header - Matching Detail Sheet Design */}
      <div className="md:hidden px-2 md:px-3 py-2 md:py-2.5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 w-full">
        <div className="flex items-center justify-between gap-2 md:gap-3">
          {/* Left Side - Status, Order ID, Delivery Time */}
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 w-fit">
              {statusLabel}
            </span>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Order #{order.order_number || order.id}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {deliveryDate} • {order.deliveryTime || 'N/A'}
            </p>
          </div>
          {/* Right Side - Total and Payment */}
          <div className="text-right flex-shrink-0">
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Total
            </p>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
              ₹{(order.total || 0).toFixed(0)}
            </p>
            <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
              {order.paymentStatus === 'paid' ? 'Prepaid' : 'Cash on Delivery'}
            </p>
          </div>
        </div>
      </div>

      {/* Desktop Header - Keep existing design */}
      <div className="hidden md:block px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 w-full">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Status Badge */}
            <span
              className={`inline-flex items-center rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${
                deliveryStatus === 'assigned'
                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
                  : deliveryStatus === 'picked_up'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                  : deliveryStatus === 'in_transit'
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                  : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
              }`}
            >
              {deliveryStatus === 'assigned' && 'Ready'}
              {deliveryStatus === 'picked_up' && 'Picked'}
              {deliveryStatus === 'in_transit' && 'In Transit'}
              {deliveryStatus === 'delivered' && 'Delivered'}
              {deliveryStatus === 'delayed' && 'Delayed'}
            </span>
            {/* Order Number */}
            <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
              #{order.order_number || order.id}
            </span>
            {/* Price and Payment Mode */}
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-300 dark:border-gray-600">
              <div className="flex items-baseline gap-1">
                <IndianRupee className="h-3.5 w-3.5 text-gray-700 dark:text-gray-300 flex-shrink-0" />
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {(order.total || 0).toFixed(0)}
            </span>
              </div>
              {order.paymentStatus === 'paid' ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 text-[9px] font-semibold text-green-700 dark:text-green-300">
                  <CheckCircle className="h-2.5 w-2.5" />
                  Prepaid
                </span>
              ) : (
                <span className="inline-flex items-center rounded-md bg-orange-100 dark:bg-orange-900/30 px-1.5 py-0.5 text-[9px] font-semibold text-orange-700 dark:text-orange-300">
                  COD
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Delivery Time */}
            <div className="text-right">
              <p className="text-[9px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide leading-tight">
                Deliver by
              </p>
              <p className="text-[10px] font-semibold text-gray-800 dark:text-gray-100 leading-tight whitespace-nowrap">
                {order.deliveryTime || 'N/A'}
              </p>
            </div>
            {/* Urgency Badge */}
            {riderUrgency && (
              <span
                className={`inline-flex items-center rounded-lg px-1.5 py-0.5 text-[9px] font-bold ${
                  riderUrgency === 'late'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                }`}
              >
                {riderUrgency === 'late' ? '⚠ Late' : '⏰ Soon'}
              </span>
            )}
          </div>
        </div>
      </div>

      <CardContent className="p-2 md:p-2 space-y-2 md:space-y-2 w-full max-w-[95vw]">
        {/* Mobile: Distance only (Amount/Payment moved to header) */}
        <div className="md:hidden">
          {distance !== null && (
            <div className="flex items-center gap-1.5 rounded-lg px-1.5 md:px-2 py-1 md:py-1.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 mb-1.5 md:mb-2">
              <MapPin className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <div className="text-left">
                <p className="text-xs font-bold text-blue-700 dark:text-blue-300 leading-tight">
                  {distance} km
                </p>
                {estimatedTime && (
                  <p className="text-[9px] text-blue-600 dark:text-blue-400 leading-tight">
                    ~{estimatedTime}m
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Desktop: Distance only (Price/Payment moved to header) */}
        <div className="hidden md:flex items-center justify-end gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
          {distance !== null && (
            <div className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 flex-shrink-0">
              <MapPin className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <div className="text-right">
                <p className="text-xs font-bold text-blue-700 dark:text-blue-300 leading-tight">
                  {distance} km
                </p>
                {estimatedTime && (
                  <p className="text-[9px] text-blue-600 dark:text-blue-400 leading-tight">
                    ~{estimatedTime}m
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Address Section - Compact with Quick Actions */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-2 md:p-2 space-y-1.5 md:space-y-1.5">
          <div className="flex items-start gap-1.5 md:gap-2">
            <div className="p-0.5 md:p-0.5 bg-red-100 dark:bg-red-900/30 rounded-md flex-shrink-0">
              <MapPin className="h-3 w-3 md:h-3 md:w-3 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] md:text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">
                Delivery Address
              </p>
              <p className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white leading-tight line-clamp-2 mb-0.5">
                {address}
              </p>
              <div className="flex items-center gap-1 md:gap-1.5">
                <User className="h-2.5 w-2.5 md:h-2.5 md:w-2.5 text-gray-400 dark:text-gray-500" />
                <p className="text-[11px] md:text-xs text-gray-600 dark:text-gray-400">
                  {order.customerName}
                </p>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <a
                  href={`tel:${order.customerPhone}`}
                  className="text-[11px] md:text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {order.customerPhone}
                </a>
              </div>
            </div>
          </div>
          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1.5 md:gap-2 pt-1 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={() => onNavigate(order)}
              className="flex-1 h-9 md:h-9 text-[11px] md:text-xs font-bold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg shadow-sm hover:shadow-md transition-all"
            >
              <Navigation className="h-3.5 w-3.5 md:h-3.5 md:w-3.5 mr-1 md:mr-1" />
              Navigate
            </Button>
            <Button
              onClick={() => onCall(order.customerPhone)}
              variant="secondary"
              className="flex-1 h-9 md:h-9 text-[11px] md:text-xs font-bold bg-white dark:bg-gray-800 border-2 border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 dark:hover:border-blue-600 rounded-lg transition-all"
            >
              <Phone className="h-3.5 w-3.5 md:h-3.5 md:w-3.5 mr-1 md:mr-1 text-blue-600 dark:text-blue-400" />
              Call
            </Button>
          </div>
        </div>

        {/* Items Section - Bakery Production Pattern */}
        {order.items && order.items.length > 0 && (
          <div className="space-y-2 md:space-y-2">
            {/* Main Items Section */}
            {mainItems.length > 0 ? (
              <div>
                <div className="flex items-center gap-1 md:gap-1.5 mb-1.5 md:mb-1.5">
                  <div className="p-0.5 md:p-0.5 bg-purple-100 dark:bg-purple-900/30 rounded">
                    <Cake className="h-3 w-3 md:h-3 md:w-3 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-[11px] md:text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Main Items {mainItems.length > 1 && `(${mainItems.length})`}
                  </h3>
                </div>
                
                <div
                  className={
                    mainItems.length > 1
                      ? 'space-y-1.5 md:space-y-0 md:flex md:gap-2.5 md:overflow-x-auto md:pb-1.5 md:-mx-1.5 md:px-1.5'
                      : 'space-y-1.5 md:max-w-[70%]'
                  }
                >
                  {mainItems.map((item: any, index: number) => {
                    const productImage = getProductImage ? getProductImage(item) : (item.product_image || item.image_url || item.productImage || item.image || null);
                    return (
                      <div 
                        key={item.id || index}
                        className={`bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2 md:p-2 border border-gray-200 dark:border-gray-700 ${
                          mainItems.length > 1 ? 'md:flex-none md:w-[60%]' : ''
                        }`}
                      >
                        <div className="flex gap-2 md:gap-2">
                          {/* Product Image */}
                          <div 
                            className="relative w-14 h-14 sm:w-16 sm:h-16 md:w-16 md:h-16 bg-white dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-90 transition-opacity shadow-sm group"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (productImage && openImageModal) {
                                openImageModal(productImage, item.productName || item.product_name || 'Item');
                              }
                            }}
                          >
                            {productImage ? (
                              <>
                                <img 
                                  src={resolveImageUrl(productImage)} 
                                  alt={item.productName || item.product_name || 'Item'}
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
                            <p className="text-xs md:text-sm font-bold text-gray-900 dark:text-gray-100 mb-1 md:mb-1 leading-tight">
                              {item.productName || item.product_name || 'Item'}
                            </p>
                            
                            {/* Compact Info Row */}
                            <div className="flex flex-wrap items-center gap-x-2 md:gap-x-2 gap-y-0.5 text-[11px] md:text-xs">
                              {getFlavorText && getFlavorText(item) !== 'Not Selected' && (
                                <div className="flex items-center gap-1">
                                  <span className="text-gray-500 dark:text-gray-400">Flavor:</span>
                                  <span className="text-gray-900 dark:text-gray-100 font-semibold">
                                    {getFlavorText(item)}
                                  </span>
                                </div>
                              )}
                              
                              {(item as any)?.tier && (
                                <div className="flex items-center gap-1">
                                  <span className="text-gray-500 dark:text-gray-400">Tier:</span>
                                  <span className="text-gray-900 dark:text-gray-100 font-semibold">
                                    {(item as any).tier || '1'}
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
                            
                            {/* Cake Message - If exists */}
                            {(item as any)?.cake_message && (
                              <div className="mt-1 md:mt-1 pt-1 md:pt-1 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex items-start gap-1 md:gap-1">
                                  <MessageSquare className="h-3 w-3 md:h-3 md:w-3 text-pink-500 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <span className="text-[9px] md:text-[10px] font-medium text-gray-500 dark:text-gray-400">Message:</span>
                                    <p className="text-[11px] md:text-xs font-semibold text-pink-700 dark:text-pink-400 italic leading-tight">
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
              <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
                <Package className="h-6 w-6 text-gray-400 mx-auto mb-1.5" />
                <p className="text-xs text-gray-600 dark:text-gray-400">No items in this order</p>
              </div>
            ) : null}

            {/* Deal Items Section - Collapsible */}
            {dealItems.length > 0 && (
              <div className="mb-1.5 md:mb-1.5 mt-0.5 md:mt-0.5 rounded-lg bg-amber-50/60 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/60">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (toggleDealItems) {
                      toggleDealItems(order.id);
                    }
                  }}
                  className="w-full flex items-center justify-between gap-1.5 px-1.5 md:px-2 py-1 md:py-1 hover:bg-amber-100/70 dark:hover:bg-amber-900/40 rounded-t-lg transition-colors"
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
                    {expandedDealItems.has(order.id) ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                  </div>
                </button>
                
                {expandedDealItems.has(order.id) && (
                  <div className="space-y-1 md:space-y-1 px-1.5 md:px-2 pb-2 md:pb-2 pt-1 md:pt-1 border-t border-amber-200 dark:border-amber-800">
                    {dealItems.map((item: any, index: number) => {
                      const productImage = getProductImage ? getProductImage(item) : (item.product_image || item.image_url || item.productImage || item.image || null);
                      return (
                        <div 
                          key={item.id || `deal-${index}`}
                          className="bg-white/90 dark:bg-amber-950/40 rounded-lg p-1 md:p-1.5 border border-amber-200/90 dark:border-amber-700 shadow-[0_1px_3px_rgba(148,81,7,0.18)]"
                        >
                          <div className="flex gap-1 md:gap-1.5">
                            {/* Product Image */}
                            <div 
                              className="relative w-11 h-11 sm:w-12 sm:h-12 bg-amber-50 dark:bg-amber-950 rounded-md overflow-hidden flex-shrink-0 border border-amber-200 dark:border-amber-700 cursor-pointer hover:opacity-95 transition-opacity group"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (productImage && openImageModal) {
                                  openImageModal(productImage, item.productName || item.product_name || 'Item');
                                }
                              }}
                            >
                              {productImage ? (
                                <>
                                  <img 
                                    src={resolveImageUrl(productImage)} 
                                    alt={item.productName || item.product_name || 'Item'}
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
                                  {item.productName || item.product_name || 'Item'}
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
          </div>
        )}

        {/* Special Instructions - Compact */}
        {order.notes && (
          <div className="rounded-lg border border-amber-200 dark:border-amber-700 bg-gradient-to-br from-amber-50 to-amber-100/30 dark:from-amber-900/20 dark:to-amber-900/10 px-2 md:px-2 py-1.5 md:py-1.5 shadow-sm">
            <div className="flex items-start gap-1.5 md:gap-1.5">
              <div className="p-0.5 md:p-0.5 bg-amber-200 dark:bg-amber-800/40 rounded-md flex-shrink-0 mt-0.5">
                <MessageSquare className="h-3 w-3 md:h-3 md:w-3 text-amber-700 dark:text-amber-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] md:text-[10px] font-bold text-amber-800 dark:text-amber-200 uppercase tracking-wide mb-0.5">
                  Instructions
                </p>
                <p className="text-[10px] md:text-[11px] text-amber-900 dark:text-amber-100 leading-tight line-clamp-2 font-medium">
                  {order.notes}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Primary Action Button - Prominent */}
        <div className="pt-1.5 md:pt-1.5">
          {getPrimaryAction()}
        </div>

        {/* Secondary Actions - Compact Grid */}
        <div className="grid grid-cols-3 gap-1.5 md:gap-1.5 pt-1.5 md:pt-1.5 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={() => onCall(order.customerPhone)}
            variant="secondary"
            size="sm"
            className="flex flex-col items-center justify-center h-8 md:h-9 gap-0.5 md:gap-1 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
          >
            <Phone className="h-3 w-3 md:h-3.5 md:w-3.5 text-blue-600 dark:text-blue-400" />
            <span className="text-[9px] md:text-[10px] font-medium text-blue-700 dark:text-blue-300">Call</span>
          </Button>

          <Button
            onClick={() => onNavigate(order)}
            variant="secondary"
            size="sm"
            className="flex flex-col items-center justify-center h-8 md:h-9 gap-0.5 md:gap-1 bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 hover:border-green-400 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all"
          >
            <Navigation className="h-3 w-3 md:h-3.5 md:w-3.5 text-green-600 dark:text-green-400" />
            <span className="text-[9px] md:text-[10px] font-medium text-green-700 dark:text-green-300">Navigate</span>
          </Button>

          <Button
            onClick={() => onView(order)}
            variant="secondary"
            size="sm"
            className="flex flex-col items-center justify-center h-8 md:h-9 gap-0.5 md:gap-1 bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all"
          >
            <Eye className="h-3 w-3 md:h-3.5 md:w-3.5 text-purple-600 dark:text-purple-400" />
            <span className="text-[9px] md:text-[10px] font-medium text-purple-700 dark:text-purple-300">Details</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const Delivery: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToastContext();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Helper function to save delivery boy notifications to localStorage
  const saveDeliveryNotification = useCallback((title: string, message: string) => {
    if (user?.role !== 'delivery_boy') return;
    
    try {
      const existing = JSON.parse(
        localStorage.getItem('deliveryBoyNotifications') || '[]'
      ) as Array<{
        id: string;
        title: string;
        message: string;
        time: string;
        unread: boolean;
        timestamp: number;
      }>;
      
      const now = Date.now();
      const formatTime = (timestamp: number): string => {
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes} min ago`;
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        return new Date(timestamp).toLocaleDateString();
      };
      
      const newNotification = {
        id: `notif-${now}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        message,
        time: formatTime(now),
        unread: true,
        timestamp: now,
      };
      
      // Keep only last 50 notifications
      const updated = [newNotification, ...existing].slice(0, 50);
      localStorage.setItem('deliveryBoyNotifications', JSON.stringify(updated));
      
      // Dispatch custom event to notify Topbar to refresh
      window.dispatchEvent(new Event('deliveryNotificationUpdate'));
    } catch (error) {
      console.error('Error saving delivery notification:', error);
    }
  }, [user?.role]);
  
  // State management
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeDeals, setActiveDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [orderForPhoto, setOrderForPhoto] = useState<Order | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [deliveryOtp, setDeliveryOtp] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Notification tracking for delivery boys
  const previousOrderIdsRef = useRef<Set<string>>(new Set());
  const previousOrderStatusRef = useRef<Record<string, Order['status']>>({});
  const selfUpdatedOrderIdsRef = useRef<Set<string>>(new Set());
  // Wallet state for delivery boys
  const [walletSummary, setWalletSummary] = useState<DeliveryWalletSummary | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [walletLoading, setWalletLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [walletError, setWalletError] = useState<string | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletTransactions, setWalletTransactions] = useState<DeliveryWalletTransaction[]>([]);
  const [walletPage, setWalletPage] = useState(1);
  const [walletTotalPages, setWalletTotalPages] = useState(1);
  const [walletTxLoading, setWalletTxLoading] = useState(false);
  // Profile and Help modals for delivery boys
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  // Target tier state for delivery boys
  const [dailyProgress, setDailyProgress] = useState<DailyProgress | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [progressLoading, setProgressLoading] = useState(false);
  const [isFooterExpanded, setIsFooterExpanded] = useState(false);
  // Image modal state
  const [imageModal, setImageModal] = useState<{ isOpen: boolean; imageUrl: string; productName: string }>({
    isOpen: false,
    imageUrl: '',
    productName: ''
  });
  const [imageZoom, setImageZoom] = useState(100);
  const [expandedDealItems, setExpandedDealItems] = useState<Set<string>>(new Set());

  // Image modal helper functions
  const openImageModal = useCallback((imageUrl: string, productName: string) => {
    setImageModal({ isOpen: true, imageUrl, productName });
    setImageZoom(100);
  }, []);

  const closeImageModal = useCallback(() => {
    setImageModal({ isOpen: false, imageUrl: '', productName: '' });
    setImageZoom(100);
  }, []);

  const handleZoomIn = useCallback(() => {
    setImageZoom(prev => Math.min(prev + 25, 300));
  }, []);

  const handleZoomOut = useCallback(() => {
    setImageZoom(prev => Math.max(prev - 25, 50));
  }, []);

  const handleResetZoom = useCallback(() => {
    setImageZoom(100);
  }, []);

  // Handle ESC key to close image modal
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && imageModal.isOpen) {
        closeImageModal();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [imageModal.isOpen, closeImageModal]);

  const toggleDealItems = useCallback((orderId: string) => {
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
  
  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered'>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'oldest' | 'newest' | 'total' | 'customer'>('priority');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showAssignmentDropdown, setShowAssignmentDropdown] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const assignmentDropdownRef = useRef<HTMLDivElement>(null);
  // Simple tab state for delivery boy view (Active vs Completed)
  const [deliveryBoyTab, setDeliveryBoyTab] = useState<'active' | 'completed'>('active');
  
  // Assignment states
  const [assignmentFilter, setAssignmentFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [orderToAssign, setOrderToAssign] = useState<Order | null>(null);
  const [availableDeliveryBoys, setAvailableDeliveryBoys] = useState<Array<{ id: number; name: string; email: string }>>([]);
  const [selectedDeliveryBoyId, setSelectedDeliveryBoyId] = useState<string>('');
  const [orderAssignments, setOrderAssignments] = useState<Record<string, {
    deliveryBoyId: number;
    deliveryBoyName: string;
    deliveryStatus: string;
    assignedAt: string;
  }>>({});
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [loadingDeliveryBoys, setLoadingDeliveryBoys] = useState(false);
  
  // Dropdown states for custom dropdowns
  const [showAssignDeliveryBoyDropdown, setShowAssignDeliveryBoyDropdown] = useState(false);
  const [showBulkAssignDeliveryBoyDropdown, setShowBulkAssignDeliveryBoyDropdown] = useState(false);
  const [showBulkAssignPriorityDropdown, setShowBulkAssignPriorityDropdown] = useState(false);
  const [showReassignDeliveryBoyDropdown, setShowReassignDeliveryBoyDropdown] = useState(false);
  const assignDeliveryBoyDropdownRef = useRef<HTMLDivElement>(null);
  const bulkAssignDeliveryBoyDropdownRef = useRef<HTMLDivElement>(null);
  const bulkAssignPriorityDropdownRef = useRef<HTMLDivElement>(null);
  const reassignDeliveryBoyDropdownRef = useRef<HTMLDivElement>(null);
  
  // Phase 2: Enhanced features state
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [selectedOrdersForBulk, setSelectedOrdersForBulk] = useState<Set<string>>(new Set());
  const [bulkAssignDeliveryBoyId, setBulkAssignDeliveryBoyId] = useState<string>('');
  const [bulkAssignPriority, setBulkAssignPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [orderToReassign, setOrderToReassign] = useState<Order | null>(null);
  const [reassignDeliveryBoyId, setReassignDeliveryBoyId] = useState<string>('');
  const [reassignReason, setReassignReason] = useState<string>('');
  const [showWorkloadView, setShowWorkloadView] = useState(false);
  const [deliveryBoyWorkload, setDeliveryBoyWorkload] = useState<Array<{
    deliveryBoyId: number;
    deliveryBoyName: string;
    deliveryBoyEmail: string;
    contactNumber?: string;
    totalOrders: number;
    assignedCount: number;
    pickedUpCount: number;
    inTransitCount: number;
    deliveredCount: number;
  }>>([]);
  const [loadingWorkload, setLoadingWorkload] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [orderForHistory, setOrderForHistory] = useState<Order | null>(null);
  // Request throttling state
  const [isFetching, setIsFetching] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [retryDelay, setRetryDelay] = useState(30000); // Start with 30 seconds
  const retryDelayRef = useRef(30000); // Use ref to avoid dependency issues
  // Product images cache - maps productId to image URL
  const [productImagesCache, setProductImagesCache] = useState<Record<string, string>>({});
  const [loadingProductImages, setLoadingProductImages] = useState<Set<string>>(new Set());

  // Get product image helper (defined after productImagesCache)
  const getProductImage = useCallback((item: any): string | null => {
    const productId = item.productId || item.product_id;
    const image = item.product_image 
      || item.image_url 
      || item.productImage 
      || item.image
      || (productId && productImagesCache[productId]) || null;
    return image;
  }, [productImagesCache]);

  // Get flavor text helper
  const getFlavorText = useCallback((item: any): string => {
    const flavorName = item.flavor_name || item.flavor?.name;
    const flavorId = item.flavor_id || item.flavor?.id;
    const productSubcategory = item.product_subcategory || item.productSubcategory;
    
    if (flavorId != null && flavorId !== 0 && flavorName) {
      return flavorName;
    } else if (productSubcategory) {
      return productSubcategory;
    } else {
      return 'Not Selected';
    }
  }, []);
  const [assignmentHistory, setAssignmentHistory] = useState<Array<{
    id: number;
    orderId: string;
    oldDeliveryBoyId: number | null;
    oldDeliveryBoyName: string;
    newDeliveryBoyId: number;
    newDeliveryBoyName: string;
    reason: string;
    createdAt: string;
  }>>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Classifier that uses active deal configurations first, then falls back to heuristics
  const isDealItemForDisplay = useCallback(
    (item: any): boolean => {
      if (!item || typeof item === 'string') return false;

      // 1) Prefer authoritative active deal configs (product + deal price)
      if (activeDeals.length > 0) {
        const productId = Number(item.productId || item.product_id);
        const price = item.price !== undefined ? Number(item.price) : NaN;

        if (!isNaN(productId) && !isNaN(price)) {
          const matchesConfiguredDeal = activeDeals.some((deal) => {
            if (!deal.is_active) return false;
            if (deal.product_id !== productId) return false;

            const dealPrice = Number(deal.deal_price);
            if (isNaN(dealPrice)) return false;

            // Allow small floating point differences
            return Math.abs(dealPrice - price) < 0.01;
          });

          if (matchesConfiguredDeal) {
            return true;
          }
        }
      }

      // 2) Fallback to heuristic checks (same logic as internal helper)
      const name = (item.productName || item.product_name || '').toString().toLowerCase();
      const flags = [
        item.isDeal,
        item.is_deal,
        item.dealType,
        item.isAddon,
        item.is_addon
      ];

      const looksLikeDealName =
        name.includes('deal') || name.includes('add-on') || name.includes('addon');

      // Treat ultra-low price items (like ₹1 deals) as deal/add-ons, but only if explicitly priced
      const numericPrice = item.price !== undefined ? Number(item.price) : NaN;
      const looksLikeLowPriceDeal =
        !isNaN(numericPrice) && numericPrice > 0 && numericPrice <= 1;

      return flags.some(Boolean) || looksLikeDealName || looksLikeLowPriceDeal;
    },
    [activeDeals]
  );

  // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  // Fetch assignment information for orders
  const fetchOrderAssignments = useCallback(async (ordersList: Order[], silent: boolean = false) => {
    try {
      if (!silent) {
        setLoadingAssignments(true);
      }
      const assignments: Record<string, {
        deliveryBoyId: number;
        deliveryBoyName: string;
        deliveryStatus: string;
        assignedAt: string;
      }> = {};
      
      // Fetch assignment info for each order in parallel
      const assignmentPromises = ordersList.map(async (order) => {
        try {
          const assignment = await deliveryService.getOrderAssignment(order.id);
          if (assignment) {
            assignments[order.id] = {
              deliveryBoyId: assignment.deliveryBoyId,
              deliveryBoyName: assignment.deliveryBoyName,
              deliveryStatus: assignment.deliveryStatus,
              assignedAt: assignment.assignedAt
            };
          }
        } catch (error) {
          console.error(`Error fetching assignment for order ${order.id}:`, error);
        }
      });
      
      await Promise.all(assignmentPromises);
      setOrderAssignments(assignments);
    } catch (error) {
      console.error('Error fetching order assignments:', error);
    } finally {
      if (!silent) {
        setLoadingAssignments(false);
      }
    }
  }, []);

  // Fetch delivery orders from API with throttling and retry logic
  const fetchDeliveryOrders = useCallback(async (silent: boolean = false) => {
    // Prevent concurrent requests
    if (isFetching) {
      return;
    }

    // Throttle requests - minimum 10 seconds between requests (increased to prevent rate limiting)
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTime;
    const minInterval = 10000; // 10 seconds minimum

    if (timeSinceLastFetch < minInterval && lastFetchTime > 0) {
      // Silently skip request if throttled (no console log needed)
      return;
    }

    setIsFetching(true);
    setLastFetchTime(now);

    try {
      if (!silent) {
        setLoading(true);
      }
      
      // Phase 3: Check if current user is a delivery boy
      const isDeliveryBoy = user?.role === 'delivery_boy';
      const deliveryBoyId = user?.id;
      
      // Phase 3: If user is a delivery boy, fetch only their assigned orders
      if (isDeliveryBoy && deliveryBoyId) {
        try {
          // Fetch orders assigned to this delivery boy
          const deliveryOrders = await deliveryService.getDeliveryOrders(deliveryBoyId.toString());
          
          // Convert DeliveryOrder format to Order format for consistency
          const convertedOrders: Order[] = deliveryOrders.map((deliveryOrder) => {
            // Map delivery status to order status
            let orderStatus: Order['status'] = 'ready';
            switch (deliveryOrder.status) {
              case 'assigned':
                orderStatus = 'ready';
                break;
              case 'picked_up':
                orderStatus = 'preparing';
                break;
              case 'in_transit':
                orderStatus = 'confirmed';
                break;
              case 'delivered':
                orderStatus = 'delivered';
                break;
            }
            
            // Convert items array to OrderItem format if needed
            let orderItems: any[] = [];
            if (deliveryOrder.items && Array.isArray(deliveryOrder.items)) {
              // Items can be strings (legacy format) or objects (new format with weight info)
              orderItems = deliveryOrder.items.map((item: any, index: number) => {
                if (typeof item === 'string') {
                  // Parse string like "Product Name x2 (500g)" - legacy format
                  return {
                    id: `item-${index}`,
                    productName: item,
                    quantity: 1,
                    price: 0
                  };
                }
                // Item is already an object - ensure all fields are properly mapped
                const mappedItem = {
                  id: item.id || `item-${index}`,
                  productId: item.productId || item.product_id,
                  product_id: item.product_id || item.productId,
                  variantId: item.variantId || item.variant_id,
                  variant_id: item.variant_id || item.variantId,
                  productName: item.productName || item.product_name,
                  product_name: item.product_name || item.productName,
                  product_image: item.product_image,
                  variant_weight: item.variant_weight,
                  product_base_weight: item.product_base_weight,
                  base_weight: item.base_weight || item.product_base_weight,
                  quantity: item.quantity || 1,
                  price: item.price || 0,
                  total: item.total,
                  flavor_id: item.flavor_id
                };
                
                // Debug: Log first item to see what we're getting
                if (index === 0) {
                  console.log('[Delivery] Converted first item from deliveryOrder:', {
                    original: item,
                    mapped: mappedItem,
                    hasVariantWeight: !!mappedItem.variant_weight,
                    hasBaseWeight: !!mappedItem.product_base_weight || !!mappedItem.base_weight
                  });
                }
                
                return mappedItem;
              });
            }
            
            return {
              id: deliveryOrder.id.toString(),
              order_number: deliveryOrder.orderNumber || `ORD-${deliveryOrder.id}`,
              customerName: deliveryOrder.customerName,
              customerPhone: deliveryOrder.customerPhone,
              deliveryAddress: deliveryOrder.customerAddress,
              deliveryDate: deliveryOrder.deliveryDate,
              deliveryTime: deliveryOrder.deliveryTime,
              status: orderStatus,
              total: parseFloat(deliveryOrder.total?.toString() || '0') || 0,
              paymentStatus: deliveryOrder.paymentStatus || 'pending',
              items: orderItems,
              itemsCount: deliveryOrder.itemsCount, // Preserve itemsCount from backend
              priority: deliveryOrder.priority || 'medium', // Preserve priority from delivery order
              createdAt: new Date().toISOString(), // Delivery orders don't have createdAt, use current date
              notes: deliveryOrder.specialInstructions,
              customerEmail: '', // Delivery orders don't have email
              updatedAt: new Date().toISOString()
            } as unknown as Order & { itemsCount?: number; priority?: 'low' | 'medium' | 'high' };
          });
          
          setOrders(convertedOrders);

          // In-app notifications for delivery boys: new assignments and remote status changes
          const prevIds = previousOrderIdsRef.current;
          const prevStatuses = previousOrderStatusRef.current;
          const newIds = new Set<string>();
          const newStatuses: Record<string, Order['status']> = {};

          convertedOrders.forEach(order => {
            newIds.add(order.id);
            newStatuses[order.id] = order.status;

            // New assignment (order not seen before)
            if (prevIds.size > 0 && !prevIds.has(order.id)) {
              const message = `Order #${order.order_number || order.id} has been assigned to you.`;
              showSuccess('New Delivery Assigned', message);
              saveDeliveryNotification('New Delivery Assigned', message);
            } else if (prevStatuses[order.id] && prevStatuses[order.id] !== order.status) {
              // Status change not initiated by this client
              if (!selfUpdatedOrderIdsRef.current.has(order.id)) {
                const newStatusLabel = mapOrderStatusToDeliveryStatus(order.status);
                const message = `Status for order #${order.order_number || order.id} changed to ${newStatusLabel.replace('_', ' ')}.`;
                showSuccess('Order Updated', message);
                saveDeliveryNotification('Order Updated', message);
              }
            }
          });

          // Clear self-updated set after processing one refresh cycle
          selfUpdatedOrderIdsRef.current.clear();
          previousOrderIdsRef.current = newIds;
          previousOrderStatusRef.current = newStatuses;
          
          // For delivery boy view, all orders are already assigned to them
          const assignments: Record<string, {
            deliveryBoyId: number;
            deliveryBoyName: string;
            deliveryStatus: string;
            assignedAt: string;
          }> = {};
          
          convertedOrders.forEach(order => {
            if (order.id) {
              assignments[order.id] = {
                deliveryBoyId: parseInt(deliveryBoyId.toString()),
                deliveryBoyName: user?.name || 'You',
                deliveryStatus: (order as any).deliveryStatus || 'assigned',
                assignedAt: new Date().toISOString()
              };
            }
          });
          
          setOrderAssignments(assignments);
          // Reset retry delay on success
          setRetryDelay(30000);
          retryDelayRef.current = 30000;
        } catch (error: any) {
          console.error('Error fetching delivery boy orders:', error);
          if (error?.message?.includes('429') || error?.message?.includes('Too many requests')) {
            // Handle rate limiting with exponential backoff
            const newDelay = Math.min(retryDelayRef.current * 2, 300000); // Max 5 minutes
            setRetryDelay(newDelay);
            retryDelayRef.current = newDelay;
            if (!silent) {
              showError('Rate Limited', `Too many requests. Please wait ${Math.round(newDelay / 1000)} seconds before refreshing.`);
            }
          } else if (!silent) {
            showError('Error', 'Failed to load your assigned orders. Please try again.');
          }
        }
      } else {
        // Admin/Staff view: Fetch all delivery-related orders
        // Stagger requests to avoid hitting rate limits
        try {
          const response = await orderService.getOrders({
            status: 'ready', // Orders ready for delivery
            limit: 1000 // Get all delivery orders
          });
          
          // Add small delay between requests
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const preparingResponse = await orderService.getOrders({ status: 'preparing', limit: 1000 });
          
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const confirmedResponse = await orderService.getOrders({ status: 'confirmed', limit: 1000 });
          
          // Combine all delivery-related orders
          const allOrders = [
            ...response.orders,
            ...preparingResponse.orders,
            ...confirmedResponse.orders
          ];
          
        setOrders(allOrders);
        
        // Fetch assignment info for all orders
        await fetchOrderAssignments(allOrders, silent);
        
        // Fetch missing product images in the background
        if (allOrders.length > 0) {
          fetchMissingProductImages(allOrders).catch(err => {
            console.error('Error fetching product images:', err);
          });
        }
        
        // Reset retry delay on success
        setRetryDelay(30000);
        retryDelayRef.current = 30000;
        } catch (error: any) {
          console.error('Error fetching delivery orders:', error);
          if (error?.message?.includes('429') || error?.message?.includes('Too many requests')) {
            // Handle rate limiting with exponential backoff
            const newDelay = Math.min(retryDelayRef.current * 2, 300000); // Max 5 minutes
            setRetryDelay(newDelay);
            retryDelayRef.current = newDelay;
            if (!silent) {
              showError('Rate Limited', `Too many requests. Please wait ${Math.round(newDelay / 1000)} seconds before refreshing.`);
            }
            // Don't throw - allow the function to complete gracefully
          } else if (!silent) {
            showError('Error', 'Failed to load delivery orders. Please try again.');
          }
        }
      }

      // Fetch active deals once per load to improve deal item detection
      // Note: /deals endpoint is admin-only; skip for delivery boys to avoid permission errors
      if (!isDeliveryBoy) {
        try {
          const dealsResponse = await dealService
            .getDeals()
            .catch(error => {
              console.error('Error fetching deals for Delivery Management:', error);
              return { success: false, data: [] as Deal[] };
            });

          if (dealsResponse && dealsResponse.success) {
            const onlyActiveDeals = (dealsResponse.data || []).filter((deal: Deal) => deal.is_active);
            setActiveDeals(onlyActiveDeals);
          }
        } catch (dealsError) {
          console.error('Unexpected error while processing deals for Delivery Management:', dealsError);
        }
      }

      // Phase 3: Fetch delivery boy wallet summary (top banner) when applicable
      if (isDeliveryBoy) {
        try {
          setWalletLoading(true);
          setWalletError(null);
          const summary = await deliveryWalletService.getSummary();
          setWalletSummary(summary);
        } catch (summaryError: any) {
          console.error('Error fetching delivery wallet summary:', summaryError);
          setWalletError(summaryError?.message || 'Failed to load wallet summary');
        } finally {
          setWalletLoading(false);
        }

        // Fetch daily progress for target tiers
        try {
          setProgressLoading(true);
          const progress = await deliveryTargetTierService.getDailyProgress();
          setDailyProgress(progress);
        } catch (progressError: any) {
          console.error('Error fetching daily progress:', progressError);
          // Don't show error - this is optional feature
        } finally {
          setProgressLoading(false);
        }
      }
    } catch (error: any) {
      console.error('Error fetching delivery orders:', error);
      if (error?.message?.includes('429') || error?.message?.includes('Too many requests')) {
        const newDelay = Math.min(retryDelayRef.current * 2, 300000);
        setRetryDelay(newDelay);
        retryDelayRef.current = newDelay;
        if (!silent) {
          showError('Rate Limited', `Too many requests. Please wait ${Math.round(newDelay / 1000)} seconds before refreshing.`);
        }
      } else if (!silent) {
        showError('Error', 'Failed to load delivery orders. Please try again.');
      }
    } finally {
      setIsFetching(false);
      if (!silent) {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showError, fetchOrderAssignments, user, isFetching, lastFetchTime]); // fetchMissingProductImages, saveDeliveryNotification, and showSuccess are stable functions, intentionally excluded

  // Fetch available delivery boys
  const fetchAvailableDeliveryBoys = useCallback(async () => {
    try {
      setLoadingDeliveryBoys(true);
      const deliveryBoys = await deliveryService.getAvailableDeliveryBoys();
      setAvailableDeliveryBoys(deliveryBoys);
    } catch (error) {
      console.error('Error fetching available delivery boys:', error);
      showError('Error', 'Failed to load delivery boys. Please try again.');
    } finally {
      setLoadingDeliveryBoys(false);
    }
  }, [showError]);

  // Fetch product image for a specific product ID
  const fetchProductImage = useCallback(async (productId: string): Promise<string | null> => {
    // Skip if already cached or currently loading
    if (productImagesCache[productId] || loadingProductImages.has(productId) || !productId) {
      return productImagesCache[productId] || null;
    }

    try {
      setLoadingProductImages((prev: Set<string>) => new Set(prev).add(productId));
      const response = await productService.getProduct(productId);
      if (response && response.product && response.product.image_url) {
        setProductImagesCache((prev: Record<string, string>) => ({ ...prev, [productId]: response.product.image_url }));
        return response.product.image_url;
      }
    } catch (error) {
      console.error(`Error fetching product image for ${productId}:`, error);
    } finally {
      setLoadingProductImages((prev: Set<string>) => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
    return null;
  }, [productImagesCache, loadingProductImages]);

  // Fetch product images for all items in orders that don't have images
  const fetchMissingProductImages = useCallback(async (ordersList: Order[]) => {
    const productIdsToFetch = new Set<string>();
    
    // Collect all product IDs that need images
    ordersList.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          if (typeof item !== 'string') {
            const productId = item.productId || item.product_id;
            const hasImage = item.product_image || item.image_url || item.imageUrl || item.productImage || item.image;
            
            if (productId && !hasImage && !productImagesCache[productId] && !loadingProductImages.has(productId)) {
              productIdsToFetch.add(productId);
            }
          }
        });
      }
    });

    // Fetch images for all missing products (batch fetch with throttling)
    if (productIdsToFetch.size > 0) {
      // Throttle: fetch max 5 images at a time with 200ms delay between batches
      const productIdsArray = Array.from(productIdsToFetch);
      const batchSize = 5;
      
      for (let i = 0; i < productIdsArray.length; i += batchSize) {
        const batch = productIdsArray.slice(i, i + batchSize);
        const fetchPromises = batch.map(productId => fetchProductImage(productId));
        await Promise.allSettled(fetchPromises);
        
        // Add delay between batches to avoid rate limiting
        if (i + batchSize < productIdsArray.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    }
  }, [productImagesCache, loadingProductImages, fetchProductImage]);

  // Load data on mount
  useEffect(() => {
    fetchDeliveryOrders();
  }, [fetchDeliveryOrders]);

  // Silent auto-refresh delivery orders with adaptive interval for admin/staff
  // This runs in the background without showing loading state to avoid page blinking
  // Uses adaptive interval based on retry delay to respect rate limits
  useEffect(() => {
    if (user && (user.role === 'super_admin' || user.role === 'admin' || user.role === 'staff')) {
      // Use retryDelayRef for interval, but minimum 60 seconds, maximum 5 minutes (increased to prevent rate limiting)
      const refreshInterval = Math.max(retryDelayRef.current, 60000);
      
      const interval = setInterval(() => {
        // Only refresh if not currently fetching
        if (!isFetching) {
          // Silent refresh - fetch without showing loading state
          fetchDeliveryOrders(true);
        }
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [user, fetchDeliveryOrders, isFetching]);

  // Fetch available delivery boys when assignment modal opens
  useEffect(() => {
    if (showAssignModal || showBulkAssignModal || showReassignModal) {
      fetchAvailableDeliveryBoys();
    }
  }, [showAssignModal, showBulkAssignModal, showReassignModal, fetchAvailableDeliveryBoys]);

  // Helper function to calculate urgency level for an order
  const calculateUrgencyLevel = useCallback((order: Order, assignmentInfo?: any): 'critical' | 'urgent' | 'normal' => {
    const isAssigned = !!assignmentInfo;
    const now = Date.now();
    const deliveryStatus = mapOrderStatusToDeliveryStatus(order.status);
    
    // Critical: Unassigned for more than 1 hour
    if (!isAssigned && deliveryStatus === 'assigned') {
      try {
        const orderCreatedAt = new Date(order.createdAt).getTime();
        const ageInHours = (now - orderCreatedAt) / (1000 * 60 * 60);
        if (ageInHours > 1) return 'critical';
        if (ageInHours > 0.5) return 'urgent';
      } catch {}
    }
    
    // Critical: Delivery time passed
    if (order.deliveryDate && order.deliveryTime) {
      try {
        const deliveryDateStr = order.deliveryDate;
        const [timePart] = order.deliveryTime.split(' - ');
        const [hours, minutes] = timePart.includes(':') 
          ? timePart.split(':').map(Number)
          : [12, 0];
        
        const deliveryDateTime = new Date(deliveryDateStr);
        deliveryDateTime.setHours(hours, minutes || 0, 0, 0);
        const deliveryTime = deliveryDateTime.getTime();
        
        if (deliveryTime < now) return 'critical';
        if ((deliveryTime - now) / (1000 * 60 * 60) <= 2) return 'urgent';
      } catch {}
    }
    
    // Urgent: Assigned but not picked up for more than 30 minutes
    if (isAssigned && deliveryStatus === 'assigned' && assignmentInfo?.assignedAt) {
      try {
        const assignedTime = new Date(assignmentInfo.assignedAt).getTime();
        const ageInMinutes = (now - assignedTime) / (1000 * 60);
        if (ageInMinutes > 30) return 'urgent';
      } catch {}
    }
    
    return 'normal';
  }, []);

  // Sync delivery boy top-level navigation sections (My Deliveries / Order History / Wallet)
  // with the Delivery page UI using the `section` query parameter.
  useEffect(() => {
    if (!user || user.role !== 'delivery_boy') return;

    const params = new URLSearchParams(location.search);
    const section = params.get('section') || 'my-deliveries';

    // Tab selection
    if (section === 'history') {
      setDeliveryBoyTab('completed');
    } else {
      // Default and all other sections focus on active deliveries
      setDeliveryBoyTab('active');
    }

    // Wallet modal shortcut
    if (section === 'wallet') {
      setShowWalletModal(true);
    }

    // Profile modal shortcut
    if (section === 'profile') {
      setShowProfileModal(true);
    }

    // Help modal shortcut
    if (section === 'help') {
      setShowHelpModal(true);
    }
  }, [location.search, user]);

  // Fetch wallet transactions when wallet modal opens
  useEffect(() => {
    if (user?.role === 'delivery_boy' && showWalletModal) {
      const fetchTransactions = async () => {
        try {
          setWalletTxLoading(true);
          setWalletPage(1);
          const data = await deliveryWalletService.getTransactions({ page: 1, limit: 20 });
          setWalletTransactions(data.transactions || []);
          setWalletPage(data.pagination?.page || 1);
          setWalletTotalPages(data.pagination?.totalPages || 1);
        } catch (error: any) {
          console.error('Error fetching wallet transactions:', error);
          showError('Error', error?.message || 'Failed to load wallet transactions.');
          setWalletTransactions([]);
        } finally {
          setWalletTxLoading(false);
        }
      };

      fetchTransactions();
    } else if (!showWalletModal) {
      // Reset transactions when modal closes
      setWalletTransactions([]);
      setWalletPage(1);
      setWalletTotalPages(1);
    }
  }, [user?.role, showWalletModal, showError]);

  // Helper function to get priority score for sorting
  const getPriorityScore = useCallback((order: Order, assignmentInfo?: any): number => {
    // Get explicit priority (high=3, medium=2, low=1, default=2)
    const explicitPriority = (order as any).priority || 'medium';
    const priorityScore = explicitPriority === 'high' ? 3 : explicitPriority === 'low' ? 1 : 2;
    
    // Get urgency level (critical=+3, urgent=+2, normal=0)
    const urgency = calculateUrgencyLevel(order, assignmentInfo);
    const urgencyScore = urgency === 'critical' ? 3 : urgency === 'urgent' ? 2 : 0;
    
    // Combined priority score (urgency takes precedence)
    return urgencyScore * 10 + priorityScore;
  }, [calculateUrgencyLevel]);

  // Filter and sort orders
  const filteredOrders = useMemo(() => {
    let filtered = orders.filter(order => {
      // Filter by delivery status
      if (statusFilter !== 'all') {
        const deliveryStatus = mapOrderStatusToDeliveryStatus(order.status);
        if (deliveryStatus !== statusFilter) {
          return false;
        }
      }
      
      // Filter by assignment status
      if (assignmentFilter !== 'all') {
        const isAssigned = !!orderAssignments[order.id];
        if (assignmentFilter === 'assigned' && !isAssigned) {
          return false;
        }
        if (assignmentFilter === 'unassigned' && isAssigned) {
          return false;
        }
      }
      
      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const orderNumber = (order.order_number || order.id || '').toLowerCase();
        const customerName = (order.customerName || '').toLowerCase();
        const address = formatAddress(order.deliveryAddress).toLowerCase();
        const deliveryBoyName = orderAssignments[order.id]?.deliveryBoyName?.toLowerCase() || '';
        
        if (!orderNumber.includes(searchLower) && 
            !customerName.includes(searchLower) && 
            !address.includes(searchLower) &&
            !deliveryBoyName.includes(searchLower)) {
          return false;
        }
      }
      
      return true;
    });
    
    // Sort orders
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority': {
          // Multi-factor priority sorting
          const aAssignment = orderAssignments[a.id];
          const bAssignment = orderAssignments[b.id];
          
          // 1. Priority score (urgency + explicit priority)
          const aPriorityScore = getPriorityScore(a, aAssignment);
          const bPriorityScore = getPriorityScore(b, bAssignment);
          if (aPriorityScore !== bPriorityScore) {
            return bPriorityScore - aPriorityScore; // Higher score first
          }
          
          // 2. Delivery date/time (earlier first)
          if (a.deliveryDate && b.deliveryDate) {
            const dateA = new Date(a.deliveryDate).getTime();
            const dateB = new Date(b.deliveryDate).getTime();
            if (dateA !== dateB) {
              return dateA - dateB;
            }
            
            // If same date, compare by time
            if (a.deliveryTime && b.deliveryTime) {
              const extractFirstTime = (timeStr: string): number => {
                const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
                if (timeMatch) {
                  const [, hours, minutes] = timeMatch;
                  return parseInt(hours, 10) * 60 + parseInt(minutes, 10);
                }
                return 0;
              };
              const timeA = extractFirstTime(a.deliveryTime);
              const timeB = extractFirstTime(b.deliveryTime);
              if (timeA !== timeB) {
                return timeA - timeB;
              }
            }
          }
          
          // 3. Assignment status (unassigned before assigned)
          const aAssigned = !!aAssignment;
          const bAssigned = !!bAssignment;
          if (aAssigned !== bAssigned) {
            return aAssigned ? 1 : -1; // Unassigned first
          }
          
          // 4. Creation date (oldest first)
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
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
    
    return filtered;
  }, [orders, statusFilter, assignmentFilter, searchTerm, sortBy, orderAssignments, getPriorityScore]);

  // Calculate statistics
  const deliveryStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = filteredOrders.filter(order => {
      const orderDate = new Date(order.deliveryDate).toISOString().split('T')[0];
      return orderDate === today;
    });
    
    return {
      total: filteredOrders.length,
      assigned: filteredOrders.filter(o => mapOrderStatusToDeliveryStatus(o.status) === 'assigned').length,
      inTransit: filteredOrders.filter(o => mapOrderStatusToDeliveryStatus(o.status) === 'in_transit').length,
      delivered: filteredOrders.filter(o => mapOrderStatusToDeliveryStatus(o.status) === 'delivered').length,
      today: todayOrders.length,
      revenue: todayOrders.reduce((sum, order) => sum + (order.total || 0), 0)
    };
  }, [filteredOrders]);

  // Pre-compute active vs completed orders for delivery boy view
  const riderActiveOrders = useMemo(
    () => filteredOrders.filter(order => mapOrderStatusToDeliveryStatus(order.status) !== 'delivered'),
    [filteredOrders]
  );

  const riderCompletedOrders = useMemo(
    () => filteredOrders.filter(order => mapOrderStatusToDeliveryStatus(order.status) === 'delivered'),
    [filteredOrders]
  );

  // Orders actually shown in the list, depending on role and tab selection.
  const ordersForDisplay = useMemo(() => {
    // For delivery boys, filter based on the selected tab (Active vs Completed)
    if (user?.role === 'delivery_boy') {
      return deliveryBoyTab === 'active' ? riderActiveOrders : riderCompletedOrders;
    }
    // For admin/staff, show all filtered orders
    return filteredOrders;
  }, [filteredOrders, user?.role, deliveryBoyTab, riderActiveOrders, riderCompletedOrders]);

  // Get active order (first non-delivered order)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const activeOrder = useMemo(() => {
    return filteredOrders.find(order => {
      const status = mapOrderStatusToDeliveryStatus(order.status);
      return status !== 'delivered';
    });
  }, [filteredOrders]);

  // Handle status update
  const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    try {
      setActionLoading(orderId);
      await orderService.updateOrder(orderId, { status: newStatus });
      showSuccess('Status Updated', 'Order status has been updated successfully.');
      await fetchDeliveryOrders();
    } catch (error: any) {
      console.error('Error updating order status:', error);
      showError('Error', error?.message || 'Failed to update order status. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // Map delivery status to order status
  const mapDeliveryStatusToOrderStatus = useCallback((deliveryStatus: 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'delayed'): Order['status'] => {
    switch (deliveryStatus) {
      case 'assigned':
        return 'ready';
      case 'picked_up':
        return 'preparing';
      case 'in_transit':
        return 'confirmed';
      case 'delivered':
        return 'delivered';
      case 'delayed':
        return 'cancelled'; // Map delayed to cancelled status
      default:
        return 'ready';
    }
  }, []);

  const handleDeliveryStatusUpdate = async (orderId: string, deliveryStatus: 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'delayed') => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const currentDeliveryStatus = mapOrderStatusToDeliveryStatus(order.status);

    // Enforce linear status transitions for delivery boys
    if (isDeliveryBoy) {
      const nextAllowedMap: Record<
        'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'delayed',
        Array<'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'delayed'>
      > = {
        assigned: ['picked_up'],
        picked_up: ['in_transit'],
        in_transit: ['delivered'],
        delivered: [],
        delayed: []
      };

      const allowedNext = nextAllowedMap[currentDeliveryStatus] || [];
      if (!allowedNext.includes(deliveryStatus)) {
        showError(
          'Action not allowed',
          'This status change is not allowed from the current step.'
        );
        return;
      }

      // Track orders we changed ourselves to avoid duplicate "status changed" notifications on next refresh
      selfUpdatedOrderIdsRef.current.add(orderId);
    }

    // If marking as delivered, show photo capture modal (proof required)
    if (deliveryStatus === 'delivered') {
      setOrderForPhoto(order);
      setShowPhotoModal(true);
      return;
    }
    
    // Phase 3: For delivery boys, use deliveryService.updateDeliveryStatus directly
    if (isDeliveryBoy && deliveryBoyId) {
      try {
        setActionLoading(orderId);
        
        // Get current location if available
        let coordinates: { lat: number; lng: number } | undefined;
        if (currentLocation) {
          coordinates = currentLocation;
        }
        
        // Map 'delayed' to 'cancelled' for the service (delayed is just a UI label)
        const serviceStatus = deliveryStatus === 'delayed' ? 'cancelled' : deliveryStatus;
        
        await deliveryService.updateDeliveryStatus(orderId, serviceStatus as 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled', {
          coordinates
        });
        
        showSuccess('Status Updated', 'Order status has been updated successfully.');
        await fetchDeliveryOrders();
      } catch (error: any) {
        console.error('Error updating delivery status:', error);
        showError('Error', error?.message || 'Failed to update order status. Please try again.');
      } finally {
        setActionLoading(null);
      }
    } else {
      // Admin/Staff: Use order service
      const orderStatus = mapDeliveryStatusToOrderStatus(deliveryStatus);
      await handleStatusUpdate(orderId, orderStatus);
    }
  };

  const handleToggleExpand = (orderId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const handleTakePhoto = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setOrderForPhoto(order);
      setShowPhotoModal(true);
    }
  };

  const handlePhotoCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showError('Error', 'Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showError('Error', 'Image size should be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Reset file input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleConfirmDelivery = async () => {
    if (!orderForPhoto) return;
    
    try {
      setActionLoading(orderForPhoto.id);
      
      // Phase 3: Upload photo and update delivery status
      let photoUrl: string | undefined;
      
      if (capturedPhoto) {
        // TODO: Upload photo to server and get URL
        // For now, we'll use the data URL directly
        // In production, you'd upload to a storage service (S3, Cloudinary, etc.)
        photoUrl = capturedPhoto;
      }
      
      // Get current location if available
      let coordinates: { lat: number; lng: number } | undefined;
      if (currentLocation) {
        coordinates = currentLocation;
      }
      
      // Phase 3: For delivery boys, use deliveryService.updateDeliveryStatus
      if (isDeliveryBoy && deliveryBoyId) {
        await deliveryService.updateDeliveryStatus(orderForPhoto.id, 'delivered', {
          deliveryPhotoUrl: photoUrl,
          coordinates,
          otpCode: deliveryOtp || undefined
        });
      } else {
        // Admin/Staff: Use order service
        await handleStatusUpdate(orderForPhoto.id, 'delivered');
      }
      
      setShowPhotoModal(false);
      setOrderForPhoto(null);
      setCapturedPhoto(null);
      setDeliveryOtp('');
      showSuccess('Delivery Completed', 'Order has been marked as delivered successfully.');
      
      // Refresh orders and wallet summary
      await fetchDeliveryOrders();
      
      // For delivery boys, add notification about earnings (if wallet summary is available)
      if (isDeliveryBoy && walletSummary) {
        // Fetch latest wallet summary to check for new earnings
        try {
          const latestSummary = await deliveryWalletService.getSummary();
          if (latestSummary.balance > walletSummary.balance) {
            const earnings = latestSummary.balance - walletSummary.balance;
            const message = `You earned ₹${earnings.toFixed(0)} from this delivery!`;
            saveDeliveryNotification('Earnings Credited', message);
          }
          setWalletSummary(latestSummary);
        } catch (error) {
          console.error('Error fetching wallet summary after delivery:', error);
        }

        // Refresh daily progress to show updated tier status
        try {
          const progress = await deliveryTargetTierService.getDailyProgress();
          setDailyProgress(progress);
          
          // If bonus was just credited, show notification
          if (progress.bonusAlreadyCredited && progress.currentTier) {
            const previousProgress = dailyProgress;
            if (!previousProgress?.bonusAlreadyCredited) {
              saveDeliveryNotification(
                'Target Bonus Earned!',
                `You completed ${progress.completedCount} orders and earned ₹${progress.currentTier.bonusAmount.toFixed(0)} bonus!`
              );
            }
          }
        } catch (error) {
          console.error('Error fetching daily progress after delivery:', error);
        }
      }
    } catch (error: any) {
      console.error('Error completing delivery:', error);
      showError('Error', error?.message || 'Failed to complete delivery. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCallCustomer = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await fetchDeliveryOrders();
      showSuccess('Sync Complete', 'Delivery orders have been synced successfully.');
    } catch (error) {
      showError('Sync Failed', 'Failed to sync orders. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle assign order
  const handleAssignOrder = (order: Order) => {
    setOrderToAssign(order);
    setSelectedDeliveryBoyId('');
    setShowAssignModal(true);
  };

  // Handler for reassigning order (opens reassign modal)
  const handleReassignOrder = (order: Order) => {
    setOrderToReassign(order);
    setReassignDeliveryBoyId('');
    setShowReassignModal(true);
  };

  // Handler for viewing assignment history
  const handleViewHistory = async (order: Order) => {
    setOrderForHistory(order);
    setShowHistoryModal(true);
    setLoadingHistory(true);
    try {
      const history = await deliveryService.getAssignmentHistory(order.id);
      setAssignmentHistory(history);
    } catch (error) {
      console.error('Error fetching assignment history:', error);
      showError('Error', 'Failed to load assignment history');
    } finally {
      setLoadingHistory(false);
    }
  };

  // Confirm assignment
  const handleConfirmAssignment = async () => {
    if (!orderToAssign || !selectedDeliveryBoyId) {
      showError('Error', 'Please select a delivery boy');
      return;
    }

    try {
      setActionLoading(orderToAssign.id);
      
      // Extract address coordinates if available
      let coordinates: { lat: number; lng: number } | undefined;
      if (orderToAssign.deliveryAddress) {
        try {
          const addressObj = typeof orderToAssign.deliveryAddress === 'string' 
            ? JSON.parse(orderToAssign.deliveryAddress) 
            : orderToAssign.deliveryAddress;
          if (addressObj.latitude && addressObj.longitude) {
            coordinates = { lat: addressObj.latitude, lng: addressObj.longitude };
          }
        } catch {
          // Coordinates not available, continue without them
        }
      }

      // Calculate items count from order items
      let itemsCount = 0;
      if (orderToAssign.items && Array.isArray(orderToAssign.items)) {
        if (orderToAssign.items.length > 0 && typeof orderToAssign.items[0] === 'string') {
          // Items are strings
          itemsCount = orderToAssign.items.length;
        } else {
          // Items are objects - sum up quantities
          itemsCount = orderToAssign.items.reduce((sum: number, item: any) => 
            sum + (item.quantity || 1), 0
          );
        }
      }

      // Get total amount - use the order's total if available and > 0, otherwise let backend fetch it
      const totalAmount = (orderToAssign.total !== undefined && orderToAssign.total !== null && orderToAssign.total > 0) 
        ? orderToAssign.total 
        : undefined; // Let backend fetch from orders table if not available

      await deliveryService.assignOrderToDeliveryBoy(
        orderToAssign.id,
        selectedDeliveryBoyId,
        {
          customerName: orderToAssign.customerName || '',
          customerPhone: orderToAssign.customerPhone || '',
          customerAddress: formatAddress(orderToAssign.deliveryAddress),
          deliveryDate: orderToAssign.deliveryDate || new Date().toISOString().split('T')[0],
          deliveryTime: orderToAssign.deliveryTime || '12:00',
          priority: 'medium',
          specialInstructions: orderToAssign.notes || undefined,
          coordinates,
          totalAmount: totalAmount, // Pass undefined if not available, backend will fetch it
          itemsCount: itemsCount > 0 ? itemsCount : undefined // Pass undefined if 0, backend will fetch it
        }
      );

      showSuccess('Order Assigned', 'Order has been assigned to delivery boy successfully.');
      setShowAssignModal(false);
      setOrderToAssign(null);
      setSelectedDeliveryBoyId('');
      
      // Refresh orders and assignments
      await fetchDeliveryOrders();
    } catch (error: any) {
      console.error('Error assigning order:', error);
      showError('Error', error?.message || 'Failed to assign order. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // Phase 2: Bulk assignment handler
  const handleBulkAssign = async () => {
    if (selectedOrdersForBulk.size === 0) {
      showError('Error', 'Please select at least one order');
      return;
    }
    if (!bulkAssignDeliveryBoyId) {
      showError('Error', 'Please select a delivery boy');
      return;
    }

    try {
      setActionLoading('bulk');
      const result = await deliveryService.bulkAssignOrders(
        Array.from(selectedOrdersForBulk),
        bulkAssignDeliveryBoyId,
        bulkAssignPriority
      );

      showSuccess(
        'Bulk Assignment Complete',
        `${result.data.assigned.length} orders assigned, ${result.data.updated.length} updated, ${result.data.failed.length} failed`
      );
      setShowBulkAssignModal(false);
      setSelectedOrdersForBulk(new Set());
      setBulkAssignDeliveryBoyId('');
      await fetchDeliveryOrders();
    } catch (error: any) {
      console.error('Error bulk assigning orders:', error);
      showError('Error', error?.message || 'Failed to bulk assign orders');
    } finally {
      setActionLoading(null);
    }
  };

  // Phase 2: Reassignment handler
  const handleReassign = async () => {
    if (!orderToReassign || !reassignDeliveryBoyId) {
      showError('Error', 'Please select a delivery boy');
      return;
    }

    try {
      setActionLoading(orderToReassign.id);
      await deliveryService.reassignOrder(
        orderToReassign.id,
        reassignDeliveryBoyId,
        reassignReason
      );

      showSuccess('Order Reassigned', 'Order has been reassigned successfully');
      setShowReassignModal(false);
      setOrderToReassign(null);
      setReassignDeliveryBoyId('');
      setReassignReason('');
      await fetchDeliveryOrders();
    } catch (error: any) {
      console.error('Error reassigning order:', error);
      showError('Error', error?.message || 'Failed to reassign order');
    } finally {
      setActionLoading(null);
    }
  };

  // Phase 2: Fetch workload
  const fetchWorkload = useCallback(async () => {
    try {
      setLoadingWorkload(true);
      const workload = await deliveryService.getDeliveryBoyWorkload();
      setDeliveryBoyWorkload(workload);
    } catch (error) {
      console.error('Error fetching workload:', error);
      showError('Error', 'Failed to load delivery boy workload');
    } finally {
      setLoadingWorkload(false);
    }
  }, [showError]);

  // Phase 2: Fetch assignment history
  const fetchAssignmentHistory = useCallback(async (orderId: string) => {
    try {
      setLoadingHistory(true);
      const history = await deliveryService.getAssignmentHistory(orderId);
      setAssignmentHistory(history);
    } catch (error) {
      console.error('Error fetching assignment history:', error);
      showError('Error', 'Failed to load assignment history');
    } finally {
      setLoadingHistory(false);
    }
  }, [showError]);

  // Click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(target as Node)) {
        setShowStatusDropdown(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(target as Node)) {
        setShowSortDropdown(false);
      }
      if (assignmentDropdownRef.current && !assignmentDropdownRef.current.contains(target as Node)) {
        setShowAssignmentDropdown(false);
      }
      if (assignDeliveryBoyDropdownRef.current && !assignDeliveryBoyDropdownRef.current.contains(target as Node)) {
        setShowAssignDeliveryBoyDropdown(false);
      }
      if (bulkAssignDeliveryBoyDropdownRef.current && !bulkAssignDeliveryBoyDropdownRef.current.contains(target as Node)) {
        setShowBulkAssignDeliveryBoyDropdown(false);
      }
      if (bulkAssignPriorityDropdownRef.current && !bulkAssignPriorityDropdownRef.current.contains(target as Node)) {
        setShowBulkAssignPriorityDropdown(false);
      }
      if (reassignDeliveryBoyDropdownRef.current && !reassignDeliveryBoyDropdownRef.current.contains(target as Node)) {
        setShowReassignDeliveryBoyDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch workload when workload view opens
  useEffect(() => {
    if (showWorkloadView) {
      fetchWorkload();
    }
  }, [showWorkloadView, fetchWorkload]);

  // Fetch history when history modal opens
  useEffect(() => {
    if (showHistoryModal && orderForHistory) {
      fetchAssignmentHistory(orderForHistory.id);
    }
  }, [showHistoryModal, orderForHistory, fetchAssignmentHistory]);

  const getStatusBadge = (order: Order) => {
    const deliveryStatus = mapOrderStatusToDeliveryStatus(order.status);
    const statusConfig = {
      assigned: { 
        color: 'bg-blue-500 text-white', 
        icon: Clock,
        label: 'Ready for Pickup',
        bgColor: 'bg-blue-500'
      },
      picked_up: { 
        color: 'bg-yellow-500 text-white', 
        icon: Package,
        label: 'Picked Up',
        bgColor: 'bg-yellow-500'
      },
      in_transit: { 
        color: 'bg-purple-500 text-white', 
        icon: Truck,
        label: 'Out for Delivery',
        bgColor: 'bg-purple-500'
      },
      delivered: { 
        color: 'bg-green-500 text-white', 
        icon: CheckCircle,
        label: 'Delivered',
        bgColor: 'bg-green-500'
      },
      delayed: { 
        color: 'bg-red-500 text-white', 
        icon: AlertTriangle,
        label: 'Delayed / Failed',
        bgColor: 'bg-red-500'
      }
    };

    const config = statusConfig[deliveryStatus] || statusConfig.assigned;
    const Icon = config.icon;

  return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color} shadow-sm`}>
        <Icon className="h-3.5 w-3.5" />
        <span>{config.label}</span>
      </span>
    );
  };

  // Parse local date/time similar to OrderTimeline component
  const parseLocalDateTime = (dateTimeStr: string): Date => {
    if (!dateTimeStr) return new Date();

    let cleanStr = dateTimeStr.trim();

    // Remove any milliseconds if present: "2025-11-02 14:20:00.123" -> "2025-11-02 14:20:00"
    if (cleanStr.includes('.')) {
      const parts = cleanStr.split('.');
      if (parts.length > 1) {
        const mainPart = parts[0];
        const rest = parts.slice(1).join('.');
        if (!rest.includes(':')) {
          cleanStr = mainPart;
        }
      }
    }

    // Handle common "YYYY-MM-DD HH:MM:SS" format (SQLite style)
    if (cleanStr.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
      const [datePart, timePart] = cleanStr.split(' ');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hours, minutes, seconds] = timePart.split(':').map(Number);
      return new Date(year, month - 1, day, hours, minutes, seconds);
    }

    // ISO format handling
    if (cleanStr.includes('T')) {
      if (cleanStr.endsWith('Z') || cleanStr.match(/[+-]\d{2}:\d{2}$/)) {
        return new Date(cleanStr);
      } else {
        const isoParts = cleanStr.split('T');
        if (isoParts.length === 2) {
          const [datePart, timePart] = isoParts;
          const [year, month, day] = datePart.split('-').map(Number);
          const [hours, minutes, seconds = '0'] = timePart.split(':').map(s => s.split('.')[0]);
          return new Date(Date.UTC(year, month - 1, day, Number(hours), Number(minutes), Number(seconds)));
        }
      }
    }

    let parsed = new Date(cleanStr + ' UTC');
    if (isNaN(parsed.getTime())) {
      parsed = new Date(cleanStr);
    }

    if (isNaN(parsed.getTime())) {
      console.warn('Could not parse date:', dateTimeStr, 'using current time');
      return new Date();
    }
    return parsed;
  };

  // Get status progress indicator with full order lifecycle statuses and timestamps
  const getStatusProgress = useCallback((order: Order, assignmentInfo?: DeliveryCardProps['assignmentInfo']) => {
    const statusOrder = ['pending', 'confirmed', 'preparing', 'ready', 'delivered'] as const;
    type StatusKey = (typeof statusOrder)[number];
    
    const currentStatus = order.status as StatusKey;
    const currentStatusIndex = statusOrder.indexOf(currentStatus);
    
    // Get timestamps for each status (similar to OrderTimeline logic)
    const getStatusTimestamp = (status: StatusKey, index: number): { date: Date | null; isExact: boolean } => {
      let createdAt: Date;
      let updatedAt: Date;

      try {
        createdAt = parseLocalDateTime((order as any).createdAt || '');
        updatedAt = parseLocalDateTime((order as any).updatedAt || '');

        if (isNaN(createdAt.getTime())) {
          createdAt = new Date();
        }
        if (isNaN(updatedAt.getTime())) {
          updatedAt = new Date();
        }
      } catch (error) {
        console.error('Error parsing dates for status progress:', error);
        createdAt = new Date();
        updatedAt = new Date();
      }

      if (status === 'pending') {
        return { date: createdAt, isExact: true };
      }

      if (index > currentStatusIndex) {
        return { date: null, isExact: false };
      }

      if (index === currentStatusIndex) {
        return { date: updatedAt, isExact: true };
      }

      // Estimate timestamp for completed statuses
      const timeDiff = updatedAt.getTime() - createdAt.getTime();
      const progressRatio = (index + 1) / (currentStatusIndex + 1 || 1);
      const estimatedTime = createdAt.getTime() + timeDiff * progressRatio;
      return { date: new Date(estimatedTime), isExact: false };
    };

    const formatTimestamp = (date: Date | null, isExact: boolean): string => {
      if (!date || isNaN(date.getTime())) return 'Not yet';
      // Compact format: "2 Nov, 8:00 PM" instead of full date/time
      try {
        return date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: 'Asia/Kolkata'
        });
      } catch {
        return formatISTDateTime(date, { includeTime: true, includeDate: true });
      }
    };

    const statusLabels: Record<StatusKey, string> = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      preparing: 'Preparing',
      ready: 'Ready',
      delivered: 'Delivered'
    };

    const statusColors: Record<StatusKey, { bg: string; border: string; line: string }> = {
      pending: { bg: 'bg-green-500', border: 'border-green-500', line: 'bg-green-400' },
      confirmed: { bg: 'bg-blue-500', border: 'border-blue-500', line: 'bg-blue-400' },
      preparing: { bg: 'bg-yellow-500', border: 'border-yellow-500', line: 'bg-yellow-400' },
      ready: { bg: 'bg-purple-500', border: 'border-purple-500', line: 'bg-purple-400' },
      delivered: { bg: 'bg-gray-500', border: 'border-gray-500', line: 'bg-gray-400' }
    };

    const steps = statusOrder.map((status, index) => {
      const isCompleted = currentStatusIndex >= index;
      const isActive = currentStatus === status;
      const timestampInfo = getStatusTimestamp(status, index);
      const colors = statusColors[status];

      return {
        status,
        label: statusLabels[status],
        completed: isCompleted,
        isActive,
        timestamp: formatTimestamp(timestampInfo.date, timestampInfo.isExact),
        isExact: timestampInfo.isExact,
        colors
      };
    });

    return (
      <div className="w-full py-0.5 sm:py-0.5">
        {/* Horizontal scroll container for mobile, full width for desktop */}
        <div className="overflow-x-auto -mx-1 sm:mx-0 px-1 sm:px-0 md:overflow-visible">
          <div className="flex items-start gap-1 sm:gap-1.5 md:gap-2 lg:gap-3 min-w-max sm:min-w-0 w-full md:justify-between">
            {steps.map((step, index) => {
              // Determine if line segments should be colored (green) or grey
              // The line segment AFTER a step should be green only if that step is completed
              // The line segment BEFORE a step should be green only if the previous step is completed
              const isPreviousStepCompleted = index > 0 && steps[index - 1].completed;
              const isCurrentStepCompleted = step.completed;
              
              return (
                <React.Fragment key={step.status}>
                  <div className="flex flex-col items-center flex-shrink-0 min-w-[60px] sm:min-w-[70px] md:flex-1">
                    {/* Node + connecting rail */}
                    <div className="flex items-center w-full">
                      {/* Left rail segment - green if previous step is completed */}
                      {index > 0 && (
                        <div className={`h-1 rounded-full flex-1 mr-1 transition-all ${
                          isPreviousStepCompleted
                            ? 'bg-green-500'
                            : 'bg-gray-200 dark:bg-gray-700'
                        }`} />
                      )}
                      {/* Status node */}
                      <div className={`w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] md:text-[11px] font-bold transition-all shadow-sm border flex-shrink-0 ${
                        step.completed 
                          ? `${step.colors.bg} text-white ${step.colors.border}` 
                          : step.isActive
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-500'
                      }`}>
                        {step.completed ? <CheckCircle className="h-2.5 w-2.5 md:h-3 md:w-3" /> : index + 1}
                      </div>
                      {/* Right rail segment - green only if current step is completed */}
                      {index < steps.length - 1 && (
                        <div className={`h-1 rounded-full flex-1 ml-1 transition-all ${
                          isCurrentStepCompleted
                            ? 'bg-green-500'
                            : 'bg-gray-200 dark:bg-gray-700'
                        }`} />
                      )}
                    </div>
                    {/* Label and Timestamp */}
                    <div className="flex flex-col items-center gap-0.5 mt-0.5 md:mt-1">
                      <span className={`text-[10px] sm:text-[11px] md:text-xs font-semibold text-center px-0.5 leading-tight whitespace-nowrap ${
                        step.completed || step.isActive
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {step.label}
                      </span>
                      {step.timestamp && step.timestamp !== 'Not yet' && (
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="flex items-center gap-0.5">
                            <Clock className="h-2 w-2 md:h-2.5 md:w-2.5 text-gray-400" />
                            <span className={`text-[8px] sm:text-[9px] md:text-[10px] whitespace-nowrap ${
                              step.completed ? 'text-gray-600 dark:text-gray-400' : 'text-gray-500 dark:text-gray-500'
                            }`}>
                              {step.timestamp}
                            </span>
                          </div>
                          {!step.isExact && step.completed && (
                            <span className="text-[7px] md:text-[8px] text-gray-400 italic">(approx)</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    );
  }, []); // formatISTDateTime is a stable function, doesn't need to be in dependencies

  // Phase 3: Check if current user is a delivery boy (for UI rendering)
  const isDeliveryBoy = user?.role === 'delivery_boy';
  const deliveryBoyId = user?.id;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {isDeliveryBoy ? 'Loading your orders...' : 'Loading delivery orders...'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`pb-6 ${isDeliveryBoy && dailyProgress && dailyProgress.tiers.length > 0 ? 'pb-24 sm:pb-6' : ''}`}>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900/95 shadow-sm border-b border-gray-200 dark:border-gray-800/80 backdrop-blur-sm">
        <div className="w-full px-3 sm:px-4 lg:px-6">
          <div className="py-3">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-3">
              {/* Left section: Title and description */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-semibold sm:font-bold tracking-tight text-gray-900 dark:text-white">
                  {isDeliveryBoy ? 'My Deliveries' : 'Delivery Management'}
                </h1>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 leading-snug">
                  {isDeliveryBoy 
                    ? `Welcome, ${user?.name || 'Delivery Partner'}. Manage your assigned orders.`
                    : 'Manage delivery orders and track delivery status'}
                </p>
              </div>

              {/* Middle section: Active/Completed toggle (only for delivery boys, only on laptop) */}
              {isDeliveryBoy && (
                <div className="lg:flex hidden items-center">
                  <div className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 p-1">
                    <button
                      type="button"
                      onClick={() => setDeliveryBoyTab('active')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors min-w-[96px] text-center ${
                        deliveryBoyTab === 'active'
                          ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      Active ({riderActiveOrders.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryBoyTab('completed')}
                      className={`ml-1 px-3 py-1.5 text-xs font-semibold rounded-full transition-colors min-w-[96px] text-center ${
                        deliveryBoyTab === 'completed'
                          ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      Completed ({riderCompletedOrders.length})
                    </button>
                  </div>
                </div>
              )}

              {/* Right section: Wallet banner (only for delivery boys, only on laptop) */}
                {isDeliveryBoy && walletSummary && (
                <div className="lg:flex hidden items-center">
                  <button
                    type="button"
                    onClick={() => setShowWalletModal(true)}
                    className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 dark:border-emerald-700 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 px-3 py-2 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-base font-bold">
                        ₹
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                          Wallet · Available Balance
                        </span>
                        <span className="text-sm sm:text-base font-bold text-emerald-700 dark:text-emerald-300 truncate">
                          ₹{walletSummary.balance.toFixed(0)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end text-[11px] text-gray-600 dark:text-gray-400">
                      <span>
                        Today: <span className="font-semibold text-gray-900 dark:text-gray-100">₹{walletSummary.todayEarnings.toFixed(0)}</span>
                      </span>
                      <span>
                        This week: <span className="font-semibold text-gray-900 dark:text-gray-100">₹{walletSummary.weekEarnings.toFixed(0)}</span>
                      </span>
                    </div>
                  </button>
                </div>
              )}

              {/* Mobile/Tablet: Wallet and toggle below title (vertical layout) */}
              {isDeliveryBoy && walletSummary && (
                <div className="lg:hidden">
                  <button
                    type="button"
                    onClick={() => setShowWalletModal(true)}
                    className="mt-3 w-full sm:w-auto flex items-center justify-between gap-3 rounded-xl border border-emerald-200 dark:border-emerald-700 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 px-3 py-2 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-base font-bold">
                        ₹
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                          Wallet · Available Balance
                        </span>
                        <span className="text-sm sm:text-base font-bold text-emerald-700 dark:text-emerald-300 truncate">
                          ₹{walletSummary.balance.toFixed(0)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end text-[11px] text-gray-600 dark:text-gray-400">
                      <span>
                        Today: <span className="font-semibold text-gray-900 dark:text-gray-100">₹{walletSummary.todayEarnings.toFixed(0)}</span>
                      </span>
                      <span>
                        This week: <span className="font-semibold text-gray-900 dark:text-gray-100">₹{walletSummary.weekEarnings.toFixed(0)}</span>
                      </span>
                    </div>
                  </button>
                </div>
                )}

              {/* Mobile/Tablet: Active/Completed toggle below wallet */}
                {isDeliveryBoy && (
                <div className="lg:hidden mt-3 inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 p-1">
                    <button
                      type="button"
                      onClick={() => setDeliveryBoyTab('active')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors min-w-[96px] text-center ${
                        deliveryBoyTab === 'active'
                          ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      Active ({riderActiveOrders.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryBoyTab('completed')}
                      className={`ml-1 px-3 py-1.5 text-xs font-semibold rounded-full transition-colors min-w-[96px] text-center ${
                        deliveryBoyTab === 'completed'
                          ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      Completed ({riderCompletedOrders.length})
                    </button>
                  </div>
                )}
            </div>

            {/* Stats - Horizontal Scroll on Mobile */}
            <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0 pb-1">
              <div className={`inline-flex sm:grid gap-3 ${isDeliveryBoy ? 'sm:grid-cols-2 md:grid-cols-4' : 'sm:grid-cols-2 md:grid-cols-5'} min-w-max sm:min-w-0`}>
                <Card className="min-w-[150px] sm:min-w-0 flex-shrink-0 sm:flex-shrink shadow-sm hover:shadow-md transition-shadow border-gray-200/60">
                <CardContent className="px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide leading-tight">{isDeliveryBoy ? 'My Orders' : 'Total Deliveries'}</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-none mt-1">
                        {deliveryStats.total}
                      </p>
                    </div>
                    <div className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <Truck className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {!isDeliveryBoy && (
                <Card className="min-w-[150px] sm:min-w-0 flex-shrink-0 sm:flex-shrink shadow-sm hover:shadow-md transition-shadow border-amber-200/60">
                  <CardContent className="px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide leading-tight">Unassigned</p>
                        <p className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-500 leading-none mt-1">
                          {orders.filter(o => !orderAssignments[o.id] && o.status === 'ready').length}
                        </p>
                      </div>
                      <div className="p-1.5 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!isDeliveryBoy && (
                <Card className="min-w-[150px] sm:min-w-0 flex-shrink-0 sm:flex-shrink shadow-sm hover:shadow-md transition-shadow border-blue-200/60">
                  <CardContent className="px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide leading-tight">Assigned Orders</p>
                        <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-500 leading-none mt-1">
                          {Object.keys(orderAssignments).length}
                        </p>
                      </div>
                      <div className="p-1.5 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                        <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="shadow-sm hover:shadow-md transition-shadow border-purple-200/60">
              <CardContent className="px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide leading-tight">{isDeliveryBoy ? 'In Progress' : 'In Transit'}</p>
                      <p className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-500 leading-none mt-1">
                        {deliveryStats.inTransit}
                      </p>
                    </div>
                    <div className="p-1.5 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                      <Navigation className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="min-w-[150px] sm:min-w-0 flex-shrink-0 sm:flex-shrink shadow-sm hover:shadow-md transition-shadow border-green-200/60">
                <CardContent className="px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide leading-tight">{isDeliveryBoy ? 'Completed' : 'Today\'s Revenue'}</p>
                      <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-500 leading-none mt-1">
                        {isDeliveryBoy ? deliveryStats.delivered : `₹${deliveryStats.revenue.toFixed(0)}`}
                      </p>
                    </div>
                    <div className="p-1.5 bg-green-100 dark:bg-green-900/20 rounded-lg">
                      {isDeliveryBoy ? (
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                      ) : (
                        <IndianRupee className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-5 space-y-4">
        {/* Enhanced Filters - Hidden for delivery boys, simplified for mobile */}
        {!isDeliveryBoy && (
          <Card className="bg-transparent shadow-none border-0 p-0">
            <CardContent className="p-0 bg-transparent">
            {/* Desktop: Single horizontal row layout */}
            <div className="hidden md:flex items-center gap-3">
              {/* Search Bar */}
              <div className="flex-1 min-w-0">
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<Search className="h-4 w-4" />}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      // Search is handled automatically via filteredOrders
                    }
                  }}
                  className="h-10"
                />
              </div>
              
              {/* Assignment Filter - Custom Dropdown (only for admin/staff) */}
              {user && (user.role === 'super_admin' || user.role === 'admin' || user.role === 'staff') && (
                <div className="relative flex-shrink-0" ref={assignmentDropdownRef}>
                  <button
                    onClick={() => {
                      setShowAssignmentDropdown(!showAssignmentDropdown);
                      setShowStatusDropdown(false);
                      setShowSortDropdown(false);
                    }}
                    className="flex items-center justify-between h-10 min-w-[160px] bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md px-3 hover:bg-gray-100 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 cursor-pointer shadow-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <UserPlus className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                        {assignmentFilter === 'all' && 'All Orders'}
                        {assignmentFilter === 'assigned' && 'Assigned'}
                        {assignmentFilter === 'unassigned' && 'Unassigned'}
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform duration-300 flex-shrink-0 ml-2 ${showAssignmentDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Assignment Filter Dropdown Menu */}
                  {showAssignmentDropdown && (
                    <div className="absolute top-full left-0 mt-2 min-w-[160px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl dark:shadow-black/40 z-50 overflow-hidden backdrop-blur-sm">
                      <div className="py-1.5">
                        {[
                          { value: 'all', label: 'All Orders' },
                          { value: 'assigned', label: 'Assigned' },
                          { value: 'unassigned', label: 'Unassigned' }
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setAssignmentFilter(option.value as 'all' | 'assigned' | 'unassigned');
                              setShowAssignmentDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-all duration-200 flex items-center justify-between ${
                              assignmentFilter === option.value 
                                ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold border-l-2 border-primary-500 dark:border-primary-400' 
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            }`}
                          >
                            <span>{option.label}</span>
                            {assignmentFilter === option.value && (
                              <div className="w-2 h-2 rounded-full bg-primary-500 dark:bg-primary-400"></div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Status Filter - Custom Dropdown */}
              <div className="relative flex-shrink-0" ref={statusDropdownRef}>
                <button
                  onClick={() => {
                    setShowStatusDropdown(!showStatusDropdown);
                    setShowSortDropdown(false);
                    setShowAssignmentDropdown(false);
                  }}
                  className="flex items-center justify-between h-10 min-w-[140px] bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md px-3 hover:bg-gray-100 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                      {statusFilter === 'all' && 'All Status'}
                      {statusFilter === 'assigned' && 'Assigned'}
                      {statusFilter === 'picked_up' && 'Picked Up'}
                      {statusFilter === 'in_transit' && 'In Transit'}
                      {statusFilter === 'delivered' && 'Delivered'}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform duration-300 flex-shrink-0 ml-2 ${showStatusDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Status Dropdown Menu */}
                {showStatusDropdown && (
                  <div className="absolute top-full left-0 mt-2 min-w-[140px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl dark:shadow-black/40 z-50 overflow-hidden backdrop-blur-sm">
                    <div className="py-1.5">
                      {[
                        { value: 'all', label: 'All Status' },
                        { value: 'assigned', label: 'Assigned' },
                        { value: 'picked_up', label: 'Picked Up' },
                        { value: 'in_transit', label: 'In Transit' },
                        { value: 'delivered', label: 'Delivered' }
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setStatusFilter(option.value as any);
                            setShowStatusDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-all duration-200 flex items-center justify-between ${
                            statusFilter === option.value 
                              ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold border-l-2 border-primary-500 dark:border-primary-400' 
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                          }`}
                        >
                          <span>{option.label}</span>
                          {statusFilter === option.value && (
                            <div className="w-2 h-2 rounded-full bg-primary-500 dark:bg-primary-400"></div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Sort Options - Custom Dropdown */}
              <div className="relative flex-shrink-0" ref={sortDropdownRef}>
                <button
                  onClick={() => {
                    setShowSortDropdown(!showSortDropdown);
                    setShowStatusDropdown(false);
                    setShowAssignmentDropdown(false);
                  }}
                  className="flex items-center justify-between h-10 min-w-[180px] bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md px-3 hover:bg-gray-100 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <ArrowUpDown className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                      {sortBy === 'priority' && 'Priority'}
                      {sortBy === 'newest' && 'Newest'}
                      {sortBy === 'oldest' && 'Oldest'}
                      {sortBy === 'total' && 'Total'}
                      {sortBy === 'customer' && 'Customer'}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform duration-300 flex-shrink-0 ml-2 ${showSortDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Sort Dropdown Menu */}
                {showSortDropdown && (
                  <div className="absolute top-full left-0 mt-2 min-w-[180px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl dark:shadow-black/40 z-50 overflow-hidden backdrop-blur-sm">
                    <div className="py-1.5">
                      {[
                        { value: 'priority', label: 'Priority (Urgent First)', icon: Zap },
                        { value: 'oldest', label: 'Oldest First', icon: Clock },
                        { value: 'newest', label: 'Newest First', icon: Clock },
                        { value: 'total', label: 'Total Amount', icon: IndianRupee },
                        { value: 'customer', label: 'Customer Name', icon: User }
                      ].map((option) => {
                        const Icon = option.icon;
                        return (
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
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span>{option.label}</span>
                          </div>
                          {sortBy === option.value && (
                            <div className="w-2 h-2 rounded-full bg-primary-500 dark:bg-primary-400"></div>
                          )}
                        </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Results Count */}
              <div className="text-xs text-gray-600 dark:text-gray-400 font-medium whitespace-nowrap">
                {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
              </div>
            </div>

            {/* Mobile: Stacked layout */}
            <div className="md:hidden flex flex-col gap-3">
              {/* Search Bar */}
              <div className="flex-1">
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<Search className="h-4 w-4" />}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      // Search is handled automatically via filteredOrders
                    }
                  }}
                />
              </div>
              
              {/* Filter and Sort Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Assignment Filter - Custom Dropdown (only for admin/staff) */}
                {user && (user.role === 'super_admin' || user.role === 'admin' || user.role === 'staff') && (
                  <div className="relative w-full sm:w-auto flex-1 min-w-[140px]" ref={assignmentDropdownRef}>
                    <button
                      onClick={() => {
                        setShowAssignmentDropdown(!showAssignmentDropdown);
                        setShowStatusDropdown(false);
                        setShowSortDropdown(false);
                      }}
                      className="flex items-center justify-between h-10 w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md px-3 hover:bg-gray-100 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 cursor-pointer shadow-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <UserPlus className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                          {assignmentFilter === 'all' && 'All Orders'}
                          {assignmentFilter === 'assigned' && 'Assigned'}
                          {assignmentFilter === 'unassigned' && 'Unassigned'}
                        </span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform duration-300 flex-shrink-0 ml-2 ${showAssignmentDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {/* Assignment Filter Dropdown Menu */}
                    {showAssignmentDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl dark:shadow-black/40 z-50 overflow-hidden backdrop-blur-sm">
                        <div className="py-1.5">
                          {[
                            { value: 'all', label: 'All Orders' },
                            { value: 'assigned', label: 'Assigned' },
                            { value: 'unassigned', label: 'Unassigned' }
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                setAssignmentFilter(option.value as 'all' | 'assigned' | 'unassigned');
                                setShowAssignmentDropdown(false);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-sm transition-all duration-200 flex items-center justify-between ${
                                assignmentFilter === option.value 
                                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold border-l-2 border-primary-500 dark:border-primary-400' 
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                              }`}
                            >
                              <span>{option.label}</span>
                              {assignmentFilter === option.value && (
                                <div className="w-2 h-2 rounded-full bg-primary-500 dark:bg-primary-400"></div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Status Filter - Custom Dropdown */}
                <div className="relative w-full sm:w-auto flex-1 min-w-[140px]" ref={statusDropdownRef}>
                  <button
                    onClick={() => {
                      setShowStatusDropdown(!showStatusDropdown);
                      setShowSortDropdown(false);
                      setShowAssignmentDropdown(false);
                    }}
                    className="flex items-center justify-between h-10 w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md px-3 hover:bg-gray-100 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 cursor-pointer shadow-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                        {statusFilter === 'all' && 'All Status'}
                        {statusFilter === 'assigned' && 'Assigned'}
                        {statusFilter === 'picked_up' && 'Picked Up'}
                        {statusFilter === 'in_transit' && 'In Transit'}
                        {statusFilter === 'delivered' && 'Delivered'}
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform duration-300 flex-shrink-0 ml-2 ${showStatusDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Status Dropdown Menu */}
                  {showStatusDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl dark:shadow-black/40 z-50 overflow-hidden backdrop-blur-sm">
                      <div className="py-1.5">
                        {[
                          { value: 'all', label: 'All Status' },
                          { value: 'assigned', label: 'Assigned' },
                          { value: 'picked_up', label: 'Picked Up' },
                          { value: 'in_transit', label: 'In Transit' },
                          { value: 'delivered', label: 'Delivered' }
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setStatusFilter(option.value as any);
                              setShowStatusDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-all duration-200 flex items-center justify-between ${
                              statusFilter === option.value 
                                ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold border-l-2 border-primary-500 dark:border-primary-400' 
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            }`}
                          >
                            <span>{option.label}</span>
                            {statusFilter === option.value && (
                              <div className="w-2 h-2 rounded-full bg-primary-500 dark:bg-primary-400"></div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Sort Options - Custom Dropdown */}
                <div className="relative w-full sm:w-auto flex-1 min-w-[140px]" ref={sortDropdownRef}>
                  <button
                    onClick={() => {
                      setShowSortDropdown(!showSortDropdown);
                      setShowStatusDropdown(false);
                      setShowAssignmentDropdown(false);
                    }}
                    className="flex items-center justify-between h-10 w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md px-3 hover:bg-gray-100 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 cursor-pointer shadow-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <ArrowUpDown className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                        {sortBy === 'priority' && 'Priority'}
                        {sortBy === 'newest' && 'Newest'}
                        {sortBy === 'oldest' && 'Oldest'}
                        {sortBy === 'total' && 'Total'}
                        {sortBy === 'customer' && 'Customer'}
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform duration-300 flex-shrink-0 ml-2 ${showSortDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Sort Dropdown Menu */}
                  {showSortDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl dark:shadow-black/40 z-50 overflow-hidden backdrop-blur-sm">
                      <div className="py-1.5">
                      {[
                        { value: 'priority', label: 'Priority (Urgent First)', icon: Zap },
                        { value: 'oldest', label: 'Oldest First', icon: Clock },
                        { value: 'newest', label: 'Newest First', icon: Clock },
                        { value: 'total', label: 'Total Amount', icon: IndianRupee },
                        { value: 'customer', label: 'Customer Name', icon: User }
                        ].map((option) => {
                          const Icon = option.icon;
                          return (
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
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                <span>{option.label}</span>
                              </div>
                              {sortBy === option.value && (
                                <div className="w-2 h-2 rounded-full bg-primary-500 dark:bg-primary-400"></div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Results Count - Mobile */}
                <div className="w-full text-xs text-gray-600 dark:text-gray-400 font-medium text-center pt-1 border-t border-gray-200 dark:border-gray-700">
                  {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'} found
                </div>
              </div>
            </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions Toolbar - Horizontal Scroll on Mobile */}
        <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0 pb-2 sm:pb-0">
          <div className="flex items-center gap-2.5 min-w-max sm:min-w-0 sm:flex-wrap">
            <DashboardTooltip text="Refresh delivery orders">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSync}
                disabled={isSyncing}
                className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap font-medium shadow-sm hover:shadow transition-all"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="text-xs sm:text-sm font-semibold">Refresh</span>
              </Button>
            </DashboardTooltip>
            
            {/* Phase 2: Enhanced Features - Admin/Staff Only */}
            {!isDeliveryBoy && user && (user.role === 'super_admin' || user.role === 'admin' || user.role === 'staff') && (
              <>
                <DashboardTooltip text="Bulk assign multiple orders">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      // Get all eligible orders (unassigned and ready)
                      const eligibleOrders = orders.filter(o => 
                        o.status === 'ready' && !orderAssignments[o.id]
                      );
                      // Pre-select all eligible orders (or first 20 if too many)
                      const ordersToSelect = eligibleOrders.slice(0, 20).map(o => o.id);
                      setSelectedOrdersForBulk(new Set(ordersToSelect));
                      setShowBulkAssignModal(true);
                    }}
                    className="flex items-center gap-1.5 sm:gap-2 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 whitespace-nowrap font-medium shadow-sm hover:shadow transition-all"
                  >
                    <CheckSquare className="h-4 w-4" />
                    <span className="text-xs sm:text-sm font-semibold">Bulk Assign</span>
                  </Button>
                </DashboardTooltip>
                
                <DashboardTooltip text="View delivery boy workload">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowWorkloadView(true)}
                    className="flex items-center gap-1.5 sm:gap-2 bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700 whitespace-nowrap font-medium shadow-sm hover:shadow transition-all"
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span className="text-xs sm:text-sm font-semibold">Workload</span>
                  </Button>
                </DashboardTooltip>
              </>
            )}
                  
            <DashboardTooltip text="View website in new tab">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.open('/', '_blank')}
                className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap font-medium shadow-sm hover:shadow transition-all"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="text-xs sm:text-sm font-semibold">View Site</span>
              </Button>
            </DashboardTooltip>
          </div>
        </div>

        {/* Delivery Orders - Management View */}
        <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            {isDeliveryBoy && deliveryBoyTab === 'completed' ? 'Delivered Orders' : 'Delivery Orders'}
          </h2>
            <p className="hidden sm:block text-sm text-gray-600 dark:text-gray-400 mt-1 font-medium">
              {isDeliveryBoy && deliveryBoyTab === 'completed' 
                ? 'View and review all your successfully completed deliveries and earnings history.'
                : 'Review, assign and track all active deliveries in real time.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-gray-200/80 dark:border-gray-700/80 px-3 py-1.5 bg-white dark:bg-gray-900 shadow-sm">
              <span className="text-sm font-bold text-gray-900 dark:text-white mr-2">
                {isDeliveryBoy 
                  ? (deliveryBoyTab === 'completed' ? riderCompletedOrders.length : riderActiveOrders.length)
                  : filteredOrders.length}
              </span>
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                {isDeliveryBoy && deliveryBoyTab === 'completed' 
                  ? (riderCompletedOrders.length === 1 ? 'Delivered order' : 'Delivered orders')
                  : isDeliveryBoy
                    ? (riderActiveOrders.length === 1 ? 'Active order' : 'Active orders')
                    : (filteredOrders.length === 1 ? 'Active order' : 'Active orders')}
              </span>
          </span>
          </div>
        </div>

        {ordersForDisplay.length === 0 ? (
          <Card className="p-12 text-center shadow-sm border-gray-200/60">
            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full w-fit mx-auto mb-4">
              <Truck className="h-12 w-12 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
              {isDeliveryBoy && deliveryBoyTab === 'completed' ? 'No Delivered Orders' : 'No Delivery Orders'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              {isDeliveryBoy && deliveryBoyTab === 'completed' 
                ? "You haven't completed any deliveries yet. Complete your active orders to see them here."
                : "You don't have any delivery orders at the moment."}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {ordersForDisplay.map((order, index) => (
              <div key={order.id} id={`order-${order.id}`}>
                <DeliveryCard
                  order={order}
                  onView={setSelectedOrder}
                  onStatusUpdate={handleDeliveryStatusUpdate}
                  onCall={handleCallCustomer}
                  onNavigate={setSelectedOrder}
                  onTakePhoto={handleTakePhoto}
                  onAssign={user && (user.role === 'super_admin' || user.role === 'admin' || user.role === 'staff') ? handleAssignOrder : undefined}
                  onReassign={user && (user.role === 'super_admin' || user.role === 'admin' || user.role === 'staff') ? handleReassignOrder : undefined}
                  onViewHistory={user && (user.role === 'super_admin' || user.role === 'admin' || user.role === 'staff') ? handleViewHistory : undefined}
                  actionLoading={actionLoading}
                  getStatusBadge={getStatusBadge}
                  getStatusProgress={getStatusProgress}
                  currentLocation={currentLocation}
                  isExpanded={expandedCards.has(order.id)}
                  onToggleExpand={handleToggleExpand}
                  assignmentInfo={orderAssignments[order.id] || null}
                  canAssign={user ? (user.role === 'super_admin' || user.role === 'admin' || user.role === 'staff') : false}
                  isAdminView={!isDeliveryBoy}
                  productImagesCache={productImagesCache}
                  fetchProductImage={fetchProductImage}
                  rank={index + 1}
                  showRank={sortBy === 'priority' && !isDeliveryBoy}
                  isDealItemForDisplay={isDealItemForDisplay}
                  openImageModal={openImageModal}
                  getProductImage={getProductImage}
                  getFlavorText={getFlavorText}
                  expandedDealItems={expandedDealItems}
                  toggleDealItems={toggleDealItems}
                />
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
      </div>

      {/* Delivery Wallet Modal - Transaction History */}
      {isDeliveryBoy && showWalletModal && (
        <Modal
          isOpen={showWalletModal}
          onClose={() => {
            setShowWalletModal(false);
            navigate('/delivery');
          }}
          title="Wallet"
          size="lg"
        >
          <div className="space-y-4">
            {/* Summary Header */}
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-700 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/20 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Available Balance
                </p>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                  ₹{walletSummary?.balance.toFixed(0) ?? '0'}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-gray-700 dark:text-gray-300">
                <div>
                  <p className="font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Today
                  </p>
                  <p className="font-bold text-gray-900 dark:text-gray-100">
                    ₹{walletSummary?.todayEarnings.toFixed(0) ?? '0'}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    This Week
                  </p>
                  <p className="font-bold text-gray-900 dark:text-gray-100">
                    ₹{walletSummary?.weekEarnings.toFixed(0) ?? '0'}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    This Month
                  </p>
                  <p className="font-bold text-gray-900 dark:text-gray-100">
                    ₹{walletSummary?.monthEarnings.toFixed(0) ?? '0'}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Completed Deliveries
                  </p>
                  <p className="font-bold text-gray-900 dark:text-gray-100">
                    {walletSummary?.completedDeliveries ?? 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Transactions List */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  Transaction History
                </p>
                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  Latest first
                </span>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                {walletTxLoading && (
                  <div className="flex items-center justify-center py-6 text-sm text-gray-500 dark:text-gray-400">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading transactions...
                  </div>
                )}
                {!walletTxLoading && walletTransactions.length === 0 && (
                  <div className="flex items-center justify-center py-6 text-sm text-gray-500 dark:text-gray-400">
                    No wallet transactions yet.
                  </div>
                )}
                {!walletTxLoading &&
                  walletTransactions.map((tx) => {
                    const isPositive = tx.type === 'earning' || tx.type === 'bonus';
                    const meta = tx.meta || {};
                    const baseFee = meta.baseFee ?? null;
                    const percentFee = meta.percentFee ?? null;
                    const distanceIncentive = meta.distanceIncentive ?? null;
                    const orderLabel = tx.orderId ? `Order #${tx.orderId}` : 'Wallet Transaction';

                    return (
                      <div key={tx.id} className="px-4 py-3 flex items-start justify-between gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {orderLabel}
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            {tx.type === 'earning' && 'Delivery earning'}
                            {tx.type === 'bonus' && 'Bonus'}
                            {tx.type === 'penalty' && 'Penalty'}
                            {tx.type === 'payout' && 'Payout'}
                          </p>
                          {(baseFee || percentFee || distanceIncentive) && (
                            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                              {baseFee != null && `Fee ₹${baseFee.toFixed(0)}`}
                              {percentFee != null && ` · 2% ₹${percentFee.toFixed(0)}`}
                              {distanceIncentive != null && ` · Distance ₹${distanceIncentive.toFixed(0)}`}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <span
                            className={`text-sm font-bold ${
                              isPositive
                                ? 'text-emerald-700 dark:text-emerald-300'
                                : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {isPositive ? '+' : '-'}
                            ₹{Math.abs(tx.amount).toFixed(0)}
                          </span>
                          <span className="text-[11px] text-gray-500 dark:text-gray-400">
                            {formatISTDateTime(tx.createdAt, { includeDate: true, includeTime: true })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Pagination controls */}
              {walletTotalPages > 1 && (
                <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>
                    Page {walletPage} of {walletTotalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={walletPage <= 1 || walletTxLoading}
                      onClick={async () => {
                        if (walletPage <= 1) return;
                        const newPage = walletPage - 1;
                        try {
                          setWalletTxLoading(true);
                          const data = await deliveryWalletService.getTransactions({ page: newPage, limit: 20 });
                          setWalletTransactions(data.transactions);
                          setWalletPage(data.pagination.page);
                          setWalletTotalPages(data.pagination.totalPages);
                        } finally {
                          setWalletTxLoading(false);
                        }
                      }}
                    >
                      Prev
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={walletPage >= walletTotalPages || walletTxLoading}
                      onClick={async () => {
                        if (walletPage >= walletTotalPages) return;
                        const newPage = walletPage + 1;
                        try {
                          setWalletTxLoading(true);
                          const data = await deliveryWalletService.getTransactions({ page: newPage, limit: 20 });
                          setWalletTransactions(data.transactions);
                          setWalletPage(data.pagination.page);
                          setWalletTotalPages(data.pagination.totalPages);
                        } finally {
                          setWalletTxLoading(false);
                        }
                      }}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Profile Modal for Delivery Boys */}
      {isDeliveryBoy && showProfileModal && (
        <Modal
          isOpen={showProfileModal}
          onClose={() => {
            setShowProfileModal(false);
            navigate('/delivery');
          }}
          title="Profile"
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-2xl">
                  {user?.name?.charAt(0)?.toUpperCase() || 'D'}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {user?.name || 'Delivery Partner'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user?.email || 'No email'}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Delivery Partner
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Full Name
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.name || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <Mail className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Email
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.email || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <Shield className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Role
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Delivery Partner
                  </p>
                </div>
              </div>

              {walletSummary && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700">
                  <IndianRupee className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
                      Wallet Balance
                    </p>
                    <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                      ₹{walletSummary.balance.toFixed(0)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={() => {
                  setShowProfileModal(false);
                  navigate('/delivery');
                }}
                variant="secondary"
                className="w-full"
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Help Modal for Delivery Boys */}
      {isDeliveryBoy && showHelpModal && (
        <Modal
          isOpen={showHelpModal}
          onClose={() => {
            setShowHelpModal(false);
            navigate('/delivery');
          }}
          title="Help & Support"
          size="md"
        >
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <LifeBuoy className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    Need Help?
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    We're here to assist you with any questions or issues you may have.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => window.open('tel:+91-22-4343-3333', '_blank')}
                className="w-full flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Call Support
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    +91-22-4343-3333
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>

              <button
                onClick={() => window.open('https://wa.me/919876543210', '_blank')}
                className="w-full flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    WhatsApp Support
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Chat with us on WhatsApp
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>

              <button
                onClick={() => window.open('mailto:support@creamingo.com', '_blank')}
                className="w-full flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Email Support
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    support@creamingo.com
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-amber-900 dark:text-amber-100 mb-1">
                      Quick Tips
                    </p>
                    <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                      <li>• Complete deliveries on time to earn bonuses</li>
                      <li>• Take clear photos when completing deliveries</li>
                      <li>• Check your wallet regularly for earnings</li>
                      <li>• Contact support if you face any issues</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button
                onClick={() => {
                  setShowHelpModal(false);
                  navigate('/delivery');
                }}
                variant="secondary"
                className="w-full"
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Photo Capture Modal - Phase 3: Mobile-Optimized */}
      {showPhotoModal && orderForPhoto && (
        <Modal
          isOpen={showPhotoModal}
          onClose={() => {
            setShowPhotoModal(false);
            setOrderForPhoto(null);
            setCapturedPhoto(null);
            setDeliveryOtp('');
          }}
          title="Complete Delivery"
          size={isDeliveryBoy ? "lg" : "md"}
        >
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg shadow-md">
                  <Camera className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-blue-900 dark:text-blue-100 mb-1 text-base">
                    📸 Delivery Proof Required
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Order #{orderForPhoto.order_number || orderForPhoto.id}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                {orderForPhoto.customerName}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                📍 {formatAddress(orderForPhoto.deliveryAddress)}
              </p>
            </div>

            {/* Photo Preview - Mobile Optimized */}
            {capturedPhoto ? (
              <div className="relative bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden">
                <img 
                  src={capturedPhoto} 
                  alt="Delivery proof" 
                  className="w-full h-auto max-h-96 object-contain rounded-lg"
                />
                <button
                  onClick={() => {
                    setCapturedPhoto(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="absolute top-2 right-2 p-2.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all"
                  title="Remove photo"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="absolute bottom-2 left-2 bg-black/50 text-white px-3 py-1.5 rounded-lg text-xs font-medium">
                  Photo captured ✓
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 sm:p-8 text-center bg-gray-50 dark:bg-gray-800">
                <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Camera className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Capture Delivery Photo
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Take a photo as proof of successful delivery
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoCapture}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold shadow-lg"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  {isDeliveryBoy ? '📷 Open Camera' : 'Take Photo'}
                </Button>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                  Tap to open camera or select from gallery
                </p>
              </div>
            )}

            {/* Optional OTP section – controlled via backend config (REACT_APP_REQUIRE_DELIVERY_OTP) */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                Customer OTP (optional)
              </label>
              <input
                type="tel"
                maxLength={6}
                value={deliveryOtp}
                onChange={(e) => setDeliveryOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter OTP if shared by customer"
              />
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Use this field if your store requires customer OTP for delivery completion.
              </p>
            </div>
              
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={handleConfirmDelivery}
                disabled={!capturedPhoto || actionLoading === orderForPhoto.id}
                className="flex-1 h-12 sm:h-14 text-base font-bold bg-gradient-to-r from-green-600 via-green-500 to-green-600 hover:from-green-700 hover:via-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all"
              >
                {actionLoading === orderForPhoto.id ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Completing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    {isDeliveryBoy ? '✅ Mark as Delivered' : 'Complete Delivery'}
                  </>
                )}
              </Button>
              <Button
                onClick={() => {
                  setShowPhotoModal(false);
                  setOrderForPhoto(null);
                  setCapturedPhoto(null);
                }}
                variant="secondary"
                className="flex-1 h-12 sm:h-14 text-base font-semibold"
              >
                Cancel
              </Button>
            </div>
            
            {!capturedPhoto && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    <strong>Note:</strong> A delivery photo is required to complete the delivery. Please capture a photo before marking as delivered.
                  </p>
                </div>
              </div>
            )}
      </div>
        </Modal>
      )}

      {/* Assignment Modal */}
      {showAssignModal && orderToAssign && (
        <Modal
          isOpen={showAssignModal}
          onClose={() => {
            setShowAssignModal(false);
            setOrderToAssign(null);
            setSelectedDeliveryBoyId('');
            setShowAssignDeliveryBoyDropdown(false);
          }}
          title="Assign Order to Delivery Boy"
        >
          <div className="space-y-6 py-2">
            {/* Delivery Boy Selection - Enhanced - Moved to Top */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide">
                Select Delivery Boy
              </label>
              {loadingDeliveryBoys ? (
                <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl flex items-center justify-center shadow-inner">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400 mr-3" />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Loading delivery boys...
                  </p>
                </div>
              ) : availableDeliveryBoys.length === 0 ? (
                <div className="p-5 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-2 border-yellow-300 dark:border-yellow-800 rounded-xl shadow-sm">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                    No delivery boys available. Please add delivery boys from the Users tab first.
                  </p>
                </div>
              ) : (
                <div className="relative" ref={assignDeliveryBoyDropdownRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAssignDeliveryBoyDropdown(!showAssignDeliveryBoyDropdown);
                    }}
                    className={`w-full flex items-center gap-3 px-5 py-4 border-2 rounded-xl shadow-lg bg-white dark:bg-gray-800 text-base font-semibold text-gray-900 dark:text-white transition-all duration-300 justify-between group ${
                      showAssignDeliveryBoyDropdown
                        ? 'border-blue-500 dark:border-blue-400 shadow-blue-200 dark:shadow-blue-900/50 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xl hover:scale-[1.01]'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg transition-colors duration-200 ${
                        showAssignDeliveryBoyDropdown
                          ? 'bg-blue-500 dark:bg-blue-600'
                          : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30'
                      }`}>
                        <Truck className={`h-5 w-5 transition-colors duration-200 ${
                          showAssignDeliveryBoyDropdown
                            ? 'text-white'
                            : 'text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                        }`} />
                      </div>
                      <span className={selectedDeliveryBoyId ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}>
                        {selectedDeliveryBoyId
                          ? availableDeliveryBoys.find(b => b.id.toString() === selectedDeliveryBoyId)?.name || 'Select delivery boy...'
                          : 'Select delivery boy...'}
                      </span>
                    </span>
                    <ChevronDown className={`h-5 w-5 transition-all duration-300 ${
                      showAssignDeliveryBoyDropdown
                        ? 'rotate-180 text-blue-600 dark:text-blue-400'
                        : 'text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                    }`} />
                  </button>
                  {showAssignDeliveryBoyDropdown && (
                    <div className="absolute z-[9999] mt-2 w-full bg-white dark:bg-gray-800 border-2 border-blue-300 dark:border-blue-600 rounded-xl shadow-2xl overflow-hidden transition-all duration-200">
                      {/* Compact Header */}
                      <div className="px-4 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-b-2 border-blue-200 dark:border-blue-700">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                            {availableDeliveryBoys.length} Delivery Boy{availableDeliveryBoys.length !== 1 ? 's' : ''} Available
                          </span>
                        </div>
                      </div>
                      {/* Compact Scrollable List */}
                      <div className="max-h-[280px] overflow-y-auto custom-scrollbar">
                        <div className="p-1.5">
                          {availableDeliveryBoys.map((deliveryBoy) => {
                            const isSelected = selectedDeliveryBoyId === deliveryBoy.id.toString();
                            return (
                              <button
                                key={deliveryBoy.id}
                                type="button"
                                onClick={() => {
                                  setSelectedDeliveryBoyId(deliveryBoy.id.toString());
                                  setShowAssignDeliveryBoyDropdown(false);
                                }}
                                className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 last:mb-0 transition-all duration-150 ${
                                  isSelected
                                    ? 'bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 border border-blue-400 dark:border-blue-500 shadow-sm'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-transparent hover:border-gray-200 dark:hover:border-gray-600'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`p-1.5 rounded-lg transition-all duration-150 flex-shrink-0 ${
                                    isSelected
                                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 shadow-sm'
                                      : 'bg-gray-100 dark:bg-gray-700'
                                  }`}>
                                    <Truck className={`h-4 w-4 ${
                                      isSelected
                                        ? 'text-white'
                                        : 'text-gray-600 dark:text-gray-300'
                                    }`} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className={`font-semibold text-sm mb-0.5 ${
                                      isSelected
                                        ? 'text-blue-700 dark:text-blue-300'
                                        : 'text-gray-900 dark:text-white'
                                    }`}>
                                      {deliveryBoy.name}
                                    </div>
                                    {deliveryBoy.email && (
                                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {deliveryBoy.email}
                                      </div>
                                    )}
                                  </div>
                                  {isSelected && (
                                    <div className="flex-shrink-0 p-1 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-full">
                                      <CheckCircle className="h-4 w-4 text-white" />
                                    </div>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      {/* Footer with count */}
                      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                          Click to select a delivery boy
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Order Info Card - Enhanced - Moved Below Selection */}
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-xl shadow-md">
                  <Truck className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-lg text-blue-900 dark:text-blue-100 mb-2">
                    Order #{orderToAssign.order_number || orderToAssign.id}
                  </p>
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      <span className="font-semibold">Customer:</span> {orderToAssign.customerName}
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                      <span className="font-semibold">Address:</span> {formatAddress(orderToAssign.deliveryAddress)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons - Enhanced */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleConfirmAssignment}
                disabled={!selectedDeliveryBoyId || actionLoading === orderToAssign.id}
                className="flex-1 h-14 text-base font-bold bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 hover:from-pink-700 hover:via-rose-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {actionLoading === orderToAssign.id ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="h-5 w-5 mr-2" />
                    Assign Order
                  </>
                )}
              </Button>
              <Button
                onClick={() => {
                  setShowAssignModal(false);
                  setOrderToAssign(null);
                  setSelectedDeliveryBoyId('');
                  setShowAssignDeliveryBoyDropdown(false);
                }}
                variant="secondary"
                className="flex-1 h-14 text-base font-semibold border-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Phase 2: Bulk Assignment Modal */}
      {showBulkAssignModal && (
        <Modal
          isOpen={showBulkAssignModal}
          onClose={() => {
            setShowBulkAssignModal(false);
            setSelectedOrdersForBulk(new Set());
            setBulkAssignDeliveryBoyId('');
          }}
          title="Bulk Assign Orders"
          size="lg"
        >
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <CheckSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    Select Orders to Assign
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {selectedOrdersForBulk.size} of {orders.filter(o => o.status === 'ready' && !orderAssignments[o.id]).length} eligible order{orders.filter(o => o.status === 'ready' && !orderAssignments[o.id]).length !== 1 ? 's' : ''} selected
                  </p>
                </div>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
              {(() => {
                // Get all eligible orders: unassigned and ready status
                const eligibleOrders = orders.filter(o => 
                  o.status === 'ready' && !orderAssignments[o.id]
                );
                
                if (eligibleOrders.length === 0) {
                  return (
                    <div className="p-8 text-center">
                      <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        No eligible orders found
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        All ready orders are already assigned or there are no ready orders
                      </p>
                    </div>
                  );
                }
                
                return eligibleOrders.map((order) => (
                  <label
                    key={order.id}
                    className="flex items-center gap-3 p-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedOrdersForBulk.has(order.id)}
                      onChange={(e) => {
                        const newSet = new Set(selectedOrdersForBulk);
                        if (e.target.checked) {
                          newSet.add(order.id);
                        } else {
                          newSet.delete(order.id);
                        }
                        setSelectedOrdersForBulk(newSet);
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Order #{order.order_number || order.id}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {order.customerName} • ₹{(order.total || 0).toFixed(0)}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {formatAddress(order.deliveryAddress).substring(0, 50)}...
                      </p>
                    </div>
                  </label>
                ));
              })()}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Delivery Boy
              </label>
              {loadingDeliveryBoys ? (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400 mr-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
              ) : (
                <div className="relative" ref={bulkAssignDeliveryBoyDropdownRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBulkAssignDeliveryBoyDropdown(!showBulkAssignDeliveryBoyDropdown);
                      setShowBulkAssignPriorityDropdown(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-sm font-semibold text-gray-900 dark:text-white hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all duration-200 justify-between group"
                  >
                    <span className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      {bulkAssignDeliveryBoyId
                        ? availableDeliveryBoys.find(b => b.id.toString() === bulkAssignDeliveryBoyId)?.name || 'Select delivery boy...'
                        : 'Select delivery boy...'}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all duration-200 ${showBulkAssignDeliveryBoyDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showBulkAssignDeliveryBoyDropdown && (
                    <div className="absolute z-[100] mt-2 w-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl overflow-hidden">
                      {availableDeliveryBoys.map((deliveryBoy) => {
                        const isSelected = bulkAssignDeliveryBoyId === deliveryBoy.id.toString();
                        return (
                          <button
                            key={deliveryBoy.id}
                            type="button"
                            onClick={() => {
                              setBulkAssignDeliveryBoyId(deliveryBoy.id.toString());
                              setShowBulkAssignDeliveryBoyDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                              isSelected
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500'
                                : ''
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="flex-1">
                                <div className={`font-semibold ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                                  {deliveryBoy.name}
                                </div>
                                {deliveryBoy.email && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    {deliveryBoy.email}
                                  </div>
                                )}
                              </div>
                              {isSelected && (
                                <div className="p-1.5 bg-blue-600 dark:bg-blue-500 rounded-full">
                                  <span className="text-white text-xs font-bold">✓</span>
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <div className="relative" ref={bulkAssignPriorityDropdownRef}>
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkAssignPriorityDropdown(!showBulkAssignPriorityDropdown);
                    setShowBulkAssignDeliveryBoyDropdown(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-sm font-semibold text-gray-900 dark:text-white hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all duration-200 justify-between group"
                >
                  <span className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    {bulkAssignPriority.charAt(0).toUpperCase() + bulkAssignPriority.slice(1)}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all duration-200 ${showBulkAssignPriorityDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showBulkAssignPriorityDropdown && (
                  <div className="absolute z-[100] mt-2 w-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl overflow-hidden">
                    {(['low', 'medium', 'high'] as const).map((priority) => {
                      const isSelected = bulkAssignPriority === priority;
                      const priorityColors = {
                        low: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-l-green-500',
                        medium: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-l-yellow-500',
                        high: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-l-red-500'
                      };
                      return (
                        <button
                          key={priority}
                          type="button"
                          onClick={() => {
                            setBulkAssignPriority(priority);
                            setShowBulkAssignPriorityDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                            isSelected
                              ? priorityColors[priority]
                              : 'text-gray-900 dark:text-white'
                          } ${isSelected ? 'border-l-4' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-lg ${
                              priority === 'low' ? 'bg-green-100 dark:bg-green-900/30' :
                              priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                              'bg-red-100 dark:bg-red-900/30'
                            }`}>
                              <Target className={`h-4 w-4 ${
                                priority === 'low' ? 'text-green-600 dark:text-green-400' :
                                priority === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                                'text-red-600 dark:text-red-400'
                              }`} />
                            </div>
                            <div className="flex-1">
                              <div className={`font-semibold ${isSelected ? priority === 'low' ? 'text-green-600 dark:text-green-400' : priority === 'medium' ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                                {priority.charAt(0).toUpperCase() + priority.slice(1)}
                              </div>
                            </div>
                            {isSelected && (
                              <div className={`p-1.5 rounded-full ${
                                priority === 'low' ? 'bg-green-600 dark:bg-green-500' :
                                priority === 'medium' ? 'bg-yellow-600 dark:bg-yellow-500' :
                                'bg-red-600 dark:bg-red-500'
                              }`}>
                                <span className="text-white text-xs font-bold">✓</span>
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={handleBulkAssign}
                disabled={selectedOrdersForBulk.size === 0 || !bulkAssignDeliveryBoyId || actionLoading === 'bulk'}
                className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
              >
                {actionLoading === 'bulk' ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <CheckSquare className="h-5 w-5 mr-2" />
                    Assign {selectedOrdersForBulk.size} Order{selectedOrdersForBulk.size !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
              <Button
                onClick={() => {
                  setShowBulkAssignModal(false);
                  setSelectedOrdersForBulk(new Set());
                  setBulkAssignDeliveryBoyId('');
                  setShowBulkAssignDeliveryBoyDropdown(false);
                  setShowBulkAssignPriorityDropdown(false);
                }}
                variant="secondary"
                className="flex-1 h-12"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Phase 2: Reassignment Modal */}
      {showReassignModal && orderToReassign && (
        <Modal
          isOpen={showReassignModal}
          onClose={() => {
            setShowReassignModal(false);
            setOrderToReassign(null);
            setReassignDeliveryBoyId('');
            setReassignReason('');
            setShowReassignDeliveryBoyDropdown(false);
          }}
          title="Reassign Order"
        >
          <div className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <ArrowRightLeft className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                    Order #{orderToReassign.order_number || orderToReassign.id}
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Currently assigned to: {orderAssignments[orderToReassign.id]?.deliveryBoyName || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select New Delivery Boy
              </label>
              {loadingDeliveryBoys ? (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400 mr-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
              ) : (
                <div className="relative" ref={reassignDeliveryBoyDropdownRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowReassignDeliveryBoyDropdown(!showReassignDeliveryBoyDropdown);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-sm font-semibold text-gray-900 dark:text-white hover:border-amber-500 dark:hover:border-amber-400 hover:shadow-md transition-all duration-200 justify-between group"
                  >
                    <span className="flex items-center gap-2">
                      <ArrowRightLeft className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      {reassignDeliveryBoyId
                        ? availableDeliveryBoys.find(b => b.id.toString() === reassignDeliveryBoyId)?.name || 'Select delivery boy...'
                        : 'Select delivery boy...'}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-gray-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-all duration-200 ${showReassignDeliveryBoyDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showReassignDeliveryBoyDropdown && (
                    <div className="absolute z-[100] mt-2 w-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl overflow-hidden">
                      {availableDeliveryBoys
                        .filter(boy => boy.id.toString() !== orderAssignments[orderToReassign.id]?.deliveryBoyId?.toString())
                        .map((deliveryBoy) => {
                          const isSelected = reassignDeliveryBoyId === deliveryBoy.id.toString();
                          return (
                            <button
                              key={deliveryBoy.id}
                              type="button"
                              onClick={() => {
                                setReassignDeliveryBoyId(deliveryBoy.id.toString());
                                setShowReassignDeliveryBoyDropdown(false);
                              }}
                              className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                                isSelected
                                  ? 'bg-amber-50 dark:bg-amber-900/20 border-l-4 border-l-amber-500'
                                  : ''
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                  <ArrowRightLeft className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div className="flex-1">
                                  <div className={`font-semibold ${isSelected ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
                                    {deliveryBoy.name}
                                  </div>
                                  {deliveryBoy.email && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                      {deliveryBoy.email}
                                    </div>
                                  )}
                                </div>
                                {isSelected && (
                                  <div className="p-1.5 bg-amber-600 dark:bg-amber-500 rounded-full">
                                    <span className="text-white text-xs font-bold">✓</span>
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason (Optional)
              </label>
              <Input
                type="text"
                value={reassignReason}
                onChange={(e) => setReassignReason(e.target.value)}
                placeholder="Enter reason for reassignment..."
                className="w-full"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={handleReassign}
                disabled={!reassignDeliveryBoyId || actionLoading === orderToReassign.id}
                className="flex-1 h-12 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
              >
                {actionLoading === orderToReassign.id ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <ArrowRightLeft className="h-5 w-5 mr-2" />
                    Reassign Order
                  </>
                )}
              </Button>
              <Button
                onClick={() => {
                  setShowReassignModal(false);
                  setOrderToReassign(null);
                  setReassignDeliveryBoyId('');
                  setReassignReason('');
                  setShowReassignDeliveryBoyDropdown(false);
                }}
                variant="secondary"
                className="flex-1 h-12"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Phase 2: Workload View Modal */}
      {showWorkloadView && (
        <Modal
          isOpen={showWorkloadView}
          onClose={() => setShowWorkloadView(false)}
          title="Delivery Boy Workload"
          size="lg"
        >
          <div className="space-y-4">
            {loadingWorkload ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400 mr-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Loading workload data...</p>
              </div>
            ) : deliveryBoyWorkload.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400">No delivery boys found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {deliveryBoyWorkload.map((workload) => (
                  <Card key={workload.deliveryBoyId} className="border border-gray-200 dark:border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {workload.deliveryBoyName}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {workload.deliveryBoyEmail}
                          </p>
                          {workload.contactNumber && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              📱 {workload.contactNumber}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {workload.totalOrders}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Total Orders</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-center">
                          <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                            {workload.assignedCount}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Assigned</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                            {workload.pickedUpCount}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Picked Up</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                            {workload.inTransitCount}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">In Transit</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                            {workload.deliveredCount}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Delivered</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Phase 2: Assignment History Modal */}
      {showHistoryModal && orderForHistory && (
        <Modal
          isOpen={showHistoryModal}
          onClose={() => {
            setShowHistoryModal(false);
            setOrderForHistory(null);
            setAssignmentHistory([]);
          }}
          title="Assignment History"
          size="lg"
        >
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <History className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    Order #{orderForHistory.order_number || orderForHistory.id}
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Complete assignment history and changes
                  </p>
                </div>
              </div>
            </div>

            {loadingHistory ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400 mr-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Loading history...</p>
              </div>
            ) : assignmentHistory.length === 0 ? (
              <div className="text-center py-12">
                <History className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400">No assignment history available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignmentHistory.map((entry, index) => (
                  <Card key={entry.id} className="border border-gray-200 dark:border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                          <History className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            {entry.oldDeliveryBoyId ? (
                              <>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {entry.oldDeliveryBoyName}
                                </span>
                                <ArrowRightLeft className="h-4 w-4 text-gray-400" />
                                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                  {entry.newDeliveryBoyName}
                                </span>
                              </>
                            ) : (
                              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                Assigned to {entry.newDeliveryBoyName}
                              </span>
                            )}
                          </div>
                          {entry.reason && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                              Reason: {entry.reason}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatISTDateTime(entry.createdAt)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Order Detail Bottom Sheet / Modal */}
      {selectedOrder && !showPhotoModal && (
        <Modal
          isOpen={!!selectedOrder && !showPhotoModal}
          onClose={() => setSelectedOrder(null)}
          title={isDeliveryBoy ? 'Order Details' : 'Navigate to Delivery'}
          size={isDeliveryBoy ? 'lg' : 'md'}
        >
          {isDeliveryBoy ? (
            <RiderOrderDetailSheet
              order={selectedOrder}
              onClose={() => setSelectedOrder(null)}
              onCall={handleCallCustomer}
              onOpenMaps={() =>
                window.open(
                  `https://maps.google.com/?q=${encodeURIComponent(formatAddress(selectedOrder.deliveryAddress))}`,
                  '_blank'
                )
              }
              isDealItemForDisplay={isDealItemForDisplay}
            />
          ) : (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white text-lg">
                      {selectedOrder.customerName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {selectedOrder.customerPhone}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      Delivery Address
                    </p>
                    <p className="text-base text-gray-900 dark:text-white leading-relaxed">
                      {formatAddress(selectedOrder.deliveryAddress)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => {
                    window.open(
                      `https://maps.google.com/?q=${encodeURIComponent(formatAddress(selectedOrder.deliveryAddress))}`,
                      '_blank'
                    );
                  }}
                  className="h-12 text-base font-semibold bg-green-600 hover:bg-green-700"
                >
                  <Navigation className="h-5 w-5 mr-2" />
                  Open Maps
                </Button>
                <Button
                  onClick={() => handleCallCustomer(selectedOrder.customerPhone)}
                  variant="secondary"
                  className="h-12 text-base font-semibold"
                >
                  <Phone className="h-5 w-5 mr-2" />
                  Call Customer
                </Button>
              </div>

              <Button
                onClick={() => setSelectedOrder(null)}
                variant="ghost"
                className="w-full"
              >
                Close
              </Button>
            </div>
          )}
        </Modal>
      )}

      {/* Sticky Footer - Target Incentive Slabs (Only for Delivery Boys on Mobile) */}
      {isDeliveryBoy && dailyProgress && dailyProgress.tiers.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t-2 border-emerald-200 dark:border-emerald-800 shadow-2xl z-40 sm:hidden">
          {/* Collapsed View - Always Visible */}
          <div className="p-3">
            <button
              onClick={() => setIsFooterExpanded(!isFooterExpanded)}
              className="w-full flex items-center justify-between p-2.5 rounded-lg bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 hover:from-emerald-100 hover:to-green-100 dark:hover:from-emerald-900/30 dark:hover:to-green-900/30 transition-all duration-200 active:scale-[0.98]"
            >
              <div className="flex items-center gap-2.5 flex-1">
                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg">
                  <Target className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      Today's Progress
                    </span>
                    {dailyProgress.currentTier && (
                      <span className="px-1.5 py-0.5 bg-emerald-200 dark:bg-emerald-800 rounded text-[10px] font-bold text-emerald-800 dark:text-emerald-200">
                        {dailyProgress.currentTier.tierName || `Tier ${dailyProgress.currentTier.minOrders}+`}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-base font-bold text-emerald-700 dark:text-emerald-300">
                      {dailyProgress.completedCount}
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      orders completed
                    </span>
                    {dailyProgress.nextTier && dailyProgress.completedCount < dailyProgress.nextTier.minOrders && (
                      <>
                        <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                        <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                          {dailyProgress.nextTier.minOrders - dailyProgress.completedCount} more for ₹{dailyProgress.nextTier.bonusAmount.toFixed(0)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {dailyProgress.bonusAlreadyCredited && dailyProgress.currentTier && (
                  <div className="px-2 py-1 bg-emerald-200 dark:bg-emerald-800 rounded-lg">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-emerald-700 dark:text-emerald-300" />
                      <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-200">
                        ₹{dailyProgress.currentTier.bonusAmount.toFixed(0)}
                      </span>
                    </div>
                  </div>
                )}
                <div className="p-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  {isFooterExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400 transition-transform duration-200" />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-gray-600 dark:text-gray-400 transition-transform duration-200" />
                  )}
                </div>
              </div>
            </button>
          </div>

          {/* Expanded View - All Tiers */}
          {isFooterExpanded && (
            <div className="px-3 pb-3 space-y-2 max-h-[50vh] overflow-y-auto border-t border-emerald-100 dark:border-emerald-900/50">
              {/* All Incentive Slabs */}
              <div className="pt-2 space-y-1.5">
                {dailyProgress.tiers
                  .sort((a, b) => a.minOrders - b.minOrders)
                  .map((tier) => {
                    const isCurrent = dailyProgress.currentTier?.id === tier.id;
                    const isAchieved = dailyProgress.completedCount >= tier.minOrders;
                    const isNext = dailyProgress.nextTier?.id === tier.id;
                    const progress = tier.maxOrders !== null 
                      ? Math.min(100, (dailyProgress.completedCount / tier.maxOrders) * 100)
                      : dailyProgress.completedCount >= tier.minOrders ? 100 : (dailyProgress.completedCount / tier.minOrders) * 100;

                    return (
                      <div
                        key={tier.id}
                        className={`rounded-lg p-2.5 border transition-all duration-200 ${
                          isCurrent
                            ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 shadow-sm'
                            : isAchieved
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                            : isNext
                            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                            : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {isCurrent ? (
                              <Trophy className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            ) : isAchieved ? (
                              <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                            ) : null}
                            <span className={`text-[11px] font-semibold ${
                              isCurrent
                                ? 'text-emerald-800 dark:text-emerald-200'
                                : isAchieved
                                ? 'text-green-800 dark:text-green-200'
                                : isNext
                                ? 'text-amber-800 dark:text-amber-200'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}>
                              {tier.tierName || `${tier.minOrders}${tier.maxOrders !== null ? `-${tier.maxOrders}` : '+'} orders`}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <IndianRupee className={`h-3.5 w-3.5 ${
                              isCurrent
                                ? 'text-emerald-700 dark:text-emerald-300'
                                : isAchieved
                                ? 'text-green-700 dark:text-green-300'
                                : 'text-gray-500 dark:text-gray-400'
                            }`} />
                            <span className={`text-xs font-bold ${
                              isCurrent
                                ? 'text-emerald-700 dark:text-emerald-300'
                                : isAchieved
                                ? 'text-green-700 dark:text-green-300'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}>
                              {tier.bonusAmount.toFixed(0)}
                            </span>
                          </div>
                        </div>
                        {isNext && !isAchieved && (
                          <div className="mt-1.5">
                            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-500 dark:bg-amber-400 transition-all duration-300"
                                style={{ width: `${Math.min(100, progress)}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-amber-700 dark:text-amber-300 mt-0.5 font-medium">
                              {tier.minOrders - dailyProgress.completedCount} more to unlock
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>

              {/* Bonus Status (if not shown in collapsed view) */}
              {dailyProgress.bonusAlreadyCredited && dailyProgress.currentTier && (
                <div className="mt-2 p-2.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg border border-emerald-300 dark:border-emerald-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-200">
                      Bonus of ₹{dailyProgress.currentTier.bonusAmount.toFixed(0)} credited today!
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Image Zoom Modal - Full Screen Viewer */}
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
                  src={resolveImageUrl(imageModal.imageUrl)}
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

export default Delivery;
