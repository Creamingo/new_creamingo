'use client';

import { useState, useEffect } from 'react';
import { X, Download, Mail, Phone, Globe, Building2 } from 'lucide-react';
import orderApi from '../../../api/orderApi';
import { formatPrice } from '../../../utils/priceFormatter';

export default function InvoiceModal({ orderNumber, isOpen, onClose }) {
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && orderNumber) {
      fetchOrderDetails();
    }
  }, [isOpen, orderNumber]);

  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch order details
      const response = await orderApi.getMyOrders();
      let orders = [];
      
      // Handle different response formats
      if (response && response.success && response.data) {
        orders = response.data.orders || [];
      } else if (response && response.data && Array.isArray(response.data.orders)) {
        orders = response.data.orders;
      } else if (Array.isArray(response)) {
        orders = response;
      } else if (response && response.orders) {
        orders = response.orders;
      }
      
      const foundOrder = orders.find(o => o.order_number === orderNumber || o.displayId === orderNumber);
      
      if (foundOrder) {
        // Ensure items array exists
        const orderWithItems = {
          ...foundOrder,
          items: foundOrder.items || [],
          customer_name: foundOrder.customer_name || foundOrder.customerName || 'Customer',
          customer_email: foundOrder.customer_email || foundOrder.customerEmail || '',
          customer_phone: foundOrder.customer_phone || foundOrder.customerPhone || '',
          total_amount: foundOrder.total_amount || foundOrder.total || 0,
          payment_method: foundOrder.payment_method || 'Online',
          payment_status: foundOrder.payment_status || foundOrder.paymentStatus || 'pending',
          created_at: foundOrder.created_at || foundOrder.createdAt || new Date().toISOString(),
          delivery_address: foundOrder.delivery_address || foundOrder.deliveryAddress || null
        };
        setOrder(orderWithItems);
      } else {
        setError('Order not found');
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError('Failed to load order details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
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

  const parseAddress = (address) => {
    if (!address) return '';
    if (typeof address === 'string') {
      try {
        return JSON.parse(address);
      } catch {
        return address;
      }
    }
    return address;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const calculateGST = (amount) => {
    // Assuming 18% GST - adjust as needed
    const gstRate = 18;
    const taxableValue = amount / (1 + gstRate / 100);
    const gstAmount = amount - taxableValue;
    const cgst = gstAmount / 2;
    const sgst = gstAmount / 2;
    return { taxableValue, gstAmount, cgst, sgst, gstRate };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4 bg-black/50 backdrop-blur-sm">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Header with Close Button */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <h2 className="text-xl font-bold text-gray-900">Invoice</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium text-sm"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Invoice Content */}
          <div className="p-6 lg:p-10">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-600"></div>
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <p className="text-red-600 font-medium">{error}</p>
              </div>
            ) : order ? (
              <div className="space-y-8">
                {/* Header Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 border-b-2 border-gray-200 pb-6">
                  {/* Left: Company Info */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg">
                        <Building2 className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900">Creamingo</h1>
                        <p className="text-sm text-gray-600 font-medium">Services Pvt. Ltd.</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 italic">Delivering happiness through our premium services</p>
                    <div className="space-y-1.5 text-sm text-gray-700">
                      <p className="font-medium">Company Address:</p>
                      <p>123 Business Street, Sector 45,</p>
                      <p>Gurgaon, Haryana - 122001, India</p>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 pt-2">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-4 h-4" />
                        <span>+91 1234567890</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-4 h-4" />
                        <span>support@creamingo.com</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-4 h-4" />
                        <span>www.creamingo.com</span>
                      </div>
                    </div>
                    <div className="pt-2 space-y-1 text-xs text-gray-600">
                      <p><span className="font-semibold">GSTIN:</span> 09AABCU9603R1ZX</p>
                      <p><span className="font-semibold">PAN:</span> AABCU9603R</p>
                    </div>
                  </div>

                  {/* Right: Invoice Info */}
                  <div className="flex flex-col items-end space-y-3">
                    <div>
                      <h2 className="text-4xl font-bold text-gray-900 mb-2">INVOICE</h2>
                      <div className="w-20 h-1 bg-pink-600 mx-auto"></div>
                    </div>
                    <div className="text-right space-y-2 text-sm">
                      <div>
                        <span className="font-semibold text-gray-700">Invoice No:</span>
                        <span className="ml-2 text-gray-900">INV-{order.order_number}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">Invoice Date:</span>
                        <span className="ml-2 text-gray-900">{formatDate(order.created_at)}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">Due Date:</span>
                        <span className="ml-2 text-gray-900">{formatDate(order.delivery_date || order.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bill To Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3 border-b-2 border-pink-200 pb-2">Bill To</h3>
                    <div className="space-y-1.5 text-sm text-gray-700">
                      <p className="font-semibold text-gray-900 text-base">{order.customer_name || 'Customer'}</p>
                      {order.delivery_address && (
                        <div className="mt-2">
                          {(() => {
                            const address = parseAddress(order.delivery_address);
                            if (typeof address === 'object') {
                              return (
                                <>
                                  {address.street && <p>{address.street}</p>}
                                  {address.city && <p>{address.city}, {address.state} {address.pincode}</p>}
                                </>
                              );
                            }
                            return <p>{address}</p>;
                          })()}
                        </div>
                      )}
                      {(order.customer_email || order.customer_phone) && (
                        <div className="mt-2 space-y-1">
                          {order.customer_email && (
                            <p className="text-gray-600">{order.customer_email}</p>
                          )}
                          {order.customer_phone && (
                            <p className="text-gray-600">{order.customer_phone}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Service Details Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b-2 border-gray-200">
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">#</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Description</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Qty</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Rate</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Taxable Value</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">GST (%)</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item, index) => {
                          const itemTotal = parseFloat(item.total || item.price * item.quantity || 0);
                          const gst = calculateGST(itemTotal);
                          
                          return (
                            <tr key={item.id || index} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-700">{index + 1}</td>
                              <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                {item.product_name || item.productName || 'Product'}
                                {(item.variant_name || item.variantName) && (
                                  <span className="text-gray-500 text-xs block mt-0.5">
                                    {item.variant_name || item.variantName} {(item.variant_weight || item.variantWeight || item.weight) && `(${item.variant_weight || item.variantWeight || item.weight})`}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700 text-center">{item.quantity || 1}</td>
                              <td className="px-4 py-3 text-sm text-gray-700 text-right">{formatPrice(parseFloat(item.price || 0))}</td>
                              <td className="px-4 py-3 text-sm text-gray-700 text-right">{formatPrice(gst.taxableValue)}</td>
                              <td className="px-4 py-3 text-sm text-gray-700 text-right">{gst.gstRate}%</td>
                              <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{formatPrice(itemTotal)}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                            No items found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Totals Section */}
                {order.items && order.items.length > 0 && (() => {
                  const totalAmount = parseFloat(order.total_amount || 0);
                  const gst = calculateGST(totalAmount);
                  
                  return (
                    <div className="flex justify-end">
                      <div className="w-full lg:w-96 space-y-2 border-t-2 border-gray-200 pt-4">
                        <div className="flex justify-between text-sm text-gray-700">
                          <span>Subtotal:</span>
                          <span className="font-semibold">{formatPrice(gst.taxableValue)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-700">
                          <span>CGST (9%):</span>
                          <span className="font-semibold">{formatPrice(gst.cgst)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-700">
                          <span>SGST (9%):</span>
                          <span className="font-semibold">{formatPrice(gst.sgst)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t-2 border-gray-300">
                          <span>Total Amount:</span>
                          <span className="text-pink-600">{formatPrice(totalAmount)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Payment Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6 border-t-2 border-gray-200">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Payment Details</h3>
                    <div className="space-y-2 text-sm text-gray-700">
                      <div className="flex justify-between">
                        <span className="font-semibold">Payment Method:</span>
                        <span className="capitalize">{order.payment_method || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold">Payment Status:</span>
                        <span className={`font-semibold capitalize ${
                          order.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          {order.payment_status || 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Terms & Conditions */}
                <div className="pt-6 border-t-2 border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Terms & Conditions</h3>
                  <ul className="space-y-1.5 text-sm text-gray-600 list-disc list-inside">
                    <li>This invoice is generated for service charges only.</li>
                    <li>Applicable GST is levied as per Government norms.</li>
                    <li>All payments are non-refundable once service is delivered.</li>
                    <li>For billing or payment queries, contact us at support@creamingo.com</li>
                    <li>Creamingo Services Pvt. Ltd. reserves the right to modify services as per terms agreed.</li>
                  </ul>
                </div>

                {/* Footer */}
                <div className="pt-8 border-t-2 border-gray-200 text-center space-y-2">
                  <p className="text-lg font-semibold text-gray-900">Thank you for choosing Creamingo!</p>
                  <p className="text-sm text-gray-600">We appreciate your business and look forward to serving you again.</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

