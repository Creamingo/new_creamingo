'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertCircle } from 'lucide-react';

/**
 * Reusable confirmation modal with trendy design.
 * @param {boolean} isOpen
 * @param {string} title - e.g. "Remove item?"
 * @param {string} message - e.g. "Do you want to delete this item?"
 * @param {string} confirmLabel - e.g. "Delete" or "Remove"
 * @param {string} cancelLabel - e.g. "Cancel"
 * @param {'danger'|'default'} variant - danger = red/pink for delete, default = primary
 * @param {() => void} onConfirm
 * @param {() => void} onCancel
 */
const ConfirmModal = ({
  isOpen,
  title = 'Confirm',
  message = 'Are you sure?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') onCancel?.();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onCancel}
          aria-hidden="true"
        />

        {/* Modal card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 12 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
          aria-describedby="confirm-modal-desc"
        >
          {/* Top accent bar */}
          <div
            className={`h-1 w-full ${
              isDanger
                ? 'bg-gradient-to-r from-rose-500 to-pink-500'
                : 'bg-gradient-to-r from-pink-500 to-rose-500'
            }`}
          />

          <div className="p-6 sm:p-7">
            {/* Icon + Title */}
            <div className="flex items-start gap-4">
              <div
                className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                  isDanger
                    ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                    : 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400'
                }`}
              >
                {isDanger ? (
                  <Trash2 className="w-6 h-6" />
                ) : (
                  <AlertCircle className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <h2
                  id="confirm-modal-title"
                  className="text-lg font-bold text-gray-900 dark:text-gray-100"
                >
                  {title}
                </h2>
                <p
                  id="confirm-modal-desc"
                  className="mt-1.5 text-sm text-gray-600 dark:text-gray-400"
                >
                  {message}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-colors ${
                  isDanger
                    ? 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 shadow-md shadow-rose-500/25'
                    : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 shadow-md shadow-pink-500/25'
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ConfirmModal;
