'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Sparkles, 
  FileText,
  Shield,
  AlertCircle,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  Scale
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import MobileFooter from '../../components/MobileFooter';

const TermsPage = () => {
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
        staggerChildren: 0.1
      }
    }
  };

  const termsSections = [
    {
      title: "1. Acceptance of Terms",
      content: [
        "By accessing and using the Creamingo website and services, you accept and agree to be bound by these Terms & Conditions.",
        "If you do not agree with any part of these terms, you must not use our services.",
        "We reserve the right to update these terms at any time, and continued use of our services constitutes acceptance of the modified terms."
      ]
    },
    {
      title: "2. Use of Website",
      content: [
        "You must be at least 18 years old or have parental consent to place orders through our website.",
        "You agree to provide accurate, current, and complete information during registration and ordering.",
        "You are responsible for maintaining the confidentiality of your account credentials.",
        "Any unauthorized use of your account should be reported to us immediately."
      ]
    },
    {
      title: "3. Product Information",
      content: [
        "We strive to provide accurate product descriptions, images, and pricing. However, slight variations may occur.",
        "Product images are for illustration purposes and may not exactly match the delivered product.",
        "Prices, availability, and product details are subject to change without notice.",
        "We reserve the right to limit quantities or refuse service to anyone at our discretion."
      ]
    },
    {
      title: "4. Orders and Payment",
      content: [
        "All orders are subject to product availability and acceptance by Creamingo.",
        "We accept various payment methods including cash on delivery, credit/debit cards, and online payment gateways.",
        "Payment must be received before delivery, unless cash on delivery option is selected.",
        "Order confirmation will be sent via email or SMS once payment is verified.",
        "We reserve the right to cancel any order at our discretion, with full refund if payment was already processed."
      ]
    },
    {
      title: "5. Delivery Terms",
      content: [
        "Delivery times are estimates and may vary based on location, traffic, and order volume.",
        "Risk of loss and title for products pass to you upon delivery to the carrier or our delivery personnel.",
        "We are not responsible for delays beyond our control, including weather, traffic, or carrier issues.",
        "Please ensure someone is available to receive the order at the specified delivery address.",
        "Additional charges may apply for remote locations or special delivery requirements."
      ]
    },
    {
      title: "6. Cancellation and Refunds",
      content: [
        "You may cancel orders according to our Cancellation Policy. Please refer to the Refund & Cancellation Policy page for detailed terms.",
        "Cancellation requests must be submitted within the specified timeframes.",
        "Refunds will be processed to the original payment method within 5-7 business days of approval.",
        "Custom or personalized orders may have different cancellation terms."
      ]
    },
    {
      title: "7. Intellectual Property",
      content: [
        "All content on this website, including text, graphics, logos, images, and software, is the property of Creamingo.",
        "You may not reproduce, distribute, or create derivative works without our written permission.",
        "The Creamingo name, logo, and branding are trademarks and may not be used without authorization."
      ]
    },
    {
      title: "8. Privacy Policy",
      content: [
        "Your use of our services is also governed by our Privacy Policy. Please review it to understand how we collect, use, and protect your information.",
        "By using our services, you consent to the collection and use of information as described in our Privacy Policy."
      ]
    },
    {
      title: "9. Limitation of Liability",
      content: [
        "Creamingo shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our services.",
        "Our total liability for any claim shall not exceed the amount paid by you for the specific product or service.",
        "We are not responsible for any allergic reactions or health issues arising from consumption of our products.",
        "Customers with food allergies should inform us before placing orders."
      ]
    },
    {
      title: "10. Indemnification",
      content: [
        "You agree to indemnify and hold harmless Creamingo, its employees, and partners from any claims, damages, or expenses arising from your use of our services or violation of these terms."
      ]
    },
    {
      title: "11. Governing Law",
      content: [
        "These Terms & Conditions are governed by the laws of India and the state of Uttar Pradesh.",
        "Any disputes arising from these terms shall be subject to the exclusive jurisdiction of courts in Gorakhpur, Uttar Pradesh."
      ]
    },
    {
      title: "12. Severability",
      content: [
        "If any provision of these terms is found to be invalid or unenforceable, the remaining provisions shall remain in full effect."
      ]
    },
    {
      title: "13. Contact Information",
      content: [
        "For questions about these Terms & Conditions, please contact us:",
        "Email: info@creamingo.com",
        "Phone: +91-7570030333",
        "Address: Asuran Chowk, Gorakhpur, Uttar Pradesh"
      ]
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
              <Scale className="w-6 h-6 text-yellow-300" />
              <h1 className="text-3xl md:text-4xl font-bold">Terms & Conditions</h1>
            </div>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed">
              Please read these terms carefully before using our services. Your use constitutes acceptance of these terms.
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Introduction Section */}
      <section className="py-8 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <motion.div variants={fadeInUp} className="bg-gradient-to-br from-pink-50 to-orange-50 dark:from-pink-900/20 dark:to-orange-900/20 p-8 rounded-xl border-2 border-pink-200 dark:border-pink-800">
              <div className="flex items-start gap-3 mb-4">
                <FileText className="w-6 h-6 text-pink-600 dark:text-pink-400 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Introduction</h2>
                  <div className="space-y-4 text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                    <p>
                      Welcome to Creamingo. These Terms & Conditions govern your access to and use of our website, 
                      products, and services. By using our services, you agree to be bound by these terms.
                    </p>
                    <p>
                      We recommend reading these terms carefully. If you have any questions, please contact our 
                      customer service team before placing an order.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Terms Sections */}
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
              className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 text-center mb-8"
            >
              Terms & Conditions
            </motion.h2>

            <div className="max-w-5xl mx-auto space-y-6">
              {termsSections.map((section, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="bg-white dark:bg-gray-800 p-6 rounded-xl border-2 border-pink-200 dark:border-pink-800 hover:border-pink-300 dark:hover:border-pink-700 transition-colors"
                >
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                    {section.title}
                  </h3>
                  <ul className="space-y-3">
                    {section.content.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-3 text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                        <CheckCircle2 className="w-5 h-5 text-pink-600 dark:text-pink-400 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Important Notice Section */}
      <section className="py-8 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <motion.div
              variants={fadeInUp}
              className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 p-6 rounded-xl"
            >
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Important Notice</h3>
                  <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                    These Terms & Conditions are subject to change without notice. It is your responsibility to 
                    review these terms periodically for any updates.
                  </p>
                  <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                    <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Agreement Section */}
      <section className="py-8 bg-gradient-to-br from-pink-50 to-orange-50 dark:from-pink-900/20 dark:to-orange-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <motion.div
              variants={fadeInUp}
              className="bg-white dark:bg-gray-800 p-8 rounded-xl border-2 border-pink-200 dark:border-pink-800 text-center"
            >
              <Shield className="w-12 h-12 text-pink-600 dark:text-pink-400 mx-auto mb-4" />
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                By Using Our Services
              </h2>
              <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                You acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions 
                and our Privacy Policy. If you do not agree to these terms, please discontinue use of our services.
              </p>
            </motion.div>
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
            <FileText className="w-12 h-12 mx-auto mb-4 text-yellow-300" />
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Questions About Our Terms?
            </h2>
            <p className="text-lg text-white/90 leading-relaxed mb-6">
              If you have any questions or concerns regarding these Terms & Conditions, please don't hesitate to contact us. 
              Our team is here to help clarify any points.
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

export default TermsPage;

