'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Sparkles, 
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  Phone,
  Mail
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import MobileFooter from '../../components/MobileFooter';

const RefundPolicyPage = () => {
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

  const cancellationTerms = [
    {
      title: "Same-Day Orders",
      description: "Cancellation requests for same-day delivery orders must be made at least 4 hours before the scheduled delivery time.",
      refund: "Full refund applicable"
    },
    {
      title: "Advance Orders",
      description: "Orders placed in advance can be cancelled anytime up to 24 hours before the scheduled delivery date.",
      refund: "Full refund applicable"
    },
    {
      title: "Custom/Designer Cakes",
      description: "Custom cakes can be cancelled up to 48 hours before delivery. Cancellations made less than 48 hours in advance may incur a 30% cancellation fee.",
      refund: "Partial or full refund based on timing"
    },
    {
      title: "Bulk Orders",
      description: "Bulk orders (5+ cakes) require 72 hours notice for cancellation. Late cancellations may be subject to a cancellation fee based on preparation status.",
      refund: "Subject to preparation costs"
    }
  ];

  const refundScenarios = [
    {
      icon: <CheckCircle2 className="w-6 h-6" />,
      title: "Quality Issues",
      description: "If the product received is damaged, incorrect, or doesn't meet quality standards, we offer a full refund or replacement.",
      eligible: true
    },
    {
      icon: <CheckCircle2 className="w-6 h-6" />,
      title: "Late Delivery",
      description: "If your order is delivered significantly late (beyond the promised time slot), you're eligible for a full or partial refund.",
      eligible: true
    },
    {
      icon: <CheckCircle2 className="w-6 h-6" />,
      title: "Wrong Item Delivered",
      description: "If you receive a different product than ordered, we'll arrange immediate replacement or full refund.",
      eligible: true
    },
    {
      icon: <XCircle className="w-6 h-6" />,
      title: "Change of Mind",
      description: "Refunds are not applicable for change of mind after delivery. However, you may cancel before delivery as per cancellation policy.",
      eligible: false
    },
    {
      icon: <XCircle className="w-6 h-6" />,
      title: "Consumed Products",
      description: "Products that have been consumed or partially consumed cannot be refunded unless there's a quality issue.",
      eligible: false
    }
  ];

  const refundProcess = [
    {
      step: "1",
      title: "Contact Us",
      description: "Reach out via phone, email, or contact form within 24 hours of delivery."
    },
    {
      step: "2",
      title: "Provide Details",
      description: "Share your order number, photos (if quality issue), and reason for refund request."
    },
    {
      step: "3",
      title: "Review Process",
      description: "Our team will review your request within 24-48 hours and verify the issue."
    },
    {
      step: "4",
      title: "Refund Processing",
      description: "Once approved, refunds will be processed to your original payment method within 5-7 business days."
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
              <Shield className="w-6 h-6 text-yellow-300" />
              <h1 className="text-3xl md:text-4xl font-bold">Refund & Cancellation Policy</h1>
            </div>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed">
              Our commitment to your satisfaction. Clear, fair, and customer-friendly policies.
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Overview Section */}
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
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Our Commitment</h2>
              <div className="space-y-4 text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                <p>
                  At Creamingo, we strive to provide the best possible experience. We understand that sometimes things don't go as planned, 
                  and we're here to make it right. This policy outlines our refund and cancellation terms to ensure transparency and fairness.
                </p>
                <p>
                  Our policies are designed to be customer-friendly while being fair to our business operations. We aim to process all 
                  refund requests promptly and ensure you're satisfied with the resolution.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Cancellation Policy Section */}
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
              Cancellation Policy
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
              {cancellationTerms.map((term, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="bg-white dark:bg-gray-800 p-6 rounded-xl border-2 border-pink-200 dark:border-pink-800 hover:border-pink-300 dark:hover:border-pink-700 transition-colors"
                >
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">{term.title}</h3>
                  <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">{term.description}</p>
                  <div className="flex items-center gap-2 text-sm font-semibold text-pink-600 dark:text-pink-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{term.refund}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Refund Eligibility Section */}
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
              Refund Eligibility
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
              {refundScenarios.map((scenario, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className={`p-6 rounded-xl border-2 ${
                    scenario.eligible 
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  }`}
                >
                  <div className={`flex items-start gap-3 mb-3 ${
                    scenario.eligible ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {scenario.icon}
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{scenario.title}</h3>
                  </div>
                  <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">{scenario.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Refund Process Section */}
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
              How to Request a Refund
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
              {refundProcess.map((step, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="bg-white dark:bg-gray-800 p-6 rounded-xl border-2 border-pink-200 dark:border-pink-800 relative"
                >
                  <div className="absolute -top-4 -left-4 w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 dark:from-pink-600 dark:to-rose-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg dark:shadow-xl dark:shadow-black/30">
                    {step.step}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 mt-2">{step.title}</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Important Notes Section */}
      <section className="py-8 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <motion.div
              variants={fadeInUp}
              className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 p-6 rounded-xl"
            >
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-1" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Important Notes</h3>
              </div>
              <ul className="space-y-3 text-base text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 font-bold mt-1">•</span>
                  <span>Refund requests must be submitted within 24 hours of delivery for quality issues.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 font-bold mt-1">•</span>
                  <span>Refunds are processed to the original payment method and may take 5-7 business days to reflect.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 font-bold mt-1">•</span>
                  <span>For cash on delivery orders, refunds will be processed via bank transfer or store credit.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 font-bold mt-1">•</span>
                  <span>In case of replacement, we'll deliver the correct item at no additional cost within 24 hours.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 font-bold mt-1">•</span>
                  <span>All refunds are subject to verification and approval by our customer service team.</span>
                </li>
              </ul>
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
              Need Help with Refunds?
            </h2>
            <p className="text-lg text-white/90 leading-relaxed mb-6">
              Our customer service team is here to assist you with any refund or cancellation queries. 
              Contact us and we'll resolve your concern promptly.
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

      {/* Policy Update Section */}
      <section className="py-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700">
              <Clock className="w-8 h-8 text-pink-600 dark:text-pink-400 mx-auto mb-3" />
              <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                <strong>Policy Updates:</strong> This policy is subject to change. We recommend reviewing it periodically. 
                Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
      <MobileFooter />
    </div>
  );
};

export default RefundPolicyPage;

