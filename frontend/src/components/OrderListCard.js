'use client';

import { ChevronRight, Copy, FileText } from 'lucide-react';
import { useState } from 'react';
import { formatPrice } from '../utils/priceFormatter';
import { getStatusColor, getStatusIcon } from '../utils/orderStatus';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
};

export default function OrderListCard({ order, onView, onInvoice, onReorder }) {
  const [copied, setCopied] = useState(false);

  const orderNumber = order?.order_number || order?.id?.toString() || '—';
  const amount = order?.total_amount != null ? parseFloat(order.total_amount) : 0;
  const status = order?.status || 'pending';

  const handleCopyId = (e) => {
    e.stopPropagation();
    const id = order?.order_number || order?.id?.toString();
    if (id) {
      navigator.clipboard.writeText(id).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      {/* Row: Order #, date, status, amount + optional Copy/Invoice */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-4 px-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 gap-y-1">
            <span className="font-poppins text-sm font-semibold text-gray-900 dark:text-white truncate">
              Order #{orderNumber}
            </span>
            {onInvoice && (
              <button
                type="button"
                onClick={(e) => onInvoice(orderNumber, e)}
                className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="View Invoice"
                aria-label="View Invoice"
              >
                <FileText className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={handleCopyId}
              className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Copy Order ID"
              aria-label="Copy Order ID"
            >
              {copied ? (
                <span className="text-xs font-medium text-green-600 dark:text-green-400">Copied</span>
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="font-inter text-xs text-gray-500 dark:text-gray-400">
              Placed: {formatDate(order?.created_at)}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}
            >
              {getStatusIcon(status)}
              <span className="capitalize">{(status || '').replace(/_/g, ' ')}</span>
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0">
          <span className="font-poppins text-base sm:text-lg font-bold text-gray-900 dark:text-white">
            {formatPrice(amount)}
          </span>
        </div>
      </div>

      {/* CTA: View Order → */}
      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={() => onView?.(orderNumber)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-inter text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <span>View Order</span>
          <ChevronRight className="w-4 h-4" />
        </button>
        {onReorder && (
          <button
            type="button"
            onClick={() => onReorder(order)}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2 px-4 text-pink-600 dark:text-pink-400 font-inter text-sm font-medium hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-lg transition-colors"
          >
            Reorder
          </button>
        )}
      </div>
    </div>
  );
}
