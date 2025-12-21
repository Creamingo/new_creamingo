'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Calendar, MapPin, Phone, Mail, Clock, CheckCircle, XCircle, Loader2, ArrowLeft, Gift } from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import ProtectedRoute from '../../components/ProtectedRoute';
import orderApi from '../../api/orderApi';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import { formatPrice } from '../../utils/priceFormatter';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
};

const formatTime = (timeString) => {
  if (!timeString) return 'N/A';
  
  // If it's already formatted (e.g., "8:00 PM - 10:00 PM"), return as is
  if (timeString.includes('PM') || timeString.includes('AM')) {
    return timeString;
  }
  
  // Handle time range format (e.g., "8:00 PM - 10:00 PM")
  if (timeString.includes(' - ')) {
    return timeString;
  }
  
  try {
    // Handle simple time format like "20:00" or "8:00 PM"
    let timeToFormat = timeString.trim();
    
    // Remove any extra whitespace or characters
    timeToFormat = timeToFormat.replace(/\s+/g, ' ');
    
    // Check if it's already in 12-hour format with AM/PM
    if (timeToFormat.includes('AM') || timeToFormat.includes('PM')) {
      return timeToFormat;
    }
    
    // Parse 24-hour format (HH:MM or HH:MM:SS)
    const timeMatch = timeToFormat.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      
      if (isNaN(hours) || isNaN(minutes)) {
        return timeString;
      }
      
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    }
    
    // If parsing fails, return original string
    return timeString;
  } catch (error) {
    console.error('Error formatting time:', error, timeString);
    return timeString;
  }
};

const getStatusColor = (status) => {
  const statusColors = {
    pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
    confirmed: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    preparing: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
    ready: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300',
    out_for_delivery: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300',
    delivered: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
  };
  return statusColors[status] || 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
};

const getStatusIcon = (status) => {
  if (status === 'delivered') {
    return <CheckCircle className="w-4 h-4" />;
  }
  if (status === 'cancelled') {
    return <XCircle className="w-4 h-4" />;
  }
  return <Clock className="w-4 h-4" />;
};

function OrdersPageContent() {
  const router = useRouter();
  const { customer } = useCustomerAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-800 p-6 text-center">
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors mb-5 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Home</span>
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-pink-500 to-rose-500 dark:from-pink-600 dark:to-rose-600 rounded-xl shadow-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Order History</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1 font-medium">View and track all your orders</p>
            </div>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">No Orders Yet</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">You haven't placed any orders yet.</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-pink-600 dark:bg-pink-700 text-white rounded-lg hover:bg-pink-700 dark:hover:bg-pink-600 transition-colors"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const address = typeof order.delivery_address === 'string' 
                ? JSON.parse(order.delivery_address) 
                : order.delivery_address;
              
              return (
                <div key={order.id} className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 shadow-lg dark:shadow-xl dark:shadow-black/20 hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                  {/* Order Header */}
                  <div className="px-6 py-5 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 border-b-2 border-pink-100 dark:border-pink-800/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                          <Package className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                        </div>
                        <span className="font-bold text-lg text-gray-900 dark:text-gray-100">Order #{order.order_number}</span>
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span className="capitalize">{order.status.replace(/_/g, ' ')}</span>
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        📅 Placed on {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div className="text-right sm:text-left sm:text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Total Amount</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 dark:from-pink-400 dark:to-rose-400 bg-clip-text text-transparent">
                        {formatPrice(parseFloat(order.total_amount))}
                      </p>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="px-6 py-5">
                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                      <span className="w-1 h-5 bg-gradient-to-b from-pink-500 to-rose-500 dark:from-pink-400 dark:to-rose-400 rounded-full"></span>
                      Order Items
                    </h3>
                    <div className="space-y-4">
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item, idx) => (
                          <div key={item.id || idx} className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-pink-200 dark:hover:border-pink-700 hover:bg-pink-50/30 dark:hover:bg-pink-900/20 transition-all duration-200">
                            <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-xl overflow-hidden flex-shrink-0 shadow-sm ring-2 ring-gray-100 dark:ring-gray-700">
                              {item.product_image ? (
                                <img 
                                  src={item.product_image} 
                                  alt={item.product_name || 'Product'} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500 bg-gradient-to-br from-gray-50 dark:from-gray-800 to-gray-100 dark:to-gray-700">
                                  <Package className="w-8 h-8" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-base text-gray-900 dark:text-gray-100 mb-1.5">{item.product_name || 'Product'}</p>
                              
                              <div className="space-y-1 mb-2">
                                {item.variant_name && (
                                  <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                                    <span className="text-gray-500 dark:text-gray-400">Size:</span> {item.variant_name} {item.variant_weight ? `(${item.variant_weight})` : ''}
                                  </p>
                                )}
                                {item.tier && (
                                  <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                                    <span className="text-gray-500 dark:text-gray-400">Tier:</span> <span className="text-pink-600 dark:text-pink-400 font-semibold">{item.tier}</span>
                                  </p>
                                )}
                              </div>

                              {/* Enhanced Cake Message Display */}
                              {item.cake_message && item.cake_message.trim() && (
                                <div className="mt-3 mb-2 p-3 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 border-2 border-pink-200 dark:border-pink-800 rounded-lg shadow-sm">
                                  <div className="flex items-start gap-2">
                                    <Gift className="w-4 h-4 text-pink-600 dark:text-pink-400 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="text-xs font-bold text-pink-700 dark:text-pink-300 uppercase tracking-wide mb-1">Message on Cake</p>
                                      <p className="text-sm text-gray-800 dark:text-gray-200 font-medium italic leading-relaxed">
                                        "{item.cake_message}"
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                                <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                                  <span className="text-gray-500 dark:text-gray-400">Qty:</span> <span className="font-semibold text-gray-900 dark:text-gray-100">{item.quantity}</span>
                                </span>
                                <span className="text-base font-bold text-pink-600 dark:text-pink-400">
                                  {formatPrice(parseFloat(item.total || item.price * item.quantity))}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">No items found</p>
                      )}
                    </div>
                  </div>

                  {/* Delivery Information */}
                  <div className="px-6 py-5 bg-gradient-to-br from-gray-50 to-pink-50/30 dark:from-gray-800/50 dark:to-pink-900/10 border-t-2 border-gray-100 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                          <div className="p-1.5 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                            <MapPin className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                          </div>
                          Delivery Address
                        </h3>
                        {address ? (
                          <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1.5 font-medium">
                            <p className="font-semibold text-gray-900 dark:text-gray-100">{address.street}</p>
                            {address.landmark && (
                              <p className="text-pink-600 dark:text-pink-400">
                                <span className="text-gray-600 dark:text-gray-400">📍 Landmark:</span> {address.landmark}
                              </p>
                            )}
                            <p>{address.city}, {address.state}</p>
                            <p className="font-semibold">{address.zip_code}</p>
                            <p>{address.country}</p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400">Address not available</p>
                        )}
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                          <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          Delivery Schedule
                        </h3>
                        <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2 font-medium">
                          <p>
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Date:</span>{' '}
                            <span className="font-semibold text-gray-900 dark:text-gray-100">{formatDate(order.delivery_date)}</span>
                          </p>
                          <p>
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Time:</span>{' '}
                            <span className="font-semibold text-gray-900 dark:text-gray-100">{formatTime(order.delivery_time)}</span>
                          </p>
                        </div>
                        {order.special_instructions && (
                          <div className="mt-3 p-2.5 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <p className="text-xs font-bold text-yellow-800 dark:text-yellow-300 uppercase tracking-wide mb-1">Special Instructions</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{order.special_instructions}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default function OrdersPage() {
  return (
    <ProtectedRoute>
      <OrdersPageContent />
    </ProtectedRoute>
  );
}

