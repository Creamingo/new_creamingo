'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package } from 'lucide-react';
import SectionHeader from '../shared/SectionHeader';
import EmptyState from '../shared/EmptyState';
import LoadingSkeleton from '../shared/LoadingSkeleton';
import OrderListCard from '../../../../components/OrderListCard';
import orderApi from '../../../../api/orderApi';
import InvoiceModal from '../InvoiceModal';

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

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
        {orders.slice(0, 5).map((order) => (
          <OrderListCard
            key={order.id}
            order={order}
            onView={handleViewDetails}
            onInvoice={handleViewInvoice}
          />
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

