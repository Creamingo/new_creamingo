'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  HelpCircle,
  Search,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  MessageCircle,
  Ticket,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Copy,
  Check,
  Truck,
  Package,
  CreditCard,
  User,
  RefreshCw,
  Gift,
  Cake,
  Clock,
  MapPin,
  Sparkles,
  ArrowRight,
  Filter,
  X,
  TrendingUp,
  Calendar
} from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import MobileFooter from '../../components/MobileFooter';

const faqCategories = [
  {
    id: 'delivery',
    name: 'Delivery',
    icon: Truck,
    color: 'from-blue-500 to-cyan-500',
    questions: [
      {
        id: 'd1',
        question: 'What are the delivery charges?',
        answer: 'Delivery charges vary based on your location and order value. Orders above ₹500 may qualify for free delivery. Orders above ₹1500 get free delivery. Check the delivery charges during checkout before confirming your order.',
        helpful: null,
        related: ['d2', 'd3']
      },
      {
        id: 'd2',
        question: 'How long does delivery take?',
        answer: 'Standard delivery takes 2-4 hours for same-day orders placed before 3 PM. You can select your preferred delivery slot during checkout. For orders placed after 3 PM, delivery will be scheduled for the next day.',
        helpful: null,
        related: ['d1', 'd3']
      },
      {
        id: 'd3',
        question: 'Do you deliver to all areas?',
        answer: 'We deliver to select areas within city limits. Please enter your pincode on the product or checkout page to check if we deliver to your location. We are continuously expanding our delivery network.',
        helpful: null,
        related: ['d1', 'd2']
      },
      {
        id: 'd4',
        question: 'Can I schedule delivery for a specific date?',
        answer: 'Yes! You can schedule delivery for a future date during checkout. Simply select your preferred date and time slot. We recommend placing advance orders for special occasions to ensure availability.',
        helpful: null,
        related: ['d2']
      },
      {
        id: 'd5',
        question: 'What if I am not available at the delivery address?',
        answer: 'If you are not available, our delivery partner will attempt to contact you. You can also authorize someone else to receive the order. Please ensure someone is available to receive the order during the scheduled time.',
        helpful: null,
        related: ['d2']
      }
    ]
  },
  {
    id: 'orders',
    name: 'Orders',
    icon: Package,
    color: 'from-purple-500 to-pink-500',
    questions: [
      {
        id: 'o1',
        question: 'How can I track my order?',
        answer: 'You can track your order status in the Orders section of your account dashboard. We also send SMS and email updates with order status changes. You can also use the "Track Order" feature on our website by entering your order number.',
        helpful: null,
        related: ['o2', 'o3']
      },
      {
        id: 'o2',
        question: 'Can I cancel my order?',
        answer: 'You can cancel your order within 1 hour of placing it from your account dashboard. After that, please contact our customer support team for assistance. Once the order is prepared or dispatched, cancellation may not be possible.',
        helpful: null,
        related: ['o1', 'o4']
      },
      {
        id: 'o3',
        question: 'What if my order is delayed?',
        answer: 'If your order is delayed, we will notify you immediately via SMS and email. We strive to deliver all orders on time, but unforeseen circumstances may cause delays. In such cases, we will keep you updated and may offer compensation.',
        helpful: null,
        related: ['o1', 'd2']
      },
      {
        id: 'o4',
        question: 'Can I modify my order after placing it?',
        answer: 'Order modifications can be made within 30 minutes of placing the order, subject to product availability. Please contact our customer support team immediately if you need to make changes. Modifications may not be possible once the order is in preparation.',
        helpful: null,
        related: ['o2']
      },
      {
        id: 'o5',
        question: 'What is your order confirmation process?',
        answer: 'After placing an order, you will receive an order confirmation email and SMS with your order number. This confirms that we have received your order and it is being processed. You can use this order number to track your order status.',
        helpful: null,
        related: ['o1']
      }
    ]
  },
  {
    id: 'payments',
    name: 'Payments',
    icon: CreditCard,
    color: 'from-green-500 to-emerald-500',
    questions: [
      {
        id: 'p1',
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit/debit cards, UPI (Google Pay, PhonePe, Paytm), net banking, digital wallets, and cash on delivery (COD) for eligible orders. All online payments are processed through secure payment gateways.',
        helpful: null,
        related: ['p2', 'p3']
      },
      {
        id: 'p2',
        question: 'Is my payment information secure?',
        answer: 'Yes, we use industry-standard SSL encryption and secure payment gateways to protect your payment information. We do not store your card details on our servers. All transactions are processed through PCI-DSS compliant payment processors.',
        helpful: null,
        related: ['p1']
      },
      {
        id: 'p3',
        question: 'When will I be charged?',
        answer: 'For online payments, you will be charged immediately upon order confirmation. For COD orders, payment is collected at the time of delivery. Refunds, if applicable, are processed within 5-7 business days to the original payment method.',
        helpful: null,
        related: ['p1', 'r1']
      },
      {
        id: 'p4',
        question: 'Do you offer payment plans or installments?',
        answer: 'Currently, we do not offer payment plans or installments. However, you can use credit card EMI options if available through your bank. Please check with your bank for EMI eligibility and terms.',
        helpful: null,
        related: ['p1']
      }
    ]
  },
  {
    id: 'account',
    name: 'Account',
    icon: User,
    color: 'from-orange-500 to-red-500',
    questions: [
      {
        id: 'a1',
        question: 'How do I update my profile?',
        answer: 'You can update your profile information by clicking the "Edit Profile" button in your account dashboard. You can change your name, phone number, and delivery addresses. Some changes may require verification.',
        helpful: null,
        related: ['a2']
      },
      {
        id: 'a2',
        question: 'Can I change my email address?',
        answer: 'For security reasons, please contact our customer support team to change your email address. You will need to verify the new email address before it can be updated. This helps us maintain account security.',
        helpful: null,
        related: ['a1', 'a3']
      },
      {
        id: 'a3',
        question: 'How do I reset my password?',
        answer: 'Click on "Forgot Password" on the login page and enter your registered email address. You will receive a password reset link via email. Follow the instructions to create a new password. The link expires after 24 hours.',
        helpful: null,
        related: ['a2']
      },
      {
        id: 'a4',
        question: 'How do I delete my account?',
        answer: 'To delete your account, please contact our customer support team. We will process your request within 7 business days. Note that account deletion is permanent and cannot be undone. All your data will be removed as per our privacy policy.',
        helpful: null,
        related: []
      }
    ]
  },
  {
    id: 'returns',
    name: 'Returns & Refunds',
    icon: RefreshCw,
    color: 'from-indigo-500 to-purple-500',
    questions: [
      {
        id: 'r1',
        question: 'What is your refund policy?',
        answer: 'We offer full refunds for orders cancelled within 1 hour of placement. For defective or damaged products, we provide replacement or full refund. Refunds are processed within 5-7 business days to the original payment method. Please refer to our Refund Policy page for detailed information.',
        helpful: null,
        related: ['r2', 'p3']
      },
      {
        id: 'r2',
        question: 'How do I return a product?',
        answer: 'If you need to return a product, please contact our customer support team within 24 hours of delivery. We will arrange for pickup and process your return. Returns are accepted for defective, damaged, or incorrect items only.',
        helpful: null,
        related: ['r1']
      },
      {
        id: 'r3',
        question: 'How long does it take to process a refund?',
        answer: 'Refunds are typically processed within 5-7 business days after we receive and verify the returned product. The amount will be credited to your original payment method. You will receive an email confirmation once the refund is processed.',
        helpful: null,
        related: ['r1', 'p3']
      }
    ]
  },
  {
    id: 'products',
    name: 'Products',
    icon: Cake,
    color: 'from-pink-500 to-rose-500',
    questions: [
      {
        id: 'pr1',
        question: 'Can I customize my cake?',
        answer: 'Absolutely! We specialize in custom cake designs. You can add customization requests during checkout or contact us directly with your requirements. We can create personalized messages, photos, themes, and designs. Custom orders may require advance notice.',
        helpful: null,
        related: ['pr2']
      },
      {
        id: 'pr2',
        question: 'Do you offer eggless cakes?',
        answer: 'Yes, we offer a wide variety of eggless cakes. You can filter for eggless options on our website. All our eggless cakes are clearly marked and prepared in a separate facility to avoid cross-contamination.',
        helpful: null,
        related: ['pr1']
      },
      {
        id: 'pr3',
        question: 'What is the shelf life of your products?',
        answer: 'Our cakes are baked fresh daily and have a shelf life of 2-3 days when stored in a refrigerator. We recommend consuming them within 24-48 hours for the best taste and freshness. Storage instructions are provided with each order.',
        helpful: null,
        related: []
      },
      {
        id: 'pr4',
        question: 'Do you offer bulk orders?',
        answer: 'Yes, we handle bulk orders for events, parties, and corporate functions. Contact us in advance for special pricing and arrangements. We recommend placing bulk orders at least 3-5 days in advance to ensure availability.',
        helpful: null,
        related: ['pr1']
      }
    ]
  },
  {
    id: 'rewards',
    name: 'Rewards & Offers',
    icon: Gift,
    color: 'from-yellow-500 to-orange-500',
    questions: [
      {
        id: 'rw1',
        question: 'How does the referral program work?',
        answer: 'Share your unique referral code with friends. When they sign up and place their first order, both you and your friend earn rewards. You can earn cashback in your wallet for each successful referral. Check the Refer and Earn section in your account for details.',
        helpful: null,
        related: []
      },
      {
        id: 'rw2',
        question: 'How do I use promo codes?',
        answer: 'Enter your promo code in the "Apply Promo Code" field during checkout. Valid codes will be automatically applied to your order. You can only use one promo code per order. Some codes may have minimum order value requirements.',
        helpful: null,
        related: []
      },
      {
        id: 'rw3',
        question: 'What are wallet credits?',
        answer: 'Wallet credits are rewards you earn through referrals, cashback, and promotions. These credits can be used to pay for future orders. You can check your wallet balance in your account dashboard and use it during checkout.',
        helpful: null,
        related: ['rw1']
      }
    ]
  }
];

export default function FAQPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  const [helpfulFeedback, setHelpfulFeedback] = useState({});
  const [filterTab, setFilterTab] = useState('all'); // all, popular, recent
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Initialize: Expand first category and first question
  useEffect(() => {
    if (faqCategories.length > 0) {
      setExpandedCategories({ [faqCategories[0].id]: true });
      if (faqCategories[0].questions.length > 0) {
        setExpandedQuestions({ [faqCategories[0].questions[0].id]: true });
      }
    }
  }, []);

  const toggleQuestion = (questionId) => {
    setExpandedQuestions(prev => {
      const isCurrentlyOpen = prev[questionId];
      // If opening this question, close all others (accordion behavior)
      if (!isCurrentlyOpen) {
        return { [questionId]: true };
      }
      // If closing this question, just close it
      return { ...prev, [questionId]: false };
    });
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleHelpful = (questionId, isHelpful) => {
    setHelpfulFeedback(prev => ({
      ...prev,
      [questionId]: isHelpful
    }));
  };

  const filteredFAQs = useMemo(() => {
    let filtered = faqCategories;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(cat => cat.id === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.map(category => {
        const filteredQuestions = category.questions.filter(q =>
          q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.answer.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return {
          ...category,
          questions: filteredQuestions
        };
      }).filter(category => category.questions.length > 0);
    }

    // Filter by tab (popular/recent)
    if (filterTab === 'popular') {
      filtered = filtered.map(category => ({
        ...category,
        questions: category.questions.slice(0, 3) // Show first 3 as "popular"
      })).filter(category => category.questions.length > 0);
    }

    return filtered;
  }, [searchQuery, selectedCategory, filterTab]);

  const searchSuggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    
    const allQuestions = faqCategories.flatMap(cat => cat.questions);
    return allQuestions
      .filter(q => 
        q.question.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 5);
  }, [searchQuery]);

  const handleSuggestionClick = (questionId) => {
    // Find and expand the question
    for (const category of faqCategories) {
      const question = category.questions.find(q => q.id === questionId);
      if (question) {
        setSelectedCategory(category.id);
        setExpandedCategories({ [category.id]: true });
        // Close all other questions and open only this one (accordion behavior)
        setExpandedQuestions({ [questionId]: true });
        setSearchQuery(question.question);
        setShowSuggestions(false);
        // Scroll to question
        setTimeout(() => {
          document.getElementById(`question-${questionId}`)?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }, 100);
        break;
      }
    }
  };

  const copyFAQLink = (questionId) => {
    const url = `${window.location.origin}/faq#${questionId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getRelatedQuestions = (relatedIds) => {
    const allQuestions = faqCategories.flatMap(cat => cat.questions);
    return allQuestions.filter(q => relatedIds.includes(q.id));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-pink-500 via-rose-500 to-orange-500 dark:from-pink-600 dark:via-rose-600 dark:to-orange-600 text-white pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <Sparkles className="w-8 h-8 lg:w-10 lg:h-10" />
              <h1 className="text-4xl lg:text-6xl font-bold font-poppins">
                How can we help you?
              </h1>
              <Sparkles className="w-8 h-8 lg:w-10 lg:h-10" />
            </div>
            <p className="text-lg lg:text-xl text-pink-100 mb-8 max-w-2xl mx-auto">
              Find quick answers to common questions or get in touch with our support team
            </p>

            {/* Search Bar */}
            <div className="relative max-w-3xl mx-auto mb-8">
              <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search for questions, topics, or keywords..."
                className="w-full pl-14 pr-4 py-4 lg:py-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-white/30 shadow-xl text-base lg:text-lg font-inter"
              />
              
              {/* Search Suggestions */}
              <AnimatePresence>
                {showSuggestions && searchSuggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
                  >
                    {searchSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        onClick={() => handleSuggestionClick(suggestion.id)}
                        className="w-full px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                      >
                        <p className="font-inter text-gray-900 dark:text-white font-medium">
                          {suggestion.question}
                        </p>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => router.push('/contact')}
                className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl font-inter font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Contact Support
              </button>
              <button
                onClick={() => router.push('/track-order')}
                className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl font-inter font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2"
              >
                <Package className="w-5 h-5" />
                Track Order
              </button>
              <button
                onClick={() => window.open('tel:+917570030333', '_blank')}
                className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl font-inter font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2"
              >
                <Phone className="w-5 h-5" />
                Call Us
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filter Tabs */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <div className="flex gap-2 bg-white dark:bg-gray-800 rounded-xl p-1 shadow-sm border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setFilterTab('all')}
                  className={`px-4 py-2 rounded-lg font-inter text-sm font-medium transition-all ${
                    filterTab === 'all'
                      ? 'bg-pink-500 text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  All FAQs
                </button>
                <button
                  onClick={() => setFilterTab('popular')}
                  className={`px-4 py-2 rounded-lg font-inter text-sm font-medium transition-all flex items-center gap-2 ${
                    filterTab === 'popular'
                      ? 'bg-pink-500 text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  Popular
                </button>
              </div>
            </div>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
                Clear Filter
              </button>
            )}
          </div>

          {/* Category Cards */}
          {!selectedCategory && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
              {faqCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <motion.button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setExpandedCategories({ [category.id]: true });
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md hover:shadow-xl border-2 border-transparent hover:border-pink-300 dark:hover:border-pink-600 transition-all duration-200 text-left group"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-poppins font-bold text-gray-900 dark:text-white mb-2">
                      {category.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-inter">
                      {category.questions.length} questions
                    </p>
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* FAQs by Category */}
          {filteredFAQs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <HelpCircle className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-poppins font-bold text-gray-900 dark:text-white mb-2">
                No FAQs found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 font-inter mb-6">
                Try adjusting your search or filter criteria
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory(null);
                  setFilterTab('all');
                }}
                className="px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-inter font-medium transition-colors"
              >
                Clear All Filters
              </button>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {filteredFAQs.map((category) => {
                const Icon = category.icon;
                return (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                  >
                    {/* Category Header */}
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="w-full flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-poppins text-xl font-bold text-gray-900 dark:text-white">
                            {category.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 font-inter">
                            {category.questions.length} questions
                          </p>
                        </div>
                      </div>
                      {expandedCategories[category.id] ? (
                        <ChevronUp className="w-6 h-6 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-6 h-6 text-gray-500" />
                      )}
                    </button>

                    {/* Questions */}
                    <AnimatePresence>
                      {expandedCategories[category.id] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="border-t border-gray-200 dark:border-gray-700"
                        >
                          {category.questions.map((faq, index) => (
                            <div
                              key={faq.id}
                              id={`question-${faq.id}`}
                              className="border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                            >
                              <button
                                onClick={() => toggleQuestion(faq.id)}
                                className="w-full flex items-start justify-between p-6 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors text-left"
                              >
                                <div className="flex items-start gap-4 flex-1">
                                  <div className="w-8 h-8 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <HelpCircle className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-poppins text-base font-semibold text-gray-900 dark:text-white mb-1">
                                      {faq.question}
                                    </h4>
                                  </div>
                                </div>
                                {expandedQuestions[faq.id] ? (
                                  <ChevronUp className="w-5 h-5 text-gray-500 ml-4 flex-shrink-0" />
                                ) : (
                                  <ChevronDown className="w-5 h-5 text-gray-500 ml-4 flex-shrink-0" />
                                )}
                              </button>
                              
                              <AnimatePresence>
                                {expandedQuestions[faq.id] && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="px-6 pb-6 pl-18"
                                  >
                                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-5">
                                      <p className="font-inter text-sm lg:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                        {faq.answer}
                                      </p>

                                      {/* Helpful Feedback */}
                                      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                                        <span className="text-sm text-gray-600 dark:text-gray-400 font-inter">
                                          Was this helpful?
                                        </span>
                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleHelpful(faq.id, true);
                                            }}
                                            className={`p-2 rounded-lg transition-all ${
                                              helpfulFeedback[faq.id] === true
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-green-100 dark:hover:bg-green-900/30'
                                            }`}
                                          >
                                            <ThumbsUp className="w-4 h-4" />
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleHelpful(faq.id, false);
                                            }}
                                            className={`p-2 rounded-lg transition-all ${
                                              helpfulFeedback[faq.id] === false
                                                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/30'
                                            }`}
                                          >
                                            <ThumbsDown className="w-4 h-4" />
                                          </button>
                                        </div>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            copyFAQLink(faq.id);
                                          }}
                                          className="ml-auto flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-700 rounded-lg transition-colors"
                                        >
                                          {copiedLink ? (
                                            <>
                                              <Check className="w-4 h-4" />
                                              Copied!
                                            </>
                                          ) : (
                                            <>
                                              <Share2 className="w-4 h-4" />
                                              Share
                                            </>
                                          )}
                                        </button>
                                      </div>

                                      {/* Related Questions */}
                                      {faq.related && faq.related.length > 0 && (
                                        <div>
                                          <h5 className="text-sm font-poppins font-semibold text-gray-900 dark:text-white mb-3">
                                            Related Questions:
                                          </h5>
                                          <div className="space-y-2">
                                            {getRelatedQuestions(faq.related).map((related) => (
                                              <button
                                                key={related.id}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  // Find category and expand
                                                  const relatedCategory = faqCategories.find(cat =>
                                                    cat.questions.some(q => q.id === related.id)
                                                  );
                                                  if (relatedCategory) {
                                                    setSelectedCategory(relatedCategory.id);
                                                    setExpandedCategories({ [relatedCategory.id]: true });
                                                    setExpandedQuestions({ [related.id]: true });
                                                    setTimeout(() => {
                                                      document.getElementById(`question-${related.id}`)?.scrollIntoView({
                                                        behavior: 'smooth',
                                                        block: 'center'
                                                      });
                                                    }, 100);
                                                  }
                                                }}
                                                className="w-full text-left px-4 py-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/20 border border-gray-200 dark:border-gray-700 transition-colors"
                                              >
                                                <p className="text-sm text-gray-700 dark:text-gray-300 font-inter">
                                                  {related.question}
                                                </p>
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Support Escalation Section */}
      <section className="py-16 lg:py-20 bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50 dark:from-pink-900/20 dark:via-rose-900/20 dark:to-orange-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold font-poppins text-gray-900 dark:text-white mb-4">
              Still need help?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 font-inter max-w-2xl mx-auto">
              Our support team is here to assist you. Choose your preferred way to reach us.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Contact Support */}
            <motion.button
              onClick={() => router.push('/contact')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl border-2 border-transparent hover:border-pink-300 dark:hover:border-pink-600 transition-all text-left group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-poppins font-bold text-gray-900 dark:text-white mb-2">
                Contact Support
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-inter">
                Send us a message and we'll get back to you
              </p>
            </motion.button>

            {/* Live Chat */}
            <motion.button
              onClick={() => window.open('https://wa.me/919876543210', '_blank')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl border-2 border-transparent hover:border-green-300 dark:hover:border-green-600 transition-all text-left group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-poppins font-bold text-gray-900 dark:text-white mb-2">
                WhatsApp Chat
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-inter">
                Chat with us instantly on WhatsApp
              </p>
            </motion.button>

            {/* Phone Support */}
            <motion.button
              onClick={() => window.open('tel:+917570030333', '_blank')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl border-2 border-transparent hover:border-purple-300 dark:hover:border-purple-600 transition-all text-left group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-poppins font-bold text-gray-900 dark:text-white mb-2">
                Call Us
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-inter">
                +91-7570030333
              </p>
            </motion.button>

            {/* Raise Ticket */}
            <motion.button
              onClick={() => router.push('/contact')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl border-2 border-transparent hover:border-orange-300 dark:hover:border-orange-600 transition-all text-left group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Ticket className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-poppins font-bold text-gray-900 dark:text-white mb-2">
                Raise a Ticket
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-inter">
                Submit a support ticket for complex issues
              </p>
            </motion.button>
          </div>

          {/* Additional Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-12 bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-4">
                <Mail className="w-6 h-6 text-pink-500 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-poppins font-semibold text-gray-900 dark:text-white mb-1">
                    Email Support
                  </h4>
                  <a
                    href="mailto:info@creamingo.com"
                    className="text-pink-600 dark:text-pink-400 hover:underline font-inter text-sm"
                  >
                    info@creamingo.com
                  </a>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-inter mt-1">
                    We respond within 24 hours
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Clock className="w-6 h-6 text-pink-500 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-poppins font-semibold text-gray-900 dark:text-white mb-1">
                    Business Hours
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 font-inter text-sm">
                    Mon - Sun: 9 AM - 9 PM
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-inter mt-1">
                    Available every day
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <MapPin className="w-6 h-6 text-pink-500 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-poppins font-semibold text-gray-900 dark:text-white mb-1">
                    Visit Us
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 font-inter text-sm">
                    Asuran Chowk, Gorakhpur
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-inter mt-1">
                    Uttar Pradesh - 273001
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
      <MobileFooter />
    </div>
  );
}

