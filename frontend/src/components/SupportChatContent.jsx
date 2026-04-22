'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Loader2 } from 'lucide-react';
import chatApi from '../api/chatApi';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';
import { useCart } from '../contexts/CartContext';

export const WELCOME_QUICK_REPLIES = [
  'Browse Cakes',
  'Track Order',
  'Offers & Wallet',
  'Delivery Info',
  'Custom Cake',
  'Contact Support'
];

const SEARCH_PLACEHOLDERS = [
  'Search "How to order photo cake?"',
  'Search "Delivery charges"',
  'Search "Wallet cashback"'
];
const PLACEHOLDER_ROTATE_MS = 3500;
const PROACTIVE_DELAY_MS = 1500;

function formatReply(text) {
  if (!text) return '';
  return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

/**
 * Shared chat content used on both the dedicated /support page and the popup.
 * @param {boolean} isActive - When true, proactive message and placeholder rotation run (e.g. popup open or page visible).
 * @param {function(href: string)|undefined} onLinkClick - Optional. When user clicks a link in a message. If not provided, uses router.push(href).
 * @param {function(ticketNumber: string|null)|undefined} onTicketNumberChange - Optional. Called when ticket number is set from API (for header display).
 */
export default function SupportChatContent({ isActive = true, onLinkClick, onTicketNumberChange }) {
  const router = useRouter();
  const { isAuthenticated, customer } = useCustomerAuth();
  const { getItemCount } = useCart();
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'bot',
      text: "Hey 👋 Welcome to Creamingo Care.\n\nI'm Creamy, your smart assistant.\n\nHow can I help make your day sweeter today? 😊",
      link: null,
      quickReplies: WELCOME_QUICK_REPLIES
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ticketNumber, setTicketNumber] = useState(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const proactiveShownRef = useRef(false);
  const proactiveTimerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isActive) inputRef.current?.focus();
  }, [isActive]);

  // Proactive smart message (when active)
  useEffect(() => {
    if (!isActive) {
      proactiveShownRef.current = false;
      if (proactiveTimerRef.current) {
        clearTimeout(proactiveTimerRef.current);
        proactiveTimerRef.current = null;
      }
      return;
    }
    if (proactiveShownRef.current) return;
    proactiveTimerRef.current = setTimeout(() => {
      proactiveTimerRef.current = null;
      proactiveShownRef.current = true;
      const cartCount = typeof getItemCount === 'function' ? getItemCount() : 0;
      const customerName = customer?.name || customer?.email || null;
      let proactiveText;
      if (cartCount > 0) {
        proactiveText = "You have items in your cart. Need help with checkout?";
      } else if (isAuthenticated && customerName) {
        const name = customerName.split('@')[0].split(' ')[0] || customerName;
        proactiveText = `Hi ${name}, we have exciting offers on birthday cakes today. You can click an option below or type your query.`;
      } else {
        proactiveText = "🎂 Good news! We have exciting offers on birthday cakes today. You can click an option below or type your query.";
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `proactive-${Date.now()}`,
          role: 'bot',
          text: proactiveText,
          link: null,
          quickReplies: null
        }
      ]);
    }, PROACTIVE_DELAY_MS);
    return () => {
      if (proactiveTimerRef.current) clearTimeout(proactiveTimerRef.current);
    };
  }, [isActive, isAuthenticated, customer, getItemCount]);

  // Rotating placeholder (when active)
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % SEARCH_PLACEHOLDERS.length);
    }, PLACEHOLDER_ROTATE_MS);
    return () => clearInterval(interval);
  }, [isActive]);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg) return;
    setInput('');
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', text: msg, link: null }]);
    setLoading(true);
    try {
      const { reply, link, quickReplies, ticket_number } = await chatApi.sendMessage(msg);
      if (ticket_number) {
        setTicketNumber(ticket_number);
        onTicketNumberChange?.(ticket_number);
      }
      setMessages((prev) => [
        ...prev,
        { id: `b-${Date.now()}`, role: 'bot', text: reply, link: link || null, quickReplies: quickReplies || null }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          role: 'bot',
          text: "Sorry, I couldn't reach the server. Please try again or call us at 7570030333.",
          link: null
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickReply = (text) => sendMessage(text);

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleLinkClick = (href) => {
    if (typeof onLinkClick === 'function') {
      onLinkClick(href);
    } else {
      router.push(href);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Scrollable messages only - rest is sticky */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain p-4 space-y-3" style={{ WebkitOverflowScrolling: 'touch' }}>
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                m.role === 'user'
                  ? 'bg-pink-500 text-white rounded-br-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-md'
              }`}
            >
              {m.role === 'bot' ? (
                <>
                  <p
                    className="text-sm leading-relaxed whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: formatReply(m.text) }}
                  />
                  {m.link && (
                    <button
                      type="button"
                      onClick={() => handleLinkClick(m.link.href)}
                      className="mt-2 text-xs font-medium text-pink-600 dark:text-pink-400 hover:underline"
                    >
                      → {m.link.text}
                    </button>
                  )}
                  {m.quickReplies && m.quickReplies.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {m.quickReplies.map((label) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => handleQuickReply(label)}
                          disabled={loading}
                          className="text-xs font-medium px-3 py-2 rounded-xl bg-pink-500/20 dark:bg-pink-500/30 text-pink-700 dark:text-pink-300 hover:bg-pink-500/30 dark:hover:bg-pink-500/40 border border-pink-300/50 dark:border-pink-600/50 transition-colors"
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{m.text}</p>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-md px-4 py-2.5">
              <Loader2 className="w-4 h-4 animate-spin text-pink-500" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick replies - sticky above input */}
      {messages.length <= 3 && (
        <div className="px-4 pb-2 pt-1 flex flex-wrap gap-2 flex-shrink-0 bg-white dark:bg-gray-800">
          {WELCOME_QUICK_REPLIES.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => handleQuickReply(label)}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 hover:bg-pink-200 dark:hover:bg-pink-900/50 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Sticky footer: input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={SEARCH_PLACEHOLDERS[placeholderIndex]}
            disabled={loading}
            className="flex-1 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-xl bg-pink-500 hover:bg-pink-600 text-white p-2.5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Send"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}

