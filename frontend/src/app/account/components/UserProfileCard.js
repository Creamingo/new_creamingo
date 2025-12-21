'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Edit2, LogOut, Calendar, Package, Crown, Star, Award, ShoppingBag } from 'lucide-react';
import { useCustomerAuth } from '../../../contexts/CustomerAuthContext';
import orderApi from '../../../api/orderApi';

export default function UserProfileCard() {
  const router = useRouter();
  const { customer, logout } = useCustomerAuth();
  const [ordersData, setOrdersData] = useState({
    totalOrders: 0,
    lastOrderDate: null
  });
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  const handleEditProfile = () => {
    // Navigate to edit profile page (to be implemented)
    router.push('/account/profile');
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  // Format member since date
  const formatMemberSince = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  // Get user initials for avatar
  const getInitials = (name, email) => {
    if (name) {
      const parts = name.split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return name[0].toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };

  // Fetch orders data
  useEffect(() => {
    const fetchOrdersData = async () => {
      try {
        setIsLoadingOrders(true);
        const response = await orderApi.getMyOrders();
        
        // Handle different response formats
        let orders = [];
        if (response.success) {
          orders = response.orders || [];
        } else if (response.orders) {
          orders = response.orders;
        } else if (Array.isArray(response)) {
          orders = response;
        }
        
        setOrdersData({
          totalOrders: orders.length,
          lastOrderDate: orders.length > 0 ? orders[0].created_at : null
        });
      } catch (error) {
        console.error('Error fetching orders:', error);
        // Set default values on error
        setOrdersData({
          totalOrders: 0,
          lastOrderDate: null
        });
      } finally {
        setIsLoadingOrders(false);
      }
    };

    if (customer) {
      fetchOrdersData();
    }
  }, [customer]);

  // Determine user level/badge
  const getUserLevel = (orderCount) => {
    if (orderCount >= 20) return { label: 'Creamingo Club Member', icon: Crown, color: 'from-amber-500 to-yellow-500', bgColor: 'bg-amber-50', textColor: 'text-amber-700' };
    if (orderCount >= 10) return { label: 'Regular Buyer', icon: Star, color: 'from-purple-500 to-pink-500', bgColor: 'bg-purple-50', textColor: 'text-purple-700' };
    if (orderCount >= 5) return { label: 'Loyal Customer', icon: Star, color: 'from-blue-500 to-indigo-500', bgColor: 'bg-blue-50', textColor: 'text-blue-700' };
    return { label: 'New Member', icon: User, color: 'from-gray-400 to-gray-500', bgColor: 'bg-gray-50', textColor: 'text-gray-700' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return null;
    }
  };

  const initials = getInitials(customer?.name, customer?.email);
  const memberSince = customer?.created_at 
    ? formatMemberSince(customer.created_at) 
    : 'Recently';
  
  const userLevel = getUserLevel(ordersData.totalOrders);
  const LevelIcon = userLevel.icon;
  const lastOrderFormatted = ordersData.lastOrderDate ? formatDate(ordersData.lastOrderDate) : null;

  // Calculate points (simple: 10 points per order)
  const points = ordersData.totalOrders * 10;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-[0_2px_8px_0_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_0_rgba(0,0,0,0.3)] border border-gray-200/60 dark:border-gray-700/60 p-4 lg:p-5">
      <div className="flex flex-col gap-3">
        {/* Top Row: Avatar, Info, and Action Buttons */}
        <div className="flex items-start gap-3 lg:gap-4">
          {/* Avatar - Mobile: Circular, Desktop: Square */}
          <div className="flex-shrink-0 w-16 h-16 lg:w-14 lg:h-14 rounded-full lg:rounded-xl bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 items-center justify-center shadow-lg ring-2 ring-pink-100 flex">
            <span className="text-white text-xl lg:text-lg font-bold font-poppins tracking-tight">
                {initials}
              </span>
            </div>
            
            {/* User Info */}
            <div className="flex-1 min-w-0">
            {/* User Name and Badge */}
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <h3 className="font-poppins text-lg lg:text-xl font-semibold text-gray-900 dark:text-white leading-tight tracking-tight">
                    {customer?.name || 'User'}
                  </h3>
                  {/* User Level Badge */}
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${userLevel.bgColor} ${userLevel.textColor} border border-current/20`}>
                    <LevelIcon className="w-3 h-3" />
                    <span>{userLevel.label}</span>
                  </span>
                </div>
                
            <p className="font-inter text-sm text-gray-600 dark:text-gray-300 mb-1.5 truncate leading-relaxed">
                {customer?.email}
              </p>
              
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span className="whitespace-nowrap">Member since {memberSince}</span>
              </div>
            </div>
          </div>

          {/* Edit Button */}
            <button
              onClick={handleEditProfile}
            className="flex items-center justify-center w-10 h-10 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-300 active:scale-95 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex-shrink-0"
            title="Edit Profile"
            >
            <Edit2 className="w-5 h-5" />
            </button>
        </div>

        {/* Quick Stats Row - Mobile Optimized */}
        <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-gray-200/60 dark:border-gray-700/60">
          <div className="flex flex-col items-center p-2.5 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-100 dark:border-blue-800/50">
            <ShoppingBag className="w-5 h-5 text-blue-600 dark:text-blue-400 mb-1" />
            <span className="font-poppins text-lg font-bold text-gray-900 dark:text-white leading-tight">{ordersData.totalOrders}</span>
            <span className="font-inter text-[10px] text-gray-700 dark:text-gray-300 uppercase tracking-wide font-medium">Orders</span>
          </div>
          <div className="flex flex-col items-center p-2.5 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border border-purple-100 dark:border-purple-800/50">
            <Award className="w-5 h-5 text-purple-600 dark:text-purple-400 mb-1" />
            <span className="font-poppins text-lg font-bold text-gray-900 dark:text-white leading-tight">{points}</span>
            <span className="font-inter text-[10px] text-gray-700 dark:text-gray-300 uppercase tracking-wide font-medium">Points</span>
          </div>
          <div className="flex flex-col items-center p-2.5 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30 border border-amber-100 dark:border-amber-800/50">
            <LevelIcon className={`w-5 h-5 mb-1 ${userLevel.textColor}`} />
            <span className="font-poppins text-lg font-bold text-gray-900 dark:text-white leading-tight">{userLevel.label.split(' ')[0]}</span>
            <span className="font-inter text-[10px] text-gray-700 dark:text-gray-300 uppercase tracking-wide font-medium">Level</span>
          </div>
        </div>

        {/* Bottom Row: Recent Activity */}
        {lastOrderFormatted && (
          <div className="pt-3 border-t border-gray-200/60 dark:border-gray-700/60">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  <Package className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span>Last order placed on <span className="font-semibold text-gray-800 dark:text-gray-200">{lastOrderFormatted}</span></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

