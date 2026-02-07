import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, AlertCircle, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { useToastContext } from '../contexts/ToastContext';

export const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, isAuthenticated, error, clearError } = useAuth();
  const { showInfo } = useToastContext();
  const navigate = useNavigate();
  const location = useLocation();
  const supportEmail = process.env.REACT_APP_SUPPORT_EMAIL || 'support@creamingo.com';
  const supportMailto = `mailto:${supportEmail}?subject=Creamingo%20Admin%20Password%20Reset`;

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Clear error when component mounts (only if not submitting)
  useEffect(() => {
    // Don't clear error automatically - let it persist until user tries again
    // clearError();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Don't clear error here - let it be cleared only on successful login

    try {
      await login(formData);
      // Clear error only on successful login
      clearError();
      // Navigation will be handled by useEffect
    } catch (error) {
      // Error is handled by the auth context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-stretch">
        {/* Brand Panel */}
        <div className="hidden lg:flex flex-col justify-between rounded-3xl border border-amber-200/60 dark:border-gray-700/60 bg-gradient-to-br from-amber-200/60 via-orange-100/70 to-yellow-50/80 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 p-10 shadow-soft-lg">
          <div>
            <div className="flex items-center gap-4 mb-10">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-400 rounded-2xl flex items-center justify-center shadow-lg border border-amber-200">
                <span className="text-white font-bold text-2xl">C</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent dark:text-gray-100">Creamingo</h1>
                <p className="text-sm text-amber-700 dark:text-gray-400 font-semibold tracking-wide">Admin Panel</p>
              </div>
            </div>
            <h2 className="text-4xl font-semibold text-amber-900 dark:text-gray-100 leading-tight">
              Welcome back
            </h2>
            <p className="mt-3 text-base text-amber-700 dark:text-gray-300 max-w-md">
              Sign in to manage products, orders, and operations securely.
            </p>
          </div>
          <div className="text-sm text-amber-700/80 dark:text-gray-400">
            Secure access only. All activity is monitored and audited.
          </div>
        </div>

        {/* Login Form */}
        <div className="w-full bg-white/90 backdrop-blur-sm dark:bg-gray-800/90 rounded-3xl shadow-soft-lg border border-amber-100/70 dark:border-gray-700/70 p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
          <div className="lg:hidden rounded-2xl border border-amber-200/60 dark:border-gray-700/60 bg-gradient-to-br from-amber-200/60 via-orange-100/70 to-yellow-50/80 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 p-5 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-400 rounded-2xl flex items-center justify-center shadow-lg border border-amber-200">
                <span className="text-white font-bold text-xl">C</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent dark:text-gray-100">Creamingo</h1>
                <p className="text-xs text-amber-600 dark:text-gray-400 font-semibold">Admin Panel</p>
              </div>
            </div>
            <div className="mt-4">
              <h2 className="text-2xl font-semibold text-amber-900 dark:text-gray-100">
                Welcome back
              </h2>
              <p className="mt-2 text-sm text-amber-700 dark:text-gray-300">
                Sign in to manage products, orders, and operations securely.
              </p>
            </div>
          </div>
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-semibold text-amber-900 dark:text-gray-100">
              Sign in to your account
            </h2>
            <p className="mt-2 text-sm sm:text-base text-amber-700 dark:text-gray-300">
              Enter your credentials to continue.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className={`mb-4 p-4 rounded-xl flex items-center gap-3 backdrop-blur-sm ${
              error.includes('deactivated') || error.includes('Account is deactivated')
                ? 'bg-orange-50/90 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800'
                : 'bg-red-50/80 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
              <AlertCircle className={`h-5 w-5 flex-shrink-0 ${
                error.includes('deactivated') || error.includes('Account is deactivated')
                  ? 'text-orange-500'
                  : 'text-red-500'
              }`} />
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  error.includes('deactivated') || error.includes('Account is deactivated')
                    ? 'text-orange-800 dark:text-orange-200'
                    : 'text-red-700 dark:text-red-400'
                }`}>
                  {error}
                </p>
                {(error.includes('deactivated') || error.includes('Account is deactivated')) && (
                  <p className="text-xs text-orange-600 dark:text-orange-300 mt-1">
                    Please contact your system administrator to reactivate your account.
                  </p>
                )}
              </div>
              <button
                onClick={clearError}
                className={`p-1 rounded-md hover:bg-opacity-20 transition-colors ${
                  error.includes('deactivated') || error.includes('Account is deactivated')
                    ? 'text-orange-500 hover:bg-orange-200'
                    : 'text-red-500 hover:bg-red-200'
                }`}
                aria-label="Dismiss error"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <Input
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="admin@creamingo.com"
              leftIcon={<Mail className="h-4 w-4" />}
              required
              disabled={isSubmitting}
            />

            {/* Password Field */}
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                leftIcon={<Lock className="h-4 w-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors p-1 rounded-md hover:bg-amber-100 dark:hover:bg-amber-900/20 flex items-center justify-center"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="rounded border-amber-300 dark:border-gray-600 text-amber-500 focus:ring-amber-500 bg-white/90 dark:bg-gray-700/90 backdrop-blur-sm"
                  disabled={isSubmitting}
                />
                <span className="text-sm text-amber-700 dark:text-gray-300">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  showInfo('Password reset', `Please contact support at ${supportEmail}.`);
                  window.location.href = supportMailto;
                }}
                className="text-sm text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 transition-colors"
                disabled={isSubmitting}
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-6 text-xs text-amber-600 dark:text-gray-400">
            Secure login protected by encryption.
          </div>
        </div>
      </div>
    </div>
  );
};
