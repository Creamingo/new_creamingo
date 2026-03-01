'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

const AuthModalContext = createContext(null);

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
}

export function AuthModalProvider({ children }) {
  const router = useRouter();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authRedirectPath, setAuthRedirectPath] = useState(null);
  const redirectPathRef = useRef(null);

  const openAuthModal = useCallback((redirectPath = null) => {
    redirectPathRef.current = redirectPath ?? null;
    setAuthRedirectPath(redirectPath ?? null);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    const pathToRedirect = redirectPathRef.current;
    redirectPathRef.current = null;
    setAuthRedirectPath(null);
    // Close modal first so Account page doesn't mount with modal still open
    setIsAuthModalOpen(false);
    if (pathToRedirect) {
      router.replace(pathToRedirect);
    }
  }, [router]);

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
