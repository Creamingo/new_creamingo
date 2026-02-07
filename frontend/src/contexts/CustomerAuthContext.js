'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import customerAuthApi from '../api/customerAuthApi';
import { ToastContext } from './ToastContext';

// Create context
const CustomerAuthContext = createContext(null);

// Custom hook to use customer auth context
export const useCustomerAuth = () => {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
};

// Auth provider component
export const CustomerAuthProvider = ({ children }) => {
  const [customer, setCustomer] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const toast = useContext(ToastContext);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (customerAuthApi.isAuthenticated()) {
          // Try to get current customer to validate token
          const customerData = await customerAuthApi.getCurrentCustomer();
          setCustomer(customerData);
          setIsAuthenticated(true);
        } else {
          // Token is missing: treat session as unauthenticated
          const storedCustomer = customerAuthApi.getCustomerData();
          if (storedCustomer) {
            // Clear stale customer data to avoid false auth state
            customerAuthApi.clearCustomerData();
          }
          setCustomer(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        // Only log non-token-expiration errors (token expiration is expected and handled silently)
        const isTokenExpired = error.message === 'Token expired.' || error.isTokenExpired;
        if (!isTokenExpired) {
          console.error('Auth check error:', error);
        }
        // Clear invalid data
        customerAuthApi.logout();
        setCustomer(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (credentials) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await customerAuthApi.login(credentials);
      setCustomer(response.customer);
      setIsAuthenticated(true);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (customerData, options = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await customerAuthApi.register(customerData);
      setCustomer(response.customer);
      setIsAuthenticated(true);
      if (response.welcomeBonus?.credited && toast?.showSuccess) {
        const baseMessage = `₹${response.welcomeBonus.amount} has been added to your wallet.`;
        const message =
          options?.source === 'checkout'
            ? baseMessage
            : `${baseMessage} You can use this bonus for purchasing this order!`;
        toast.showSuccess(
          'Welcome Bonus Credited!',
          message,
          6000
        );
      }
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setError(errorMessage);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await customerAuthApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setCustomer(null);
      setIsAuthenticated(false);
      setError(null);
      // Redirect to home page
      router.push('/');
    }
  };

  // Update profile function
  const updateProfile = async (profileData) => {
    setIsLoading(true);
    setError(null);

    try {
      const updatedCustomer = await customerAuthApi.updateProfile(profileData);
      setCustomer(updatedCustomer);
      return updatedCustomer;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Change password function
  const changePassword = async (passwordData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await customerAuthApi.changePassword(passwordData);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to change password';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Clear error function
  const clearError = () => {
    setError(null);
  };

  // Get token (for use in API calls)
  const getToken = () => {
    return customerAuthApi.getToken();
  };

  const value = {
    customer,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    clearError,
    getToken
  };

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  );
};

