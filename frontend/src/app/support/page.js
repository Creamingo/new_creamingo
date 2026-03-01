'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import SupportChatContent from '../../components/SupportChatContent';

export default function SupportPage() {
  const router = useRouter();
  const [ticketNumber, setTicketNumber] = useState(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col bg-white dark:bg-gray-900 z-0">
      {/* Header: fixed at top */}
      <header className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 flex-shrink-0 text-pink-500" />
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              Creamingo Support
            </h1>
          </div>
          {ticketNumber && (
            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">
              Ticket #{ticketNumber}
            </span>
          )}
        </div>
      </header>

      {/* Chat content - only this middle part scrolls */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <SupportChatContent
          isActive={true}
          onTicketNumberChange={setTicketNumber}
        />
      </div>
    </div>
  );
}
