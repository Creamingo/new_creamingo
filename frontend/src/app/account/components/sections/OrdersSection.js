'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Calendar, CheckCircle, Clock, XCircle, Download, Eye, FileText } from 'lucide-react';
import SectionHeader from '../shared/SectionHeader';
import EmptyState from '../shared/EmptyState';
import LoadingSkeleton from '../shared/LoadingSkeleton';
import orderApi from '../../../../api/orderApi';
import InvoiceModal from '../InvoiceModal';
import { formatPrice } from '../../../../utils/priceFormatter';

const getStatusColor = (status) => {
  const statusMap = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
    processing: 'bg-purple-100 text-purple-800 border-purple-300',
    shipped: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    delivered: 'bg-green-100 text-green-800 border-green-300',
    cancelled: 'bg-red-100 text-red-800 border-red-300'
  };
  return statusMap[status?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-300';
};

const getStatusIcon = (status) => {
  const statusLower = status?.toLowerCase();
  if (statusLower === 'delivered') return <CheckCircle className="w-4 h-4" />;
  if (statusLower === 'cancelled') return <XCircle className="w-4 h-4" />;
  return <Clock className="w-4 h-4" />;
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
};

export default function OrdersSection({ onBadgeUpdate }) {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedOrderNumber, setSelectedOrderNumber] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (onBadgeUpdate) {
      onBadgeUpdate(orders.length > 0 ? orders.length : null);
    }
  }, [orders.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await orderApi.getMyOrders();
      
      // Handle different response formats
      if (response.success) {
        setOrders(response.orders || []);
      } else if (response.orders) {
        setOrders(response.orders);
      } else if (Array.isArray(response)) {
        setOrders(response);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      // Check if it's an authentication error
      if (err.message === 'Authentication required' || err.message?.includes('Authentication')) {
        setError('Please log in to view your orders');
      } else {
        setError(err.message || 'Failed to load orders');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (orderNumber) => {
    router.push(`/orders?order=${orderNumber}`);
  };

  const handleViewInvoice = (orderNumber, e) => {
    e.stopPropagation();
    setSelectedOrderNumber(orderNumber);
    setShowInvoiceModal(true);
  };

  const handleDownloadInvoice = async (orderNumber, e) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('customer_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/orders/invoice/${orderNumber}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download invoice');
      }

      // Create blob from response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Failed to download invoice. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <>
        <SectionHeader 
          title="Orders" 
          description="View and track all your orders"
          action={() => router.push('/orders')}
          actionLabel="View All Orders"
        />
        <LoadingSkeleton />
      </>
    );
  }

  if (error) {
    return (
      <>
        <SectionHeader 
          title="Orders" 
          description="View and track all your orders"
        />
        <EmptyState
          icon={Package}
          title="Error Loading Orders"
          description={error}
        />
      </>
    );
  }

  if (orders.length === 0) {
    return (
      <>
        <SectionHeader 
          title="Orders" 
          description="View and track all your orders"
        />
        <EmptyState
          icon={Package}
          title="No Orders Yet"
          description="Start shopping to see your orders here"
          action={() => router.push('/')}
          actionLabel="Start Shopping"
        />
      </>
    );
  }

  return (
    <>
      <SectionHeader 
        title="Orders" 
        description={`${orders.length} order${orders.length !== 1 ? 's' : ''} total`}
        action={() => router.push('/orders')}
        actionLabel="View All Orders"
      />

      <div className="space-y-2 lg:space-y-3">
        {orders.slice(0, 5).map((order) => (
          <div
            key={order.id}
            className="bg-[#FFF8F0] rounded-xl border-2 border-[#D2B48C] lg:border-[#D2B48C] p-3 lg:p-5"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5 lg:gap-5">
              {/* Left Section */}
              <div className="flex-1 min-w-0">
                {/* Order ID with Icon */}
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-8 h-8 lg:w-12 lg:h-12 border border-gray-300 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="w-4 h-4 lg:w-6 lg:h-6 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-poppins text-sm lg:text-lg font-normal lg:font-medium text-gray-900 truncate leading-tight mb-1">
                      Order #{order.order_number}
                    </h3>
                    {/* Date and Status - Mobile: Side by side */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 text-[11px] lg:text-xs text-gray-500">
                        <Calendar className="w-3 h-3 flex-shrink-0 text-gray-400" />
                        <span className="whitespace-nowrap font-normal">{formatDate(order.created_at)}</span>
                      </div>
                      {/* Status Badge - Clean */}
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] lg:text-[11px] font-normal lg:font-medium border flex items-center gap-1 ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="capitalize whitespace-nowrap">{order.status.replace(/_/g, ' ')}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Section */}
              <div className="flex items-center justify-between lg:justify-end gap-2.5 lg:gap-4">
                {/* Amount - Horizontal on mobile */}
                <div className="flex items-center gap-1.5 lg:flex-col lg:items-end lg:text-right">
                  <p className="text-[10px] lg:text-xs text-gray-400 font-normal lg:font-medium uppercase lg:mb-1 lg:tracking-wide">Amount</p>
                  <p className="font-poppins text-base lg:text-2xl font-medium lg:font-bold text-gray-900 leading-tight">
                    {formatPrice(parseFloat(order.total_amount))}
                  </p>
                </div>

                {/* Action Buttons - Clean design */}
                <div className="flex items-center gap-1.5 lg:gap-2 flex-shrink-0">
                  <button
                    onClick={(e) => handleViewInvoice(order.order_number, e)}
                    className="p-1.5 lg:p-2.5 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                    title="View Invoice"
                  >
                    <FileText className="w-3.5 h-3.5 lg:w-5 lg:h-5 text-gray-700" />
                  </button>
                  <button
                    onClick={() => handleViewDetails(order.order_number)}
                    className="flex items-center gap-1 lg:gap-2 px-3 lg:px-4 py-1.5 lg:py-2.5 border border-gray-300 text-gray-700 rounded-lg font-inter text-[11px] lg:text-sm font-medium lg:font-semibold hover:bg-gray-50 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                    <span>View</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Invoice Modal */}
      <InvoiceModal
        orderNumber={selectedOrderNumber}
        isOpen={showInvoiceModal}
        onClose={() => {
          setShowInvoiceModal(false);
          setSelectedOrderNumber(null);
        }}
      />
    </>
  );
}

