import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Layers, Loader2, GripVertical, CheckCircle, XCircle, Clock, ArrowUpDown, ChevronDown, RefreshCw, ExternalLink, FolderOpen, Grid3x3, List, Download, CheckSquare, Square } from 'lucide-react';
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
import { Modal, ModalFooter } from '../components/ui/Modal';
import { FileUpload } from '../components/ui/FileUpload';
import { resolveImageUrl } from '../utils/imageUrl';
import { Subcategory, Category } from '../types';
import categoryService from '../services/categoryService';
import apiClient from '../services/api';
import { useToastContext } from '../contexts/ToastContext';

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

// Utility function for status badge
const getStatusBadge = (status: string) => {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      status === 'active' 
        ? 'bg-green-100 text-green-800' 
        : 'bg-red-100 text-red-800'
    }`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// Sortable Row Component
interface SortableRowProps {
  subcategory: Subcategory;
  categories: Category[];
  onEdit: (subcategory: Subcategory) => void;
  onDelete: (id: string | number) => void;
  onToggleStatus: (id: string | number, isActive: boolean) => void;
  actionLoading: string | null;
  isSelected?: boolean;
  onSelect?: (id: string | number, selected: boolean) => void;
}

const SortableRow: React.FC<SortableRowProps> = ({ 
  subcategory, 
  categories,
  onEdit, 
  onDelete, 
  onToggleStatus, 
  actionLoading,
  isSelected = false,
  onSelect
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subcategory.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const category = categories.find(c => c.id === subcategory.category_id);

  return (
    <tr 
      ref={setNodeRef} 
      style={style}
      className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${isSelected ? 'bg-primary-50/30 dark:bg-primary-900/20' : ''}`}
    >
      {onSelect && (
        <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100 text-center w-12">
          <button
            onClick={() => onSelect(subcategory.id, !isSelected)}
            className="flex items-center justify-center"
          >
            {isSelected ? (
              <CheckSquare className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            ) : (
              <Square className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400" />
            )}
          </button>
        </td>
      )}
      <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100">
        <div className="flex items-center gap-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab hover:cursor-grabbing p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
          >
            <GripVertical className="h-4 w-4" />
          </div>
          <div className="flex items-center justify-center">
            {subcategory.image_url ? (
              <img 
                src={resolveImageUrl(subcategory.image_url)} 
                alt={subcategory.name} 
                className="w-12 h-8 object-cover rounded border border-gray-200 dark:border-gray-700"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-image.png';
                }}
              />
            ) : (
              <div className="w-12 h-8 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 flex items-center justify-center">
                <span className="text-xs text-gray-400 dark:text-gray-500">No Image</span>
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100 text-center">
        <span className="block" title={subcategory.name}>{subcategory.name}</span>
      </td>
      <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100">
        <div className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-line">
          {subcategory.description || 'No description'}
        </div>
      </td>
      <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100 text-center">
        <span className="text-sm text-gray-600 dark:text-gray-300">{category?.name || 'Unknown'}</span>
      </td>
      <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100 text-center">
        <div className="flex flex-col gap-1 items-center">
          {getStatusBadge(subcategory.is_active ? 'active' : 'inactive')}
          <button
            onClick={() => onToggleStatus(subcategory.id, !subcategory.is_active)}
            disabled={actionLoading === `toggle-${subcategory.id}`}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              subcategory.is_active 
                ? 'text-orange-600 hover:text-orange-800 hover:bg-orange-50 border border-orange-200' 
                : 'text-green-600 hover:text-green-800 hover:bg-green-50 border border-green-200'
            } ${actionLoading === `toggle-${subcategory.id}` ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={subcategory.is_active ? 'Deactivate subcategory' : 'Activate subcategory'}
          >
            {actionLoading === `toggle-${subcategory.id}` ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : subcategory.is_active ? (
              'Deactivate'
            ) : (
              'Activate'
            )}
          </button>
        </div>
      </td>
      <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100 text-center">
        <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(subcategory.created_at).toLocaleDateString()}</span>
      </td>
      <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100 text-center">
        <div className="flex items-center justify-center gap-1">
          <button 
            onClick={() => onEdit(subcategory)}
            className="p-1 text-gray-400 dark:text-gray-500 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button 
            onClick={() => onDelete(subcategory.id)}
            className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export const Subcategories: React.FC = () => {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'order' | 'newest' | 'oldest' | 'name' | 'category'>('order');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedSubcategories, setSelectedSubcategories] = useState<Set<number>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { showSuccess, showError } = useToastContext();

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Form states for Add Subcategory
  const [newSubcategory, setNewSubcategory] = useState({
    name: '',
    description: '',
    image_url: '',
    category_id: '',
    is_active: true
  });
  
  // Form states for Edit Subcategory
  const [editSubcategory, setEditSubcategory] = useState({
    name: '',
    description: '',
    image_url: '',
    category_id: '',
    is_active: true
  });

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
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

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Update bulk actions visibility
  useEffect(() => {
    setShowBulkActions(selectedSubcategories.size > 0);
  }, [selectedSubcategories]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load both categories and subcategories in parallel
      const [categoriesResponse, subcategoriesResponse] = await Promise.all([
        categoryService.getCategories(),
        categoryService.getSubcategories()
      ]);
      
      setCategories(categoriesResponse.categories.map(cat => ({
        ...cat,
        is_active: Boolean(cat.is_active)
      })));
      setSubcategories(subcategoriesResponse.subcategories.map(sub => ({
        ...sub,
        is_active: Boolean(sub.is_active)
      })));
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Handle drag end for reordering
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = subcategories.findIndex(subcategory => subcategory.id === active.id);
      const newIndex = subcategories.findIndex(subcategory => subcategory.id === over.id);

      // Update local state immediately for better UX
      const newSubcategories = arrayMove(subcategories, oldIndex, newIndex);
      setSubcategories(newSubcategories);

      try {
        // Update order_index for all subcategories
        const updatedSubcategories = newSubcategories.map((subcategory, index) => ({
          id: subcategory.id,
          order_index: index + 1
        }));

        await categoryService.updateSubcategoryOrder(updatedSubcategories);
        showSuccess('Subcategory Order Updated', 'Subcategories have been reordered successfully!');
      } catch (err) {
        console.error('Error updating subcategory order:', err);
        showError('Update Failed', 'Failed to update subcategory order. Please try again.');
        // Revert local state on error
        loadData();
      }
    }
  };

  // Calculate statistics
  const subcategoryStats = {
    total: subcategories.length,
    active: subcategories.filter(s => s.is_active).length,
    inactive: subcategories.filter(s => !s.is_active).length,
    categoriesWithSubcategories: new Set(subcategories.map(s => s.category_id)).size
  };

  // Filter and sort subcategories
  const filteredSubcategories = subcategories
    .filter(subcategory => {
      const category = categories.find(c => c.id === subcategory.category_id);
      const matchesSearch = subcategory.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subcategory.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category?.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = !selectedCategory || subcategory.category_id.toString() === selectedCategory;
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && subcategory.is_active) ||
        (statusFilter === 'inactive' && !subcategory.is_active);
      
      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        case 'category':
          const categoryA = categories.find(c => c.id === a.category_id);
          const categoryB = categories.find(c => c.id === b.category_id);
          return (categoryA?.name || '').localeCompare(categoryB?.name || '');
        case 'order':
        default:
          return ((a as any).order_index || 0) - ((b as any).order_index || 0);
      }
    });

  // Handle select all
  const handleSelectAll = () => {
    if (selectedSubcategories.size === filteredSubcategories.length) {
      setSelectedSubcategories(new Set());
    } else {
      setSelectedSubcategories(new Set(filteredSubcategories.map(s => {
        const id = typeof s.id === 'string' ? parseInt(s.id, 10) : s.id;
        return id;
      })));
    }
  };

  // Handle individual selection
  const handleSelectSubcategory = (subcategoryId: string | number, selected: boolean) => {
    const newSelected = new Set(selectedSubcategories);
    const id = typeof subcategoryId === 'string' ? parseInt(subcategoryId, 10) : subcategoryId;
    if (selected) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedSubcategories(newSelected);
  };

  // Bulk actions
  const handleBulkActivate = async () => {
    if (selectedSubcategories.size === 0) return;
    
    try {
      setActionLoading('bulk-activate');
      const promises = Array.from(selectedSubcategories).map(id =>
        categoryService.updateSubcategory(id, { is_active: true })
      );
      await Promise.all(promises);
      
      setSubcategories(prev => prev.map(sub => {
        const subId = typeof sub.id === 'string' ? parseInt(sub.id, 10) : sub.id;
        return selectedSubcategories.has(subId) ? { ...sub, is_active: true } : sub;
      }));
      setSelectedSubcategories(new Set());
      showSuccess('Subcategories Activated', `${selectedSubcategories.size} subcategories have been activated successfully.`);
    } catch (error: any) {
      console.error('Error bulk activating subcategories:', error);
      showError('Error', 'Failed to activate subcategories. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedSubcategories.size === 0) return;
    
    try {
      setActionLoading('bulk-deactivate');
      const promises = Array.from(selectedSubcategories).map(id =>
        categoryService.updateSubcategory(id, { is_active: false })
      );
      await Promise.all(promises);
      
      setSubcategories(prev => prev.map(sub => {
        const subId = typeof sub.id === 'string' ? parseInt(sub.id, 10) : sub.id;
        return selectedSubcategories.has(subId) ? { ...sub, is_active: false } : sub;
      }));
      setSelectedSubcategories(new Set());
      showSuccess('Subcategories Deactivated', `${selectedSubcategories.size} subcategories have been deactivated successfully.`);
    } catch (error: any) {
      console.error('Error bulk deactivating subcategories:', error);
      showError('Error', 'Failed to deactivate subcategories. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSubcategories.size === 0) return;
    
    const confirmMessage = `Are you sure you want to delete ${selectedSubcategories.size} subcategory(ies)?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setActionLoading('bulk-delete');
      const promises = Array.from(selectedSubcategories).map(id =>
        categoryService.deleteSubcategory(id)
      );
      await Promise.all(promises);
      
      setSubcategories(prev => prev.filter(sub => {
        const subId = typeof sub.id === 'string' ? parseInt(sub.id, 10) : sub.id;
        return !selectedSubcategories.has(subId);
      }));
      setSelectedSubcategories(new Set());
      showSuccess('Subcategories Deleted', `${selectedSubcategories.size} subcategories have been deleted successfully.`);
    } catch (error: any) {
      console.error('Error bulk deleting subcategories:', error);
      showError('Error', 'Failed to delete some subcategories. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // Export function
  const handleExport = () => {
    const csvContent = [
      ['Name', 'Description', 'Category', 'Status', 'Created At'].join(','),
      ...filteredSubcategories.map(sub => {
        const category = categories.find(c => c.id === sub.category_id);
        return [
          sub.name,
          `"${(sub.description || '').replace(/"/g, '""')}"`,
          category?.name || 'Unknown',
          sub.is_active ? 'Active' : 'Inactive',
          new Date(sub.created_at).toLocaleDateString()
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `subcategories-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showSuccess('Export Complete', 'Subcategories data has been exported successfully.');
  };

  const handleToggleStatus = async (subcategoryId: string | number, newStatus: boolean) => {
    try {
      setActionLoading(`toggle-${subcategoryId}`);
      await categoryService.updateSubcategory(subcategoryId, { is_active: newStatus });
      
      // Update the subcategory in the list
      setSubcategories(prev => prev.map(sub => 
        sub.id === subcategoryId ? { ...sub, is_active: newStatus } : sub
      ));
      
      const statusText = newStatus ? 'activated' : 'deactivated';
      showSuccess('Subcategory Status Updated', `Subcategory has been ${statusText} successfully.`);
    } catch (error: any) {
      console.error('Error toggling subcategory status:', error);
      const errorMessage = error?.message || 'Failed to update subcategory status. Please try again.';
      showError('Error', errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteSubcategory = async (subcategoryId: string | number) => {
    if (!window.confirm('Are you sure you want to delete this subcategory?')) {
      return;
    }

    try {
      setActionLoading(`delete-${subcategoryId}`);
      await categoryService.deleteSubcategory(subcategoryId);
      setSubcategories(subcategories.filter(s => s.id !== subcategoryId));
      showSuccess('Subcategory Deleted', 'Subcategory deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting subcategory:', error);
      let errorMessage = 'Failed to delete subcategory. Please try again.';
      
      // Provide more specific error messages
      if (error?.message?.includes('Validation Error')) {
        errorMessage = 'Cannot delete subcategory. Please check for dependencies.';
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

  const handleAddSubcategory = async () => {
    if (!newSubcategory.name.trim() || !newSubcategory.category_id) {
      showError('Validation Error', 'Please enter a subcategory name and select a category.');
      return;
    }

    try {
      setActionLoading('add-subcategory');
      
      let imageUrl = newSubcategory.image_url || 'https://via.placeholder.com/600x600?text=Subcategory+Image';
      
      // Upload image if files are selected
      if (uploadedFiles.length > 0) {
        const uploadResponse = await apiClient.uploadFile('/upload/single?type=subcategories', uploadedFiles[0]);
        if (uploadResponse.success && uploadResponse.data) {
          imageUrl = uploadResponse.data.url;
        }
      }
      
      const subcategoryData = {
        name: newSubcategory.name,
        description: newSubcategory.description,
        image_url: imageUrl,
        category_id: parseInt(newSubcategory.category_id),
        is_active: Boolean(newSubcategory.is_active)
      };

      const response = await categoryService.createSubcategory(subcategoryData);
      
      // Add the new subcategory to the list
      setSubcategories(prev => [response.subcategory, ...prev]);
      
      // Reset form and close modal
      setNewSubcategory({ name: '', description: '', image_url: '', category_id: '', is_active: true });
      setShowAddModal(false);
      setUploadedFiles([]);
      
      // Show success message
      showSuccess('Subcategory Created', 'Subcategory created successfully!');
    } catch (error: any) {
      console.error('Error creating subcategory:', error);
      let errorMessage = 'Failed to create subcategory. Please try again.';
      
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

  const handleEditSubcategory = async () => {
    if (!editingSubcategory || !editSubcategory.name.trim() || !editSubcategory.category_id) return;

    try {
      setActionLoading('edit-subcategory');
      
      let imageUrl = editSubcategory.image_url;
      
      // Upload new image if files are selected
      if (uploadedFiles.length > 0) {
        const uploadResponse = await apiClient.uploadFile('/upload/single?type=subcategories', uploadedFiles[0]);
        if (uploadResponse.success && uploadResponse.data) {
          imageUrl = uploadResponse.data.url;
        }
      }
      
      const subcategoryData = {
        name: editSubcategory.name,
        description: editSubcategory.description,
        image_url: imageUrl,
        category_id: parseInt(editSubcategory.category_id),
        is_active: Boolean(editSubcategory.is_active)
      };

      const response = await categoryService.updateSubcategory(editingSubcategory.id, subcategoryData);
      
      // Update the subcategory in the list
      setSubcategories(prev => prev.map(sub => sub.id === editingSubcategory.id ? response.subcategory : sub));
      
      setEditingSubcategory(null);
      setEditSubcategory({ name: '', description: '', image_url: '', category_id: '', is_active: true });
      setUploadedFiles([]);
      
      // Show success message
      showSuccess('Subcategory Updated', 'Subcategory updated successfully!');
    } catch (error: any) {
      console.error('Error updating subcategory:', error);
      let errorMessage = 'Failed to update subcategory. Please try again.';
      
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
    setNewSubcategory(prev => ({ ...prev, [field]: value }));
  };

  const handleEditInputChange = (field: string, value: string | boolean) => {
    setEditSubcategory(prev => ({ ...prev, [field]: value }));
  };

  // Populate edit form when editing subcategory changes
  React.useEffect(() => {
    if (editingSubcategory) {
      setEditSubcategory({
        name: editingSubcategory.name,
        description: editingSubcategory.description || '',
        image_url: editingSubcategory.image_url || '',
        category_id: editingSubcategory.category_id.toString(),
        is_active: Boolean(editingSubcategory.is_active)
      });
    }
  }, [editingSubcategory]);

  const handleFileSelect = (files: File[]) => {
    setUploadedFiles(files);
  };

  const handleFileRemove = (file: File) => {
    setUploadedFiles(uploadedFiles.filter(f => f !== file));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-gray-600 dark:text-gray-400">Loading subcategories...</span>
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subcategories</h1>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  Manage product subcategories within categories
                </p>
              </div>
              <Button 
                onClick={() => setShowAddModal(true)}
                className="group relative overflow-hidden bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 hover:from-pink-700 hover:via-rose-700 hover:to-pink-700 text-white font-semibold px-4 sm:px-6 py-2.5 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-pink-500/30 hover:border-pink-400/50 flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <Layers className="w-4 h-4 relative z-10" />
                <Plus className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Add Subcategory</span>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
              <Card>
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Total Subcategories</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none mt-0.5">
                        {subcategoryStats.total}
                      </p>
                    </div>
                    <Layers className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Active Subcategories</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400 leading-none mt-0.5">
                        {subcategoryStats.active}
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
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Inactive Subcategories</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400 leading-none mt-0.5">
                        {subcategoryStats.inactive}
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
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Categories with Subcategories</p>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 leading-none mt-0.5">
                        {subcategoryStats.categoriesWithSubcategories}
                      </p>
                    </div>
                    <FolderOpen className="w-4 h-4 text-orange-400 dark:text-orange-500 flex-shrink-0" />
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
                placeholder="Search subcategories by name, description, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            
            {/* Filter and Sort Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Category Filter - Custom Dropdown */}
              <div className="relative" ref={categoryDropdownRef}>
                <button
                  onClick={() => {
                    setShowCategoryDropdown(!showCategoryDropdown);
                    setShowStatusDropdown(false);
                    setShowSortDropdown(false);
                  }}
                  className="flex items-center justify-between h-10 min-w-[200px] bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md px-4 hover:bg-gray-100 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 cursor-pointer group shadow-sm active:scale-[0.98] active:shadow-xs"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="p-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                      <FolderOpen className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex flex-col items-start justify-center">
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide leading-none">Category</span>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-tight mt-0.5">
                        {selectedCategory ? categories.find(c => c.id.toString() === selectedCategory)?.name || 'All Categories' : 'All Categories'}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform duration-300 flex-shrink-0 ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Category Dropdown Menu */}
                {showCategoryDropdown && (
                  <div className="absolute top-full left-0 mt-2 min-w-[200px] max-h-[300px] overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl dark:shadow-black/40 z-50 overflow-hidden backdrop-blur-sm">
                    <div className="py-1.5">
                      <button
                        onClick={() => {
                          setSelectedCategory('');
                          setShowCategoryDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 flex items-center justify-between ${
                          !selectedCategory 
                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold border-l-2 border-primary-500 dark:border-primary-400' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <span>All Categories</span>
                        {!selectedCategory && (
                          <div className="w-2 h-2 rounded-full bg-primary-500 dark:bg-primary-400"></div>
                        )}
                      </button>
                      {categories.map(category => (
                        <button
                          key={category.id}
                          onClick={() => {
                            setSelectedCategory(category.id.toString());
                            setShowCategoryDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 flex items-center justify-between ${
                            selectedCategory === category.id.toString()
                              ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold border-l-2 border-primary-500 dark:border-primary-400' 
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                          }`}
                        >
                          <span>{category.name}</span>
                          {selectedCategory === category.id.toString() && (
                            <div className="w-2 h-2 rounded-full bg-primary-500 dark:bg-primary-400"></div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Status Filter - Custom Dropdown */}
              <div className="relative" ref={statusDropdownRef}>
                <button
                  onClick={() => {
                    setShowStatusDropdown(!showStatusDropdown);
                    setShowCategoryDropdown(false);
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
                  <div className="absolute top-full left-0 mt-2 min-w-[180px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl dark:shadow-black/40 z-50 overflow-hidden backdrop-blur-sm">
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
                    setShowCategoryDropdown(false);
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
                        {sortBy === 'name' && 'Name A-Z'}
                        {sortBy === 'category' && 'Category A-Z'}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform duration-300 flex-shrink-0 ${showSortDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Sort Dropdown Menu */}
                {showSortDropdown && (
                  <div className="absolute top-full left-0 mt-2 min-w-[200px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl dark:shadow-black/40 z-50 overflow-hidden backdrop-blur-sm">
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
                          setSortBy('name');
                          setShowSortDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 flex items-center justify-between ${
                          sortBy === 'name' 
                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold border-l-2 border-primary-500 dark:border-primary-400' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <span>Name A-Z</span>
                        {sortBy === 'name' && (
                          <div className="w-2 h-2 rounded-full bg-primary-500 dark:bg-primary-400"></div>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setSortBy('category');
                          setShowSortDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 flex items-center justify-between ${
                          sortBy === 'category' 
                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold border-l-2 border-primary-500 dark:border-primary-400' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <span>Category A-Z</span>
                        {sortBy === 'category' && (
                          <div className="w-2 h-2 rounded-full bg-primary-500 dark:bg-primary-400"></div>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Results Count */}
              <div className="ml-auto text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredSubcategories.length} of {subcategories.length} subcategories
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
              <DashboardTooltip text="Export subcategories data to CSV">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleExport}
                  className="text-xs sm:text-sm font-semibold"
                >
                  <Download className="h-4 w-4 mr-1.5" />
                  Export
                </Button>
              </DashboardTooltip>
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
        <Card className="border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-900/20">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {selectedSubcategories.size} subcategory(ies) selected
                </span>
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
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-1.5" />
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
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-1.5" />
                  )}
                  Deactivate
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={actionLoading === 'bulk-delete'}
                  className="text-xs sm:text-sm font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  {actionLoading === 'bulk-delete' ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-1.5" />
                  )}
                  Delete
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedSubcategories(new Set())}
                  className="text-xs sm:text-sm font-semibold"
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subcategories Table/Grid View */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              All Subcategories ({filteredSubcategories.length})
              <span className="text-sm font-normal text-gray-500">
                {viewMode === 'table' && '• Drag and drop to reorder subcategories'}
              </span>
            </CardTitle>
            {filteredSubcategories.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                {selectedSubcategories.size === filteredSubcategories.length ? (
                  <>
                    <CheckSquare className="h-4 w-4" />
                    Deselect All
                  </>
                ) : (
                  <>
                    <Square className="h-4 w-4" />
                    Select All
                  </>
                )}
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredSubcategories.length === 0 ? (
            <div className="text-center py-12">
              <Layers className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No subcategories found</p>
            </div>
          ) : viewMode === 'table' ? (
            <div className="overflow-x-auto max-w-full">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={filteredSubcategories.map(sub => sub.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <table className="w-full table-fixed">
                    <thead className="bg-chocolate-50 dark:bg-chocolate-900/20">
                      <tr>
                        <th className="px-4 py-4 text-xs font-medium text-chocolate-700 dark:text-chocolate-300 uppercase tracking-wider text-center w-12">
                          <span></span>
                        </th>
                        <th className="px-4 py-4 text-xs font-medium text-chocolate-700 dark:text-chocolate-300 uppercase tracking-wider text-center w-20">
                          <span>Order</span>
                        </th>
                        <th className="px-4 py-4 text-xs font-medium text-chocolate-700 dark:text-chocolate-300 uppercase tracking-wider text-center w-48">
                          <span>Name</span>
                        </th>
                        <th className="px-4 py-4 text-xs font-medium text-chocolate-700 dark:text-chocolate-300 uppercase tracking-wider text-left w-64">
                          <span>Description</span>
                        </th>
                        <th className="px-4 py-4 text-xs font-medium text-chocolate-700 dark:text-chocolate-300 uppercase tracking-wider text-center w-32">
                          <span>Category</span>
                        </th>
                        <th className="px-4 py-4 text-xs font-medium text-chocolate-700 dark:text-chocolate-300 uppercase tracking-wider text-center w-32">
                          <span>Status</span>
                        </th>
                        <th className="px-4 py-4 text-xs font-medium text-chocolate-700 dark:text-chocolate-300 uppercase tracking-wider text-center w-28">
                          <span>Created</span>
                        </th>
                        <th className="px-4 py-4 text-xs font-medium text-chocolate-700 dark:text-chocolate-300 uppercase tracking-wider text-center w-24">
                          <span>Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredSubcategories.map((subcategory) => {
                        const subId = typeof subcategory.id === 'string' ? parseInt(subcategory.id, 10) : subcategory.id;
                        return (
                          <SortableRow
                            key={subcategory.id}
                            subcategory={subcategory}
                            categories={categories}
                            onEdit={setEditingSubcategory}
                            onDelete={handleDeleteSubcategory}
                            onToggleStatus={handleToggleStatus}
                            actionLoading={actionLoading}
                            isSelected={selectedSubcategories.has(subId)}
                            onSelect={handleSelectSubcategory}
                          />
                        );
                      })}
                    </tbody>
                  </table>
                </SortableContext>
              </DndContext>
            </div>
          ) : (
            <div className="p-4 sm:p-5 md:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
                {filteredSubcategories.map((subcategory) => {
                  const subId = typeof subcategory.id === 'string' ? parseInt(subcategory.id, 10) : subcategory.id;
                  const isSelected = selectedSubcategories.has(subId);
                  const category = categories.find(c => c.id === subcategory.category_id);
                  return (
                    <Card key={subcategory.id} className={`hover:shadow-lg transition-all duration-200 overflow-hidden group ${isSelected ? 'ring-2 ring-primary-500 dark:ring-primary-400' : ''}`}>
                      <div className="relative">
                        {subcategory.image_url ? (
                          <div className="w-full h-32 sm:h-40 bg-gray-100 dark:bg-gray-700 overflow-hidden">
                            <img 
                              src={resolveImageUrl(subcategory.image_url)}
                              alt={subcategory.name} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder-image.png';
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-full h-32 sm:h-40 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                            <Layers className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2 flex items-center gap-2">
                          <button
                            onClick={() => handleSelectSubcategory(subcategory.id, !isSelected)}
                            className="bg-white dark:bg-gray-800 rounded-lg p-1.5 shadow-md hover:shadow-lg transition-shadow"
                          >
                            {isSelected ? (
                              <CheckSquare className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                            ) : (
                              <Square className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            )}
                          </button>
                          {getStatusBadge(subcategory.is_active ? 'active' : 'inactive')}
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base line-clamp-1">
                              {subcategory.name}
                            </h3>
                            {category && (
                              <div className="mt-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                                  <FolderOpen className="h-3 w-3 mr-1" />
                                  {category.name}
                                </span>
                              </div>
                            )}
                          </div>
                          {subcategory.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                              {subcategory.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                              <Clock className="h-3 w-3" />
                              <span>{new Date(subcategory.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => setEditingSubcategory(subcategory)}
                                className="p-1.5 text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteSubcategory(subcategory.id)}
                                className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>

      {/* Add Subcategory Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setNewSubcategory({ name: '', description: '', image_url: '', category_id: '', is_active: true });
          setUploadedFiles([]);
        }}
        title="Add New Subcategory"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Subcategory Name *" 
              placeholder="Enter subcategory name"
              value={newSubcategory.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category *
              </label>
              <select 
                className="w-full rounded-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-3 text-sm focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:focus:ring-primary-400/20"
                value={newSubcategory.category_id}
                onChange={(e) => handleInputChange('category_id', e.target.value)}
                required
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select 
                className="w-full rounded-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-3 text-sm focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:focus:ring-primary-400/20"
                value={newSubcategory.is_active ? 'active' : 'inactive'}
                onChange={(e) => handleInputChange('is_active', e.target.value === 'active')}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <Input 
            label="Description" 
            placeholder="Enter subcategory description"
            value={newSubcategory.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
          />
          
          <FileUpload
            label="Subcategory Image"
            accept="image/*"
            maxSize={5}
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
            files={uploadedFiles}
            helperText="Recommended size: 600x600px"
          />
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddSubcategory}
            disabled={actionLoading === 'add-subcategory'}
          >
            {actionLoading === 'add-subcategory' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Subcategory'
            )}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Edit Subcategory Modal */}
      <Modal
        isOpen={!!editingSubcategory}
        onClose={() => {
          setEditingSubcategory(null);
          setEditSubcategory({ name: '', description: '', image_url: '', category_id: '', is_active: true });
          setUploadedFiles([]);
        }}
        title="Edit Subcategory"
        size="lg"
      >
        {editingSubcategory && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                label="Subcategory Name" 
                value={editSubcategory.name}
                onChange={(e) => handleEditInputChange('name', e.target.value)}
                placeholder="Enter subcategory name" 
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select 
                  className="w-full rounded-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-3 text-sm focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:focus:ring-primary-400/20"
                  value={editSubcategory.category_id}
                  onChange={(e) => handleEditInputChange('category_id', e.target.value)}
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select 
                  className="w-full rounded-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-3 text-sm focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:focus:ring-primary-400/20"
                  value={editSubcategory.is_active ? 'active' : 'inactive'}
                  onChange={(e) => handleEditInputChange('is_active', e.target.value === 'active')}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <Input 
              label="Description" 
              value={editSubcategory.description}
              onChange={(e) => handleEditInputChange('description', e.target.value)}
              placeholder="Enter subcategory description" 
            />
            
            <FileUpload
              label="Subcategory Image"
              accept="image/*"
              maxSize={5}
              onFileSelect={handleFileSelect}
              onFileRemove={handleFileRemove}
              files={uploadedFiles}
              helperText="Recommended size: 600x600px"
            />
          </div>
        )}
        <ModalFooter>
          <Button variant="secondary" onClick={() => setEditingSubcategory(null)}>
            Cancel
          </Button>
          <Button 
            onClick={handleEditSubcategory}
            disabled={actionLoading === 'edit-subcategory'}
          >
            {actionLoading === 'edit-subcategory' ? (
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
    </div>
  );
};
