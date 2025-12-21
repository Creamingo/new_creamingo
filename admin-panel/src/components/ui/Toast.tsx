import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'confirm';
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 2000,
  onClose,
  onConfirm,
  onCancel,
  confirmText = 'Yes',
  cancelText = 'No'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleClose = React.useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(id);
    }, 300); // Match animation duration
  }, [id, onClose]);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto-close timer (only for non-confirmation toasts)
    let autoCloseTimer: NodeJS.Timeout;
    if (type !== 'confirm') {
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
  }, [duration, type, handleClose]);

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    handleClose();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    handleClose();
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      case 'confirm':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      case 'confirm':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-blue-800';
      case 'confirm':
        return 'text-orange-800';
      default:
        return 'text-blue-800';
    }
  };

  return (
    <div
      className={`
        w-full max-w-sm mx-auto
        transform transition-all duration-300 ease-in-out
        ${isVisible && !isLeaving 
          ? 'translate-y-0 opacity-100' 
          : '-translate-y-4 opacity-0'
        }
      `}
    >
      <div className={`
        ${getBackgroundColor()}
        border rounded-lg shadow-xl p-4
        backdrop-blur-sm
        relative
      `}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className={`text-sm font-semibold ${getTextColor()}`}>
              {title}
            </h4>
            {message && (
              <p className={`text-sm mt-1 ${getTextColor()} opacity-90`}>
                {message}
              </p>
            )}
            
            {/* Confirmation buttons */}
            {type === 'confirm' && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleConfirm}
                  className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 transition-colors"
                >
                  {confirmText}
                </button>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1.5 bg-gray-500 text-white text-xs font-medium rounded-md hover:bg-gray-600 transition-colors"
                >
                  {cancelText}
                </button>
              </div>
            )}
          </div>
          
          {/* Close button (only for non-confirmation toasts) */}
          {type !== 'confirm' && (
            <button
              onClick={handleClose}
              className={`
                flex-shrink-0 p-1 rounded-full
                hover:bg-black/10 transition-colors
                ${getTextColor()} opacity-70 hover:opacity-100
              `}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Toast;
