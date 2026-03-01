'use client';

import React from 'react';
import { useAuthModal } from '../contexts/AuthModalContext';

/**
 * Renders inside the app tree so backdrop-filter actually blurs the page content.
 * When the auth modal is portaled to body, a backdrop inside the portal does not
 * blur the app content in many browsers. This backdrop sits on top of the page
 * and is blurred correctly.
 */
export default function AuthModalBackdrop() {
  const { isAuthModalOpen, closeAuthModal } = useAuthModal();

  if (!isAuthModalOpen) return null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={closeAuthModal}
      onKeyDown={(e) => e.key === 'Escape' && closeAuthModal()}
      aria-label="Close"
      className="fixed inset-0 z-[99998] bg-black/40 backdrop-blur-sm"
    />
  );
}
