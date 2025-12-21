import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Filter, Edit, Trash2, FolderOpen, Loader2, GripVertical, CheckCircle, XCircle, ArrowUpDown, ChevronDown, RefreshCw, ExternalLink, Layers, Grid3x3, List, CheckSquare, Square, Download } from 'lucide-react';
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
import { Category } from '../types';
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

// Predefined icon options for categories
const ICON_OPTIONS = [
  { value: '', label: 'None', svg: 'M6 18L18 6M6 6l12 12' },
  { value: 'cake', label: 'Cake', svg: 'M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z' },
  { value: 'heart', label: 'Heart', svg: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
  { value: 'smile', label: 'Smile', svg: 'M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { value: 'book', label: 'Book', svg: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { value: 'star', label: 'Star', svg: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
  { value: 'package', label: 'Package', svg: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { value: 'gift', label: 'Gift', svg: 'M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7' },
  { value: 'crown', label: 'Crown', svg: 'M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z' },
  { value: 'sparkles', label: 'Sparkles', svg: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
  // Example: Adding a new cupcake icon
  { value: 'cupcake', label: 'Cupcake', svg: 'M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 2a8 8 0 100 16 8 8 0 000-16zm-2 4a1 1 0 11-2 0 1 1 0 012 0zm4 0a1 1 0 11-2 0 1 1 0 012 0zm-2 4a1 1 0 11-2 0 1 1 0 012 0z' }
];

// Icon Selection Component
interface IconSelectorProps {
  selectedIcon: string;
  onIconSelect: (icon: string) => void;
  label?: string;
}

const IconSelector: React.FC<IconSelectorProps> = ({ selectedIcon, onIconSelect, label = "Category Icon" }) => {
  const handleIconSelect = (iconValue: string) => {
    onIconSelect(iconValue);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      <div className="grid grid-cols-3 gap-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
        {ICON_OPTIONS.map((icon) => (
          <button
            key={icon.value}
            type="button"
            onClick={() => handleIconSelect(icon.value)}
            className={`p-2 rounded-lg border-2 transition-all hover:bg-white dark:hover:bg-gray-700 ${
              selectedIcon === icon.value
                ? 'border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/30'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
            title={icon.label}
          >
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon.svg} />
            </svg>
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        Selected: {ICON_OPTIONS.find(icon => icon.value === selectedIcon)?.label || 'None'}
      </p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
        Current value: {selectedIcon || 'None selected'}
      </p>
    </div>
  );
};

// Utility function for status badge
const getStatusBadge = (status: string) => {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      status === 'active' 
        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
    }`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// Sortable Row Component
interface SortableRowProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (id: string | number) => void;
  onToggleStatus: (id: string | number, isActive: boolean) => void;
  actionLoading: string | null;
  isSelected?: boolean;
  onSelect?: (id: string | number, selected: boolean) => void;
}

const SortableRow: React.FC<SortableRowProps> = ({ 
  category, 
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
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr 
      ref={setNodeRef} 
      style={style}
      className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${isSelected ? 'bg-primary-50/30 dark:bg-primary-900/20' : ''}`}
    >
      {onSelect && (
        <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100 text-center w-12">
          <button
            onClick={() => onSelect(category.id, !isSelected)}
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
            {category.image_url ? (
              <img 
                src={category.image_url} 
                alt={category.name} 
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
        <div className="flex items-center justify-center">
          {(category as any).icon_image_url ? (
            <img 
              src={(category as any).icon_image_url} 
              alt={`${category.name} icon`} 
              className="w-8 h-8 object-contain rounded border border-gray-200 dark:border-gray-700"
              onError={(e) => {
                e.currentTarget.src = '/placeholder-image.png';
              }}
            />
          ) : (category as any).icon ? (
            <div className="w-8 h-8 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
              {(() => {
                const iconOption = ICON_OPTIONS.find(opt => opt.value === (category as any).icon);
                return iconOption ? (
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={iconOption.svg} />
                  </svg>
                ) : (
                  <span className="text-xs text-gray-400 dark:text-gray-500">SVG</span>
                );
              })()}
            </div>
          ) : (
            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 flex items-center justify-center">
              <span className="text-xs text-gray-400 dark:text-gray-500">No Icon</span>
            </div>
          )}
        </div>
      </td>
      <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100 text-center">
        <div className="space-y-1">
          <span className="block font-medium" title={category.name}>{category.name}</span>
          {(category as any).display_name && (
            <span className="block text-xs text-gray-500 dark:text-gray-400 italic" title={`Display Name: ${(category as any).display_name}`}>
              "{((category as any).display_name)}"
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100">
        <div className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-line">
          {category.description || 'No description'}
        </div>
      </td>
      <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100 text-center">
        <span className="text-sm text-gray-600 dark:text-gray-300">{category.subcategories?.length || 0}</span>
      </td>
      <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100 text-center">
        <div className="flex flex-col gap-1 items-center">
          {getStatusBadge(category.is_active ? 'active' : 'inactive')}
          <button
            onClick={() => onToggleStatus(category.id, !category.is_active)}
            disabled={actionLoading === `toggle-${category.id}`}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              category.is_active 
                ? 'text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 border border-orange-200 dark:border-orange-800' 
                : 'text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 border border-green-200 dark:border-green-800'
            } ${actionLoading === `toggle-${category.id}` ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={category.is_active ? 'Deactivate category' : 'Activate category'}
          >
            {actionLoading === `toggle-${category.id}` ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : category.is_active ? (
              'Deactivate'
            ) : (
              'Activate'
            )}
          </button>
        </div>
      </td>
      <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100 text-center">
        <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(category.created_at).toLocaleDateString()}</span>
      </td>
      <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100 text-center">
        <div className="flex items-center justify-center gap-1">
          <button 
            onClick={() => onEdit(category)}
            className="p-1 text-gray-400 dark:text-gray-500 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button 
            onClick={() => onDelete(category.id)}
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

export const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'order' | 'newest' | 'oldest' | 'name'>('order');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedCategories, setSelectedCategories] = useState<Set<number>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadedIconFiles, setUploadedIconFiles] = useState<File[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { showSuccess, showError } = useToastContext();

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Form states for Add Category
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    image_url: '',
    icon: '',
    icon_image_url: '',
    display_name: '',
    is_active: true
  });
  
  // Form states for Edit Category
  const [editCategory, setEditCategory] = useState({
    name: '',
    description: '',
    image_url: '',
    icon: '',
    icon_image_url: '',
    display_name: '',
    is_active: true
  });

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

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Update bulk actions visibility
  useEffect(() => {
    setShowBulkActions(selectedCategories.size > 0);
  }, [selectedCategories]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch categories with subcategories included
      const categoriesResponse = await apiClient.get('/categories?include_subcategories=true', false);
      const categoriesData = categoriesResponse.data?.categories || [];
      
      // Ensure is_active is converted to boolean for all categories
      const categoriesWithBooleans = categoriesData.map((category: any) => ({
        ...category,
        is_active: Boolean(category.is_active),
        // Parse subcategories if they're a JSON string
        subcategories: typeof category.subcategories === 'string' 
          ? JSON.parse(category.subcategories) 
          : category.subcategories || []
      }));
      setCategories(categoriesWithBooleans);
    } catch (err) {
      console.error('Error loading categories:', err);
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  // Handle drag end for reordering
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex(category => category.id === active.id);
      const newIndex = categories.findIndex(category => category.id === over.id);

      // Update local state immediately for better UX
      const newCategories = arrayMove(categories, oldIndex, newIndex);
      setCategories(newCategories);

      try {
        // Update order_index for all categories
        const updatedCategories = newCategories.map((category, index) => ({
          id: category.id,
          order_index: index + 1
        }));

        await categoryService.updateCategoryOrder(updatedCategories);
        showSuccess('Category Order Updated', 'Categories have been reordered successfully!');
      } catch (err) {
        console.error('Error updating category order:', err);
        showError('Update Failed', 'Failed to update category order. Please try again.');
        // Revert local state on error
        loadData();
      }
    }
  };

  // Calculate statistics
  const categoryStats = {
    total: categories.length,
    active: categories.filter(c => c.is_active).length,
    inactive: categories.filter(c => !c.is_active).length,
    totalSubcategories: categories.reduce((sum, cat) => sum + (cat.subcategories?.length || 0), 0)
  };

  // Filter and sort categories
  const filteredCategories = categories
    .filter(category => {
      const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (category as any).display_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && category.is_active) ||
        (statusFilter === 'inactive' && !category.is_active);
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        case 'order':
        default:
          return (a.order_index || 0) - (b.order_index || 0);
      }
    });

  // Handle select all
  const handleSelectAll = () => {
    if (selectedCategories.size === filteredCategories.length) {
      setSelectedCategories(new Set());
    } else {
      setSelectedCategories(new Set(filteredCategories.map(c => c.id as number)));
    }
  };

  // Handle individual selection
  const handleSelectCategory = (categoryId: string | number, selected: boolean) => {
    const newSelected = new Set(selectedCategories);
    const id = typeof categoryId === 'string' ? parseInt(categoryId, 10) : categoryId;
    if (selected) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedCategories(newSelected);
  };

  // Bulk actions
  const handleBulkActivate = async () => {
    if (selectedCategories.size === 0) return;
    
    try {
      setActionLoading('bulk-activate');
      const promises = Array.from(selectedCategories).map(id =>
        categoryService.updateCategory(id, { is_active: true })
      );
      await Promise.all(promises);
      
      setCategories(prev => prev.map(cat => 
        selectedCategories.has(cat.id as number) ? { ...cat, is_active: true } : cat
      ));
      setSelectedCategories(new Set());
      showSuccess('Categories Activated', `${selectedCategories.size} categories have been activated successfully.`);
    } catch (error: any) {
      console.error('Error bulk activating categories:', error);
      showError('Error', 'Failed to activate categories. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedCategories.size === 0) return;
    
    try {
      setActionLoading('bulk-deactivate');
      const promises = Array.from(selectedCategories).map(id =>
        categoryService.updateCategory(id, { is_active: false })
      );
      await Promise.all(promises);
      
      setCategories(prev => prev.map(cat => 
        selectedCategories.has(cat.id as number) ? { ...cat, is_active: false } : cat
      ));
      setSelectedCategories(new Set());
      showSuccess('Categories Deactivated', `${selectedCategories.size} categories have been deactivated successfully.`);
    } catch (error: any) {
      console.error('Error bulk deactivating categories:', error);
      showError('Error', 'Failed to deactivate categories. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCategories.size === 0) return;
    
    const confirmMessage = `Are you sure you want to delete ${selectedCategories.size} category(ies)? This will also delete all subcategories.`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setActionLoading('bulk-delete');
      const promises = Array.from(selectedCategories).map(id =>
        categoryService.deleteCategory(id)
      );
      await Promise.all(promises);
      
      setCategories(prev => prev.filter(cat => !selectedCategories.has(cat.id as number)));
      setSelectedCategories(new Set());
      showSuccess('Categories Deleted', `${selectedCategories.size} categories have been deleted successfully.`);
    } catch (error: any) {
      console.error('Error bulk deleting categories:', error);
      showError('Error', 'Failed to delete some categories. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // Export function
  const handleExport = () => {
    const csvContent = [
      ['Name', 'Display Name', 'Description', 'Status', 'Subcategories', 'Created At'].join(','),
      ...filteredCategories.map(cat => [
        cat.name,
        (cat as any).display_name || '',
        `"${(cat.description || '').replace(/"/g, '""')}"`,
        cat.is_active ? 'Active' : 'Inactive',
        cat.subcategories?.length || 0,
        new Date(cat.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `categories-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showSuccess('Export Complete', 'Categories data has been exported successfully.');
  };


  const handleToggleStatus = async (categoryId: string | number, newStatus: boolean) => {
    try {
      setActionLoading(`toggle-${categoryId}`);
      await categoryService.updateCategory(categoryId, { is_active: newStatus });
      
      // Update the category in the list
      setCategories(prev => prev.map(cat => 
        cat.id === categoryId ? { ...cat, is_active: newStatus } : cat
      ));
      
      const statusText = newStatus ? 'activated' : 'deactivated';
      showSuccess('Category Status Updated', `Category has been ${statusText} successfully.`);
    } catch (error: any) {
      console.error('Error toggling category status:', error);
      const errorMessage = error?.message || 'Failed to update category status. Please try again.';
      showError('Error', errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteCategory = async (categoryId: string | number) => {
    if (!window.confirm('Are you sure you want to delete this category? This will also delete all subcategories.')) {
      return;
    }

    try {
      setActionLoading(`delete-${categoryId}`);
      await categoryService.deleteCategory(categoryId);
      setCategories(categories.filter(c => c.id !== categoryId));
    } catch (error: any) {
      console.error('Error deleting category:', error);
      const errorMessage = error?.message || 'Failed to delete category. Please try again.';
      
      // Check if the error is about products/subcategories
      if (errorMessage.includes('has products') || errorMessage.includes('has subcategories')) {
        const category = categories.find(c => c.id === categoryId);
        const categoryName = category?.name || 'this category';
        
        const shouldDeactivate = window.confirm(
          `Cannot delete ${categoryName} because it has products or subcategories.\n\n` +
          `Would you like to deactivate it instead? This will hide it from the frontend while keeping all data intact.`
        );
        
        if (shouldDeactivate) {
          try {
            await categoryService.updateCategory(categoryId, { is_active: false });
            setCategories(prev => prev.map(cat => 
              cat.id === categoryId ? { ...cat, is_active: false } : cat
            ));
            showSuccess('Category Deactivated', `${categoryName} has been deactivated successfully.`);
          } catch (deactivateError: any) {
            console.error('Error deactivating category:', deactivateError);
            showError('Error', `Error deactivating category: ${deactivateError?.message || 'Please try again.'}`);
          }
        }
      } else {
        showError('Error', errorMessage);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      showError('Validation Error', 'Please enter a category name.');
      return;
    }

    try {
      setActionLoading('add-category');
      
      let imageUrl = newCategory.image_url || 'https://via.placeholder.com/300x200?text=Category+Image';
      let iconImageUrl = newCategory.icon_image_url || null;
      
      // Upload image if files are selected
      if (uploadedFiles.length > 0) {
        const uploadResponse = await apiClient.uploadFile('/upload/single', uploadedFiles[0]);
        if (uploadResponse.success && uploadResponse.data) {
          imageUrl = uploadResponse.data.url;
        }
      }
      
      // Upload icon image if files are selected and no SVG icon is selected
      if (uploadedIconFiles.length > 0 && (!newCategory.icon || newCategory.icon === '')) {
        const iconUploadResponse = await apiClient.uploadFile('/upload/icon', uploadedIconFiles[0]);
        if (iconUploadResponse.success && iconUploadResponse.data) {
          iconImageUrl = iconUploadResponse.data.url;
        }
      }
      
      const categoryData = {
        name: newCategory.name,
        description: newCategory.description,
        image_url: imageUrl,
        icon: newCategory.icon || null, // Send null if empty string
        icon_image_url: iconImageUrl, // Send null if no icon image
        display_name: newCategory.display_name || null, // Send null if empty string
        is_active: Boolean(newCategory.is_active) // Ensure it's a boolean
      };

      const createResponse = await categoryService.createCategory(categoryData as Partial<Category>);
      
      // Add the new category to the list (ensure boolean conversion)
      if (createResponse && createResponse.category) {
        const newCategoryWithBoolean = {
          ...createResponse.category,
          is_active: Boolean(createResponse.category.is_active)
        };
        setCategories(prev => [newCategoryWithBoolean, ...prev]);
      }
      
      // Reset form and close modal
      setNewCategory({ name: '', description: '', image_url: '', icon: '', icon_image_url: '', display_name: '', is_active: true });
      setShowAddModal(false);
      setUploadedFiles([]);
      setUploadedIconFiles([]);
      
      // Show success message
      showSuccess('Category Created', 'Category created successfully!');
    } catch (error: any) {
      console.error('Error creating category:', error);
      let errorMessage = 'Failed to create category. Please try again.';
      
      // Provide more specific error messages
      if (error?.message?.includes('Validation Error')) {
        errorMessage = 'Please check all required fields and try again.';
      } else if (error?.message?.includes('Authentication')) {
        errorMessage = 'Session expired. Please login again.';
      } else if (error?.message?.includes('Network')) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error?.message?.includes('required')) {
        errorMessage = 'Please fill in all required fields including category name.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      
      showError('Error', errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory || !editCategory.name.trim()) return;

    try {
      setActionLoading('edit-category');
      
      let imageUrl = editCategory.image_url;
      let iconImageUrl = editCategory.icon_image_url || null;
      
      // Upload new image if files are selected
      if (uploadedFiles.length > 0) {
        const uploadResponse = await apiClient.uploadFile('/upload/single', uploadedFiles[0]);
        if (uploadResponse.success && uploadResponse.data) {
          imageUrl = uploadResponse.data.url;
        }
      }
      
      // Upload icon image if files are selected and no SVG icon is selected
      if (uploadedIconFiles.length > 0 && (!editCategory.icon || editCategory.icon === '')) {
        const iconUploadResponse = await apiClient.uploadFile('/upload/icon', uploadedIconFiles[0]);
        if (iconUploadResponse.success && iconUploadResponse.data) {
          iconImageUrl = iconUploadResponse.data.url;
        }
      }
      
      const categoryData = {
        name: editCategory.name,
        description: editCategory.description,
        image_url: imageUrl,
        icon: editCategory.icon || null, // Send null if empty string
        icon_image_url: iconImageUrl, // Send null if no icon image
        display_name: editCategory.display_name || null, // Send null if empty string
        is_active: Boolean(editCategory.is_active) // Ensure it's a boolean
      };

      const updateResponse = await categoryService.updateCategory(editingCategory.id, categoryData as Partial<Category>);
      
      // Update the category in the list
      if (updateResponse && updateResponse.category) {
        setCategories(prev => prev.map(cat => cat.id === editingCategory.id ? updateResponse.category : cat));
      } else {
        // Fallback: update with local data if response doesn't have category
        setCategories(prev => prev.map(cat => 
          cat.id === editingCategory.id 
            ? { ...cat, ...categoryData, is_active: Boolean(categoryData.is_active) }
            : cat
        ));
      }
      
      setEditingCategory(null);
      setEditCategory({ name: '', description: '', image_url: '', icon: '', icon_image_url: '', display_name: '', is_active: true });
      setUploadedFiles([]);
      setUploadedIconFiles([]);
      
      // Show success message
      showSuccess('Category Updated', 'Category updated successfully!');
    } catch (error: any) {
      console.error('Error updating category:', error);
      let errorMessage = 'Failed to update category. Please try again.';
      
      // Provide more specific error messages
      if (error?.message?.includes('Validation Error')) {
        errorMessage = 'Please check all required fields and try again.';
      } else if (error?.message?.includes('Authentication')) {
        errorMessage = 'Session expired. Please login again.';
      } else if (error?.message?.includes('Network')) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error?.message?.includes('required')) {
        errorMessage = 'Please fill in all required fields including category name.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      
      showError('Error', errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setNewCategory(prev => ({ ...prev, [field]: value }));
  };

  const handleEditInputChange = (field: string, value: string | boolean) => {
    setEditCategory(prev => ({ ...prev, [field]: value }));
  };

  // Populate edit form when editing category changes
  React.useEffect(() => {
    if (editingCategory) {
      setEditCategory({
        name: editingCategory.name,
        description: editingCategory.description || '',
        image_url: editingCategory.image_url || '',
        icon: (editingCategory as any).icon || '',
        icon_image_url: (editingCategory as any).icon_image_url || '',
        display_name: (editingCategory as any).display_name || '',
        is_active: Boolean(editingCategory.is_active) // Ensure it's a boolean
      });
    }
  }, [editingCategory]);

  const handleFileSelect = (files: File[]) => {
    setUploadedFiles(files);
  };

  const handleFileRemove = (file: File) => {
    setUploadedFiles(uploadedFiles.filter(f => f !== file));
  };

  const handleIconFileSelect = (files: File[]) => {
    setUploadedIconFiles(files);
  };

  const handleIconFileRemove = (file: File) => {
    setUploadedIconFiles(uploadedIconFiles.filter(f => f !== file));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-gray-600 dark:text-gray-400">Loading categories...</span>
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h1>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  Manage product categories and their organization
                </p>
              </div>
              <Button 
                onClick={() => setShowAddModal(true)}
                className="group relative overflow-hidden bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 hover:from-pink-700 hover:via-rose-700 hover:to-pink-700 text-white font-semibold px-4 sm:px-6 py-2.5 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-pink-500/30 hover:border-pink-400/50 flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <FolderOpen className="w-4 h-4 relative z-10" />
                <Plus className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Add Category</span>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
              <Card>
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Total Categories</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none mt-0.5">
                        {categoryStats.total}
                      </p>
                    </div>
                    <FolderOpen className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Active Categories</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400 leading-none mt-0.5">
                        {categoryStats.active}
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
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Inactive Categories</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400 leading-none mt-0.5">
                        {categoryStats.inactive}
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
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Total Subcategories</p>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 leading-none mt-0.5">
                        {categoryStats.totalSubcategories}
                      </p>
                    </div>
                    <Layers className="w-4 h-4 text-orange-400 dark:text-orange-500 flex-shrink-0" />
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
                placeholder="Search categories by name, display name, or description..."
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
                    </div>
                  </div>
                )}
              </div>

              {/* Results Count */}
              <div className="ml-auto text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredCategories.length} of {categories.length} categories
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
              <DashboardTooltip text="Export categories data to CSV">
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
                  {selectedCategories.size} category(ies) selected
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
                  onClick={() => setSelectedCategories(new Set())}
                  className="text-xs sm:text-sm font-semibold"
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories Table/Grid View */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            All Categories ({filteredCategories.length})
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                {viewMode === 'table' && '• Drag and drop to reorder categories'}
            </span>
          </CardTitle>
            {filteredCategories.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                {selectedCategories.size === filteredCategories.length ? (
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
            {filteredCategories.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No categories found</p>
              </div>
          ) : viewMode === 'table' ? (
            <div className="overflow-x-auto max-w-full">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={filteredCategories.map(cat => cat.id)}
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
                        <th className="px-4 py-4 text-xs font-medium text-chocolate-700 dark:text-chocolate-300 uppercase tracking-wider text-center w-20">
                          <span>Icon</span>
                        </th>
                        <th className="px-4 py-4 text-xs font-medium text-chocolate-700 dark:text-chocolate-300 uppercase tracking-wider text-center w-48">
                          <span>Name</span>
                        </th>
                        <th className="px-4 py-4 text-xs font-medium text-chocolate-700 dark:text-chocolate-300 uppercase tracking-wider text-left w-64">
                          <span>Description</span>
                        </th>
                        <th className="px-4 py-4 text-xs font-medium text-chocolate-700 dark:text-chocolate-300 uppercase tracking-wider text-center w-32">
                          <span>Subcategories</span>
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
                      {filteredCategories.map((category) => (
                        <SortableRow
                          key={category.id}
                          category={category}
                          onEdit={setEditingCategory}
                          onDelete={handleDeleteCategory}
                          onToggleStatus={handleToggleStatus}
                          actionLoading={actionLoading}
                          isSelected={selectedCategories.has(category.id as number)}
                          onSelect={handleSelectCategory}
                        />
                      ))}
                    </tbody>
                  </table>
                </SortableContext>
              </DndContext>
            </div>
          ) : (
            <div className="p-4 sm:p-5 md:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
                {filteredCategories.map((category) => {
                  const isSelected = selectedCategories.has(category.id as number);
                  return (
                    <Card key={category.id} className={`hover:shadow-lg transition-all duration-200 overflow-hidden group ${isSelected ? 'ring-2 ring-primary-500 dark:ring-primary-400' : ''}`}>
                      <div className="relative">
                        {category.image_url ? (
                          <div className="w-full h-32 sm:h-40 bg-gray-100 dark:bg-gray-700 overflow-hidden">
                            <img 
                              src={category.image_url} 
                              alt={category.name} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder-image.png';
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-full h-32 sm:h-40 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                            <FolderOpen className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2 flex items-center gap-2">
                          <button
                            onClick={() => handleSelectCategory(category.id, !isSelected)}
                            className="bg-white dark:bg-gray-800 rounded-lg p-1.5 shadow-md hover:shadow-lg transition-shadow"
                          >
                            {isSelected ? (
                              <CheckSquare className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                            ) : (
                              <Square className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            )}
                          </button>
                          {getStatusBadge(category.is_active ? 'active' : 'inactive')}
                        </div>
                      {(category as any).icon_image_url || (category as any).icon ? (
                        <div className="absolute bottom-2 left-2 bg-white dark:bg-gray-800 rounded-lg p-2 shadow-md">
                          {(category as any).icon_image_url ? (
                            <img 
                              src={(category as any).icon_image_url} 
                              alt={`${category.name} icon`} 
                              className="w-6 h-6 object-contain"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder-image.png';
                              }}
                            />
                          ) : (
                            <div className="w-6 h-6 flex items-center justify-center">
                              {(() => {
                                const iconOption = ICON_OPTIONS.find(opt => opt.value === (category as any).icon);
                                return iconOption ? (
                                  <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={iconOption.svg} />
                                  </svg>
                                ) : null;
                              })()}
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base line-clamp-1">
                            {category.name}
                          </h3>
                          {(category as any).display_name && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 italic line-clamp-1">
                              "{(category as any).display_name}"
                            </p>
                          )}
                        </div>
                        {category.description && (
                          <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                            {category.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                            <Layers className="h-3 w-3" />
                            <span>{category.subcategories?.length || 0} subcategories</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => setEditingCategory(category)}
                              className="p-1.5 text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteCategory(category.id)}
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

      {/* Add Category Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setNewCategory({ name: '', description: '', image_url: '', icon: '', icon_image_url: '', display_name: '', is_active: true });
          setUploadedFiles([]);
          setUploadedIconFiles([]);
        }}
        title="Add New Category"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Category Name *" 
              placeholder="Enter category name"
              value={newCategory.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
            />
            <Input 
              label="Display Name" 
              placeholder="Enter display name (optional)"
              value={newCategory.display_name}
              onChange={(e) => handleInputChange('display_name', e.target.value)}
              helperText="Shorter, catchy name for the frontend display"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select 
                className="w-full rounded-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-3 text-sm focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:focus:ring-primary-400/20"
                value={newCategory.is_active ? 'active' : 'inactive'}
                onChange={(e) => handleInputChange('is_active', e.target.value === 'active')}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <Input 
            label="Description" 
            placeholder="Enter category description"
            value={newCategory.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
          />
          
          <IconSelector
            selectedIcon={newCategory.icon}
            onIconSelect={(icon) => handleInputChange('icon', icon)}
            label="Category Icon"
          />
          
          {/* Icon Image Upload - Only show when no SVG icon is selected */}
          {(!newCategory.icon || newCategory.icon === '') && (
            <FileUpload
              label="Icon Image (JPEG/PNG)"
              accept="image/jpeg,image/png"
              maxSize={2}
              onFileSelect={handleIconFileSelect}
              onFileRemove={handleIconFileRemove}
              files={uploadedIconFiles}
              helperText="Upload a custom icon image (JPEG/PNG). Recommended size: 64x64px or 128x128px"
            />
          )}
          
          <FileUpload
            label="Category Image"
            accept="image/*"
            maxSize={5}
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
            files={uploadedFiles}
            helperText="Recommended size: 300x200px"
          />
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddCategory}
            disabled={actionLoading === 'add-category'}
          >
            {actionLoading === 'add-category' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Category'
            )}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        isOpen={!!editingCategory}
        onClose={() => {
          setEditingCategory(null);
          setEditCategory({ name: '', description: '', image_url: '', icon: '', icon_image_url: '', display_name: '', is_active: true });
          setUploadedFiles([]);
          setUploadedIconFiles([]);
        }}
        title="Edit Category"
        size="lg"
      >
        {editingCategory && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                label="Category Name" 
                value={editCategory.name}
                onChange={(e) => handleEditInputChange('name', e.target.value)}
                placeholder="Enter category name" 
              />
              <Input 
                label="Display Name" 
                value={editCategory.display_name}
                onChange={(e) => handleEditInputChange('display_name', e.target.value)}
                placeholder="Enter display name (optional)"
                helperText="Shorter, catchy name for the frontend display"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select 
                  className="w-full rounded-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-3 text-sm focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:focus:ring-primary-400/20"
                  value={editCategory.is_active ? 'active' : 'inactive'}
                  onChange={(e) => handleEditInputChange('is_active', e.target.value === 'active')}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <Input 
              label="Description" 
              value={editCategory.description}
              onChange={(e) => handleEditInputChange('description', e.target.value)}
              placeholder="Enter category description" 
            />
            
            <IconSelector
              selectedIcon={editCategory.icon}
              onIconSelect={(icon) => handleEditInputChange('icon', icon)}
              label="Category Icon"
            />
            
            {/* Icon Image Upload - Only show when no SVG icon is selected */}
            {(!editCategory.icon || editCategory.icon === '') && (
              <FileUpload
                label="Icon Image (JPEG/PNG)"
                accept="image/jpeg,image/png"
                maxSize={2}
                onFileSelect={handleIconFileSelect}
                onFileRemove={handleIconFileRemove}
                files={uploadedIconFiles}
                helperText="Upload a custom icon image (JPEG/PNG). Recommended size: 64x64px or 128x128px"
              />
            )}
            
            <FileUpload
              label="Category Image"
              accept="image/*"
              maxSize={5}
              onFileSelect={handleFileSelect}
              onFileRemove={handleFileRemove}
              files={uploadedFiles}
              helperText="Recommended size: 300x200px"
            />
          </div>
        )}
        <ModalFooter>
          <Button variant="secondary" onClick={() => setEditingCategory(null)}>
            Cancel
          </Button>
          <Button 
            onClick={handleEditCategory}
            disabled={actionLoading === 'edit-category'}
          >
            {actionLoading === 'edit-category' ? (
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
