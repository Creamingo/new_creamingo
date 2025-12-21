'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Sparkles, 
  Truck,
  Clock,
  MapPin,
  CheckCircle2,
  DollarSign,
  Package,
  Shield,
  Zap,
  Calendar,
  AlertCircle,
  Phone,
  Mail
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import MobileFooter from '../../components/MobileFooter';

const ShippingPage = () => {
  const router = useRouter();

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

  const deliveryOptions = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Same-Day Delivery",
      description: "Get your order delivered on the same day when ordered before 2 PM. Available in select areas.",
      timing: "Within 4-6 hours",
      minOrder: "No minimum",
      color: "from-yellow-400 to-orange-500"
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: "Scheduled Delivery",
      description: "Plan ahead and schedule your delivery for a specific date and time slot. Perfect for special occasions.",
      timing: "Your chosen date",
      minOrder: "No minimum",
      color: "from-pink-400 to-rose-500"
    },
    {
      icon: <Truck className="w-6 h-6" />,
      title: "Standard Delivery",
      description: "Regular delivery service available for next-day or within 2-3 days, depending on your location.",
      timing: "1-3 business days",
      minOrder: "No minimum",
      color: "from-blue-400 to-indigo-500"
    },
    {
      icon: <Package className="w-6 h-6" />,
      title: "Pickup from Store",
      description: "Prefer to collect your order? Visit our factory outlet at Asuran Chowk, Gorakhpur. Ready for pickup after confirmation.",
      timing: "After confirmation",
      minOrder: "No minimum",
      color: "from-green-400 to-emerald-500"
    }
  ];

  const deliveryCharges = [
    {
      range: "Orders below ₹500",
      charge: "₹50",
      note: "Standard delivery charge"
    },
    {
      range: "₹500 - ₹1,500",
      charge: "₹30",
      note: "Reduced delivery charge"
    },
    {
      range: "Above ₹1,500",
      charge: "FREE",
      note: "Free delivery on all orders"
    },
    {
      range: "Same-Day Delivery",
      charge: "₹80",
      note: "Additional charge for same-day service"
    }
  ];

  const timeSlots = [
    {
      slot: "Morning",
      time: "9:00 AM - 12:00 PM",
      available: true
    },
    {
      slot: "Afternoon",
      time: "12:00 PM - 4:00 PM",
      available: true
    },
    {
      slot: "Evening",
      time: "4:00 PM - 7:00 PM",
      available: true
    },
    {
      slot: "Night",
      time: "7:00 PM - 9:00 PM",
      available: true
    }
  ];

  const deliveryAreas = [
    {
      area: "Gorakhpur City",
      coverage: "Full coverage",
      timing: "Same-day & scheduled",
      icon: "✓"
    },
    {
      area: "Gorakhpur Suburbs",
      coverage: "Limited coverage",
      timing: "Next-day delivery",
      icon: "✓"
    },
    {
      area: "Nearby Districts",
      coverage: "On request",
      timing: "2-3 days",
      icon: "✓"
    },
    {
      area: "Other Locations",
      coverage: "Contact us",
      timing: "Custom arrangements",
      icon: "→"
    }
  ];

  const deliveryFeatures = [
    "Fresh cakes delivered in insulated packaging",
    "Careful handling to maintain cake quality",
    "Real-time order tracking available",
    "SMS/Email notifications for delivery updates",
    "Professional delivery personnel",
    "Temperature-controlled transportation for sensitive items",
    "Signature confirmation on delivery",
    "Flexible rescheduling options"
  ];

  const importantNotes = [
    {
      title: "Delivery Time",
      description: "Delivery times are approximate and may vary based on traffic, weather conditions, and order volume. We'll keep you updated if there are any delays."
    },
    {
      title: "Delivery Address",
      description: "Please ensure your delivery address is complete and accurate. We're not responsible for delays due to incorrect addresses."
    },
    {
      title: "Unavailable Recipient",
      description: "If no one is available to receive the order, we'll attempt contact. After 2 failed attempts, the order may be rescheduled (charges may apply)."
    },
    {
      title: "Special Instructions",
      description: "For special occasions or complex deliveries, please add detailed instructions while placing your order or contact us directly."
    }
  ];

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
              <Truck className="w-6 h-6 text-yellow-300" />
              <h1 className="text-3xl md:text-4xl font-bold">Shipping & Delivery</h1>
            </div>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed">
              Fast, reliable, and fresh delivery right to your doorstep. Multiple options to suit your needs.
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Delivery Options Section */}
      <section className="py-8 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 text-center mb-6"
            >
              Delivery Options
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {deliveryOptions.map((option, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="bg-gradient-to-br from-pink-50 to-orange-50 dark:from-pink-900/20 dark:to-orange-900/20 p-6 rounded-xl border-2 border-pink-200 dark:border-pink-800 hover:border-pink-300 dark:hover:border-pink-700 transition-all duration-300 group"
                >
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${option.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                    {option.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{option.title}</h3>
                  <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">{option.description}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Clock className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                      <span className="font-semibold">{option.timing}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <DollarSign className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                      <span>{option.minOrder}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Delivery Charges Section */}
      <section className="py-8 bg-gradient-to-br from-pink-50 to-orange-50 dark:from-pink-900/20 dark:to-orange-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 text-center mb-6"
            >
              Delivery Charges
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {deliveryCharges.map((item, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="bg-white dark:bg-gray-800 p-6 rounded-xl border-2 border-pink-200 dark:border-pink-800 text-center"
                >
                  <div className="text-2xl font-bold text-pink-600 dark:text-pink-400 mb-2">{item.charge}</div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 mb-2 font-medium">{item.range}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{item.note}</div>
                </motion.div>
              ))}
            </div>

            <motion.p
              variants={fadeInUp}
              className="text-center text-base text-gray-700 dark:text-gray-300 mt-6 max-w-2xl mx-auto"
            >
              <strong>Free Delivery:</strong> Enjoy free delivery on all orders above ₹1,500. 
              Delivery charges are calculated automatically at checkout based on your order value and location.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Time Slots Section */}
      <section className="py-8 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 text-center mb-6"
            >
              Available Time Slots
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {timeSlots.map((slot, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className={`p-6 rounded-xl border-2 ${
                    slot.available 
                      ? 'bg-gradient-to-br from-pink-50 to-orange-50 dark:from-pink-900/20 dark:to-orange-900/20 border-pink-200 dark:border-pink-800' 
                      : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">{slot.slot}</h3>
                    <p className="text-base text-gray-700 dark:text-gray-300">{slot.time}</p>
                    {slot.available && (
                      <div className="mt-3 flex items-center justify-center gap-2 text-sm text-pink-600 dark:text-pink-400 font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Available</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Delivery Areas Section */}
      <section className="py-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 text-center mb-6"
            >
              Delivery Coverage
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
              {deliveryAreas.map((area, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="bg-white dark:bg-gray-800 p-6 rounded-xl border-2 border-pink-200 dark:border-pink-800"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{area.area}</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 dark:text-gray-400">Coverage:</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{area.coverage}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 dark:text-gray-400">Timing:</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{area.timing}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Delivery Features Section */}
      <section className="py-8 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 text-center mb-6"
            >
              Why Choose Our Delivery Service?
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {deliveryFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-3 p-4 bg-gradient-to-br from-pink-50 to-orange-50 dark:from-pink-900/20 dark:to-orange-900/20 rounded-lg border-2 border-pink-200 dark:border-pink-800"
                >
                  <CheckCircle2 className="w-5 h-5 text-pink-600 dark:text-pink-400 flex-shrink-0 mt-0.5" />
                  <span className="text-base text-gray-700 dark:text-gray-300 font-medium">{feature}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Important Notes Section */}
      <section className="py-8 bg-gradient-to-br from-pink-50 to-orange-50 dark:from-pink-900/20 dark:to-orange-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 text-center mb-6"
            >
              Important Information
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
              {importantNotes.map((note, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="bg-white dark:bg-gray-800 p-6 rounded-xl border-2 border-yellow-200 dark:border-yellow-800"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-1" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{note.title}</h3>
                  </div>
                  <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed pl-9">{note.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Support Section */}
      <section className="py-8 bg-gradient-to-br from-pink-500 via-rose-500 to-orange-500 dark:from-pink-600 dark:via-rose-600 dark:to-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="max-w-4xl mx-auto text-center"
          >
            <Shield className="w-12 h-12 mx-auto mb-4 text-yellow-300" />
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Questions About Delivery?
            </h2>
            <p className="text-lg text-white/90 leading-relaxed mb-6">
              Our delivery team is ready to assist you. Contact us for custom delivery arrangements, 
              special requirements, or any delivery-related queries.
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

export default ShippingPage;

