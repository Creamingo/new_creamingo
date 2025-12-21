import React, { createContext, useContext, ReactNode } from 'react';
import { useToast } from '../hooks/useToast';

interface ToastContextType {
  toasts: any[];
  showSuccess: (title: string, message?: string, duration?: number) => void;
  showError: (title: string, message?: string, duration?: number) => void;
  showWarning: (title: string, message?: string, duration?: number) => void;
  showInfo: (title: string, message?: string, duration?: number) => void;
  showConfirm: (
    title: string, 
    message?: string, 
    onConfirm?: () => void, 
    onCancel?: () => void,
    confirmText?: string,
    cancelText?: string
  ) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const { toasts, showSuccess, showError, showWarning, showInfo, showConfirm, removeToast, clearAll } = useToast();

  return (
    <ToastContext.Provider value={{
      toasts,
      showSuccess,
      showError,
      showWarning,
      showInfo,
      showConfirm,
      removeToast,
      clearAll
    }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToastContext = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
};
