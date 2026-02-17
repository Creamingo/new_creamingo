'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import chatApi from '../api/chatApi';

const QUICK_REPLIES = [
  'Menu',
  'Browse Cakes',
  'Track Order',
  'Offers & Wallet',
  'Delivery info',
  'Contact Support'
];

function formatReply(text) {
  if (!text) return '';
  return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

export default function CreamingoChatBot() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'bot',
      text: "Hi! I'm Creamingo's assistant. Ask me about delivery, orders, payments, refunds, wallet, or anything else.",
      link: null
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Listen for "Raise Ticket" / external open
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('open-creamingo-chat', handler);
    return () => window.removeEventListener('open-creamingo-chat', handler);
  }, []);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg) return;

    setInput('');
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', text: msg, link: null }]);
    setLoading(true);

    try {
      const { reply, link, quickReplies } = await chatApi.sendMessage(msg);
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

  const handleQuickReply = (text) => {
    sendMessage(text);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleLinkClick = (href) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      {/* Chat panel – only when opened via Help > Raise Ticket */}
      {open && (
        <div className="fixed bottom-36 right-4 z-50 lg:bottom-24 lg:right-6 w-[calc(100vw-2rem)] max-w-md h-[min(28rem,70vh)] rounded-2xl shadow-xl border border-pink-200 dark:border-pink-800 bg-white dark:bg-gray-800 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between gap-2 px-4 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 flex-shrink-0" />
              <span className="font-semibold">Raise Ticket – Creamingo Support</span>
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

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
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

          {/* Quick replies (show only when few messages) */}
          {messages.length <= 2 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {QUICK_REPLIES.map((label) => (
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

          <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything..."
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
      )}
    </>
  );
}
