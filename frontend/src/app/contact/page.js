'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Sparkles, 
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageCircle,
  Send,
  CheckCircle2,
  Headphones,
  HelpCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import MobileFooter from '../../components/MobileFooter';

const ContactPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

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

  const contactMethods = [
    {
      icon: <Phone className="w-6 h-6" />,
      title: "Call Us",
      details: "+91-7570030333",
      link: "tel:+917570030333",
      description: "Available 24/7 for your convenience"
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: "Email Us",
      details: "info@creamingo.com",
      link: "mailto:info@creamingo.com",
      description: "We'll respond within 24 hours"
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Visit Us",
      details: "Asuran Chowk, Gorakhpur, UP",
      link: "#",
      description: "Come say hello at our location"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Business Hours",
      details: "Mon-Sun: 9 AM - 9 PM",
      link: "#",
      description: "Open every day for you"
    }
  ];

  const quickInfo = [
    {
      question: "How do I place an order?",
      answer: "You can order online through our website, call us, or visit our factory outlet. We also offer convenient same-day delivery within available time slots."
    },
    {
      question: "What are your delivery charges?",
      answer: "Delivery charges vary based on location and order value. Free delivery is available for orders above ₹1500. Check our delivery page for more details."
    },
    {
      question: "Can I customize my cake?",
      answer: "Absolutely! We specialize in custom cake designs. Contact us with your requirements and we'll create the perfect cake for your celebration."
    },
    {
      question: "Do you offer bulk orders?",
      answer: "Yes, we handle bulk orders for events, parties, and corporate functions. Contact us in advance for special pricing and arrangements."
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    }, 3000);
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
              <MessageCircle className="w-6 h-6 text-yellow-300" />
              <h1 className="text-3xl md:text-4xl font-bold">Contact Us</h1>
            </div>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed">
              We're here to help! Get in touch with us for any questions, orders, or inquiries.
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Contact Methods Section */}
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
              Get in Touch
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {contactMethods.map((method, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="bg-gradient-to-br from-pink-50 to-orange-50 dark:from-pink-900/20 dark:to-orange-900/20 p-6 rounded-xl border-2 border-pink-200 dark:border-pink-800 hover:border-pink-300 dark:hover:border-pink-700 transition-all duration-300 text-center group"
                >
                  <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 dark:from-pink-600 dark:to-rose-600 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                    {method.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">{method.title}</h3>
                  {method.link !== '#' ? (
                    <a 
                      href={method.link}
                      className="text-base text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 font-semibold mb-2 block transition-colors"
                    >
                      {method.details}
                    </a>
                  ) : (
                    <p className="text-base text-pink-600 dark:text-pink-400 font-semibold mb-2">{method.details}</p>
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-400">{method.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
              Send Us a Message
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-center text-base text-gray-700 dark:text-gray-300 mb-8"
            >
              Fill out the form below and we'll get back to you as soon as possible.
            </motion.p>

            {isSubmitted && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3"
              >
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <p className="text-green-700 dark:text-green-300 font-medium">Thank you! Your message has been sent. We'll get back to you soon.</p>
              </motion.div>
            )}

            <motion.form
              variants={fadeInUp}
              onSubmit={handleSubmit}
              className="bg-white dark:bg-gray-800 p-8 rounded-xl border-2 border-pink-200 dark:border-pink-800 shadow-lg dark:shadow-xl dark:shadow-black/20"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-pink-500 dark:focus:border-pink-400 focus:outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-pink-500 dark:focus:border-pink-400 focus:outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-pink-500 dark:focus:border-pink-400 focus:outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    placeholder="+91-XXXXXXXXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Subject *</label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-pink-500 dark:focus:border-pink-400 focus:outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    placeholder="What's this about?"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Message *</label>
                <textarea
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  rows={5}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-pink-500 dark:focus:border-pink-400 focus:outline-none transition-colors resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  placeholder="Tell us how we can help you..."
                ></textarea>
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-pink-600 to-rose-600 dark:from-pink-700 dark:to-rose-700 text-white px-6 py-4 rounded-lg font-semibold text-lg shadow-lg dark:shadow-xl dark:shadow-black/30 hover:shadow-xl transition-shadow flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                Send Message
              </motion.button>
            </motion.form>
          </motion.div>
        </div>
      </section>

      {/* Quick Info / FAQ Section */}
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
              className="flex items-center gap-3 justify-center mb-6"
            >
              <HelpCircle className="w-6 h-6 text-pink-600 dark:text-pink-400" />
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                Quick Answers
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickInfo.map((item, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="bg-gradient-to-br from-pink-50 to-orange-50 dark:from-pink-900/20 dark:to-orange-900/20 p-6 rounded-xl border-2 border-pink-200 dark:border-pink-800"
                >
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-start gap-2">
                    <span className="text-pink-600 dark:text-pink-400">Q:</span>
                    <span>{item.question}</span>
                  </h3>
                  <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed pl-6">
                    {item.answer}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Support Section */}
      <section className="py-8 bg-gradient-to-br from-pink-500 via-rose-500 to-orange-500 dark:from-pink-600 dark:via-rose-600 dark:to-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="max-w-4xl mx-auto text-center"
          >
            <Headphones className="w-12 h-12 mx-auto mb-4 text-yellow-300" />
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Need Immediate Assistance?
            </h2>
            <p className="text-lg text-white/90 leading-relaxed mb-6">
              Our customer support team is available 24/7 to help you with orders, inquiries, or any issues you may have.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="tel:+917570030333"
                className="px-6 py-3 bg-white dark:bg-gray-800 text-pink-600 dark:text-pink-400 rounded-lg font-semibold hover:shadow-lg dark:hover:shadow-xl dark:hover:shadow-black/30 transition-shadow"
              >
                Call Now: +91-7570030333
              </a>
              <a
                href="mailto:info@creamingo.com"
                className="px-6 py-3 bg-white/20 dark:bg-gray-800/30 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-white/30 dark:hover:bg-gray-800/50 transition-colors border-2 border-white/30 dark:border-gray-700/50"
              >
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

export default ContactPage;

