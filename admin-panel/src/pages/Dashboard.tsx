import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingCart, 
  DollarSign, 
  Users, 
  Package, 
  TrendingUp, 
  TrendingDown,
  Eye,
  Clock,
  RefreshCw,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  FileText,
  Settings,
  BarChart3,
  Info,
  Play,
  Pause,
  Download,
  Target,
  Edit2,
  X,
  Trophy,
  Sparkles,
  Calendar,
  Zap,
  ChevronDown,
  ChevronUp,
  Bell,
  Layers,
  Building2,
  Briefcase,
  User,
  Activity,
  Users as UsersIcon,
  MessageSquare,
  Link,
  BarChart2,
  Star,
  Medal,
  Crown,
  Flame,
  Target as TargetIcon,
  Calculator,
  Lightbulb,
  Webhook,
  Send,
  ThumbsUp,
  Flag,
  Code,
  FileSpreadsheet
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { DateRangePicker } from '../components/ui/DateRangePicker';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { DashboardStats, Order, TableColumn } from '../types';
import dashboardService from '../services/dashboardService';
import orderService from '../services/orderService';
import { useToastContext } from '../contexts/ToastContext';

// Currency formatting utility
const formatCurrency = (amount: number | string): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return '₹0';
  return `₹${numAmount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

// Simple Tooltip Component (renamed to avoid conflict with recharts Tooltip)
const DashboardTooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
  const [show, setShow] = useState(false);
  
  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-lg whitespace-nowrap bottom-full left-1/2 transform -translate-x-1/2 mb-2">
          {text}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
          </div>
        </div>
      )}
    </div>
  );
};

// Circular Progress Ring Component
const CircularProgress: React.FC<{
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  showMilestones?: boolean;
}> = ({ progress, size = 120, strokeWidth = 8, color = 'primary', showMilestones = true }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  
  const colorClasses = {
    primary: 'stroke-primary-500 dark:stroke-primary-400',
    green: 'stroke-green-500 dark:stroke-green-400',
    blue: 'stroke-blue-500 dark:stroke-blue-400',
    orange: 'stroke-orange-500 dark:stroke-orange-400'
  };

  const textColorClasses = {
    primary: 'text-primary-500 dark:text-primary-400',
    green: 'text-green-500 dark:text-green-400',
    blue: 'text-blue-500 dark:text-blue-400',
    orange: 'text-orange-500 dark:text-orange-400'
  };

  const milestonePositions = [25, 50, 75, 100];
  
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${colorClasses[color as keyof typeof colorClasses]} transition-all duration-500`}
        />
        {/* Milestone markers */}
        {showMilestones && milestonePositions.map((milestone) => {
          if (progress >= milestone) return null;
          const angle = (milestone / 100) * 360 - 90;
          const radian = (angle * Math.PI) / 180;
          const x = size / 2 + radius * Math.cos(radian);
          const y = size / 2 + radius * Math.sin(radian);
          return (
            <circle
              key={milestone}
              cx={x}
              cy={y}
              r={3}
              fill="currentColor"
              className="text-gray-300 dark:text-gray-600"
            />
          );
        })}
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className={`text-lg sm:text-xl font-extrabold ${textColorClasses[color as keyof typeof textColorClasses]}`}>
            {Math.round(progress)}%
          </div>
        </div>
      </div>
    </div>
  );
};

// Achievement Badge Component
const AchievementBadge: React.FC<{ type: 'orders' | 'sales'; achieved: boolean }> = ({ type, achieved }) => {
  if (!achieved) return null;
  
  return (
    <div className="absolute -top-2 -right-2 z-10 animate-bounce">
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-2 shadow-lg">
        <Trophy className="h-5 w-5 text-white" />
      </div>
    </div>
  );
};

// Celebration Animation Component
const CelebrationAnimation: React.FC<{ show: boolean; type: 'orders' | 'sales' | null }> = ({ show, type }) => {
  if (!show || !type) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="bg-black/50 backdrop-blur-sm absolute inset-0"></div>
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl max-w-md mx-4 text-center animate-scale-in">
        <div className="mb-4 flex justify-center">
          <div className="relative">
            <Trophy className="h-20 w-20 text-yellow-500 animate-bounce" />
            <Sparkles className="h-12 w-12 text-orange-500 absolute -top-2 -right-2 animate-pulse" />
          </div>
        </div>
        <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">
          🎉 Goal Achieved! 🎉
        </h3>
        <p className="text-lg font-semibold text-primary-600 dark:text-primary-400 mb-4">
          {type === 'orders' ? 'Orders' : 'Sales'} Goal Completed!
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Congratulations on reaching your target!
        </p>
      </div>
    </div>
  );
};

// Loading Skeleton Components
const StatCardSkeleton: React.FC = () => (
  <Card>
    <CardContent className="px-4 py-3 md:px-4 md:py-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse"></div>
          <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-1.5 animate-pulse"></div>
          <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
      </div>
    </CardContent>
  </Card>
);

const TableSkeleton: React.FC = () => (
  <Card>
    <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4 md:px-6">
      <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
    </CardHeader>
    <CardContent className="p-0">
      <div className="overflow-x-auto">
        <div className="w-full">
          <div className="h-12 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"></div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 border-b border-gray-100 dark:border-gray-700/50 flex items-center px-4">
              <div className="flex-1 grid grid-cols-7 gap-4">
                {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                  <div key={j} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
);

const StatCard: React.FC<{
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
  onClick?: () => void;
  tooltip?: string;
}> = ({ title, value, change, changeType, icon: Icon, color = 'primary', onClick, tooltip }) => {
  const iconBgClasses = {
    primary: 'bg-primary-500 dark:bg-primary-600',
    green: 'bg-green-500 dark:bg-green-600',
    blue: 'bg-blue-500 dark:bg-blue-600',
    orange: 'bg-orange-500 dark:bg-orange-600'
  };

  const cardContent = (
    <Card className="hover:shadow-md transition-shadow">
      <div 
        className={onClick ? 'cursor-pointer' : ''}
        onClick={onClick}
      >
        <CardContent className="px-5 py-4 md:px-6 md:py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 leading-tight uppercase tracking-wide">{title}</p>
                {tooltip && (
                  <DashboardTooltip text={tooltip}>
                    <Info className="h-3 w-3 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  </DashboardTooltip>
                )}
              </div>
              <p className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white leading-none tracking-tight">{value}</p>
            {change !== undefined && (
                <div className="flex items-center gap-1.5 mt-2">
                {changeType === 'increase' ? (
                    <TrendingUp className="h-4 w-4 text-green-500 dark:text-green-400" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 dark:text-red-400" />
                  )}
                  <span className={`text-xs font-bold ${
                    changeType === 'increase' 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {Math.abs(change).toFixed(1)}%
                </span>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">vs last month</span>
              </div>
            )}
          </div>
            <div className={`p-3 rounded-xl ${iconBgClasses[color as keyof typeof iconBgClasses]} flex-shrink-0 shadow-md`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
      </div>
    </Card>
  );

  return cardContent;
};

// Format date with relative time
const formatDateWithRelative = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInHours < 1) {
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else if (diffInDays === 1) {
    return 'Yesterday';
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
};

// Format delivery date
const formatDeliveryDate = (dateString: string, timeString?: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const isToday = date.toDateString() === today.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();
  
  let prefix = '';
  if (isToday) prefix = 'Today';
  else if (isTomorrow) prefix = 'Tomorrow';
  
  const timeDisplay = timeString ? ` • ${timeString}` : '';
  return prefix ? `${prefix}, ${dateStr}${timeDisplay}` : `${dateStr}${timeDisplay}`;
};

const getStatusBadge = (status: string) => {
  const statusConfig = {
    pending: { 
      bg: 'bg-yellow-100 dark:bg-yellow-900/30', 
      text: 'text-yellow-800 dark:text-yellow-300',
      icon: Clock,
      iconSize: 'h-3 w-3'
    },
    confirmed: { 
      bg: 'bg-blue-100 dark:bg-blue-900/30', 
      text: 'text-blue-800 dark:text-blue-300',
      icon: CheckCircle,
      iconSize: 'h-3 w-3'
    },
    preparing: { 
      bg: 'bg-orange-100 dark:bg-orange-900/30', 
      text: 'text-orange-800 dark:text-orange-300',
      icon: Package,
      iconSize: 'h-3 w-3'
    },
    ready: { 
      bg: 'bg-green-100 dark:bg-green-900/30', 
      text: 'text-green-800 dark:text-green-300',
      icon: CheckCircle,
      iconSize: 'h-3 w-3'
    },
    delivered: { 
      bg: 'bg-gray-100 dark:bg-gray-700', 
      text: 'text-gray-800 dark:text-gray-200',
      icon: CheckCircle,
      iconSize: 'h-3 w-3'
    },
    cancelled: { 
      bg: 'bg-red-100 dark:bg-red-900/30', 
      text: 'text-red-800 dark:text-red-300',
      icon: XCircle,
      iconSize: 'h-3 w-3'
    }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || {
    bg: 'bg-gray-100 dark:bg-gray-700',
    text: 'text-gray-800 dark:text-gray-200',
    icon: AlertCircle,
    iconSize: 'h-3 w-3'
  };

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <Icon className={config.iconSize} />
      <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
    </span>
  );
};

const getPaymentStatusBadge = (status: string) => {
  const paymentConfig = {
    paid: { 
      bg: 'bg-green-100 dark:bg-green-900/30', 
      text: 'text-green-800 dark:text-green-300',
      icon: CheckCircle
    },
    pending: { 
      bg: 'bg-yellow-100 dark:bg-yellow-900/30', 
      text: 'text-yellow-800 dark:text-yellow-300',
      icon: Clock
    },
    failed: { 
      bg: 'bg-red-100 dark:bg-red-900/30', 
      text: 'text-red-800 dark:text-red-300',
      icon: XCircle
    },
    refunded: { 
      bg: 'bg-gray-100 dark:bg-gray-700', 
      text: 'text-gray-800 dark:text-gray-200',
      icon: AlertCircle
    }
  };

  const config = paymentConfig[status as keyof typeof paymentConfig] || {
    bg: 'bg-gray-100 dark:bg-gray-700',
    text: 'text-gray-800 dark:text-gray-200',
    icon: AlertCircle
  };

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <Icon className="h-3 w-3" />
      <span className="capitalize">{status}</span>
    </span>
  );
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showWarning, showInfo, showConfirm } = useToastContext();
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalSales: 0,
    totalCustomers: 0,
    totalProducts: 0,
    ordersToday: 0,
    salesToday: 0,
    newCustomersToday: 0,
    lowStockProducts: 0
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [orderStatusBreakdown, setOrderStatusBreakdown] = useState<{
    pending: number;
    confirmed: number;
    preparing: number;
    ready: number;
    delivered: number;
    cancelled: number;
  }>({
    pending: 0,
    confirmed: 0,
    preparing: 0,
    ready: 0,
    delivered: 0,
    cancelled: 0
  });
  const [averageOrderValueFromAPI, setAverageOrderValueFromAPI] = useState<number | null>(null);
  const [previousMonthStats, setPreviousMonthStats] = useState<{
    orders: number;
    sales: number;
    customers: number;
    products: number;
  }>({
    orders: 0,
    sales: 0,
    customers: 0,
    products: 0
  });
  
  // Date range filtering
  const [dateRangeStart, setDateRangeStart] = useState<string | null>(null);
  const [dateRangeEnd, setDateRangeEnd] = useState<string | null>(null);
  
  // Chart data
  const [chartData, setChartData] = useState<Array<{
    date: string;
    orders: number;
    sales: number;
  }>>([]);
  const [chartLoading, setChartLoading] = useState(false);
  
  // Goal tracking with time periods and hierarchy
  interface GoalData {
    value: number;
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    startDate: string;
    endDate: string;
    createdAt: string;
    level?: 'company' | 'department' | 'team' | 'individual';
    parentId?: string;
    id?: string;
    name?: string;
    description?: string;
    notifications?: {
      enabled: boolean;
      milestones: number[]; // e.g., [25, 50, 75, 100]
      deadlineWarning: boolean;
      dailyUpdates: boolean;
    };
    history?: Array<{
      date: string;
      progress: number;
      value: number;
    }>;
  }
  interface Goals {
    orders: GoalData | null;
    sales: GoalData | null;
  }
  
  // Goal templates and presets
  interface GoalTemplate {
    id: string;
    name: string;
    description: string;
    type: 'orders' | 'sales';
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    suggestedValue: (currentStats: DashboardStats) => number;
    category: 'growth' | 'maintenance' | 'aggressive' | 'conservative';
  }
  const [goals, setGoals] = useState<Goals>(() => {
    const saved = localStorage.getItem('dashboard_goals');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate old format to new format
      if (parsed.orders && typeof parsed.orders === 'number') {
        return {
          orders: {
            value: parsed.orders,
            period: 'monthly',
            startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
            endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
            createdAt: new Date().toISOString()
          },
          sales: parsed.sales && typeof parsed.sales === 'number' ? {
            value: parsed.sales,
            period: 'monthly',
            startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
            endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
            createdAt: new Date().toISOString()
          } : null
        };
      }
      return parsed;
    }
    return { orders: null, sales: null };
  });
  const [editingGoal, setEditingGoal] = useState<'orders' | 'sales' | null>(null);
  const [goalInput, setGoalInput] = useState<string>('');
  const [goalPeriod, setGoalPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly'>('monthly');
  const [showCelebration, setShowCelebration] = useState<{ type: 'orders' | 'sales' | null; achieved: boolean }>({ type: null, achieved: false });
  const [expandedGoal, setExpandedGoal] = useState<'orders' | 'sales' | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [goalLevel, setGoalLevel] = useState<'company' | 'department' | 'team' | 'individual'>('company');
  const [goalNotifications, setGoalNotifications] = useState({
    enabled: true,
    milestones: [25, 50, 75, 100],
    deadlineWarning: true,
    dailyUpdates: false
  });
  const [goalAnalytics, setGoalAnalytics] = useState<{
    orders: Array<{ date: string; progress: number; value: number }>;
    sales: Array<{ date: string; progress: number; value: number }>;
  }>({ orders: [], sales: [] });
  
  // Phase 3: Gamification
  interface LeaderboardEntry {
    id: string;
    name: string;
    avatar?: string;
    score: number;
    rank: number;
    achievements: string[];
    progress: number;
  }
  
  interface Challenge {
    id: string;
    name: string;
    description: string;
    type: 'orders' | 'sales' | 'combined';
    target: number;
    startDate: string;
    endDate: string;
    participants: number;
    prize?: string;
    status: 'upcoming' | 'active' | 'completed';
  }
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showChallenges, setShowChallenges] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [showPredictiveAnalytics, setShowPredictiveAnalytics] = useState(false);
  const [showOKR, setShowOKR] = useState(false);
  
  // Phase 3: Social Collaboration
  interface GoalComment {
    id: string;
    goalId: string;
    author: string;
    avatar?: string;
    message: string;
    timestamp: string;
    likes: number;
  }
  
  interface GoalUpdate {
    id: string;
    goalId: string;
    author: string;
    avatar?: string;
    message: string;
    timestamp: string;
    type: 'progress' | 'milestone' | 'comment';
  }
  
  const [goalComments, setGoalComments] = useState<Record<string, GoalComment[]>>({});
  const [goalUpdates] = useState<Record<string, GoalUpdate[]>>({});
  const [showComments, setShowComments] = useState<{ goalId: string; type: 'orders' | 'sales' } | null>(null);
  const [newComment, setNewComment] = useState('');
  
  // Phase 3: Predictive Analytics
  interface WhatIfScenario {
    id: string;
    name: string;
    description: string;
    assumptions: {
      dailyGrowth?: number;
      weeklyGrowth?: number;
      monthlyGrowth?: number;
    };
    projectedValue: number;
    projectedDate: string;
    confidence: number;
  }
  
  const [whatIfScenarios, setWhatIfScenarios] = useState<WhatIfScenario[]>([]);
  // const [showWhatIf, setShowWhatIf] = useState(false); // Unused
  const [selectedScenario, setSelectedScenario] = useState<WhatIfScenario | null>(null);
  
  // Phase 3: External Integrations
  // interface Integration {
  //   id: string;
  //   name: string;
  //   type: 'api' | 'webhook' | 'export';
  //   status: 'active' | 'inactive';
  //   config: Record<string, any>;
  // }
  
  // const [integrations, setIntegrations] = useState<Integration[]>([]); // Unused
  const [showIntegrations, setShowIntegrations] = useState(false);
  
  // Phase 3: OKR Framework
  interface KeyResult {
    id: string;
    title: string;
    target: number;
    current: number;
    unit: string;
    progress: number;
  }
  
  interface Objective {
    id: string;
    title: string;
    description: string;
    keyResults: KeyResult[];
    progress: number;
    status: 'on-track' | 'at-risk' | 'behind';
  }
  
  const [okrs, setOkrs] = useState<Objective[]>([]);
  // const [showOKRs, setShowOKRs] = useState(false); // Unused
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [editingOKR, setEditingOKR] = useState<Objective | null>(null);

  // Calculate percentage change
  const calculateChange = (current: number, previous: number): { value: number; type: 'increase' | 'decrease' } => {
    if (previous === 0) return { value: current > 0 ? 100 : 0, type: current > 0 ? 'increase' : 'decrease' };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change),
      type: change >= 0 ? 'increase' : 'decrease'
    };
  };

  // Fetch chart data
  const fetchChartData = async () => {
    try {
      setChartLoading(true);
      const days = dateRangeStart && dateRangeEnd 
        ? Math.ceil((new Date(dateRangeEnd).getTime() - new Date(dateRangeStart).getTime()) / (1000 * 60 * 60 * 24))
        : 30;
      
      const endDate = dateRangeEnd ? new Date(dateRangeEnd) : new Date();
      const startDate = dateRangeStart ? new Date(dateRangeStart) : new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // Fetch orders for the date range
      const ordersResponse = await orderService.getOrders({
        limit: 1000,
        page: 1,
        date_from: startDate.toISOString().split('T')[0],
        date_to: endDate.toISOString().split('T')[0]
      });
      
      // Group orders by date
      const ordersByDate: { [key: string]: { orders: number; sales: number } } = {};
      
      ordersResponse.orders.forEach((order: Order) => {
        const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
        if (!ordersByDate[orderDate]) {
          ordersByDate[orderDate] = { orders: 0, sales: 0 };
        }
        ordersByDate[orderDate].orders += 1;
        ordersByDate[orderDate].sales += parseFloat(order.total.toString());
      });
      
      // Generate chart data array
      const chartDataArray: Array<{ date: string; orders: number; sales: number }> = [];
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        chartDataArray.push({
          date: dateStr,
          orders: ordersByDate[dateStr]?.orders || 0,
          sales: ordersByDate[dateStr]?.sales || 0
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      setChartData(chartDataArray);
    } catch (err) {
      console.error('Error fetching chart data:', err);
    } finally {
      setChartLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate period based on date range
      let period = 36500; // All-time by default
      if (dateRangeStart && dateRangeEnd) {
        const days = Math.ceil((new Date(dateRangeEnd).getTime() - new Date(dateRangeStart).getTime()) / (1000 * 60 * 60 * 24));
        period = days;
      }

      // Fetch dashboard stats (will need to update service to support date range)
      const dashboardStats = await dashboardService.getDashboardStats();
      setStats(dashboardStats);

      // Fetch order stats for status breakdown and average order value
      try {
        const periodForComparison = dateRangeStart && dateRangeEnd ? period : 30;
        const [currentMonthStats, previousMonthStatsData, allTimeStats] = await Promise.all([
          orderService.getOrderStats(periodForComparison),
          orderService.getOrderStats(periodForComparison * 2),
          orderService.getOrderStats(36500) // All-time for status breakdown
        ]);

        // Set order status breakdown
        setOrderStatusBreakdown({
          pending: allTimeStats.pending || 0,
          confirmed: allTimeStats.confirmed || 0,
          preparing: allTimeStats.preparing || 0,
          ready: allTimeStats.ready || 0,
          delivered: allTimeStats.delivered || 0,
          cancelled: allTimeStats.cancelled || 0
        });

        // Calculate previous month stats
        const previousMonthOrders = (previousMonthStatsData.total || 0) - (currentMonthStats.total || 0);
        const previousMonthSales = (previousMonthStatsData.totalRevenue || 0) - (currentMonthStats.totalRevenue || 0);

        setPreviousMonthStats({
          orders: Math.max(0, previousMonthOrders),
          sales: Math.max(0, previousMonthSales),
          customers: 0, // Would need API support
          products: 0 // Would need API support
        });
      } catch (err) {
        console.warn('Could not fetch order stats:', err);
      }

      // Fetch recent orders with date filter
      const ordersResponse = await orderService.getOrders({ 
        limit: 5, 
        page: 1,
        date_from: dateRangeStart || undefined,
        date_to: dateRangeEnd || undefined
      });
      setRecentOrders(ordersResponse.orders || []);
      
      // Fetch chart data
      await fetchChartData();
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
    fetchDashboardData();
      }, refreshInterval * 1000);
    } else {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, refreshInterval]);

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRangeStart, dateRangeEnd]);
  
  // Save goals to localStorage
  useEffect(() => {
    localStorage.setItem('dashboard_goals', JSON.stringify(goals));
  }, [goals]);
  
  // Export functionality
  const handleExport = async () => {
    try {
      const ordersResponse = await orderService.getOrders({
        limit: 10000,
        page: 1,
        date_from: dateRangeStart || undefined,
        date_to: dateRangeEnd || undefined
      });
      
      const orders = ordersResponse.orders || [];
      
      // Create CSV content
      const headers = ['Order #', 'Customer', 'Phone', 'Items', 'Total', 'Status', 'Payment', 'Delivery Date', 'Ordered Date'];
      const rows = orders.map((order: Order) => [
        (order as any).order_number || (order as any).orderId || order.id || 'N/A',
        order.customerName || 'N/A',
        order.customerPhone || 'N/A',
        order.items?.length || 0,
        formatCurrency(order.total),
        order.status,
        order.paymentStatus,
        order.deliveryDate || 'N/A',
        new Date(order.createdAt).toLocaleDateString()
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `dashboard-export-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error exporting data:', err);
      setError('Failed to export data. Please try again.');
    }
  };
  
  // Calculate period dates
  const getPeriodDates = (period: 'daily' | 'weekly' | 'monthly' | 'quarterly') => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case 'daily':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'weekly':
        const dayOfWeek = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'quarterly':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };

  // Smart goal suggestions based on historical data
  const getSmartGoalSuggestion = (type: 'orders' | 'sales', period: 'daily' | 'weekly' | 'monthly' | 'quarterly'): number => {
    const current = type === 'orders' ? stats.totalOrders : stats.totalSales;
    const previous = type === 'orders' ? previousMonthStats.orders : previousMonthStats.sales;
    
    // Calculate growth rate
    let growthRate = 0.15; // Default 15% growth
    if (previous > 0) {
      growthRate = ((current - previous) / previous) * 0.3; // 30% of current growth rate
      growthRate = Math.max(0.1, Math.min(0.5, growthRate)); // Clamp between 10% and 50%
    }

    // Adjust based on period
    const periodMultipliers = {
      daily: 1 / 30,
      weekly: 1 / 4.33,
      monthly: 1,
      quarterly: 3
    };

    const baseValue = current * periodMultipliers[period];
    const suggested = baseValue * (1 + growthRate);
    
    return Math.ceil(suggested);
  };

  // Get current period progress
  const getCurrentPeriodProgress = async (type: 'orders' | 'sales', goal: GoalData): Promise<number> => {
    try {
      const ordersResponse = await orderService.getOrders({
        limit: 10000,
        page: 1,
        date_from: goal.startDate,
        date_to: goal.endDate
      });

      let total = 0;
      ordersResponse.orders.forEach((order: Order) => {
        if (type === 'orders') {
          total += 1;
        } else {
          total += parseFloat(order.total.toString());
        }
      });

      return Math.min((total / goal.value) * 100, 100);
    } catch (err) {
      console.error('Error calculating period progress:', err);
      return 0;
    }
  };

  // Forecast completion prediction
  const getForecastCompletion = (type: 'orders' | 'sales', goal: GoalData, currentProgress: number): { percentage: number; daysRemaining: number; onTrack: boolean } => {
    if (!goal) return { percentage: 0, daysRemaining: 0, onTrack: false };

    const now = new Date();
    const endDate = new Date(goal.endDate);
    const startDate = new Date(goal.startDate);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, totalDays - daysElapsed);

    if (daysElapsed <= 0) {
      return { percentage: 0, daysRemaining, onTrack: false };
    }

    const expectedProgress = (daysElapsed / totalDays) * 100;
    const currentRate = currentProgress / daysElapsed;
    const forecastPercentage = Math.min(currentRate * totalDays, 100);
    const onTrack = currentProgress >= expectedProgress * 0.9; // 90% of expected is considered on track

    return {
      percentage: forecastPercentage,
      daysRemaining,
      onTrack
    };
  };

  // Goal management
  const handleSetGoal = (type: 'orders' | 'sales') => {
    setEditingGoal(type);
    const existingGoal = goals[type];
    setGoalInput(existingGoal?.value?.toString() || '');
    setGoalPeriod(existingGoal?.period || 'monthly');
  };
  
  const handleSaveGoal = (type: 'orders' | 'sales') => {
    const value = parseFloat(goalInput);
    if (!isNaN(value) && value > 0) {
      const { startDate, endDate } = getPeriodDates(goalPeriod);
      const newGoal: GoalData = {
        value,
        period: goalPeriod,
        startDate,
        endDate,
        createdAt: new Date().toISOString(),
        level: goalLevel,
        id: `${type}-${Date.now()}`,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Goal`,
        notifications: goalNotifications,
        history: []
      };
      setGoals(prev => ({ ...prev, [type]: newGoal }));
      setEditingGoal(null);
      setGoalInput('');
      setGoalPeriod('monthly');
      showSuccess('Goal Set', `${type.charAt(0).toUpperCase() + type.slice(1)} goal has been set successfully!`);
    }
  };
  
  // Goal templates and presets
  const goalTemplates: GoalTemplate[] = [
    {
      id: 'conservative-growth',
      name: 'Conservative Growth',
      description: 'Steady 10% growth target',
      type: 'orders',
      period: 'monthly',
      category: 'conservative',
      suggestedValue: (currentStats) => Math.ceil(currentStats.totalOrders * 1.1)
    },
    {
      id: 'moderate-growth',
      name: 'Moderate Growth',
      description: 'Balanced 25% growth target',
      type: 'orders',
      period: 'monthly',
      category: 'growth',
      suggestedValue: (currentStats) => Math.ceil(currentStats.totalOrders * 1.25)
    },
    {
      id: 'aggressive-growth',
      name: 'Aggressive Growth',
      description: 'Ambitious 50% growth target',
      type: 'orders',
      period: 'monthly',
      category: 'aggressive',
      suggestedValue: (currentStats) => Math.ceil(currentStats.totalOrders * 1.5)
    },
    {
      id: 'sales-conservative',
      name: 'Conservative Sales',
      description: 'Steady 10% sales growth',
      type: 'sales',
      period: 'monthly',
      category: 'conservative',
      suggestedValue: (currentStats) => Math.ceil(currentStats.totalSales * 1.1)
    },
    {
      id: 'sales-moderate',
      name: 'Moderate Sales',
      description: 'Balanced 25% sales growth',
      type: 'sales',
      period: 'monthly',
      category: 'growth',
      suggestedValue: (currentStats) => Math.ceil(currentStats.totalSales * 1.25)
    },
    {
      id: 'sales-aggressive',
      name: 'Aggressive Sales',
      description: 'Ambitious 50% sales growth',
      type: 'sales',
      period: 'monthly',
      category: 'aggressive',
      suggestedValue: (currentStats) => Math.ceil(currentStats.totalSales * 1.5)
    },
    {
      id: 'daily-orders',
      name: 'Daily Orders Boost',
      description: 'Quick daily order target',
      type: 'orders',
      period: 'daily',
      category: 'maintenance',
      suggestedValue: (currentStats) => Math.ceil(currentStats.ordersToday * 1.2)
    },
    {
      id: 'weekly-sales',
      name: 'Weekly Sales Push',
      description: 'Weekly sales target',
      type: 'sales',
      period: 'weekly',
      category: 'growth',
      suggestedValue: (currentStats) => Math.ceil((currentStats.salesToday * 7) * 1.15)
    }
  ];
  
  const handleApplyTemplate = (template: GoalTemplate) => {
    const suggestedValue = template.suggestedValue(stats);
    setGoalInput(suggestedValue.toString());
    setGoalPeriod(template.period);
    setEditingGoal(template.type);
    setShowTemplates(false);
    showInfo('Template Applied', `Applied "${template.name}" template with suggested value.`);
  };
  
  const handleClearGoal = (type: 'orders' | 'sales') => {
    const goalType = type === 'orders' ? 'Orders' : 'Sales';
    showConfirm(
      `Remove ${goalType} Goal?`,
      `Are you sure you want to remove your ${goalType.toLowerCase()} goal? This action cannot be undone and all progress data will be lost.`,
      () => {
        setGoals(prev => ({ ...prev, [type]: null }));
        showSuccess('Goal Removed', `${goalType} goal has been successfully removed.`);
      },
      () => {
        // Cancel - do nothing
      },
      'Remove',
      'Cancel'
    );
  };
  
  const handleEditGoal = (type: 'orders' | 'sales') => {
    const existingGoal = goals[type];
    if (existingGoal) {
      setGoalInput(existingGoal.value.toString());
      setGoalPeriod(existingGoal.period);
      setGoalLevel(existingGoal.level || 'company');
      setGoalNotifications(existingGoal.notifications || {
        enabled: true,
        milestones: [25, 50, 75, 100],
        deadlineWarning: true,
        dailyUpdates: false
      });
      setEditingGoal(type);
    }
  };
  
  const handleResetGoal = (type: 'orders' | 'sales') => {
    const goalType = type === 'orders' ? 'Orders' : 'Sales';
    showConfirm(
      `Reset ${goalType} Goal?`,
      `This will reset the progress tracking for your ${goalType.toLowerCase()} goal but keep the goal target. The goal period will restart from today. Continue?`,
      () => {
        const existingGoal = goals[type];
        if (existingGoal) {
          const { startDate, endDate } = getPeriodDates(existingGoal.period);
          const updatedGoal: GoalData = {
            ...existingGoal,
            startDate,
            endDate,
            createdAt: new Date().toISOString()
          };
          setGoals(prev => ({ ...prev, [type]: updatedGoal }));
          showSuccess('Goal Reset', `${goalType} goal has been reset. Progress tracking restarted.`);
        }
      },
      () => {
        // Cancel
      },
      'Reset',
      'Cancel'
    );
  };
  
  // const getGoalProgress = (type: 'orders' | 'sales'): number => { // Unused
  //   if (!goals[type]) return 0;
  //   const current = type === 'orders' ? stats.totalOrders : stats.totalSales;
  //   return Math.min((current / goals[type]!.value) * 100, 100);
  // };

  // Get period progress (for time-based goals)
  const [periodProgress, setPeriodProgress] = useState<{ orders: number; sales: number }>({ orders: 0, sales: 0 });
  const [forecastData, setForecastData] = useState<{ orders: any; sales: any }>({ orders: null, sales: null });
  const [progressLoading, setProgressLoading] = useState(false);
  
  // Advanced notifications and alerts
  useEffect(() => {
    if (!goals.orders && !goals.sales) return;
    
    const checkMilestones = () => {
      [goals.orders, goals.sales].forEach((goal, index) => {
        if (!goal || !goal.notifications?.enabled) return;
        const type = index === 0 ? 'orders' : 'sales';
        const progress = index === 0 ? periodProgress.orders : periodProgress.sales;
        
        // Check milestone alerts
        goal.notifications?.milestones.forEach(milestone => {
          const milestoneKey = `${type}-${milestone}`;
          const lastNotified = localStorage.getItem(milestoneKey);
          if (progress >= milestone && (!lastNotified || Date.now() - parseInt(lastNotified) > 86400000)) {
            showSuccess(
              'Milestone Achieved! 🎉',
              `You've reached ${milestone}% of your ${type} goal!`,
              5000
            );
            localStorage.setItem(milestoneKey, Date.now().toString());
          }
        });
        
        // Check deadline warnings
        if (goal.notifications?.deadlineWarning) {
          const endDate = new Date(goal.endDate);
          const now = new Date();
          const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysRemaining <= 3 && daysRemaining > 0 && progress < 100) {
            showWarning(
              'Goal Deadline Approaching',
              `Your ${type} goal deadline is in ${daysRemaining} day(s). Current progress: ${progress.toFixed(1)}%`,
              8000
            );
          }
        }
        
        // Check if goal is off-track
        if (progress < 50 && forecastData[type] && !forecastData[type].onTrack) {
          const daysRemaining = forecastData[type].daysRemaining;
          if (daysRemaining > 0 && daysRemaining <= 7) {
            showWarning(
              'Goal Off Track',
              `Your ${type} goal may not be achieved at current pace. Consider adjusting your strategy.`,
              8000
            );
          }
        }
      });
    };
    
    const interval = setInterval(checkMilestones, 60000); // Check every minute
    checkMilestones(); // Initial check
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodProgress, forecastData, goals]);
  
  // Track goal analytics (daily progress history)
  useEffect(() => {
    if (!goals.orders && !goals.sales) return;
    
    const updateAnalytics = () => {
      const today = new Date().toISOString().split('T')[0];
      
      if (goals.orders) {
        setGoalAnalytics(prev => {
          const existing = prev.orders.find(entry => entry.date === today);
          if (existing) return prev;
          return {
            ...prev,
            orders: [...prev.orders, {
              date: today,
              progress: periodProgress.orders,
              value: stats.totalOrders
            }]
          };
        });
      }
      
      if (goals.sales) {
        setGoalAnalytics(prev => {
          const existing = prev.sales.find(entry => entry.date === today);
          if (existing) return prev;
          return {
            ...prev,
            sales: [...prev.sales, {
              date: today,
              progress: periodProgress.sales,
              value: stats.totalSales
            }]
          };
        });
      }
    };
    
    updateAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodProgress, stats]);
  
  // Phase 3: Gamification Functions
  useEffect(() => {
    // Initialize mock leaderboard data
    const mockLeaderboard: LeaderboardEntry[] = [
      { id: '1', name: 'You', score: userPoints, rank: 1, achievements: ['First Goal', 'Milestone Master'], progress: periodProgress.orders },
      { id: '2', name: 'Team Alpha', score: Math.floor(userPoints * 0.9), rank: 2, achievements: ['Goal Setter'], progress: 85 },
      { id: '3', name: 'Team Beta', score: Math.floor(userPoints * 0.75), rank: 3, achievements: [], progress: 72 },
      { id: '4', name: 'Team Gamma', score: Math.floor(userPoints * 0.6), rank: 4, achievements: [], progress: 58 },
      { id: '5', name: 'Team Delta', score: Math.floor(userPoints * 0.45), rank: 5, achievements: [], progress: 45 }
    ].sort((a, b) => b.score - a.score).map((entry, idx) => ({ ...entry, rank: idx + 1 }));
    
    setLeaderboard(mockLeaderboard);
    
    // Calculate user points based on goal achievements
    let points = 0;
    if (goals.orders && periodProgress.orders >= 100) points += 100;
    if (goals.sales && periodProgress.sales >= 100) points += 100;
    points += Math.floor(periodProgress.orders / 10) * 5;
    points += Math.floor(periodProgress.sales / 10) * 5;
    setUserPoints(points);
    
    // Initialize mock challenges
    const mockChallenges: Challenge[] = [
      {
        id: '1',
        name: 'Monthly Sales Sprint',
        description: 'Reach 150% of monthly sales target',
        type: 'sales',
        target: stats.totalSales * 1.5,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
        participants: 12,
        prize: 'Team Lunch',
        status: 'active'
      },
      {
        id: '2',
        name: 'Orders Blitz',
        description: 'Complete 200 orders this week',
        type: 'orders',
        target: 200,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
        participants: 8,
        status: 'active'
      }
    ];
    setChallenges(mockChallenges);
  }, [userPoints, periodProgress, goals, stats]);
  
  // Phase 3: Predictive Analytics Functions
  const generateWhatIfScenarios = (type: 'orders' | 'sales') => {
    const current = type === 'orders' ? stats.totalOrders : stats.totalSales;
    // const currentProgress = type === 'orders' ? periodProgress.orders : periodProgress.sales; // Unused
    const goal = goals[type];
    if (!goal) return [];
    
    const scenarios: WhatIfScenario[] = [
      {
        id: 'conservative',
        name: 'Conservative Growth',
        description: '5% daily growth rate',
        assumptions: { dailyGrowth: 0.05 },
        projectedValue: current * Math.pow(1.05, 30),
        projectedDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
        confidence: 85
      },
      {
        id: 'moderate',
        name: 'Moderate Growth',
        description: '10% daily growth rate',
        assumptions: { dailyGrowth: 0.10 },
        projectedValue: current * Math.pow(1.10, 30),
        projectedDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
        confidence: 70
      },
      {
        id: 'aggressive',
        name: 'Aggressive Growth',
        description: '15% daily growth rate',
        assumptions: { dailyGrowth: 0.15 },
        projectedValue: current * Math.pow(1.15, 30),
        projectedDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
        confidence: 55
      }
    ];
    
    setWhatIfScenarios(scenarios);
  };
  
  // Phase 3: Social Collaboration Functions
  const handleAddComment = (goalId: string, type: 'orders' | 'sales') => {
    if (!newComment.trim()) return;
    
    const comment: GoalComment = {
      id: Date.now().toString(),
      goalId,
      author: 'You',
      message: newComment,
      timestamp: new Date().toISOString(),
      likes: 0
    };
    
    setGoalComments(prev => ({
      ...prev,
      [goalId]: [...(prev[goalId] || []), comment]
    }));
    
    setNewComment('');
    showSuccess('Comment Added', 'Your comment has been posted.');
  };
  
  const handleLikeComment = (goalId: string, commentId: string) => {
    setGoalComments(prev => ({
      ...prev,
      [goalId]: (prev[goalId] || []).map(comment =>
        comment.id === commentId ? { ...comment, likes: comment.likes + 1 } : comment
      )
    }));
  };
  
  // Phase 3: OKR Functions
  const handleCreateOKR = () => {
    const newOKR: Objective = {
      id: Date.now().toString(),
      title: 'New Objective',
      description: '',
      keyResults: [],
      progress: 0,
      status: 'on-track'
    };
    setOkrs(prev => [...prev, newOKR]);
    setEditingOKR(newOKR);
  };
  
  const calculateOKRProgress = (okr: Objective): number => {
    if (okr.keyResults.length === 0) return 0;
    const totalProgress = okr.keyResults.reduce((sum, kr) => sum + kr.progress, 0);
    return totalProgress / okr.keyResults.length;
  };

  useEffect(() => {
    const calculatePeriodProgress = async () => {
      if (!goals.orders && !goals.sales) {
        setPeriodProgress({ orders: 0, sales: 0 });
        setForecastData({ orders: null, sales: null });
        return;
      }

      setProgressLoading(true);
      try {
        if (goals.orders) {
          const progress = await getCurrentPeriodProgress('orders', goals.orders);
          setPeriodProgress(prev => ({ ...prev, orders: progress }));
          const forecast = getForecastCompletion('orders', goals.orders, progress);
          setForecastData(prev => ({ ...prev, orders: forecast }));
        }
        if (goals.sales) {
          const progress = await getCurrentPeriodProgress('sales', goals.sales);
          setPeriodProgress(prev => ({ ...prev, sales: progress }));
          const forecast = getForecastCompletion('sales', goals.sales, progress);
          setForecastData(prev => ({ ...prev, sales: forecast }));
        }
      } catch (err) {
        console.error('Error calculating period progress:', err);
      } finally {
        setProgressLoading(false);
      }
    };
    
    if (goals.orders || goals.sales) {
      calculatePeriodProgress();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goals, stats]);

  // Check for goal achievements
  useEffect(() => {
    if (goals.orders && periodProgress.orders >= 100 && !showCelebration.achieved && showCelebration.type !== 'orders') {
      setShowCelebration({ type: 'orders', achieved: true });
      setTimeout(() => setShowCelebration({ type: null, achieved: false }), 3000);
    }
    if (goals.sales && periodProgress.sales >= 100 && !showCelebration.achieved && showCelebration.type !== 'sales') {
      setShowCelebration({ type: 'sales', achieved: true });
      setTimeout(() => setShowCelebration({ type: null, achieved: false }), 3000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodProgress]);

  const orderColumns: TableColumn[] = [
    { 
      key: 'order_number', 
      label: 'Order #', 
      sortable: true, 
      align: 'center',
      render: (value, item) => (
        <span className="font-semibold text-gray-900 dark:text-white">
          {value || item.id || 'N/A'}
        </span>
      )
    },
    { 
      key: 'customerName', 
      label: 'Customer', 
      sortable: true, 
      align: 'left',
      render: (value, item) => (
        <div className="min-w-0">
          <div className="font-medium text-gray-900 dark:text-white truncate">{value || 'N/A'}</div>
          {item.customerPhone && (
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.customerPhone}</div>
          )}
        </div>
      )
    },
    {
      key: 'items',
      label: 'Items',
      align: 'center',
      render: (value) => (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {Array.isArray(value) ? value.length : 0}
        </span>
      )
    },
    { 
      key: 'total', 
      label: 'Total', 
      sortable: true, 
      align: 'right', 
      render: (value) => (
        <span className="font-semibold text-gray-900 dark:text-white">
          {formatCurrency(value)}
        </span>
      )
    },
    { 
      key: 'paymentStatus', 
      label: 'Payment',
      align: 'center',
      render: (value) => getPaymentStatusBadge(value || 'pending')
    },
    { 
      key: 'status', 
      label: 'Status', 
      align: 'center',
      render: (value) => getStatusBadge(value)
    },
    { 
      key: 'deliveryDate', 
      label: 'Delivery', 
      sortable: true, 
      align: 'center',
      render: (value, item) => (
        <div className="text-xs text-gray-600 dark:text-gray-400">
          {formatDeliveryDate(value || item.deliveryDate || '', item.deliveryTime)}
        </div>
      )
    },
    { 
      key: 'createdAt', 
      label: 'Ordered', 
      sortable: true,
      align: 'center',
      render: (value) => (
        <div className="text-xs text-gray-600 dark:text-gray-400">
          {formatDateWithRelative(value)}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'center',
      render: (_, item) => (
        <div className="flex items-center justify-center gap-2">
          <button 
            onClick={() => navigate(`/orders`, { state: { orderId: item.id } })}
            className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-primary-500 dark:hover:text-primary-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            title="View Order Details"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  // Calculate Average Order Value (use API value if available, otherwise calculate)
  useEffect(() => {
    const fetchAverageOrderValue = async () => {
      try {
        const orderStats = await orderService.getOrderStats(36500);
        if (orderStats.averageOrderValue && orderStats.averageOrderValue > 0) {
          setAverageOrderValueFromAPI(orderStats.averageOrderValue);
        }
      } catch (err) {
        console.warn('Could not fetch average order value:', err);
      }
    };
    if (!loading) {
      fetchAverageOrderValue();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const averageOrderValue = averageOrderValueFromAPI !== null 
    ? averageOrderValueFromAPI 
    : (stats.totalOrders > 0 ? stats.totalSales / stats.totalOrders : 0);

  // Calculate total orders for status breakdown percentage
  const totalStatusOrders = Object.values(orderStatusBreakdown).reduce((sum, count) => sum + count, 0);

  if (loading) {
    return (
      <div className="min-h-full w-full space-y-3 sm:space-y-4 md:space-y-5 p-3 sm:p-4 md:p-5 lg:p-6 pb-6 sm:pb-8">
        {/* Header Skeleton */}
        <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 min-w-0">
            <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
          <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>

        {/* Quick Actions Skeleton */}
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-9 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          ))}
        </div>

        {/* Stats Grid Skeleton */}
        <div>
          <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-3 animate-pulse"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
            {[1, 2, 3, 4].map((i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        </div>

        {/* Today's Activity Skeleton */}
        <div>
          <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-3 animate-pulse"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
            {[1, 2, 3, 4].map((i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        </div>

        {/* Table Skeleton */}
        <div>
          <div className="h-5 w-28 bg-gray-200 dark:bg-gray-700 rounded mb-3 animate-pulse"></div>
          <TableSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6 min-h-[60vh] sm:min-h-screen w-full">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 sm:p-4">
          <p className="text-xs sm:text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-2 text-xs sm:text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full w-full space-y-4 sm:space-y-5 md:space-y-6 p-4 sm:p-5 md:p-6 lg:p-8 pb-6 sm:pb-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 min-w-0 bg-gradient-to-r from-primary-50/50 to-orange-50/50 dark:from-primary-900/10 dark:to-orange-900/10 rounded-xl p-4 sm:p-5 border border-primary-100/50 dark:border-primary-800/30">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-primary-600 to-orange-600 bg-clip-text text-transparent dark:from-primary-400 dark:to-orange-400 leading-tight tracking-tight">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mt-2 leading-relaxed font-medium">Welcome back! Here's what's happening with your business today.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Range Picker */}
          <DateRangePicker
            startDate={dateRangeStart}
            endDate={dateRangeEnd}
            onChange={(start, end) => {
              setDateRangeStart(start);
              setDateRangeEnd(end);
            }}
            className="flex-shrink-0"
          />
          
          {/* Export Button */}
          <DashboardTooltip text="Export dashboard data to CSV">
            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm flex-shrink-0 min-h-[44px]"
            >
              <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </DashboardTooltip>
          
          {/* Auto-refresh Toggle */}
          <div className="flex items-center gap-2 px-2.5 sm:px-3 py-2 sm:py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg min-h-[44px]">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              title={autoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}
            >
              {autoRefresh ? (
                <Pause className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ) : (
                <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
              <span className="hidden sm:inline">{autoRefresh ? 'Auto' : 'Manual'}</span>
            </button>
            {autoRefresh && (
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                onClick={(e) => e.stopPropagation()}
                className="text-xs border-0 bg-transparent text-gray-600 dark:text-gray-400 focus:outline-none focus:ring-0 cursor-pointer font-semibold"
              >
                <option value={15}>15s</option>
                <option value={30}>30s</option>
                <option value={60}>1m</option>
                <option value={120}>2m</option>
              </select>
            )}
        </div>
        <button
          onClick={fetchDashboardData}
            className="flex items-center justify-center gap-2 px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm flex-shrink-0 min-h-[44px]"
            title="Refresh dashboard data"
        >
            <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Refresh</span>
        </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 md:gap-4">
        <DashboardTooltip text="Add a new product to the catalog">
          <button
            onClick={() => navigate('/products')}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm hover:shadow-md flex-shrink-0 min-h-[44px]"
          >
            <Plus className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="whitespace-nowrap">Add Product</span>
          </button>
        </DashboardTooltip>
        <DashboardTooltip text="View and manage all orders">
          <button
            onClick={() => navigate('/orders')}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm hover:shadow-md flex-shrink-0 min-h-[44px]"
          >
            <FileText className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="whitespace-nowrap">View Orders</span>
          </button>
        </DashboardTooltip>
        <DashboardTooltip text="Manage customer information and history">
          <button
            onClick={() => navigate('/customers')}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm hover:shadow-md flex-shrink-0 min-h-[44px]"
          >
            <Users className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="whitespace-nowrap">Customers</span>
          </button>
        </DashboardTooltip>
        <DashboardTooltip text="View analytics and reports">
          <button
            onClick={() => navigate('/products')}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm hover:shadow-md flex-shrink-0 min-h-[44px]"
          >
            <BarChart3 className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="whitespace-nowrap">Analytics</span>
        </button>
        </DashboardTooltip>
      </div>

      {/* Goal Tracking */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 sm:pt-5 md:pt-6">
        <div className="flex items-center justify-between mb-4 sm:mb-5 md:mb-6 flex-wrap gap-3">
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">Goal Tracking</h2>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Phase 3 Feature Buttons */}
            <div className="flex items-center gap-1 border-r border-gray-200 dark:border-gray-700 pr-2">
              <DashboardTooltip text="View leaderboard and challenges">
                <button
                  onClick={() => setShowLeaderboard(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  title="Gamification"
                >
                  <Trophy className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Leaderboard</span>
                </button>
              </DashboardTooltip>
              <DashboardTooltip text="Collaborate with team">
                <button
                  onClick={() => setShowCollaboration(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  title="Collaboration"
                >
                  <UsersIcon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Team</span>
                </button>
              </DashboardTooltip>
              <DashboardTooltip text="Predictive analytics and scenarios">
                <button
                  onClick={() => setShowPredictiveAnalytics(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  title="Predictive Analytics"
                >
                  <BarChart2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Predict</span>
                </button>
              </DashboardTooltip>
              <DashboardTooltip text="OKR framework">
                <button
                  onClick={() => setShowOKR(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  title="OKR Framework"
                >
                  <TargetIcon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">OKR</span>
                </button>
              </DashboardTooltip>
              <DashboardTooltip text="Integrations and exports">
                <button
                  onClick={() => setShowIntegrations(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  title="Integrations"
                >
                  <Link className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Integrate</span>
                </button>
              </DashboardTooltip>
            </div>
            
            {(!goals.orders || !goals.sales) && (
              <button
                onClick={() => setShowTemplates(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                title="Use a goal template"
              >
                <Layers className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Templates</span>
              </button>
            )}
            {(!goals.orders || !goals.sales) && (
              <button
                onClick={() => {
                  if (!goals.orders) handleSetGoal('orders');
                  else if (!goals.sales) handleSetGoal('sales');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-primary-500 dark:bg-primary-600 rounded-lg hover:bg-primary-600 dark:hover:bg-primary-700 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Set Goal</span>
              </button>
            )}
          </div>
        </div>
        
        {(goals.orders || goals.sales) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
            {goals.orders && (
              <Card className="hover:shadow-md transition-shadow relative">
                <AchievementBadge type="orders" achieved={periodProgress.orders >= 100} />
                <CardContent className="px-5 py-4 md:px-6 md:py-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Target className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Orders Goal</p>
                        <span className="text-[10px] font-medium text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/30 px-1.5 py-0.5 rounded">
                          {goals.orders.period.charAt(0).toUpperCase() + goals.orders.period.slice(1)}
                        </span>
                        {goals.orders.level && (
                          <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                            {goals.orders.level === 'company' && <Building2 className="h-3 w-3" />}
                            {goals.orders.level === 'department' && <Briefcase className="h-3 w-3" />}
                            {goals.orders.level === 'team' && <Users className="h-3 w-3" />}
                            {goals.orders.level === 'individual' && <User className="h-3 w-3" />}
                            {goals.orders.level.charAt(0).toUpperCase() + goals.orders.level.slice(1)}
                          </span>
                        )}
                      </div>
                      <p className="text-xl md:text-2xl font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight mb-1">
                        {progressLoading ? (
                          <span className="text-gray-400 dark:text-gray-500">Loading...</span>
                        ) : (
                          <>
                            {stats.totalOrders.toLocaleString()} / {goals.orders.value.toLocaleString()}
                          </>
                        )}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(goals.orders.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(goals.orders.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditGoal('orders')}
                        className="p-1.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20"
                        title="Edit goal"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setExpandedGoal(expandedGoal === 'orders' ? null : 'orders')}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        title={expandedGoal === 'orders' ? 'Collapse' : 'Expand details'}
                      >
                        {expandedGoal === 'orders' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      <div className="relative group">
                        <button
                          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="More options"
                        >
                          <Settings className="h-4 w-4" />
                        </button>
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                          <div className="py-1">
                            <button
                              onClick={() => handleResetGoal('orders')}
                              className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                              Reset Goal
                            </button>
                            <button
                              onClick={() => handleClearGoal('orders')}
                              className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                            >
                              <X className="h-3.5 w-3.5" />
                              Remove Goal
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Circular Progress */}
                  <div className="flex items-center justify-center my-4">
                    {progressLoading ? (
                      <div className="w-[100px] h-[100px] flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                      </div>
                    ) : (
                      <CircularProgress 
                        progress={periodProgress.orders} 
                        size={100}
                        color="primary"
                        showMilestones={true}
                      />
                    )}
                  </div>

                  {/* Forecast */}
                  {forecastData.orders && (
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className={`h-3.5 w-3.5 ${forecastData.orders.onTrack ? 'text-green-500' : 'text-orange-500'}`} />
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Forecast</p>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        At current pace: <span className="font-bold text-gray-900 dark:text-white">{forecastData.orders.percentage.toFixed(1)}%</span> by end of period
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-500 mt-1">
                        {forecastData.orders.daysRemaining} days remaining • {forecastData.orders.onTrack ? '✓ On track' : '⚠ Needs attention'}
                      </p>
                    </div>
                  )}

                  {/* Linear Progress Bar */}
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-4">
                    <div
                      className="bg-primary-500 dark:bg-primary-400 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(periodProgress.orders, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mt-2 text-center">
                    {periodProgress.orders.toFixed(1)}% complete
                  </p>
                  
                  {/* Expandable Details */}
                  {expandedGoal === 'orders' && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                      {/* Performance Analytics */}
                      {goalAnalytics.orders.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Activity className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Performance Analytics</p>
                          </div>
                          <div className="space-y-2">
                            {goalAnalytics.orders.slice(-7).map((entry, idx) => (
                              <div key={idx} className="flex items-center justify-between text-xs">
                                <span className="text-gray-600 dark:text-gray-400">
                                  {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                                <div className="flex items-center gap-3">
                                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                    <div
                                      className="bg-primary-500 dark:bg-primary-400 h-1.5 rounded-full transition-all"
                                      style={{ width: `${entry.progress}%` }}
                                    />
                                  </div>
                                  <span className="text-gray-900 dark:text-white font-medium w-12 text-right">
                                    {entry.progress.toFixed(0)}%
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Notification Settings */}
                      {goals.orders.notifications && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Bell className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Notifications</p>
                          </div>
                          <div className="space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Milestone Alerts</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                goals.orders.notifications.enabled 
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                              }`}>
                                {goals.orders.notifications.enabled ? 'Enabled' : 'Disabled'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Deadline Warnings</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                goals.orders.notifications.deadlineWarning 
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                              }`}>
                                {goals.orders.notifications.deadlineWarning ? 'On' : 'Off'}
                              </span>
                            </div>
                            <div className="text-[10px] text-gray-500 dark:text-gray-500 mt-2">
                              Milestones: {goals.orders.notifications.milestones.join('%, ')}%
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Goal Info */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Info className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Goal Details</p>
                        </div>
                        <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                          <div className="flex justify-between">
                            <span>Created:</span>
                            <span>{new Date(goals.orders.createdAt).toLocaleDateString()}</span>
                          </div>
                          {goals.orders.name && (
                            <div className="flex justify-between">
                              <span>Name:</span>
                              <span className="font-medium">{goals.orders.name}</span>
                            </div>
                          )}
                          {goals.orders.description && (
                            <div>
                              <span>Description:</span>
                              <p className="mt-1 text-gray-500 dark:text-gray-500">{goals.orders.description}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Quick Actions */}
                      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Quick Actions</p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleEditGoal('orders')}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleResetGoal('orders')}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Reset
                          </button>
                          <button
                            onClick={() => handleClearGoal('orders')}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            {goals.sales && (
              <Card className="hover:shadow-md transition-shadow relative">
                <AchievementBadge type="sales" achieved={periodProgress.sales >= 100} />
                <CardContent className="px-5 py-4 md:px-6 md:py-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Target className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Sales Goal</p>
                        <span className="text-[10px] font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded">
                          {goals.sales.period.charAt(0).toUpperCase() + goals.sales.period.slice(1)}
                        </span>
                        {goals.sales.level && (
                          <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                            {goals.sales.level === 'company' && <Building2 className="h-3 w-3" />}
                            {goals.sales.level === 'department' && <Briefcase className="h-3 w-3" />}
                            {goals.sales.level === 'team' && <Users className="h-3 w-3" />}
                            {goals.sales.level === 'individual' && <User className="h-3 w-3" />}
                            {goals.sales.level.charAt(0).toUpperCase() + goals.sales.level.slice(1)}
                          </span>
                        )}
                      </div>
                      <p className="text-xl md:text-2xl font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight mb-1">
                        {progressLoading ? (
                          <span className="text-gray-400 dark:text-gray-500">Loading...</span>
                        ) : (
                          <>
                            {formatCurrency(stats.totalSales)} / {formatCurrency(goals.sales.value)}
                          </>
                        )}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(goals.sales.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(goals.sales.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditGoal('sales')}
                        className="p-1.5 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
                        title="Edit goal"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setExpandedGoal(expandedGoal === 'sales' ? null : 'sales')}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        title={expandedGoal === 'sales' ? 'Collapse' : 'Expand details'}
                      >
                        {expandedGoal === 'sales' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      <div className="relative group">
                        <button
                          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="More options"
                        >
                          <Settings className="h-4 w-4" />
                        </button>
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                          <div className="py-1">
                            <button
                              onClick={() => handleResetGoal('sales')}
                              className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                              Reset Goal
                            </button>
                            <button
                              onClick={() => handleClearGoal('sales')}
                              className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                            >
                              <X className="h-3.5 w-3.5" />
                              Remove Goal
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Circular Progress */}
                  <div className="flex items-center justify-center my-4">
                    {progressLoading ? (
                      <div className="w-[100px] h-[100px] flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                      </div>
                    ) : (
                      <CircularProgress 
                        progress={periodProgress.sales} 
                        size={100}
                        color="green"
                        showMilestones={true}
                      />
                    )}
                  </div>

                  {/* Forecast */}
                  {forecastData.sales && (
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className={`h-3.5 w-3.5 ${forecastData.sales.onTrack ? 'text-green-500' : 'text-orange-500'}`} />
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Forecast</p>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        At current pace: <span className="font-bold text-gray-900 dark:text-white">{forecastData.sales.percentage.toFixed(1)}%</span> by end of period
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-500 mt-1">
                        {forecastData.sales.daysRemaining} days remaining • {forecastData.sales.onTrack ? '✓ On track' : '⚠ Needs attention'}
                      </p>
                    </div>
                  )}

                  {/* Linear Progress Bar */}
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-4">
                    <div
                      className="bg-green-500 dark:bg-green-400 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(periodProgress.sales, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mt-2 text-center">
                    {periodProgress.sales.toFixed(1)}% complete
                  </p>
                  
                  {/* Expandable Details */}
                  {expandedGoal === 'sales' && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                      {/* Performance Analytics */}
                      {goalAnalytics.sales.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Performance Analytics</p>
                          </div>
                          <div className="space-y-2">
                            {goalAnalytics.sales.slice(-7).map((entry, idx) => (
                              <div key={idx} className="flex items-center justify-between text-xs">
                                <span className="text-gray-600 dark:text-gray-400">
                                  {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                                <div className="flex items-center gap-3">
                                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                    <div
                                      className="bg-green-500 dark:bg-green-400 h-1.5 rounded-full transition-all"
                                      style={{ width: `${entry.progress}%` }}
                                    />
                                  </div>
                                  <span className="text-gray-900 dark:text-white font-medium w-12 text-right">
                                    {entry.progress.toFixed(0)}%
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Notification Settings */}
                      {goals.sales.notifications && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Bell className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Notifications</p>
                          </div>
                          <div className="space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Milestone Alerts</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                goals.sales.notifications.enabled 
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                              }`}>
                                {goals.sales.notifications.enabled ? 'Enabled' : 'Disabled'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Deadline Warnings</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                goals.sales.notifications.deadlineWarning 
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                              }`}>
                                {goals.sales.notifications.deadlineWarning ? 'On' : 'Off'}
                              </span>
                            </div>
                            <div className="text-[10px] text-gray-500 dark:text-gray-500 mt-2">
                              Milestones: {goals.sales.notifications.milestones.join('%, ')}%
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Goal Info */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Info className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Goal Details</p>
                        </div>
                        <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                          <div className="flex justify-between">
                            <span>Created:</span>
                            <span>{new Date(goals.sales.createdAt).toLocaleDateString()}</span>
                          </div>
                          {goals.sales.name && (
                            <div className="flex justify-between">
                              <span>Name:</span>
                              <span className="font-medium">{goals.sales.name}</span>
                            </div>
                          )}
                          {goals.sales.description && (
                            <div>
                              <span>Description:</span>
                              <p className="mt-1 text-gray-500 dark:text-gray-500">{goals.sales.description}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Quick Actions */}
                      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Quick Actions</p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleEditGoal('sales')}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleResetGoal('sales')}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Reset
                          </button>
                          <button
                            onClick={() => handleClearGoal('sales')}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center py-8 px-4">
            <Target className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">No goals set yet</p>
            <button
              onClick={() => setShowTemplates(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary-500 dark:bg-primary-600 rounded-lg hover:bg-primary-600 dark:hover:bg-primary-700 transition-colors"
            >
              <Layers className="h-4 w-4" />
              Browse Templates
            </button>
          </div>
        )}
      </div>

      {/* Main Statistics */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 sm:pt-5 md:pt-6">
        <div className="flex items-center justify-between mb-4 sm:mb-5 md:mb-6">
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">Overview</h2>
          <div className="flex items-center gap-2">
            {!goals.orders && (
              <button
                onClick={() => handleSetGoal('orders')}
                className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors min-h-[44px]"
                title="Set orders goal"
              >
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">Set Orders Goal</span>
                <span className="sm:hidden">Orders Goal</span>
              </button>
            )}
            {!goals.sales && (
              <button
                onClick={() => handleSetGoal('sales')}
                className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors min-h-[44px]"
                title="Set sales goal"
              >
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">Set Sales Goal</span>
                <span className="sm:hidden">Sales Goal</span>
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
        <StatCard
          title="Total Orders"
          value={stats.totalOrders.toLocaleString()}
          icon={ShoppingCart}
          color="primary"
            change={previousMonthStats.orders > 0 ? calculateChange(stats.totalOrders, previousMonthStats.orders).value : undefined}
            changeType={previousMonthStats.orders > 0 ? calculateChange(stats.totalOrders, previousMonthStats.orders).type : undefined}
            onClick={() => navigate('/orders')}
            tooltip="Total number of orders placed"
        />
        <StatCard
          title="Total Sales"
          value={formatCurrency(stats.totalSales)}
          icon={DollarSign}
          color="green"
            change={previousMonthStats.sales > 0 ? calculateChange(stats.totalSales, previousMonthStats.sales).value : undefined}
            changeType={previousMonthStats.sales > 0 ? calculateChange(stats.totalSales, previousMonthStats.sales).type : undefined}
            onClick={() => navigate('/orders')}
            tooltip="Total revenue from all orders"
        />
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers.toLocaleString()}
          icon={Users}
          color="blue"
            onClick={() => navigate('/customers')}
            tooltip="Total number of registered customers"
        />
        <StatCard
          title="Total Products"
          value={stats.totalProducts.toLocaleString()}
          icon={Package}
          color="orange"
            onClick={() => navigate('/products')}
            tooltip="Total number of products in catalog"
          />
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 sm:pt-5 md:pt-6">
        <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 sm:mb-5 md:mb-6 tracking-tight">Key Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          <StatCard
            title="Average Order Value"
            value={formatCurrency(averageOrderValue)}
            icon={DollarSign}
            color="green"
            onClick={() => navigate('/orders')}
            tooltip="Average amount per order (Total Sales ÷ Total Orders)"
          />
          
          {/* Order Status Breakdown */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-1.5">
                <CardTitle className="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wide">Order Status</CardTitle>
                <DashboardTooltip text="Breakdown of orders by current status">
                  <Info className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 cursor-help" />
                </DashboardTooltip>
              </div>
            </CardHeader>
            <CardContent className="px-5 py-4 space-y-3">
              {totalStatusOrders > 0 ? (
                Object.entries(orderStatusBreakdown)
                  .filter(([_, count]) => count > 0)
                  .map(([status, count]) => {
                    const percentage = totalStatusOrders > 0 ? (count / totalStatusOrders) * 100 : 0;
                    return (
                      <div key={status} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {getStatusBadge(status)}
                          <div className="flex-1 min-w-0">
                            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary-500 dark:bg-primary-400 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 min-w-[3rem] text-right">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                        <span className="text-xs font-bold text-gray-900 dark:text-white min-w-[2.5rem] text-right">
                          {count.toLocaleString()}
                        </span>
                      </div>
                    );
                  })
              ) : (
                <p className="text-xs font-medium text-gray-600 dark:text-gray-300 text-center py-3">No orders yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Today's Overview */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 sm:pt-5 md:pt-6">
        <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 sm:mb-5 md:mb-6 tracking-tight">Today's Activity</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="px-5 py-4 md:px-6 md:py-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary-100 dark:bg-primary-500/20 rounded-xl flex-shrink-0 shadow-sm">
                  <Clock className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Orders Today</p>
                  <p className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white leading-none tracking-tight">{stats.ordersToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="px-5 py-4 md:px-6 md:py-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 dark:bg-green-500/20 rounded-xl flex-shrink-0 shadow-sm">
                  <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Sales Today</p>
                  <p className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white leading-none tracking-tight">{formatCurrency(stats.salesToday)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="px-5 py-4 md:px-6 md:py-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex-shrink-0 shadow-sm">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">New Customers</p>
                  <p className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white leading-none tracking-tight">{stats.newCustomersToday}</p>
                </div>
            </div>
          </CardContent>
        </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="px-5 py-4 md:px-6 md:py-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 dark:bg-orange-500/20 rounded-xl flex-shrink-0 shadow-sm">
                  <Package className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Low Stock</p>
                  <p className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white leading-none tracking-tight">{stats.lowStockProducts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
              </div>
            </div>

      {/* Charts */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 sm:pt-5 md:pt-6">
        <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 sm:mb-5 md:mb-6 tracking-tight">Analytics & Trends</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
          {/* Sales Trend Chart */}
        <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-gray-800 dark:text-gray-100">Sales Trend</CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-3">
              {chartLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              </div>
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 500 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis 
                      tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 500 }}
                      tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                    />
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        padding: '8px 12px'
                      }}
                      formatter={(value: number | undefined) => formatCurrency(value ?? 0)}
                      labelFormatter={(label: string) => new Date(label).toLocaleDateString()}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="#10b981" 
                      fillOpacity={1} 
                      fill="url(#colorSales)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
                  No data available for selected date range
              </div>
              )}
            </CardContent>
          </Card>

          {/* Orders Trend Chart */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-gray-800 dark:text-gray-100">Orders Trend</CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-3">
              {chartLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 500 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis 
                      tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 500 }}
                    />
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        padding: '8px 12px'
                      }}
                      labelFormatter={(label: string) => new Date(label).toLocaleDateString()}
                    />
                    <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
                  No data available for selected date range
                </div>
              )}
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 sm:pt-5 md:pt-6">
        <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 sm:mb-5 md:mb-6 tracking-tight">Recent Orders</h2>
      <Card>
          <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4 md:px-6">
            <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 xs:gap-0">
              <CardTitle className="text-xs sm:text-sm md:text-base font-semibold">Latest Activity</CardTitle>
              <button
                onClick={() => navigate('/orders')}
                className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors flex-shrink-0 min-h-[44px]"
              >
                <span>View All</span>
                <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </div>
        </CardHeader>
        <CardContent className="p-0">
            <div className="overflow-x-auto">
          <Table
            data={recentOrders}
            columns={orderColumns}
            emptyMessage="No recent orders found"
          />
            </div>
        </CardContent>
      </Card>
      </div>

      {/* Goal Templates Modal */}
      {showTemplates && (
        <Modal
          isOpen={true}
          onClose={() => setShowTemplates(false)}
          title="Goal Templates"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Choose a template to quickly set up your goal with pre-configured settings.
            </p>
            <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
              {goalTemplates.map((template) => {
                const suggestedValue = template.suggestedValue(stats);
                const categoryColors = {
                  growth: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
                  conservative: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
                  aggressive: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
                  maintenance: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                };
                return (
                  <button
                    key={template.id}
                    onClick={() => handleApplyTemplate(template)}
                    className="text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{template.name}</h4>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${categoryColors[template.category]}`}>
                            {template.category}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{template.description}</p>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-gray-500 dark:text-gray-500">
                            Type: <span className="font-medium text-gray-700 dark:text-gray-300">{template.type}</span>
                          </span>
                          <span className="text-gray-500 dark:text-gray-500">
                            Period: <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">{template.period}</span>
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                          {template.type === 'orders' 
                            ? suggestedValue.toLocaleString() 
                            : formatCurrency(suggestedValue)}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-500 mt-1">Suggested</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <ModalFooter>
            <Button
              variant="secondary"
              onClick={() => setShowTemplates(false)}
            >
              Cancel
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {/* Goal Setting Modal */}
      {editingGoal && (
        <Modal
          isOpen={true}
          onClose={() => {
            setEditingGoal(null);
            setGoalInput('');
            setGoalPeriod('monthly');
            setGoalLevel('company');
          }}
          title={`Set ${editingGoal === 'orders' ? 'Orders' : 'Sales'} Goal`}
          size="lg"
        >
          <div className="space-y-4 pb-2">
            {/* Goal Level Selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Goal Level
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['company', 'department', 'team', 'individual'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setGoalLevel(level)}
                    className={`p-3 rounded-lg border-2 transition-all text-xs font-semibold ${
                      goalLevel === level
                        ? 'border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1.5">
                      {level === 'company' && <Building2 className="h-4 w-4" />}
                      {level === 'department' && <Briefcase className="h-4 w-4" />}
                      {level === 'team' && <Users className="h-4 w-4" />}
                      {level === 'individual' && <User className="h-4 w-4" />}
                      <span className="capitalize">{level}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Time Period Selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Goal Period
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['daily', 'weekly', 'monthly', 'quarterly'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setGoalPeriod(period)}
                    className={`px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg border-2 transition-all ${
                      goalPeriod === period
                        ? 'border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-primary-300 dark:hover:border-primary-600'
                    }`}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {goalPeriod === 'daily' && 'Today\'s target'}
                {goalPeriod === 'weekly' && 'This week\'s target (Mon-Sun)'}
                {goalPeriod === 'monthly' && 'This month\'s target'}
                {goalPeriod === 'quarterly' && 'This quarter\'s target (3 months)'}
              </p>
            </div>

            {/* Smart Suggestion */}
            <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-primary-800 dark:text-primary-300 mb-1">Smart Suggestion</p>
                  <p className="text-sm font-bold text-primary-700 dark:text-primary-400">
                    {editingGoal === 'orders' 
                      ? getSmartGoalSuggestion('orders', goalPeriod).toLocaleString() + ' orders'
                      : formatCurrency(getSmartGoalSuggestion('sales', goalPeriod))}
                  </p>
                  <p className="text-xs text-primary-600 dark:text-primary-500 mt-1">
                    Based on your historical performance and growth trends
                  </p>
                  <button
                    onClick={() => setGoalInput(getSmartGoalSuggestion(editingGoal, goalPeriod).toString())}
                    className="mt-2 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline"
                  >
                    Use this suggestion
                  </button>
                </div>
              </div>
            </div>

            {/* Target Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Target {editingGoal === 'orders' ? 'Orders' : 'Sales'} ({editingGoal === 'sales' ? '₹' : ''})
              </label>
              <Input
                type="number"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                placeholder={`Enter target ${editingGoal === 'orders' ? 'number of orders' : 'sales amount'}`}
                min="1"
                step={editingGoal === 'sales' ? '0.01' : '1'}
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Current: {editingGoal === 'orders' 
                    ? stats.totalOrders.toLocaleString() 
                    : formatCurrency(stats.totalSales)}
                </p>
                {goalInput && !isNaN(parseFloat(goalInput)) && (
                  <p className={`text-xs font-semibold ${
                    parseFloat(goalInput) > (editingGoal === 'orders' ? stats.totalOrders : stats.totalSales)
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-orange-600 dark:text-orange-400'
                  }`}>
                    {parseFloat(goalInput) > (editingGoal === 'orders' ? stats.totalOrders : stats.totalSales)
                      ? `${((parseFloat(goalInput) / (editingGoal === 'orders' ? stats.totalOrders : stats.totalSales) - 1) * 100).toFixed(1)}% increase`
                      : 'Already achieved'}
                  </p>
                )}
              </div>
            </div>

            {/* Period Dates Preview */}
            {goalInput && !isNaN(parseFloat(goalInput)) && (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Period</p>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {(() => {
                    const { startDate, endDate } = getPeriodDates(goalPeriod);
                    return `${new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
                  })()}
                </p>
              </div>
            )}
            
            {/* Notification Settings */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Notification Settings
                </label>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">Enable Notifications</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">Get alerts for milestones and deadlines</p>
                  </div>
                  <button
                    onClick={() => setGoalNotifications(prev => ({ ...prev, enabled: !prev.enabled }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                      goalNotifications.enabled ? 'bg-primary-500 dark:bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                        goalNotifications.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                {goalNotifications.enabled && (
                  <>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">Deadline Warnings</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">Alert when deadline approaches</p>
                      </div>
                      <button
                        onClick={() => setGoalNotifications(prev => ({ ...prev, deadlineWarning: !prev.deadlineWarning }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                          goalNotifications.deadlineWarning ? 'bg-primary-500 dark:bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                            goalNotifications.deadlineWarning ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Milestone Alerts</p>
                      <div className="grid grid-cols-4 gap-2">
                        {[25, 50, 75, 100].map((milestone) => (
                          <button
                            key={milestone}
                            onClick={() => {
                              const milestones = goalNotifications.milestones.includes(milestone)
                                ? goalNotifications.milestones.filter(m => m !== milestone)
                                : [...goalNotifications.milestones, milestone].sort((a, b) => a - b);
                              setGoalNotifications(prev => ({ ...prev, milestones }));
                            }}
                            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                              goalNotifications.milestones.includes(milestone)
                                ? 'bg-primary-500 dark:bg-primary-600 text-white shadow-sm'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                            }`}
                          >
                            {milestone}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <ModalFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setEditingGoal(null);
                setGoalInput('');
                setGoalPeriod('monthly');
                setGoalLevel('company');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleSaveGoal(editingGoal)}
              disabled={!goalInput || parseFloat(goalInput) <= 0}
            >
              Save Goal
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {/* Phase 3: Gamification - Leaderboard Modal */}
      {showLeaderboard && (
        <Modal
          isOpen={true}
          onClose={() => setShowLeaderboard(false)}
          title="Leaderboard"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Your Score</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{userPoints.toLocaleString()} pts</p>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Rank</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">#{leaderboard.findIndex(e => e.name === 'You') + 1}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {leaderboard.map((entry, idx) => (
                <div
                  key={entry.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    entry.name === 'You'
                      ? 'border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 font-bold text-sm">
                    {entry.rank === 1 && <Crown className="h-5 w-5 text-yellow-500" />}
                    {entry.rank === 2 && <Medal className="h-5 w-5 text-gray-400" />}
                    {entry.rank === 3 && <Medal className="h-5 w-5 text-orange-400" />}
                    {entry.rank > 3 && <span className="text-gray-600 dark:text-gray-400">#{entry.rank}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{entry.name}</p>
                      {entry.achievements.length > 0 && (
                        <div className="flex items-center gap-1">
                          {entry.achievements.map((ach, i) => (
                            <Star key={i} className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-gray-600 dark:text-gray-400">{entry.score.toLocaleString()} pts</span>
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 max-w-32">
                        <div
                          className="bg-primary-500 dark:bg-primary-400 h-1.5 rounded-full"
                          style={{ width: `${entry.progress}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{entry.progress.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowLeaderboard(false);
                  setShowChallenges(true);
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
              >
                <Flame className="h-4 w-4" />
                View Challenges
              </button>
            </div>
          </div>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setShowLeaderboard(false)}>
              Close
            </Button>
          </ModalFooter>
        </Modal>
      )}
      
      {/* Phase 3: Gamification - Challenges Modal */}
      {showChallenges && (
        <Modal
          isOpen={true}
          onClose={() => setShowChallenges(false)}
          title="Active Challenges"
        >
          <div className="space-y-4">
            {challenges.map((challenge) => (
              <Card key={challenge.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">{challenge.name}</h4>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          challenge.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                          challenge.status === 'upcoming' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                          'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}>
                          {challenge.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{challenge.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                        <span>{challenge.participants} participants</span>
                        {challenge.prize && <span>Prize: {challenge.prize}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                        {challenge.type === 'orders' 
                          ? challenge.target.toLocaleString() 
                          : formatCurrency(challenge.target)}
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-500">Target</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">
                      {new Date(challenge.startDate).toLocaleDateString()} - {new Date(challenge.endDate).toLocaleDateString()}
                    </span>
                    <button className="px-3 py-1.5 bg-primary-500 dark:bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-600 dark:hover:bg-primary-700 transition-colors">
                      Join Challenge
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setShowChallenges(false)}>
              Close
            </Button>
          </ModalFooter>
        </Modal>
      )}
      
      {/* Phase 3: Social Collaboration Modal */}
      {showCollaboration && (
        <Modal
          isOpen={true}
          onClose={() => setShowCollaboration(false)}
          title="Team Collaboration"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {goals.orders && (
                <div onClick={() => setShowComments({ goalId: 'orders', type: 'orders' })} className="cursor-pointer">
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">Orders Goal</p>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                        {goalComments['orders']?.length || 0} comments • {goalUpdates['orders']?.length || 0} updates
                      </p>
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-500">View discussions</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              {goals.sales && (
                <div onClick={() => setShowComments({ goalId: 'sales', type: 'sales' })} className="cursor-pointer">
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">Sales Goal</p>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                        {goalComments['sales']?.length || 0} comments • {goalUpdates['sales']?.length || 0} updates
                      </p>
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-500">View discussions</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
            
            {showComments && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Comments on {showComments.type === 'orders' ? 'Orders' : 'Sales'} Goal
                  </h4>
                  <button
                    onClick={() => setShowComments(null)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                  {(goalComments[showComments.goalId] || []).map((comment) => (
                    <div key={comment.id} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-primary-500 dark:bg-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {comment.author.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs font-semibold text-gray-900 dark:text-white">{comment.author}</p>
                          <span className="text-[10px] text-gray-500 dark:text-gray-500">
                            {new Date(comment.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">{comment.message}</p>
                        <button
                          onClick={() => handleLikeComment(showComments.goalId, comment.id)}
                          className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400"
                        >
                          <ThumbsUp className="h-3 w-3" />
                          {comment.likes}
                        </button>
                      </div>
                    </div>
                  ))}
                  {(!goalComments[showComments.goalId] || goalComments[showComments.goalId].length === 0) && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 text-center py-4">No comments yet. Be the first to comment!</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 text-sm"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && newComment.trim()) {
                        handleAddComment(showComments.goalId, showComments.type);
                      }
                    }}
                  />
                  <Button
                    onClick={() => handleAddComment(showComments.goalId, showComments.type)}
                    disabled={!newComment.trim()}
                    className="px-4"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setShowCollaboration(false)}>
              Close
            </Button>
          </ModalFooter>
        </Modal>
      )}
      
      {/* Phase 3: Predictive Analytics Modal */}
      {showPredictiveAnalytics && (
        <Modal
          isOpen={true}
          onClose={() => {
            setShowPredictiveAnalytics(false);
            setSelectedScenario(null);
          }}
          title="Predictive Analytics & What-If Scenarios"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => {
                  generateWhatIfScenarios('orders');
                  setSelectedScenario(null);
                }}
                className="p-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 transition-colors text-left"
              >
                <div className="flex items-center gap-2 mb-1">
                  <ShoppingCart className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Orders Scenarios</p>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Analyze order growth predictions</p>
              </button>
              <button
                onClick={() => {
                  generateWhatIfScenarios('sales');
                  setSelectedScenario(null);
                }}
                className="p-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-500 dark:hover:border-green-500 transition-colors text-left"
              >
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Sales Scenarios</p>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Analyze sales growth predictions</p>
              </button>
            </div>
            
            {whatIfScenarios.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">What-If Scenarios</p>
                {whatIfScenarios.map((scenario) => (
                  <div
                    key={scenario.id}
                    onClick={() => setSelectedScenario(scenario)}
                    className="cursor-pointer"
                  >
                    <Card
                      className={`hover:shadow-md transition-all ${
                        selectedScenario?.id === scenario.id ? 'border-primary-500 dark:border-primary-400' : ''
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Lightbulb className="h-4 w-4 text-yellow-500" />
                              <p className="text-sm font-bold text-gray-900 dark:text-white">{scenario.name}</p>
                              <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-[10px] font-medium rounded">
                                {scenario.confidence}% confidence
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{scenario.description}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                              <span>Growth: {((scenario.assumptions.dailyGrowth || 0) * 100).toFixed(0)}%/day</span>
                              <span>Date: {new Date(scenario.projectedDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                              {formatCurrency(scenario.projectedValue)}
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-500">Projected</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            )}
            
            {selectedScenario && (
              <div className="mt-4 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Scenario Details</p>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Current Value:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {goals.orders ? stats.totalOrders.toLocaleString() : formatCurrency(stats.totalSales)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Projected Value:</span>
                    <span className="font-medium text-primary-600 dark:text-primary-400">
                      {formatCurrency(selectedScenario.projectedValue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Growth Rate:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {((selectedScenario.assumptions.dailyGrowth || 0) * 100).toFixed(1)}% daily
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Projected Date:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {new Date(selectedScenario.projectedDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <ModalFooter>
            <Button variant="secondary" onClick={() => {
              setShowPredictiveAnalytics(false);
              setSelectedScenario(null);
            }}>
              Close
            </Button>
          </ModalFooter>
        </Modal>
      )}
      
      {/* Phase 3: OKR Framework Modal */}
      {showOKR && (
        <Modal
          isOpen={true}
          onClose={() => {
            setShowOKR(false);
            setEditingOKR(null);
          }}
          title="OKR Framework"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Objectives and Key Results help align goals with measurable outcomes.
              </p>
              <Button onClick={handleCreateOKR} className="px-3 py-1.5 text-xs">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                New OKR
              </Button>
            </div>
            
            {okrs.length === 0 ? (
              <div className="text-center py-8">
                <Flag className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">No OKRs defined yet</p>
                <Button onClick={handleCreateOKR}>
                  Create Your First OKR
                </Button>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {okrs.map((okr) => {
                  const progress = calculateOKRProgress(okr);
                  return (
                    <Card key={okr.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Flag className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                              <p className="text-sm font-bold text-gray-900 dark:text-white">{okr.title}</p>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                okr.status === 'on-track' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                                okr.status === 'at-risk' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                                'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                              }`}>
                                {okr.status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{okr.description || 'No description'}</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                  className="bg-primary-500 dark:bg-primary-400 h-2 rounded-full transition-all"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{progress.toFixed(0)}%</span>
                            </div>
                          </div>
                          <button
                            onClick={() => setEditingOKR(okr)}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </div>
                        
                        {okr.keyResults.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Key Results:</p>
                            {okr.keyResults.map((kr) => (
                              <div key={kr.id} className="flex items-center justify-between text-xs">
                                <span className="text-gray-600 dark:text-gray-400">{kr.title}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-900 dark:text-white font-medium">
                                    {kr.current} / {kr.target} {kr.unit}
                                  </span>
                                  <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                    <div
                                      className="bg-green-500 dark:bg-green-400 h-1.5 rounded-full"
                                      style={{ width: `${kr.progress}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
          <ModalFooter>
            <Button variant="secondary" onClick={() => {
              setShowOKR(false);
              setEditingOKR(null);
            }}>
              Close
            </Button>
          </ModalFooter>
        </Modal>
      )}
      
      {/* Phase 3: External Integrations Modal */}
      {showIntegrations && (
        <Modal
          isOpen={true}
          onClose={() => setShowIntegrations(false)}
          title="External Integrations"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <Webhook className="h-8 w-8 text-primary-600 dark:text-primary-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Webhooks</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Real-time goal updates</p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <Code className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">API</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">REST API access</p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <FileSpreadsheet className="h-8 w-8 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Export</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">CSV, JSON, Excel</p>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Webhook className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Webhook URL</p>
                  </div>
                  <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-[10px] font-medium rounded">
                    Active
                  </span>
                </div>
                <code className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 p-2 rounded block mt-2">
                  https://api.creamingo.com/webhooks/goals
                </code>
                <p className="text-[10px] text-gray-500 dark:text-gray-500 mt-2">
                  Sends POST requests when goals are updated or milestones are reached
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <Code className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">API Endpoint</p>
                </div>
                <code className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 p-2 rounded block mt-2">
                  GET /api/v1/goals
                </code>
                <p className="text-[10px] text-gray-500 dark:text-gray-500 mt-2">
                  Access goal data programmatically with authentication
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <Download className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Export Data</p>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="secondary"
                    onClick={handleExport}
                    className="text-xs px-3 py-1.5"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
                    CSV
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      const data = JSON.stringify({ goals, stats, analytics: goalAnalytics }, null, 2);
                      const blob = new Blob([data], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `goals-export-${new Date().toISOString().split('T')[0]}.json`;
                      link.click();
                      showSuccess('Export Successful', 'Goals data exported as JSON');
                    }}
                    className="text-xs px-3 py-1.5"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
                    JSON
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setShowIntegrations(false)}>
              Close
            </Button>
          </ModalFooter>
        </Modal>
      )}
      
      {/* Celebration Animation */}
      <CelebrationAnimation show={showCelebration.achieved} type={showCelebration.type} />
    </div>
  );
};
