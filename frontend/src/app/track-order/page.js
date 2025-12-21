'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Sparkles, 
  Package,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  Phone,
  Mail,
  AlertCircle,
  Loader2,
  Calendar,
  User,
  CreditCard,
  FileText
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import MobileFooter from '../../components/MobileFooter';

const TrackOrderPage = () => {
  const router = useRouter();
  const [orderId, setOrderId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [orderFound, setOrderFound] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  // Mock order statuses
  const orderStatuses = [
    { id: 1, status: 'Order Placed', completed: true, description: 'Your order has been confirmed', date: '2025-01-15 10:30 AM' },
    { id: 2, status: 'Preparing', completed: true, description: 'We\'re preparing your order', date: '2025-01-15 11:00 AM' },
    { id: 3, status: 'Ready for Pickup', completed: true, description: 'Your order is ready', date: '2025-01-15 1:30 PM' },
    { id: 4, status: 'Out for Delivery', completed: true, description: 'On the way to you', date: '2025-01-15 2:00 PM' },
    { id: 5, status: 'Delivered', completed: false, description: 'Expected delivery time', date: '2025-01-15 4:00 PM' }
  ];

  const mockOrderDetails = {
    orderId: 'ORD-12345',
    orderDate: 'January 15, 2025',
    deliveryDate: 'January 15, 2025',
    deliveryTime: '4:00 PM - 6:00 PM',
    customerName: 'John Doe',
    phone: '+91-9876543210',
    deliveryAddress: '123 Baker Street, Gorakhpur, Uttar Pradesh - 273001',
    paymentMethod: 'Cash on Delivery',
    orderTotal: '₹1,250',
    items: [
      { name: 'Chocolate Truffle Cake (1kg)', quantity: 1, price: '₹750' },
      { name: 'Red Velvet Cake (0.5kg)', quantity: 2, price: '₹500' }
    ]
  };

  const handleSearch = (e) => {
    e.preventDefault();
    
    if (!orderId.trim() && !phoneNumber.trim()) {
      alert('Please enter Order ID or Phone Number');
      return;
    }

    setIsSearching(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSearching(false);
      setOrderFound(true);
      setOrderDetails(mockOrderDetails);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      {/* Hero Section */}
      <motion.section
        initial="initial"
        animate="animate"
        variants={staggerContainer}
        className="relative bg-gradient-to-br from-pink-500 via-rose-500 to-orange-500 dark:from-pink-600 dark:via-rose-600 dark:to-orange-600 text-white py-10 overflow-hidden"
      >
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.button
            variants={fadeInUp}
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/90 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </motion.button>

          <motion.div variants={fadeInUp} className="max-w-4xl">
            <div className="flex items-center gap-3 mb-3">
              <Package className="w-6 h-6 text-yellow-300" />
              <h1 className="text-3xl md:text-4xl font-bold">Track Your Order</h1>
            </div>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed">
              Enter your Order ID or Phone Number to get real-time updates on your order status.
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Search Form Section */}
      <section className="py-8 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div
              variants={fadeInUp}
              className="bg-gradient-to-br from-pink-50 to-orange-50 dark:from-pink-900/20 dark:to-orange-900/20 p-8 rounded-xl border-2 border-pink-200 dark:border-pink-800"
            >
              <form onSubmit={handleSearch} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Order ID</label>
                  <input
                    type="text"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-pink-500 dark:focus:border-pink-400 focus:outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    placeholder="Enter your Order ID (e.g., ORD-12345)"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gradient-to-br from-pink-50 to-orange-50 dark:from-pink-900/20 dark:to-orange-900/20 text-gray-500 dark:text-gray-400">OR</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-pink-500 dark:focus:border-pink-400 focus:outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    placeholder="Enter your registered phone number"
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={isSearching}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-pink-600 to-rose-600 dark:from-pink-700 dark:to-rose-700 text-white px-6 py-4 rounded-lg font-semibold text-lg shadow-lg dark:shadow-xl dark:shadow-black/30 hover:shadow-xl transition-shadow flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      Track Order
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Order Status Timeline */}
      {orderFound && orderDetails && (
        <section className="py-8 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.h2
                variants={fadeInUp}
                className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 text-center mb-8"
              >
                Order Status
              </motion.h2>

              <div className="max-w-3xl mx-auto">
                <div className="relative">
                  {/* Timeline Line */}
                  <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-700"></div>

                  {orderStatuses.map((status, index) => (
                    <motion.div
                      key={status.id}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="relative pl-24 pb-8 last:pb-0"
                    >
                      {/* Timeline Dot */}
                      <div className={`absolute left-6 top-2 w-4 h-4 rounded-full border-4 ${
                        status.completed 
                          ? 'bg-green-500 dark:bg-green-400 border-white dark:border-gray-800 shadow-lg dark:shadow-xl dark:shadow-black/30' 
                          : 'bg-gray-300 dark:bg-gray-600 border-white dark:border-gray-800'
                      }`}></div>

                      {/* Content */}
                      <div className={`p-6 rounded-xl border-2 ${
                        status.completed 
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                      }`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {status.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                            ) : (
                              <Clock className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                            )}
                            <h3 className={`text-lg font-bold ${
                              status.completed ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {status.status}
                            </h3>
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">{status.date}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 ml-7">{status.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Order Details Section */}
      {orderFound && orderDetails && (
        <section className="py-8 bg-white dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.h2
                variants={fadeInUp}
                className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 text-center mb-8"
              >
                Order Details
              </motion.h2>

              <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Order Information */}
                <motion.div
                  variants={fadeInUp}
                  className="bg-gradient-to-br from-pink-50 to-orange-50 dark:from-pink-900/20 dark:to-orange-900/20 p-6 rounded-xl border-2 border-pink-200 dark:border-pink-800"
                >
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                    Order Information
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Order ID:</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{orderDetails.orderId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Order Date:</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{orderDetails.orderDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Delivery Date:</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{orderDetails.deliveryDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Delivery Time:</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{orderDetails.deliveryTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Amount:</span>
                      <span className="font-semibold text-pink-600 dark:text-pink-400 text-lg">{orderDetails.orderTotal}</span>
                    </div>
                  </div>
                </motion.div>

                {/* Delivery Information */}
                <motion.div
                  variants={fadeInUp}
                  className="bg-gradient-to-br from-pink-50 to-orange-50 dark:from-pink-900/20 dark:to-orange-900/20 p-6 rounded-xl border-2 border-pink-200 dark:border-pink-800"
                >
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                    Delivery Information
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400 block mb-1">Customer:</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{orderDetails.customerName}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400 block mb-1">Phone:</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{orderDetails.phone}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400 block mb-1">Address:</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{orderDetails.deliveryAddress}</span>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <CreditCard className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">Payment:</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{orderDetails.paymentMethod}</span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Order Items */}
              <motion.div
                variants={fadeInUp}
                className="mt-6 bg-gradient-to-br from-pink-50 to-orange-50 dark:from-pink-900/20 dark:to-orange-900/20 p-6 rounded-xl border-2 border-pink-200 dark:border-pink-800"
              >
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                  Order Items
                </h3>
                <div className="space-y-3">
                  {orderDetails.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <div>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{item.name}</span>
                        <span className="text-gray-600 dark:text-gray-400 ml-2">x {item.quantity}</span>
                      </div>
                      <span className="font-semibold text-pink-600 dark:text-pink-400">{item.price}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Help Section */}
      <section className="py-8 bg-gradient-to-br from-pink-500 via-rose-500 to-orange-500 dark:from-pink-600 dark:via-rose-600 dark:to-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="max-w-4xl mx-auto text-center"
          >
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-300" />
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Need Help Tracking Your Order?
            </h2>
            <p className="text-lg text-white/90 leading-relaxed mb-6">
              Can't find your order or have questions about the delivery? Our customer service team is here to help.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="tel:+917570030333"
                className="px-6 py-3 bg-white dark:bg-gray-800 text-pink-600 dark:text-pink-400 rounded-lg font-semibold hover:shadow-lg dark:hover:shadow-xl dark:hover:shadow-black/30 transition-shadow flex items-center gap-2"
              >
                <Phone className="w-5 h-5" />
                Call: +91-7570030333
              </a>
              <a
                href="mailto:info@creamingo.com"
                className="px-6 py-3 bg-white/20 dark:bg-gray-800/30 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-white/30 dark:hover:bg-gray-800/50 transition-colors border-2 border-white/30 dark:border-gray-700/50 flex items-center gap-2"
              >
                <Mail className="w-5 h-5" />
                Email Us
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
      <MobileFooter />
    </div>
  );
};

export default TrackOrderPage;

