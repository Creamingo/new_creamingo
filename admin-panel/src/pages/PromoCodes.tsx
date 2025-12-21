import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Search,
  Edit,
  Tag,
  Percent,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  Save,
  AlertCircle,
  TrendingUp,
  Users,
  ChevronDown,
  Check,
  Filter,
  BarChart3,
  Download,
  RefreshCw,
  Database
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table } from '../components/ui/Table';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { TableColumn } from '../types';
import promoCodeService, { PromoCode, CreatePromoCodeData, UpdatePromoCodeData } from '../services/promoCodeService';
import { useToastContext } from '../contexts/ToastContext';

// Form data type that allows string or number for discount_value and min_order_amount
type PromoCodeFormData = Omit<CreatePromoCodeData, 'discount_value' | 'min_order_amount'> & {
  discount_value: number | string;
  min_order_amount: number | string;
};

// Custom Discount Type Dropdown Component
interface DiscountTypeDropdownProps {
  value: 'percentage' | 'fixed';
  onChange: (value: 'percentage' | 'fixed') => void;
  className?: string;
}

// Custom Status Dropdown Component
interface StatusDropdownProps {
  currentStatus: 'active' | 'inactive' | 'expired' | 'deleted';
  statusOptions: Array<{ value: 'active' | 'inactive' | 'expired' | 'deleted'; label: string }>;
  onChange: (value: 'active' | 'inactive' | 'expired' | 'deleted') => void;
  disabled?: boolean;
  className?: string;
}

const StatusDropdown: React.FC<StatusDropdownProps> = ({
  currentStatus,
  statusOptions,
  onChange,
  disabled = false,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const statusConfig = {
    active: { icon: CheckCircle, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-900/30', borderColor: 'border-green-200 dark:border-green-700' },
    inactive: { icon: XCircle, color: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-50 dark:bg-gray-800', borderColor: 'border-gray-200 dark:border-gray-700' },
    expired: { icon: AlertCircle, color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-900/30', borderColor: 'border-orange-200 dark:border-orange-700' },
    deleted: { icon: XCircle, color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-900/30', borderColor: 'border-red-200 dark:border-red-700' }
  };

  const currentConfig = statusConfig[currentStatus] || statusConfig.inactive;
  const CurrentIcon = currentConfig.icon;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: 'Active',
      inactive: 'Inactive',
      expired: 'Expired',
      deleted: 'Deleted'
    };
    return labels[status] || status;
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-2.5 py-1 border-2 rounded-lg text-xs font-medium bg-white dark:bg-gray-800 text-left focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400 focus:border-pink-500 dark:focus:border-pink-400 flex items-center justify-between transition-all duration-200 min-w-[110px] ${
          disabled 
            ? 'opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700' 
            : `cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-pink-300 dark:hover:border-pink-600 ${currentConfig.borderColor}`
        }`}
      >
        <div className="flex items-center gap-1.5">
          <CurrentIcon className={`w-3 h-3 ${currentConfig.color}`} />
          <span className={`${currentConfig.color}`}>{getStatusLabel(currentStatus)}</span>
        </div>
        <ChevronDown
          className={`w-3 h-3 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-56 overflow-hidden" style={{ minWidth: '160px', width: 'max-content', maxWidth: '200px' }}>
          <div className="py-1">
            {statusOptions.map((option) => {
              const optionConfig = statusConfig[option.value];
              const OptionIcon = optionConfig.icon;
              const isSelected = currentStatus === option.value;
              
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-xs text-left hover:bg-pink-50 dark:hover:bg-pink-900/30 hover:text-pink-700 dark:hover:text-pink-400 transition-all duration-150 flex items-center justify-between font-medium whitespace-nowrap ${
                    isSelected
                      ? 'bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 border-l-4 border-pink-500 dark:border-pink-400'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <OptionIcon className={`w-3 h-3 flex-shrink-0 ${isSelected ? optionConfig.color : 'text-gray-400 dark:text-gray-500'}`} />
                    <span className="whitespace-nowrap flex-1">{option.label}</span>
                  </div>
                  {isSelected && (
                    <Check className="w-3 h-3 text-pink-600 dark:text-pink-400 flex-shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const DiscountTypeDropdown: React.FC<DiscountTypeDropdownProps> = ({ 
  value, 
  onChange,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const options = [
    { value: 'percentage' as const, label: 'Percentage (%)', icon: Percent },
    { value: 'fixed' as const, label: 'Fixed Amount (₹)', icon: DollarSign }
  ];

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-1.5 border-2 border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 text-left focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400 focus:border-pink-500 dark:focus:border-pink-400 cursor-pointer flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-pink-300 dark:hover:border-pink-600 transition-all duration-200 h-9"
      >
        <div className="flex items-center gap-2">
          {selectedOption && (
            <selectedOption.icon className="w-4 h-4 text-pink-600 dark:text-pink-400" />
          )}
          <span className="text-gray-800 dark:text-gray-200">{selectedOption?.label || 'Select type'}</span>
        </div>
        <ChevronDown 
          className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-56 overflow-hidden">
          <div className="py-1">
            {options.map((option) => {
              const Icon = option.icon;
              const isSelected = value === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2.5 text-sm text-left hover:bg-pink-50 dark:hover:bg-pink-900/30 hover:text-pink-700 dark:hover:text-pink-400 transition-all duration-150 flex items-center justify-between font-medium ${
                    isSelected 
                      ? 'bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 border-l-4 border-pink-500 dark:border-pink-400' 
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-pink-600 dark:text-pink-400' : 'text-gray-400 dark:text-gray-500'}`} />
                    <span>{option.label}</span>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export const PromoCodes: React.FC = () => {
  const { showSuccess, showError } = useToastContext();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusConfirm, setStatusConfirm] = useState<{ id: number; status: 'active' | 'inactive' | 'expired' | 'deleted' } | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDiscountType, setFilterDiscountType] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [filterUsageMin, setFilterUsageMin] = useState<string>('');
  const [filterUsageMax, setFilterUsageMax] = useState<string>('');
  
  // Analytics state
  const [analyticsOverview, setAnalyticsOverview] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);
  const [selectedCodeAnalytics, setSelectedCodeAnalytics] = useState<any>(null);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [viewingCodeId, setViewingCodeId] = useState<number | null>(null);

  // Form states
  const [formData, setFormData] = useState<PromoCodeFormData>({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    min_order_amount: '',
    max_discount_amount: null,
    usage_limit: null,
    valid_from: new Date().toISOString().split('T')[0] + 'T00:00:00',
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T23:59:59',
    is_active: true
  });

  // Fetch promo codes (always include deleted to get accurate count)
  const fetchPromoCodes = async () => {
    setLoading(true);
    try {
      // Always fetch with includeDeleted=true to get accurate deleted count
      const response = await promoCodeService.getPromoCodes(false, true);
      if (response.success && response.data) {
        setPromoCodes(response.data);
      }
    } catch (error: any) {
      showError(error.message || 'Failed to fetch promo codes');
    } finally {
      setLoading(false);
    }
  };

  // Fetch analytics overview
  const fetchAnalyticsOverview = async () => {
    setAnalyticsLoading(true);
    try {
      const response = await promoCodeService.getAnalyticsOverview();
      if (response.success && response.data) {
        setAnalyticsOverview(response.data);
      } else {
        // Initialize with empty data structure
        setAnalyticsOverview({
          total_revenue: 0,
          total_discount_given: 0,
          total_redemptions: 0,
          total_validations: 0,
          total_views: 0,
          avg_discount_per_order: 0,
          conversion_rate: 0,
          top_performers: []
        });
      }
    } catch (error: any) {
      console.error('Failed to fetch analytics overview:', error);
      // Initialize with empty data structure on error
      setAnalyticsOverview({
        total_revenue: 0,
        total_discount_given: 0,
        total_redemptions: 0,
        total_validations: 0,
        total_views: 0,
        avg_discount_per_order: 0,
        conversion_rate: 0,
        top_performers: []
      });
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Fetch time series data
  const fetchTimeSeriesData = async () => {
    try {
      const response = await promoCodeService.getTimeSeriesAnalytics();
      if (response.success && response.data) {
        setTimeSeriesData(response.data || []);
      } else {
        setTimeSeriesData([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch time series data:', error);
      setTimeSeriesData([]);
    }
  };

  // Fetch analytics for a specific code
  const fetchCodeAnalytics = async (codeId: number) => {
    try {
      const response = await promoCodeService.getAnalytics(codeId);
      if (response.success && response.data) {
        setSelectedCodeAnalytics(response.data);
        setViewingCodeId(codeId);
        setShowAnalyticsModal(true);
      }
    } catch (error: any) {
      showError(error.message || 'Failed to fetch code analytics');
    }
  };

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetchPromoCodes();
    fetchAnalyticsOverview();
    fetchTimeSeriesData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter promo codes
  const filteredPromoCodes = promoCodes.filter(promo => {
    // Search filter
    const matchesSearch = promo.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      promo.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    // Status filter
    if (filterStatus !== 'all' && promo.status !== filterStatus) {
      return false;
    }
    
    // Discount type filter
    if (filterDiscountType !== 'all' && promo.discount_type !== filterDiscountType) {
      return false;
    }
    
    // Date range filter
    if (filterDateFrom) {
      const validFrom = new Date(promo.valid_from);
      const filterFrom = new Date(filterDateFrom);
      if (validFrom < filterFrom) return false;
    }
    if (filterDateTo) {
      const validUntil = new Date(promo.valid_until);
      const filterTo = new Date(filterDateTo);
      if (validUntil > filterTo) return false;
    }
    
    // Usage range filter
    if (filterUsageMin && promo.used_count < parseInt(filterUsageMin)) {
      return false;
    }
    if (filterUsageMax && promo.used_count > parseInt(filterUsageMax)) {
      return false;
    }
    
    // Deleted filter
    if (showDeleted) {
      return true;
    }
    return promo.status !== 'deleted';
  });

  // Reset filters
  const resetFilters = () => {
    setFilterStatus('all');
    setFilterDiscountType('all');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterUsageMin('');
    setFilterUsageMax('');
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Code', 'Description', 'Discount Type', 'Discount Value', 'Min Order', 'Max Discount', 'Usage Limit', 'Used Count', 'Valid From', 'Valid Until', 'Status'];
    const rows = filteredPromoCodes.map(promo => [
      promo.code,
      promo.description || '',
      promo.discount_type,
      promo.discount_value,
      promo.min_order_amount,
      promo.max_discount_amount || '',
      promo.usage_limit || '',
      promo.used_count,
      new Date(promo.valid_from).toLocaleDateString(),
      new Date(promo.valid_until).toLocaleDateString(),
      promo.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `promo-codes-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccess('Promo codes exported successfully');
  };

  // Separate deleted and active codes for stats
  const deletedCount = promoCodes.filter(p => p.status === 'deleted').length;

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Auto-convert promo code to uppercase
    if (name === 'code') {
      const uppercaseValue = value.toUpperCase().replace(/[^A-Z0-9]/g, ''); // Only allow letters and numbers
      setFormData(prev => ({ ...prev, [name]: uppercaseValue }));
      return;
    }
    
    if (name === 'is_active') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else if (name === 'max_discount_amount' || name === 'usage_limit') {
      setFormData(prev => ({ 
        ...prev, 
        [name]: value === '' ? null : parseFloat(value) || null 
      }));
    } else if (type === 'number') {
      // Allow empty string for discount_value and min_order_amount so user can clear and type
      if (name === 'discount_value' || name === 'min_order_amount') {
        setFormData(prev => ({ 
          ...prev, 
          [name]: value === '' ? '' : (parseFloat(value) || 0)
        }));
      } else {
        setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: '',
      min_order_amount: '',
      max_discount_amount: null,
      usage_limit: null,
      valid_from: new Date().toISOString().split('T')[0] + 'T00:00:00',
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T23:59:59',
      is_active: true
    });
  };

  // Handle add new
  const handleAddNew = () => {
    resetForm();
    setShowAddModal(true);
  };

  // Handle edit
  const handleEdit = (promo: PromoCode) => {
    setFormData({
      code: promo.code, // Read-only for editing
      description: promo.description || '',
      discount_type: promo.discount_type,
      discount_value: promo.discount_value === 0 ? '' : promo.discount_value,
      min_order_amount: promo.min_order_amount === 0 ? '' : promo.min_order_amount,
      max_discount_amount: promo.max_discount_amount,
      usage_limit: promo.usage_limit,
      valid_from: promo.valid_from.split('T')[0] + 'T00:00:00',
      valid_until: promo.valid_until.split('T')[0] + 'T23:59:59',
      is_active: promo.is_active
    });
    setEditingId(promo.id);
    setShowEditModal(true);
  };

  // Handle save new
  const handleSaveNew = async () => {
    if (!formData.code.trim()) {
      showError('Promo code is required');
      return;
    }
    const discountValue = typeof formData.discount_value === 'string' ? parseFloat(formData.discount_value) : formData.discount_value;
    if (!discountValue || discountValue <= 0) {
      showError('Discount value must be greater than 0');
      return;
    }
    if (new Date(formData.valid_from) >= new Date(formData.valid_until)) {
      showError('Valid until date must be after valid from date');
      return;
    }

    setActionLoading('add');
    try {
      // Convert string values to numbers for API
      const createData: CreatePromoCodeData = {
        ...formData,
        discount_value: typeof formData.discount_value === 'string' ? parseFloat(formData.discount_value) || 0 : formData.discount_value,
        min_order_amount: typeof formData.min_order_amount === 'string' ? parseFloat(formData.min_order_amount) || 0 : formData.min_order_amount
      };
      const response = await promoCodeService.createPromoCode(createData);
      if (response.success) {
        showSuccess('Promo code created successfully');
        setShowAddModal(false);
        resetForm();
        fetchPromoCodes();
      }
    } catch (error: any) {
      showError(error.message || 'Failed to create promo code');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle update
  const handleUpdate = async () => {
    if (!editingId) return;
    const discountValue = typeof formData.discount_value === 'string' ? parseFloat(formData.discount_value) : formData.discount_value;
    if (!discountValue || discountValue <= 0) {
      showError('Discount value must be greater than 0');
      return;
    }
    if (new Date(formData.valid_from) >= new Date(formData.valid_until)) {
      showError('Valid until date must be after valid from date');
      return;
    }

    setActionLoading('update');
    try {
      const updateData: UpdatePromoCodeData = {
        description: formData.description,
        discount_type: formData.discount_type,
        discount_value: typeof formData.discount_value === 'string' ? parseFloat(formData.discount_value) || 0 : formData.discount_value,
        min_order_amount: typeof formData.min_order_amount === 'string' ? parseFloat(formData.min_order_amount) || 0 : formData.min_order_amount,
        max_discount_amount: formData.max_discount_amount,
        usage_limit: formData.usage_limit,
        valid_from: formData.valid_from,
        valid_until: formData.valid_until,
        is_active: formData.is_active
      };
      
      const response = await promoCodeService.updatePromoCode(editingId, updateData);
      if (response.success) {
        showSuccess('Promo code updated successfully');
        setShowEditModal(false);
        setEditingId(null);
        resetForm();
        fetchPromoCodes();
      }
    } catch (error: any) {
      showError(error.message || 'Failed to update promo code');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle status update
  const handleStatusUpdate = async (id: number, newStatus: 'active' | 'inactive' | 'expired' | 'deleted') => {
    setActionLoading(`status-${id}`);
    try {
      const response = await promoCodeService.updatePromoCodeStatus(id, newStatus);
      if (response.success) {
        showSuccess(response.message || 'Status updated successfully');
        fetchPromoCodes();
      }
    } catch (error: any) {
      showError(error.message || 'Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Check if promo is currently valid
  const isCurrentlyValid = (promo: PromoCode) => {
    const now = new Date();
    const validFrom = new Date(promo.valid_from);
    const validUntil = new Date(promo.valid_until);
    return promo.is_active && now >= validFrom && now <= validUntil;
  };

  // Define table columns
  const promoCodeColumns: TableColumn[] = [
    {
      key: 'code',
      label: 'Code',
      sortable: true,
      align: 'left',
      render: (value) => (
        <div className="font-mono font-semibold text-pink-600 text-xs whitespace-nowrap">{value}</div>
      )
    },
    {
      key: 'description',
      label: 'Description',
      align: 'left',
      render: (value) => (
        <div className="text-[10px] text-gray-600 dark:text-gray-400 leading-relaxed break-words">{value || '-'}</div>
      )
    },
    {
      key: 'discount',
      label: 'Discount',
      align: 'left',
      render: (_, promo: PromoCode) => (
        <div className="flex items-center gap-0.5 whitespace-nowrap">
          {promo.discount_type === 'percentage' ? (
            <>
              <Percent className="w-3 h-3 text-gray-400 dark:text-gray-500 flex-shrink-0" />
              <span className="font-semibold text-xs dark:text-gray-300">{promo.discount_value}%</span>
            </>
          ) : (
            <>
              <DollarSign className="w-3 h-3 text-gray-400 dark:text-gray-500 flex-shrink-0" />
              <span className="font-semibold text-xs dark:text-gray-300">₹{promo.discount_value}</span>
            </>
          )}
          {promo.max_discount_amount && (
            <span className="text-[10px] text-gray-500 dark:text-gray-400 ml-0.5">
              (max ₹{promo.max_discount_amount})
            </span>
          )}
        </div>
      )
    },
    {
      key: 'min_order_amount',
      label: 'Min Order',
      align: 'left',
      render: (value) => (
        <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
          {value > 0 ? `₹${value}` : 'None'}
        </span>
      )
    },
    {
      key: 'usage',
      label: 'Usage',
      align: 'left',
      render: (_, promo: PromoCode) => (
        <div className="flex items-center gap-0.5 whitespace-nowrap">
          <Users className="w-3 h-3 text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <span className="text-xs dark:text-gray-300">
            {promo.used_count}
            {promo.usage_limit && `/${promo.usage_limit}`}
          </span>
        </div>
      )
    },
    {
      key: 'validity',
      label: 'Validity',
      align: 'left',
      render: (_, promo: PromoCode) => (
        <div className="text-[10px] text-gray-600 dark:text-gray-400 leading-tight whitespace-nowrap">
          <div title={formatDate(promo.valid_from)}>{formatDate(promo.valid_from)}</div>
          <div className="text-gray-400 dark:text-gray-500" title={formatDate(promo.valid_until)}>to {formatDate(promo.valid_until)}</div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      align: 'left',
      render: (_, promo: PromoCode) => getStatusBadge(promo)
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'center',
      render: (_, promo: PromoCode) => {
        const statusOptions: Array<{ value: 'active' | 'inactive' | 'expired' | 'deleted'; label: string }> = [];
        
        // Build status options based on current status and usage
        if (promo.status === 'active') {
          statusOptions.push({ value: 'inactive', label: 'Deactivate' });
          if (promo.used_count === 0) {
            statusOptions.push({ value: 'deleted', label: 'Delete' });
          }
        } else if (promo.status === 'inactive') {
          statusOptions.push({ value: 'active', label: 'Activate' });
          if (promo.used_count === 0) {
            statusOptions.push({ value: 'deleted', label: 'Delete' });
          }
        } else if (promo.status === 'expired') {
          if (promo.used_count === 0) {
            statusOptions.push({ value: 'deleted', label: 'Delete' });
          }
        } else if (promo.status === 'deleted') {
          // Allow restoring deleted codes
          statusOptions.push({ value: 'active', label: 'Restore (Active)' });
          statusOptions.push({ value: 'inactive', label: 'Restore (Inactive)' });
        }

        return (
          <div className="flex items-center justify-center gap-1 whitespace-nowrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchCodeAnalytics(promo.id)}
              className="p-1 h-7 w-7 flex-shrink-0"
              title="View analytics"
            >
              <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(promo)}
              className="p-1 h-7 w-7 flex-shrink-0"
              title="Edit promo code"
            >
              <Edit className="w-3.5 h-3.5" />
            </Button>
            {statusOptions.length > 0 && (
              <StatusDropdown
                currentStatus={promo.status}
                statusOptions={statusOptions}
                onChange={(newStatus) => {
                  if (newStatus !== promo.status) {
                    if (newStatus === 'deleted') {
                      setStatusConfirm({ id: promo.id, status: newStatus });
                    } else {
                      handleStatusUpdate(promo.id, newStatus);
                    }
                  }
                }}
                disabled={actionLoading !== null}
                className="min-w-[110px] flex-shrink-0"
              />
            )}
            {promo.status === 'deleted' && statusOptions.length === 0 && (
              <StatusDropdown
                currentStatus={promo.status}
                statusOptions={[
                  { value: 'active', label: 'Restore (Active)' },
                  { value: 'inactive', label: 'Restore (Inactive)' }
                ]}
                onChange={(newStatus) => {
                  if (newStatus !== promo.status) {
                    handleStatusUpdate(promo.id, newStatus);
                  }
                }}
                disabled={actionLoading !== null}
                className="min-w-[110px] flex-shrink-0"
              />
            )}
          </div>
        );
      }
    }
  ];

  // Get status badge
  const getStatusBadge = (promo: PromoCode) => {
    const status = promo.status || (promo.is_active ? 'active' : 'inactive');
    const isValid = isCurrentlyValid(promo);
    
    // Use status field if available, otherwise fall back to is_active
    if (status === 'deleted') {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
          Deleted
        </span>
      );
    }
    
    if (status === 'expired' || (status === 'active' && !isValid)) {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
          Expired
        </span>
      );
    }
    
    if (status === 'inactive') {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
          Inactive
        </span>
      );
    }
    
    if (status === 'active' && isValid) {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
          <CheckCircle className="w-2.5 h-2.5 mr-0.5" />
          Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
        <Calendar className="w-2.5 h-2.5 mr-0.5" />
        Scheduled
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="w-full px-3 sm:px-4 lg:px-6">
          <div className="py-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Promo Codes</h1>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  Create and manage discount codes and promotional offers
                </p>
              </div>
              <Button 
                onClick={handleAddNew} 
                className="group relative overflow-hidden bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 hover:from-pink-700 hover:via-rose-700 hover:to-pink-700 text-white font-semibold px-4 sm:px-6 py-2.5 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-pink-500/30 hover:border-pink-400/50 flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <Tag className="w-4 h-4 relative z-10" />
                <Plus className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Add Promo Code</span>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              <Card>
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Total Codes</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none mt-0.5">{promoCodes.length}</p>
                    </div>
                    <Tag className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 leading-none">Active Codes</p>
                      <p className="text-2xl font-bold text-green-600 leading-none mt-0.5">
                        {promoCodes.filter(p => isCurrentlyValid(p)).length}
                      </p>
                    </div>
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Total Redemptions</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 leading-none mt-0.5">
                        {analyticsOverview?.total_redemptions || promoCodes.reduce((sum, p) => sum + p.used_count, 0)}
                      </p>
                    </div>
                    <TrendingUp className="w-4 h-4 text-blue-400 dark:text-blue-500 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 leading-none">Revenue Generated</p>
                      <p className="text-2xl font-bold text-purple-600 leading-none mt-0.5">
                        ₹{analyticsOverview?.total_revenue?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || '0'}
                      </p>
                    </div>
                    <DollarSign className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                  <CardContent className="px-2.5 py-1.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Discount Given</p>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 leading-none mt-0.5">
                        ₹{analyticsOverview?.total_discount_given?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || '0'}
                        </p>
                      </div>
                    <Percent className="w-4 h-4 text-orange-400 dark:text-orange-500 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              <Card>
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Conversion Rate</p>
                      <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 leading-none mt-0.5">
                        {analyticsOverview?.conversion_rate?.toFixed(1) || '0.0'}%
                      </p>
            </div>
                    <BarChart3 className="w-4 h-4 text-indigo-400 dark:text-indigo-500 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full px-3 sm:px-4 lg:px-6 py-4">
        {/* Analytics Section */}
        {analyticsOverview !== null && (
          <div className="mb-6 grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold dark:text-white">Redemption Trends</CardTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        setAnalyticsLoading(true);
                        try {
                          // First run migration (idempotent - safe if already exists)
                          try {
                            const migrationResponse = await promoCodeService.runAnalyticsMigration();
                            if (migrationResponse.success) {
                              console.log('Migration completed:', migrationResponse.data);
                            }
                          } catch (migrationError: any) {
                            // If migration fails, it might already be done, continue anyway
                            console.log('Migration check:', migrationError.message);
                          }
                          
                          // Small delay to ensure tables are ready
                          await new Promise(resolve => setTimeout(resolve, 300));
                          
                          // Then run backfill
                          const response = await promoCodeService.backfillAnalytics();
                          if (response.success) {
                            showSuccess(response.message || 'Backfill completed successfully');
                            await fetchTimeSeriesData();
                            await fetchAnalyticsOverview();
                            await fetchPromoCodes();
                          } else {
                            showError(response.message || 'Backfill failed');
                          }
                        } catch (error: any) {
                          // If tables don't exist error, try migration first
                          if (error.message?.includes('tables do not exist') || error.message?.includes('Analytics tables')) {
                            try {
                              await promoCodeService.runAnalyticsMigration();
                              showSuccess('Tables created! Please click Backfill again.');
                              await fetchAnalyticsOverview();
                            } catch (migError: any) {
                              showError('Failed to create tables. Please run migration manually.');
                            }
                          } else {
                            showError(error.message || 'Failed to backfill analytics');
                          }
                        } finally {
                          setAnalyticsLoading(false);
                        }
                      }}
                      className="h-7 px-2 text-xs"
                      title="Backfill historical data (will setup tables if needed)"
                      disabled={analyticsLoading}
                    >
                      <Database className="w-3.5 h-3.5 mr-1" />
                      {analyticsLoading ? 'Processing...' : 'Backfill'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        fetchTimeSeriesData();
                        fetchAnalyticsOverview();
                      }}
                      className="h-7 w-7 p-0"
                      title="Refresh analytics"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {timeSeriesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={timeSeriesData}>
                      <defs>
                        <linearGradient id="colorRedemptions" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 10, fill: isDarkMode ? '#9ca3af' : '#6b7280' }}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return `${date.getDate()}/${date.getMonth() + 1}`;
                        }}
                      />
                      <YAxis 
                        tick={{ fontSize: 10, fill: isDarkMode ? '#9ca3af' : '#6b7280' }}
                      />
                      <RechartsTooltip 
                        contentStyle={{ 
                          fontSize: '12px', 
                          padding: '8px', 
                          backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                          color: isDarkMode ? '#f9fafb' : '#111827',
                          border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
                          borderRadius: '8px'
                        }}
                        formatter={(value: any) => [value, 'Redemptions']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="redemptions" 
                        stroke="#ec4899" 
                        fillOpacity={1}
                        fill="url(#colorRedemptions)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex flex-col items-center justify-center text-sm text-gray-500">
                    <BarChart3 className="w-8 h-8 text-gray-300 mb-2" />
                    <p className="font-medium">No data available</p>
                    <p className="text-xs text-gray-400 mt-1 text-center px-4">
                      Analytics data will appear here once promo codes are used by customers
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold dark:text-white">Top Performers</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsOverview?.top_performers?.length > 0 ? (
                  <div className="space-y-2">
                    {analyticsOverview.top_performers.slice(0, 5).map((performer: any, index: number) => (
                      <div key={performer.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-xs font-bold text-gray-400 dark:text-gray-500 w-4">{index + 1}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{performer.code}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{performer.description || 'No description'}</p>
                          </div>
                        </div>
                        <div className="text-right ml-2">
                          <p className="text-xs font-bold text-pink-600 dark:text-pink-400">{performer.redemptions}</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">redemptions</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-[200px] flex flex-col items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                    <TrendingUp className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="font-medium dark:text-gray-300">No top performers yet</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-center px-4">
                      Top performing codes will appear here once they start generating redemptions
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filter */}
        <div className="mb-4 space-y-3">
          <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search promo codes by code or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-sm h-9"
            />
          </div>
            <Button
              variant="ghost"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-3 py-2 text-xs font-medium border rounded-lg transition-colors h-9 ${
                showAdvancedFilters
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/50'
                  : 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              title="Advanced filters"
            >
              <Filter className="w-3.5 h-3.5 mr-1.5" />
              Filters
            </Button>
          <Button
            variant="ghost"
            onClick={() => setShowDeleted(!showDeleted)}
            className={`px-3 py-2 text-xs font-medium border rounded-lg transition-colors h-9 ${
              showDeleted
                ? 'bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 border-pink-300 dark:border-pink-700 hover:bg-pink-100 dark:hover:bg-pink-900/50'
                : 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            title={showDeleted ? 'Hide deleted codes' : 'Show deleted codes'}
            disabled={deletedCount === 0 && !showDeleted}
          >
            <Filter className="w-3.5 h-3.5 mr-1.5" />
            {showDeleted ? 'Hide Deleted' : deletedCount > 0 ? `Show Deleted (${deletedCount})` : 'Show Deleted (0)'}
          </Button>
            <Button
              variant="ghost"
              onClick={exportToCSV}
              className="px-3 py-2 text-xs font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors h-9 dark:text-gray-300"
              title="Export to CSV"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export
            </Button>
          </div>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <Card className="p-4 bg-gray-50 dark:bg-gray-800/50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400 focus:border-pink-500 dark:focus:border-pink-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="expired">Expired</option>
                    <option value="deleted">Deleted</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Discount Type</label>
                  <select
                    value={filterDiscountType}
                    onChange={(e) => setFilterDiscountType(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400 focus:border-pink-500 dark:focus:border-pink-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200"
                  >
                    <option value="all">All Types</option>
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Valid From</label>
                  <Input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    className="text-sm h-9"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Valid Until</label>
                  <Input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    className="text-sm h-9"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Min Usage</label>
                  <Input
                    type="number"
                    value={filterUsageMin}
                    onChange={(e) => setFilterUsageMin(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="text-sm h-9"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Max Usage</label>
                  <Input
                    type="number"
                    value={filterUsageMax}
                    onChange={(e) => setFilterUsageMax(e.target.value)}
                    placeholder="Unlimited"
                    min="0"
                    className="text-sm h-9"
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={resetFilters}
                  className="px-4 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                >
                  Reset Filters
                </Button>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Showing {filteredPromoCodes.length} of {promoCodes.length} codes
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Table */}
        <Table
          data={filteredPromoCodes}
          columns={promoCodeColumns}
          loading={loading}
          emptyMessage="No promo codes found"
        />
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title="Create Promo Code"
        size="wide"
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1">
                Promo Code *
              </label>
              <Input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                placeholder="e.g., WELCOME20"
                className="font-mono uppercase text-sm tracking-wide h-9"
                required
                maxLength={50}
              />
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                Will automatically convert to uppercase. Letters and numbers only. Cannot be changed after creation.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1">
                Description
              </label>
              <Input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="e.g., 20% off on first order"
                className="text-sm h-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1">
                Discount Type *
              </label>
              <DiscountTypeDropdown
                value={formData.discount_type}
                onChange={(value) => setFormData(prev => ({ ...prev, discount_type: value }))}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1">
                Discount Value *
              </label>
              <Input
                type="number"
                name="discount_value"
                value={formData.discount_value === '' || formData.discount_value === 0 ? '' : String(formData.discount_value)}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
                step="0.01"
                className="text-sm font-medium h-9"
                required
              />
            </div>
          </div>

          {formData.discount_type === 'percentage' && (
            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1">
                Max Discount Amount (₹)
              </label>
              <Input
                type="number"
                name="max_discount_amount"
                value={formData.max_discount_amount || ''}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                placeholder="Leave empty for no limit"
                className="text-sm font-medium h-9"
              />
              <p className="text-[10px] text-gray-500 mt-0.5">
                Maximum discount amount when using percentage discount
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1">
                Minimum Order Amount (₹)
              </label>
              <Input
                type="number"
                name="min_order_amount"
                value={formData.min_order_amount === '' || formData.min_order_amount === 0 ? '' : String(formData.min_order_amount)}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
                step="0.01"
                className="text-sm font-medium h-9"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1">
                Usage Limit
              </label>
              <Input
                type="number"
                name="usage_limit"
                value={formData.usage_limit || ''}
                onChange={handleInputChange}
                min="1"
                step="1"
                placeholder="Leave empty for unlimited"
                className="text-sm font-medium h-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1">
                Valid From *
              </label>
              <Input
                type="datetime-local"
                name="valid_from"
                value={formData.valid_from}
                onChange={handleInputChange}
                className="text-sm h-9"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1">
                Valid Until *
              </label>
              <Input
                type="datetime-local"
                name="valid_until"
                value={formData.valid_until}
                onChange={handleInputChange}
                className="text-sm h-9"
                required
              />
            </div>
          </div>

          <div className="flex items-center pt-1 pb-0.5 mb-4">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleInputChange}
              className="w-4 h-4 text-pink-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-pink-500 focus:ring-offset-0 cursor-pointer transition-colors"
            />
            <label className="ml-2 text-xs font-medium text-gray-800 cursor-pointer">
              Active (can be used immediately)
            </label>
          </div>
        </div>

        {/* Separator line before footer */}
        <div className="border-t border-gray-200 mt-6 mb-0"></div>

        <ModalFooter className="pt-4 pb-5">
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              variant="ghost"
              onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}
              className="px-6 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveNew}
              disabled={actionLoading === 'add'}
              className="px-6 py-2 text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading === 'add' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Promo Code
                </>
              )}
            </Button>
          </div>
        </ModalFooter>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingId(null);
          resetForm();
        }}
        title="Edit Promo Code"
        size="wide"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Promo Code
              </label>
              <Input
                type="text"
                value={formData.code}
                disabled
                className="font-mono uppercase bg-gray-100 dark:bg-gray-800 text-base tracking-wide"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                Code cannot be changed after creation
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Description
              </label>
              <Input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="e.g., 20% off on first order"
                className="text-base"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1">
                Discount Type *
              </label>
              <DiscountTypeDropdown
                value={formData.discount_type}
                onChange={(value) => setFormData(prev => ({ ...prev, discount_type: value }))}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1">
                Discount Value *
              </label>
              <Input
                type="number"
                name="discount_value"
                value={formData.discount_value === '' || formData.discount_value === 0 ? '' : String(formData.discount_value)}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
                step="0.01"
                className="text-sm font-medium h-9"
                required
              />
            </div>
          </div>

          {formData.discount_type === 'percentage' && (
            <div>
              <label className="block text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1">
                Max Discount Amount (₹)
              </label>
              <Input
                type="number"
                name="max_discount_amount"
                value={formData.max_discount_amount || ''}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                placeholder="Leave empty for no limit"
                className="text-sm font-medium h-9"
              />
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                Maximum discount amount when using percentage discount
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1">
                Minimum Order Amount (₹)
              </label>
              <Input
                type="number"
                name="min_order_amount"
                value={formData.min_order_amount === '' || formData.min_order_amount === 0 ? '' : String(formData.min_order_amount)}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
                step="0.01"
                className="text-sm font-medium h-9"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1">
                Usage Limit
              </label>
              <Input
                type="number"
                name="usage_limit"
                value={formData.usage_limit || ''}
                onChange={handleInputChange}
                min="1"
                step="1"
                placeholder="Leave empty for unlimited"
                className="text-sm font-medium h-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1">
                Valid From *
              </label>
              <Input
                type="datetime-local"
                name="valid_from"
                value={formData.valid_from}
                onChange={handleInputChange}
                className="text-sm h-9"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1">
                Valid Until *
              </label>
              <Input
                type="datetime-local"
                name="valid_until"
                value={formData.valid_until}
                onChange={handleInputChange}
                className="text-sm h-9"
                required
              />
            </div>
          </div>

          <div className="flex items-center pt-1 pb-0.5 mb-4">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleInputChange}
              className="w-4 h-4 text-pink-600 dark:text-pink-400 border-2 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400 focus:ring-offset-0 cursor-pointer transition-colors"
            />
            <label className="ml-2 text-xs font-medium text-gray-800 dark:text-gray-200 cursor-pointer">
              Active (can be used immediately)
            </label>
          </div>
        </div>

        {/* Separator line before footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 mt-6 mb-0"></div>

        <ModalFooter className="pt-4 pb-5">
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              variant="ghost"
              onClick={() => {
                setShowEditModal(false);
                setEditingId(null);
                resetForm();
              }}
              className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={actionLoading === 'update'}
              className="px-6 py-2 text-sm font-medium text-white bg-pink-600 dark:bg-pink-700 hover:bg-pink-700 dark:hover:bg-pink-600 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading === 'update' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Update Promo Code
                </>
              )}
            </Button>
          </div>
        </ModalFooter>
      </Modal>

      {/* Status Change Confirmation Modal */}
      <Modal
        isOpen={statusConfirm !== null}
        onClose={() => setStatusConfirm(null)}
        title="Confirm Status Change"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Are you sure you want to {statusConfirm?.status === 'deleted' ? 'delete' : 'change the status of'} this promo code?
          </p>
          {statusConfirm?.status === 'deleted' && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              This will mark the code as deleted (soft delete). It will not be available for use but will remain in the database for audit purposes.
            </p>
          )}
        </div>

        {/* Separator line before footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 mt-6 mb-0"></div>

        <ModalFooter className="pt-4 pb-5">
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              variant="ghost"
              onClick={() => setStatusConfirm(null)}
              disabled={actionLoading !== null}
              className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (statusConfirm) {
                  handleStatusUpdate(statusConfirm.id, statusConfirm.status);
                  setStatusConfirm(null);
                }
              }}
              disabled={actionLoading !== null}
              className={`px-6 py-2 text-sm font-medium text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                statusConfirm?.status === 'deleted' 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-pink-600 hover:bg-pink-700'
              }`}
            >
              {actionLoading !== null ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  {statusConfirm?.status === 'deleted' ? 'Delete' : 'Confirm'}
                </>
              )}
            </Button>
          </div>
        </ModalFooter>
      </Modal>

      {/* Analytics Modal */}
      <Modal
        isOpen={showAnalyticsModal}
        onClose={() => {
          setShowAnalyticsModal(false);
          setSelectedCodeAnalytics(null);
          setViewingCodeId(null);
        }}
        title={`Analytics: ${promoCodes.find(p => p.id === viewingCodeId)?.code || 'N/A'}`}
        size="wide"
      >
        {selectedCodeAnalytics ? (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card>
                <CardContent className="px-3 py-2.5">
                  <p className="text-xs text-gray-600 mb-1">Total Views</p>
                  <p className="text-xl font-bold text-gray-900">{selectedCodeAnalytics.total_views || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="px-3 py-2.5">
                  <p className="text-xs text-gray-600 mb-1">Validations</p>
                  <p className="text-xl font-bold text-blue-600">{selectedCodeAnalytics.total_validations || 0}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {selectedCodeAnalytics.validation_success_rate?.toFixed(1) || 0}% success
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="px-3 py-2.5">
                  <p className="text-xs text-gray-600 mb-1">Redemptions</p>
                  <p className="text-xl font-bold text-green-600">{selectedCodeAnalytics.total_redemptions || 0}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {selectedCodeAnalytics.redemption_rate?.toFixed(1) || 0}% rate
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="px-3 py-2.5">
                  <p className="text-xs text-gray-600 mb-1">Revenue</p>
                  <p className="text-xl font-bold text-purple-600">
                    ₹{selectedCodeAnalytics.total_revenue?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || '0'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Conversion Rate</span>
                    <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                      {selectedCodeAnalytics.conversion_rate?.toFixed(2) || '0.00'}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Validation Success</span>
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {selectedCodeAnalytics.validation_success_rate?.toFixed(2) || '0.00'}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Redemption Rate</span>
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {selectedCodeAnalytics.redemption_rate?.toFixed(2) || '0.00'}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Avg Order Value</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      ₹{selectedCodeAnalytics.avg_order_value?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || '0'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold dark:text-white">Usage Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Total Discount Given</span>
                    <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                      ₹{selectedCodeAnalytics.total_discount_given?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || '0'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Unique Customers</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {selectedCodeAnalytics.unique_customers || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Failed Validations</span>
                    <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                      {selectedCodeAnalytics.failed_validations || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Abandoned</span>
                    <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                      {selectedCodeAnalytics.total_abandons || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-pink-600 mb-2" />
            <p className="text-sm text-gray-600">Loading analytics...</p>
          </div>
        )}

        <ModalFooter className="pt-4 pb-5">
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              variant="ghost"
              onClick={() => {
                setShowAnalyticsModal(false);
                setSelectedCodeAnalytics(null);
                setViewingCodeId(null);
              }}
              className="px-6 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors"
            >
              Close
            </Button>
          </div>
        </ModalFooter>
      </Modal>
    </div>
  );
};

