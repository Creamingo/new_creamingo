import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Clock, 
  GripVertical,
  CheckCircle,
  XCircle,
  BarChart3,
  RefreshCw,
  Calendar,
  CalendarDays,
  Save,
  Copy,
  ChevronDown,
  ChevronUp,
  Minus,
  ExternalLink,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Zap,
  Package
} from 'lucide-react';
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
  arrayMove,
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
import { Modal } from '../components/ui/Modal';
import TimePicker from '../components/ui/TimePicker';
import ToastContainer from '../components/ui/ToastContainer';
import { useToastContext } from '../contexts/ToastContext';
import deliverySlotService, { 
  DeliverySlot, 
  DeliverySlotStats
} from '../services/deliverySlotService';

// Tooltip Component - Matching Dashboard Style
const DashboardTooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
  const [show, setShow] = useState(false);
  
  const tooltipContent = show ? (
    <div className="absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-lg whitespace-nowrap bottom-full left-1/2 transform -translate-x-1/2 mb-2">
      {text}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
        <div className="border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
      </div>
    </div>
  ) : null;
  
  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {tooltipContent}
    </div>
  );
};

// Types
interface SlotFormData {
  slotName: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  displayOrder: string;
}

interface SlotAvailability {
  id: number;
  slotId: number;
  slotName: string;
  startTime: string;
  endTime: string;
  deliveryDate: string;
  availableOrders: number;
  maxOrders: number;
  displayOrderLimit: number;
  availabilityThresholdHigh: number;
  availabilityThresholdMedium: number;
  isAvailable: boolean;
}

interface DateAvailabilityData {
  [date: string]: SlotAvailability[];
}

// Sortable Row Component
interface SortableSlotRowProps {
  slot: DeliverySlot;
  index: number;
  onEdit: (slot: DeliverySlot) => void;
  onDelete: (slot: DeliverySlot) => void;
  onToggleStatus: (slot: DeliverySlot) => void;
}

const SortableSlotRow: React.FC<SortableSlotRowProps> = ({ 
  slot, 
  index,
  onEdit, 
  onDelete, 
  onToggleStatus 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slot.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const icon = deliverySlotService.getSlotIcon(slot.slotName);
  const timeRange = deliverySlotService.formatTimeRange(slot.startTime, slot.endTime);

  return (
    <tr 
      ref={setNodeRef} 
      style={style} 
      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 border-b border-gray-100 dark:border-gray-700"
    >
      {/* Order Column */}
      <td className="px-3 py-4 whitespace-nowrap text-center">
        <div className="flex items-center justify-center gap-2">
          <div
            {...attributes}
            {...listeners}
            className="p-1 hover:bg-gray-200 rounded cursor-grab active:cursor-grabbing touch-none transition-colors"
          >
            <GripVertical className="w-4 h-4 text-gray-500" />
          </div>
          <span className="text-sm text-gray-600 font-semibold">
            #{index + 1}
          </span>
        </div>
      </td>
      
      {/* Display Order Column */}
      <td className="px-3 py-4 whitespace-nowrap text-center">
        <div className="flex items-center justify-center">
          <span className="text-base font-bold text-gray-800 dark:text-white bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-700">
            {slot.displayOrder}
          </span>
        </div>
      </td>
      
      {/* Slot Name Column */}
      <td className="px-4 py-4 whitespace-nowrap text-center">
        <div className="flex items-center justify-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {slot.slotName}
            </div>
            <div className="text-sm text-gray-600 font-medium">
              {timeRange}
            </div>
          </div>
        </div>
      </td>
      
      {/* Time Range Column */}
      <td className="px-4 py-4 whitespace-nowrap text-center">
        <div className="flex items-center justify-center gap-2">
          <Clock className="w-5 h-5 text-blue-500 dark:text-blue-400" />
          <span className="text-base text-gray-800 dark:text-gray-200 font-mono font-semibold">
            {timeRange}
          </span>
        </div>
      </td>
      
      {/* Status Column */}
      <td className="px-4 py-4 whitespace-nowrap text-center">
        <DashboardTooltip text={slot.isActive ? 'Deactivate slot' : 'Activate slot'}>
          <button
            onClick={() => onToggleStatus(slot)}
            className={`relative inline-flex h-6 w-12 items-center rounded-full border-2 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
              slot.isActive
                ? 'bg-green-500 dark:bg-green-600 border-green-500 dark:border-green-600 focus:ring-green-400 dark:focus:ring-green-500 shadow-lg shadow-green-200 dark:shadow-green-900/50'
                : 'bg-gray-300 dark:bg-gray-600 border-gray-400 dark:border-gray-500 focus:ring-gray-400 dark:focus:ring-gray-500'
            }`}
          >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white dark:bg-gray-200 shadow-md transition-all duration-300 ease-in-out ${
              slot.isActive ? 'translate-x-6' : 'translate-x-0.5'
            }`}
          />
          </button>
        </DashboardTooltip>
      </td>
      
      {/* Actions Column */}
      <td className="px-4 py-4 whitespace-nowrap text-left">
        <div className="flex items-center gap-2">
          <DashboardTooltip text="Edit slot">
            <button 
              onClick={() => onEdit(slot)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 border border-transparent hover:border-primary-200 dark:hover:border-primary-700"
            >
              <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </DashboardTooltip>
          <DashboardTooltip text="Delete slot">
            <button 
              onClick={() => onDelete(slot)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent hover:border-red-200 dark:hover:border-red-700"
            >
              <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </DashboardTooltip>
        </div>
      </td>
    </tr>
  );
};

const DeliverySlots: React.FC = () => {
  // Toast notifications
  const { toasts, removeToast, showSuccess, showError, showWarning, showInfo } = useToastContext();

  // State management
  const [slots, setSlots] = useState<DeliverySlot[]>([]);
  const [stats, setStats] = useState<DeliverySlotStats>({
    totalSlots: 0,
    activeSlots: 0,
    inactiveSlots: 0,
    avgMaxOrders: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<DeliverySlot | null>(null);
  const [deletingSlot, setDeletingSlot] = useState<DeliverySlot | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<SlotFormData>({
    slotName: '',
    startTime: '',
    endTime: '',
    isActive: true,
    displayOrder: '0'
  });
  const [formErrors, setFormErrors] = useState<Partial<SlotFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justReordered, setJustReordered] = useState(false);

  // Availability Management State
  const [selectedDates, setSelectedDates] = useState<string[]>(() => {
    // Restore selected dates from localStorage on page load
    const saved = localStorage.getItem('delivery-slots-selected-dates');
    return saved ? JSON.parse(saved) : [];
  });
  const [dateAvailabilityData, setDateAvailabilityData] = useState<DateAvailabilityData>({});
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [bulkAvailabilityValues, setBulkAvailabilityValues] = useState<{[slotId: number]: number}>({});
  const [isAvailabilityTableExpanded, setIsAvailabilityTableExpanded] = useState<boolean>(() => {
    // Restore expansion state from localStorage on page load
    const saved = localStorage.getItem('delivery-slots-table-expanded');
    return saved ? JSON.parse(saved) : false;
  });
  
  // Local table state for efficient editing
  const [localTableData, setLocalTableData] = useState<Record<string, Record<number, {
    maxOrders: number;
    availableOrders: number;
    isAvailable: boolean;
  }>>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // New state for enhanced features
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());
  const [slotSearchTerm, setSlotSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ field: string; direction: 'asc' | 'desc' } | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load data from API
  const loadData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      setError(null);

      const [slotsResponse, statsResponse] = await Promise.all([
        deliverySlotService.getDeliverySlots(statusFilter === 'all' ? undefined : statusFilter === 'active'),
        deliverySlotService.getDeliverySlotStats()
      ]);

      // Filter slots by search term
      let filteredSlots = slotsResponse;
      if (debouncedSearchTerm) {
        filteredSlots = slotsResponse.filter((slot: DeliverySlot) =>
          slot.slotName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          deliverySlotService.formatTimeRange(slot.startTime, slot.endTime).toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        );
      }

      setSlots(filteredSlots);
      setStats(statsResponse);
      setError(null);
    } catch (error) {
      console.error('Error loading data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
      showError('Data Load Failed', error instanceof Error ? error.message : 'Failed to load delivery slots data', 2000);
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, [statusFilter, debouncedSearchTerm, showError]);

  // Load data when component mounts
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle filter changes without loading spinner
  useEffect(() => {
    // Don't reload data if we just reordered items
    if (justReordered) {
      console.log('Skipping data reload - just reordered items');
      setJustReordered(false);
      return;
    }
    
    loadData(false);
  }, [statusFilter, debouncedSearchTerm, justReordered, loadData]);

  // Save selected dates to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('delivery-slots-selected-dates', JSON.stringify(selectedDates));
  }, [selectedDates]);

  // Filter dateAvailabilityData to only include selected dates
  useEffect(() => {
    if (selectedDates.length === 0) {
      // Clear all data if no dates selected
      setDateAvailabilityData({});
      setLocalTableData({});
      setHasUnsavedChanges(false);
    } else {
      // Filter out data for dates that are no longer selected
      setDateAvailabilityData(prev => {
        const filtered: DateAvailabilityData = {};
        selectedDates.forEach(date => {
          if (prev[date]) {
            filtered[date] = prev[date];
          }
        });
        return filtered;
      });
      
      // Also filter local table data
      setLocalTableData(prev => {
        const filtered: Record<string, Record<number, {
          maxOrders: number;
          availableOrders: number;
          isAvailable: boolean;
        }>> = {};
        selectedDates.forEach(date => {
          if (prev[date]) {
            filtered[date] = prev[date];
          }
        });
        return filtered;
      });
    }
  }, [selectedDates]);

  // Save table expansion state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('delivery-slots-table-expanded', JSON.stringify(isAvailabilityTableExpanded));
  }, [isAvailabilityTableExpanded]);

  // Auto-load availability data if dates are restored from localStorage
  useEffect(() => {
    if (selectedDates.length > 0 && isAvailabilityTableExpanded) {
      loadAvailabilityForDates(selectedDates);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - dependencies intentionally excluded

  // Form validation
  const validateForm = (): boolean => {
    const errors: Partial<SlotFormData> = {};

    // Slot name validation
    if (!formData.slotName.trim()) {
      errors.slotName = 'Slot name is required';
    } else if (formData.slotName.trim().length < 2) {
      errors.slotName = 'Slot name must be at least 2 characters long';
    } else if (formData.slotName.trim().length > 50) {
      errors.slotName = 'Slot name must be less than 50 characters';
    }

    // Time validation
    if (!formData.startTime) {
      errors.startTime = 'Start time is required';
    }
    if (!formData.endTime) {
      errors.endTime = 'End time is required';
    }
    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      errors.endTime = 'End time must be after start time';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form handlers
  const handleInputChange = (field: keyof SlotFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const slotData = {
        slotName: formData.slotName.trim(),
        startTime: formData.startTime,
        endTime: formData.endTime,
        isActive: formData.isActive,
        displayOrder: Number(formData.displayOrder)
      };

      if (editingSlot) {
        const updatedSlot = await deliverySlotService.updateDeliverySlot(editingSlot.id, slotData);
        // Update local state instead of full reload
        setSlots(prev => prev.map(slot => slot.id === editingSlot.id ? updatedSlot : slot));
        showSuccess('Slot Updated', 'Delivery slot updated successfully', 1500);
      } else {
        const newSlot = await deliverySlotService.createDeliverySlot(slotData);
        // Update local state instead of full reload
        setSlots(prev => [newSlot, ...prev]);
        setStats(prev => ({ ...prev, totalSlots: prev.totalSlots + 1 }));
        showSuccess('Slot Created', 'New delivery slot created successfully', 1500);
      }

      handleCloseModal();
    } catch (error) {
      console.error('Error saving slot:', error);
      showError('Save Failed', error instanceof Error ? error.message : 'Failed to save delivery slot', 2000);
      setError(error instanceof Error ? error.message : 'Failed to save delivery slot');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSlot(null);
    setFormData({
      slotName: '',
      startTime: '',
      endTime: '',
      isActive: true,
      displayOrder: '0'
    });
    setFormErrors({});
  };

  const handleEdit = (slot: DeliverySlot) => {
    setEditingSlot(slot);
    setFormData({
      slotName: slot.slotName,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isActive: slot.isActive,
      displayOrder: slot.displayOrder.toString()
    });
    setIsModalOpen(true);
  };

  const handleDelete = (slot: DeliverySlot) => {
    setDeletingSlot(slot);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingSlot) return;

    try {
      await deliverySlotService.deleteDeliverySlot(deletingSlot.id);
      // Update local state instead of full reload
      setSlots(prev => prev.filter(slot => slot.id !== deletingSlot.id));
      setStats(prev => ({ 
        ...prev, 
        totalSlots: prev.totalSlots - 1,
        [deletingSlot.isActive ? 'activeSlots' : 'inactiveSlots']: prev[deletingSlot.isActive ? 'activeSlots' : 'inactiveSlots'] - 1
      }));
      setIsDeleteModalOpen(false);
      setDeletingSlot(null);
      showSuccess('Slot Deleted', 'Delivery slot deleted successfully', 1500);
    } catch (error) {
      console.error('Error deleting slot:', error);
      showError('Delete Failed', error instanceof Error ? error.message : 'Failed to delete delivery slot', 2000);
      setError(error instanceof Error ? error.message : 'Failed to delete delivery slot');
    }
  };

  const toggleStatus = async (slot: DeliverySlot) => {
    try {
      await deliverySlotService.toggleSlotStatus(slot.id);
      // Update local state instead of full reload
      setSlots(prev => prev.map(s => 
        s.id === slot.id ? { ...s, isActive: !s.isActive } : s
      ));
      setStats(prev => ({
        ...prev,
        activeSlots: slot.isActive ? prev.activeSlots - 1 : prev.activeSlots + 1,
        inactiveSlots: slot.isActive ? prev.inactiveSlots + 1 : prev.inactiveSlots - 1
      }));
      showSuccess('Status Updated', `Slot status updated to ${!slot.isActive ? 'active' : 'inactive'}`, 1500);
    } catch (error) {
      console.error('Error updating status:', error);
      showError('Status Update Failed', error instanceof Error ? error.message : 'Failed to update status', 2000);
      setError(error instanceof Error ? error.message : 'Failed to update status');
    }
  };

  const handleRefresh = async () => {
    showInfo('Refreshing', 'Reloading delivery slots data...');
    await loadData();
  };

  // Handle drag end for reordering
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    
    console.log('Drag end event:', { activeId: active.id, overId: over?.id });

    if (over && active.id !== over.id) {
      const oldIndex = slots.findIndex((item) => item.id === active.id);
      const newIndex = slots.findIndex((item) => item.id === over.id);

      console.log('Drag indices:', { oldIndex, newIndex });

      if (oldIndex !== -1 && newIndex !== -1) {
        // Update local state immediately for better UX
        const newSlots = arrayMove(slots, oldIndex, newIndex);
        setSlots(newSlots);

        try {
          // Update display order for all slots
          const updatePromises = newSlots.map((slot, index) => 
            deliverySlotService.updateDeliverySlot(slot.id, { displayOrder: index + 1 })
          );

          await Promise.all(updatePromises);
          
          showSuccess('Order Updated', 'Delivery slot order updated successfully', 1500);
          
          // Set flag to prevent data reloading
          setJustReordered(true);
          
        } catch (error) {
          console.error('Error updating slot order:', error);
          showError('Order Update Failed', `Failed to update slot order: ${error instanceof Error ? error.message : 'Unknown error'}`, 3000);
          
          // Revert local state on error
          setSlots(slots);
        }
      }
    }
  }, [slots, showSuccess, showError]);

  // Availability Management Functions
  const loadAvailabilityForDates = useCallback(async (dates: string[]) => {
    if (dates.length === 0) {
      // Clear all data if no dates selected
      setDateAvailabilityData({});
      setLocalTableData({});
      setHasUnsavedChanges(false);
      return;
    }
    
    setIsLoadingAvailability(true);
    try {
      const availabilityData: DateAvailabilityData = {};
      
      for (const date of dates) {
        try {
          console.log(`📅 Loading availability for date: ${date}`);
          const response = await deliverySlotService.getSlotAvailability(date, date);
          console.log(`✅ Received ${Array.isArray(response) ? response.length : 0} slots for ${date}`);
          // Ensure response is an array and filter by exact date match
          const slots = Array.isArray(response) ? response : [];
          // Filter slots to only include those matching the exact date (in case API returns range)
          const filteredSlots = slots.filter((slot: any) => {
            const slotDate = slot.deliveryDate ? slot.deliveryDate.split('T')[0] : null;
            const matches = slotDate === date;
            if (!matches && slotDate) {
              console.log(`⚠️ Slot date mismatch: Expected ${date}, got ${slotDate}`);
            }
            return matches;
          });
          availabilityData[date] = filteredSlots;
        } catch (error) {
          console.error(`Error loading availability for ${date}:`, error);
          // Set empty array for failed dates
          availabilityData[date] = [];
        }
      }
      
      // Validate and fix data consistency
      const validatedData = validateAvailabilityData(availabilityData);
      
      // Only keep data for selected dates - filter out any old dates
      const filteredData: DateAvailabilityData = {};
      dates.forEach(date => {
        if (validatedData[date]) {
          filteredData[date] = validatedData[date];
        }
      });
      
      setDateAvailabilityData(filteredData);
      
      // Initialize local table data
      initializeLocalTableData(filteredData);
    } catch (error) {
      console.error('Error loading availability data:', error);
      showError('Failed to load availability data');
    } finally {
      setIsLoadingAvailability(false);
    }
  }, [showError]);

  // Validate availability data to ensure consistency
  const validateAvailabilityData = (data: DateAvailabilityData): DateAvailabilityData => {
    const validatedData: DateAvailabilityData = {};
    
    for (const [date, slots] of Object.entries(data)) {
      validatedData[date] = slots.map(slot => {
        // Ensure we have valid numbers
        const maxOrders = slot.maxOrders || 10; // Default to 10 if undefined
        const availableOrders = slot.availableOrders || 0; // Default to 0 if undefined
        
        // Ensure available orders don't exceed max orders
        const validAvailableOrders = Math.min(availableOrders, maxOrders);
        
        // If there was a correction, show a warning
        if (validAvailableOrders !== availableOrders) {
          console.warn(`Fixed data inconsistency for ${slot.slotName} on ${date}: Available Orders (${availableOrders}) exceeded Max Orders (${maxOrders}). Adjusted to ${validAvailableOrders}.`);
        }
        
        return {
          ...slot,
          maxOrders: maxOrders,
          availableOrders: validAvailableOrders
        };
      });
    }
    
    return validatedData;
  };


  const handleRefreshAvailability = async () => {
    if (selectedDates.length > 0) {
      // Clear existing data first, then reload
      setDateAvailabilityData({});
      setLocalTableData({});
      setHasUnsavedChanges(false);
      await loadAvailabilityForDates(selectedDates);
      showSuccess('Availability data refreshed successfully');
    }
  };

  const handleClearAllDates = () => {
    setSelectedDates([]);
    setDateAvailabilityData({});
    setLocalTableData({});
    setHasUnsavedChanges(false);
    setIsAvailabilityTableExpanded(false);
    showInfo('All dates cleared', 'Select new dates to view slot availability');
  };

  const handleToggleAvailabilityTable = () => {
    const newExpanded = !isAvailabilityTableExpanded;
    setIsAvailabilityTableExpanded(newExpanded);
    
    if (newExpanded && selectedDates.length > 0) {
      loadAvailabilityForDates(selectedDates);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const updateSlotAvailability = async (slotId: number, date: string, value: number, fieldType: 'availableOrders' | 'maxOrders' = 'availableOrders') => {
    try {
      if (fieldType === 'availableOrders') {
        await deliverySlotService.updateSlotAvailability({
          slotId,
          deliveryDate: date,
          availableOrders: value,
          isAvailable: value > 0
        });
      } else if (fieldType === 'maxOrders') {
        // Update the slot's max orders (this would require a separate API call)
        // For now, we'll update the local state
        setDateAvailabilityData(prev => ({
          ...prev,
          [date]: prev[date]?.map(slot => 
            slot.slotId === slotId 
              ? { ...slot, maxOrders: value }
              : slot
          ) || []
        }));
        showSuccess('Max orders updated locally');
        return;
      }

      // Update local state
      setDateAvailabilityData(prev => ({
        ...prev,
        [date]: prev[date]?.map(slot => 
          slot.slotId === slotId 
            ? { ...slot, availableOrders: value }
            : slot
        ) || []
      }));
      
      showSuccess('Availability updated successfully');
    } catch (error) {
      console.error('Error updating availability:', error);
      showError('Failed to update availability');
    }
  };

  const handleBulkApply = async () => {
    if (selectedDates.length === 0) {
      showWarning('Please select dates first');
      return;
    }

    try {
      const promises = [];
      
      for (const date of selectedDates) {
        for (const [slotId, availableOrders] of Object.entries(bulkAvailabilityValues)) {
          const ordersValue = typeof availableOrders === 'number' ? availableOrders : Number(availableOrders) || 0;
          if (ordersValue !== undefined && !isNaN(ordersValue)) {
            promises.push(
              deliverySlotService.updateSlotAvailability({
                slotId: Number(slotId),
                deliveryDate: date,
                availableOrders: ordersValue,
                isAvailable: ordersValue > 0
              })
            );
          }
        }
      }
      
      await Promise.all(promises);
      
      // Reload availability data
      await loadAvailabilityForDates(selectedDates);
      
      setBulkEditMode(false);
      setBulkAvailabilityValues({});
      showSuccess(`Availability applied to ${selectedDates.length} date(s)`);
    } catch (error) {
      console.error('Error applying bulk availability:', error);
      showError('Failed to apply bulk availability');
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getAvailabilityColor = (slot: SlotAvailability, date: string) => {
    const currentIsAvailable = getCurrentValue(date, slot.slotId, 'isAvailable', slot.isAvailable) as boolean;
    const currentAvailableOrders = getCurrentValue(date, slot.slotId, 'availableOrders', slot.availableOrders) as number;
    const currentMaxOrders = getCurrentValue(date, slot.slotId, 'maxOrders', slot.maxOrders) as number;
    
    // If slot is disabled, always show as grey
    if (!currentIsAvailable) {
      return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600';
    }
    
    // Calculate availability percentage: (available orders / max orders) * 100
    const availabilityPercentage = Math.round((currentAvailableOrders / currentMaxOrders) * 100);
    
    if (currentAvailableOrders === 0) {
      return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600';
    } else if (availabilityPercentage >= 50) {
      return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700';
    } else if (availabilityPercentage >= 20) {
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700';
    } else {
      return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700';
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getAvailabilityStatus = (slot: SlotAvailability, date: string) => {
    const currentIsAvailable = getCurrentValue(date, slot.slotId, 'isAvailable', slot.isAvailable) as boolean;
    const currentAvailableOrders = getCurrentValue(date, slot.slotId, 'availableOrders', slot.availableOrders) as number;
    const currentMaxOrders = getCurrentValue(date, slot.slotId, 'maxOrders', slot.maxOrders) as number;
    
    // If slot is disabled, always show as disabled
    if (!currentIsAvailable) {
      return '⚪ Disabled';
    }
    
    // Calculate availability percentage: (available orders / max orders) * 100
    const availabilityPercentage = Math.round((currentAvailableOrders / currentMaxOrders) * 100);
    
    if (currentAvailableOrders === 0) {
      return '⚪ Full';
    } else if (availabilityPercentage >= 50) {
      return '🟢 No Rush';
    } else if (availabilityPercentage >= 20) {
      return '🟡 Filling Fast';
    } else {
      return '🔴 Almost Full';
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getAvailabilityPercentage = (slot: SlotAvailability, date: string) => {
    const currentAvailableOrders = getCurrentValue(date, slot.slotId, 'availableOrders', slot.availableOrders) as number;
    const currentMaxOrders = getCurrentValue(date, slot.slotId, 'maxOrders', slot.maxOrders) as number;
    return Math.round((currentAvailableOrders / currentMaxOrders) * 100);
  };

  // Initialize local table data when availability data is loaded
  const initializeLocalTableData = (data: DateAvailabilityData) => {
    const localData: Record<string, Record<number, {
      maxOrders: number;
      availableOrders: number;
      isAvailable: boolean;
    }>> = {};
    
    Object.entries(data).forEach(([date, slots]) => {
      localData[date] = {};
      slots.forEach(slot => {
        console.log('Initializing slot data:', { date, slotId: slot.slotId, slot });
        localData[date][slot.slotId] = {
          maxOrders: slot.maxOrders || 10, // Default to 10 if undefined
          availableOrders: slot.availableOrders || 0, // Default to 0 if undefined
          isAvailable: slot.isAvailable !== undefined ? slot.isAvailable : true // Default to true if undefined
        };
      });
    });
    
    console.log('Initialized local table data:', localData);
    setLocalTableData(localData);
    setHasUnsavedChanges(false);
  };

  // Update local table data
  const updateLocalTableData = (date: string, slotId: number, field: 'maxOrders' | 'availableOrders' | 'isAvailable', value: number | boolean) => {
    setLocalTableData(prev => ({
      ...prev,
      [date]: {
        ...prev[date],
        [slotId]: {
          ...prev[date]?.[slotId],
          [field]: value
        }
      }
    }));
    setHasUnsavedChanges(true);
  };

  // Get current value from local data or fallback to original data
  const getCurrentValue = (date: string, slotId: number, field: 'maxOrders' | 'availableOrders' | 'isAvailable', originalValue: number | boolean) => {
    const localValue = localTableData[date]?.[slotId]?.[field];
    
    // If we have a local value, use it
    if (localValue !== undefined && localValue !== null) {
      return localValue;
    }
    
    // Otherwise, use original value with defaults
    if (field === 'maxOrders') {
      return originalValue || 10; // Default to 10 if undefined
    } else if (field === 'availableOrders') {
      return originalValue || 0; // Default to 0 if undefined
    } else if (field === 'isAvailable') {
      return originalValue !== undefined ? originalValue : true; // Default to true if undefined
    }
    
    return originalValue;
  };

  // Save all local changes to backend
  const saveAllChanges = async () => {
    try {
      const updatePromises: Promise<void>[] = [];
      
      Object.entries(localTableData).forEach(([date, slots]) => {
        Object.entries(slots).forEach(([slotIdStr, data]) => {
          const slotId = parseInt(slotIdStr);
          updatePromises.push(
            deliverySlotService.updateSlotAvailability({
              slotId,
              deliveryDate: date,
              maxOrders: data.maxOrders,
              availableOrders: data.availableOrders,
              isAvailable: data.isAvailable
            })
          );
        });
      });
      
      await Promise.all(updatePromises);
      
      // Refresh the data to show updated values
      await loadAvailabilityForDates(selectedDates);
      setHasUnsavedChanges(false);
      showSuccess('All changes saved successfully');
    } catch (error) {
      console.error('Error saving changes:', error);
      showError('Failed to save some changes');
    }
  };

  // Toggle slot availability for specific date (now uses local state)
  const toggleSlotAvailability = (slotId: number, date: string, isAvailable: boolean) => {
    updateLocalTableData(date, slotId, 'isAvailable', isAvailable);
    // If disabling, set available orders to 0; if enabling, set to 1
    updateLocalTableData(date, slotId, 'availableOrders', isAvailable ? 1 : 0);
  };

  // Toggle date collapse
  const toggleDateCollapse = (date: string) => {
    setCollapsedDates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  };

  // Get date color for visual distinction
  const getDateColor = (date: string, index: number) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-purple-500 to-purple-600',
      'from-pink-500 to-pink-600',
      'from-orange-500 to-orange-600',
      'from-green-500 to-green-600',
      'from-indigo-500 to-indigo-600',
      'from-teal-500 to-teal-600'
    ];
    return colors[index % colors.length];
  };

  // Format date for display
  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.getTime() === today.getTime()) {
      return { label: 'Today', date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };
    } else if (date.getTime() === tomorrow.getTime()) {
      return { label: 'Tomorrow', date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };
    } else {
      return {
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };
    }
  };

  // Filter and sort slots
  const getFilteredAndSortedSlots = () => {
    let filteredData: DateAvailabilityData = {};
    
    // Filter by selected dates
    Object.entries(dateAvailabilityData).forEach(([date, slots]) => {
      if (selectedDates.includes(date)) {
        // Filter by search term
        const filteredSlots = slots.filter(slot => {
          if (!slotSearchTerm) return true;
          const searchLower = slotSearchTerm.toLowerCase();
          return (
            slot.slotName.toLowerCase().includes(searchLower) ||
            deliverySlotService.formatTimeRange(slot.startTime, slot.endTime).toLowerCase().includes(searchLower)
          );
        });
        
        if (filteredSlots.length > 0) {
          // Sort slots
          const sortedSlots = [...filteredSlots].sort((a, b) => {
            if (!sortConfig) {
              // Default sort by time (start time)
              return a.startTime.localeCompare(b.startTime);
            }
            
            let aValue: any, bValue: any;
            switch (sortConfig.field) {
              case 'slotName':
                aValue = a.slotName;
                bValue = b.slotName;
                break;
              case 'time':
                aValue = a.startTime;
                bValue = b.startTime;
                break;
              case 'available':
                aValue = getCurrentValue(date, a.slotId, 'availableOrders', a.availableOrders) as number;
                bValue = getCurrentValue(date, b.slotId, 'availableOrders', b.availableOrders) as number;
                break;
              case 'maxOrders':
                aValue = getCurrentValue(date, a.slotId, 'maxOrders', a.maxOrders) as number;
                bValue = getCurrentValue(date, b.slotId, 'maxOrders', b.maxOrders) as number;
                break;
              default:
                return 0;
            }
            
            if (typeof aValue === 'string') {
              return sortConfig.direction === 'asc' 
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
            } else {
              return sortConfig.direction === 'asc' 
                ? (aValue as number) - (bValue as number)
                : (bValue as number) - (aValue as number);
            }
          });
          
          filteredData[date] = sortedSlots;
        }
      }
    });
    
    return filteredData;
  };

  // Progress Bar Component
  const ProgressBar: React.FC<{ percentage: number; size?: 'sm' | 'md' | 'lg' }> = ({ percentage, size = 'md' }) => {
    const heightClass = size === 'sm' ? 'h-1.5' : size === 'md' ? 'h-2' : 'h-3';
    const getColor = () => {
      if (percentage >= 50) return 'bg-green-500';
      if (percentage >= 20) return 'bg-yellow-500';
      if (percentage > 0) return 'bg-orange-500';
      return 'bg-gray-300';
    };
    
    return (
      <div className={`w-full ${heightClass} bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden`}>
        <div
          className={`${getColor()} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        />
      </div>
    );
  };

  // Enhanced Status Badge Component
  const StatusBadge: React.FC<{ slot: SlotAvailability; date: string }> = ({ slot, date }) => {
    const currentIsAvailable = getCurrentValue(date, slot.slotId, 'isAvailable', slot.isAvailable) as boolean;
    const currentAvailableOrders = getCurrentValue(date, slot.slotId, 'availableOrders', slot.availableOrders) as number;
    const currentMaxOrders = getCurrentValue(date, slot.slotId, 'maxOrders', slot.maxOrders) as number;
    const percentage = currentMaxOrders > 0 ? Math.round((currentAvailableOrders / currentMaxOrders) * 100) : 0;
    
    if (!currentIsAvailable) {
      return (
        <div className="flex flex-col items-center gap-1.5">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600">
            <XCircle className="w-3 h-3 mr-1" />
            Disabled
          </span>
          <ProgressBar percentage={0} size="sm" />
        </div>
      );
    }
    
    if (currentAvailableOrders === 0) {
      return (
        <div className="flex flex-col items-center gap-1.5">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Full
          </span>
          <ProgressBar percentage={0} size="sm" />
        </div>
      );
    }
    
    let statusConfig: { icon: React.ReactNode; text: string; bg: string; textColor: string; border: string };
    
    if (percentage >= 50) {
      statusConfig = {
        icon: <CheckCircle className="w-3 h-3 mr-1" />,
        text: 'Available',
        bg: 'bg-green-100 dark:bg-green-900/30',
        textColor: 'text-green-700 dark:text-green-400',
        border: 'border-green-300 dark:border-green-700'
      };
    } else if (percentage >= 20) {
      statusConfig = {
        icon: <AlertTriangle className="w-3 h-3 mr-1" />,
        text: 'Low Stock',
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        textColor: 'text-yellow-700 dark:text-yellow-400',
        border: 'border-yellow-300 dark:border-yellow-700'
      };
    } else {
      statusConfig = {
        icon: <XCircle className="w-3 h-3 mr-1" />,
        text: 'Almost Full',
        bg: 'bg-orange-100 dark:bg-orange-900/30',
        textColor: 'text-orange-700 dark:text-orange-400',
        border: 'border-orange-300 dark:border-orange-700'
      };
    }
    
    return (
      <div className="flex flex-col items-center gap-1 w-full">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusConfig.bg} ${statusConfig.textColor} border ${statusConfig.border}`}>
          {statusConfig.icon}
          {statusConfig.text}
        </span>
        <div className="w-full">
          <ProgressBar percentage={percentage} size="sm" />
          <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 mt-0.5 block text-center">
            {currentAvailableOrders} / {currentMaxOrders} ({percentage}%)
          </span>
        </div>
      </div>
    );
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get status filter label
  const getStatusFilterLabel = () => {
    switch (statusFilter) {
      case 'active':
        return `Active (${stats.activeSlots})`;
      case 'inactive':
        return `Inactive (${stats.inactiveSlots})`;
      default:
        return `All (${stats.totalSlots})`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
      
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="w-full px-3 sm:px-4 lg:px-6">
          <div className="py-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Delivery Slots</h1>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  Manage delivery time slots and their availability
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleRefresh}
                  variant="ghost"
                  className="px-3 py-2 text-xs font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors h-9 dark:text-gray-300"
                  title="Refresh delivery slots data"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Refresh
                </Button>
                <Button 
                  onClick={() => setIsModalOpen(true)} 
                  className="group relative overflow-hidden bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 hover:from-pink-700 hover:via-rose-700 hover:to-pink-700 text-white font-semibold px-4 sm:px-6 py-2.5 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-pink-500/30 hover:border-pink-400/50 flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <Clock className="w-4 h-4 relative z-10" />
                  <Plus className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">Add Slot</span>
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
              <Card>
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Total Slots</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none mt-0.5">
                        {stats.totalSlots}
                      </p>
                    </div>
                    <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Active Slots</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400 leading-none mt-0.5">
                        {stats.activeSlots}
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
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Inactive Slots</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400 leading-none mt-0.5">
                        {stats.inactiveSlots}
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
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Avg. Max Orders</p>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 leading-none mt-0.5">
                        {stats.avgMaxOrders}
                      </p>
                    </div>
                    <BarChart3 className="w-4 h-4 text-orange-400 dark:text-orange-500 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full px-3 sm:px-4 lg:px-6 py-4 space-y-4">
        {/* Unified Delivery Slot Management Section */}
        <Card className="overflow-hidden border border-primary-100/50 dark:border-primary-800/30 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-primary-50/50 to-orange-50/50 dark:from-primary-900/10 dark:to-orange-900/10 px-4 sm:px-5 md:px-6 py-4 sm:py-5 border-b border-primary-100/50 dark:border-primary-800/30">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
                  <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 dark:text-primary-400" />
                  Daily Slot Availability Management
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Manage all slots for specific dates in one unified view
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 md:p-6">
          <div className="space-y-6">

            {/* Date Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-gray-700 dark:text-gray-300">Select Date</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 7 }, (_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() + i);
                  // Use local date to avoid timezone issues (toISOString uses UTC which can shift the date)
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  const dateStr = `${year}-${month}-${day}`;
                  const isSelected = selectedDates.includes(dateStr);

                  return (
                    <button
                      key={dateStr}
                      onClick={() => {
                        if (isSelected) {
                          const newDates = selectedDates.filter(d => d !== dateStr);
                          setSelectedDates(newDates);
                          if (newDates.length === 0) {
                            setIsAvailabilityTableExpanded(false);
                            // Clear all data when no dates selected
                            setDateAvailabilityData({});
                            setLocalTableData({});
                            setHasUnsavedChanges(false);
                          }
                          // Data for deselected date will be removed by useEffect
                        } else {
                          const newDates = [...selectedDates, dateStr];
                          setSelectedDates(newDates);
                          setIsAvailabilityTableExpanded(true);
                          // Load data only for the newly selected date
                          loadAvailabilityForDates([dateStr]);
                        }
                      }}
                      className={`px-3 sm:px-4 py-2 rounded-lg border transition-all text-sm font-medium ${
                        isSelected
                          ? 'bg-gradient-to-r from-primary-600 to-orange-600 text-white border-primary-600 shadow-md'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                      }`}
                    >
                      {i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'short' })}
                      <br />
                      <span className="text-xs">{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </button>
                  );
                })}
              </div>

              {selectedDates.length > 0 && (
                <div className="flex items-center gap-3 flex-wrap">
                  <Button
                    onClick={handleToggleAvailabilityTable}
                    variant={isAvailabilityTableExpanded ? "secondary" : "primary"}
                    className="flex items-center gap-2 bg-gradient-to-r from-primary-600 to-orange-600 hover:from-primary-700 hover:to-orange-700 text-white font-semibold"
                  >
                    {isAvailabilityTableExpanded ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        Collapse Table
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        Expand Table
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={() => {
                      // Clear existing data first, then reload
                      setDateAvailabilityData({});
                      setLocalTableData({});
                      setHasUnsavedChanges(false);
                      loadAvailabilityForDates(selectedDates);
                    }}
                    disabled={isLoadingAvailability}
                    className="flex items-center gap-2 bg-gradient-to-r from-primary-600 to-orange-600 hover:from-primary-700 hover:to-orange-700 text-white font-semibold"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingAvailability ? 'animate-spin' : ''}`} />
                    Load All Slots for Selected Date(s)
                  </Button>

                  <Button
                    onClick={handleRefreshAvailability}
                    disabled={isLoadingAvailability || selectedDates.length === 0}
                    variant="ghost"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingAvailability ? 'animate-spin' : ''}`} />
                    Refresh Data
                  </Button>

                  <Button
                    onClick={handleClearAllDates}
                    variant="ghost"
                    className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <XCircle className="w-4 h-4" />
                    Clear All
                  </Button>

                  <Button
                    onClick={() => setBulkEditMode(!bulkEditMode)}
                    variant="secondary"
                    className="flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Bulk Edit Mode
                  </Button>
                </div>
              )}
            </div>

            {/* Unified Availability Table - Same structure as main table */}
            {selectedDates.length > 0 && isAvailabilityTableExpanded && Object.keys(dateAvailabilityData).length > 0 && (
              <div className="space-y-4">
                {/* Enhanced Header with Search and Filters */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 dark:text-primary-400" />
                        All Slots for Selected Date(s)
                      </h3>
                      <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-800 dark:text-primary-300 text-xs sm:text-sm font-semibold rounded-full border border-primary-200 dark:border-primary-700">
                        {Object.entries(getFilteredAndSortedSlots())
                          .reduce((sum, [, slots]) => sum + (slots?.length || 0), 0)} slots
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="relative flex-1 sm:flex-initial min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                        <Input
                          placeholder="Search slots..."
                          value={slotSearchTerm}
                          onChange={(e) => setSlotSearchTerm(e.target.value)}
                          className="pl-10 text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 rounded-lg p-1">
                        <DashboardTooltip text="Table view">
                          <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded transition-colors ${
                              viewMode === 'table'
                                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            <BarChart3 className="w-4 h-4" />
                          </button>
                        </DashboardTooltip>
                        <DashboardTooltip text="Card view">
                          <button
                            onClick={() => setViewMode('cards')}
                            className={`p-2 rounded transition-colors ${
                              viewMode === 'cards'
                                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            <CalendarDays className="w-4 h-4" />
                          </button>
                        </DashboardTooltip>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Bar */}
                  <div className="flex items-center gap-2 flex-wrap p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    {hasUnsavedChanges && (
                      <Button
                        onClick={saveAllChanges}
                        className="flex items-center gap-2 bg-gradient-to-r from-primary-600 to-orange-600 hover:from-primary-700 hover:to-orange-700 text-white font-semibold text-sm"
                      >
                        <Save className="w-4 h-4" />
                        Save Changes
                      </Button>
                    )}
                    {bulkEditMode && (
                      <Button
                        onClick={handleBulkApply}
                        className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold text-sm"
                      >
                        <Save className="w-4 h-4" />
                        Apply to {selectedDates.length} Date(s)
                      </Button>
                    )}
                    <div className="flex-1" />
                    <DashboardTooltip text="Sort by slot name">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSortConfig(prev => 
                          prev?.field === 'slotName' && prev.direction === 'asc'
                            ? { field: 'slotName', direction: 'desc' }
                            : { field: 'slotName', direction: 'asc' }
                        )}
                        className="text-xs"
                      >
                        <ArrowUpDown className="w-3 h-3 mr-1" />
                        Sort
                      </Button>
                    </DashboardTooltip>
                  </div>
                </div>

                {/* Enhanced Table View with Date Grouping */}
                {viewMode === 'table' ? (
                  <div className="space-y-4">
                    {Object.entries(getFilteredAndSortedSlots())
                      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                      .map(([date, slots], dateIndex) => {
                        const isCollapsed = collapsedDates.has(date);
                        const dateInfo = formatDateDisplay(date);
                        const dateColor = getDateColor(date, dateIndex);
                        const slotCount = slots?.length || 0;
                        
                        return (
                          <Card key={date} className="overflow-hidden border-l-4 border-l-primary-500 dark:border-l-primary-400 shadow-md hover:shadow-lg transition-shadow">
                            {/* Date Header - Collapsible */}
                            <button
                              onClick={() => toggleDateCollapse(date)}
                              className="w-full bg-gradient-to-r from-primary-50 to-orange-50 dark:from-primary-900/20 dark:to-orange-900/20 px-4 py-3 border-b border-primary-100 dark:border-primary-800/30 hover:from-primary-100 hover:to-orange-100 dark:hover:from-primary-900/30 dark:hover:to-orange-900/30 transition-all"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {isCollapsed ? (
                                    <ChevronDown className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                  ) : (
                                    <ChevronUp className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                  )}
                                  <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${dateColor}`} />
                                    <div className="text-left">
                                      <div className="font-bold text-gray-900 dark:text-white text-base">
                                        {dateInfo.label} • {dateInfo.date}
                                      </div>
                                      <div className="text-xs text-gray-600 dark:text-gray-400">
                                        {slotCount} slot{slotCount !== 1 ? 's' : ''}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-1 bg-white dark:bg-gray-800 text-xs font-semibold text-primary-600 dark:text-primary-400 rounded-full border border-primary-200 dark:border-primary-700">
                                    {date}
                                  </span>
                                </div>
                              </div>
                            </button>
                            
                            {/* Slots Table for this Date */}
                            {!isCollapsed && slots && slots.length > 0 && (
                              <div className="overflow-x-auto">
                                <table className="w-full">
                                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
                                    <tr>
                                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                        <div className="flex items-center gap-1.5">
                                          <Clock className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                                          Slot
                                        </div>
                                      </th>
                                      <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                        <div className="flex items-center justify-center gap-1.5">
                                          <Clock className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                                          Time
                                        </div>
                                      </th>
                                      <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                        <div className="flex items-center justify-center gap-1.5">
                                          <BarChart3 className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                                          Max Orders
                                        </div>
                                      </th>
                                      <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                        <div className="flex items-center justify-center gap-1.5">
                                          <Package className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                                          Available
                                        </div>
                                      </th>
                                      <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                        <div className="flex items-center justify-center gap-1.5">
                                          <CheckCircle className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                                          Status
                                        </div>
                                      </th>
                                      <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                        <div className="flex items-center justify-center gap-1.5">
                                          <Zap className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                                          Actions
                                        </div>
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                    {slots.map((slot) => {
                                      const currentMaxOrders = getCurrentValue(date, slot.slotId, 'maxOrders', slot.maxOrders) as number;
                                      const currentAvailableOrders = getCurrentValue(date, slot.slotId, 'availableOrders', slot.availableOrders) as number;
                                      const currentIsAvailable = getCurrentValue(date, slot.slotId, 'isAvailable', slot.isAvailable) as boolean;
                                      const slotIcon = deliverySlotService.getSlotIcon(slot.slotName);
                                      
                                      return (
                                        <tr 
                                          key={`${date}-${slot.slotId}`} 
                                          className={`group hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors duration-150 ${
                                            !currentIsAvailable ? 'opacity-50' : ''
                                          }`}
                                          style={{
                                            borderLeft: currentIsAvailable 
                                              ? (currentAvailableOrders / currentMaxOrders) >= 0.5 
                                                ? '3px solid rgb(34, 197, 94)' 
                                                : (currentAvailableOrders / currentMaxOrders) >= 0.2
                                                  ? '3px solid rgb(234, 179, 8)'
                                                  : '3px solid rgb(249, 115, 22)'
                                              : '3px solid rgb(156, 163, 175)'
                                          }}
                                        >
                                          {/* Slot Name & Icon */}
                                          <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                              <div className="text-2xl flex-shrink-0">{slotIcon}</div>
                                              <div>
                                                <div className="font-bold text-gray-900 dark:text-white text-sm">
                                                  {slot.slotName}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                  ID: {slot.slotId}
                                                </div>
                                              </div>
                                            </div>
                                          </td>
                                          
                                          {/* Time Range */}
                                          <td className="px-4 py-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                              <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
                                                <Clock className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                                {deliverySlotService.formatTimeRange(slot.startTime, slot.endTime)}
                                              </div>
                                            </div>
                                          </td>
                                          {/* Max Orders - Ultra Clean Design */}
                                          <td className="px-3 py-2.5">
                                            <div className="flex items-center justify-center gap-1">
                                              <DashboardTooltip text="Decrease">
                                                <button
                                                  onClick={() => {
                                                    const newMaxOrders = Math.max(1, currentMaxOrders - 1);
                                                    updateLocalTableData(date, slot.slotId, 'maxOrders', newMaxOrders);
                                                    if (currentAvailableOrders > newMaxOrders) {
                                                      updateLocalTableData(date, slot.slotId, 'availableOrders', newMaxOrders);
                                                    }
                                                  }}
                                                  disabled={currentMaxOrders <= 1}
                                                  className="w-5 h-5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                                                >
                                                  <Minus className="w-2.5 h-2.5" />
                                                </button>
                                              </DashboardTooltip>
                                              
                                              <Input
                                                type="number"
                                                min="1"
                                                max="100"
                                                value={currentMaxOrders}
                                                onChange={(e) => {
                                                  const newValue = Math.max(1, Math.min(100, Number(e.target.value) || 1));
                                                  updateLocalTableData(date, slot.slotId, 'maxOrders', newValue);
                                                  if (currentAvailableOrders > newValue) {
                                                    updateLocalTableData(date, slot.slotId, 'availableOrders', newValue);
                                                  }
                                                }}
                                                className="w-12 h-6 text-center text-xs font-semibold text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-0 bg-white dark:bg-gray-800 rounded px-1 py-0"
                                              />
                                              
                                              <DashboardTooltip text="Increase">
                                                <button
                                                  onClick={() => {
                                                    const newMaxOrders = Math.min(100, currentMaxOrders + 1);
                                                    updateLocalTableData(date, slot.slotId, 'maxOrders', newMaxOrders);
                                                  }}
                                                  disabled={currentMaxOrders >= 100}
                                                  className="w-5 h-5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                                                >
                                                  <Plus className="w-2.5 h-2.5" />
                                                </button>
                                              </DashboardTooltip>
                                            </div>
                                          </td>
                                          {/* Available Orders - Ultra Clean Design */}
                                          <td className="px-3 py-2.5">
                                            {bulkEditMode ? (
                                              <Input
                                                type="number"
                                                min="0"
                                                max={currentMaxOrders}
                                                value={bulkAvailabilityValues[slot.slotId] ?? currentAvailableOrders}
                                                onChange={(e) => {
                                                  const newValue = Number(e.target.value);
                                                  const validValue = Math.min(Math.max(0, newValue), currentMaxOrders);
                                                  setBulkAvailabilityValues(prev => ({
                                                    ...prev,
                                                    [slot.slotId]: validValue
                                                  }));
                                                }}
                                                className="w-14 h-6 text-center text-xs font-semibold border border-gray-300 dark:border-gray-600 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-0 bg-white dark:bg-gray-800 rounded px-1 py-0"
                                              />
                                            ) : (
                                              <div className="flex items-center justify-center gap-1">
                                                <DashboardTooltip text="Decrease (order received)">
                                                  <button
                                                    onClick={() => {
                                                      const newValue = Math.max(0, currentAvailableOrders - 1);
                                                      updateLocalTableData(date, slot.slotId, 'availableOrders', newValue);
                                                    }}
                                                    disabled={currentAvailableOrders <= 0 || !currentIsAvailable}
                                                    className="w-5 h-5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                                                  >
                                                    <Minus className="w-2.5 h-2.5" />
                                                  </button>
                                                </DashboardTooltip>
                                                
                                                <Input
                                                  type="number"
                                                  min="0"
                                                  max={currentMaxOrders}
                                                  value={currentAvailableOrders}
                                                  onChange={(e) => {
                                                    const newValue = Math.max(0, Math.min(currentMaxOrders, Number(e.target.value) || 0));
                                                    updateLocalTableData(date, slot.slotId, 'availableOrders', newValue);
                                                  }}
                                                  className={`w-12 h-6 text-center text-xs font-semibold border rounded px-1 py-0 focus:ring-0 ${
                                                    currentAvailableOrders > currentMaxOrders
                                                      ? 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 focus:border-red-500'
                                                      : currentAvailableOrders === 0
                                                        ? 'border-orange-300 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 focus:border-orange-500'
                                                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-primary-500 dark:focus:border-primary-400'
                                                  }`}
                                                />
                                                
                                                <DashboardTooltip text="Increase (order cancelled)">
                                                  <button
                                                    onClick={() => {
                                                      const newValue = Math.min(currentMaxOrders, currentAvailableOrders + 1);
                                                      updateLocalTableData(date, slot.slotId, 'availableOrders', newValue);
                                                    }}
                                                    disabled={currentAvailableOrders >= currentMaxOrders || !currentIsAvailable}
                                                    className="w-5 h-5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                                                  >
                                                    <Plus className="w-2.5 h-2.5" />
                                                  </button>
                                                </DashboardTooltip>
                                              </div>
                                            )}
                                          </td>
                                          {/* Status with Progress Bar */}
                                          <td className="px-3 py-2.5">
                                            <StatusBadge slot={slot} date={date} />
                                          </td>
                                          {/* Actions */}
                                          <td className="px-3 py-2.5">
                                            <div className="flex items-center justify-center gap-2">
                                              {/* Toggle Switch */}
                                              <DashboardTooltip text={currentIsAvailable ? 'Disable slot' : 'Enable slot'}>
                                                <button
                                                  onClick={() => toggleSlotAvailability(slot.slotId, date, !currentIsAvailable)}
                                                  className={`relative inline-flex h-5 w-9 items-center rounded-full border transition-all duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-offset-1 dark:focus:ring-offset-gray-800 ${
                                                    currentIsAvailable
                                                      ? 'bg-green-500 dark:bg-green-600 border-green-500 dark:border-green-600 focus:ring-green-400 dark:focus:ring-green-500'
                                                      : 'bg-gray-300 dark:bg-gray-600 border-gray-400 dark:border-gray-500 focus:ring-gray-400 dark:focus:ring-gray-500'
                                                  }`}
                                                >
                                                  <span
                                                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white dark:bg-gray-200 shadow-sm transition-all duration-200 ease-in-out ${
                                                      currentIsAvailable ? 'translate-x-4' : 'translate-x-0.5'
                                                    }`}
                                                  />
                                                </button>
                                              </DashboardTooltip>
                                              
                                              {/* Quick Decrement */}
                                              <DashboardTooltip text="Simulate order">
                                                <button
                                                  onClick={async () => {
                                                    try {
                                                      await deliverySlotService.decrementAvailableOrders(slot.slotId, date, 1);
                                                      await loadAvailabilityForDates(selectedDates);
                                                      showSuccess(`Order received for ${slot.slotName}`);
                                                    } catch (error) {
                                                      console.error('Error:', error);
                                                      showError('Failed to process');
                                                    }
                                                  }}
                                                  disabled={currentAvailableOrders <= 0 || !currentIsAvailable}
                                                  className="h-6 w-6 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all border border-gray-200 dark:border-gray-600"
                                                >
                                                  <Minus className="w-3 h-3" />
                                                </button>
                                              </DashboardTooltip>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </Card>
                        );
                      })}
                  </div>
                ) : (
                  /* Card View for Mobile */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(getFilteredAndSortedSlots())
                      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                      .map(([date, slots]) => 
                        slots?.map((slot) => {
                          const currentMaxOrders = getCurrentValue(date, slot.slotId, 'maxOrders', slot.maxOrders) as number;
                          const currentAvailableOrders = getCurrentValue(date, slot.slotId, 'availableOrders', slot.availableOrders) as number;
                          const currentIsAvailable = getCurrentValue(date, slot.slotId, 'isAvailable', slot.isAvailable) as boolean;
                          const slotIcon = deliverySlotService.getSlotIcon(slot.slotName);
                          const dateInfo = formatDateDisplay(date);
                          
                          return (
                            <Card key={`${date}-${slot.slotId}`} className="overflow-hidden hover:shadow-lg transition-all">
                              <div 
                                className="h-2 bg-gradient-to-r from-primary-500 to-orange-500"
                                style={{
                                  backgroundColor: currentIsAvailable 
                                    ? (currentAvailableOrders / currentMaxOrders) >= 0.5 
                                      ? 'rgb(34, 197, 94)' 
                                      : (currentAvailableOrders / currentMaxOrders) >= 0.2
                                        ? 'rgb(234, 179, 8)'
                                        : 'rgb(249, 115, 22)'
                                    : 'rgb(156, 163, 175)'
                                }}
                              />
                              <CardContent className="p-4">
                                <div className="space-y-3">
                                  {/* Header */}
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-2xl">{slotIcon}</span>
                                      <div>
                                        <div className="font-bold text-gray-900 dark:text-white">{slot.slotName}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{dateInfo.label} • {dateInfo.date}</div>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => toggleSlotAvailability(slot.slotId, date, !currentIsAvailable)}
                                      className={`relative inline-flex h-5 w-9 items-center rounded-full border-2 transition-all ${
                                        currentIsAvailable ? 'bg-green-500 dark:bg-green-600 border-green-500 dark:border-green-600' : 'bg-gray-300 dark:bg-gray-600 border-gray-400 dark:border-gray-500'
                                      }`}
                                    >
                                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white dark:bg-gray-200 transition-all ${
                                        currentIsAvailable ? 'translate-x-4' : 'translate-x-0.5'
                                      }`} />
                                    </button>
                                  </div>
                                  
                                  {/* Time */}
                                  <div className="flex items-center gap-2 text-sm">
                                    <Clock className="w-4 h-4 text-primary-600" />
                                    <span className="font-semibold">{deliverySlotService.formatTimeRange(slot.startTime, slot.endTime)}</span>
                                  </div>
                                  
                                  {/* Status */}
                                  <StatusBadge slot={slot} date={date} />
                                  
                                  {/* Controls */}
                                  <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                    <div>
                                      <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Max Orders</label>
                                      <div className="flex items-center gap-2">
                                        <button onClick={() => updateLocalTableData(date, slot.slotId, 'maxOrders', Math.max(1, currentMaxOrders - 1))} disabled={currentMaxOrders <= 1} className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 disabled:opacity-50 flex items-center justify-center">
                                          <Minus className="w-4 h-4" />
                                        </button>
                                        <Input type="number" min="1" max="100" value={currentMaxOrders} onChange={(e) => updateLocalTableData(date, slot.slotId, 'maxOrders', Math.max(1, Math.min(100, Number(e.target.value) || 1)))} className="flex-1 text-center font-bold" />
                                        <button onClick={() => updateLocalTableData(date, slot.slotId, 'maxOrders', Math.min(100, currentMaxOrders + 1))} disabled={currentMaxOrders >= 100} className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400 disabled:opacity-50 flex items-center justify-center">
                                          <Plus className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                    <div>
                                      <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Available</label>
                                      <div className="flex items-center gap-2">
                                        <button onClick={() => updateLocalTableData(date, slot.slotId, 'availableOrders', Math.max(0, currentAvailableOrders - 1))} disabled={currentAvailableOrders <= 0} className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 disabled:opacity-50 flex items-center justify-center">
                                          <TrendingDown className="w-4 h-4" />
                                        </button>
                                        <Input type="number" min="0" max={currentMaxOrders} value={currentAvailableOrders} onChange={(e) => updateLocalTableData(date, slot.slotId, 'availableOrders', Math.max(0, Math.min(currentMaxOrders, Number(e.target.value) || 0)))} className="flex-1 text-center font-bold" />
                                        <button onClick={() => updateLocalTableData(date, slot.slotId, 'availableOrders', Math.min(currentMaxOrders, currentAvailableOrders + 1))} disabled={currentAvailableOrders >= currentMaxOrders} className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400 disabled:opacity-50 flex items-center justify-center">
                                          <TrendingUp className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })
                      ).flat()}
                  </div>
                )}
              </div>
            )}

            {/* Enhanced Empty State */}
            {selectedDates.length > 0 && isAvailabilityTableExpanded && Object.keys(getFilteredAndSortedSlots()).length === 0 && !isLoadingAvailability && (
              <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700">
                <CardContent className="p-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-primary-100 to-orange-100 dark:from-primary-900/20 dark:to-orange-900/20 flex items-center justify-center">
                      <Calendar className="w-10 h-10 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Slots Found</h3>
                      {slotSearchTerm ? (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          No slots match your search "{slotSearchTerm}"
                        </p>
                      ) : (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          No availability data found for selected dates
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={() => {
                        setDateAvailabilityData({});
                        setLocalTableData({});
                        setHasUnsavedChanges(false);
                        loadAvailabilityForDates(selectedDates);
                      }}
                      className="bg-gradient-to-r from-primary-600 to-orange-600 hover:from-primary-700 hover:to-orange-700 text-white"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Load Slots
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Loading State */}
            {isLoadingAvailability && (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Loading slot availability data...</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          </CardContent>
        </Card>

      {/* Enhanced Filters and Quick Actions */}
      <Card className="overflow-hidden border border-primary-100/50 dark:border-primary-800/30 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-5 md:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <CardTitle className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Search className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 dark:text-primary-400" />
              Filters & Search
            </CardTitle>
            <div className="flex items-center gap-2">
              <DashboardTooltip text="Refresh data">
                <Button
                  onClick={handleRefresh}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </DashboardTooltip>
              <DashboardTooltip text="View website">
                <Button
                  onClick={() => window.open('/', '_blank')}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </DashboardTooltip>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 md:p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                <Input
                  placeholder="Search slots by name or time..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Status Filter Dropdown */}
            <div className="relative" ref={statusDropdownRef}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className="min-w-[140px] justify-between gap-2"
              >
                <span>{getStatusFilterLabel()}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} />
              </Button>
              {showStatusDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                  <button
                    onClick={() => {
                      setStatusFilter('all');
                      setShowStatusDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      statusFilter === 'all' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-semibold' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    All ({stats.totalSlots})
                  </button>
                  <button
                    onClick={() => {
                      setStatusFilter('active');
                      setShowStatusDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      statusFilter === 'active' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-semibold' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Active ({stats.activeSlots})
                  </button>
                  <button
                    onClick={() => {
                      setStatusFilter('inactive');
                      setShowStatusDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      statusFilter === 'inactive' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-semibold' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Inactive ({stats.inactiveSlots})
                  </button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Slot Master Table */}
      <Card className="overflow-hidden border border-primary-100/50 dark:border-primary-800/30 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-primary-50/50 to-orange-50/50 dark:from-primary-900/10 dark:to-orange-900/10 px-4 sm:px-5 md:px-6 py-4 sm:py-5 border-b border-primary-100/50 dark:border-primary-800/30">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 dark:text-primary-400" />
                Time Slot Master Table
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage slot definitions, names, time ranges, and status. Operational data is managed per date below.
              </p>
            </div>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <table className="w-full table-fixed">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b-2 border-gray-300 dark:border-gray-700">
                <tr>
                  <th className="w-20 px-3 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Order
                  </th>
                  <th className="w-24 px-3 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Display Order
                  </th>
                  <th className="w-56 px-4 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Slot Name
                  </th>
                  <th className="w-48 px-4 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Time Range
                  </th>
                  <th className="w-36 px-4 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="w-40 px-4 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex items-center justify-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
                        <span className="text-sm sm:text-base">Loading delivery slots...</span>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-red-500 dark:text-red-400">
                      <p className="text-base sm:text-lg font-medium mb-2">Error loading data</p>
                      <p className="text-sm mb-4">{error}</p>
                      <Button
                        onClick={() => {
                          showInfo('Retrying', 'Attempting to reload data...');
                          loadData();
                        }}
                        variant="secondary"
                        size="sm"
                        className="bg-gradient-to-r from-primary-600 to-orange-600 hover:from-primary-700 hover:to-orange-700 text-white"
                      >
                        Retry
                      </Button>
                    </td>
                  </tr>
                ) : slots.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                      <p className="text-base sm:text-lg font-medium mb-1 dark:text-gray-300">No delivery slots found</p>
                      <p className="text-sm dark:text-gray-400">Try adjusting your search or add a new delivery slot</p>
                    </td>
                  </tr>
                ) : (
                  <SortableContext items={slots.map(slot => slot.id)} strategy={verticalListSortingStrategy}>
                    {slots.map((slot, index) => (
                      <SortableSlotRow
                        key={slot.id}
                        slot={slot}
                        index={index}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onToggleStatus={toggleStatus}
                      />
                    ))}
                  </SortableContext>
                )}
              </tbody>
            </table>
          </DndContext>
        </div>
      </Card>
      </div>

      {/* Add/Edit Slot Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingSlot ? 'Edit Delivery Slot' : 'Add New Delivery Slot'}
        size="large-height"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Slot Name Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-base font-semibold text-gray-800 mb-3">Slot Information</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slot Name *
              </label>
              <Input
                type="text"
                placeholder="e.g., Morning, Afternoon, Evening"
                value={formData.slotName}
                onChange={(e) => handleInputChange('slotName', e.target.value)}
                className={`py-2 ${formErrors.slotName ? 'border-red-500' : ''}`}
              />
              {formErrors.slotName && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-1">{formErrors.slotName}</p>
              )}
            </div>
          </div>

          {/* Time Selection Section */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-base font-semibold text-gray-800 mb-3">Time Configuration</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <TimePicker
                  label="Start Time *"
                  value={formData.startTime}
                  onChange={(time) => handleInputChange('startTime', time)}
                  error={formErrors.startTime}
                  className="compact"
                />
              </div>

              <div>
                <TimePicker
                  label="End Time *"
                  value={formData.endTime}
                  onChange={(time) => handleInputChange('endTime', time)}
                  error={formErrors.endTime}
                  className="compact"
                />
              </div>
            </div>
          </div>

          {/* Display Order Section */}
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-3">Display Settings</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Display Order
              </label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={formData.displayOrder}
                onChange={(e) => handleInputChange('displayOrder', e.target.value)}
                className="py-2"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Order in which this slot appears in the list</p>
            </div>
            <div className="mt-3 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <p className="text-xs text-green-800 dark:text-green-300">
                <strong>Note:</strong> Max Orders, Available Orders, and availability thresholds are now managed 
                per date in the "All Slots for Selected Date(s)" table below for better operational control.
              </p>
            </div>
          </div>


          {/* Status Section */}
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
            <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-3">Status</h3>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={() => handleInputChange('isActive', true)}
                  className="h-4 w-4 text-orange-500 dark:text-orange-400"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="isActive"
                  checked={!formData.isActive}
                  onChange={() => handleInputChange('isActive', false)}
                  className="h-4 w-4 text-orange-500 dark:text-orange-400"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Inactive</span>
              </label>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              When active, customers can select this time slot for their delivery. 
              Inactive slots will not appear in the customer interface.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 -mx-4 -mb-4 rounded-b-lg">
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="px-6 py-2 text-sm font-medium rounded-md"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-primary-600 to-orange-600 hover:from-primary-700 hover:to-orange-700 text-white font-semibold px-6 py-2 text-sm rounded-md"
              >
                {isSubmitting ? 'Saving...' : editingSlot ? 'Update Slot' : 'Create Slot'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Delivery Slot"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <Trash2 className="w-6 h-6 text-red-500 dark:text-red-400" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Are you sure you want to delete this delivery slot?</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Slot: <span className="font-medium">{deletingSlot?.slotName}</span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Time: {deletingSlot ? deliverySlotService.formatTimeRange(deletingSlot.startTime, deletingSlot.endTime) : ''}
              </p>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This action cannot be undone. The delivery slot will be permanently removed from the system.
          </p>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete Slot
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DeliverySlots;
