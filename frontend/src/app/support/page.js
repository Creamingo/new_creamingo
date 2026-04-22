'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, MessageCircle, Ticket, Loader2 } from 'lucide-react';
import SupportChatContent from '../../components/SupportChatContent';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import customerAuthApi from '../../api/customerAuthApi';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function SupportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: isAuthLoading } = useCustomerAuth();
  const [ticketNumber, setTicketNumber] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [isTicketsLoading, setIsTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState('');
  const requestedView = searchParams?.get('view');
  const isTicketsView = requestedView === 'tickets';

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    if (!isTicketsView || isAuthLoading || !isAuthenticated) return;

    const fetchTickets = async () => {
      try {
        setIsTicketsLoading(true);
        setTicketsError('');
        const token = customerAuthApi.getToken();
        if (!token) {
          throw new Error('Authentication required');
        }

        const response = await fetch(`${API_BASE_URL}/tickets/my?limit=50`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (!response.ok || !data?.success) {
          throw new Error(data?.message || 'Failed to load tickets');
        }
        setTickets(Array.isArray(data.data) ? data.data : []);
      } catch (error) {
        console.error('Load tickets error:', error);
        setTicketsError('Unable to load your tickets right now.');
      } finally {
        setIsTicketsLoading(false);
      }
    };

    fetchTickets();
  }, [isTicketsView, isAuthLoading, isAuthenticated]);

  const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatStatus = (status) => {
    switch (status) {
      case 'in_progress':
        return 'In Progress';
      case 'resolved':
        return 'Resolved';
      case 'closed':
        return 'Closed';
      default:
        return 'Open';
    }
  };

  const statusClassMap = {
    open: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    resolved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    closed: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
  };

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
            {isTicketsView ? (
              <Ticket className="w-5 h-5 flex-shrink-0 text-pink-500" />
            ) : (
              <MessageCircle className="w-5 h-5 flex-shrink-0 text-pink-500" />
            )}
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {isTicketsView ? 'Your Tickets' : 'Creamingo Support'}
            </h1>
          </div>
          {!isTicketsView && ticketNumber && (
            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">
              Ticket #{ticketNumber}
            </span>
          )}
        </div>
      </header>

      {/* Chat content - only this middle part scrolls */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {isTicketsView ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isTicketsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-pink-500 animate-spin" />
              </div>
            ) : ticketsError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-300">
                {ticketsError}
              </div>
            ) : tickets.length === 0 ? (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 text-center">
                <p className="text-sm text-gray-700 dark:text-gray-300">No tickets yet.</p>
                <button
                  type="button"
                  onClick={() => router.push('/support?view=raise')}
                  className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-pink-500 hover:bg-pink-600 text-white text-sm font-medium transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Raise Ticket
                </button>
              </div>
            ) : (
              tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {ticket.ticket_number}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                        {ticket.subject || 'Support request'}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusClassMap[ticket.status] || statusClassMap.open}`}>
                      {formatStatus(ticket.status)}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">
                    Created on {formatDate(ticket.created_at)}
                  </p>
                </div>
              ))
            )}
          </div>
        ) : (
          <SupportChatContent
            isActive={true}
            onTicketNumberChange={setTicketNumber}
          />
        )}
      </div>
    </div>
  );
}
