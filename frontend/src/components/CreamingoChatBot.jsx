'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, X } from 'lucide-react';
import SupportChatContent from './SupportChatContent';

/**
 * Popup chat (secondary entry). Opens when 'open-creamingo-chat' is dispatched (e.g. from Contact page "Chat with us").
 * Primary support entry is the dedicated /support page (Help → Raise Ticket).
 */
export default function CreamingoChatBot() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [ticketNumber, setTicketNumber] = useState(null);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('open-creamingo-chat', handler);
    return () => window.removeEventListener('open-creamingo-chat', handler);
  }, []);

  const handleLinkClick = (href) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-36 right-4 z-50 lg:bottom-24 lg:right-6 w-[calc(100vw-2rem)] max-w-md h-[min(28rem,70vh)] rounded-2xl shadow-xl border border-pink-200 dark:border-pink-800 bg-white dark:bg-gray-800 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between gap-2 px-4 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white flex-shrink-0">
            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 flex-shrink-0" />
                <span className="font-semibold truncate">Creamingo Support</span>
              </div>
              {ticketNumber && (
                <span className="text-xs text-white/90 font-mono">Ticket #{ticketNumber}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="p-1 rounded-lg hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <SupportChatContent
              isActive={open}
              onLinkClick={handleLinkClick}
              onTicketNumberChange={setTicketNumber}
            />
          </div>
        </div>
      )}
    </>
  );
}
