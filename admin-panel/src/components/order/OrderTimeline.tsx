import React from 'react';
import { Clock, CheckCircle } from 'lucide-react';
import { Order } from '../../services/orderService';

interface OrderTimelineProps {
  order: Order;
  className?: string;
}

// Local date/time parser copied from Orders timeline logic (kept here to avoid cross-page coupling)
const parseLocalDateTime = (dateTimeStr: string): Date => {
  if (!dateTimeStr) return new Date();

  let cleanStr = dateTimeStr.trim();

  // Remove any milliseconds if present: "2025-11-02 14:20:00.123" -> "2025-11-02 14:20:00"
  if (cleanStr.includes('.')) {
    const parts = cleanStr.split('.');
    if (parts.length > 1) {
      const mainPart = parts[0];
      const rest = parts.slice(1).join('.');
      if (!rest.includes(':')) {
        cleanStr = mainPart;
      }
    }
  }

  // Handle common "YYYY-MM-DD HH:MM:SS" format (SQLite style)
  if (cleanStr.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
    const [datePart, timePart] = cleanStr.split(' ');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes, seconds);
  }

  // ISO format handling
  if (cleanStr.includes('T')) {
    if (cleanStr.endsWith('Z') || cleanStr.match(/[+-]\d{2}:\d{2}$/)) {
      return new Date(cleanStr);
    } else {
      const isoParts = cleanStr.split('T');
      if (isoParts.length === 2) {
        const [datePart, timePart] = isoParts;
        const [year, month, day] = datePart.split('-').map(Number);
        const [hours, minutes, seconds = '0'] = timePart.split(':').map(s => s.split('.')[0]);
        return new Date(Date.UTC(year, month - 1, day, Number(hours), Number(minutes), Number(seconds)));
      }
    }
  }

  let parsed = new Date(cleanStr + ' UTC');
  if (isNaN(parsed.getTime())) {
    parsed = new Date(cleanStr);
  }

  if (isNaN(parsed.getTime())) {
    console.warn('Could not parse date:', dateTimeStr, 'using current time');
    return new Date();
  }
  return parsed;
};

export const OrderTimeline: React.FC<OrderTimelineProps> = ({ order, className }) => {
  const statusOrder = ['pending', 'confirmed', 'preparing', 'ready', 'delivered'] as const;
  type StatusKey = (typeof statusOrder)[number];

  const statusLabels: Record<StatusKey, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    preparing: 'Preparing',
    ready: 'Ready',
    delivered: 'Delivered'
  };

  const statusDescriptions: Record<StatusKey, string> = {
    pending: 'Order placed by customer - awaiting manual confirmation',
    confirmed: 'Order verified and confirmed - ready for production',
    preparing: 'Production in progress - cake is being made',
    ready: 'Order is ready for pickup/delivery',
    delivered: 'Order has been delivered to customer'
  };

  const statusColors: Record<StatusKey, { bg: string; border: string; text: string; line: string }> = {
    pending: { bg: 'bg-green-500', border: 'border-green-500', text: 'text-green-500', line: 'bg-green-400' },
    confirmed: { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-500', line: 'bg-blue-400' },
    preparing: { bg: 'bg-yellow-500', border: 'border-yellow-500', text: 'text-yellow-500', line: 'bg-yellow-400' },
    ready: { bg: 'bg-purple-500', border: 'border-purple-500', text: 'text-purple-500', line: 'bg-purple-400' },
    delivered: { bg: 'bg-gray-500', border: 'border-gray-500', text: 'text-gray-500', line: 'bg-gray-400' }
  };

  const getStatusTimestamp = (status: StatusKey, index: number) => {
    let createdAt: Date;
    let updatedAt: Date;

    try {
      createdAt = parseLocalDateTime((order as any).createdAt || '');
      updatedAt = parseLocalDateTime((order as any).updatedAt || '');

      if (isNaN(createdAt.getTime())) {
        createdAt = new Date();
      }
      if (isNaN(updatedAt.getTime())) {
        updatedAt = new Date();
      }
    } catch (error) {
      console.error('Error parsing dates for OrderTimeline:', error, 'createdAt:', (order as any).createdAt, 'updatedAt:', (order as any).updatedAt);
      createdAt = new Date();
      updatedAt = new Date();
    }

    const currentStatusIndex = statusOrder.indexOf(order.status as StatusKey);

    if (status === 'pending') {
      return { date: createdAt, isExact: true };
    }

    if (index > currentStatusIndex) {
      return { date: null, isExact: false };
    }

    if (index === currentStatusIndex) {
      return { date: updatedAt, isExact: true };
    }

    const timeDiff = updatedAt.getTime() - createdAt.getTime();
    const progressRatio = (index + 1) / (currentStatusIndex + 1 || 1);
    const estimatedTime = createdAt.getTime() + timeDiff * progressRatio;
    return { date: new Date(estimatedTime), isExact: false };
  };

  const formatTimestamp = (date: Date | null): string => {
    if (!date || isNaN(date.getTime())) return 'Not yet';

    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className={`flex items-center justify-between w-full overflow-x-auto pb-1 scrollbar-hide ${className || ''}`}>
      {statusOrder.map((status, index) => {
        const isActive = order.status === status;
        const isCompleted = statusOrder.indexOf(order.status as StatusKey) >= index;
        const timestampInfo = getStatusTimestamp(status, index);
        const timestampDate = timestampInfo.date instanceof Date ? timestampInfo.date : null;
        const colors = statusColors[status];

        return (
          <div key={status} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1 w-full">
              <div
                className={`flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all ${
                  isCompleted || isActive
                    ? `${colors.bg} ${colors.border} text-white shadow-sm`
                    : 'bg-gray-200 border-gray-300 text-gray-500'
                }`}
              >
                {isCompleted ? <CheckCircle className="h-3 w-3" /> : <span className="text-[10px] font-semibold">{index + 1}</span>}
              </div>
              <div className="flex flex-col items-center gap-0.5 text-center group relative mt-1">
                <span
                  className={`text-[10px] font-semibold whitespace-nowrap ${
                    isCompleted || isActive ? 'text-gray-900' : 'text-gray-500'
                  }`}
                >
                  {statusLabels[status]}
                </span>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  {statusDescriptions[status]}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <div className="flex items-center gap-0.5">
                    <Clock className="h-2 w-2 text-gray-400" />
                    <span className={`text-[9px] whitespace-nowrap ${status === 'pending' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {formatTimestamp(timestampDate)}
                    </span>
                  </div>
                  {timestampDate && !timestampInfo.isExact && (
                    <span className="text-[8px] text-gray-400 italic">(approx)</span>
                  )}
                </div>
              </div>
            </div>
            {index < statusOrder.length - 1 && (
              <div className="flex items-center justify-center flex-1 mx-1">
                <div className={`h-0.5 w-full rounded-full ${isCompleted ? colors.line : 'bg-gray-200'}`} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default OrderTimeline;

