import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  MapPin, 
  Upload,
  Download,
  Filter,
  GripVertical,
  CheckCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ArrowUpDown,
  Loader2,
  DollarSign
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
import ToastContainer from '../components/ui/ToastContainer';
import { useToastContext } from '../contexts/ToastContext';
import { deliveryPinCodeService, DeliveryPinCode, DeliveryPinCodeStats, PinCodeOrderUpdate } from '../services/deliveryPinCodeService';
import { settingsService } from '../services/settingsService';
import deliveryTargetTierService, { DeliveryTargetTier, DeliveryTargetTierCreate } from '../services/deliveryTargetTierService';
import { Save, AlertCircle, Target, Trophy, IndianRupee } from 'lucide-react';

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

// Types
interface PinCodeFormData {
  pinCode: string;
  deliveryCharge: string;
  locality: string;
  status: 'active' | 'inactive';
}

// Sortable Row Component
interface SortablePinCodeRowProps {
  pinCode: DeliveryPinCode;
  index: number;
  onEdit: (pinCode: DeliveryPinCode) => void;
  onDelete: (pinCode: DeliveryPinCode) => void;
  onToggleStatus: (pinCode: DeliveryPinCode) => void;
}

const SortablePinCodeRow: React.FC<SortablePinCodeRowProps> = ({ 
  pinCode, 
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
  } = useSortable({ id: pinCode.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr 
      ref={setNodeRef} 
      style={style} 
      className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-100 dark:border-gray-800"
    >
      {/* Order Column */}
      <td className="sticky left-0 z-10 bg-white dark:bg-gray-900 px-3 sm:px-4 py-3 whitespace-nowrap text-center border-r-2 border-gray-300 dark:border-gray-600 shadow-[2px_0_4px_rgba(0,0,0,0.05)] dark:shadow-[2px_0_4px_rgba(0,0,0,0.2)]">
        <div className="flex items-center justify-center gap-1.5">
          <div
            {...attributes}
            {...listeners}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md cursor-grab active:cursor-grabbing touch-none transition-colors"
          >
            <GripVertical className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
          </div>
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">
            #{index + 1}
          </span>
        </div>
      </td>
      
      {/* PIN Code Column */}
      <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-center border-r border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center gap-1.5">
          <MapPin className="w-4 h-4 text-primary-500 dark:text-primary-400" />
          <span className="text-sm font-semibold text-gray-900 dark:text-white font-mono">
            {pinCode.pinCode}
          </span>
        </div>
      </td>
      
      {/* Chargers Column */}
      <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-center border-r border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center gap-1">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">₹</span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {pinCode.deliveryCharge}
          </span>
        </div>
      </td>
      
      {/* Locality Column */}
      <td className="px-4 py-3 min-w-[200px] max-w-[300px] border-r border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          <div className="flex flex-wrap gap-1.5 items-center">
          {pinCode.locality.split(',').map((part, i, arr) => (
              <span key={i} className="inline-flex items-center">
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md text-xs font-medium whitespace-nowrap">
              {part.trim()}
                </span>
                {i < arr.length - 1 && (
                  <span className="text-gray-400 dark:text-gray-500 mx-0.5">•</span>
                )}
            </span>
          ))}
          </div>
        </div>
      </td>
      
      {/* Status Column */}
      <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-center border-r border-gray-200 dark:border-gray-700">
        <button
          onClick={() => onToggleStatus(pinCode)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full border-2 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 ${
            pinCode.status === 'active'
              ? 'bg-green-500 dark:bg-green-600 border-green-500 dark:border-green-600 focus:ring-green-400 dark:focus:ring-green-500'
              : 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-gray-400 dark:focus:ring-gray-500'
          }`}
          title={pinCode.status === 'active' ? 'Deactivate PIN code' : 'Activate PIN code'}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white dark:bg-gray-100 shadow-md transition-all duration-200 ease-in-out ${
              pinCode.status === 'active' ? 'translate-x-4' : 'translate-x-0.5'
            }`}
          />
        </button>
      </td>
      
      {/* Actions Column */}
      <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-center">
        <div className="flex items-center justify-center gap-2">
          <DashboardTooltip text="Edit PIN code">
            <button 
              onClick={() => onEdit(pinCode)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 border border-transparent hover:border-primary-200 dark:hover:border-primary-700"
            >
              <Edit className="h-4 w-4" />
            </button>
          </DashboardTooltip>
          <DashboardTooltip text="Delete PIN code">
            <button 
              onClick={() => onDelete(pinCode)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent hover:border-red-200 dark:hover:border-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </DashboardTooltip>
        </div>
      </td>
    </tr>
  );
};


const DeliverySettings: React.FC = () => {
  // Toast notifications
  const { toasts, removeToast, showSuccess, showError, showWarning, showInfo } = useToastContext();

  // State management
  const [pinCodes, setPinCodes] = useState<DeliveryPinCode[]>([]);
  const [stats, setStats] = useState<DeliveryPinCodeStats>({
    total: 0,
    active: 0,
    inactive: 0,
    averageCharge: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingPinCode, setEditingPinCode] = useState<DeliveryPinCode | null>(null);
  const [deletingPinCode, setDeletingPinCode] = useState<DeliveryPinCode | null>(null);
  const [deletingTier, setDeletingTier] = useState<DeliveryTargetTier | null>(null);
  const [isDeleteTierModalOpen, setIsDeleteTierModalOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<PinCodeFormData>({
    pinCode: '',
    deliveryCharge: '',
    locality: '',
    status: 'active'
  });
  const [formErrors, setFormErrors] = useState<Partial<PinCodeFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justReordered, setJustReordered] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  
  // Free delivery threshold state
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState<number>(1500);
  const [thresholdInput, setThresholdInput] = useState<string>('1500');
  const [isSavingThreshold, setIsSavingThreshold] = useState(false);
  const [thresholdError, setThresholdError] = useState<string | null>(null);

  // Target tiers state
  const [targetTiers, setTargetTiers] = useState<DeliveryTargetTier[]>([]);
  const [isLoadingTiers, setIsLoadingTiers] = useState(false);
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<DeliveryTargetTier | null>(null);
  const [tierFormData, setTierFormData] = useState<DeliveryTargetTierCreate>({
    minOrders: 0,
    maxOrders: null,
    bonusAmount: 0,
    tierName: null,
    isActive: true,
    displayOrder: 0
  });
  const [isSavingTier, setIsSavingTier] = useState(false);

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

      const [pinCodesResponse, statsResponse] = await Promise.all([
        deliveryPinCodeService.getDeliveryPinCodes({
          status: statusFilter,
          search: debouncedSearchTerm,
          page: currentPage,
          limit: itemsPerPage
        }),
        deliveryPinCodeService.getDeliveryPinCodeStats()
      ]);

      setPinCodes(pinCodesResponse.pinCodes);
      setTotalPages(pinCodesResponse.pagination.totalPages);
      setTotalItems(pinCodesResponse.pagination.totalItems);
      setStats(statsResponse);
      setError(null);
    } catch (error) {
      console.error('Error loading data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
      showError('Data Load Failed', error instanceof Error ? error.message : 'Failed to load PIN codes data', 2000);
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, [statusFilter, debouncedSearchTerm, currentPage, itemsPerPage, showError]);

  // Load free delivery threshold
  const loadFreeDeliveryThreshold = async () => {
    try {
      const response = await settingsService.getSettings();
      if (response.success && response.data?.settings) {
        const threshold = response.data.settings.free_delivery_threshold || 1500;
        setFreeDeliveryThreshold(threshold);
        setThresholdInput(threshold.toString());
      }
    } catch (error) {
      console.error('Error loading free delivery threshold:', error);
      // Use default value if error
      setFreeDeliveryThreshold(1500);
      setThresholdInput('1500');
    }
  };

  // Load target tiers
  const loadTargetTiers = useCallback(async () => {
    try {
      setIsLoadingTiers(true);
      const tiers = await deliveryTargetTierService.getTargetTiers();
      setTargetTiers(tiers);
    } catch (error) {
      console.error('Error loading target tiers:', error);
      showError('Error', 'Failed to load target tiers');
    } finally {
      setIsLoadingTiers(false);
    }
  }, [showError]);

  // Load data when component mounts or page changes
  useEffect(() => {
    loadData();
    loadFreeDeliveryThreshold();
    loadTargetTiers();
  }, [currentPage, loadData, loadTargetTiers]);

  // Close dropdowns when clicking outside
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
    
    if (currentPage === 1) {
      // If we're on page 1, load data without showing loading spinner
      loadData(false);
    } else {
      // If we're not on page 1, the page reset effect will handle the load
      setCurrentPage(1);
    }
  }, [statusFilter, debouncedSearchTerm, justReordered, loadData, currentPage]);


  // Form validation
  const validateForm = (): boolean => {
    const errors: Partial<PinCodeFormData> = {};

    // PIN Code validation
    if (!formData.pinCode) {
      errors.pinCode = 'PIN Code is required';
    } else if (!/^\d{6}$/.test(formData.pinCode)) {
      errors.pinCode = 'PIN Code must be exactly 6 digits';
    }

    // Delivery Charge validation
    if (!formData.deliveryCharge) {
      errors.deliveryCharge = 'Delivery Charge is required';
    } else if (isNaN(Number(formData.deliveryCharge)) || Number(formData.deliveryCharge) < 0) {
      errors.deliveryCharge = 'Delivery Charge must be a valid positive number';
    }

    // Locality validation
    if (!formData.locality.trim()) {
      errors.locality = 'Locality is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form handlers
  const handleInputChange = (field: keyof PinCodeFormData, value: string) => {
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
      const pinCodeData = {
        pinCode: formData.pinCode,
        deliveryCharge: Number(formData.deliveryCharge),
        locality: formData.locality.trim(),
        status: formData.status
      };

      if (editingPinCode) {
        const updatedPinCode = await deliveryPinCodeService.updateDeliveryPinCode(editingPinCode.id, pinCodeData);
        // Update local state instead of full reload
        setPinCodes(prev => prev.map(pc => pc.id === editingPinCode.id ? updatedPinCode : pc));
        showSuccess('PIN Code Updated', 'PIN code updated successfully', 1500);
      } else {
        const newPinCode = await deliveryPinCodeService.createDeliveryPinCode(pinCodeData);
        // Update local state instead of full reload
        setPinCodes(prev => [newPinCode, ...prev]);
        setTotalItems(prev => prev + 1);
        setStats(prev => ({ ...prev, total: prev.total + 1 }));
        showSuccess('PIN Code Created', 'New PIN code created successfully', 1500);
      }

      handleCloseModal();
    } catch (error) {
      console.error('Error saving PIN code:', error);
      showError('Save Failed', error instanceof Error ? error.message : 'Failed to save PIN code', 2000);
      setError(error instanceof Error ? error.message : 'Failed to save PIN code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPinCode(null);
    setFormData({
      pinCode: '',
      deliveryCharge: '',
      locality: '',
      status: 'active'
    });
    setFormErrors({});
  };

  const handleEdit = (pinCode: DeliveryPinCode) => {
    setEditingPinCode(pinCode);
    setFormData({
      pinCode: pinCode.pinCode,
      deliveryCharge: pinCode.deliveryCharge.toString(),
      locality: pinCode.locality,
      status: pinCode.status
    });
    setIsModalOpen(true);
  };

  const handleDelete = (pinCode: DeliveryPinCode) => {
    setDeletingPinCode(pinCode);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingPinCode) return;

    try {
      await deliveryPinCodeService.deleteDeliveryPinCode(deletingPinCode.id);
      // Update local state instead of full reload
      setPinCodes(prev => prev.filter(pc => pc.id !== deletingPinCode.id));
      setTotalItems(prev => prev - 1);
      setStats(prev => ({ 
        ...prev, 
        total: prev.total - 1,
        [deletingPinCode.status]: prev[deletingPinCode.status] - 1
      }));
      setIsDeleteModalOpen(false);
      setDeletingPinCode(null);
      showSuccess('PIN Code Deleted', 'PIN code deleted successfully', 1500);
    } catch (error) {
      console.error('Error deleting PIN code:', error);
      showError('Delete Failed', error instanceof Error ? error.message : 'Failed to delete PIN code', 2000);
      setError(error instanceof Error ? error.message : 'Failed to delete PIN code');
    }
  };

  const toggleStatus = async (pinCode: DeliveryPinCode) => {
    try {
      const newStatus = pinCode.status === 'active' ? 'inactive' : 'active';
      await deliveryPinCodeService.togglePinCodeStatus(pinCode.id);
      // Update local state instead of full reload
      setPinCodes(prev => prev.map(pc => 
        pc.id === pinCode.id ? { ...pc, status: newStatus } : pc
      ));
      setStats(prev => ({
        ...prev,
        [pinCode.status]: prev[pinCode.status] - 1,
        [newStatus]: prev[newStatus] + 1
      }));
      showSuccess('Status Updated', `PIN code status updated to ${newStatus}`, 1500);
    } catch (error) {
      console.error('Error updating status:', error);
      showError('Status Update Failed', error instanceof Error ? error.message : 'Failed to update status', 2000);
      setError(error instanceof Error ? error.message : 'Failed to update status');
    }
  };

  const handleBulkUpload = async () => {
    // Create a file input for CSV upload
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          setIsLoading(true);
          setError(null);
          
          showInfo('Uploading CSV', `Processing ${file.name}...`);
          
          const result = await deliveryPinCodeService.parseAndUploadCSV(file);
          
          // Show success/error notifications
          if (result.success > 0 && result.failed === 0) {
            showSuccess(
              'CSV Upload Successful!',
              `Successfully uploaded ${result.success} PIN codes`,
              4000
            );
          } else if (result.success > 0 && result.failed > 0) {
            showWarning(
              'CSV Upload Partially Successful',
              `${result.success} PIN codes uploaded successfully, ${result.failed} failed`,
              6000
            );
            // Show detailed errors in console
            console.warn('Upload errors:', result.errors);
          } else if (result.failed > 0) {
            showError(
              'CSV Upload Failed',
              `Failed to upload ${result.failed} PIN codes. Check console for details.`,
              8000
            );
            console.error('Upload errors:', result.errors);
          }
          
          // Reload data to show new PIN codes
          await loadData();
        } catch (error) {
          console.error('Error uploading CSV:', error);
          showError(
            'CSV Upload Error',
            error instanceof Error ? error.message : 'Failed to upload CSV file',
            6000
          );
          setError(error instanceof Error ? error.message : 'Failed to upload CSV file');
        } finally {
          setIsLoading(false);
        }
      }
    };
    input.click();
  };

  const handleExport = async () => {
    try {
      showInfo('Exporting CSV', 'Preparing PIN codes for download...');
      await deliveryPinCodeService.exportPinCodesToCSV();
      showSuccess('Export Successful', 'PIN codes exported to CSV file', 1500);
    } catch (error) {
      console.error('Error exporting PIN codes:', error);
      showError('Export Failed', error instanceof Error ? error.message : 'Failed to export PIN codes', 2000);
      setError(error instanceof Error ? error.message : 'Failed to export PIN codes');
    }
  };

  // Target Tier handlers
  const handleSaveTier = async () => {
    try {
      setIsSavingTier(true);
      if (editingTier) {
        await deliveryTargetTierService.updateTier(editingTier.id, tierFormData);
        showSuccess('Tier Updated', 'Target tier updated successfully', 1500);
      } else {
        await deliveryTargetTierService.createTier(tierFormData);
        showSuccess('Tier Created', 'Target tier created successfully', 1500);
      }
      setIsTierModalOpen(false);
      setEditingTier(null);
      await loadTargetTiers();
    } catch (error) {
      console.error('Error saving tier:', error);
      showError('Error', error instanceof Error ? error.message : 'Failed to save tier', 2000);
    } finally {
      setIsSavingTier(false);
    }
  };

  const handleDeleteTier = async () => {
    if (!deletingTier) return;
    try {
      await deliveryTargetTierService.deleteTier(deletingTier.id);
      showSuccess('Tier Deleted', 'Target tier deleted successfully', 1500);
      setIsDeleteTierModalOpen(false);
      setDeletingTier(null);
      await loadTargetTiers();
    } catch (error) {
      console.error('Error deleting tier:', error);
      showError('Error', error instanceof Error ? error.message : 'Failed to delete tier', 2000);
    }
  };

  const downloadTemplate = () => {
    deliveryPinCodeService.downloadTemplate();
    showSuccess('Template Downloaded', 'CSV template downloaded successfully', 1500);
  };

  // Handle free delivery threshold update
  const handleSaveFreeDeliveryThreshold = async () => {
    const thresholdValue = parseFloat(thresholdInput);
    
    // Validation
    if (isNaN(thresholdValue) || thresholdValue < 0) {
      setThresholdError('Please enter a valid amount (0 or greater)');
      return;
    }

    setIsSavingThreshold(true);
    setThresholdError(null);

    try {
      await settingsService.updateSetting('free_delivery_threshold', thresholdValue);
      setFreeDeliveryThreshold(thresholdValue);
      showSuccess('Free Delivery Threshold Updated', `Orders above ₹${thresholdValue} will qualify for free delivery`, 2000);
    } catch (error) {
      console.error('Error updating free delivery threshold:', error);
      showError('Update Failed', error instanceof Error ? error.message : 'Failed to update free delivery threshold', 2000);
      setThresholdError('Failed to update. Please try again.');
    } finally {
      setIsSavingThreshold(false);
    }
  };

  // Handle drag end for reordering
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    
    console.log('Drag end event:', { activeId: active.id, overId: over?.id });

    if (over && active.id !== over.id) {
      const oldIndex = pinCodes.findIndex((item) => item.id === active.id);
      const newIndex = pinCodes.findIndex((item) => item.id === over.id);

      console.log('Drag indices:', { oldIndex, newIndex });

      if (oldIndex !== -1 && newIndex !== -1) {
        // Update local state immediately for better UX
        const newPinCodes = arrayMove(pinCodes, oldIndex, newIndex);
        setPinCodes(newPinCodes);

        try {
          // Prepare order updates for all items to ensure consistency
          const orderUpdates: PinCodeOrderUpdate[] = newPinCodes.map((pinCode, index) => ({
            id: pinCode.id,
            orderIndex: index + 1
          }));

          console.log('Order updates:', orderUpdates);

          // Update order on server
          const result = await deliveryPinCodeService.updateDeliveryPinCodeOrder(orderUpdates);
          console.log('Server response:', result);
          
          showSuccess('Order Updated', 'PIN code order updated successfully', 1500);
          
          // Set flag to prevent data reloading
          setJustReordered(true);
          
        } catch (error) {
          console.error('Error updating PIN code order:', error);
          showError('Order Update Failed', `Failed to update PIN code order: ${error instanceof Error ? error.message : 'Unknown error'}`, 3000);
          
          // Revert local state on error
          setPinCodes(pinCodes);
        }
      }
    }
  }, [pinCodes, showSuccess, showError]);

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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Delivery Settings</h1>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  Manage deliverable PIN codes and their delivery charges
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
              <Card>
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Total PIN Codes</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none mt-0.5">
                        {stats.total}
                      </p>
                    </div>
                    <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 leading-none">Active PIN Codes</p>
                      <p className="text-2xl font-bold text-green-600 leading-none mt-0.5">
                        {stats.active}
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
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Inactive PIN Codes</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400 leading-none mt-0.5">
                        {stats.inactive}
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
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Avg. Delivery Charge</p>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 leading-none mt-0.5">
                        ₹{stats.averageCharge.toFixed(0)}
                      </p>
                    </div>
                    <DollarSign className="w-4 h-4 text-orange-400 dark:text-orange-500 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full px-3 sm:px-4 lg:px-6 py-4 space-y-4">
        {/* Free Delivery Threshold Section */}
      <Card className="border-2 border-primary-200 dark:border-primary-800 bg-gradient-to-r from-primary-50/30 to-orange-50/30 dark:from-primary-900/10 dark:to-orange-900/10 shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="bg-gradient-to-r from-primary-50 to-orange-50 dark:from-primary-900/20 dark:to-orange-900/20 border-b border-primary-200 dark:border-primary-800 px-4 sm:px-5 md:px-6 py-3">
          <CardTitle className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-primary-600 to-orange-600 rounded-lg shadow-sm">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-lg">Free Delivery Threshold</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 md:p-6">
          <div className="space-y-4">
            {/* Info Box */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-4 border-blue-500 dark:border-blue-400 rounded-r-lg p-3.5 shadow-sm">
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                  <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-blue-900 dark:text-blue-100 uppercase tracking-wide mb-1">
                    How it works
                  </p>
                  <p className="text-xs font-normal text-blue-700 dark:text-blue-300 leading-relaxed">
                    Orders with a subtotal (before discounts) equal to or above this amount will qualify for free delivery. 
                    Orders below this threshold will be charged the delivery fee based on the PIN code.
                  </p>
                </div>
              </div>
            </div>

            {/* Input and Button Section - Properly Aligned */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Minimum Order Amount for Free Delivery
              </label>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 min-w-0">
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="Enter minimum amount"
                      value={thresholdInput}
                      onChange={(e) => {
                        setThresholdInput(e.target.value);
                        setThresholdError(null);
                      }}
                      min="0"
                      step="1"
                      className={`h-11 ${thresholdError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-primary-500 dark:focus:border-primary-400'} text-base font-medium`}
                      leftIcon={<DollarSign className="h-4 w-4 text-gray-500 dark:text-gray-400" />}
                    />
                  </div>
                  {thresholdError && (
                    <p className="text-red-500 text-xs font-medium mt-1.5 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {thresholdError}
                    </p>
                  )}
                  {!thresholdError && freeDeliveryThreshold > 0 && (
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1.5">
                      Current: <span className="font-semibold text-gray-700 dark:text-gray-300">₹{freeDeliveryThreshold.toFixed(0)}</span>
                    </p>
                  )}
                </div>
                
                <div className="flex items-end sm:items-start">
                  <Button
                    onClick={handleSaveFreeDeliveryThreshold}
                    disabled={isSavingThreshold || parseFloat(thresholdInput) === freeDeliveryThreshold || !thresholdInput || parseFloat(thresholdInput) < 0}
                    className="h-11 px-6 bg-gradient-to-r from-primary-600 to-orange-600 hover:from-primary-700 hover:to-orange-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSavingThreshold ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Current Setting Display */}
            {freeDeliveryThreshold > 0 && (
              <div className="mt-3 p-3.5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-l-4 border-green-500 dark:border-green-400 rounded-r-lg shadow-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <p className="text-xs font-medium text-green-800 dark:text-green-300">
                    <span className="font-bold">Active:</span> Orders with subtotal of <span className="font-bold">₹{freeDeliveryThreshold.toFixed(0)}</span> or more receive free delivery
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delivery Target Tiers Section */}
      <Card className="border-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-r from-emerald-50/30 to-green-50/30 dark:from-emerald-900/10 dark:to-green-900/10 shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-b border-emerald-200 dark:border-emerald-800 px-4 sm:px-5 md:px-6 py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2.5">
              <div className="p-2 bg-gradient-to-br from-emerald-600 to-green-600 rounded-lg shadow-sm">
                <Target className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-gray-900 dark:text-white text-lg">Delivery Target Incentives</span>
            </CardTitle>
            <Button
              onClick={() => {
                setEditingTier(null);
                setTierFormData({
                  minOrders: 0,
                  maxOrders: null,
                  bonusAmount: 0,
                  tierName: null,
                  isActive: true,
                  displayOrder: targetTiers.length
                });
                setIsTierModalOpen(true);
              }}
              className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Tier
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 md:p-6">
          {isLoadingTiers ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600 dark:text-emerald-400" />
            </div>
          ) : targetTiers.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400">No target tiers configured</p>
              <Button
                onClick={() => {
                  setEditingTier(null);
                  setTierFormData({
                    minOrders: 0,
                    maxOrders: null,
                    bonusAmount: 0,
                    tierName: null,
                    isActive: true,
                    displayOrder: 0
                  });
                  setIsTierModalOpen(true);
                }}
                className="mt-4"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Tier
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400 rounded-r-lg p-3.5">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  <strong className="text-blue-900 dark:text-blue-100">How it works:</strong> Delivery boys earn bonus rewards based on the number of orders completed in a day. Bonuses are automatically credited when they reach each tier.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Tier</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Orders Range</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Bonus</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Status</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {targetTiers
                      .sort((a, b) => a.displayOrder - b.displayOrder || a.minOrders - b.minOrders)
                      .map((tier) => (
                        <tr key={tier.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <Trophy className={`h-4 w-4 ${tier.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`} />
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {tier.tierName || `Tier ${tier.id}`}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {tier.minOrders}
                              {tier.maxOrders !== null ? ` - ${tier.maxOrders}` : '+'} orders
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1">
                              <IndianRupee className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                                {tier.bonusAmount.toFixed(0)}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                tier.isActive
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                              }`}
                            >
                              {tier.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                onClick={() => {
                                  setEditingTier(tier);
                                  setTierFormData({
                                    minOrders: tier.minOrders,
                                    maxOrders: tier.maxOrders,
                                    bonusAmount: tier.bonusAmount,
                                    tierName: tier.tierName || null,
                                    isActive: tier.isActive,
                                    displayOrder: tier.displayOrder
                                  });
                                  setIsTierModalOpen(true);
                                }}
                                variant="secondary"
                                size="sm"
                                className="h-8 px-3"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                onClick={() => {
                                  setDeletingTier(tier);
                                  setIsDeleteTierModalOpen(true);
                                }}
                                variant="secondary"
                                size="sm"
                                className="h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Filters */}
      <Card>
        <CardContent className="p-4 sm:p-5 md:p-6">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="flex-1">
              <Input
                placeholder="Search PIN codes or localities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            
            {/* Filter and Actions Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Status Filter - Custom Dropdown */}
              <div className="relative" ref={statusDropdownRef}>
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
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
                  <div className="absolute top-full left-0 mt-2 min-w-[180px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl dark:shadow-black/40 z-50 overflow-hidden backdrop-blur-sm">
                    <div className="py-1.5">
                      {[
                        { value: 'all', label: 'All Status', count: stats.total },
                        { value: 'active', label: 'Active', count: stats.active },
                        { value: 'inactive', label: 'Inactive', count: stats.inactive }
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setStatusFilter(option.value as 'all' | 'active' | 'inactive');
                            setShowStatusDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 flex items-center justify-between ${
                            statusFilter === option.value 
                              ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold border-l-2 border-primary-500 dark:border-primary-400' 
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                          }`}
                        >
                          <span>{option.label}</span>
                          <span className={`text-xs ${statusFilter === option.value ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`}>
                            ({option.count})
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions Toolbar */}
              <div className="ml-auto flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <DashboardTooltip text="Refresh">
                  <button
                    onClick={() => loadData()}
                    className="p-2 rounded-md transition-all text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-gray-700"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </DashboardTooltip>
                <DashboardTooltip text="View site">
                  <button
                    onClick={() => window.open('/', '_blank')}
                    className="p-2 rounded-md transition-all text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-gray-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </DashboardTooltip>
                <DashboardTooltip text="Download template">
                  <button
                    onClick={downloadTemplate}
                    className="p-2 rounded-md transition-all text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-gray-700"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </DashboardTooltip>
                <DashboardTooltip text="Upload CSV">
                  <button
                    onClick={handleBulkUpload}
                    className="p-2 rounded-md transition-all text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-gray-700"
                  >
                    <Upload className="h-4 w-4" />
                  </button>
                </DashboardTooltip>
                <DashboardTooltip text="Export CSV">
                  <button
                    onClick={handleExport}
                    className="p-2 rounded-md transition-all text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-gray-700"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </DashboardTooltip>
                <Button
                  onClick={() => setIsModalOpen(true)}
                  className="ml-2 h-8 px-3 text-xs font-semibold bg-primary-600 hover:bg-primary-700"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Add PIN Code
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PIN Codes Table */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700 pt-3 pb-2">
          <CardTitle className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-primary-600 to-orange-600 rounded-lg shadow-sm">
              <MapPin className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">PIN Codes</span>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              ({totalItems} {totalItems === 1 ? 'code' : 'codes'})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile scroll indicator */}
          <div className="sm:hidden px-4 py-2 bg-gradient-to-r from-primary-50/50 to-orange-50/50 dark:from-primary-900/10 dark:to-orange-900/10 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <ArrowUpDown className="w-3 h-3" />
                <span className="font-medium">Swipe horizontally to view all columns</span>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-x-auto custom-scrollbar">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
                  <table className="w-full min-w-[800px] divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b-2 border-gray-200 dark:border-gray-700">
                  <tr>
                        <th className="sticky left-0 z-20 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 px-3 sm:px-4 py-3 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r-2 border-gray-300 dark:border-gray-600 whitespace-nowrap shadow-[2px_0_4px_rgba(0,0,0,0.05)] dark:shadow-[2px_0_4px_rgba(0,0,0,0.2)]">
                          <div className="flex items-center justify-center gap-1">
                            <GripVertical className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                            <span>Order</span>
                          </div>
                    </th>
                        <th className="px-3 sm:px-4 py-3 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                      PIN Code
                    </th>
                        <th className="px-3 sm:px-4 py-3 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                      Del Charge
                    </th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 min-w-[200px]">
                      Locality
                    </th>
                        <th className="px-3 sm:px-4 py-3 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                      Status
                    </th>
                        <th className="px-3 sm:px-4 py-3 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-primary-600 dark:text-primary-400" />
                        <span className="text-sm font-medium">Loading PIN codes...</span>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-red-500 dark:text-red-400">
                      <p className="text-base font-semibold mb-1">Error loading data</p>
                      <p className="text-sm mb-3">{error}</p>
                      <Button
                        onClick={() => {
                          showInfo('Retrying', 'Attempting to reload data...');
                          loadData();
                        }}
                        variant="secondary"
                        size="sm"
                      >
                        Retry
                      </Button>
                    </td>
                  </tr>
                ) : pinCodes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                      <p className="text-base font-semibold text-gray-900 dark:text-white mb-1">No PIN codes found</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Try adjusting your search or add a new PIN code</p>
                    </td>
                  </tr>
                ) : (
                  <SortableContext items={pinCodes.map(pc => pc.id)} strategy={verticalListSortingStrategy}>
                    {pinCodes.map((pinCode, index) => (
                      <SortablePinCodeRow
                        key={pinCode.id}
                        pinCode={pinCode}
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
            </div>
        </div>
        </CardContent>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white dark:bg-gray-900 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || isLoading}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || isLoading}
              >
                Next
              </Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of{' '}
                  <span className="font-medium">{totalItems}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      disabled={isLoading}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-primary-50 dark:bg-primary-900/30 border-primary-500 dark:border-primary-400 text-primary-600 dark:text-primary-400'
                          : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {page}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}
      </Card>
      </div>

      {/* Add/Edit PIN Code Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingPinCode ? 'Edit PIN Code' : 'Add New PIN Code'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              PIN Code *
            </label>
            <Input
              type="text"
              placeholder="Enter 6-digit PIN code"
              value={formData.pinCode}
              onChange={(e) => handleInputChange('pinCode', e.target.value.replace(/\D/g, '').slice(0, 6))}
              className={formErrors.pinCode ? 'border-red-500' : ''}
            />
            {formErrors.pinCode && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">{formErrors.pinCode}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Delivery Charge (₹) *
            </label>
            <Input
              type="number"
              placeholder="Enter delivery charge"
              value={formData.deliveryCharge}
              onChange={(e) => handleInputChange('deliveryCharge', e.target.value)}
              className={formErrors.deliveryCharge ? 'border-red-500' : ''}
              min="0"
              step="0.01"
            />
            {formErrors.deliveryCharge && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">{formErrors.deliveryCharge}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Locality *
            </label>
            <textarea
              placeholder="Enter locality area"
              value={formData.locality}
              onChange={(e) => handleInputChange('locality', e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-transparent resize-none ${formErrors.locality ? 'border-red-500 dark:border-red-500' : ''}`}
              rows={3}
            />
            {formErrors.locality && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">{formErrors.locality}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="status"
                  value="active"
                  checked={formData.status === 'active'}
                  onChange={(e) => handleInputChange('status', e.target.value as 'active' | 'inactive')}
                  className="text-orange-500 dark:text-orange-400"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="status"
                  value="inactive"
                  checked={formData.status === 'inactive'}
                  onChange={(e) => handleInputChange('status', e.target.value as 'active' | 'inactive')}
                  className="text-orange-500 dark:text-orange-400"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Inactive</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseModal}
              disabled={isSubmitting}
              className="px-8 py-2 rounded-md"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary-600 hover:bg-primary-700 px-8 py-2 rounded-md"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editingPinCode ? 'Update' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete PIN Code"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <Trash2 className="w-6 h-6 text-red-500 dark:text-red-400" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Are you sure you want to delete this PIN code?</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                PIN Code: <span className="font-mono font-medium">{deletingPinCode?.pinCode}</span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Locality: {deletingPinCode?.locality}
              </p>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This action cannot be undone. The PIN code will be permanently removed from the system.
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
              Delete PIN Code
            </Button>
          </div>
        </div>
      </Modal>

      {/* Target Tier Modal */}
      <Modal
        isOpen={isTierModalOpen}
        onClose={() => {
          setIsTierModalOpen(false);
          setEditingTier(null);
        }}
        title={editingTier ? 'Edit Target Tier' : 'Add Target Tier'}
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveTier();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Tier Name (Optional)
            </label>
            <Input
              type="text"
              placeholder="e.g., Bronze, Silver, Gold"
              value={tierFormData.tierName || ''}
              onChange={(e) => setTierFormData({ ...tierFormData, tierName: e.target.value || null })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Min Orders <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                placeholder="5"
                value={tierFormData.minOrders}
                onChange={(e) => setTierFormData({ ...tierFormData, minOrders: parseInt(e.target.value) || 0 })}
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Max Orders (Optional)
              </label>
              <Input
                type="number"
                placeholder="Leave empty for unlimited"
                value={tierFormData.maxOrders || ''}
                onChange={(e) => setTierFormData({ ...tierFormData, maxOrders: e.target.value ? parseInt(e.target.value) : null })}
                min={tierFormData.minOrders}
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty for no upper limit</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Bonus Amount (₹) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              placeholder="75"
              value={tierFormData.bonusAmount}
              onChange={(e) => setTierFormData({ ...tierFormData, bonusAmount: parseFloat(e.target.value) || 0 })}
              min="0"
              step="0.01"
              required
              leftIcon={<IndianRupee className="h-4 w-4" />}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Display Order
            </label>
            <Input
              type="number"
              placeholder="0"
              value={tierFormData.displayOrder}
              onChange={(e) => setTierFormData({ ...tierFormData, displayOrder: parseInt(e.target.value) || 0 })}
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={tierFormData.isActive !== false}
                onChange={(e) => setTierFormData({ ...tierFormData, isActive: e.target.checked })}
                className="w-4 h-4 text-emerald-600 dark:text-emerald-400 rounded focus:ring-emerald-500 dark:focus:ring-emerald-400 border-gray-300 dark:border-gray-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsTierModalOpen(false);
                setEditingTier(null);
              }}
              disabled={isSavingTier}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSavingTier}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSavingTier ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editingTier ? (
                'Update Tier'
              ) : (
                'Create Tier'
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Tier Confirmation Modal */}
      <Modal
        isOpen={isDeleteTierModalOpen}
        onClose={() => {
          setIsDeleteTierModalOpen(false);
          setDeletingTier(null);
        }}
        title="Delete Target Tier"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <Trash2 className="w-6 h-6 text-red-500" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Are you sure you want to delete this tier?</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Tier: <span className="font-medium">{deletingTier?.tierName || `Tier ${deletingTier?.id}`}</span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Orders: {deletingTier?.minOrders || 0}
                {deletingTier && deletingTier.maxOrders !== null && deletingTier.maxOrders !== undefined ? ` - ${deletingTier.maxOrders}` : '+'} • Bonus: ₹{(deletingTier?.bonusAmount || 0).toFixed(0)}
              </p>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This action cannot be undone. The tier will be permanently removed from the system.
          </p>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setIsDeleteTierModalOpen(false);
                setDeletingTier(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteTier}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete Tier
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DeliverySettings;
