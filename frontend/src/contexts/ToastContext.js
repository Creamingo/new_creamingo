'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Toast from '../components/Toast';

const TOAST_ROOT_ID = 'creamingo-toast-root';

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
  const [mounted, setMounted] = useState(false);
  const toastRootRef = useRef(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    let root = document.getElementById(TOAST_ROOT_ID);
    if (!root) {
      root = document.createElement('div');
      root.id = TOAST_ROOT_ID;
      root.setAttribute('aria-live', 'polite');
      root.setAttribute('aria-label', 'Notifications');
      root.style.cssText = [
        'position:fixed',
        'top:1rem',
        'right:1rem',
        'z-index:2147483647',
        'display:flex',
        'flex-direction:column',
        'align-items:flex-end',
        'pointer-events:none',
        'padding:0',
        'margin:0',
        'max-width:100vw',
        'box-sizing:border-box'
      ].join(';');
      document.body.appendChild(root);
      toastRootRef.current = root;
    }
    setMounted(true);
    return () => {
      if (toastRootRef.current?.parentNode) {
        toastRootRef.current.parentNode.removeChild(toastRootRef.current);
      }
      toastRootRef.current = null;
    };
  }, []);

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

  const toastContainer = mounted && toastRootRef.current ? (
    <>
      {toasts.map(toast => (
        <div key={toast.id} style={{ pointerEvents: 'auto' }}>
          <Toast
            {...toast}
            onClose={removeToast}
          />
        </div>
      ))}
    </>
  ) : null;

  return (
    <ToastContext.Provider value={{
      showSuccess,
      showError,
      showWarning,
      showInfo
    }}>
      {children}
      {mounted && toastRootRef.current && createPortal(toastContainer, toastRootRef.current)}
    </ToastContext.Provider>
  );
};

