'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/Toast';

export const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = {
      ...toast,
      id
    };
    setToasts(prev => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showSuccess = useCallback((title, message, duration = 3000) => {
    addToast({
      type: 'success',
      title,
      message,
      duration
    });
  }, [addToast]);

  const showError = useCallback((title, message, duration = 3000) => {
    addToast({
      type: 'error',
      title,
      message,
      duration
    });
  }, [addToast]);

  const showWarning = useCallback((title, message, duration = 3000, actionButton = null) => {
    addToast({
      type: 'warning',
      title,
      message,
      duration,
      actionButton
    });
  }, [addToast]);

  const showInfo = useCallback((title, message, duration = 3000) => {
    addToast({
      type: 'info',
      title,
      message,
      duration
    });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{
      showSuccess,
      showError,
      showWarning,
      showInfo
    }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col items-end pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              {...toast}
              onClose={removeToast}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

