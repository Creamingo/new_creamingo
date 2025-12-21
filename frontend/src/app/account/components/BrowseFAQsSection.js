'use client';

import { HelpCircle, ArrowRight } from 'lucide-react';

export default function BrowseFAQsSection({ onNavigateToFAQs }) {
  const handleBrowseFAQs = () => {
    if (onNavigateToFAQs) {
      onNavigateToFAQs();
    } else {
      // Default: trigger section change event
      window.dispatchEvent(new CustomEvent('account-section-change', { detail: 'faqs' }));
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_8px_0_rgba(0,0,0,0.08)] border border-gray-200/60 p-4 lg:p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-md">
            <HelpCircle className="w-6 h-6 text-white" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-poppins text-base font-semibold text-gray-900 mb-1">
              Need Help?
            </h3>
            <p className="font-inter text-sm text-gray-600">
              Find answers to common questions
            </p>
          </div>
        </div>
        <button
          onClick={handleBrowseFAQs}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-inter text-sm font-medium transition-all duration-200 hover:shadow-lg active:scale-95 flex-shrink-0"
        >
          <span>Browse FAQs</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

