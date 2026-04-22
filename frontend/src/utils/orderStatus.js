import { CheckCircle, Clock, XCircle } from 'lucide-react';

/**
 * Shared order status styling for list and detail views.
 * Pill: small, rounded-full, light background, dark text. No thick borders.
 */
export function getStatusColor(status) {
  const s = (status || '').toLowerCase();
  if (s === 'delivered') return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
  if (s === 'pending') return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
  if (s === 'cancelled') return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
  if (s === 'processing' || s === 'confirmed' || s === 'shipped' || s === 'ready' || s === 'out_for_delivery')
    return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
  return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
}

export function getStatusIcon(status) {
  const s = (status || '').toLowerCase();
  if (s === 'delivered') return <CheckCircle className="w-3.5 h-3.5" />;
  if (s === 'cancelled') return <XCircle className="w-3.5 h-3.5" />;
  return <Clock className="w-3.5 h-3.5" />;
}
