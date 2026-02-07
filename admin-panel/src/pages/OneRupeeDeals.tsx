import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Gift,
  Package,
  DollarSign,
  CheckCircle,
  XCircle,
  Loader2,
  Save,
  X,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Filter,
  RefreshCw,
  ExternalLink,
  Grid3x3,
  List,
  Download,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  BarChart3,
  LineChart as LineChartIcon,
  Target,
  Activity,
  Eye,
  AlertCircle,
  Lightbulb,
  Trophy,
  Brain,
  TestTube,
  Pause,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle2,
  CalendarDays,
  Repeat,
  Bell,
  Rocket,
  Wand2,
  BarChart2,
  LineChart as LineChartIcon2,
  Database,
  Clock as ClockIcon,
  Calendar as CalendarIcon
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table } from '../components/ui/Table';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { TableColumn } from '../types';
import dealService, { Deal, CreateDealData, UpdateDealData } from '../services/dealService';
import productService from '../services/productService';
import { Product } from '../types';
import { useToastContext } from '../contexts/ToastContext';
import orderService from '../services/orderService';
import { DateRangePicker } from '../components/ui/DateRangePicker';
import { resolveImageUrl } from '../utils/imageUrl';

// Tooltip Component - Matching Dashboard Style
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

// Deal Card Component for Grid View
const DealCard: React.FC<{
  deal: Deal;
  onEdit: (deal: Deal) => void;
  onDelete: (deal: Deal) => void;
  onToggleStatus: (id: number) => void;
  onPriorityChange: (id: number, direction: 'up' | 'down') => void;
  actionLoading: string | null;
  currentIndex: number;
  totalDeals: number;
}> = ({ deal, onEdit, onDelete, onToggleStatus, onPriorityChange, actionLoading, currentIndex, totalDeals }) => {
  return (
    <Card className="hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="font-bold text-sm text-gray-900 dark:text-white">{deal.deal_title}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Priority: {deal.priority}</div>
            </div>
            <button
              onClick={() => onToggleStatus(deal.id)}
              disabled={actionLoading === `toggle-${deal.id}`}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border transition-colors ${
                deal.is_active
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-600'
              }`}
            >
              {deal.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
              {deal.is_active ? 'Active' : 'Inactive'}
            </button>
          </div>

          {/* Product */}
          <div className="flex items-center gap-2">
            {deal.product?.image_url && (
              <img
                src={resolveImageUrl(deal.product.image_url)}
                alt={deal.product.name}
                className="w-12 h-12 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-xs text-gray-900 dark:text-white truncate">
                {deal.product?.name || 'N/A'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Regular: ₹{deal.product?.base_price || '0'}
              </div>
            </div>
          </div>

          {/* Deal Info */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Threshold</div>
              <div className="font-bold text-sm text-pink-600 dark:text-pink-400">
                ₹{deal.threshold_amount.toFixed(0)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Deal Price</div>
              <div className="font-bold text-sm text-green-600 dark:text-green-400">
                ₹{deal.deal_price.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Max Quantity */}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Max Qty: {deal.max_quantity_per_order} per order
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex gap-2">
            <div className="flex items-center gap-1 flex-1">
              <DashboardTooltip text="Move Up">
                <button
                  onClick={() => onPriorityChange(deal.id, 'up')}
                  disabled={currentIndex === 0 || actionLoading === `priority-${deal.id}`}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowUp className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                </button>
              </DashboardTooltip>
              <DashboardTooltip text="Move Down">
                <button
                  onClick={() => onPriorityChange(deal.id, 'down')}
                  disabled={currentIndex === totalDeals - 1 || actionLoading === `priority-${deal.id}`}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowDown className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                </button>
              </DashboardTooltip>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(deal)}
              className="flex-1"
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(deal)}
              className="text-red-600 hover:text-red-700 dark:hover:text-red-400"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const OneRupeeDeals: React.FC = () => {
  const { showSuccess, showError } = useToastContext();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const productDropdownRef = useRef<HTMLDivElement>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [thresholdFilter, setThresholdFilter] = useState('all');
  const [sortBy, setSortBy] = useState('priority');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showThresholdDropdown, setShowThresholdDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  // const [isDarkMode, setIsDarkMode] = useState(false); // Reserved for future dark mode feature
  const [analytics, setAnalytics] = useState({
    totalRedemptions: 0,
    totalRevenue: 0,
    todayRedemptions: 0,
    averageCartValue: 0
  });
  interface TimeSeriesData {
    date: string;
    redemptions: number;
    revenue: number;
    orders: number;
  }

  interface DealPerformance {
    dealId: number;
    dealTitle: string;
    redemptions: number;
    revenue: number;
    conversionRate: number;
    avgCartValue: number;
  }

  interface ThresholdDistribution {
    threshold: string;
    count: number;
    redemptions: number;
  }

  interface ConversionFunnel {
    views: number;
    eligible: number;
    added: number;
    completed: number;
  }

  interface TopDeal {
    dealId: number;
    dealTitle: string;
    score: number;
    redemptions: number;
    revenue: number;
  }

  interface CustomerBehavior {
    avgCartValue: number;
    medianCartValue: number;
    mostCommonThreshold: string;
    dealAdoptionRate: number;
  }

  const [advancedAnalytics, setAdvancedAnalytics] = useState<{
    timeSeriesData: TimeSeriesData[];
    dealPerformance: DealPerformance[];
    thresholdDistribution: ThresholdDistribution[];
    conversionFunnel: ConversionFunnel;
    topDeals: TopDeal[];
    customerBehavior: CustomerBehavior;
  }>({
    timeSeriesData: [],
    dealPerformance: [],
    thresholdDistribution: [],
    conversionFunnel: {
      views: 0,
      eligible: 0,
      added: 0,
      completed: 0
    },
    topDeals: [],
    customerBehavior: {
      avgCartValue: 0,
      medianCartValue: 0,
      mostCommonThreshold: '',
      dealAdoptionRate: 0
    }
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [analyticsDateRange, setAnalyticsDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [showBackfillModal, setShowBackfillModal] = useState(false);
  const [backfillLoading, setBackfillLoading] = useState(false);
  const [backfillDateRange, setBackfillDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });
  const [backfillResult, setBackfillResult] = useState<{
    processed: number;
    dealsFound: number;
    eventsCreated: number;
    dealsProcessed?: Array<{ deal_id: number; redemptions: number; revenue: number }>;
  } | null>(null);
  
  // Phase 3: Advanced Features State
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false);
  const [activeTab, setActiveTab] = useState<'predictive' | 'ab-testing' | 'recommendations' | 'scheduling'>('predictive');
  
  // Predictive Analytics
  const [predictiveData, setPredictiveData] = useState({
    forecastRedemptions: [] as Array<{ date: string; predicted: number; confidence: number }>,
    forecastRevenue: [] as Array<{ date: string; predicted: number; confidence: number }>,
    optimalThreshold: 0,
    recommendedThreshold: 0,
    trendDirection: 'up' as 'up' | 'down' | 'stable',
    confidence: 0
  });
  
  // A/B Testing
  const [abTests, setAbTests] = useState<Array<{
    id: string;
    name: string;
    variantA: { dealId: number; threshold: number; price: number };
    variantB: { dealId: number; threshold: number; price: number };
    status: 'draft' | 'running' | 'completed' | 'paused';
    startDate: string;
    endDate: string;
    trafficSplit: number; // Percentage for variant A
    results: {
      variantA: { redemptions: number; revenue: number; conversionRate: number };
      variantB: { redemptions: number; revenue: number; conversionRate: number };
      winner: 'A' | 'B' | 'tie' | null;
      confidence: number;
    };
  }>>([]);
  const [showAbTestModal, setShowAbTestModal] = useState(false);
  const [abTestForm, setAbTestForm] = useState({
    name: '',
    dealId: 0,
    variantAThreshold: 0,
    variantAPrice: 1,
    variantBThreshold: 0,
    variantBPrice: 1,
    trafficSplit: 50,
    startDate: '',
    endDate: ''
  });
  
  // Smart Recommendations
  const [recommendations, setRecommendations] = useState<Array<{
    id: string;
    type: 'threshold' | 'price' | 'timing' | 'product' | 'priority';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    impact: string;
    action: string;
    dealId?: number;
    currentValue?: number;
    recommendedValue?: number;
    expectedImprovement?: number;
  }>>([]);
  
  // Advanced Scheduling
  const [dealSchedules, setDealSchedules] = useState<Record<number, {
    isScheduled: boolean;
    startDate: string | null;
    endDate: string | null;
    isRecurring: boolean;
    recurrencePattern: 'daily' | 'weekly' | 'monthly' | 'custom' | null;
    recurrenceDays?: number[];
    timeSlots?: Array<{ start: string; end: string }>;
    timezone: string;
  }>>({});
  const [showSchedulingModal, setShowSchedulingModal] = useState(false);
  const [schedulingDealId, setSchedulingDealId] = useState<number | null>(null);
  const [schedulingForm, setSchedulingForm] = useState({
    startDate: '',
    endDate: '',
    isRecurring: false,
    recurrencePattern: 'daily' as 'daily' | 'weekly' | 'monthly' | 'custom',
    recurrenceDays: [] as number[],
    timeSlots: [] as Array<{ start: string; end: string }>,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const thresholdDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<CreateDealData>({
    deal_title: '',
    product_id: 0,
    threshold_amount: 0,
    deal_price: 1.00,
    max_quantity_per_order: 1,
    priority: 0,
    is_active: true,
    description: ''
  });

  // Fetch deals
  const fetchDeals = useCallback(async () => {
    try {
      setLoading(true);
      const response = await dealService.getDeals();
      console.log('Deals API Response:', response);
      
      // Handle response - check for data array even if empty
      if (response.success) {
        if (response.data && Array.isArray(response.data)) {
          setDeals(response.data);
          console.log(`Loaded ${response.data.length} deals`);
        } else {
          console.warn('Deals response data is not an array:', response.data);
          setDeals([]);
        }
      } else {
        console.warn('Deals API returned success: false');
        setDeals([]);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch deals';
      const detailedMessage = error.response?.status 
        ? `${errorMessage} (HTTP ${error.response.status})`
        : errorMessage;
      showError(detailedMessage);
      console.error('Error fetching deals:', error);
      // Set empty array on error to prevent undefined state
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  // Fetch products for dropdown
  const fetchProducts = async (search: string = '') => {
    try {
      const response = await productService.getProducts({
        page: 1,
        limit: 50,
        search: search || undefined,
        is_active: true,
        sort_by: 'name',
        sort_order: 'ASC'
      });
      if (response.products) {
        setProducts(response.products);
      }
    } catch (error: any) {
      console.error('Error fetching products:', error);
    }
  };

  useEffect(() => {
    fetchDeals();
    fetchProducts();
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
      if (thresholdDropdownRef.current && !thresholdDropdownRef.current.contains(event.target as Node)) {
        setShowThresholdDropdown(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch basic analytics from real deal performance data
  const fetchAnalytics = async () => {
    try {
      // Fetch real deal performance data
      const performanceResponse = await dealService.getAllDealsPerformance();
      const performanceData = performanceResponse.data || [];

      // Calculate totals from real data
      const totalRedemptions = performanceData.reduce((sum: number, p: any) => sum + (p.total_redemptions || 0), 0);
      const totalRevenue = performanceData.reduce((sum: number, p: any) => sum + (p.total_revenue || 0), 0);
      
      // Get today's redemptions from time series
      const today = new Date().toISOString().split('T')[0];
      const todayTimeSeries = await dealService.getDealAnalyticsTimeSeries({
        date_from: today,
        date_to: today
      });
      const todayRedemptions = todayTimeSeries.data?.reduce((sum: number, row: any) => sum + (row.redemptions || 0), 0) || 0;

      // Calculate average cart value from performance data
      const dealsWithCartValue = performanceData.filter((p: any) => p.avg_cart_value > 0);
      const averageCartValue = dealsWithCartValue.length > 0
        ? dealsWithCartValue.reduce((sum: number, p: any) => sum + (p.avg_cart_value || 0), 0) / dealsWithCartValue.length
        : 0;

      setAnalytics({
        totalRedemptions,
        totalRevenue,
        todayRedemptions,
        averageCartValue
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Fallback to basic calculation if API fails
      try {
        const response = await orderService.getOrders({ limit: 1000 });
        const orders = response.orders || [];
        const today = new Date().toISOString().split('T')[0];
        const todayOrders = orders.filter(order => order.createdAt.startsWith(today));
        const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
        const averageCartValue = orders.length > 0 ? totalRevenue / orders.length : 0;

        setAnalytics({
          totalRedemptions: orders.length,
          totalRevenue,
          todayRedemptions: todayOrders.length,
          averageCartValue
        });
      } catch (fallbackError) {
        console.error('Error in fallback analytics:', fallbackError);
      }
    }
  };

  // Fetch advanced analytics
  const fetchAdvancedAnalytics = useCallback(async () => {
    try {
      setAnalyticsLoading(true);
      
      // Fetch real analytics data from API
      const [timeSeriesResponse, performanceResponse] = await Promise.all([
        dealService.getDealAnalyticsTimeSeries({
          date_from: analyticsDateRange.start,
          date_to: analyticsDateRange.end
        }),
        dealService.getAllDealsPerformance({
          date_from: analyticsDateRange.start,
          date_to: analyticsDateRange.end
        })
      ]);

      const timeSeriesData = (timeSeriesResponse.data || []).map((row: any) => ({
        date: row.date,
        redemptions: row.redemptions || 0,
        revenue: row.revenue || 0,
        orders: row.orders || row.redemptions || 0
      }));

      // If no time series data, initialize with date range
      if (timeSeriesData.length === 0) {
        const startDate = new Date(analyticsDateRange.start);
        const endDate = new Date(analyticsDateRange.end);
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          timeSeriesData.push({ date: dateStr, redemptions: 0, revenue: 0, orders: 0 });
        }
      }

      const activeDeals = deals.filter(d => d.is_active);

      // Deal performance data from real API
      const dealPerformance = activeDeals.map(deal => {
        const perf = performanceResponse.data?.find((p: any) => p.deal_id === deal.id);
        return {
          dealId: deal.id,
          dealTitle: deal.deal_title,
          redemptions: perf?.total_redemptions || 0,
          revenue: perf?.total_revenue || 0,
          conversionRate: perf?.conversion_rate || 0,
          avgCartValue: perf?.avg_cart_value || deal.threshold_amount
        };
      }).sort((a, b) => b.redemptions - a.redemptions);

      // Threshold distribution
      const thresholdGroups = [
        { threshold: '< ₹500', min: 0, max: 500 },
        { threshold: '₹500-999', min: 500, max: 1000 },
        { threshold: '₹1000-1499', min: 1000, max: 1500 },
        { threshold: '₹1500+', min: 1500, max: Infinity }
      ];

      const thresholdDistribution = thresholdGroups.map(group => {
        const matchingDeals = activeDeals.filter(d => 
          d.threshold_amount >= group.min && d.threshold_amount < group.max
        );
        const redemptions = matchingDeals.reduce((sum, deal) => {
          const perf = dealPerformance.find(p => p.dealId === deal.id);
          return sum + (perf?.redemptions || 0);
        }, 0);

        return {
          threshold: group.threshold,
          count: matchingDeals.length,
          redemptions
        };
      });

      // Conversion funnel from real analytics
      const totalViews = performanceResponse.data?.reduce((sum: number, p: any) => sum + (p.total_views || 0), 0) || 0;
      // const totalClicks = performanceResponse.data?.reduce((sum: number, p: any) => sum + (p.total_clicks || 0), 0) || 0; // Reserved for future use
      const totalAdds = performanceResponse.data?.reduce((sum: number, p: any) => sum + (p.total_adds || 0), 0) || 0;
      const totalRedemptions = performanceResponse.data?.reduce((sum: number, p: any) => sum + (p.total_redemptions || 0), 0) || 0;
      
      // Calculate eligible orders (orders that meet minimum threshold)
      const ordersResponse = await orderService.getOrders({ 
        limit: 1000,
        date_from: analyticsDateRange.start,
        date_to: analyticsDateRange.end
      });
      const orders = ordersResponse.orders || [];
      const eligible = orders.filter(o => {
        const minThreshold = Math.min(...activeDeals.map(d => d.threshold_amount));
        return o.total >= minThreshold;
      }).length;
      
      const added = totalAdds || Math.floor(eligible * 0.7);
      const completed = totalRedemptions || Math.floor(added * 0.9);

      // Top deals with performance score
      const topDeals = dealPerformance
        .map(perf => {
          const score = (perf.redemptions * 0.4) + (perf.revenue / 100 * 0.3) + (perf.conversionRate * 0.3);
          return {
            dealId: perf.dealId,
            dealTitle: perf.dealTitle,
            score: Math.round(score * 10) / 10,
            redemptions: perf.redemptions,
            revenue: perf.revenue
          };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      // Customer behavior insights
      const cartValues = orders.map(o => o.total).filter(v => v > 0);
      const avgCartValue = cartValues.length > 0 
        ? cartValues.reduce((a, b) => a + b, 0) / cartValues.length 
        : 0;
      const sortedValues = [...cartValues].sort((a, b) => a - b);
      const medianCartValue = sortedValues.length > 0
        ? sortedValues[Math.floor(sortedValues.length / 2)]
        : 0;

      const mostCommonThreshold = thresholdDistribution
        .reduce((max, curr) => curr.count > max.count ? curr : max, thresholdDistribution[0])
        .threshold;

      const dealAdoptionRate = orders.length > 0 
        ? (eligible / orders.length) * 100 
        : 0;

      setAdvancedAnalytics({
        timeSeriesData,
        dealPerformance,
        thresholdDistribution,
        conversionFunnel: {
          views: totalViews,
          eligible,
          added,
          completed
        },
        topDeals,
        customerBehavior: {
          avgCartValue,
          medianCartValue,
          mostCommonThreshold,
          dealAdoptionRate
        }
      });
    } catch (error: any) {
      console.error('Error fetching advanced analytics:', error);
      // Show user-friendly error message if analytics tables don't exist
      if (error.message?.includes('no such table') || error.message?.includes('Analytics tables do not exist')) {
        // Don't show error toast here as it's handled gracefully with "No data available" message
        console.warn('Analytics tables may not exist. Run migrations to enable analytics.');
      }
      
      // Initialize with empty data for the date range so charts can still render
      const startDate = new Date(analyticsDateRange.start);
      const endDate = new Date(analyticsDateRange.end);
      const emptyTimeSeriesData: TimeSeriesData[] = [];
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        emptyTimeSeriesData.push({ date: dateStr, redemptions: 0, revenue: 0, orders: 0 });
      }
      
      const activeDeals = deals.filter(d => d.is_active);
      const emptyDealPerformance = activeDeals.map(deal => ({
        dealId: deal.id,
        dealTitle: deal.deal_title,
        redemptions: 0,
        revenue: 0,
        conversionRate: 0,
        avgCartValue: deal.threshold_amount
      }));
      
      setAdvancedAnalytics({
        timeSeriesData: emptyTimeSeriesData,
        dealPerformance: emptyDealPerformance,
        thresholdDistribution: [],
        conversionFunnel: {
          views: 0,
          eligible: 0,
          added: 0,
          completed: 0
        },
        topDeals: [],
        customerBehavior: {
          avgCartValue: 0,
          medianCartValue: 0,
          mostCommonThreshold: '',
          dealAdoptionRate: 0
        }
      });
    } finally {
      setAnalyticsLoading(false);
    }
  }, [analyticsDateRange.start, analyticsDateRange.end, deals]);

  // Phase 3: Predictive Analytics
  const generatePredictiveAnalytics = useCallback(() => {
    if (deals.length === 0 || advancedAnalytics.timeSeriesData.length === 0) return;

    // Generate forecast for next 7 days
    const last7Days = advancedAnalytics.timeSeriesData.slice(-7);
    const avgRedemptions = last7Days.length > 0 ? last7Days.reduce((sum, d) => sum + d.redemptions, 0) / last7Days.length : 0;
    const avgRevenue = last7Days.length > 0 ? last7Days.reduce((sum, d) => sum + d.revenue, 0) / last7Days.length : 0;
    const trend = last7Days.length > 1 
      ? (last7Days[last7Days.length - 1].redemptions - last7Days[0].redemptions) / last7Days.length
      : 0;

    const forecastRedemptions: Array<{ date: string; predicted: number; confidence: number }> = [];
    const forecastRevenue: Array<{ date: string; predicted: number; confidence: number }> = [];

    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Simple linear trend projection
      const predictedRedemptions = Math.max(0, avgRedemptions + (trend * i));
      const predictedRev = Math.max(0, avgRevenue + (trend * 50 * i));
      
      // Confidence decreases over time
      const confidence = Math.max(50, 95 - (i * 5));
      
      forecastRedemptions.push({ date: dateStr, predicted: Math.round(predictedRedemptions), confidence });
      forecastRevenue.push({ date: dateStr, predicted: Math.round(predictedRev), confidence });
    }

    // Calculate optimal threshold based on historical data
    const activeDeals = deals.filter(d => d.is_active);
    const thresholdPerformance = activeDeals.map(deal => {
      const perf = advancedAnalytics.dealPerformance.find(p => p.dealId === deal.id);
      const score = perf && deal.threshold_amount > 0 ? (perf.redemptions * perf.conversionRate) / deal.threshold_amount : 0;
      return { threshold: deal.threshold_amount, score };
    });

    const optimalThreshold = thresholdPerformance.length > 0
      ? thresholdPerformance.reduce((max, curr) => curr.score > max.score ? curr : max, thresholdPerformance[0]).threshold
      : 500;

    // Recommended threshold (slightly lower for better conversion)
    const recommendedThreshold = optimalThreshold * 0.9;

    setPredictiveData({
      forecastRedemptions,
      forecastRevenue,
      optimalThreshold,
      recommendedThreshold,
      trendDirection: trend > 0.1 ? 'up' : trend < -0.1 ? 'down' : 'stable',
      confidence: Math.round((forecastRedemptions[0]?.confidence || 0))
    });
  }, [deals, advancedAnalytics]);

  // Phase 3: Generate Smart Recommendations
  const generateSmartRecommendations = useCallback(() => {
    const newRecommendations: typeof recommendations = [];

    // Analyze each deal
    deals.forEach(deal => {
      const perf = advancedAnalytics.dealPerformance.find(p => p.dealId === deal.id);
      
      if (!perf) return;

      // Threshold optimization
      if (perf.conversionRate < 15 && deal.threshold_amount > 500) {
        const recommendedThreshold = deal.threshold_amount * 0.85;
        const expectedImprovement = (15 - perf.conversionRate) * 1.5;
        newRecommendations.push({
          id: `threshold-${deal.id}`,
          type: 'threshold',
          priority: 'high',
          title: `Lower Threshold for "${deal.deal_title}"`,
          description: `Current threshold (₹${deal.threshold_amount}) is limiting conversions. Lowering to ₹${recommendedThreshold.toFixed(0)} could improve adoption.`,
          impact: `Expected ${expectedImprovement.toFixed(1)}% increase in conversion rate`,
          action: `Reduce threshold from ₹${deal.threshold_amount} to ₹${recommendedThreshold.toFixed(0)}`,
          dealId: deal.id,
          currentValue: deal.threshold_amount,
          recommendedValue: recommendedThreshold,
          expectedImprovement
        });
      }

      // Price optimization
      if (perf.redemptions > 20 && perf.redemptions > 0 && (perf.revenue / perf.redemptions) < deal.deal_price * 1.2) {
        const recommendedPrice = deal.deal_price * 1.1;
        newRecommendations.push({
          id: `price-${deal.id}`,
          type: 'price',
          priority: 'medium',
          title: `Optimize Price for "${deal.deal_title}"`,
          description: `High redemption volume suggests price elasticity. Slight increase could boost revenue without significant drop in conversions.`,
          impact: `Potential 10-15% revenue increase`,
          action: `Increase deal price from ₹${deal.deal_price.toFixed(2)} to ₹${recommendedPrice.toFixed(2)}`,
          dealId: deal.id,
          currentValue: deal.deal_price,
          recommendedValue: recommendedPrice,
          expectedImprovement: 12
        });
      }

      // Priority optimization
      if (perf.redemptions > 30 && deal.priority > 3) {
        newRecommendations.push({
          id: `priority-${deal.id}`,
          type: 'priority',
          priority: 'medium',
          title: `Increase Priority for "${deal.deal_title}"`,
          description: `High-performing deal should be featured more prominently to maximize visibility.`,
          impact: `Expected 20-30% increase in visibility and redemptions`,
          action: `Move to priority position 1-3`,
          dealId: deal.id,
          currentValue: deal.priority,
          recommendedValue: 1,
          expectedImprovement: 25
        });
      }
    });

    // Timing recommendations
    // const peakHours = [18, 19, 20, 21]; // 6 PM - 9 PM - Reserved for future use
    newRecommendations.push({
      id: 'timing-peak',
      type: 'timing',
      priority: 'high',
      title: 'Schedule Deals During Peak Hours',
      description: 'Historical data shows highest engagement between 6 PM - 9 PM. Schedule high-priority deals during these hours.',
      impact: 'Expected 30-40% increase in conversions',
      action: 'Set time-based activation for peak hours',
      expectedImprovement: 35
    });

    // Threshold distribution recommendation
    const lowThresholdCount = deals.filter(d => d.threshold_amount < 500).length;
    if (lowThresholdCount < 2) {
      newRecommendations.push({
        id: 'threshold-distribution',
        type: 'threshold',
        priority: 'medium',
        title: 'Add More Low-Threshold Deals',
        description: 'Low-threshold deals (< ₹500) drive higher conversion rates. Consider adding 1-2 more entry-level deals.',
        impact: 'Expected 15-20% increase in overall deal adoption',
        action: 'Create new deals with thresholds below ₹500',
        expectedImprovement: 18
      });
    }

    setRecommendations(newRecommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }));
  }, [deals, advancedAnalytics]);

  // Fetch advanced analytics when deals or date range changes
  useEffect(() => {
    if (deals.length > 0) {
      fetchAdvancedAnalytics();
      loadAbTests();
    }
  }, [deals.length, analyticsDateRange, fetchAdvancedAnalytics]);

  // Generate predictive analytics and recommendations when advanced analytics data is available
  useEffect(() => {
    if (deals.length > 0 && advancedAnalytics.timeSeriesData.length > 0) {
      generatePredictiveAnalytics();
      generateSmartRecommendations();
    }
  }, [deals.length, advancedAnalytics.timeSeriesData.length, advancedAnalytics.dealPerformance.length, generatePredictiveAnalytics, generateSmartRecommendations]);

  // Phase 3: Load A/B Tests
  const loadAbTests = () => {
    // In a real implementation, this would fetch from API
    // For now, we'll use mock data
    setAbTests([
      {
        id: '1',
        name: 'Threshold Test - Pastry Deal',
        variantA: { dealId: 1, threshold: 499, price: 1 },
        variantB: { dealId: 1, threshold: 599, price: 1 },
        status: 'running',
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        trafficSplit: 50,
        results: {
          variantA: { redemptions: 45, revenue: 45, conversionRate: 18.5 },
          variantB: { redemptions: 32, revenue: 32, conversionRate: 12.3 },
          winner: 'A',
          confidence: 87
        }
      }
    ]);
  };

  // Phase 3: Create A/B Test
  const handleCreateAbTest = () => {
    if (!abTestForm.name || !abTestForm.dealId || !abTestForm.startDate || !abTestForm.endDate) {
      showError('Please fill in all required fields: Test Name, Deal, Start Date, and End Date');
      return;
    }
    
    // Validate A/B test dates
    if (new Date(abTestForm.startDate) >= new Date(abTestForm.endDate)) {
      showError('Start date must be before end date');
      return;
    }

    const newTest = {
      id: Date.now().toString(),
      name: abTestForm.name,
      variantA: {
        dealId: abTestForm.dealId,
        threshold: abTestForm.variantAThreshold,
        price: abTestForm.variantAPrice
      },
      variantB: {
        dealId: abTestForm.dealId,
        threshold: abTestForm.variantBThreshold,
        price: abTestForm.variantBPrice
      },
      status: 'draft' as const,
      startDate: abTestForm.startDate,
      endDate: abTestForm.endDate,
      trafficSplit: abTestForm.trafficSplit,
      results: {
        variantA: { redemptions: 0, revenue: 0, conversionRate: 0 },
        variantB: { redemptions: 0, revenue: 0, conversionRate: 0 },
        winner: null,
        confidence: 0
      }
    };

    setAbTests([...abTests, newTest]);
    setShowAbTestModal(false);
    setAbTestForm({
      name: '',
      dealId: 0,
      variantAThreshold: 0,
      variantAPrice: 1,
      variantBThreshold: 0,
      variantBPrice: 1,
      trafficSplit: 50,
      startDate: '',
      endDate: ''
    });
    showSuccess('A/B test created successfully');
  };

  // Phase 3: Save Scheduling
  const handleSaveScheduling = () => {
    if (!schedulingDealId) return;
    if (!schedulingForm.startDate) {
      showError('Start date is required');
      return;
    }

    setDealSchedules({
      ...dealSchedules,
      [schedulingDealId]: {
        isScheduled: true,
        startDate: schedulingForm.startDate,
        endDate: schedulingForm.endDate || null,
        isRecurring: schedulingForm.isRecurring,
        recurrencePattern: schedulingForm.isRecurring ? schedulingForm.recurrencePattern : null,
        recurrenceDays: schedulingForm.recurrenceDays,
        timeSlots: schedulingForm.timeSlots,
        timezone: schedulingForm.timezone
      }
    });

    setShowSchedulingModal(false);
    setSchedulingDealId(null);
    setSchedulingForm({
      startDate: '',
      endDate: '',
      isRecurring: false,
      recurrencePattern: 'daily',
      recurrenceDays: [],
      timeSlots: [],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
    showSuccess('Deal scheduling saved successfully');
  };

  // Backfill historical orders
  const handleBackfill = async (dryRun: boolean = false) => {
    // Validate date range if both dates are provided
    if (backfillDateRange.start && backfillDateRange.end) {
      if (new Date(backfillDateRange.start) > new Date(backfillDateRange.end)) {
        showError('Start date must be before end date');
        return;
      }
    }

    setBackfillLoading(true);
    try {
      const response = await dealService.backfillHistoricalOrders({
        date_from: backfillDateRange.start || undefined,
        date_to: backfillDateRange.end || undefined,
        dry_run: dryRun
      });
      
      if (response.success) {
        setBackfillResult(response.data);
        if (!dryRun) {
          showSuccess(response.message || 'Backfill completed successfully');
          // Refresh analytics after backfill
          fetchAnalytics();
          fetchAdvancedAnalytics();
        } else {
          showSuccess(response.message || 'Dry run completed. Review results before running actual backfill.');
        }
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to backfill historical orders';
      let detailedMessage = errorMessage;
      
      if (error.response?.status) {
        detailedMessage = `${errorMessage} (HTTP ${error.response.status})`;
      } else if (error.message?.includes('Analytics tables do not exist')) {
        detailedMessage = 'Analytics tables do not exist. Please run database migrations first.';
      } else if (error.message?.includes('Network')) {
        detailedMessage = 'Network error: Unable to connect to server. Please check your connection.';
      }
      
      showError(detailedMessage);
      console.error('Error backfilling historical orders:', error);
    } finally {
      setBackfillLoading(false);
    }
  };

  // Handle product search
  useEffect(() => {
    if (productSearchTerm) {
      const timer = setTimeout(() => {
        fetchProducts(productSearchTerm);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      fetchProducts();
    }
  }, [productSearchTerm]);

  // Close product dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target as Node)) {
        setShowProductDropdown(false);
      }
    };

    if (showProductDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProductDropdown]);

  // Reset form
  const resetForm = () => {
    setFormData({
      deal_title: '',
      product_id: 0,
      threshold_amount: 0,
      deal_price: 1.00,
      max_quantity_per_order: 1,
      priority: 0,
      is_active: true,
      description: ''
    });
    setProductSearchTerm('');
    setEditingId(null);
  };

  // Handle add
  const handleAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  // Handle edit
  const handleEdit = (deal: Deal) => {
    setFormData({
      deal_title: deal.deal_title,
      product_id: deal.product_id,
      threshold_amount: deal.threshold_amount,
      deal_price: deal.deal_price,
      max_quantity_per_order: deal.max_quantity_per_order,
      priority: deal.priority,
      is_active: deal.is_active,
      description: deal.description || ''
    });
    setProductSearchTerm(deal.product?.name || '');
    setEditingId(deal.id);
    setShowEditModal(true);
  };

  // Handle delete
  const handleDelete = (deal: Deal) => {
    setDeletingId(deal.id);
    setShowDeleteModal(true);
  };

  // Handle save (create)
  const handleSave = async () => {
    if (!formData.deal_title.trim()) {
      showError('Deal title is required');
      return;
    }
    if (!formData.product_id || formData.product_id === 0) {
      showError('Please select a product');
      return;
    }
    if (!formData.threshold_amount || formData.threshold_amount <= 0) {
      showError('Threshold amount must be greater than 0');
      return;
    }

    setActionLoading('save');
    try {
      const response = await dealService.createDeal(formData);
      if (response.success) {
        showSuccess('Deal created successfully');
        setShowAddModal(false);
        resetForm();
        fetchDeals();
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create deal';
      const detailedMessage = error.response?.status 
        ? `${errorMessage} (HTTP ${error.response.status})`
        : errorMessage;
      showError(detailedMessage);
      console.error('Error creating deal:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle update
  const handleUpdate = async () => {
    if (!editingId) return;
    if (!formData.deal_title.trim()) {
      showError('Deal title is required');
      return;
    }
    if (!formData.product_id || formData.product_id === 0) {
      showError('Please select a product');
      return;
    }
    if (!formData.threshold_amount || formData.threshold_amount <= 0) {
      showError('Threshold amount must be greater than 0');
      return;
    }

    setActionLoading('update');
    try {
      const updateData: UpdateDealData = {
        deal_title: formData.deal_title,
        product_id: formData.product_id,
        threshold_amount: formData.threshold_amount,
        deal_price: formData.deal_price,
        max_quantity_per_order: formData.max_quantity_per_order,
        priority: formData.priority,
        is_active: formData.is_active,
        description: formData.description || undefined
      };
      const response = await dealService.updateDeal(editingId, updateData);
      if (response.success) {
        showSuccess('Deal updated successfully');
        setShowEditModal(false);
        setEditingId(null);
        resetForm();
        fetchDeals();
      }
    } catch (error: any) {
      showError(error.message || 'Failed to update deal');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setActionLoading('delete');
    try {
      const response = await dealService.deleteDeal(deletingId);
      if (response.success) {
        showSuccess('Deal deleted successfully');
        setShowDeleteModal(false);
        setDeletingId(null);
        fetchDeals();
      }
    } catch (error: any) {
      showError(error.message || 'Failed to delete deal');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (id: number) => {
    setActionLoading(`toggle-${id}`);
    try {
      const response = await dealService.toggleDealStatus(id);
      if (response.success) {
        showSuccess(response.message || 'Status updated successfully');
        fetchDeals();
      }
    } catch (error: any) {
      showError(error.message || 'Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle priority change
  const handlePriorityChange = async (id: number, direction: 'up' | 'down') => {
    const deal = deals.find(d => d.id === id);
    if (!deal) return;

    // Use filteredAndSortedDeals to get correct index when filters are active
    const currentIndex = filteredAndSortedDeals.findIndex(d => d.id === id);
    if (currentIndex === -1) return;

    let newPriority = deal.priority;
    if (direction === 'up' && currentIndex > 0) {
      const prevDeal = filteredAndSortedDeals[currentIndex - 1];
      newPriority = prevDeal.priority - 1;
    } else if (direction === 'down' && currentIndex < filteredAndSortedDeals.length - 1) {
      const nextDeal = filteredAndSortedDeals[currentIndex + 1];
      newPriority = nextDeal.priority + 1;
    } else {
      return; // Can't move further
    }

    setActionLoading(`priority-${id}`);
    try {
      await dealService.updateDeal(id, { priority: newPriority });
      fetchDeals();
    } catch (error: any) {
      showError(error.message || 'Failed to update priority');
    } finally {
      setActionLoading(null);
    }
  };

  // Select product
  const selectProduct = (product: Product) => {
    setFormData({ ...formData, product_id: product.id as number });
    setProductSearchTerm(product.name);
    setShowProductDropdown(false);
  };

  // Get selected product
  // const selectedProduct = products.find(p => p.id === formData.product_id); // Reserved for future use

  // Filter and sort deals
  const filteredAndSortedDeals = useMemo(() => {
    let filtered = deals.filter(deal => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          deal.deal_title.toLowerCase().includes(searchLower) ||
          deal.product?.name.toLowerCase().includes(searchLower) ||
          deal.threshold_amount.toString().includes(searchTerm);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter === 'active' && !deal.is_active) return false;
      if (statusFilter === 'inactive' && deal.is_active) return false;

      // Threshold filter
      if (thresholdFilter !== 'all') {
        const threshold = deal.threshold_amount;
        switch (thresholdFilter) {
          case 'low':
            if (threshold >= 500) return false;
            break;
          case 'medium':
            if (threshold < 500 || threshold >= 1000) return false;
            break;
          case 'high':
            if (threshold < 1000) return false;
            break;
        }
      }

      return true;
    });

    // Sort deals
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'priority':
          aValue = a.priority;
          bValue = b.priority;
          break;
        case 'threshold':
          aValue = a.threshold_amount;
          bValue = b.threshold_amount;
          break;
        case 'title':
          aValue = a.deal_title.toLowerCase();
          bValue = b.deal_title.toLowerCase();
          break;
        case 'price':
          aValue = a.deal_price;
          bValue = b.deal_price;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [deals, searchTerm, statusFilter, thresholdFilter, sortBy, sortOrder]);

  // Calculate deal stats
  const dealStats = useMemo(() => {
    return {
      total: deals.length,
      active: deals.filter(d => d.is_active).length,
      inactive: deals.filter(d => !d.is_active).length,
      lowThreshold: deals.filter(d => d.threshold_amount < 500).length,
      mediumThreshold: deals.filter(d => d.threshold_amount >= 500 && d.threshold_amount < 1000).length,
      highThreshold: deals.filter(d => d.threshold_amount >= 1000).length
    };
  }, [deals]);

  const getStatusFilterLabel = () => {
    const labels: { [key: string]: string } = {
      all: 'All Status',
      active: 'Active',
      inactive: 'Inactive'
    };
    return labels[statusFilter] || 'All Status';
  };

  const getThresholdFilterLabel = () => {
    const labels: { [key: string]: string } = {
      all: 'All Thresholds',
      low: 'Low (< ₹500)',
      medium: 'Medium (₹500-999)',
      high: 'High (₹1000+)'
    };
    return labels[thresholdFilter] || 'All Thresholds';
  };

  const getSortLabel = () => {
    const labels: { [key: string]: string } = {
      priority: 'Priority',
      threshold: 'Threshold',
      title: 'Title',
      price: 'Price'
    };
    return `Sort: ${labels[sortBy] || 'Priority'}`;
  };

  // Export to CSV
  const handleExport = () => {
    const headers = ['Deal Title', 'Product', 'Threshold (₹)', 'Deal Price (₹)', 'Max Quantity', 'Priority', 'Status', 'Created At'];
    const rows = filteredAndSortedDeals.map(deal => [
      deal.deal_title,
      deal.product?.name || 'N/A',
      deal.threshold_amount.toFixed(0),
      deal.deal_price.toFixed(2),
      deal.max_quantity_per_order,
      deal.priority,
      deal.is_active ? 'Active' : 'Inactive',
      new Date(deal.created_at).toLocaleString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deals-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Define table columns
  const dealColumns: TableColumn[] = [
    {
      key: 'deal_title',
      label: 'Deal Title',
      sortable: true,
      render: (value: any, item: Deal) => (
        <div className="font-semibold text-gray-900 dark:text-gray-100">{value}</div>
      )
    },
    {
      key: 'product',
      label: 'Product',
      render: (value: any, item: Deal) => (
        <div className="flex items-center gap-2">
          {item.product?.image_url && (
            <img
              src={resolveImageUrl(item.product.image_url)}
              alt={item.product.name}
              className="w-8 h-8 rounded object-cover"
            />
          )}
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {item.product?.name || 'N/A'}
          </span>
        </div>
      )
    },
    {
      key: 'threshold_amount',
      label: 'Threshold',
      sortable: true,
      render: (value: any) => (
        <div className="font-semibold text-pink-600 dark:text-pink-400">
          ₹{parseFloat(value as string).toFixed(0)}
        </div>
      )
    },
    {
      key: 'deal_price',
      label: 'Deal Price',
      render: (value: any) => (
        <div className="font-semibold text-green-600 dark:text-green-400">
          ₹{parseFloat(value as string).toFixed(2)}
        </div>
      )
    },
    {
      key: 'priority',
      label: 'Order',
      render: (value: any, item: Deal) => {
        const currentIndex = filteredAndSortedDeals.findIndex(d => d.id === item.id);
        return (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePriorityChange(item.id, 'up')}
              disabled={currentIndex === 0 || actionLoading === `priority-${item.id}`}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50"
            >
              <ArrowUp className="w-3 h-3 text-gray-600 dark:text-gray-400" />
            </button>
            <span className="text-sm font-medium dark:text-gray-300">{item.priority}</span>
            <button
              onClick={() => handlePriorityChange(item.id, 'down')}
              disabled={currentIndex === filteredAndSortedDeals.length - 1 || actionLoading === `priority-${item.id}`}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50"
            >
              <ArrowDown className="w-3 h-3 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        );
      }
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (value: any, item: Deal) => (
        <button
          onClick={() => handleToggleStatus(item.id)}
          disabled={actionLoading === `toggle-${item.id}`}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
            item.is_active
              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          {item.is_active ? (
            <>
              <CheckCircle className="w-3 h-3" />
              Active
            </>
          ) : (
            <>
              <XCircle className="w-3 h-3" />
              Inactive
            </>
          )}
        </button>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, item: Deal) => (
        <div className="flex items-center gap-2">
          <DashboardTooltip text="Edit Deal">
            <button
              onClick={() => handleEdit(item)}
              className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
          </DashboardTooltip>
          <DashboardTooltip text="Delete Deal">
            <button
              onClick={() => handleDelete(item)}
              className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </DashboardTooltip>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="w-full px-3 sm:px-4 lg:px-6">
          <div className="py-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">₹1 Deals Configuration</h1>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  Manage promotional deals that unlock at specific cart thresholds
                </p>
              </div>
              <Button 
                onClick={handleAdd} 
                className="group relative overflow-hidden bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 hover:from-pink-700 hover:via-rose-700 hover:to-pink-700 text-white font-semibold px-4 sm:px-6 py-2.5 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-pink-500/30 hover:border-pink-400/50 flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <Gift className="w-4 h-4 relative z-10" />
                <Plus className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Add Deal</span>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-7">
              <Card>
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Total Deals</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none mt-0.5">
                        {loading ? '...' : dealStats.total}
                      </p>
                    </div>
                    <Gift className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Active Deals</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400 leading-none mt-0.5">
                        {dealStats.active}
                      </p>
                    </div>
                    <CheckCircle className="w-4 h-4 text-green-400 dark:text-green-500 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Total Redemptions</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 leading-none mt-0.5">
                        {analytics.totalRedemptions}
                      </p>
                      {analytics.todayRedemptions > 0 && (
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-none mt-0.5">
                          Today: {analytics.todayRedemptions}
                        </p>
                      )}
                    </div>
                    <ShoppingCart className="w-4 h-4 text-blue-400 dark:text-blue-500 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Revenue Generated</p>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 leading-none mt-0.5">
                        ₹{analytics.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <DollarSign className="w-4 h-4 text-purple-400 dark:text-purple-500 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Avg Cart Value</p>
                      <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 leading-none mt-0.5">
                        ₹{analytics.averageCartValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <BarChart3 className="w-4 h-4 text-indigo-400 dark:text-indigo-500 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Low Threshold</p>
                      <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 leading-none mt-0.5">
                        {dealStats.lowThreshold}
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-none mt-0.5">
                        &lt; ₹500
                      </p>
                    </div>
                    <TrendingDown className="w-4 h-4 text-yellow-400 dark:text-yellow-500 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">High Threshold</p>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 leading-none mt-0.5">
                        {dealStats.highThreshold}
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-none mt-0.5">
                        ₹1000+
                      </p>
                    </div>
                    <TrendingUp className="w-4 h-4 text-orange-400 dark:text-orange-500 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full px-3 sm:px-4 lg:px-6 py-4 space-y-4">
        {/* Enhanced Filters and Quick Actions */}
        <Card className="overflow-visible border border-primary-100/50 dark:border-primary-800/30 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Filters & Actions
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <DashboardTooltip text="Refresh Data">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    fetchDeals();
                    fetchAnalytics();
                  }}
                  className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </DashboardTooltip>
              <DashboardTooltip text="View Website">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open('/', '_blank')}
                  className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </DashboardTooltip>
              <DashboardTooltip text="Export CSV">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExport}
                  className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </DashboardTooltip>
              <DashboardTooltip text={viewMode === 'table' ? 'Switch to Grid View' : 'Switch to Table View'}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
                  className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                >
                  {viewMode === 'table' ? <Grid3x3 className="h-4 w-4" /> : <List className="h-4 w-4" />}
                </Button>
              </DashboardTooltip>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 md:p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <Input
                  placeholder="Search deals by title, product, or threshold..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 dark:border-gray-600 focus:border-primary-500 dark:focus:border-primary-400"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="relative" ref={statusDropdownRef}>
              <DashboardTooltip text="Filter by Status">
                <button
                  onClick={() => {
                    setShowStatusDropdown(!showStatusDropdown);
                    setShowThresholdDropdown(false);
                    setShowSortDropdown(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors min-w-[140px] justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    {getStatusFilterLabel()}
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} />
                </button>
              </DashboardTooltip>
              {showStatusDropdown && (
                <div className="absolute z-[9999] mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl">
                  {['all', 'active', 'inactive'].map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setStatusFilter(status);
                        setShowStatusDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg ${
                        statusFilter === status ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Threshold Filter */}
            <div className="relative" ref={thresholdDropdownRef}>
              <DashboardTooltip text="Filter by Threshold Range">
                <button
                  onClick={() => {
                    setShowThresholdDropdown(!showThresholdDropdown);
                    setShowStatusDropdown(false);
                    setShowSortDropdown(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors min-w-[160px] justify-between"
                >
                  <span className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    {getThresholdFilterLabel()}
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showThresholdDropdown ? 'rotate-180' : ''}`} />
                </button>
              </DashboardTooltip>
              {showThresholdDropdown && (
                <div className="absolute z-[9999] mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl">
                  {['all', 'low', 'medium', 'high'].map((threshold) => (
                    <button
                      key={threshold}
                      onClick={() => {
                        setThresholdFilter(threshold);
                        setShowThresholdDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg ${
                        thresholdFilter === threshold ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {getThresholdFilterLabel() === threshold ? '✓ ' : ''}
                      {threshold === 'all' ? 'All Thresholds' : threshold === 'low' ? 'Low (< ₹500)' : threshold === 'medium' ? 'Medium (₹500-999)' : 'High (₹1000+)'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sort */}
            <div className="relative" ref={sortDropdownRef}>
              <DashboardTooltip text="Sort Deals">
                <button
                  onClick={() => {
                    setShowSortDropdown(!showSortDropdown);
                    setShowStatusDropdown(false);
                    setShowThresholdDropdown(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors min-w-[140px] justify-between"
                >
                  <span className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4" />
                    {getSortLabel()}
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
                </button>
              </DashboardTooltip>
              {showSortDropdown && (
                <div className="absolute z-[9999] mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl">
                  {['priority', 'threshold', 'title', 'price'].map((sort) => (
                    <div key={sort} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                        {sort === 'priority' ? 'Priority' : sort === 'threshold' ? 'Threshold' : sort === 'title' ? 'Title' : 'Price'}
                      </div>
                      <button
                        onClick={() => {
                          if (sortBy === sort) {
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                          } else {
                            setSortBy(sort);
                            setSortOrder('asc');
                          }
                          setShowSortDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between"
                      >
                        <span>Sort by {sort === 'priority' ? 'Priority' : sort === 'threshold' ? 'Threshold' : sort === 'title' ? 'Title' : 'Price'}</span>
                        {sortBy === sort && (
                          <span className="text-primary-600 dark:text-primary-400">
                            {sortOrder === 'asc' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                          </span>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Analytics Dashboard */}
      {showAnalytics && (
        <div className="space-y-4 sm:space-y-5 md:space-y-6">
          {/* Analytics Header */}
          <Card className="overflow-visible border border-primary-100/50 dark:border-primary-800/30 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    Analytics & Insights
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Performance metrics and deal redemption trends
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <DateRangePicker
                    startDate={analyticsDateRange.start || null}
                    endDate={analyticsDateRange.end || null}
                    onChange={(start, end) => {
                      if (start && end) {
                        // Validate that start date is before end date
                        if (new Date(start) > new Date(end)) {
                          showError('Start date must be before end date');
                          return;
                        }
                        setAnalyticsDateRange({ start, end });
                        // Analytics will refresh automatically via useEffect dependency on analyticsDateRange
                      } else if (!start && !end) {
                        // Reset to default (last 30 days) if cleared
                        const today = new Date();
                        const thirtyDaysAgo = new Date();
                        thirtyDaysAgo.setDate(today.getDate() - 30);
                        setAnalyticsDateRange({
                          start: thirtyDaysAgo.toISOString().split('T')[0],
                          end: today.toISOString().split('T')[0]
                        });
                      }
                    }}
                    className="flex-shrink-0"
                  />
                  <DashboardTooltip text="Backfill historical orders into analytics">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowBackfillModal(true)}
                      className="h-7 px-2 text-xs"
                      title="Backfill historical data (will setup tables if needed)"
                      disabled={analyticsLoading}
                    >
                      <Database className="w-3.5 h-3.5 mr-1" />
                      {analyticsLoading ? 'Processing...' : 'Backfill'}
                    </Button>
                  </DashboardTooltip>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      fetchAnalytics();
                      fetchAdvancedAnalytics();
                    }}
                    className="h-7 w-7 p-0"
                    title="Refresh analytics"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAnalytics(false)}
                    className="text-gray-600 dark:text-gray-400"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Analytics Charts - Simplified like Promo Codes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
            {/* Redemptions & Revenue Over Time */}
            <Card className="border border-primary-100/50 dark:border-primary-800/30 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold dark:text-white">Redemptions & Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="h-[200px] flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-600 dark:text-primary-400" />
                  </div>
                ) : advancedAnalytics.timeSeriesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={advancedAnalytics.timeSeriesData}>
                      <defs>
                        <linearGradient id="colorRedemptions" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 10, fill: '#6b7280' }}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return `${date.getDate()}/${date.getMonth() + 1}`;
                        }}
                      />
                      <YAxis 
                        yAxisId="left" 
                        tick={{ fontSize: 10, fill: '#6b7280' }}
                      />
                      <YAxis 
                        yAxisId="right" 
                        orientation="right" 
                        tick={{ fontSize: 10, fill: '#6b7280' }}
                      />
                      <RechartsTooltip 
                        contentStyle={{ 
                          fontSize: '12px', 
                          padding: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.98)',
                          color: '#111827',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
                        }}
                        labelFormatter={(label) => new Date(label).toLocaleDateString()}
                      />
                      <Legend />
                      <Area 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="redemptions" 
                        stroke="#ec4899" 
                        fillOpacity={1}
                        fill="url(#colorRedemptions)"
                        strokeWidth={2}
                        name="Redemptions"
                      />
                      <Area 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#10b981" 
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        strokeWidth={2}
                        name="Revenue (₹)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex flex-col items-center justify-center text-sm text-gray-500">
                    <BarChart3 className="w-8 h-8 text-gray-300 mb-2" />
                    <p className="font-medium">No data available</p>
                    <p className="text-xs text-gray-400 mt-1 text-center px-4">
                      Analytics data will appear here once deals are redeemed by customers
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Performing Deals */}
            <Card className="border border-primary-100/50 dark:border-primary-800/30 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold dark:text-white">Top Performing Deals</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="h-[200px] flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-600 dark:text-primary-400" />
                  </div>
                ) : advancedAnalytics.topDeals.length > 0 ? (
                  <div className="space-y-2">
                    {advancedAnalytics.topDeals.slice(0, 5).map((deal: any, index: number) => {
                      const dealObj = deals.find(d => d.id === deal.dealId);
                      return (
                        <div key={deal.dealId || index} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 w-4">{index + 1}</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{deal.dealTitle || dealObj?.product?.name || 'Unknown Deal'}</p>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                Threshold: ₹{dealObj?.threshold_amount?.toFixed(0) || 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right ml-2">
                            <p className="text-xs font-bold text-pink-600 dark:text-pink-400">{deal.redemptions || 0}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">redemptions</p>
                            {deal.revenue > 0 && (
                              <p className="text-[10px] text-green-600 dark:text-green-400 mt-0.5">₹{deal.revenue.toFixed(0)}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-[200px] flex flex-col items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                    <TrendingUp className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="font-medium dark:text-gray-300">No top performers yet</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-center px-4">
                      Top performing deals will appear here once they start generating redemptions
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Toggle Analytics Button */}
      {!showAnalytics && (
        <Card className="border border-primary-100/50 dark:border-primary-800/30 shadow-sm">
          <CardContent className="p-4">
            <Button
              onClick={() => setShowAnalytics(true)}
              className="w-full flex items-center justify-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Show Advanced Analytics
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Phase 3: Advanced Features */}
      {showAdvancedFeatures && (
        <div className="space-y-4 sm:space-y-5 md:space-y-6">
          {/* Advanced Features Header */}
          <Card className="overflow-hidden border border-primary-100/50 dark:border-primary-800/30 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Rocket className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    Advanced Features (Phase 3)
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Predictive analytics, A/B testing, smart recommendations, and advanced scheduling
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvancedFeatures(false)}
                  className="text-gray-600 dark:text-gray-400"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Tabs */}
              <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                {[
                  { id: 'predictive', label: 'Predictive Analytics', icon: Brain },
                  { id: 'ab-testing', label: 'A/B Testing', icon: TestTube },
                  { id: 'recommendations', label: 'Smart Recommendations', icon: Wand2 },
                  { id: 'scheduling', label: 'Advanced Scheduling', icon: CalendarDays }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as typeof activeTab)}
                      className={`flex items-center gap-2 px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'border-primary-600 dark:border-primary-400 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                      <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab Content */}
              <div className="p-4 sm:p-5 md:p-6">
                {/* Predictive Analytics Tab */}
                {activeTab === 'predictive' && (
                  <div className="space-y-4 sm:space-y-5 md:space-y-6">
                    {/* Forecast Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Optimal Threshold</p>
                              <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                                ₹{predictiveData.optimalThreshold.toFixed(0)}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                                Based on performance
                              </p>
                            </div>
                            <div className="p-2.5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-sm">
                              <Target className="h-5 w-5 text-white" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Recommended Threshold</p>
                              <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                                ₹{predictiveData.recommendedThreshold.toFixed(0)}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                                For better conversion
                              </p>
                            </div>
                            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm">
                              <Lightbulb className="h-5 w-5 text-white" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Trend Direction</p>
                              <p className="text-xl font-bold text-gray-900 dark:text-white mt-1 flex items-center gap-1">
                                {predictiveData.trendDirection === 'up' ? (
                                  <>
                                    <TrendingUpIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    Upward
                                  </>
                                ) : predictiveData.trendDirection === 'down' ? (
                                  <>
                                    <TrendingDownIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                                    Downward
                                  </>
                                ) : (
                                  <>
                                    <Activity className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                    Stable
                                  </>
                                )}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                                {predictiveData.confidence}% confidence
                              </p>
                            </div>
                            <div className="p-2.5 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-sm">
                              <LineChartIcon2 className="h-5 w-5 text-white" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">7-Day Forecast</p>
                              <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                                {predictiveData.forecastRedemptions.reduce((sum, d) => sum + d.predicted, 0)}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                                Expected redemptions
                              </p>
                            </div>
                            <div className="p-2.5 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-sm">
                              <BarChart2 className="h-5 w-5 text-white" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Forecast Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                      <Card className="border border-primary-100/50 dark:border-primary-800/30 shadow-sm">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
                          <CardTitle className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <LineChartIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                            Redemptions Forecast (Next 7 Days)
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-5">
                          {predictiveData.forecastRedemptions.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                              <LineChart data={predictiveData.forecastRedemptions}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                                <XAxis 
                                  dataKey="date" 
                                  tick={{ fontSize: 11, fill: '#6b7280' }}
                                  tickFormatter={(value) => {
                                    const date = new Date(value);
                                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                  }}
                                />
                                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                                <RechartsTooltip 
                                  contentStyle={{ 
                                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                                    color: '#111827',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    fontSize: '12px'
                                  }}
                                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                                  formatter={(value: any, name: string | undefined, props: any) => [
                                    `${value} (${props.payload?.confidence ?? 0}% confidence)`,
                                    'Predicted'
                                  ]}
                                />
                                <Legend />
                                <Line 
                                  type="monotone" 
                                  dataKey="predicted" 
                                  stroke="#ec4899" 
                                  strokeWidth={2}
                                  dot={{ fill: '#ec4899', r: 4 }}
                                  name="Predicted Redemptions"
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
                              Generating forecast...
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Card className="border border-primary-100/50 dark:border-primary-800/30 shadow-sm">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
                          <CardTitle className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                            Revenue Forecast (Next 7 Days)
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-5">
                          {predictiveData.forecastRevenue.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                              <LineChart data={predictiveData.forecastRevenue}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                                <XAxis 
                                  dataKey="date" 
                                  tick={{ fontSize: 11, fill: '#6b7280' }}
                                  tickFormatter={(value) => {
                                    const date = new Date(value);
                                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                  }}
                                />
                                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                                <RechartsTooltip 
                                  contentStyle={{ 
                                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                                    color: '#111827',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    fontSize: '12px'
                                  }}
                                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                                  formatter={(value: any) => [`₹${value}`, 'Predicted Revenue']}
                                />
                                <Legend />
                                <Line 
                                  type="monotone" 
                                  dataKey="predicted" 
                                  stroke="#10b981" 
                                  strokeWidth={2}
                                  dot={{ fill: '#10b981', r: 4 }}
                                  name="Predicted Revenue"
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
                              Generating forecast...
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {/* A/B Testing Tab */}
                {activeTab === 'ab-testing' && (
                  <div className="space-y-4 sm:space-y-5 md:space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">A/B Tests</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Test different deal configurations to optimize performance</p>
                      </div>
                      <Button onClick={() => setShowAbTestModal(true)} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Create A/B Test
                      </Button>
                    </div>

                    {abTests.length === 0 ? (
                      <Card className="border border-gray-200 dark:border-gray-700">
                        <CardContent className="p-12 text-center">
                          <TestTube className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 dark:text-gray-400 mb-4">No A/B tests created yet</p>
                          <Button onClick={() => setShowAbTestModal(true)} className="flex items-center gap-2 mx-auto">
                            <Plus className="h-4 w-4" />
                            Create Your First A/B Test
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-4">
                        {abTests.map((test) => (
                          <Card key={test.id} className="border border-gray-200 dark:border-gray-700 shadow-sm">
                            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
                              <div className="flex items-center justify-between">
                                <div>
                                  <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">{test.name}</CardTitle>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    {new Date(test.startDate).toLocaleDateString()} - {new Date(test.endDate).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                    test.status === 'running' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                    test.status === 'completed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                                    test.status === 'paused' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                    'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                  }`}>
                                    {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
                                  </span>
                                  {test.status === 'running' && (
                                    <Button variant="ghost" size="sm">
                                      <Pause className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-5">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                  <div className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-2">Variant A ({test.trafficSplit}%)</div>
                                  <div className="text-sm text-gray-700 dark:text-gray-300">
                                    <div>Threshold: ₹{test.variantA.threshold}</div>
                                    <div>Price: ₹{test.variantA.price.toFixed(2)}</div>
                                  </div>
                                  {test.results.variantA.redemptions > 0 && (
                                    <div className="mt-2 text-xs dark:text-gray-300">
                                      <div>Redemptions: {test.results.variantA.redemptions}</div>
                                      <div>Conversion: {test.results.variantA.conversionRate.toFixed(1)}%</div>
                                    </div>
                                  )}
                                </div>
                                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                  <div className="text-xs font-semibold text-purple-900 dark:text-purple-300 mb-2">Variant B ({100 - test.trafficSplit}%)</div>
                                  <div className="text-sm text-gray-700 dark:text-gray-300">
                                    <div>Threshold: ₹{test.variantB.threshold}</div>
                                    <div>Price: ₹{test.variantB.price.toFixed(2)}</div>
                                  </div>
                                  {test.results.variantB.redemptions > 0 && (
                                    <div className="mt-2 text-xs dark:text-gray-300">
                                      <div>Redemptions: {test.results.variantB.redemptions}</div>
                                      <div>Conversion: {test.results.variantB.conversionRate.toFixed(1)}%</div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {test.results.winner && (
                                <div className={`p-3 rounded-lg border-l-4 ${
                                  test.results.winner === 'A' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-400' :
                                  test.results.winner === 'B' ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-500 dark:border-purple-400' :
                                  'bg-gray-50 dark:bg-gray-800 border-gray-500 dark:border-gray-600'
                                }`}>
                                  <div className="flex items-center gap-2">
                                    <Trophy className={`h-4 w-4 ${
                                      test.results.winner === 'A' ? 'text-blue-600 dark:text-blue-400' :
                                      test.results.winner === 'B' ? 'text-purple-600 dark:text-purple-400' :
                                      'text-gray-600 dark:text-gray-400'
                                    }`} />
                                    <span className="font-semibold text-sm dark:text-white">
                                      {test.results.winner === 'tie' ? 'Tie - No clear winner' : `Variant ${test.results.winner} is winning`}
                                    </span>
                                    <span className="text-xs text-gray-600 dark:text-gray-400">
                                      ({test.results.confidence}% confidence)
                                    </span>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Smart Recommendations Tab */}
                {activeTab === 'recommendations' && (
                  <div className="space-y-4 sm:space-y-5 md:space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Wand2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        AI-Powered Recommendations
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Smart suggestions to optimize your deals based on performance data
                      </p>
                    </div>

                    {recommendations.length === 0 ? (
                      <Card className="border border-gray-200 dark:border-gray-700">
                        <CardContent className="p-12 text-center">
                          <Wand2 className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                          <p className="text-gray-600 dark:text-gray-400">No recommendations available yet. Generate analytics first.</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-3">
                        {recommendations.map((rec) => {
                          const priorityColors = {
                            high: 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/10 border-red-500',
                            medium: 'from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/10 border-yellow-500',
                            low: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 border-blue-500'
                          };
                          const iconColors = {
                            high: 'text-red-600 dark:text-red-400',
                            medium: 'text-yellow-600 dark:text-yellow-400',
                            low: 'text-blue-600 dark:text-blue-400'
                          };
                          return (
                            <Card key={rec.id} className={`border-l-4 ${priorityColors[rec.priority]}`}>
                              <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                  <div className={`p-2 rounded-lg bg-white dark:bg-gray-800 ${iconColors[rec.priority]}`}>
                                    {rec.type === 'threshold' && <DollarSign className="h-5 w-5" />}
                                    {rec.type === 'price' && <TrendingUp className="h-5 w-5" />}
                                    {rec.type === 'timing' && <ClockIcon className="h-5 w-5" />}
                                    {rec.type === 'product' && <Package className="h-5 w-5" />}
                                    {rec.type === 'priority' && <ArrowUp className="h-5 w-5" />}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                      <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{rec.title}</h4>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{rec.description}</p>
                                        <div className="flex flex-wrap items-center gap-3 text-xs">
                                          <span className="px-2 py-1 bg-white dark:bg-gray-800 rounded text-gray-700 dark:text-gray-300">
                                            Impact: {rec.impact}
                                          </span>
                                          {rec.expectedImprovement && (
                                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded font-semibold">
                                              +{rec.expectedImprovement.toFixed(0)}% improvement
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                          rec.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                                          rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                          'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                        }`}>
                                          {rec.priority.toUpperCase()}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                      <div className="flex items-center gap-2">
                                        <Button size="sm" variant="secondary" className="text-xs">
                                          <CheckCircle2 className="h-3 w-3 mr-1" />
                                          Apply Recommendation
                                        </Button>
                                        <Button size="sm" variant="ghost" className="text-xs">
                                          <X className="h-3 w-3 mr-1" />
                                          Dismiss
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Advanced Scheduling Tab */}
                {activeTab === 'scheduling' && (
                  <div className="space-y-4 sm:space-y-5 md:space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <CalendarDays className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                        Deal Scheduling
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Schedule deals to activate/deactivate automatically at specific times
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {deals.map((deal) => {
                        const schedule = dealSchedules[deal.id];
                        return (
                          <Card key={deal.id} className="border border-gray-200 dark:border-gray-700">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900 dark:text-white">{deal.deal_title}</h4>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Threshold: ₹{deal.threshold_amount.toFixed(0)}</p>
                                </div>
                                {schedule?.isScheduled && (
                                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold flex items-center gap-1">
                                    <ClockIcon className="h-3 w-3" />
                                    Scheduled
                                  </span>
                                )}
                              </div>
                              {schedule?.isScheduled ? (
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                    <CalendarIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                    <span>
                                      {schedule.startDate ? new Date(schedule.startDate).toLocaleString() : 'Not set'} - 
                                      {schedule.endDate ? new Date(schedule.endDate).toLocaleString() : ' No end date'}
                                    </span>
                                  </div>
                                  {schedule.isRecurring && (
                                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                      <Repeat className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                      <span>Recurring: {schedule.recurrencePattern}</span>
                                    </div>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => {
                                      setSchedulingDealId(deal.id);
                                      setSchedulingForm({
                                        startDate: schedule.startDate || '',
                                        endDate: schedule.endDate || '',
                                        isRecurring: schedule.isRecurring || false,
                                        recurrencePattern: schedule.recurrencePattern || 'daily',
                                        recurrenceDays: schedule.recurrenceDays || [],
                                        timeSlots: schedule.timeSlots || [],
                                        timezone: schedule.timezone
                                      });
                                      setShowSchedulingModal(true);
                                    }}
                                    className="w-full mt-2"
                                  >
                                    <Edit className="h-3 w-3 mr-1" />
                                    Edit Schedule
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => {
                                    setSchedulingDealId(deal.id);
                                    setSchedulingForm({
                                      startDate: '',
                                      endDate: '',
                                      isRecurring: false,
                                      recurrencePattern: 'daily',
                                      recurrenceDays: [],
                                      timeSlots: [],
                                      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                                    });
                                    setShowSchedulingModal(true);
                                  }}
                                  className="w-full"
                                >
                                  <CalendarIcon className="h-3 w-3 mr-1" />
                                  Schedule Deal
                                </Button>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Toggle Advanced Features Button */}
      {!showAdvancedFeatures && (
        <Card className="border border-primary-100/50 dark:border-primary-800/30 shadow-sm">
          <CardContent className="p-4">
            <Button
              onClick={() => setShowAdvancedFeatures(true)}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Rocket className="h-4 w-4" />
              Show Advanced Features (Phase 3)
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Deals Table/Grid */}
      <Card className="overflow-hidden border border-primary-100/50 dark:border-primary-800/30 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            All Deals ({filteredAndSortedDeals.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-pink-600 dark:text-pink-400" />
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading deals...</span>
            </div>
          ) : viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <Table
                columns={dealColumns}
                data={filteredAndSortedDeals}
                emptyMessage="No deals found. Click 'Add Deal' to create one."
              />
            </div>
          ) : (
            <div className="p-4 sm:p-5 md:p-6">
              {filteredAndSortedDeals.length === 0 ? (
                <div className="text-center py-12">
                  <Gift className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No deals found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredAndSortedDeals.map((deal, index) => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onToggleStatus={handleToggleStatus}
                      onPriorityChange={handlePriorityChange}
                      actionLoading={actionLoading}
                      currentIndex={index}
                      totalDeals={filteredAndSortedDeals.length}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title="Add ₹1 Deal"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Deal Title *
            </label>
            <Input
              type="text"
              value={formData.deal_title}
              onChange={(e) => setFormData({ ...formData, deal_title: e.target.value })}
              placeholder="e.g., Pastry ₹1 Deal"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Product *
            </label>
            <div className="relative" ref={productDropdownRef}>
              <Input
                type="text"
                value={productSearchTerm}
                onChange={(e) => {
                  setProductSearchTerm(e.target.value);
                  setShowProductDropdown(true);
                }}
                onFocus={() => setShowProductDropdown(true)}
                placeholder="Search and select product..."
              />
              {showProductDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {products
                    .filter(p => p.is_active)
                    .map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => selectProduct(product)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
                      >
                        {product.image_url && (
                          <img
                            src={resolveImageUrl(product.image_url)}
                            alt={product.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                        )}
                        <div>
                          <div className="font-medium text-sm dark:text-gray-200">{product.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            ₹{product.discounted_price || product.base_price}
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cart Amount Cutoff (₹) *
            </label>
            <Input
              type="number"
              value={formData.threshold_amount || ''}
              onChange={(e) => setFormData({ ...formData, threshold_amount: parseFloat(e.target.value) || 0 })}
              placeholder="e.g., 499"
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Deal Price (₹)
            </label>
            <Input
              type="number"
              value={formData.deal_price || ''}
              onChange={(e) => setFormData({ ...formData, deal_price: parseFloat(e.target.value) || 1.00 })}
              placeholder="1.00"
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Max Quantity Per Order
            </label>
            <Input
              type="number"
              value={formData.max_quantity_per_order || ''}
              onChange={(e) => setFormData({ ...formData, max_quantity_per_order: parseInt(e.target.value) || 1 })}
              placeholder="1"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Priority (Display Order)
            </label>
            <Input
              type="number"
              value={formData.priority || ''}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
              placeholder="0"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Internal notes..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-gray-100"
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-pink-600 rounded focus:ring-pink-500"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Active
            </label>
          </div>
        </div>
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setShowAddModal(false);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={actionLoading === 'save'}
            className="flex items-center gap-2"
          >
            {actionLoading === 'save' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save
              </>
            )}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          resetForm();
        }}
        title="Edit ₹1 Deal"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Deal Title *
            </label>
            <Input
              type="text"
              value={formData.deal_title}
              onChange={(e) => setFormData({ ...formData, deal_title: e.target.value })}
              placeholder="e.g., Pastry ₹1 Deal"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Product *
            </label>
            <div className="relative" ref={productDropdownRef}>
              <Input
                type="text"
                value={productSearchTerm}
                onChange={(e) => {
                  setProductSearchTerm(e.target.value);
                  setShowProductDropdown(true);
                }}
                onFocus={() => setShowProductDropdown(true)}
                placeholder="Search and select product..."
              />
              {showProductDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {products
                    .filter(p => p.is_active)
                    .map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => selectProduct(product)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
                      >
                        {product.image_url && (
                          <img
                            src={resolveImageUrl(product.image_url)}
                            alt={product.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                        )}
                        <div>
                          <div className="font-medium text-sm dark:text-gray-200">{product.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            ₹{product.discounted_price || product.base_price}
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cart Amount Cutoff (₹) *
            </label>
            <Input
              type="number"
              value={formData.threshold_amount || ''}
              onChange={(e) => setFormData({ ...formData, threshold_amount: parseFloat(e.target.value) || 0 })}
              placeholder="e.g., 499"
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Deal Price (₹)
            </label>
            <Input
              type="number"
              value={formData.deal_price || ''}
              onChange={(e) => setFormData({ ...formData, deal_price: parseFloat(e.target.value) || 1.00 })}
              placeholder="1.00"
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Max Quantity Per Order
            </label>
            <Input
              type="number"
              value={formData.max_quantity_per_order || ''}
              onChange={(e) => setFormData({ ...formData, max_quantity_per_order: parseInt(e.target.value) || 1 })}
              placeholder="1"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Priority (Display Order)
            </label>
            <Input
              type="number"
              value={formData.priority || ''}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
              placeholder="0"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Internal notes..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-gray-100"
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active_edit"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-pink-600 dark:text-pink-400 rounded focus:ring-pink-500 dark:focus:ring-pink-400 border-gray-300 dark:border-gray-600"
            />
            <label htmlFor="is_active_edit" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Active
            </label>
          </div>
        </div>
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setShowEditModal(false);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={actionLoading === 'update'}
            className="flex items-center gap-2"
          >
            {actionLoading === 'update' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Update
              </>
            )}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingId(null);
        }}
        title="Delete Deal"
      >
        <p className="text-gray-600 dark:text-gray-400">
          Are you sure you want to delete this deal? This action cannot be undone.
        </p>
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setShowDeleteModal(false);
              setDeletingId(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteConfirm}
            disabled={actionLoading === 'delete'}
            className="flex items-center gap-2"
          >
            {actionLoading === 'delete' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete
              </>
            )}
          </Button>
        </ModalFooter>
      </Modal>

      {/* A/B Test Creation Modal */}
      <Modal
        isOpen={showAbTestModal}
        onClose={() => {
          setShowAbTestModal(false);
          setAbTestForm({
            name: '',
            dealId: 0,
            variantAThreshold: 0,
            variantAPrice: 1,
            variantBThreshold: 0,
            variantBPrice: 1,
            trafficSplit: 50,
            startDate: '',
            endDate: ''
          });
        }}
        title="Create A/B Test"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Test Name *
            </label>
            <Input
              type="text"
              value={abTestForm.name}
              onChange={(e) => setAbTestForm({ ...abTestForm, name: e.target.value })}
              placeholder="e.g., Threshold Test - Pastry Deal"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Select Deal *
            </label>
            <select
              value={abTestForm.dealId}
              onChange={(e) => {
                const dealId = parseInt(e.target.value);
                const deal = deals.find(d => d.id === dealId);
                if (deal) {
                  setAbTestForm({
                    ...abTestForm,
                    dealId,
                    variantAThreshold: deal.threshold_amount,
                    variantAPrice: deal.deal_price,
                    variantBThreshold: deal.threshold_amount * 1.2,
                    variantBPrice: deal.deal_price
                  });
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value={0}>Select a deal...</option>
              {deals.filter(d => d.is_active).map(deal => (
                <option key={deal.id} value={deal.id}>{deal.deal_title}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-2">Variant A</div>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Threshold (₹)</label>
                  <Input
                    type="number"
                    value={abTestForm.variantAThreshold || ''}
                    onChange={(e) => setAbTestForm({ ...abTestForm, variantAThreshold: parseFloat(e.target.value) || 0 })}
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Price (₹)</label>
                  <Input
                    type="number"
                    value={abTestForm.variantAPrice || ''}
                    onChange={(e) => setAbTestForm({ ...abTestForm, variantAPrice: parseFloat(e.target.value) || 1 })}
                    step="0.01"
                    className="text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="text-xs font-semibold text-purple-900 dark:text-purple-300 mb-2">Variant B</div>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Threshold (₹)</label>
                  <Input
                    type="number"
                    value={abTestForm.variantBThreshold || ''}
                    onChange={(e) => setAbTestForm({ ...abTestForm, variantBThreshold: parseFloat(e.target.value) || 0 })}
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Price (₹)</label>
                  <Input
                    type="number"
                    value={abTestForm.variantBPrice || ''}
                    onChange={(e) => setAbTestForm({ ...abTestForm, variantBPrice: parseFloat(e.target.value) || 1 })}
                    step="0.01"
                    className="text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Traffic Split (Variant A %)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="10"
                max="90"
                value={abTestForm.trafficSplit}
                onChange={(e) => setAbTestForm({ ...abTestForm, trafficSplit: parseInt(e.target.value) })}
                className="flex-1"
              />
              <span className="text-sm font-semibold text-gray-900 dark:text-white w-12 text-right">
                {abTestForm.trafficSplit}%
              </span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>Variant A: {abTestForm.trafficSplit}%</span>
              <span>Variant B: {100 - abTestForm.trafficSplit}%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date *
              </label>
              <Input
                type="datetime-local"
                value={abTestForm.startDate}
                onChange={(e) => setAbTestForm({ ...abTestForm, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date *
              </label>
              <Input
                type="datetime-local"
                value={abTestForm.endDate}
                onChange={(e) => setAbTestForm({ ...abTestForm, endDate: e.target.value })}
              />
            </div>
          </div>
        </div>
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setShowAbTestModal(false);
              setAbTestForm({
                name: '',
                dealId: 0,
                variantAThreshold: 0,
                variantAPrice: 1,
                variantBThreshold: 0,
                variantBPrice: 1,
                trafficSplit: 50,
                startDate: '',
                endDate: ''
              });
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleCreateAbTest} className="flex items-center gap-2">
            <TestTube className="w-4 h-4" />
            Create Test
          </Button>
        </ModalFooter>
      </Modal>

      {/* Advanced Scheduling Modal */}
      <Modal
        isOpen={showSchedulingModal}
        onClose={() => {
          setShowSchedulingModal(false);
          setSchedulingDealId(null);
        }}
        title={`Schedule Deal${schedulingDealId ? `: ${deals.find(d => d.id === schedulingDealId)?.deal_title}` : ''}`}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date & Time *
              </label>
              <Input
                type="datetime-local"
                value={schedulingForm.startDate}
                onChange={(e) => setSchedulingForm({ ...schedulingForm, startDate: e.target.value })}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                <ClockIcon className="h-3 w-3" />
                Deal will activate at this time
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date & Time (Optional)
              </label>
              <Input
                type="datetime-local"
                value={schedulingForm.endDate}
                onChange={(e) => setSchedulingForm({ ...schedulingForm, endDate: e.target.value })}
                min={schedulingForm.startDate}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                <ClockIcon className="h-3 w-3" />
                Deal will deactivate at this time
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <input
              type="checkbox"
              id="isRecurring"
              checked={schedulingForm.isRecurring}
              onChange={(e) => setSchedulingForm({ ...schedulingForm, isRecurring: e.target.checked })}
              className="w-4 h-4 text-primary-600 dark:text-primary-400 rounded focus:ring-primary-500 dark:focus:ring-primary-400 border-gray-300 dark:border-gray-600"
            />
            <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Repeat className="h-4 w-4" />
              Recurring Schedule
            </label>
          </div>

          {schedulingForm.isRecurring && (
            <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Recurrence Pattern
                </label>
                <select
                  value={schedulingForm.recurrencePattern}
                  onChange={(e) => setSchedulingForm({ ...schedulingForm, recurrencePattern: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {schedulingForm.recurrencePattern === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Days
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          const days = schedulingForm.recurrenceDays || [];
                          const newDays = days.includes(index)
                            ? days.filter(d => d !== index)
                            : [...days, index];
                          setSchedulingForm({ ...schedulingForm, recurrenceDays: newDays });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          (schedulingForm.recurrenceDays || []).includes(index)
                            ? 'bg-primary-600 text-white'
                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {schedulingForm.recurrencePattern === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Time Slots (Optional)
                  </label>
                  <div className="space-y-2">
                    {schedulingForm.timeSlots.map((slot, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={slot.start}
                          onChange={(e) => {
                            const newSlots = [...schedulingForm.timeSlots];
                            newSlots[index].start = e.target.value;
                            setSchedulingForm({ ...schedulingForm, timeSlots: newSlots });
                          }}
                          className="flex-1"
                        />
                        <span className="text-gray-500">to</span>
                        <Input
                          type="time"
                          value={slot.end}
                          onChange={(e) => {
                            const newSlots = [...schedulingForm.timeSlots];
                            newSlots[index].end = e.target.value;
                            setSchedulingForm({ ...schedulingForm, timeSlots: newSlots });
                          }}
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newSlots = schedulingForm.timeSlots.filter((_, i) => i !== index);
                            setSchedulingForm({ ...schedulingForm, timeSlots: newSlots });
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSchedulingForm({
                          ...schedulingForm,
                          timeSlots: [...schedulingForm.timeSlots, { start: '09:00', end: '17:00' }]
                        });
                      }}
                      className="w-full"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Time Slot
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-xs text-blue-800 dark:text-blue-300">
                <strong className="dark:text-blue-200">Timezone:</strong> {schedulingForm.timezone}
                <br />
                All times are in your local timezone. The deal will automatically activate/deactivate based on the schedule.
              </div>
            </div>
          </div>
        </div>
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setShowSchedulingModal(false);
              setSchedulingDealId(null);
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleSaveScheduling} className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            Save Schedule
          </Button>
        </ModalFooter>
      </Modal>

      {/* Backfill Historical Orders Modal */}
      <Modal
        isOpen={showBackfillModal}
        onClose={() => {
          setShowBackfillModal(false);
          setBackfillResult(null);
          setBackfillDateRange({ start: '', end: '' });
        }}
        title="Backfill Historical Orders"
      >
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
            <div className="flex items-start gap-3">
              <Database className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">What is Backfill?</h4>
                <p className="text-sm text-blue-800 dark:text-blue-400">
                  Backfill scans your historical orders and identifies deal items based on product ID and price matching. 
                  It then creates purchase events in the analytics system, allowing you to see analytics data for orders placed before the analytics system was implemented.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date (Optional)
              </label>
              <Input
                type="date"
                value={backfillDateRange.start}
                onChange={(e) => setBackfillDateRange({ ...backfillDateRange, start: e.target.value })}
                placeholder="Leave empty to process all orders"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Leave empty to process all historical orders
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date (Optional)
              </label>
              <Input
                type="date"
                value={backfillDateRange.end}
                onChange={(e) => setBackfillDateRange({ ...backfillDateRange, end: e.target.value })}
                min={backfillDateRange.start || undefined}
                placeholder="Leave empty to process all orders"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Leave empty to process all historical orders
              </p>
            </div>
          </div>

          {backfillResult && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500 dark:border-green-400">
              <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2">Backfill Results</h4>
              <div className="space-y-1 text-sm text-green-800 dark:text-green-400">
                <div><strong className="dark:text-green-300">Orders Processed:</strong> {backfillResult.processed}</div>
                <div><strong className="dark:text-green-300">Deal Items Found:</strong> {backfillResult.dealsFound}</div>
                <div><strong className="dark:text-green-300">Events Created:</strong> {backfillResult.eventsCreated}</div>
                {backfillResult.dealsProcessed && backfillResult.dealsProcessed.length > 0 && (
                  <div className="mt-2">
                    <strong className="dark:text-green-300">Deals Processed:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-0.5">
                      {backfillResult.dealsProcessed.map((deal, idx) => (
                        <li key={idx}>
                          Deal ID {deal.deal_id}: {deal.redemptions} redemptions, ₹{deal.revenue.toFixed(2)} revenue
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div className="text-xs text-yellow-800 dark:text-yellow-400">
                <strong className="dark:text-yellow-300">Note:</strong> Use "Dry Run" first to preview what will be processed without making changes. 
                The backfill process identifies deal items by matching product ID and price (within 0.01 tolerance).
              </div>
            </div>
          </div>
        </div>
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setShowBackfillModal(false);
              setBackfillResult(null);
              setBackfillDateRange({ start: '', end: '' });
            }}
          >
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleBackfill(true)}
            disabled={backfillLoading}
            className="flex items-center gap-2"
          >
            {backfillLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                Dry Run
              </>
            )}
          </Button>
          <Button
            onClick={() => handleBackfill(false)}
            disabled={backfillLoading}
            className="flex items-center gap-2"
          >
            {backfillLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Database className="w-4 h-4" />
                Run Backfill
              </>
            )}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

