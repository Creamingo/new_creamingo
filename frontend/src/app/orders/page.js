'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Package, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import ProtectedRoute from '../../components/ProtectedRoute';
import OrderListCard from '../../components/OrderListCard';
import OrderDetailView from './components/OrderDetailView';
import InvoiceModal from '../account/components/InvoiceModal';
import orderApi from '../../api/orderApi';
import productApi from '../../api/productApi';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import { reorderOrderToCart } from '../../utils/reorderToCart';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function OrdersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderParam = searchParams.get('order');
  const { addToCart } = useCart();
  const { showSuccess, showError } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedOrderNumber, setSelectedOrderNumber] = useState(null);
  const [reorderLoading, setReorderLoading] = useState(false);

  const selectedOrder = useMemo(() => {
    if (!orderParam || !orders.length) return null;
    return orders.find((o) => (o.order_number || o.id?.toString()) === orderParam) || null;
  }, [orderParam, orders]);

  const handleViewOrder = (orderNumber) => {
    router.push(`/orders?order=${orderNumber}`);
  };

  const handleViewInvoice = (orderNumber, e) => {
    e?.stopPropagation?.();
    setSelectedOrderNumber(orderNumber);
    setShowInvoiceModal(true);
  };

  const handleBackToOrders = () => {
    router.push('/orders');
  };

  const handleDownloadInvoice = async (orderNumber) => {
    try {
      const token = localStorage.getItem('customer_token');
      if (!token) throw new Error('Authentication required');
      const response = await fetch(`${API_BASE_URL}/orders/invoice/${orderNumber}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to download invoice');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading invoice:', err);
      alert('Failed to download invoice. Please try again.');
    }
  };

  const handleReorder = async (order) => {
    if (!order?.items?.length) {
      showError('Reorder', 'No items in this order.');
      return;
    }
    setReorderLoading(true);
    try {
      const result = await reorderOrderToCart(order, addToCart, productApi, { suppressToast: true });
      if (result.added > 0) {
        showSuccess(
          'Added to cart',
          result.skipped > 0
            ? `${result.added} item(s) added. ${result.skipped} could not be added.`
            : `${result.added} item(s) added. Choose delivery and checkout when ready.`
        );
        router.push('/cart');
      } else {
        showError(
          'Could not reorder',
          result.errors?.length ? result.errors.slice(0, 2).join('. ') : 'Items may no longer be available.'
        );
      }
    } catch (err) {
      showError('Reorder failed', err.message || 'Please try again.');
    } finally {
      setReorderLoading(false);
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError('');
        // Add timestamp to prevent caching
        const data = await orderApi.getMyOrders();
        setOrders(data.orders || data || []);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(err.message || 'Failed to load orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
    
    // Refresh orders every 30 seconds to get updated status
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
          <div className="text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-pink-600 dark:text-pink-400 animate-spin" />
            <p className="text-gray-600 dark:text-gray-300">Loading your orders...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-800 p-6 text-center">
            <XCircle className="w-12 h-12 mx-auto mb-4 text-red-600 dark:text-red-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Error Loading Orders</h2>
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-pink-600 dark:bg-pink-700 text-white rounded-lg hover:bg-pink-700 dark:hover:bg-pink-600 transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Single order detail view when ?order= is set
  if (orderParam) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        {/* Sticky Back to Orders – visible on load */}
        <div className="sticky top-[3.6rem] lg:top-16 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <button
              onClick={handleBackToOrders}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors font-inter text-sm font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Orders</span>
            </button>
          </div>
        </div>

        <div className="py-6">
          {selectedOrder ? (
            <OrderDetailView
              order={selectedOrder}
              onBack={handleBackToOrders}
              onDownloadInvoice={handleDownloadInvoice}
              onReorder={handleReorder}
              reorderLoading={reorderLoading}
            />
          ) : (
            <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center py-12">
              <Package className="w-14 h-14 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Order not found</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                We couldn&apos;t find an order with that ID. It may have been placed from another account.
              </p>
              <button
                onClick={handleBackToOrders}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Orders
              </button>
            </div>
          )}
        </div>
        <Footer />
      </div>
    );
  }

  // List view
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors mb-5 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Home</span>
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-pink-500 to-rose-500 dark:from-pink-600 dark:to-rose-600 rounded-lg shadow-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Order History</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1 font-medium">View and track all your orders</p>
            </div>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">No Orders Yet</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">You haven&apos;t placed any orders yet.</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-pink-600 dark:bg-pink-700 text-white rounded-lg hover:bg-pink-700 dark:hover:bg-pink-600 transition-colors"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
            {orders.map((order) => (
              <OrderListCard
                key={order.id}
                order={order}
                onView={handleViewOrder}
                onInvoice={handleViewInvoice}
                onReorder={handleReorder}
              />
            ))}
          </div>
        )}
        <InvoiceModal
          orderNumber={selectedOrderNumber}
          isOpen={showInvoiceModal}
          onClose={() => {
            setShowInvoiceModal(false);
            setSelectedOrderNumber(null);
          }}
        />
      </div>
      <Footer />
    </div>
  );
}

function OrdersPageFallback() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-pink-600 dark:text-pink-400 animate-spin" />
    </div>
  );
}

export default function OrdersPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<OrdersPageFallback />}>
        <OrdersPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}

