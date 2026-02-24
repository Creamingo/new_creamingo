'use client';

import { ShoppingBag, ChefHat, Truck, CheckCircle } from 'lucide-react';

/**
 * Status-based order timeline: Placed → Preparing → Out for delivery → Delivered.
 * Icons per step, soft gradient active state, subtle progress animation.
 */
const STEPS = [
  { key: 'placed', label: 'Placed', Icon: ShoppingBag },
  { key: 'preparing', label: 'Preparing', Icon: ChefHat },
  { key: 'out_for_delivery', label: 'Out for delivery', Icon: Truck },
  { key: 'delivered', label: 'Delivered', Icon: CheckCircle },
];

const STATUS_TO_STEP_INDEX = {
  placed: 0,
  pending: 0,
  confirmed: 1,
  processing: 1,
  ready: 1,
  shipped: 2,
  out_for_delivery: 2,
  delivered: 3,
  cancelled: -1,
};

function getStepIndex(status) {
  if (!status) return 0;
  const s = String(status).toLowerCase().replace(/-/g, '_');
  return STATUS_TO_STEP_INDEX[s] ?? 0;
}

export default function OrderTimeline({ status }) {
  const currentIndex = getStepIndex(status);
  const isCancelled = String(status || '').toLowerCase() === 'cancelled';
  const activeIndex = isCancelled ? 0 : Math.min(currentIndex, STEPS.length - 1);

  return (
    <section className="py-5 border-b border-gray-200 dark:border-gray-700">
      <h2 className="font-poppins text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <span className="w-1 h-4 rounded-full bg-gradient-to-b from-rose-400 to-pink-500 dark:from-rose-500 dark:to-pink-600" aria-hidden />
        Order status
      </h2>
      {/* Timeline strip – light background so it pops */}
      <div className="relative rounded-xl bg-gradient-to-br from-rose-50/80 to-pink-50/50 dark:from-gray-800/80 dark:to-rose-900/20 border border-rose-100/80 dark:border-rose-900/30 px-4 py-5 sm:px-6">
        <div className="flex items-start justify-between gap-0">
          {STEPS.map((step, index) => {
            const isCompleted = index <= activeIndex && !isCancelled;
            const isCurrent = index === activeIndex && !isCancelled;
            const isLast = index === STEPS.length - 1;
            const Icon = step.Icon;
            return (
              <div key={step.key} className="flex flex-1 flex-col items-center min-w-0">
                <div className="flex items-center w-full">
                  <div
                    className={`flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                      isCompleted
                        ? 'border-rose-400 dark:border-rose-400 bg-gradient-to-br from-rose-500 to-pink-500 dark:from-rose-600 dark:to-pink-600 text-white shadow-md shadow-rose-200/50 dark:shadow-rose-900/30'
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                    } ${isCurrent ? 'ring-4 ring-rose-200/80 dark:ring-rose-800/50 scale-110' : ''}`}
                  >
                    {isCompleted && index < activeIndex ? (
                      <CheckCircle className="w-5 h-5 sm:w-5 sm:h-5" strokeWidth={2.5} aria-hidden />
                    ) : (
                      <Icon className="w-5 h-5 sm:w-5 sm:h-5" strokeWidth={isCurrent ? 2.5 : 1.8} aria-hidden />
                    )}
                  </div>
                  {!isLast && (
                    <div className="flex-1 mx-1 min-w-[12px] h-0.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-rose-400 to-pink-400 dark:from-rose-500 dark:to-pink-500 transition-all duration-500 ease-out"
                        style={{ width: isCompleted ? '100%' : '0%' }}
                      />
                    </div>
                  )}
                </div>
                <span
                  className={`mt-2 text-xs font-semibold text-center tracking-tight max-w-[4.5rem] sm:max-w-none ${
                    isCurrent
                      ? 'text-rose-600 dark:text-rose-400'
                      : isCompleted
                        ? 'text-gray-700 dark:text-gray-300'
                        : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
        {isCancelled && (
          <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
            This order was cancelled.
          </p>
        )}
      </div>
    </section>
  );
}
