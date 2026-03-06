'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ id, type, title, message, duration = 3000, onClose, actionButton = null }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto-close timer (only if duration is set and no action button)
    // If actionButton exists, toast stays visible until dismissed or button clicked
    let autoCloseTimer = null;
    if (duration > 0 && !actionButton) {
      autoCloseTimer = setTimeout(() => {
        handleClose();
      }, duration);
    }

    return () => {
      clearTimeout(timer);
      if (autoCloseTimer) {
        clearTimeout(autoCloseTimer);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, actionButton]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(id);
    }, 500); // Match animation duration
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500 dark:text-red-400" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />;
      case 'info':
        return <Info className="w-5 h-5 text-pink-500 dark:text-pink-400" />;
      default:
        return <Info className="w-5 h-5 text-pink-500 dark:text-pink-400" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700';
      case 'info':
        return 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-700';
      default:
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800 dark:text-green-200';
      case 'error':
        return 'text-red-800 dark:text-red-200';
      case 'warning':
        return 'text-yellow-800 dark:text-yellow-200';
      case 'info':
        return 'text-pink-800 dark:text-pink-200';
      default:
        return 'text-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div
      className={`
        ${getBackgroundColor()} 
        border 
        rounded-lg 
        p-4 
        shadow-lg dark:shadow-xl dark:shadow-black/30 
        mb-4 
        min-w-[300px] 
        max-w-[400px]
        transform 
        transition-all 
        duration-500 
        ease-in-out
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${getTextColor()}`}>
            {title}
          </p>
          {message && (
            <p className={`text-sm mt-1 ${getTextColor()} opacity-90 dark:opacity-95`}>
              {message}
            </p>
          )}
          {actionButton && (
            <div className="mt-3">
              {actionButton}
            </div>
          )}
        </div>
        <button
          onClick={handleClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;

