import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Layers, CheckCircle, XCircle, Clock, ArrowUpDown, ChevronDown, RefreshCw, ExternalLink, Grid3x3, List, Download, CheckSquare, Square, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { Collection } from '../types';
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

// Mock data
const mockCollections: Collection[] = [
  {
    id: 'COL-001',
    name: 'Kids Favorites',
    description: 'Popular cakes loved by children',
    type: 'kids',
    products: ['PROD-001', 'PROD-002', 'PROD-003'],
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'COL-002',
    name: 'Trending Now',
    description: 'Currently popular cakes',
    type: 'trending',
    products: ['PROD-004', 'PROD-005'],
    status: 'active',
    createdAt: '2024-01-02T00:00:00Z'
  },
  {
    id: 'COL-003',
    name: 'Holiday Specials',
    description: 'Special cakes for holidays',
    type: 'seasonal',
    products: ['PROD-006', 'PROD-007', 'PROD-008'],
    status: 'inactive',
    createdAt: '2024-01-03T00:00:00Z'
  }
];

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

const getTypeBadge = (type: string) => {
  const typeConfig = {
    kids: { color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300', label: 'Kids' },
    trending: { color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300', label: 'Trending' },
    seasonal: { color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300', label: 'Seasonal' },
    custom: { color: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300', label: 'Custom' }
  };

  const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.custom;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
};

export const Collections: React.FC = () => {
  const [collections, setCollections] = useState<Collection[]>(mockCollections);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'kids' | 'trending' | 'seasonal' | 'custom'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'newest' | 'oldest' | 'type' | 'products'>('name');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { showSuccess } = useToastContext();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) {
        setShowTypeDropdown(false);
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

  // Update bulk actions visibility
  useEffect(() => {
    setShowBulkActions(selectedCollections.size > 0);
  }, [selectedCollections]);

  // Calculate statistics
  const collectionStats = {
    total: collections.length,
    active: collections.filter(c => c.status === 'active').length,
    inactive: collections.filter(c => c.status === 'inactive').length,
    totalProducts: collections.reduce((sum, c) => sum + (c.products?.length || 0), 0)
  };

  // Filter and sort collections
  const filteredCollections = collections
    .filter(collection => {
      const matchesSearch = collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        collection.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = typeFilter === 'all' || collection.type === typeFilter;
      
      const matchesStatus = statusFilter === 'all' || collection.status === statusFilter;
      
      return matchesSearch && matchesType && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        case 'type':
          return a.type.localeCompare(b.type);
        case 'products':
          return (b.products?.length || 0) - (a.products?.length || 0);
        default:
          return a.name.localeCompare(b.name);
      }
    });

  // Handle select all
  const handleSelectAll = () => {
    if (selectedCollections.size === filteredCollections.length) {
      setSelectedCollections(new Set());
    } else {
      setSelectedCollections(new Set(filteredCollections.map(c => c.id)));
    }
  };

  // Handle individual selection
  const handleSelectCollection = (collectionId: string, selected: boolean) => {
    const newSelected = new Set(selectedCollections);
    if (selected) {
      newSelected.add(collectionId);
    } else {
      newSelected.delete(collectionId);
    }
    setSelectedCollections(newSelected);
  };

  // Bulk actions
  const handleBulkDelete = () => {
    if (selectedCollections.size === 0) return;
    
    const confirmMessage = `Are you sure you want to delete ${selectedCollections.size} collection(s)?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setCollections(prev => prev.filter(c => !selectedCollections.has(c.id)));
    setSelectedCollections(new Set());
    showSuccess('Collections Deleted', `${selectedCollections.size} collections have been deleted successfully.`);
  };

  // Export function
  const handleExport = () => {
    const csvContent = [
      ['Name', 'Description', 'Type', 'Status', 'Products Count', 'Created At'].join(','),
      ...filteredCollections.map(collection => [
        collection.name,
        `"${collection.description.replace(/"/g, '""')}"`,
        collection.type,
        collection.status,
        collection.products?.length || 0,
        new Date(collection.createdAt).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `collections-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showSuccess('Export Complete', 'Collections data has been exported successfully.');
  };


  const handleDeleteCollection = (collectionId: string) => {
    if (window.confirm('Are you sure you want to delete this collection?')) {
      setCollections(collections.filter(c => c.id !== collectionId));
      showSuccess('Collection Deleted', 'Collection has been deleted successfully.');
    }
  };

  const handleAddCollection = () => {
    setShowAddModal(false);
    showSuccess('Collection Added', 'Collection has been added successfully.');
  };

  const handleEditCollection = () => {
    setEditingCollection(null);
    showSuccess('Collection Updated', 'Collection has been updated successfully.');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="w-full px-3 sm:px-4 lg:px-6">
          <div className="py-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Collections</h1>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  Manage homepage collections and special sections
                </p>
              </div>
              <Button 
                onClick={() => setShowAddModal(true)}
                className="group relative overflow-hidden bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 hover:from-pink-700 hover:via-rose-700 hover:to-pink-700 text-white font-semibold px-4 sm:px-6 py-2.5 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-pink-500/30 hover:border-pink-400/50 flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <Layers className="w-4 h-4 relative z-10" />
                <Plus className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Add Collection</span>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
              <Card>
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Total Collections</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none mt-0.5">
                        {collectionStats.total}
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
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Active Collections</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400 leading-none mt-0.5">
                        {collectionStats.active}
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
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Inactive Collections</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400 leading-none mt-0.5">
                        {collectionStats.inactive}
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
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Total Products</p>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 leading-none mt-0.5">
                        {collectionStats.totalProducts}
                      </p>
                    </div>
                    <Package className="w-4 h-4 text-orange-400 dark:text-orange-500 flex-shrink-0" />
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
                placeholder="Search collections by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            
            {/* Filter and Sort Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Type Filter - Custom Dropdown */}
              <div className="relative" ref={typeDropdownRef}>
                <button
                  onClick={() => {
                    setShowTypeDropdown(!showTypeDropdown);
                    setShowStatusDropdown(false);
                    setShowSortDropdown(false);
                  }}
                  className="flex items-center justify-between h-10 min-w-[180px] bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md px-4 hover:bg-gray-100 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 cursor-pointer group shadow-sm active:scale-[0.98] active:shadow-xs"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="p-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                      <Layers className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex flex-col items-start justify-center">
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide leading-none">Type</span>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-tight mt-0.5">
                        {typeFilter === 'all' && 'All Types'}
                        {typeFilter === 'kids' && 'Kids'}
                        {typeFilter === 'trending' && 'Trending'}
                        {typeFilter === 'seasonal' && 'Seasonal'}
                        {typeFilter === 'custom' && 'Custom'}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform duration-300 flex-shrink-0 ${showTypeDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Type Dropdown Menu */}
                {showTypeDropdown && (
                  <div className="absolute top-full left-0 mt-2 min-w-[180px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl dark:shadow-black/40 z-50 overflow-hidden backdrop-blur-sm">
                    <div className="py-1.5">
                      <button
                        onClick={() => {
                          setTypeFilter('all');
                          setShowTypeDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 flex items-center justify-between ${
                          typeFilter === 'all' 
                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold border-l-2 border-primary-500 dark:border-primary-400' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <span>All Types</span>
                        {typeFilter === 'all' && (
                          <div className="w-2 h-2 rounded-full bg-primary-500 dark:bg-primary-400"></div>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setTypeFilter('kids');
                          setShowTypeDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 flex items-center justify-between ${
                          typeFilter === 'kids' 
                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold border-l-2 border-primary-500 dark:border-primary-400' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <span>Kids</span>
                        {typeFilter === 'kids' && (
                          <div className="w-2 h-2 rounded-full bg-primary-500 dark:bg-primary-400"></div>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setTypeFilter('trending');
                          setShowTypeDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 flex items-center justify-between ${
                          typeFilter === 'trending' 
                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold border-l-2 border-primary-500 dark:border-primary-400' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <span>Trending</span>
                        {typeFilter === 'trending' && (
                          <div className="w-2 h-2 rounded-full bg-primary-500 dark:bg-primary-400"></div>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setTypeFilter('seasonal');
                          setShowTypeDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 flex items-center justify-between ${
                          typeFilter === 'seasonal' 
                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold border-l-2 border-primary-500 dark:border-primary-400' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <span>Seasonal</span>
                        {typeFilter === 'seasonal' && (
                          <div className="w-2 h-2 rounded-full bg-primary-500 dark:bg-primary-400"></div>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setTypeFilter('custom');
                          setShowTypeDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 flex items-center justify-between ${
                          typeFilter === 'custom' 
                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold border-l-2 border-primary-500 dark:border-primary-400' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <span>Custom</span>
                        {typeFilter === 'custom' && (
                          <div className="w-2 h-2 rounded-full bg-primary-500 dark:bg-primary-400"></div>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Filter - Custom Dropdown */}
              <div className="relative" ref={statusDropdownRef}>
                <button
                  onClick={() => {
                    setShowStatusDropdown(!showStatusDropdown);
                    setShowTypeDropdown(false);
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
                    setShowTypeDropdown(false);
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
                        {sortBy === 'name' && 'Name A-Z'}
                        {sortBy === 'newest' && 'Newest First'}
                        {sortBy === 'oldest' && 'Oldest First'}
                        {sortBy === 'type' && 'Type A-Z'}
                        {sortBy === 'products' && 'Most Products'}
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
                          setSortBy('type');
                          setShowSortDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 flex items-center justify-between ${
                          sortBy === 'type' 
                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold border-l-2 border-primary-500 dark:border-primary-400' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <span>Type A-Z</span>
                        {sortBy === 'type' && (
                          <div className="w-2 h-2 rounded-full bg-primary-500 dark:bg-primary-400"></div>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setSortBy('products');
                          setShowSortDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 flex items-center justify-between ${
                          sortBy === 'products' 
                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold border-l-2 border-primary-500 dark:border-primary-400' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <span>Most Products</span>
                        {sortBy === 'products' && (
                          <div className="w-2 h-2 rounded-full bg-primary-500 dark:bg-primary-400"></div>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Results Count */}
              <div className="ml-auto text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredCollections.length} of {collections.length} collections
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
                onClick={() => {
                  // Refresh collections
                  setCollections([...mockCollections]);
                }}
                className="text-xs sm:text-sm font-semibold"
              >
                <RefreshCw className="h-4 w-4 mr-1.5" />
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
              <DashboardTooltip text="Export collections data to CSV">
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
                  {selectedCollections.size} collection(s) selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="text-xs sm:text-sm font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Delete
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedCollections(new Set())}
                  className="text-xs sm:text-sm font-semibold"
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Collections Table/Grid View */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              All Collections ({filteredCollections.length})
            </CardTitle>
            {filteredCollections.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                {selectedCollections.size === filteredCollections.length ? (
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
          {filteredCollections.length === 0 ? (
            <div className="text-center py-12">
              <Layers className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No collections found</p>
            </div>
          ) : viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-chocolate-50 dark:bg-chocolate-900/20">
                  <tr>
                    <th className="w-12 px-6 py-3 text-center text-xs font-medium text-chocolate-700 dark:text-chocolate-300 uppercase tracking-wider">
                      <span></span>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-chocolate-700 dark:text-chocolate-300 uppercase tracking-wider">
                      Collection Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-chocolate-700 dark:text-chocolate-300 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-chocolate-700 dark:text-chocolate-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-chocolate-700 dark:text-chocolate-300 uppercase tracking-wider">
                      Products
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-chocolate-700 dark:text-chocolate-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-chocolate-700 dark:text-chocolate-300 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-chocolate-700 dark:text-chocolate-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredCollections.map((collection) => {
                    const isSelected = selectedCollections.has(collection.id);
                    return (
                      <tr key={collection.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${isSelected ? 'bg-primary-50/30 dark:bg-primary-900/20' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleSelectCollection(collection.id, !isSelected)}
                            className="flex items-center justify-center"
                          >
                            {isSelected ? (
                              <CheckSquare className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                            ) : (
                              <Square className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400" />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {collection.name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 dark:text-gray-300 max-w-md truncate">
                            {collection.description}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getTypeBadge(collection.type)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {collection.products?.length || 0} items
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(collection.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(collection.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => setEditingCollection(collection)}
                              className="p-1 text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteCollection(collection.id)}
                              className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 sm:p-5 md:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
                {filteredCollections.map((collection) => {
                  const isSelected = selectedCollections.has(collection.id);
                  return (
                    <Card key={collection.id} className={`hover:shadow-lg transition-all duration-200 overflow-hidden group ${isSelected ? 'ring-2 ring-primary-500 dark:ring-primary-400' : ''}`}>
                      <div className="relative bg-gradient-to-br from-primary-50 to-orange-50 dark:from-primary-900/20 dark:to-orange-900/20 p-6">
                        <div className="absolute top-2 right-2 flex items-center gap-2">
                          <button
                            onClick={() => handleSelectCollection(collection.id, !isSelected)}
                            className="bg-white dark:bg-gray-800 rounded-lg p-1.5 shadow-md hover:shadow-lg transition-shadow"
                          >
                            {isSelected ? (
                              <CheckSquare className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                            ) : (
                              <Square className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            )}
                          </button>
                          {getStatusBadge(collection.status)}
                        </div>
                        <div className="flex items-center justify-center mb-4">
                          <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md">
                            <Layers className="h-12 w-12 text-primary-600 dark:text-primary-400" />
                          </div>
                        </div>
                        <div className="text-center">
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                            {collection.name}
                          </h3>
                          {getTypeBadge(collection.type)}
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                            {collection.description}
                          </p>
                          <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                              <Package className="h-3 w-3" />
                              <span>{collection.products?.length || 0} products</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                              <Clock className="h-3 w-3" />
                              <span>{new Date(collection.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-center gap-2 pt-2">
                            <button 
                              onClick={() => setEditingCollection(collection)}
                              className="flex-1 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="h-3 w-3 inline mr-1" />
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteCollection(collection.id)}
                              className="flex-1 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-3 w-3 inline mr-1" />
                              Delete
                            </button>
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

      {/* Add Collection Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Collection"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Collection Name" placeholder="Enter collection name" />
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type
              </label>
                <select className="w-full rounded-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white px-4 py-3 text-sm focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:focus:ring-primary-400/20">
                <option value="kids">Kids Favorites</option>
                <option value="trending">Trending Now</option>
                <option value="seasonal">Seasonal</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select className="w-full rounded-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white px-4 py-3 text-sm focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:focus:ring-primary-400/20">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <Input label="Description" placeholder="Enter collection description" />
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddCollection}>
            Add Collection
          </Button>
        </ModalFooter>
      </Modal>

      {/* Edit Collection Modal */}
      <Modal
        isOpen={!!editingCollection}
        onClose={() => setEditingCollection(null)}
        title="Edit Collection"
        size="lg"
      >
        {editingCollection && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                label="Collection Name" 
                defaultValue={editingCollection.name}
                placeholder="Enter collection name" 
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type
                </label>
                <select className="w-full rounded-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white px-4 py-3 text-sm focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:focus:ring-primary-400/20">
                  <option value="kids" selected={editingCollection.type === 'kids'}>Kids Favorites</option>
                  <option value="trending" selected={editingCollection.type === 'trending'}>Trending Now</option>
                  <option value="seasonal" selected={editingCollection.type === 'seasonal'}>Seasonal</option>
                  <option value="custom" selected={editingCollection.type === 'custom'}>Custom</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select className="w-full rounded-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white px-4 py-3 text-sm focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:focus:ring-primary-400/20">
                  <option value="active" selected={editingCollection.status === 'active'}>Active</option>
                  <option value="inactive" selected={editingCollection.status === 'inactive'}>Inactive</option>
                </select>
              </div>
            </div>
            <Input 
              label="Description" 
              defaultValue={editingCollection.description}
              placeholder="Enter collection description" 
            />
          </div>
        )}
        <ModalFooter>
          <Button variant="secondary" onClick={() => setEditingCollection(null)}>
            Cancel
          </Button>
          <Button onClick={handleEditCollection}>
            Save Changes
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};
