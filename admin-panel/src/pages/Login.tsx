import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, AlertCircle, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';

export const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, isAuthenticated, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-2 sm:p-4 pt-20 sm:pt-4 sm:flex">
      <div className="w-full max-w-6xl">
        {/* Header Box with Logo and Content */}
        <div className="bg-white/90 backdrop-blur-sm dark:bg-gray-800/90 rounded-3xl shadow-soft-lg border border-amber-200/50 dark:border-gray-700/50 p-3 sm:p-6 mb-15 sm:mb-6 mt-0 sm:mt-0 fixed top-0 left-0 right-0 sm:static sm:left-auto sm:right-auto z-50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
            {/* Logo Section - Left */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-400 rounded-2xl flex items-center justify-center shadow-lg border border-amber-200">
                <span className="text-white font-bold text-lg sm:text-2xl">C</span>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent dark:text-gray-100">Creamingo</h1>
                <p className="text-sm sm:text-base text-amber-600 dark:text-gray-400 font-semibold">Admin Panel</p>
              </div>
            </div>
            
            {/* Content Section - Right */}
            <div className="text-center sm:text-right hidden sm:block">
              <h2 className="text-lg sm:text-xl font-bold text-amber-800 dark:text-gray-100 mb-1">Welcome back</h2>
              <p className="text-xs sm:text-sm text-amber-600 dark:text-gray-400">Sign in to your admin account</p>
            </div>
          </div>
        </div>

        {/* Main Content - Horizontal Layout for Laptop */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start lg:items-start justify-center">

          {/* Login Form */}
          <div className="w-full lg:w-96 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-2xl shadow-soft-lg border border-amber-100 dark:border-gray-700 p-6">

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

          </div>

          {/* Demo Credentials - Side Panel for Laptop */}
          <div className="w-full lg:w-80">
            <div className="p-4 bg-gradient-to-r from-amber-50/80 to-orange-50/80 dark:bg-gray-700/80 rounded-xl border border-amber-100 dark:border-gray-600 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full"></div>
                <h3 className="text-sm font-medium text-amber-700 dark:text-gray-100">Demo Credentials</h3>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-white/90 dark:bg-gray-600/90 rounded-lg border border-amber-200 dark:border-gray-500 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                    <span className="text-sm font-medium text-amber-800 dark:text-gray-100">Super Admin</span>
                  </div>
                              <div className="text-sm text-amber-700 dark:text-gray-300 space-y-1">
                                <p><span className="font-medium">Email:</span> admin@creamingo.com</p>
                                <p><span className="font-medium">Password:</span> Creamingo@2427</p>
                              </div>
                </div>
                <div className="p-3 bg-white/90 dark:bg-gray-600/90 rounded-lg border border-amber-200 dark:border-gray-500 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                    <span className="text-sm font-medium text-amber-800 dark:text-gray-100">Super Admin</span>
                  </div>
                              <div className="text-sm text-amber-700 dark:text-gray-300 space-y-1">
                                <p><span className="font-medium">Email:</span> superadmin@creamingo.com</p>
                                <p><span className="font-medium">Password:</span> SuperCreamingo@2427</p>
                              </div>
                </div>
                <div className="p-3 bg-white/90 dark:bg-gray-600/90 rounded-lg border border-amber-200 dark:border-gray-500 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                    <span className="text-sm font-medium text-amber-800 dark:text-gray-100">Admin</span>
                  </div>
                              <div className="text-sm text-amber-700 dark:text-gray-300 space-y-1">
                                <p><span className="font-medium">Email:</span> admin2@creamingo.com</p>
                                <p><span className="font-medium">Password:</span> Creamingo@2427</p>
                              </div>
                </div>
                <div className="p-3 bg-white/90 dark:bg-gray-600/90 rounded-lg border border-amber-200 dark:border-gray-500 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
                    <span className="text-sm font-medium text-amber-800 dark:text-gray-100">Staff</span>
                  </div>
                              <div className="text-sm text-amber-700 dark:text-gray-300 space-y-1">
                                <p><span className="font-medium">Email:</span> staff@creamingo.com</p>
                                <p><span className="font-medium">Password:</span> Creamingo@2427</p>
                              </div>
                </div>
                <div className="p-3 bg-white/90 dark:bg-gray-600/90 rounded-lg border border-amber-200 dark:border-gray-500 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
                    <span className="text-sm font-medium text-amber-800 dark:text-gray-100">Bakery Production</span>
                  </div>
                              <div className="text-sm text-amber-700 dark:text-gray-300 space-y-1">
                                <p><span className="font-medium">Email:</span> bakery@creamingo.com</p>
                                <p><span className="font-medium">Password:</span> Creamingo@2427</p>
                              </div>
                </div>
                <div className="p-3 bg-white/90 dark:bg-gray-600/90 rounded-lg border border-amber-200 dark:border-gray-500 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-amber-800 dark:text-gray-100">Delivery Boy</span>
                  </div>
                              <div className="text-sm text-amber-700 dark:text-gray-300 space-y-1">
                                <p><span className="font-medium">Email:</span> delivery@creamingo.com</p>
                                <p><span className="font-medium">Password:</span> Creamingo@2427</p>
                              </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 sm:mt-4 mb-4 sm:mb-0">
          <p className="text-xs sm:text-xs text-amber-500 dark:text-gray-400 font-medium">
            © 2024 Creamingo. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};
