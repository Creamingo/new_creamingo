import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Eye, Image as ImageIcon, Loader2, GripVertical, AlertTriangle, Image, CheckCircle, XCircle, Clock, ArrowUpDown, Monitor, Smartphone, Grid3x3, List, RefreshCw, ExternalLink, Trash, Power, PowerOff, CheckSquare, Square, BarChart3, TrendingUp, Calendar, Layers, FlaskConical, Target, Activity, Award, Copy, Play, Timer, ChevronDown, FileDown } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { FileUpload } from '../components/ui/FileUpload';
import { resolveImageUrl } from '../utils/imageUrl';
import { Banner } from '../types';
import bannerService from '../services/bannerService';
import apiClient from '../services/api';
import { useToastContext } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';

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

// Utility function for status badge - Enhanced with icons
const getStatusBadge = (status: string) => {
  const isActive = status === 'active';
  const Icon = isActive ? CheckCircle : XCircle;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
      isActive
        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
    }`}>
      <Icon className="h-3 w-3" />
      <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
    </span>
  );
};

const getImageDimensions = (src: string): Promise<{ w: number; h: number }> =>
  new Promise((resolve, reject) => {
    const img = document.createElement('img');
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });

// Sortable Grid Card Component
interface SortableGridCardProps {
  banner: Banner;
  onEdit: (banner: Banner) => void;
  onDelete: (id: number) => void;
  isSelected: boolean;
  onSelect: (id: number) => void;
  draggedBanner: number | null;
}

const SortableGridCard: React.FC<SortableGridCardProps> = ({
  banner,
  onEdit,
  onDelete,
  isSelected,
  onSelect,
  draggedBanner
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: banner.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || draggedBanner === banner.id ? 0.5 : 1,
    scale: isDragging || draggedBanner === banner.id ? 0.95 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${isDragging || draggedBanner === banner.id ? 'z-10 shadow-2xl' : ''}`}
    >
      <Card className={`hover:shadow-lg transition-all h-full ${isSelected ? 'ring-2 ring-primary-500 dark:ring-primary-400' : ''}`}>
        <div className="relative">
          {banner.image_url ? (
            <img
              src={resolveImageUrl(banner.image_url)}
              alt={banner.title}
              className="w-full h-48 object-cover rounded-t-lg"
              onError={(e) => {
                e.currentTarget.src = '/placeholder-image.png';
              }}
            />
          ) : (
            <div className="w-full h-48 bg-gray-100 dark:bg-gray-700 rounded-t-lg flex items-center justify-center">
              <ImageIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
            </div>
          )}
          
          {/* Selection Checkbox */}
          <div className="absolute top-2 left-2">
            <button
              onClick={() => onSelect(banner.id)}
              className="p-1.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-sm hover:bg-white dark:hover:bg-gray-800 transition-colors"
            >
              {isSelected ? (
                <CheckSquare className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              ) : (
                <Square className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              )}
            </button>
          </div>

          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="absolute top-2 right-2 p-1.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-sm cursor-grab active:cursor-grabbing hover:bg-white dark:hover:bg-gray-800 transition-colors"
            title="Drag to reorder"
          >
            <GripVertical className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </div>

          {/* Status Badge */}
          <div className="absolute bottom-2 left-2">
            {getStatusBadge(banner.is_active ? 'active' : 'inactive')}
          </div>
        </div>

        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 truncate">
            {banner.title}
          </h3>
          {banner.subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
              {banner.subtitle}
            </p>
          )}
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Order #{banner.order_index}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onEdit(banner)}
                className="p-1.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-all"
                title="Edit"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(banner.id)}
                className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Sortable Row Component
interface SortableRowProps {
  banner: Banner;
  onEdit: (banner: Banner) => void;
  onDelete: (id: number) => void;
  onToggleStatus: (id: number, isActive: boolean) => void;
  actionLoading: string | null;
  isSelected: boolean;
  onSelect: (id: number) => void;
  isDragging: boolean;
  onShowAnalytics?: (id: number) => void;
  onShowScheduling?: (id: number) => void;
  onShowABTesting?: (id: number) => void;
  hasSchedule?: boolean;
  hasABTest?: boolean;
}

const SortableRow: React.FC<SortableRowProps> = ({ 
  banner, 
  onEdit, 
  onDelete, 
  onToggleStatus, 
  actionLoading,
  isSelected,
  onSelect,
  isDragging: externalDragging,
  onShowAnalytics,
  onShowScheduling,
  onShowABTesting,
  hasSchedule,
  hasABTest
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: banner.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || externalDragging ? 0.5 : 1,
    scale: isDragging || externalDragging ? 0.95 : 1,
  };

  return (
    <tr 
      ref={setNodeRef} 
      style={style}
      className={`group hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition-all duration-150 border-b border-gray-100 dark:border-gray-700/50 ${isSelected ? 'bg-primary-50/40 dark:bg-primary-900/30 border-primary-200 dark:border-primary-800' : ''} ${isDragging || externalDragging ? 'shadow-lg z-10 bg-white dark:bg-gray-800' : ''}`}
    >
      {/* Select Checkbox Column */}
      <td className="px-2 py-3 text-sm text-gray-900 dark:text-gray-100">
        <button
          onClick={() => onSelect(banner.id)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title={isSelected ? 'Deselect' : 'Select'}
        >
          {isSelected ? (
            <CheckSquare className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
          ) : (
            <Square className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
          )}
        </button>
      </td>
      
      {/* Drag Handle Column */}
      <td className="px-2 py-3 text-sm text-gray-900 dark:text-gray-100">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all rounded hover:bg-primary-50 dark:hover:bg-primary-900/20 inline-flex"
          title="Drag to reorder"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </div>
      </td>
      
      {/* Image Column */}
      <td className="px-2 py-3 text-sm text-gray-900 dark:text-gray-100">
        <div className="flex items-center justify-start relative group">
          {banner.image_url ? (
            <>
              <img 
                src={resolveImageUrl(banner.image_url)} 
                alt={banner.title} 
                className="w-28 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-image.png';
                }}
              />
              <div className="absolute inset-0 bg-black/0 hover:bg-black/20 rounded-lg transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Eye className="h-4 w-4 text-white drop-shadow-lg" />
              </div>
            </>
          ) : (
            <div className="w-28 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-gray-400 dark:text-gray-500" />
            </div>
          )}
        </div>
      </td>
      <td className="px-2 py-3 text-sm text-gray-900 dark:text-gray-100">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 leading-tight truncate max-w-[140px]" title={banner.title}>
              {banner.title}
            </span>
            {hasSchedule && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 flex-shrink-0">
                <Timer className="h-2.5 w-2.5" />
                <span className="hidden sm:inline">Scheduled</span>
              </span>
            )}
            {hasABTest && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex-shrink-0">
                <FlaskConical className="h-2.5 w-2.5" />
                <span className="hidden sm:inline">A/B</span>
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
            #{banner.order_index}
          </span>
        </div>
      </td>
      <td className="px-2 py-3 text-sm text-gray-900 dark:text-gray-100">
        <div className="text-gray-600 dark:text-gray-300 text-xs leading-snug line-clamp-2">
          {banner.subtitle ? (
            <span>{banner.subtitle}</span>
          ) : (
            <span className="text-gray-400 dark:text-gray-500 italic text-[10px]">No subtitle</span>
          )}
        </div>
      </td>
      <td className="px-2 py-3 text-sm text-gray-900 dark:text-gray-100">
        <div className="flex flex-col items-center gap-1">
          {banner.button_text ? (
            <>
              <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate max-w-full" title={banner.button_text}>{banner.button_text}</span>
              {banner.button_url && (
                <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-full" title={banner.button_url}>
                  {banner.button_url.length > 20 ? banner.button_url.substring(0, 20) + '...' : banner.button_url}
                </span>
              )}
            </>
          ) : (
            <span className="text-[10px] text-gray-400 dark:text-gray-500 italic">No button</span>
          )}
        </div>
      </td>
      <td className="px-2 py-3 text-sm text-gray-900 dark:text-gray-100">
        <div className="flex flex-col gap-1.5 items-center">
          {getStatusBadge(banner.is_active ? 'active' : 'inactive')}
          <button
            onClick={() => onToggleStatus(banner.id, !banner.is_active)}
            disabled={actionLoading === `toggle-${banner.id}`}
            className={`px-2 py-1 text-[10px] font-semibold rounded transition-all ${
              banner.is_active 
                ? 'text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 border border-orange-200 dark:border-orange-800' 
                : 'text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 border border-green-200 dark:border-green-800'
            } ${actionLoading === `toggle-${banner.id}` ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'}`}
            title={banner.is_active ? 'Deactivate banner' : 'Activate banner'}
          >
            {actionLoading === `toggle-${banner.id}` ? (
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
            ) : banner.is_active ? (
              'Off'
            ) : (
              'On'
            )}
          </button>
        </div>
      </td>
      <td className="px-2 py-3 text-sm text-gray-900 dark:text-gray-100">
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">
            {new Date(banner.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
          </span>
          <span className="text-[9px] font-medium text-gray-500 dark:text-gray-400">
            {new Date(banner.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </td>
      <td className="px-2 py-3 text-sm text-gray-900 dark:text-gray-100">
        <div className="flex items-center justify-center gap-1 flex-wrap">
          {onShowAnalytics && (
            <DashboardTooltip text="View Analytics">
              <button 
                onClick={() => onShowAnalytics(banner.id)}
                className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-all duration-200"
              >
                <BarChart3 className="h-3.5 w-3.5" />
              </button>
            </DashboardTooltip>
          )}
          {onShowScheduling && (
            <DashboardTooltip text={hasSchedule ? 'Edit Schedule' : 'Schedule Publishing'}>
              <button 
                onClick={() => onShowScheduling(banner.id)}
                className={`p-1.5 rounded transition-all duration-200 ${
                  hasSchedule 
                    ? 'text-orange-600 dark:text-orange-400 bg-orange-50/50 dark:bg-orange-900/20 hover:bg-orange-50 dark:hover:bg-orange-900/30' 
                    : 'text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                }`}
              >
                <Calendar className="h-3.5 w-3.5" />
              </button>
            </DashboardTooltip>
          )}
          {onShowABTesting && (
            <DashboardTooltip text={hasABTest ? 'View A/B Test' : 'Start A/B Test'}>
              <button 
                onClick={() => onShowABTesting(banner.id)}
                className={`p-1.5 rounded transition-all duration-200 ${
                  hasABTest 
                    ? 'text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-900/20 hover:bg-purple-50 dark:hover:bg-purple-900/30' 
                    : 'text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                }`}
              >
                <FlaskConical className="h-3.5 w-3.5" />
              </button>
            </DashboardTooltip>
          )}
          <DashboardTooltip text="Edit banner">
            <button 
              onClick={() => onEdit(banner)}
              className="p-1.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-all duration-200"
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
          </DashboardTooltip>
          <DashboardTooltip text="Delete banner">
            <button 
              onClick={() => onDelete(banner.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all duration-200"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </DashboardTooltip>
        </div>
      </td>
    </tr>
  );
};

export const Banners: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title' | 'order'>('order');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedBanners, setSelectedBanners] = useState<Set<number>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [bannerToDelete, setBannerToDelete] = useState<Banner | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadedFilesMobile, setUploadedFilesMobile] = useState<File[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [editDesktopDims, setEditDesktopDims] = useState<{ w: number; h: number } | null>(null);
  const [editMobileDims, setEditMobileDims] = useState<{ w: number; h: number } | null>(null);
  const [draggedBanner, setDraggedBanner] = useState<number | null>(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Phase 3: Advanced Features State
  const [showAnalytics, setShowAnalytics] = useState<number | null>(null);
  const [showScheduling, setShowScheduling] = useState<number | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showABTesting, setShowABTesting] = useState<number | null>(null);
  
  // Analytics data
  const [bannerAnalytics, setBannerAnalytics] = useState<Record<number, {
    views: number;
    clicks: number;
    ctr: number;
    conversions?: number;
    revenue?: number;
    lastViewed?: string | null;
    trends?: Array<{
      date: string;
      views: number;
      clicks: number;
      conversions: number;
      revenue: number;
      ctr: string;
    }>;
  }>>({});
  
  // Analytics loading state
  const [analyticsLoading, setAnalyticsLoading] = useState<Record<number, boolean>>({});
  
  // Scheduled publishing
  const [bannerSchedules, setBannerSchedules] = useState<Record<number, {
    startDate: string | null;
    endDate: string | null;
    isScheduled: boolean;
  }>>({});
  
  // A/B Testing
  const [abTests, setAbTests] = useState<Record<number, {
    variantId: number | null;
    variantBanner: Banner | null;
    startDate: string;
    trafficSplit: number; // percentage for variant B
    status: 'draft' | 'running' | 'completed';
    results?: {
      variantA: { views: number; clicks: number; ctr: number };
      variantB: { views: number; clicks: number; ctr: number };
      winner: 'A' | 'B' | null;
    };
  }>>({});
  
  const { showSuccess, showError, showInfo } = useToastContext();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isDarkMode } = useTheme();

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Form states for Add Banner
  const [newBanner, setNewBanner] = useState({
    title: '',
    subtitle: '',
    button_text: '',
    button_url: '',
    image_url: '',
    image_url_mobile: '',
    is_active: true
  });
  
  // Form states for Edit Banner
  const [editBanner, setEditBanner] = useState({
    title: '',
    subtitle: '',
    button_text: '',
    button_url: '',
    image_url: '',
    image_url_mobile: '',
    is_active: true
  });

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Load analytics data for all banners (only on initial load)
  useEffect(() => {
    const loadAnalytics = async () => {
      if (banners.length > 0) {
        const analyticsPromises = banners.map(async (banner) => {
          // Only load if not already loaded
          if (!bannerAnalytics[banner.id]) {
            try {
              const response = await bannerService.getBannerAnalytics(banner.id, 30);
              if (response.success && response.data) {
                return {
                  id: banner.id,
                  analytics: {
                    views: response.data.views || 0,
                    clicks: response.data.clicks || 0,
                    ctr: parseFloat(response.data.ctr.toString()) || 0,
                    conversions: response.data.conversions || 0,
                    revenue: response.data.revenue || 0,
                    lastViewed: response.data.lastViewed || null,
                    trends: response.data.trends || []
                  }
                };
              }
            } catch (error) {
              console.error(`Error loading analytics for banner ${banner.id}:`, error);
              // Return default values on error
              return {
                id: banner.id,
                analytics: {
                  views: 0,
                  clicks: 0,
                  ctr: 0,
                  conversions: 0,
                  revenue: 0,
                  lastViewed: null,
                  trends: []
                }
              };
            }
          }
          return null;
        });

        const results = await Promise.all(analyticsPromises);
        const newAnalytics: Record<number, any> = {};
        
        results.forEach(result => {
          if (result) {
            newAnalytics[result.id] = result.analytics;
          }
        });

        if (Object.keys(newAnalytics).length > 0) {
          setBannerAnalytics(prev => ({ ...prev, ...newAnalytics }));
        }
      }
    };

    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [banners.length]); // Only run when banners count changes, not on every bannerAnalytics update

  // Load uploaded/current image dimensions for Edit Banner modal
  useEffect(() => {
    if (!editingBanner) {
      setEditDesktopDims(null);
      setEditMobileDims(null);
      return;
    }
    let desktopUrl: string | null = null;
    let mobileUrl: string | null = null;

    if (uploadedFiles.length > 0 && uploadedFiles[0].type.startsWith('image/')) {
      desktopUrl = URL.createObjectURL(uploadedFiles[0]);
    } else if (editingBanner.image_url) {
      desktopUrl = resolveImageUrl(editingBanner.image_url) || null;
    }
    if (uploadedFilesMobile.length > 0 && uploadedFilesMobile[0].type.startsWith('image/')) {
      mobileUrl = URL.createObjectURL(uploadedFilesMobile[0]);
    } else if (editingBanner.image_url_mobile) {
      mobileUrl = resolveImageUrl(editingBanner.image_url_mobile) || null;
    } else if (editingBanner.image_url) {
      mobileUrl = resolveImageUrl(editingBanner.image_url) || null;
    }

    if (desktopUrl) {
      const desktopIsBlob = desktopUrl.startsWith('blob:');
      const desktopUrlToRevoke = desktopUrl;
      getImageDimensions(desktopUrl)
        .then((d) => {
          setEditDesktopDims(d);
          if (desktopIsBlob) URL.revokeObjectURL(desktopUrlToRevoke);
        })
        .catch(() => {
          setEditDesktopDims(null);
          if (desktopIsBlob) URL.revokeObjectURL(desktopUrlToRevoke);
        });
    } else {
      setEditDesktopDims(null);
    }

    if (mobileUrl) {
      const mobileIsBlob = mobileUrl.startsWith('blob:');
      const mobileUrlToRevoke = mobileUrl;
      getImageDimensions(mobileUrl)
        .then((d) => {
          setEditMobileDims(d);
          if (mobileIsBlob) URL.revokeObjectURL(mobileUrlToRevoke);
        })
        .catch(() => {
          setEditMobileDims(null);
          if (mobileIsBlob) URL.revokeObjectURL(mobileUrlToRevoke);
        });
    } else {
      setEditMobileDims(null);
    }
  }, [editingBanner, uploadedFiles, uploadedFilesMobile]);

  // Check scheduled banners and auto-activate/deactivate
  useEffect(() => {
    const checkSchedules = () => {
      const now = new Date();
      banners.forEach(banner => {
        const schedule = bannerSchedules[banner.id];
        if (schedule?.isScheduled) {
          const startDate = schedule.startDate ? new Date(schedule.startDate) : null;
          const endDate = schedule.endDate ? new Date(schedule.endDate) : null;
          
          if (startDate && now >= startDate && !banner.is_active) {
            handleToggleStatus(banner.id, true);
            showInfo('Banner Activated', `${banner.title} has been automatically activated.`);
          }
          
          if (endDate && now >= endDate && banner.is_active) {
            handleToggleStatus(banner.id, false);
            showInfo('Banner Deactivated', `${banner.title} has been automatically deactivated.`);
          }
        }
      });
    };
    
    checkSchedules();
    const interval = setInterval(checkSchedules, 60000); // Check every minute
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [banners, bannerSchedules]); // handleToggleStatus and showInfo are stable functions, intentionally excluded

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await bannerService.getBanners();
      if (response.success && response.data?.banners) {
        setBanners(response.data.banners.map(banner => ({
          ...banner,
          is_active: Boolean(banner.is_active)
        })));
      } else {
        setError('Failed to load banners');
      }
    } catch (err) {
      console.error('Error loading banners:', err);
      setError(err instanceof Error ? err.message : 'Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  // Handle drag start for visual feedback
  const handleDragStart = (event: any) => {
    setDraggedBanner(event.active.id);
  };

  // Reorder array: move item from fromIndex to toIndex
  const reorderArray = <T,>(arr: T[], fromIndex: number, toIndex: number): T[] => {
    const copy = [...arr];
    const [item] = copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, item);
    return copy;
  };

  // Handle drag end for reordering
  const handleDragEnd = async (event: DragEndEvent) => {
    setDraggedBanner(null);
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = filteredBanners.findIndex(banner => banner.id === active.id);
      const newIndex = filteredBanners.findIndex(banner => banner.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      // Actually reorder the displayed list (move item from oldIndex to newIndex)
      const reorderedDisplay = reorderArray(filteredBanners, oldIndex, newIndex);

      // Build payload: assign order_index 1, 2, 3, ... to reordered list; other banners (when filtered) get following indices
      const reorderedIds = new Set(reorderedDisplay.map(b => b.id));
      const others = banners.filter(b => !reorderedIds.has(b.id)).sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      const payload: Array<{ id: number; order_index: number }> = [
        ...reorderedDisplay.map((b, i) => ({ id: b.id, order_index: i + 1 })),
        ...others.map((b, i) => ({ id: b.id, order_index: reorderedDisplay.length + i + 1 }))
      ];

      // Update local state: merge new order_index into banners and sort
      const orderByPayload = Object.fromEntries(payload.map(p => [p.id, p.order_index]));
      const newBanners = banners
        .map(b => ({ ...b, order_index: orderByPayload[b.id] ?? b.order_index }))
        .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
      setBanners(newBanners);

      try {
        await bannerService.updateBannerOrder(payload);
        showSuccess('Banner Order Updated', 'Banners have been reordered successfully!');
      } catch (err) {
        console.error('Error updating banner order:', err);
        showError('Update Failed', 'Failed to update banner order. Please try again.');
        loadData();
      }
    }
  };

  // Calculate statistics
  const bannerStats = {
    total: banners.length,
    active: banners.filter(b => b.is_active).length,
    inactive: banners.filter(b => !b.is_active).length,
    lastUpdated: banners.length > 0 
      ? new Date(Math.max(...banners.map(b => new Date(b.updated_at).getTime()))).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : 'N/A'
  };

  // Filter and sort banners
  const filteredBanners = banners
    .filter(banner => {
      const matchesSearch = banner.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        banner.subtitle?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && banner.is_active) ||
        (statusFilter === 'inactive' && !banner.is_active);
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'order':
        default:
          return (a.order_index || 0) - (b.order_index || 0);
      }
    });

  // Update bulk actions visibility
  useEffect(() => {
    setShowBulkActions(selectedBanners.size > 0);
  }, [selectedBanners]);

  // Handle select all
  const handleSelectAll = () => {
    if (selectedBanners.size === filteredBanners.length) {
      setSelectedBanners(new Set());
    } else {
      setSelectedBanners(new Set(filteredBanners.map(b => b.id)));
    }
  };

  // Handle individual selection
  const handleSelectBanner = (bannerId: number) => {
    const newSelected = new Set(selectedBanners);
    if (newSelected.has(bannerId)) {
      newSelected.delete(bannerId);
    } else {
      newSelected.add(bannerId);
    }
    setSelectedBanners(newSelected);
  };

  // Bulk actions
  const handleBulkActivate = async () => {
    try {
      setActionLoading('bulk-activate');
      const promises = Array.from(selectedBanners).map(id => 
        bannerService.toggleBannerStatus(id)
      );
      await Promise.all(promises);
      await loadData();
      setSelectedBanners(new Set());
      showSuccess('Banners Activated', `${selectedBanners.size} banner(s) have been activated successfully.`);
    } catch (error: any) {
      showError('Error', 'Failed to activate banners. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkDeactivate = async () => {
    try {
      setActionLoading('bulk-deactivate');
      const promises = Array.from(selectedBanners).map(id => 
        bannerService.toggleBannerStatus(id)
      );
      await Promise.all(promises);
      await loadData();
      setSelectedBanners(new Set());
      showSuccess('Banners Deactivated', `${selectedBanners.size} banner(s) have been deactivated successfully.`);
    } catch (error: any) {
      showError('Error', 'Failed to deactivate banners. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedBanners.size === 0) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedBanners.size} banner(s)? This action cannot be undone.`
    );
    
    if (!confirmed) return;
    
    try {
      setActionLoading('bulk-delete');
      const count = selectedBanners.size;
      const promises = Array.from(selectedBanners).map(id => 
        bannerService.deleteBanner(id)
      );
      await Promise.all(promises);
      await loadData();
      setSelectedBanners(new Set());
      showSuccess('Banners Deleted', `${count} banner(s) have been deleted successfully.`);
    } catch (error: any) {
      showError('Error', 'Failed to delete banners. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // Phase 3: Scheduling functions
  const handleSaveSchedule = (bannerId: number, startDate: string | null, endDate: string | null) => {
    setBannerSchedules(prev => ({
      ...prev,
      [bannerId]: {
        startDate,
        endDate,
        isScheduled: !!(startDate || endDate)
      }
    }));
    showSuccess('Schedule Saved', 'Banner schedule has been saved successfully.');
    setShowScheduling(null);
  };

  // Phase 3: Template functions
  const bannerTemplates = [
    {
      id: 'hero',
      name: 'Hero Banner',
      description: 'Large hero banner for homepage',
      preview: 'https://via.placeholder.com/800x400?text=Hero+Banner',
      data: {
        title: 'Welcome to Creamingo',
        subtitle: 'Discover our delicious treats',
        button_text: 'Shop Now',
        button_url: '/products'
      }
    },
    {
      id: 'promo',
      name: 'Promotional Banner',
      description: 'Promotional banner with discount',
      preview: 'https://via.placeholder.com/800x400?text=Promo+Banner',
      data: {
        title: 'Special Offer',
        subtitle: 'Get 20% off on all orders',
        button_text: 'Claim Offer',
        button_url: '/promo'
      }
    },
    {
      id: 'seasonal',
      name: 'Seasonal Banner',
      description: 'Seasonal celebration banner',
      preview: 'https://via.placeholder.com/800x400?text=Seasonal+Banner',
      data: {
        title: 'Holiday Special',
        subtitle: 'Celebrate with our festive collection',
        button_text: 'Explore',
        button_url: '/collections/seasonal'
      }
    },
    {
      id: 'new-arrival',
      name: 'New Arrival',
      description: 'Highlight new products',
      preview: 'https://via.placeholder.com/800x400?text=New+Arrival',
      data: {
        title: 'New Arrivals',
        subtitle: 'Check out our latest additions',
        button_text: 'View New',
        button_url: '/products?new=true'
      }
    }
  ];

  const handleApplyTemplate = (template: typeof bannerTemplates[0]) => {
    setNewBanner({
      title: template.data.title,
      subtitle: template.data.subtitle,
      button_text: template.data.button_text,
      button_url: template.data.button_url,
      image_url: template.preview,
      image_url_mobile: '',
      is_active: true
    });
    setShowTemplates(false);
    setShowAddModal(true);
    showInfo('Template Applied', `${template.name} template has been applied.`);
  };

  // Phase 3: A/B Testing functions
  const handleStartABTest = async (bannerId: number, variantBanner: Banner, trafficSplit: number) => {
    // Initialize with mock data (in real app, this would come from API)
    const variantAViews = Math.floor(Math.random() * 5000) + 1000;
    const variantAClicks = Math.floor(variantAViews * (Math.random() * 0.1 + 0.02));
    const variantBViews = Math.floor(Math.random() * 5000) + 1000;
    const variantBClicks = Math.floor(variantBViews * (Math.random() * 0.1 + 0.02));
    
    setAbTests(prev => ({
      ...prev,
      [bannerId]: {
        variantId: variantBanner.id,
        variantBanner,
        startDate: new Date().toISOString(),
        trafficSplit,
        status: 'running',
        results: {
          variantA: { 
            views: variantAViews, 
            clicks: variantAClicks, 
            ctr: parseFloat((variantAClicks / variantAViews * 100).toFixed(2))
          },
          variantB: { 
            views: variantBViews, 
            clicks: variantBClicks, 
            ctr: parseFloat((variantBClicks / variantBViews * 100).toFixed(2))
          },
          winner: null
        }
      }
    }));
    showSuccess('A/B Test Started', 'A/B test has been started successfully.');
    setShowABTesting(null);
  };

  const handleEndABTest = (bannerId: number) => {
    const test = abTests[bannerId];
    if (test && test.results) {
      const winner = test.results.variantA.ctr > test.results.variantB.ctr ? 'A' : 'B';
      setAbTests(prev => ({
        ...prev,
        [bannerId]: {
          ...prev[bannerId],
          status: 'completed',
          results: {
            ...prev[bannerId].results!,
            winner
          }
        }
      }));
      showSuccess('A/B Test Completed', `Test completed. Winner: Variant ${winner} (CTR: ${test.results[winner === 'A' ? 'variantA' : 'variantB'].ctr}%)`);
    }
  };

  const handleToggleStatus = async (bannerId: number, newStatus: boolean) => {
    try {
      setActionLoading(`toggle-${bannerId}`);
      const response = await bannerService.toggleBannerStatus(bannerId);
      
      // Update the banner in the list with the response data
      if (response.success && response.data?.banner) {
        const updatedBanner = response.data.banner;
        setBanners(prev => prev.map(banner => 
          banner.id === bannerId ? { ...banner, is_active: updatedBanner.is_active } : banner
        ));
        
        const statusText = updatedBanner.is_active ? 'activated' : 'deactivated';
        showSuccess('Banner Status Updated', `Banner has been ${statusText} successfully.`);
      }
    } catch (error: any) {
      console.error('Error toggling banner status:', error);
      const errorMessage = error?.message || 'Failed to update banner status. Please try again.';
      showError('Error', errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteBanner = async (bannerId: number) => {
    const banner = banners.find(b => b.id === bannerId);
    if (banner) {
      setBannerToDelete(banner);
    }
  };

  const confirmDeleteBanner = async () => {
    if (!bannerToDelete) return;

    try {
      setActionLoading(`delete-${bannerToDelete.id}`);
      await bannerService.deleteBanner(bannerToDelete.id);
      setBanners(banners.filter(b => b.id !== bannerToDelete.id));
      
      // Show success message
      showSuccess('Banner Deleted', 'Banner deleted successfully!');
      
      // Close modal
      setBannerToDelete(null);
    } catch (error: any) {
      console.error('Error deleting banner:', error);
      let errorMessage = 'Failed to delete banner. Please try again.';
      
      // Provide more specific error messages
      if (error?.message?.includes('Validation Error')) {
        errorMessage = 'Cannot delete banner. Please check for dependencies.';
      } else if (error?.message?.includes('Authentication')) {
        errorMessage = 'Session expired. Please login again.';
      } else if (error?.message?.includes('Network')) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      showError('Error', errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddBanner = async () => {
    if (!newBanner.title.trim()) {
      showError('Validation Error', 'Please enter a banner title.');
      return;
    }

    try {
      setActionLoading('add-banner');
      
      let imageUrl = newBanner.image_url || 'https://via.placeholder.com/800x400?text=Banner+Image';
      
      // Upload desktop image if files are selected
      if (uploadedFiles.length > 0) {
        try {
          const uploadResponse = await apiClient.uploadFile('/upload/single?type=banners', uploadedFiles[0]);
          if (uploadResponse.success && uploadResponse.data) {
            imageUrl = uploadResponse.data.url;
          } else {
            console.warn('Image upload failed, using placeholder:', uploadResponse);
          }
        } catch (uploadError) {
          console.warn('Image upload error, using placeholder:', uploadError);
        }
      }

      let imageUrlMobile: string | null = newBanner.image_url_mobile?.trim() || null;
      if (uploadedFilesMobile.length > 0) {
        try {
          const uploadResponse = await apiClient.uploadFile('/upload/single?type=banners', uploadedFilesMobile[0]);
          if (uploadResponse.success && uploadResponse.data) {
            imageUrlMobile = uploadResponse.data.url;
          }
        } catch (uploadError) {
          console.warn('Mobile image upload error:', uploadError);
        }
      }
      
      // Prepare banner data with proper validation
      const bannerData: any = {
        title: newBanner.title.trim(),
        subtitle: newBanner.subtitle?.trim() || '',
        button_text: newBanner.button_text?.trim() || '',
        image_url: imageUrl,
        is_active: Boolean(newBanner.is_active)
      };
      if (imageUrlMobile) bannerData.image_url_mobile = imageUrlMobile;

      // Handle button_url - let backend handle validation
      const buttonUrl = newBanner.button_url?.trim();
      bannerData.button_url = buttonUrl || '';

      const response = await bannerService.createBanner(bannerData);
      
      // Add the new banner to the list
      if (response.success && response.data?.banner) {
        const banner = response.data.banner;
        setBanners(prev => [{
          ...banner,
          is_active: Boolean(banner.is_active)
        }, ...prev]);
      }
      
      // Reset form and close modal
      setNewBanner({ title: '', subtitle: '', button_text: '', button_url: '', image_url: '', image_url_mobile: '', is_active: true });
      setShowAddModal(false);
      setUploadedFiles([]);
      setUploadedFilesMobile([]);
      
      // Show success message
      showSuccess('Banner Created', 'Banner created successfully!');
    } catch (error: any) {
      console.error('Error creating banner:', error);
      let errorMessage = 'Failed to create banner. Please try again.';
      
      // Provide more specific error messages
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message?.includes('Validation Error')) {
        errorMessage = 'Please check all required fields and try again.';
      } else if (error?.message?.includes('Authentication')) {
        errorMessage = 'Session expired. Please login again.';
      } else if (error?.message?.includes('Network')) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      showError('Error', errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditBanner = async () => {
    if (!editingBanner || !editBanner.title.trim()) return;

    try {
      setActionLoading('edit-banner');
      
      let imageUrl = editBanner.image_url;
      
      // Upload new desktop image if files are selected
      if (uploadedFiles.length > 0) {
        const uploadResponse = await apiClient.uploadFile('/upload/single?type=banners', uploadedFiles[0]);
        if (uploadResponse.success && uploadResponse.data) {
          imageUrl = uploadResponse.data.url;
        }
      }

      let imageUrlMobile: string | null = (editBanner.image_url_mobile && String(editBanner.image_url_mobile).trim()) ? editBanner.image_url_mobile : null;
      if (uploadedFilesMobile.length > 0) {
        const uploadResponse = await apiClient.uploadFile('/upload/single?type=banners', uploadedFilesMobile[0]);
        if (uploadResponse.success && uploadResponse.data) {
          imageUrlMobile = uploadResponse.data.url;
        }
      }
      
      const bannerData: any = {
        title: editBanner.title,
        subtitle: editBanner.subtitle,
        button_text: editBanner.button_text,
        button_url: editBanner.button_url,
        image_url: imageUrl,
        is_active: Boolean(editBanner.is_active)
      };
      bannerData.image_url_mobile = imageUrlMobile;

      const response = await bannerService.updateBanner(editingBanner.id, bannerData);
      
      // Update the banner in the list
      if (response.success && response.data?.banner) {
        const banner = response.data.banner;
        setBanners(prev => prev.map(b => b.id === editingBanner.id ? {
          ...banner,
          is_active: Boolean(banner.is_active)
        } : b));
      }
      
      setEditingBanner(null);
      setEditBanner({ title: '', subtitle: '', button_text: '', button_url: '', image_url: '', image_url_mobile: '', is_active: true });
      setUploadedFiles([]);
      setUploadedFilesMobile([]);
      
      // Show success message
      showSuccess('Banner Updated', 'Banner updated successfully!');
    } catch (error: any) {
      console.error('Error updating banner:', error);
      let errorMessage = 'Failed to update banner. Please try again.';
      
      // Provide more specific error messages
      if (error?.message?.includes('Validation Error')) {
        errorMessage = 'Please check all required fields and try again.';
      } else if (error?.message?.includes('Authentication')) {
        errorMessage = 'Session expired. Please login again.';
      } else if (error?.message?.includes('Network')) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      showError('Error', errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setNewBanner(prev => ({ ...prev, [field]: value }));
  };

  const handleEditInputChange = (field: string, value: string | boolean) => {
    setEditBanner(prev => ({ ...prev, [field]: value }));
  };

  // Populate edit form when editing banner changes
  React.useEffect(() => {
    if (editingBanner) {
      setEditBanner({
        title: editingBanner.title,
        subtitle: editingBanner.subtitle || '',
        button_text: editingBanner.button_text || '',
        button_url: editingBanner.button_url || '',
        image_url: editingBanner.image_url || '',
        image_url_mobile: editingBanner.image_url_mobile ?? '',
        is_active: Boolean(editingBanner.is_active)
      });
      setUploadedFilesMobile([]);
    }
  }, [editingBanner]);

  const handleFileSelect = (files: File[]) => {
    setUploadedFiles(files);
  };

  const handleFileRemove = (file: File) => {
    setUploadedFiles(uploadedFiles.filter(f => f !== file));
  };

  const handleFileSelectMobile = (files: File[]) => {
    setUploadedFilesMobile(files);
  };

  const handleFileRemoveMobile = (file: File) => {
    setUploadedFilesMobile(uploadedFilesMobile.filter(f => f !== file));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-gray-600 dark:text-gray-400">Loading banners...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <Button onClick={loadData} variant="secondary">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="w-full px-3 sm:px-4 lg:px-6">
          <div className="py-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Banners</h1>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  Manage homepage banners and promotional content
                </p>
              </div>
              <Button 
                onClick={() => setShowAddModal(true)}
                className="group relative overflow-hidden bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 hover:from-pink-700 hover:via-rose-700 hover:to-pink-700 text-white font-semibold px-4 sm:px-6 py-2.5 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-pink-500/30 hover:border-pink-400/50 flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <Image className="w-4 h-4 relative z-10" />
                <Plus className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Add Banner</span>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
              <Card>
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Total Banners</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none mt-0.5">
                        {bannerStats.total}
                      </p>
                    </div>
                    <Image className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Active Banners</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400 leading-none mt-0.5">
                        {bannerStats.active}
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
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Inactive Banners</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400 leading-none mt-0.5">
                        {bannerStats.inactive}
                      </p>
                    </div>
                    <XCircle className="w-4 h-4 text-red-400 dark:text-red-500 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Last Updated</p>
                      <p className="text-sm font-bold text-orange-600 dark:text-orange-400 leading-none mt-0.5">
                        {bannerStats.lastUpdated}
                      </p>
                    </div>
                    <Clock className="w-4 h-4 text-orange-400 dark:text-orange-500 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full px-3 sm:px-4 lg:px-6 py-4 space-y-4">
        {/* Enhanced Filters */}
        <Card>
        <CardContent className="p-4 sm:p-5 md:p-6">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="flex-1">
              <Input
                placeholder="Search banners by title or subtitle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            
            {/* Filter and Sort Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Status Filter - Custom Dropdown */}
              <div className="relative" ref={statusDropdownRef}>
                <button
                  onClick={() => {
                    setShowStatusDropdown(!showStatusDropdown);
                    setShowSortDropdown(false);
                  }}
                  className="flex items-center justify-between h-10 min-w-[180px] bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md px-4 hover:bg-gray-100 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 cursor-pointer group shadow-sm active:scale-[0.98] active:shadow-xs"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="p-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                      <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex flex-col items-start justify-center">
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide leading-none">Status</span>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-tight mt-0.5">
                        {statusFilter === 'all' && 'All Status'}
                        {statusFilter === 'active' && 'Active'}
                        {statusFilter === 'inactive' && 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform duration-300 flex-shrink-0 ${showStatusDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Status Dropdown Menu */}
                {showStatusDropdown && (
                  <div className="absolute top-full right-0 mt-2 min-w-[180px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl dark:shadow-black/40 z-50 overflow-hidden backdrop-blur-sm">
                    <div className="py-1.5">
                      <button
                        onClick={() => {
                          setStatusFilter('all');
                          setShowStatusDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 flex items-center justify-between ${
                          statusFilter === 'all' 
                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold border-l-2 border-primary-500 dark:border-primary-400' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <span>All Status</span>
                        {statusFilter === 'all' && (
                          <div className="w-2 h-2 rounded-full bg-primary-500 dark:bg-primary-400"></div>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setStatusFilter('active');
                          setShowStatusDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 flex items-center justify-between ${
                          statusFilter === 'active' 
                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold border-l-2 border-primary-500 dark:border-primary-400' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <span>Active</span>
                        {statusFilter === 'active' && (
                          <div className="w-2 h-2 rounded-full bg-primary-500 dark:bg-primary-400"></div>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setStatusFilter('inactive');
                          setShowStatusDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 flex items-center justify-between ${
                          statusFilter === 'inactive' 
                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold border-l-2 border-primary-500 dark:border-primary-400' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <span>Inactive</span>
                        {statusFilter === 'inactive' && (
                          <div className="w-2 h-2 rounded-full bg-primary-500 dark:bg-primary-400"></div>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sort Options - Custom Dropdown */}
              <div className="relative" ref={sortDropdownRef}>
                <button
                  onClick={() => {
                    setShowSortDropdown(!showSortDropdown);
                    setShowStatusDropdown(false);
                  }}
                  className="flex items-center justify-between h-10 min-w-[200px] bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md px-4 hover:bg-gray-100 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 cursor-pointer group shadow-sm active:scale-[0.98] active:shadow-xs"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="p-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                      <ArrowUpDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex flex-col items-start justify-center">
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide leading-none">Sort by</span>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-tight mt-0.5">
                        {sortBy === 'order' && 'Order Index'}
                        {sortBy === 'newest' && 'Newest First'}
                        {sortBy === 'oldest' && 'Oldest First'}
                        {sortBy === 'title' && 'Title A-Z'}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform duration-300 flex-shrink-0 ${showSortDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Sort Dropdown Menu */}
                {showSortDropdown && (
                  <div className="absolute top-full right-0 mt-2 min-w-[200px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl dark:shadow-black/40 z-50 overflow-hidden backdrop-blur-sm">
                    <div className="py-1.5">
                      <button
                        onClick={() => {
                          setSortBy('order');
                          setShowSortDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 flex items-center justify-between ${
                          sortBy === 'order' 
                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold border-l-2 border-primary-500 dark:border-primary-400' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <span>Order Index</span>
                        {sortBy === 'order' && (
                          <div className="w-2 h-2 rounded-full bg-primary-500 dark:bg-primary-400"></div>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setSortBy('newest');
                          setShowSortDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 flex items-center justify-between ${
                          sortBy === 'newest' 
                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold border-l-2 border-primary-500 dark:border-primary-400' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <span>Newest First</span>
                        {sortBy === 'newest' && (
                          <div className="w-2 h-2 rounded-full bg-primary-500 dark:bg-primary-400"></div>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setSortBy('oldest');
                          setShowSortDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 flex items-center justify-between ${
                          sortBy === 'oldest' 
                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold border-l-2 border-primary-500 dark:border-primary-400' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <span>Oldest First</span>
                        {sortBy === 'oldest' && (
                          <div className="w-2 h-2 rounded-full bg-primary-500 dark:bg-primary-400"></div>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setSortBy('title');
                          setShowSortDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 flex items-center justify-between ${
                          sortBy === 'title' 
                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold border-l-2 border-primary-500 dark:border-primary-400' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <span>Title A-Z</span>
                        {sortBy === 'title' && (
                          <div className="w-2 h-2 rounded-full bg-primary-500 dark:bg-primary-400"></div>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Results Count */}
              <div className="ml-auto text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredBanners.length} of {banners.length} banners
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Toolbar */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={loadData}
                disabled={loading}
                className="text-xs sm:text-sm font-semibold"
              >
                <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.open('/', '_blank')}
                className="text-xs sm:text-sm font-semibold"
              >
                <ExternalLink className="h-4 w-4 mr-1.5" />
                View Site
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowTemplates(true)}
                className="text-xs sm:text-sm font-semibold"
              >
                <Layers className="h-4 w-4 mr-1.5" />
                Templates
            </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                  title="Table view"
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                  title="Grid view"
                >
                  <Grid3x3 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <Card className="border-primary-200 dark:border-primary-800 bg-primary-50/30 dark:bg-primary-900/20">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {selectedBanners.size} banner{selectedBanners.size !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={() => setSelectedBanners(new Set())}
                  className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  Clear selection
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleBulkActivate}
                  disabled={actionLoading === 'bulk-activate'}
                  className="text-xs sm:text-sm font-semibold"
                >
                  {actionLoading === 'bulk-activate' ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Power className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Activate
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleBulkDeactivate}
                  disabled={actionLoading === 'bulk-deactivate'}
                  className="text-xs sm:text-sm font-semibold"
                >
                  {actionLoading === 'bulk-deactivate' ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <PowerOff className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Deactivate
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={actionLoading === 'bulk-delete'}
                  className="text-xs sm:text-sm font-semibold"
                >
                  {actionLoading === 'bulk-delete' ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Trash className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Banners Table/Grid */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base sm:text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
            All Banners ({filteredBanners.length})
          </CardTitle>
            <div className="flex items-center gap-3">
              {viewMode === 'table' && (
                <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <GripVertical className="h-3.5 w-3.5" />
                  Drag to reorder
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-w-full">
            {filteredBanners.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary-100 to-orange-100 dark:from-primary-900/30 dark:to-orange-900/30 rounded-full flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-primary-600 dark:text-primary-400" />
              </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {searchTerm || statusFilter !== 'all' ? 'No banners found' : 'No banners yet'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria.'
                      : 'Get started by creating your first banner to showcase on your homepage.'}
                  </p>
                  {!searchTerm && statusFilter === 'all' && (
                    <Button onClick={() => setShowAddModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Banner
                    </Button>
                  )}
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={filteredBanners.map(banner => banner.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="p-4 sm:p-5 md:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
                    {filteredBanners.map((banner) => (
                      <SortableGridCard
                        key={banner.id}
                        banner={banner}
                        onEdit={setEditingBanner}
                        onDelete={handleDeleteBanner}
                        isSelected={selectedBanners.has(banner.id)}
                        onSelect={handleSelectBanner}
                        draggedBanner={draggedBanner}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={filteredBanners.map(banner => banner.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <table className="w-full table-fixed">
                    <colgroup>
                      <col className="w-10" />
                      <col className="w-12" />
                      <col className="w-[120px]" />
                      <col className="w-[160px]" />
                      <col className="w-[180px]" />
                      <col className="w-[110px]" />
                      <col className="w-[120px]" />
                      <col className="w-[110px]" />
                      <col className="w-[140px]" />
                    </colgroup>
                    <thead className="bg-gradient-to-r from-gray-50 via-gray-50 to-white dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 border-b-2 border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-2 py-3 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-left">
                          <button
                            onClick={handleSelectAll}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            title={selectedBanners.size === filteredBanners.length ? 'Deselect all' : 'Select all'}
                          >
                            {selectedBanners.size === filteredBanners.length && filteredBanners.length > 0 ? (
                              <CheckSquare className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
                            ) : (
                              <Square className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                            )}
                          </button>
                        </th>
                        <th className="px-2 py-3 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-left">
                          <span className="sr-only">Reorder</span>
                        </th>
                        <th className="px-2 py-3 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-left">
                          <span>Image</span>
                        </th>
                        <th className="px-2 py-3 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-left">
                          <span>Title</span>
                        </th>
                        <th className="px-2 py-3 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-left">
                          <span>Subtitle</span>
                        </th>
                        <th className="px-2 py-3 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-center">
                          <span>Button</span>
                        </th>
                        <th className="px-2 py-3 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-center">
                          <span>Status</span>
                        </th>
                        <th className="px-2 py-3 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-center">
                          <span>Date</span>
                        </th>
                        <th className="px-2 py-3 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-center">
                          <span>Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700/50">
                      {filteredBanners.map((banner) => (
                        <SortableRow
                          key={banner.id}
                          banner={banner}
                          onEdit={setEditingBanner}
                          onDelete={handleDeleteBanner}
                          onToggleStatus={handleToggleStatus}
                          actionLoading={actionLoading}
                          isSelected={selectedBanners.has(banner.id)}
                          onSelect={handleSelectBanner}
                          isDragging={draggedBanner === banner.id}
                          onShowAnalytics={async (id) => {
                            setShowAnalytics(id);
                            // Load fresh analytics when opening modal
                            setAnalyticsLoading(prev => ({ ...prev, [id]: true }));
                            try {
                              const response = await bannerService.getBannerAnalytics(id, 30);
                              if (response.success && response.data) {
                                setBannerAnalytics(prev => ({
                                  ...prev,
                                  [id]: {
                                    views: response.data!.views || 0,
                                    clicks: response.data!.clicks || 0,
                                    ctr: parseFloat(response.data!.ctr.toString()) || 0,
                                    conversions: response.data!.conversions || 0,
                                    revenue: response.data!.revenue || 0,
                                    lastViewed: response.data!.lastViewed || null,
                                    trends: response.data!.trends || []
                                  }
                                }));
                              }
                            } catch (error) {
                              console.error('Error loading analytics:', error);
                              showError('Error', 'Failed to load analytics data');
                            } finally {
                              setAnalyticsLoading(prev => ({ ...prev, [id]: false }));
                            }
                          }}
                          onShowScheduling={setShowScheduling}
                          onShowABTesting={setShowABTesting}
                          hasSchedule={bannerSchedules[banner.id]?.isScheduled}
                          hasABTest={!!abTests[banner.id] && abTests[banner.id].status !== 'completed'}
                        />
                      ))}
                    </tbody>
                  </table>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Add Banner Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setNewBanner({ title: '', subtitle: '', button_text: '', button_url: '', image_url: '', image_url_mobile: '', is_active: true });
          setUploadedFiles([]);
        }}
        title="Add New Banner"
        size="full"
      >
        <div className="w-[90vw] max-w-none mx-auto">
          <div className="space-y-4 pb-8">
          {/* Three Column Layout: Input Fields Left, Image Middle, Preview Right */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
            {/* Divider Lines */}
            <div className="hidden lg:block absolute left-1/3 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700 transform -translate-x-1/2"></div>
            <div className="hidden lg:block absolute left-2/3 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700 transform -translate-x-1/2"></div>
            
            {/* Left Side - Input Fields */}
            <div className="space-y-3">
            <Input 
                label="Title *" 
              placeholder="Enter banner title" 
              value={newBanner.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
              />
              
              <Input 
                label="Subtitle" 
                placeholder="Enter banner subtitle" 
                value={newBanner.subtitle}
                onChange={(e) => handleInputChange('subtitle', e.target.value)}
              />
              
            <Input 
              label="Button Text" 
              placeholder="e.g., Order Now" 
              value={newBanner.button_text}
                onChange={(e) => handleInputChange('button_text', e.target.value)}
            />
              
            <Input 
              label="Button Link" 
              placeholder="e.g., /products" 
              value={newBanner.button_url}
                onChange={(e) => handleInputChange('button_url', e.target.value)}
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select 
              className="w-full rounded-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-3 text-sm focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:focus:ring-primary-400/20"
              value={newBanner.is_active ? 'active' : 'inactive'}
                  onChange={(e) => handleInputChange('is_active', e.target.value === 'active')}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
              
            </div>
            
            {/* Middle - Banner Image Section */}
            <div className="space-y-3">
            <FileUpload
              label="Desktop Banner Image"
              accept="image/*"
              maxSize={5}
              onFileSelect={handleFileSelect}
              onFileRemove={handleFileRemove}
              files={uploadedFiles}
              helperText="Required. Recommended: 1280×400 px (aspect 32:10). Used on laptop/desktop. Max 5 MB."
              />
              <FileUpload
                label="Mobile Banner Image (optional)"
                accept="image/*"
                maxSize={5}
                onFileSelect={handleFileSelectMobile}
                onFileRemove={handleFileRemoveMobile}
                files={uploadedFilesMobile}
                helperText="Optional. Recommended: 600×360 px (aspect 5:3). Used on phones/tablets. If not set, desktop image is used. Max 5 MB."
              />
              
              {/* Image Preview */}
              {uploadedFiles.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Desktop Image Preview
                  </label>
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800/50">
                    <img 
                      src={URL.createObjectURL(uploadedFiles[0])} 
                      alt="Banner preview" 
                      className="w-full h-40 object-cover rounded border border-gray-200 dark:border-gray-700"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {uploadedFiles[0].name} ({(uploadedFiles[0].size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  </div>
                </div>
              )}
              {uploadedFilesMobile.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mobile Image Preview
                  </label>
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800/50">
                    <img 
                      src={URL.createObjectURL(uploadedFilesMobile[0])} 
                      alt="Mobile banner preview" 
                      className="w-full h-40 object-cover rounded border border-gray-200 dark:border-gray-700"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {uploadedFilesMobile[0].name} ({(uploadedFilesMobile[0].size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Side - Live Preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Live Preview
                </label>
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  <button
                    onClick={() => setPreviewMode('desktop')}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      previewMode === 'desktop'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <Monitor className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setPreviewMode('mobile')}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      previewMode === 'mobile'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                  </button>
          </div>
          </div>
              
              <div className={`border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-900/50 ${
                previewMode === 'mobile' ? 'max-w-xs mx-auto' : 'w-full'
              }`}>
                <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                  {(() => {
                    const desktopSrc = uploadedFiles.length > 0 ? URL.createObjectURL(uploadedFiles[0]) : newBanner.image_url || '';
                    const mobileSrc = uploadedFilesMobile.length > 0 ? URL.createObjectURL(uploadedFilesMobile[0]) : (newBanner.image_url_mobile || newBanner.image_url || '');
                    const previewSrc = previewMode === 'mobile' ? (mobileSrc || desktopSrc) : desktopSrc;
                    const imgSrc = previewSrc.startsWith('blob:') ? previewSrc : resolveImageUrl(previewSrc);
                    return previewSrc ? (
                    <img 
                      src={imgSrc} 
                      alt="Banner preview" 
                      className={`w-full object-cover ${previewMode === 'mobile' ? 'h-48' : 'h-64'}`}
                    />
                  ) : (
                    <div className={`${previewMode === 'mobile' ? 'h-48' : 'h-64'} flex items-center justify-center bg-gray-200 dark:bg-gray-800`}>
                      <ImageIcon className="h-12 w-12 text-gray-400 dark:text-gray-600" />
        </div>
                  );
                  })()}
                  
                  {/* Overlay Content */}
                  {(newBanner.title || newBanner.subtitle || newBanner.button_text) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-gradient-to-t from-black/60 via-black/20 to-transparent">
                      {newBanner.title && (
                        <h3 className="text-white text-xl sm:text-2xl font-bold mb-2 text-center drop-shadow-lg">
                          {newBanner.title}
                        </h3>
                      )}
                      {newBanner.subtitle && (
                        <p className="text-white text-sm sm:text-base mb-4 text-center drop-shadow-md max-w-md">
                          {newBanner.subtitle}
                        </p>
                      )}
                      {newBanner.button_text && (
                        <button className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg shadow-lg transition-colors">
                          {newBanner.button_text}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
        <ModalFooter>
          <Button 
            variant="secondary" 
            onClick={() => {
              setShowAddModal(false);
              setNewBanner({ title: '', subtitle: '', button_text: '', button_url: '', image_url: '', image_url_mobile: '', is_active: true });
              setUploadedFiles([]);
              setUploadedFilesMobile([]);
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddBanner}
            disabled={actionLoading === 'add-banner' || !newBanner.title.trim()}
          >
            {actionLoading === 'add-banner' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Banner'
            )}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Edit Banner Modal - Compact & Trendy with dual Live Preview */}
      <Modal
        isOpen={!!editingBanner}
        onClose={() => {
          setEditingBanner(null);
          setEditBanner({ title: '', subtitle: '', button_text: '', button_url: '', image_url: '', image_url_mobile: '', is_active: true });
          setUploadedFiles([]);
          setUploadedFilesMobile([]);
          setEditDesktopDims(null);
          setEditMobileDims(null);
        }}
        title="Edit Banner"
        size="full"
      >
        {editingBanner && (
          <div className="w-full max-w-6xl mx-auto">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 xl:gap-10 pb-4">
              {/* Left: Form in two clear sections */}
              <div className="space-y-6">
                {/* Section 1: Banner details */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 rounded-full bg-primary-500" />
                    Banner details
                  </h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Title"
                        placeholder="e.g. Summer Sale"
                        value={editBanner.title}
                        onChange={(e) => handleEditInputChange('title', e.target.value)}
                        required
                      />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
                        <select
                          className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                          value={editBanner.is_active ? 'active' : 'inactive'}
                          onChange={(e) => handleEditInputChange('is_active', e.target.value === 'active')}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                    <Input
                      label="Subtitle"
                      placeholder="Short line under the title"
                      value={editBanner.subtitle}
                      onChange={(e) => handleEditInputChange('subtitle', e.target.value)}
                    />
                    <Input
                      label="Button text"
                      placeholder="e.g. Shop now"
                      value={editBanner.button_text}
                      onChange={(e) => handleEditInputChange('button_text', e.target.value)}
                    />
                    <Input
                      label="Button link"
                      placeholder="https://... or /page-path"
                      value={editBanner.button_url}
                      onChange={(e) => handleEditInputChange('button_url', e.target.value)}
                    />
                  </div>
                </div>

                {/* Section 2: Images */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 rounded-full bg-primary-500" />
                    Images
                  </h3>
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 p-4 space-y-4">
                    <div>
                      <FileUpload
                        label="Desktop image"
                        accept="image/*"
                        maxSize={5}
                        onFileSelect={handleFileSelect}
                        onFileRemove={handleFileRemove}
                        files={uploadedFiles}
                        helperText="Recommended: 1280×400 px (aspect 32:10). Max 5 MB."
                      />
                      {editDesktopDims && (
                        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                          Current: <span className="font-medium text-primary-600 dark:text-primary-400">{editDesktopDims.w} × {editDesktopDims.h} px</span>
                        </p>
                      )}
                    </div>
                    <div>
                      <FileUpload
                        label="Mobile image (optional)"
                        accept="image/*"
                        maxSize={5}
                        onFileSelect={handleFileSelectMobile}
                        onFileRemove={handleFileRemoveMobile}
                        files={uploadedFilesMobile}
                        helperText="Recommended: 600×360 px (aspect 5:3). If empty, desktop image is used on mobile. Max 5 MB."
                      />
                      {editMobileDims && (
                        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                          Current: <span className="font-medium text-primary-600 dark:text-primary-400">{editMobileDims.w} × {editMobileDims.h} px</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Live Preview */}
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/50 shadow-md overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary-500" />
                    Live preview
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">How this banner will look on desktop and mobile.</p>
                </div>
                <div className="p-4 space-y-5">
                  {/* Desktop preview */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Monitor className="h-4 w-4 text-gray-500 dark:text-gray-400" aria-hidden />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Desktop</span>
                    </div>
                    <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-800">
                      <div className="relative aspect-[3/1] min-h-[90px]">
                        {(() => {
                          const desktopSrc = uploadedFiles.length > 0 ? URL.createObjectURL(uploadedFiles[0]) : (editBanner.image_url || editingBanner?.image_url || '');
                          return desktopSrc ? (
                            <>
                              <img
                                src={desktopSrc.startsWith('blob:') ? desktopSrc : resolveImageUrl(desktopSrc)}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                              {(editBanner.title || editBanner.subtitle || editBanner.button_text) && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-3 bg-gradient-to-t from-black/60 via-transparent to-transparent">
                                  {editBanner.title && <span className="text-white text-sm font-bold drop-shadow-lg">{editBanner.title}</span>}
                                  {editBanner.subtitle && <span className="text-white/90 text-xs drop-shadow line-clamp-1 max-w-full">{editBanner.subtitle}</span>}
                                  {editBanner.button_text && (
                                    <span className="mt-1.5 px-3 py-1.5 bg-primary-500 text-white text-xs font-semibold rounded-lg">{editBanner.button_text}</span>
                                  )}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                              <ImageIcon className="h-8 w-8" />
                              <span className="text-xs">Add desktop image to see preview</span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Mobile preview */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Smartphone className="h-4 w-4 text-gray-500 dark:text-gray-400" aria-hidden />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Mobile</span>
                    </div>
                    <div className="max-w-[200px] mx-auto rounded-[1.75rem] overflow-hidden border-[5px] border-gray-300 dark:border-gray-600 bg-gray-800 shadow-lg">
                      <div className="relative w-full aspect-[9/19] bg-black overflow-hidden">
                        {(() => {
                          const mobileSrc = uploadedFilesMobile.length > 0 ? URL.createObjectURL(uploadedFilesMobile[0]) : (editBanner.image_url_mobile || editingBanner?.image_url_mobile || editBanner.image_url || editingBanner?.image_url || '');
                          return mobileSrc ? (
                            <>
                              <img
                                src={mobileSrc.startsWith('blob:') ? mobileSrc : resolveImageUrl(mobileSrc)}
                                alt=""
                                className="absolute inset-0 w-full h-full object-cover object-top"
                              />
                              {(editBanner.title || editBanner.subtitle || editBanner.button_text) && (
                                <div className="absolute inset-0 flex flex-col items-center justify-end p-2.5 pb-5 bg-gradient-to-t from-black/70 via-transparent to-transparent">
                                  {editBanner.title && <span className="text-white text-[10px] font-bold drop-shadow-lg text-center truncate max-w-full">{editBanner.title}</span>}
                                  {editBanner.subtitle && <span className="text-white/90 text-[9px] drop-shadow text-center line-clamp-2 max-w-full mt-0.5">{editBanner.subtitle}</span>}
                                  {editBanner.button_text && (
                                    <span className="mt-1 px-2 py-0.5 bg-primary-500 text-white text-[9px] font-semibold rounded">{editBanner.button_text}</span>
                                  )}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-gray-800 text-gray-500 p-3">
                              <ImageIcon className="h-6 w-6" />
                              <span className="text-[10px] text-center">Add image to see preview</span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        <ModalFooter>
          <Button 
            variant="secondary" 
            onClick={() => {
              setEditingBanner(null);
              setEditBanner({ title: '', subtitle: '', button_text: '', button_url: '', image_url: '', image_url_mobile: '', is_active: true });
              setUploadedFiles([]);
              setUploadedFilesMobile([]);
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleEditBanner}
            disabled={actionLoading === 'edit-banner' || !editBanner.title.trim()}
          >
            {actionLoading === 'edit-banner' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!bannerToDelete}
        onClose={() => setBannerToDelete(null)}
        title="Delete Banner"
        size="sm"
        showCloseButton={false}
      >
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Are you sure you want to delete this banner?
          </h3>
          
          {bannerToDelete && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                <span className="font-medium">Title:</span> {bannerToDelete.title}
              </p>
              {bannerToDelete.subtitle && (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Subtitle:</span> {bannerToDelete.subtitle}
                </p>
              )}
            </div>
          )}
          
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            This action cannot be undone. The banner will be permanently removed from your system.
          </p>
        </div>
        
        <ModalFooter>
          <Button 
            variant="secondary" 
            onClick={() => setBannerToDelete(null)}
            disabled={actionLoading === `delete-${bannerToDelete?.id}`}
          >
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={confirmDeleteBanner}
            disabled={actionLoading === `delete-${bannerToDelete?.id}`}
          >
            {actionLoading === `delete-${bannerToDelete?.id}` ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Banner'
            )}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Phase 3: Analytics Modal */}
      {showAnalytics && (
        <Modal
          isOpen={true}
          onClose={() => setShowAnalytics(null)}
          title="Banner Analytics"
          size="large"
        >
          <div className="space-y-6">
            {analyticsLoading[showAnalytics] ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600 dark:text-primary-400" />
                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading analytics...</span>
              </div>
            ) : banners.find(b => b.id === showAnalytics) && bannerAnalytics[showAnalytics] ? (
              <>
                <div className="bg-gradient-to-r from-primary-50/50 to-orange-50/50 dark:from-primary-900/10 dark:to-orange-900/10 rounded-xl p-5 sm:p-6 border border-primary-100/50 dark:border-primary-800/30 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {banners.find(b => b.id === showAnalytics)?.title}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium ml-12">
                    Performance metrics and insights
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-5">
                  <Card className="hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700">
                    <CardContent className="p-5 sm:p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl shadow-sm">
                          <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Views</p>
                      </div>
                      <p className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight">
                        {bannerAnalytics[showAnalytics].views.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700">
                    <CardContent className="p-5 sm:p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-green-100 dark:bg-green-900/30 rounded-xl shadow-sm">
                          <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Clicks</p>
                      </div>
                      <p className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight">
                        {bannerAnalytics[showAnalytics].clicks.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700">
                    <CardContent className="p-5 sm:p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-orange-100 dark:bg-orange-900/30 rounded-xl shadow-sm">
                          <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">CTR</p>
                      </div>
                      <p className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight">
                        {bannerAnalytics[showAnalytics].ctr}%
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700">
                    <CardContent className="p-5 sm:p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-xl shadow-sm">
                          <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Revenue</p>
                      </div>
                      <p className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight">
                        ₹{bannerAnalytics[showAnalytics].revenue?.toLocaleString() || '0'}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Trends Charts */}
                {bannerAnalytics[showAnalytics].trends && bannerAnalytics[showAnalytics].trends!.length > 0 && (
                  <div className="space-y-6">
                    <Card className="border border-gray-200 dark:border-gray-700">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-base font-bold text-gray-900 dark:text-gray-100">Performance Trends</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={bannerAnalytics[showAnalytics].trends}>
                            <defs>
                              <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                            <XAxis 
                              dataKey="date" 
                              className="text-xs text-gray-600 dark:text-gray-400"
                              tickFormatter={(value) => {
                                const date = new Date(value);
                                return `${date.getMonth() + 1}/${date.getDate()}`;
                              }}
                            />
                            <YAxis className="text-xs text-gray-600 dark:text-gray-400" />
                            <RechartsTooltip 
                              contentStyle={{ 
                                backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                                border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
                                borderRadius: '8px',
                                color: isDarkMode ? '#f3f4f6' : '#111827'
                              }}
                              labelFormatter={(value) => {
                                const date = new Date(value);
                                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                              }}
                            />
                            <Legend wrapperStyle={{ color: isDarkMode ? '#f3f4f6' : '#111827' }} />
                            <Area 
                              type="monotone" 
                              dataKey="views" 
                              stroke="#3b82f6" 
                              fillOpacity={1} 
                              fill="url(#colorViews)"
                              name="Views"
                            />
                            <Area 
                              type="monotone" 
                              dataKey="clicks" 
                              stroke="#10b981" 
                              fillOpacity={1} 
                              fill="url(#colorClicks)"
                              name="Clicks"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card className="border border-gray-200 dark:border-gray-700">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-base font-bold text-gray-900 dark:text-gray-100">Revenue & Conversions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={bannerAnalytics[showAnalytics].trends}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                            <XAxis 
                              dataKey="date" 
                              className="text-xs text-gray-600 dark:text-gray-400"
                              tickFormatter={(value) => {
                                const date = new Date(value);
                                return `${date.getMonth() + 1}/${date.getDate()}`;
                              }}
                            />
                            <YAxis className="text-xs text-gray-600 dark:text-gray-400" />
                            <RechartsTooltip 
                              contentStyle={{ 
                                backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                                border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
                                borderRadius: '8px',
                                color: isDarkMode ? '#f3f4f6' : '#111827'
                              }}
                              labelFormatter={(value) => {
                                const date = new Date(value);
                                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                              }}
                              formatter={(value: any) => {
                                if (typeof value === 'number') {
                                  return value.toLocaleString();
                                }
                                return value;
                              }}
                            />
                            <Legend wrapperStyle={{ color: isDarkMode ? '#f3f4f6' : '#111827' }} />
                            <Bar dataKey="revenue" fill="#a855f7" name="Revenue (₹)" />
                            <Bar dataKey="conversions" fill="#f59e0b" name="Conversions" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {bannerAnalytics[showAnalytics].lastViewed && (
                  <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                      <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 dark:text-gray-100">Last viewed:</span>
                      <span className="ml-2 font-medium text-gray-700 dark:text-gray-300">{new Date(bannerAnalytics[showAnalytics].lastViewed!).toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">No analytics data available</p>
              </div>
            )}
          </div>
          <ModalFooter>
            <Button 
              variant="secondary" 
              onClick={() => {
                if (showAnalytics && bannerAnalytics[showAnalytics]) {
                  // Export to CSV
                  const analytics = bannerAnalytics[showAnalytics];
                  const trends = analytics.trends || [];
                  
                  // Create CSV content
                  let csvContent = 'Banner Analytics Report\n\n';
                  csvContent += `Banner: ${banners.find(b => b.id === showAnalytics)?.title || 'N/A'}\n`;
                  csvContent += `Period: Last 30 days\n`;
                  csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;
                  
                  csvContent += 'Summary\n';
                  csvContent += `Views,${analytics.views}\n`;
                  csvContent += `Clicks,${analytics.clicks}\n`;
                  csvContent += `CTR,${analytics.ctr}%\n`;
                  csvContent += `Conversions,${analytics.conversions || 0}\n`;
                  csvContent += `Revenue,₹${analytics.revenue || 0}\n\n`;
                  
                  if (trends.length > 0) {
                    csvContent += 'Daily Trends\n';
                    csvContent += 'Date,Views,Clicks,Conversions,Revenue,CTR\n';
                    trends.forEach((trend: { date: string; views: number; clicks: number; conversions: number; revenue: number; ctr: string }) => {
                      csvContent += `${trend.date},${trend.views},${trend.clicks},${trend.conversions},₹${trend.revenue},${trend.ctr}%\n`;
                    });
                  }
                  
                  // Download CSV
                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  const link = document.createElement('a');
                  const url = URL.createObjectURL(blob);
                  link.setAttribute('href', url);
                  link.setAttribute('download', `banner-analytics-${showAnalytics}-${new Date().toISOString().split('T')[0]}.csv`);
                  link.style.visibility = 'hidden';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  
                  showSuccess('Export Successful', 'Analytics data exported to CSV');
                }
              }}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button 
              variant="secondary" 
              onClick={async () => {
                if (showAnalytics) {
                  setAnalyticsLoading(prev => ({ ...prev, [showAnalytics]: true }));
                  try {
                    const response = await bannerService.getBannerAnalytics(showAnalytics, 30);
                    if (response.success && response.data) {
                      setBannerAnalytics(prev => ({
                        ...prev,
                        [showAnalytics]: {
                          views: response.data!.views || 0,
                          clicks: response.data!.clicks || 0,
                          ctr: parseFloat(response.data!.ctr.toString()) || 0,
                          conversions: response.data!.conversions || 0,
                          revenue: response.data!.revenue || 0,
                          lastViewed: response.data!.lastViewed || null,
                          trends: response.data!.trends || []
                        }
                      }));
                    }
                  } catch (error) {
                    console.error('Error refreshing analytics:', error);
                    showError('Error', 'Failed to refresh analytics data');
                  } finally {
                    setAnalyticsLoading(prev => ({ ...prev, [showAnalytics]: false }));
                  }
                }
              }}
              disabled={analyticsLoading[showAnalytics]}
            >
              {analyticsLoading[showAnalytics] ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </>
              )}
            </Button>
            <Button variant="secondary" onClick={() => setShowAnalytics(null)}>Close</Button>
          </ModalFooter>
        </Modal>
      )}

      {/* Phase 3: Scheduling Modal */}
      {showScheduling && (
        <Modal
          isOpen={true}
          onClose={() => setShowScheduling(null)}
          title="Schedule Publishing"
          size="large"
        >
          <div className="space-y-6">
            {banners.find(b => b.id === showScheduling) && (
              <>
                <div className="bg-gradient-to-r from-orange-50/50 to-amber-50/50 dark:from-orange-900/10 dark:to-amber-900/10 rounded-xl p-5 sm:p-6 border border-orange-100/50 dark:border-orange-800/30 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                      <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {banners.find(b => b.id === showScheduling)?.title}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium ml-12">
                    Set automatic activation and deactivation times
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-800/50 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">
                      Start Date (Auto-activate)
                    </label>
                    <Input
                      type="datetime-local"
                      value={bannerSchedules[showScheduling]?.startDate?.slice(0, 16) || ''}
                      onChange={(e) => {
                        const startDate = e.target.value ? new Date(e.target.value).toISOString() : null;
                        setBannerSchedules(prev => ({
                          ...prev,
                          [showScheduling]: {
                            ...prev[showScheduling],
                            startDate,
                            isScheduled: !!(startDate || prev[showScheduling]?.endDate)
                          }
                        }));
                      }}
                      className="w-full text-base"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 font-medium flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      Banner will be automatically activated at this time
                    </p>
                  </div>

                  <div className="bg-white dark:bg-gray-800/50 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">
                      End Date (Auto-deactivate)
                    </label>
                    <Input
                      type="datetime-local"
                      value={bannerSchedules[showScheduling]?.endDate?.slice(0, 16) || ''}
                      onChange={(e) => {
                        const endDate = e.target.value ? new Date(e.target.value).toISOString() : null;
                        setBannerSchedules(prev => ({
                          ...prev,
                          [showScheduling]: {
                            ...prev[showScheduling],
                            endDate,
                            isScheduled: !!(prev[showScheduling]?.startDate || endDate)
                          }
                        }));
                      }}
                      className="w-full text-base"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 font-medium flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      Banner will be automatically deactivated at this time
                    </p>
                  </div>

                  {bannerSchedules[showScheduling]?.isScheduled && (
                    <div className="p-5 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl flex items-center gap-4 shadow-sm">
                      <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl shadow-sm">
                        <Timer className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <p className="text-base font-bold text-primary-900 dark:text-primary-100">
                          Scheduling is active
                        </p>
                        <p className="text-sm text-primary-700 dark:text-primary-300 mt-1 font-medium">
                          Banner will activate/deactivate automatically
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setShowScheduling(null)}>Cancel</Button>
            <Button onClick={() => {
              if (showScheduling) {
                handleSaveSchedule(
                  showScheduling,
                  bannerSchedules[showScheduling]?.startDate || null,
                  bannerSchedules[showScheduling]?.endDate || null
                );
              }
            }}>
              Save Schedule
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {/* Phase 3: Templates Modal */}
      {showTemplates && (
        <Modal
          isOpen={true}
          onClose={() => setShowTemplates(false)}
          title="Banner Templates"
          size="lg"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Choose a template to quickly create a new banner with pre-filled content
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bannerTemplates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleApplyTemplate(template)}
                  className="cursor-pointer"
                >
                  <Card className="hover:shadow-md transition-shadow h-full">
                    <div className="relative">
                      <img
                        src={template.preview}
                        alt={template.name}
                        className="w-full h-32 object-cover rounded-t-lg"
                      />
                      <div className="absolute top-2 right-2">
                        <span className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-semibold text-gray-900 dark:text-gray-100">
                          {template.name}
                        </span>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {template.description}
                      </p>
                      <Button size="sm" className="w-full">
                        <Copy className="h-3.5 w-3.5 mr-1.5" />
                        Use Template
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setShowTemplates(false)}>Close</Button>
          </ModalFooter>
        </Modal>
      )}

      {/* Phase 3: A/B Testing Modal */}
      {showABTesting && (
        <Modal
          isOpen={true}
          onClose={() => setShowABTesting(null)}
          title="A/B Testing"
          size="large"
        >
          <div className="space-y-6">
            {banners.find(b => b.id === showABTesting) && (
              <>
                <div className="bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-900/10 dark:to-blue-900/10 rounded-xl p-5 sm:p-6 border border-purple-100/50 dark:border-purple-800/30 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <FlaskConical className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      Test: {banners.find(b => b.id === showABTesting)?.title}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium ml-12">
                    Compare two banner variants to see which performs better
                  </p>
                </div>

                {abTests[showABTesting] ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-5 lg:gap-6">
                      <Card className="hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700">
                        <CardHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
                          <CardTitle className="text-base font-bold text-gray-900 dark:text-gray-100">Variant A (Original)</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                          {banners.find(b => b.id === showABTesting) && (
                            <div>
                              <img
                                src={resolveImageUrl(banners.find(b => b.id === showABTesting)!.image_url)}
                                alt="Variant A"
                                className="w-full h-40 object-cover rounded-xl mb-4 border-2 border-gray-200 dark:border-gray-700 shadow-sm"
                              />
                              <div className="space-y-3">
                                <div className="flex items-center gap-3 p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                  <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                  <div>
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Views</p>
                                    <p className="text-base font-bold text-gray-900 dark:text-gray-100">
                                      {abTests[showABTesting].results?.variantA.views || 0}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 p-2.5 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                  <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                  <div>
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">CTR</p>
                                    <p className="text-base font-bold text-gray-900 dark:text-gray-100">
                                      {abTests[showABTesting].results?.variantA.ctr || 0}%
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Card className="hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700">
                        <CardHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
                          <CardTitle className="text-base font-bold text-gray-900 dark:text-gray-100">Variant B</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                          {abTests[showABTesting]?.variantBanner && (
                            <div>
                              <img
                                src={resolveImageUrl(abTests[showABTesting].variantBanner!.image_url)}
                                alt="Variant B"
                                className="w-full h-40 object-cover rounded-xl mb-4 border-2 border-gray-200 dark:border-gray-700 shadow-sm"
                              />
                              <div className="space-y-3">
                                <div className="flex items-center gap-3 p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                  <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                  <div>
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Views</p>
                                    <p className="text-base font-bold text-gray-900 dark:text-gray-100">
                                      {abTests[showABTesting].results?.variantB.views || 0}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 p-2.5 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                  <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                  <div>
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">CTR</p>
                                    <p className="text-base font-bold text-gray-900 dark:text-gray-100">
                                      {abTests[showABTesting].results?.variantB.ctr || 0}%
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {abTests[showABTesting].status === 'running' && (
                      <div className="flex items-center justify-between p-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl shadow-sm">
                            <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-base font-bold text-gray-900 dark:text-gray-100">
                              Test is running
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mt-1">
                              Traffic split: {100 - abTests[showABTesting].trafficSplit}% / {abTests[showABTesting].trafficSplit}%
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleEndABTest(showABTesting)}
                        >
                          End Test
                        </Button>
                      </div>
                    )}

                    {abTests[showABTesting].status === 'completed' && abTests[showABTesting].results?.winner && (
                      <div className="p-5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-4 shadow-sm">
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl shadow-sm">
                          <Award className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-base font-bold text-gray-900 dark:text-gray-100">
                            Winner: Variant {abTests[showABTesting].results?.winner}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mt-1">
                            Test completed successfully
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        Select an existing banner as Variant B to compare with this banner (Variant A)
                      </p>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800/50 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">
                        Select Variant B Banner
                      </label>
                      <select
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-base"
                        onChange={(e) => {
                          const variantId = parseInt(e.target.value);
                          if (variantId && variantId !== showABTesting) {
                            const variantBanner = banners.find(b => b.id === variantId);
                            if (variantBanner) {
                              setAbTests(prev => ({
                                ...prev,
                                [showABTesting]: {
                                  variantId: variantBanner.id,
                                  variantBanner,
                                  startDate: new Date().toISOString(),
                                  trafficSplit: 50,
                                  status: 'draft'
                                }
                              }));
                            }
                          }
                        }}
                      >
                        <option value="">Select a banner...</option>
                        {banners.filter(b => b.id !== showABTesting).map(banner => (
                          <option key={banner.id} value={banner.id}>
                            {banner.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    {showABTesting !== null && (() => {
                      const testId = showABTesting;
                      const abTest = abTests[testId];
                      return abTest?.variantBanner && (
                        <>
                          <div className="bg-white dark:bg-gray-800/50 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                            <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">
                              Traffic Split (Variant B %)
                            </label>
                            <input
                              type="range"
                              min="10"
                              max="90"
                              step="10"
                              value={abTest?.trafficSplit || 50}
                              onChange={(e) => {
                                setAbTests(prev => ({
                                  ...prev,
                                  [testId]: {
                                    ...prev[testId],
                                    trafficSplit: parseInt(e.target.value)
                                  }
                                }));
                              }}
                              className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                            />
                            <div className="flex justify-between text-sm font-bold text-gray-900 dark:text-gray-100 mt-3">
                              <span>Variant A: {100 - (abTest?.trafficSplit || 50)}%</span>
                              <span>Variant B: {abTest?.trafficSplit || 50}%</span>
                            </div>
                          </div>

                          <Button
                            onClick={() => {
                              if (testId !== null && abTest?.variantBanner) {
                                handleStartABTest(testId, abTest.variantBanner, abTest.trafficSplit);
                              }
                            }}
                            className="w-full"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Start A/B Test
                          </Button>
                        </>
                      );
                    })()}

                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        variant="secondary"
                        onClick={() => {
                          const originalBanner = banners.find(b => b.id === showABTesting);
                          if (originalBanner) {
                            setEditingBanner(null);
                            setNewBanner({
                              title: `${originalBanner.title} (Variant)`,
                              subtitle: originalBanner.subtitle,
                              button_text: originalBanner.button_text,
                              button_url: originalBanner.button_url,
                              image_url: originalBanner.image_url,
                              image_url_mobile: originalBanner.image_url_mobile ?? '',
                              is_active: false
                            });
                            setShowAddModal(true);
                            setShowABTesting(null);
                            showInfo('Create Variant', 'Create a new variant banner, then start the A/B test.');
                          }
                        }}
                        className="w-full"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Create New Variant Instead
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setShowABTesting(null)}>Close</Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
};
