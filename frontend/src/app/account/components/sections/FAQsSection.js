'use client';

import { useState } from 'react';
import { HelpCircle, Search, ChevronDown, ChevronUp } from 'lucide-react';
import SectionHeader from '../shared/SectionHeader';

const faqCategories = [
  {
    id: 'delivery',
    name: 'Delivery',
    icon: '🚚',
    questions: [
      {
        id: 'd1',
        question: 'What are the delivery charges?',
        answer: 'Delivery charges vary based on your location and order value. Orders above ₹500 may qualify for free delivery. Check the delivery charges during checkout.'
      },
      {
        id: 'd2',
        question: 'How long does delivery take?',
        answer: 'Standard delivery takes 2-4 hours for same-day orders placed before 3 PM. You can select your preferred delivery slot during checkout.'
      },
      {
        id: 'd3',
        question: 'Do you deliver to all areas?',
        answer: 'We deliver to select areas within city limits. Please enter your pincode to check if we deliver to your location.'
      }
    ]
  },
  {
    id: 'orders',
    name: 'Orders',
    icon: '📦',
    questions: [
      {
        id: 'o1',
        question: 'How can I track my order?',
        answer: 'You can track your order status in the Orders section of your account. We also send SMS and email updates with order status changes.'
      },
      {
        id: 'o2',
        question: 'Can I cancel my order?',
        answer: 'You can cancel your order within 1 hour of placing it. After that, please contact our customer support team for assistance.'
      },
      {
        id: 'o3',
        question: 'What if my order is delayed?',
        answer: 'If your order is delayed, we will notify you immediately. We strive to deliver all orders on time, but unforeseen circumstances may cause delays.'
      }
    ]
  },
  {
    id: 'payments',
    name: 'Payments',
    icon: '💳',
    questions: [
      {
        id: 'p1',
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit/debit cards, UPI, net banking, and cash on delivery (COD) for eligible orders.'
      },
      {
        id: 'p2',
        question: 'Is my payment information secure?',
        answer: 'Yes, we use industry-standard encryption and secure payment gateways to protect your payment information.'
      },
      {
        id: 'p3',
        question: 'When will I be charged?',
        answer: 'For online payments, you will be charged immediately upon order confirmation. For COD orders, payment is collected at the time of delivery.'
      }
    ]
  },
  {
    id: 'account',
    name: 'Account',
    icon: '👤',
    questions: [
      {
        id: 'a1',
        question: 'How do I update my profile?',
        answer: 'You can update your profile information by clicking the "Edit Profile" button in your account dashboard.'
      },
      {
        id: 'a2',
        question: 'Can I change my email address?',
        answer: 'For security reasons, please contact our customer support team to change your email address.'
      },
      {
        id: 'a3',
        question: 'How do I reset my password?',
        answer: 'Click on "Forgot Password" on the login page and follow the instructions sent to your registered email address.'
      }
    ]
  }
];

export default function FAQsSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});

  const toggleQuestion = (questionId) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const filteredFAQs = faqCategories.map(category => {
    if (!searchQuery) return category;
    
    const filteredQuestions = category.questions.filter(q =>
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    return {
      ...category,
      questions: filteredQuestions
    };
  }).filter(category => category.questions.length > 0);

  return (
    <>
      <SectionHeader 
        title="Frequently Asked Questions" 
        description="Find quick answers to common questions"
      />

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search FAQs..."
          className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-inter text-sm bg-gray-50"
        />
      </div>

      {/* FAQs by Category */}
      {filteredFAQs.length === 0 ? (
        <div className="text-center py-12">
          <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="font-inter text-gray-600">No FAQs found matching your search.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFAQs.map((category) => (
            <div key={category.id} className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{category.icon}</span>
                  <h3 className="font-poppins text-lg font-semibold text-gray-900">
                    {category.name}
                  </h3>
                  <span className="px-2 py-1 bg-white rounded-full text-xs font-medium text-gray-600">
                    {category.questions.length}
                  </span>
                </div>
                {expandedCategories[category.id] ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>

              {/* Questions */}
              {expandedCategories[category.id] && (
                <div className="border-t border-gray-200">
                  {category.questions.map((faq) => (
                    <div key={faq.id} className="border-b border-gray-200 last:border-b-0">
                      <button
                        onClick={() => toggleQuestion(faq.id)}
                        className="w-full flex items-start justify-between p-4 hover:bg-white transition-colors text-left"
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <HelpCircle className="w-5 h-5 text-pink-500 mt-0.5 flex-shrink-0" />
                          <span className="font-inter text-sm font-semibold text-gray-900">
                            {faq.question}
                          </span>
                        </div>
                        {expandedQuestions[faq.id] ? (
                          <ChevronUp className="w-5 h-5 text-gray-500 ml-4 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-500 ml-4 flex-shrink-0" />
                        )}
                      </button>
                      {expandedQuestions[faq.id] && (
                        <div className="px-4 pb-4 pl-12">
                          <p className="font-inter text-sm text-gray-600 leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

