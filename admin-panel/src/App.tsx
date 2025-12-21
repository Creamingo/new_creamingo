import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Unauthorized } from './pages/Unauthorized';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import ProductAddOns from './pages/ProductAddOns';
import { Banners } from './pages/Banners';
import { Categories } from './pages/Categories';
import { Subcategories } from './pages/Subcategories';
import { FeaturedProducts } from './pages/FeaturedProducts';
import { Collections } from './pages/Collections';
import { Orders } from './pages/Orders';
import { Customers } from './pages/Customers';
import { CustomerDetail } from './pages/CustomerDetail';
import { Payments } from './pages/Payments';
import { Settings } from './pages/Settings';
import Users from './pages/Users';
import Delivery from './pages/Delivery';
import DeliverySettings from './pages/DeliverySettings';
import DeliverySlots from './pages/DeliverySlots';
import { PromoCodes } from './pages/PromoCodes';
import { OneRupeeDeals } from './pages/OneRupeeDeals';
import BakeryProduction from './pages/BakeryProduction';
import './utils/debugAuth'; // Import debug utility

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <Router basename={process.env.PUBLIC_URL || ''} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<ProtectedRoute requiredPermission="dashboard.view"><Dashboard /></ProtectedRoute>} />
            <Route path="banners" element={<ProtectedRoute requiredPermission="banners.view"><Banners /></ProtectedRoute>} />
            <Route path="categories" element={<ProtectedRoute requiredPermission="categories.view"><Categories /></ProtectedRoute>} />
            <Route path="subcategories" element={<ProtectedRoute requiredPermission="subcategories.view"><Subcategories /></ProtectedRoute>} />
            <Route path="featured-products" element={<ProtectedRoute requiredPermission="featured-products.view"><FeaturedProducts /></ProtectedRoute>} />
            <Route path="products" element={<ProtectedRoute requiredPermission="products.view"><Products /></ProtectedRoute>} />
            <Route path="product-add-ons" element={<ProtectedRoute requiredPermission="products.view"><ProductAddOns /></ProtectedRoute>} />
            <Route path="collections" element={<ProtectedRoute requiredPermission="collections.view"><Collections /></ProtectedRoute>} />
            <Route path="orders" element={<ProtectedRoute requiredPermission="orders.view"><Orders /></ProtectedRoute>} />
            <Route path="bakery-production" element={<ProtectedRoute requiredPermission="bakery-production.view"><BakeryProduction /></ProtectedRoute>} />
            <Route path="customers" element={<ProtectedRoute requiredPermission="customers.view"><Customers /></ProtectedRoute>} />
            <Route path="customers/:id" element={<ProtectedRoute requiredPermission="customers.view"><CustomerDetail /></ProtectedRoute>} />
            <Route path="payments" element={<ProtectedRoute requiredPermission="payments.view"><Payments /></ProtectedRoute>} />
            <Route path="users" element={<ProtectedRoute requiredPermission="users.view"><Users /></ProtectedRoute>} />
            <Route path="delivery" element={<ProtectedRoute requiredPermission="orders.view"><Delivery /></ProtectedRoute>} />
            <Route path="delivery-settings" element={<ProtectedRoute requiredPermission="settings.view"><DeliverySettings /></ProtectedRoute>} />
            <Route path="delivery-slots" element={<ProtectedRoute requiredPermission="settings.view"><DeliverySlots /></ProtectedRoute>} />
            <Route path="promo-codes" element={<ProtectedRoute requiredPermission="settings.view"><PromoCodes /></ProtectedRoute>} />
            <Route path="one-rupee-deals" element={<ProtectedRoute requiredPermission="settings.view"><OneRupeeDeals /></ProtectedRoute>} />
            <Route path="settings" element={<ProtectedRoute requiredPermission="settings.view"><Settings /></ProtectedRoute>} />
          </Route>
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Router>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
