'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Wallet,
  Phone,
  User,
  X
} from 'lucide-react';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';
import customerAuthApi from '../api/customerAuthApi';

const normalizeEmail = (value) => value.trim().toLowerCase();

const getErrorMessage = (error, fallback) => {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message || fallback;
  return fallback;
};

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const { isAuthenticated, login, register } = useCustomerAuth();
  const [authEmail, setAuthEmail] = useState('');
  const [authStep, setAuthStep] = useState('email'); // email | login | signup
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [emailCheckResult, setEmailCheckResult] = useState(null);
  const [signupData, setSignupData] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
    referralCode: ''
  });
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const isEmailValid = /\S+@\S+\.\S+/.test(authEmail.trim());
  const [isRendered, setIsRendered] = useState(false);
  const [isPanelVisible, setIsPanelVisible] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setAuthEmail('');
    setAuthStep('email');
    setAuthPassword('');
    setAuthLoading(false);
    setAuthError('');
    setEmailCheckResult(null);
    setSignupData({
      name: '',
      phone: '',
      password: '',
      confirmPassword: '',
      referralCode: ''
    });
    setShowLoginPassword(false);
    setShowSignupPassword(false);
    setShowSignupConfirmPassword(false);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      const frame = requestAnimationFrame(() => setIsPanelVisible(true));
      return () => cancelAnimationFrame(frame);
    }
    if (!isOpen && isRendered) {
      setIsPanelVisible(false);
      const timeout = setTimeout(() => setIsRendered(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [isOpen, isRendered]);

  useEffect(() => {
    if (isAuthenticated && isOpen) {
      onClose?.();
    }
  }, [isAuthenticated, isOpen, onClose]);

  const handleCheckEmail = async (e) => {
    e.preventDefault();
    setAuthError('');
    const normalizedEmail = normalizeEmail(authEmail);

    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      setAuthError('Please enter a valid email address');
      return;
    }

    setAuthLoading(true);
    try {
      const result = await customerAuthApi.checkEmail({ email: normalizedEmail });
      setEmailCheckResult(result);
      setAuthEmail(normalizedEmail);
      setAuthStep(result.exists ? 'login' : 'signup');
    } catch (error) {
      setAuthError(getErrorMessage(error, 'Unable to check your email. Please try again.'));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (!authPassword) {
      setAuthError('Please enter your password');
      return;
    }

    setAuthLoading(true);
    try {
      await login({ email: normalizeEmail(authEmail), password: authPassword });
      onSuccess?.();
      onClose?.();
    } catch (error) {
      setAuthError(getErrorMessage(error, 'Invalid email or password'));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (!signupData.name.trim()) {
      setAuthError('Please enter your full name');
      return;
    }
    if (!signupData.password || signupData.password.length < 6) {
      setAuthError('Password must be at least 6 characters');
      return;
    }
    if (signupData.password !== signupData.confirmPassword) {
      setAuthError('Passwords do not match');
      return;
    }

    setAuthLoading(true);
    try {
      await register({
        name: signupData.name.trim(),
        email: normalizeEmail(authEmail),
        phone: signupData.phone?.trim() || undefined,
        password: signupData.password,
        referralCode: signupData.referralCode?.trim() || undefined
      });
      onSuccess?.();
      onClose?.();
    } catch (error) {
      setAuthError(getErrorMessage(error, 'Could not create account. Please try again.'));
    } finally {
      setAuthLoading(false);
    }
  };

  if (!isRendered) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-end justify-center lg:items-stretch">
      <button
        type="button"
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity duration-500 ${
          isPanelVisible ? 'opacity-100' : 'opacity-0'
        }`}
        aria-label="Close authentication"
      />
      <div
        className={`relative w-full max-w-md bg-white dark:bg-gray-800 rounded-t-3xl border border-pink-200/60 dark:border-pink-700/40 shadow-2xl pb-2 mb-[3.6rem] lg:mb-0 lg:h-full lg:rounded-l-3xl lg:rounded-tr-none lg:ml-auto transform transition-transform duration-500 ease-out ${
          isPanelVisible ? 'translate-y-0 lg:translate-x-0' : 'translate-y-full lg:translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 pt-3 lg:pt-6">
          <div className="w-full flex flex-col items-center gap-2">
            <div className="h-1.5 w-12 rounded-full bg-gray-300/80 dark:bg-gray-600/80 lg:hidden" />
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/40">
                  <Lock className="w-4 h-4 text-pink-600 dark:text-pink-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Sign in to continue</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Use your email to sign in or create an account.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full bg-pink-50 dark:bg-pink-900/30 border border-pink-200 dark:border-pink-700/40 text-pink-600 dark:text-pink-300 hover:bg-pink-100 dark:hover:bg-pink-900/50 shadow-sm"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="px-5 pb-6 pt-5 max-h-[calc(100vh-10rem)] lg:max-h-full lg:pt-8 lg:pb-10 overflow-y-auto">
          {authError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {authStep === 'email' && (
            <form onSubmit={handleCheckEmail} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    autoComplete="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    required
                    className="w-full pl-9 pr-4 py-3 text-sm font-poppins border-2 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500 placeholder:font-poppins placeholder:tracking-wide border-pink-200 dark:border-pink-700/60 focus:ring-pink-500 dark:focus:ring-pink-400 shadow-sm"
                    placeholder="you@email.com"
                  />
                </div>
              </div>
              <div className="sticky bottom-0 pt-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur">
                <button
                  type="submit"
                  disabled={authLoading || !isEmailValid}
                  className="w-full px-4 py-3 text-sm font-semibold font-poppins tracking-wide bg-pink-600 dark:bg-pink-700 text-white rounded-xl hover:bg-pink-700 dark:hover:bg-pink-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-pink-500/20"
                >
                  {authLoading ? 'Checking...' : 'Continue & Get Cashback'}
                </button>
                <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-pink-600 dark:text-pink-300">
                  <Wallet className="w-3.5 h-3.5" />
                  Sign up & get wallet cashback up to ₹100.
                </div>
                <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400 text-center">
                  Secure and instant after signup.
                </p>
              </div>
            </form>
          )}

          {authStep === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Account found for <span className="font-semibold text-gray-900 dark:text-gray-100">{authEmail}</span>
                {emailCheckResult?.customer?.name ? ` • Welcome back, ${emailCheckResult.customer.name}` : ''}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    required
                    className="w-full pr-10 px-3 py-2.5 text-sm font-poppins border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500 placeholder:font-poppins placeholder:tracking-wide border-gray-300 dark:border-gray-600 focus:ring-pink-500 dark:focus:ring-pink-400"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((prev) => !prev)}
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={authLoading}
                className="w-full px-4 py-2.5 text-sm font-semibold font-poppins tracking-wide bg-pink-600 dark:bg-pink-700 text-white rounded-lg hover:bg-pink-700 dark:hover:bg-pink-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {authLoading ? 'Signing in...' : 'Sign in'}
              </button>
              <p className="text-[11px] text-gray-600 dark:text-gray-400 text-center">
                Sign up & get wallet cashback up to ₹100. Secure and instant after signup.
              </p>
              <button
                type="button"
                onClick={() => {
                  setAuthStep('email');
                  setAuthError('');
                }}
                className="w-full text-xs font-semibold text-pink-600 dark:text-pink-300 hover:text-pink-700 dark:hover:text-pink-200 transition-colors"
              >
                Use a different email
              </button>
            </form>
          )}

          {authStep === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div className="text-xs text-gray-600 dark:text-gray-400">
                New account for <span className="font-semibold text-gray-900 dark:text-gray-100">{authEmail}</span>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    autoComplete="name"
                    value={signupData.name}
                    onChange={(e) => setSignupData((prev) => ({ ...prev, name: e.target.value }))}
                    required
                    className="w-full pl-9 pr-4 py-2.5 text-sm font-poppins border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500 placeholder:font-poppins placeholder:tracking-wide border-gray-300 dark:border-gray-600 focus:ring-pink-500 dark:focus:ring-pink-400"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    autoComplete="tel"
                    value={signupData.phone}
                    onChange={(e) => setSignupData((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full pl-9 pr-4 py-2.5 text-sm font-poppins border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500 placeholder:font-poppins placeholder:tracking-wide border-gray-300 dark:border-gray-600 focus:ring-pink-500 dark:focus:ring-pink-400"
                    placeholder="Enter mobile number"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showSignupPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={signupData.password}
                      onChange={(e) => setSignupData((prev) => ({ ...prev, password: e.target.value }))}
                      required
                      className="w-full pr-10 px-3 py-2.5 text-sm font-poppins border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500 placeholder:font-poppins placeholder:tracking-wide border-gray-300 dark:border-gray-600 focus:ring-pink-500 dark:focus:ring-pink-400"
                      placeholder="Create password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword((prev) => !prev)}
                      aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showSignupConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={signupData.confirmPassword}
                      onChange={(e) => setSignupData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                      className="w-full pr-10 px-3 py-2.5 text-sm font-poppins border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500 placeholder:font-poppins placeholder:tracking-wide border-gray-300 dark:border-gray-600 focus:ring-pink-500 dark:focus:ring-pink-400"
                      placeholder="Confirm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupConfirmPassword((prev) => !prev)}
                      aria-label={showSignupConfirmPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      {showSignupConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Referral Code (optional)
                </label>
                <input
                  type="text"
                  autoComplete="off"
                  value={signupData.referralCode}
                  onChange={(e) => setSignupData((prev) => ({ ...prev, referralCode: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm font-poppins border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500 placeholder:font-poppins placeholder:tracking-wide border-gray-300 dark:border-gray-600 focus:ring-pink-500 dark:focus:ring-pink-400"
                  placeholder="Enter referral code"
                />
              </div>
              <button
                type="submit"
                disabled={authLoading}
                className="w-full px-4 py-2.5 text-sm font-semibold font-poppins tracking-wide bg-pink-600 dark:bg-pink-700 text-white rounded-lg hover:bg-pink-700 dark:hover:bg-pink-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {authLoading ? 'Creating account...' : 'Create account'}
              </button>
              <p className="text-[11px] text-gray-600 dark:text-gray-400 text-center">
                Sign up & get wallet cashback up to ₹100. Secure and instant after signup.
              </p>
              <button
                type="button"
                onClick={() => {
                  setAuthStep('email');
                  setAuthError('');
                }}
                className="w-full text-xs font-semibold text-pink-600 dark:text-pink-300 hover:text-pink-700 dark:hover:text-pink-200 transition-colors"
              >
                Use a different email
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
