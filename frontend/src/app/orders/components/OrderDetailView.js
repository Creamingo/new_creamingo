'use client';

import { useState } from 'react';
import {
  MapPin,
  Calendar,
  Package,
  Copy,
  Download,
  RotateCcw,
  Gift,
} from 'lucide-react';
import { formatPrice } from '../../../utils/priceFormatter';
import { resolveImageUrl } from '../../../utils/imageUrl';
import { getStatusColor, getStatusIcon } from '../../../utils/orderStatus';
import OrderTimeline from './OrderTimeline';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
};

const formatTime = (timeString) => {
  if (!timeString) return 'N/A';
  if (timeString.includes('PM') || timeString.includes('AM')) return timeString;
  if (timeString.includes(' - ')) return timeString;
  try {
    const match = timeString.trim().match(/(\d{1,2}):(\d{2})/);
    if (match) {
      let h = parseInt(match[1], 10);
      const m = match[2];
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return `${h}:${m} ${ampm}`;
    }
  } catch (_) {}
  return timeString;
};

export default function OrderDetailView({ order, onBack, onDownloadInvoice, onReorder, reorderLoading = false }) {
  const [copied, setCopied] = useState(false);

  const orderNumber = order?.order_number || order?.id?.toString() || '—';
  const address =
    typeof order?.delivery_address === 'string'
      ? (() => {
          try {
            return JSON.parse(order.delivery_address);
          } catch {
            return null;
          }
        })()
      : order?.delivery_address;

  const handleCopyId = () => {
    if (orderNumber && orderNumber !== '—') {
      navigator.clipboard.writeText(orderNumber).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const items = order?.items || [];
  const itemTotal =
    order?.subtotal != null
      ? parseFloat(order.subtotal)
      : items.reduce((sum, i) => sum + parseFloat(i.total || i.price * (i.quantity || 1) || 0), 0);
  const discount = order?.promo_discount != null ? parseFloat(order.promo_discount) : 0;
  const deliveryCharge =
    order?.delivery_charge != null ? parseFloat(order.delivery_charge) : 0;
  const total = order?.total_amount != null ? parseFloat(order.total_amount) : 0;
  const status = order?.status || 'pending';

  const deliveryDateFormatted = formatDate(order?.delivery_date);
  const deliveryTimeFormatted = formatTime(order?.delivery_time);
  const scheduleLine =
    deliveryDateFormatted !== 'N/A' && deliveryTimeFormatted !== 'N/A'
      ? `${deliveryDateFormatted} • ${deliveryTimeFormatted}`
      : deliveryDateFormatted !== 'N/A'
        ? deliveryDateFormatted
        : deliveryTimeFormatted !== 'N/A'
          ? deliveryTimeFormatted
          : '—';

  return (
    <div className="max-w-3xl mx-auto">
      {/* A. Sticky header summary – H1 = total, order # + Copy, body = Placed on */}
      <div className="sticky top-[3.6rem] lg:top-16 z-30 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 px-4 py-4 sm:px-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-poppins text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                Order #{orderNumber}
              </h2>
              <button
                type="button"
                onClick={handleCopyId}
                className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 underline underline-offset-2 transition-colors"
                title="Copy Order ID"
                aria-label="Copy Order ID"
              >
                {copied ? 'Copied' : 'Copy ID'}
              </button>
            </div>
            <p className="font-inter text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Placed on {formatDate(order?.created_at)}
            </p>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-1.5">
            <h1 className="font-poppins text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              {formatPrice(total)}
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${getStatusColor(status)}`}
            >
              {getStatusIcon(status)}
              <span className="capitalize">{(status || '').replace(/_/g, ' ')}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 sm:px-6 space-y-0">
        {/* Order timeline – status-based steps */}
        <OrderTimeline status={status} />

        {/* B. Order Items – flat section, dividers only, no nested card */}
        <section className="py-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-poppins text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-gradient-to-b from-rose-400 to-pink-500 dark:from-rose-500 dark:to-pink-600" aria-hidden />
            Order Items
          </h2>
          {items.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No items found
            </p>
          ) : (
            <div className="space-y-0">
              {items.map((item, idx) => {
                const imageSrc = item.product_image ? resolveImageUrl(item.product_image) : null;
                return (
                <div
                  key={item.id || idx}
                  className="flex gap-4 py-4 border-b border-gray-100 dark:border-gray-700/60 last:border-b-0 last:pb-0"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-md overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-700">
                    {imageSrc ? (
                      <img
                        src={imageSrc}
                        alt={item.product_name || 'Product'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                          const placeholder = e.target.nextElementSibling;
                          if (placeholder) placeholder.style.display = 'flex';
                        }}
                        loading="lazy"
                      />
                    ) : null}
                    <div
                      className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500"
                      style={{ display: imageSrc ? 'none' : 'flex' }}
                    >
                      <Package className="w-8 h-8" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-poppins text-sm font-semibold text-gray-900 dark:text-white">
                      {item.product_name || 'Product'}
                    </h3>
                    {item.tier && (
                      <p className="font-inter text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                        Tier: {item.tier}
                      </p>
                    )}
                    {item.cake_message && item.cake_message.trim() && (
                      <p className="font-inter text-xs text-pink-600 dark:text-pink-400 mt-1 flex items-center gap-1">
                        <Gift className="w-3 h-3 flex-shrink-0" />
                        Message on cake: &quot;{item.cake_message}&quot;
                      </p>
                    )}
                    <p className="font-inter text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Qty: {item.quantity ?? 1}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className="font-poppins text-sm font-bold text-pink-600 dark:text-pink-400">
                      {formatPrice(parseFloat(item.total || item.price * (item.quantity || 1)))}
                    </span>
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </section>

        {/* C. Delivery & schedule – flat blocks, dividers only */}
        <section className="py-5 border-b border-gray-200 dark:border-gray-700 space-y-4">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-rose-500 dark:text-rose-400 mt-0.5 flex-shrink-0" />
            <div>
              <h2 className="font-poppins text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-gradient-to-b from-rose-400 to-pink-500 dark:from-rose-500 dark:to-pink-600" aria-hidden />
                Delivery Address
              </h2>
                {address ? (
                  <p className="font-inter text-sm text-gray-600 dark:text-gray-400 mt-1 whitespace-pre-line">
                    {[address.street, address.landmark, [address.city, address.state].filter(Boolean).join(', '), address.zip_code, address.country].filter(Boolean).join('\n')}
                  </p>
                ) : (
                  <p className="font-inter text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Address not available
                  </p>
                )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-rose-500 dark:text-rose-400 flex-shrink-0" />
            <div>
              <h2 className="font-poppins text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-gradient-to-b from-rose-400 to-pink-500 dark:from-rose-500 dark:to-pink-600" aria-hidden />
                Delivery Schedule
              </h2>
              <p className="font-inter text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                {scheduleLine}
              </p>
            </div>
          </div>
          {order?.special_instructions && (
            <p className="font-inter text-xs text-gray-500 dark:text-gray-400 mt-2 pl-6">
              Note: {order.special_instructions}
            </p>
          )}
        </section>

        {/* D. Payment summary – flat, no card */}
        <section className="py-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-poppins text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-gradient-to-b from-rose-400 to-pink-500 dark:from-rose-500 dark:to-pink-600" aria-hidden />
            Payment Summary
          </h2>
          <div className="space-y-2 font-inter text-sm">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Item Total</span>
              <span>{formatPrice(itemTotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span>Discount</span>
                <span>-{formatPrice(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Delivery</span>
              <span>{deliveryCharge === 0 ? 'Free' : formatPrice(deliveryCharge)}</span>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3 flex justify-between font-poppins font-bold text-gray-900 dark:text-white text-base">
              <span>Total Paid</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </section>

        {/* E. Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-5">
          {onReorder && (
            <button
              type="button"
              onClick={() => onReorder(order)}
              disabled={reorderLoading}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-pink-500 to-rose-500 dark:from-pink-600 dark:to-rose-600 text-white rounded-lg font-inter text-sm font-semibold hover:from-pink-600 hover:to-rose-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {reorderLoading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Adding…
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  Reorder this order
                </>
              )}
            </button>
          )}
          {onDownloadInvoice && (
            <button
              type="button"
              onClick={() => onDownloadInvoice(order?.order_number)}
              className="flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-inter text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Invoice PDF
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
