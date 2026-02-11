'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

const AuthModalContext = createContext(null);

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
}

export function AuthModalProvider({ children }) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authRedirectPath, setAuthRedirectPath] = useState(null);

  const openAuthModal = useCallback((redirectPath = null) => {
    setAuthRedirectPath(redirectPath);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    setAuthRedirectPath(null);
  }, []);

  const value = {
    isAuthModalOpen,
    authRedirectPath,
    openAuthModal,
    closeAuthModal
  };

  return (
    <AuthModalContext.Provider value={value}>
      {children}
    </AuthModalContext.Provider>
  );
}
