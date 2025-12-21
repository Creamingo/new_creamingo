'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Users,
  TrendingUp,
  Shield,
  Award,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  BookOpen,
  Headphones,
  BarChart3,
  Rocket,
  ChevronDown
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import MobileFooter from '../../components/MobileFooter';

const FranchisePage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    interest: 'franchise',
    message: ''
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const interestOptions = [
    { value: 'franchise', label: 'Franchise Opportunity' },
    { value: 'partnership', label: 'Strategic Partnership' },
    { value: 'both', label: 'Both' }
  ];

  const selectedOption = interestOptions.find(opt => opt.value === formData.interest) || interestOptions[0];
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

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

  const benefits = [
    {
      icon: <Rocket className="w-6 h-6" />,
      title: "Proven Business Model",
      description: "Join a successful brand with a tested business model that's already making waves in the market.",
      color: "from-blue-400 to-indigo-500"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Low Investment, High Returns",
      description: "Startup-friendly investment options with potential for impressive returns in the growing bakery industry.",
      color: "from-green-400 to-emerald-500"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Complete Support System",
      description: "From training to marketing, we provide end-to-end support to ensure your success.",
      color: "from-purple-400 to-pink-500"
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Brand Recognition",
      description: "Leverage our established brand name and customer trust from day one.",
      color: "from-orange-400 to-red-500"
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Comprehensive Training",
      description: "Extensive training program covering operations, baking techniques, customer service, and management.",
      color: "from-pink-400 to-rose-500"
    },
    {
      icon: <Headphones className="w-6 h-6" />,
      title: "Ongoing Support",
      description: "24/7 support team ready to help you navigate challenges and maximize opportunities.",
      color: "from-yellow-400 to-orange-500"
    }
  ];

  const supportServices = [
    "Site Selection & Store Setup Assistance",
    "Complete Equipment & Supply Chain Support",
    "Marketing & Branding Materials",
    "Staff Training & Operations Manual",
    "Technology Platform & POS System",
    "Quality Control & Standard Operating Procedures",
    "Ongoing Business Consultation",
    "Marketing Campaign Support"
  ];

  const partnershipTypes = [
    {
      title: "Franchise Opportunity",
      description: "Own and operate your own Creamingo outlet with full franchise support",
      features: [
        "Exclusive territory rights",
        "Full business model access",
        "Complete training & support",
        "Marketing assistance"
      ]
    },
    {
      title: "Strategic Partnerships",
      description: "Collaborate with Creamingo for mutual growth and expansion",
      features: [
        "Joint venture opportunities",
        "Distribution partnerships",
        "Corporate tie-ups",
        "Regional expansion programs"
      ]
    }
  ];

  const investmentHighlights = [
    {
      label: "Low Initial Investment",
      value: "Flexible Options"
    },
    {
      label: "Quick Break-even",
      value: "6-12 Months"
    },
    {
      label: "Ongoing Royalty",
      value: "Competitive Rates"
    },
    {
      label: "Return on Investment",
      value: "High Potential"
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    alert('Thank you for your interest! We will contact you shortly.');
    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      city: '',
      interest: 'franchise',
      message: ''
    });
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
              <Users className="w-6 h-6 text-yellow-300" />
              <h1 className="text-3xl md:text-4xl font-bold">Franchise & Partnerships</h1>
            </div>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed">
              Join the Creamingo family and build a successful business with a trusted brand. Perfect opportunity for startups and entrepreneurs.
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Why Join Section */}
      <section className="py-8 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto text-center mb-8"
          >
            <motion.h2 variants={fadeInUp} className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Why Partner with Creamingo?
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
              Creamingo is not just a bakery—it's a movement. We're building a network of passionate entrepreneurs who share our vision of bringing joy to celebrations. As a growing startup, we understand the challenges of starting a business, and we're here to make your journey easier.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md dark:shadow-xl dark:shadow-black/20 hover:shadow-lg transition-all duration-300 border-2 border-gray-100 dark:border-gray-700 hover:border-pink-200 dark:hover:border-pink-700 group"
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${benefit.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                  {benefit.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">{benefit.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Investment Highlights */}
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
              Investment Highlights
            </motion.h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {investmentHighlights.map((item, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="bg-white dark:bg-gray-800 p-6 rounded-xl border-2 border-pink-200 dark:border-pink-800 text-center"
                >
                  <div className="text-xl md:text-2xl font-bold text-pink-600 dark:text-pink-400 mb-2">{item.value}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{item.label}</div>
                </motion.div>
              ))}
            </div>

            <motion.p
              variants={fadeInUp}
              className="text-center text-base text-gray-700 dark:text-gray-300 mt-6 max-w-2xl mx-auto"
            >
              We offer flexible investment packages designed for startups and first-time entrepreneurs. 
              Our team will work with you to create a plan that fits your budget and goals.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Partnership Types */}
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
              Partnership Opportunities
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {partnershipTypes.map((type, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="bg-gradient-to-br from-pink-50 to-orange-50 dark:from-pink-900/20 dark:to-orange-900/20 p-6 rounded-xl border-2 border-pink-200 dark:border-pink-800"
                >
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">{type.title}</h3>
                  <p className="text-base text-gray-700 dark:text-gray-300 mb-4">{type.description}</p>
                  <ul className="space-y-2">
                    {type.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <CheckCircle2 className="w-5 h-5 text-pink-600 dark:text-pink-400 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Support Services */}
      <section className="py-8 bg-gray-50 dark:bg-gray-900">
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
              Complete Support Package
            </motion.h2>

            <motion.div
              variants={fadeInUp}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {supportServices.map((service, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors border-2 border-gray-100 dark:border-gray-700"
                >
                  <CheckCircle2 className="w-5 h-5 text-pink-600 dark:text-pink-400 flex-shrink-0 mt-0.5" />
                  <span className="text-base text-gray-700 dark:text-gray-300 font-medium">{service}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Success Story/Metrics */}
      <section className="py-8 bg-gradient-to-br from-pink-500 via-rose-500 to-orange-500 dark:from-pink-600 dark:via-rose-600 dark:to-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="max-w-4xl mx-auto text-center"
          >
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-yellow-300" />
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Join a Growing Network
            </h2>
            <p className="text-lg text-white/90 leading-relaxed mb-6">
              Creamingo is expanding rapidly across the region. With our proven business model and comprehensive support, 
              our partners are seeing strong growth and profitability. Be part of this exciting journey!
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="px-4 py-2 bg-white/20 rounded-full text-sm font-semibold backdrop-blur-sm">
                ✓ Growing Market
              </div>
              <div className="px-4 py-2 bg-white/20 rounded-full text-sm font-semibold backdrop-blur-sm">
                ✓ Strong Brand Recognition
              </div>
              <div className="px-4 py-2 bg-white/20 rounded-full text-sm font-semibold backdrop-blur-sm">
                ✓ Proven Track Record
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-8 bg-white dark:bg-gray-800">
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
              Let's Start the Conversation
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-center text-base text-gray-700 dark:text-gray-300 mb-8"
            >
              Interested in joining the Creamingo family? Fill out the form below and our team will get back to you within 24 hours.
            </motion.p>

            <motion.form
              variants={fadeInUp}
              onSubmit={handleSubmit}
              className="bg-gradient-to-br from-pink-50 to-orange-50 dark:from-pink-900/20 dark:to-orange-900/20 p-8 rounded-xl border-2 border-pink-200 dark:border-pink-800"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-pink-500 dark:focus:border-pink-400 focus:outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    placeholder="Your Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email *</label>
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
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Phone *</label>
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
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">City *</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-pink-500 dark:focus:border-pink-400 focus:outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    placeholder="Your City"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Interest Type *</label>
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 focus:border-pink-500 dark:focus:border-pink-400 focus:outline-none transition-colors bg-white dark:bg-gray-700 text-left flex items-center justify-between hover:border-pink-300 dark:hover:border-pink-600"
                  >
                    <span className="text-gray-900 dark:text-gray-100">{selectedOption.label}</span>
                    <ChevronDown 
                      className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  
                  {isDropdownOpen && (
                    <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-xl dark:shadow-black/30 border-2 border-pink-200 dark:border-pink-800 overflow-hidden">
                      {interestOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setFormData({...formData, interest: option.value});
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors flex items-center gap-2 ${
                            formData.interest === option.value ? 'bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 font-medium' : 'text-gray-900 dark:text-gray-100'
                          }`}
                        >
                          {formData.interest === option.value && (
                            <CheckCircle2 className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                          )}
                          <span>{option.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Hidden input for form validation */}
                  <input
                    type="hidden"
                    value={formData.interest}
                    required
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Message</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-pink-500 dark:focus:border-pink-400 focus:outline-none transition-colors resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  placeholder="Tell us about your interest and any questions you may have..."
                ></textarea>
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-pink-600 to-rose-600 dark:from-pink-700 dark:to-rose-700 text-white px-6 py-4 rounded-lg font-semibold text-lg shadow-lg dark:shadow-xl dark:shadow-black/30 hover:shadow-xl transition-shadow"
              >
                Submit Inquiry
              </motion.button>
            </motion.form>
          </motion.div>
        </div>
      </section>

      {/* Contact Info Section */}
      <section className="py-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 text-center mb-6"
            >
              Get in Touch
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div
                variants={fadeInUp}
                className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-100 dark:border-gray-700"
              >
                <Phone className="w-8 h-8 text-pink-600 dark:text-pink-400 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Call Us</h3>
                <a href="tel:+917570030333" className="text-base text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors">
                  +91-7570030333
                </a>
              </motion.div>
              <motion.div
                variants={fadeInUp}
                className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-100 dark:border-gray-700"
              >
                <Mail className="w-8 h-8 text-pink-600 dark:text-pink-400 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Email Us</h3>
                <a href="mailto:franchise@creamingo.com" className="text-base text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors">
                  franchise@creamingo.com
                </a>
              </motion.div>
              <motion.div
                variants={fadeInUp}
                className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-100 dark:border-gray-700"
              >
                <MapPin className="w-8 h-8 text-pink-600 dark:text-pink-400 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Visit Us</h3>
                <p className="text-base text-gray-600 dark:text-gray-400">
                  Asuran Chowk<br />Gorakhpur, Uttar Pradesh
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
      <MobileFooter />
    </div>
  );
};

export default FranchisePage;

