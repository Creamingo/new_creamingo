import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Filter, Eye, Users, Edit, Trash2, TrendingUp, Award, UserPlus, RefreshCw, CheckCircle, Download, DollarSign, ShoppingBag } from 'lucide-react';
// import { useNavigate } from 'react-router-dom'; // Unused import
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table, Pagination } from '../components/ui/Table';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { TableColumn } from '../types';
import { customerService, Customer, CustomerStats, CreateCustomerData, UpdateCustomerData } from '../services/customerService';
import { useToastContext } from '../contexts/ToastContext';


export const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerStats, setCustomerStats] = useState<CustomerStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CreateCustomerData>({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip_code: '',
      country: ''
    }
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [filterOrderMin, setFilterOrderMin] = useState<string>('');
  const [filterOrderMax, setFilterOrderMax] = useState<string>('');
  const [filterSpendingMin, setFilterSpendingMin] = useState<string>('');
  const [filterSpendingMax, setFilterSpendingMax] = useState<string>('');
  const itemsPerPage = 10;
  const { showError, showSuccess } = useToastContext();

  // Fetch customers from API
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await customerService.getCustomers({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        sort_by: 'created_at',
        sort_order: 'DESC'
      });
      
      if (response.data) {
        setCustomers(response.data);
        setTotalPages(response.pagination?.pages || 1);
        setTotalCustomers(response.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      showError('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, showError]);

  // Fetch customer statistics
  const fetchCustomerStats = async () => {
    try {
      const response = await customerService.getCustomerStats();
      if (response.data) {
        setCustomerStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching customer stats:', error);
    }
  };

  // Load data on component mount and when dependencies change
  useEffect(() => {
    fetchCustomers();
    fetchCustomerStats();
  }, [fetchCustomers]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchCustomers();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, currentPage, fetchCustomers]);

  // Calculate additional stats from customers data
  const calculatedStats = useMemo(() => {
    if (!customers.length) {
      return {
        totalRevenue: 0,
        averageOrderValue: 0,
        averageCustomerLifetimeValue: 0,
        customersWithOrders: 0
      };
    }

    const totalRevenue = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
    const totalOrders = customers.reduce((sum, c) => sum + (c.totalOrders || 0), 0);
    const customersWithOrders = customers.filter(c => (c.totalOrders || 0) > 0).length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const averageCustomerLifetimeValue = customers.length > 0 ? totalRevenue / customers.length : 0;

    return {
      totalRevenue,
      averageOrderValue,
      averageCustomerLifetimeValue,
      customersWithOrders
    };
  }, [customers]);

  // Filter customers based on advanced filters
  const filteredCustomers = useMemo(() => {
    let filtered = [...customers];

    // Status filter
    if (filterStatus === 'active') {
      filtered = filtered.filter(c => (c.totalOrders || 0) > 0);
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter(c => (c.totalOrders || 0) === 0);
    } else if (filterStatus === 'vip') {
      filtered = filtered.filter(c => (c.totalSpent || 0) >= 200);
    } else if (filterStatus === 'new') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filtered = filtered.filter(c => new Date(c.createdAt) >= thirtyDaysAgo);
    }

    // Date range filter
    if (filterDateFrom) {
      const fromDate = new Date(filterDateFrom);
      filtered = filtered.filter(c => new Date(c.createdAt) >= fromDate);
    }
    if (filterDateTo) {
      const toDate = new Date(filterDateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(c => new Date(c.createdAt) <= toDate);
    }

    // Order count filter
    if (filterOrderMin) {
      const min = parseInt(filterOrderMin);
      filtered = filtered.filter(c => (c.totalOrders || 0) >= min);
    }
    if (filterOrderMax) {
      const max = parseInt(filterOrderMax);
      filtered = filtered.filter(c => (c.totalOrders || 0) <= max);
    }

    // Spending filter
    if (filterSpendingMin) {
      const min = parseFloat(filterSpendingMin);
      filtered = filtered.filter(c => (c.totalSpent || 0) >= min);
    }
    if (filterSpendingMax) {
      const max = parseFloat(filterSpendingMax);
      filtered = filtered.filter(c => (c.totalSpent || 0) <= max);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        c.phone.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [customers, filterStatus, filterDateFrom, filterDateTo, filterOrderMin, filterOrderMax, filterSpendingMin, filterSpendingMax, searchTerm]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Total Orders', 'Total Spent', 'Average Order Value', 'Last Order Date', 'Member Since', 'Status'];
    const rows = filteredCustomers.map(customer => [
      customer.name,
      customer.email,
      customer.phone,
      customer.totalOrders || 0,
      (customer.totalSpent || 0).toFixed(2),
      customer.totalOrders > 0 ? ((customer.totalSpent || 0) / customer.totalOrders).toFixed(2) : '0.00',
      customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : 'N/A',
      new Date(customer.createdAt).toLocaleDateString(),
      (customer.totalOrders || 0) > 0 ? 'Active' : 'Inactive'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `customers-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccess('Customers exported successfully');
  };

  // Reset filters
  const resetFilters = () => {
    setFilterStatus('all');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterOrderMin('');
    setFilterOrderMax('');
    setFilterSpendingMin('');
    setFilterSpendingMax('');
    setSearchTerm('');
  };

  // Get customer status badge
  const getCustomerStatus = (customer: Customer) => {
    if ((customer.totalSpent || 0) >= 200) return { label: 'VIP', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' };
    if ((customer.totalOrders || 0) > 0) return { label: 'Active', color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' };
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    if (new Date(customer.createdAt) >= thirtyDaysAgo) return { label: 'New', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' };
    return { label: 'Inactive', color: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300' };
  };

  const handleEditCustomer = async () => {
    if (!selectedCustomer) return;
    
    try {
      setLoading(true);
      const updateData: UpdateCustomerData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address
      };
      
      await customerService.updateCustomer(selectedCustomer.id, updateData);
      showSuccess('Customer updated successfully');
      setShowEditModal(false);
      setSelectedCustomer(null);
      resetForm();
      fetchCustomers();
      fetchCustomerStats();
    } catch (error) {
      console.error('Error updating customer:', error);
      showError('Failed to update customer');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;
    
    try {
      setLoading(true);
      await customerService.deleteCustomer(customerToDelete.id);
      showSuccess('Customer deleted successfully');
      setShowDeleteModal(false);
      setCustomerToDelete(null);
      fetchCustomers();
      fetchCustomerStats();
    } catch (error) {
      console.error('Error deleting customer:', error);
      showError('Failed to delete customer');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        zip_code: '',
        country: ''
      }
    });
  };

  const openEditModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address || {
        street: '',
        city: '',
        state: '',
        zip_code: '',
        country: ''
      }
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (customer: Customer) => {
    setCustomerToDelete(customer);
    setShowDeleteModal(true);
  };

  const customerColumns: TableColumn[] = [
    { 
      key: 'name', 
      label: 'Customer Name', 
      sortable: true,
      align: 'left',
      width: '200px',
      render: (value, item) => (
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 dark:text-white truncate">{value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{(item as Customer).email}</p>
          </div>
        </div>
      )
    },
    { 
      key: 'phone', 
      label: 'Contact', 
      sortable: true,
      align: 'left',
      width: '140px',
      render: (value) => <span className="text-sm text-gray-700 dark:text-gray-300">{value || 'N/A'}</span>
    },
    { 
      key: 'totalOrders', 
      label: 'Orders', 
      sortable: true,
      align: 'center',
      width: '100px',
      render: (value) => (
        <div className="flex items-center justify-center gap-1">
          <ShoppingBag className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
          <span className="font-semibold text-gray-900 dark:text-white">{value || 0}</span>
        </div>
      )
    },
    { 
      key: 'totalSpent', 
      label: 'Total Spent', 
      sortable: true, 
      render: (value) => (
        <div className="flex items-center justify-center gap-1">
          <DollarSign className="w-3.5 h-3.5 text-green-500 dark:text-green-400" />
          <span className="font-semibold text-gray-900 dark:text-white">₹{parseFloat(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
        </div>
      ),
      align: 'center',
      width: '150px'
    },
    { 
      key: 'lastOrderDate', 
      label: 'Last Order', 
      sortable: true, 
      render: (value) => {
        if (!value) return <span className="text-xs text-gray-400 dark:text-gray-500">Never</span>;
        const date = new Date(value);
        const daysAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
        return (
          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-700 dark:text-gray-300">{date.toLocaleDateString()}</span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400">{daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`}</span>
          </div>
        );
      },
      align: 'center',
      width: '140px'
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      width: '100px',
      render: (_, item) => {
        const status = getCustomerStatus(item as Customer);
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
        );
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'center',
      width: '120px',
      render: (_, item) => (
        <div className="flex items-center justify-center gap-2">
          <button 
            onClick={() => setSelectedCustomer(item as Customer)}
            className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button 
            onClick={() => openEditModal(item as Customer)}
            className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-primary-500 dark:hover:text-primary-400 transition-colors rounded hover:bg-pink-50 dark:hover:bg-pink-900/20"
            title="Edit Customer"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button 
            onClick={() => openDeleteModal(item as Customer)}
            className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded hover:bg-red-50 dark:hover:bg-red-900/20"
            title="Delete Customer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
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
            <div className="mb-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customers</h1>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Manage customer information, order history, and engagement metrics
              </p>
      </div>

            {/* Stats */}
            <div className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-7">
        <Card>
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Total Customers</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none mt-0.5">
                        {customerStats?.total_customers || 0}
                      </p>
              </div>
                    <Users className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card>
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Active Customers</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400 leading-none mt-0.5">
                        {customerStats?.active_customers || 0}
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
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">New This Month</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 leading-none mt-0.5">
                        {customerStats?.new_this_month || 0}
                      </p>
                    </div>
                    <UserPlus className="w-4 h-4 text-blue-400 dark:text-blue-500 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card>
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">VIP Customers</p>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 leading-none mt-0.5">
                        {customerStats?.vip_customers || 0}
                      </p>
              </div>
                    <Award className="w-4 h-4 text-purple-400 dark:text-purple-500 flex-shrink-0" />
              </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Total Revenue</p>
                      <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 leading-none mt-0.5">
                        ₹{calculatedStats.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <DollarSign className="w-4 h-4 text-indigo-400 dark:text-indigo-500 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card>
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Avg Order Value</p>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 leading-none mt-0.5">
                        ₹{calculatedStats.averageOrderValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </p>
              </div>
                    <ShoppingBag className="w-4 h-4 text-orange-400 dark:text-orange-500 flex-shrink-0" />
              </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Avg Lifetime Value</p>
                      <p className="text-2xl font-bold text-pink-600 dark:text-pink-400 leading-none mt-0.5">
                        ₹{calculatedStats.averageCustomerLifetimeValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <TrendingUp className="w-4 h-4 text-pink-400 dark:text-pink-500 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full px-3 sm:px-4 lg:px-6 py-4">
        {/* Search and Filter */}
        <div className="mb-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search customers by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 text-sm h-9"
              />
            </div>
            <Button
              variant="ghost"
              onClick={() => {
                fetchCustomers();
                fetchCustomerStats();
              }}
              className="px-3 py-2 text-xs font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors h-9 dark:text-gray-300"
              title="Refresh data"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Refresh
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-3 py-2 text-xs font-medium border rounded-lg transition-colors h-9 ${
                showAdvancedFilters
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/50'
                  : 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              title="Advanced filters"
            >
              <Filter className="w-3.5 h-3.5 mr-1.5" />
              Filters
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
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400 focus:border-pink-500 dark:focus:border-pink-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="vip">VIP</option>
                    <option value="new">New (Last 30 days)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Member Since (From)</label>
                  <Input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    className="text-sm h-9"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Member Since (To)</label>
                  <Input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    className="text-sm h-9"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Min Orders</label>
                  <Input
                    type="number"
                    value={filterOrderMin}
                    onChange={(e) => setFilterOrderMin(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="text-sm h-9"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Max Orders</label>
                  <Input
                    type="number"
                    value={filterOrderMax}
                    onChange={(e) => setFilterOrderMax(e.target.value)}
                    placeholder="Unlimited"
                    min="0"
                    className="text-sm h-9"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Min Spending (₹)</label>
                  <Input
                    type="number"
                    value={filterSpendingMin}
                    onChange={(e) => setFilterSpendingMin(e.target.value)}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className="text-sm h-9"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Max Spending (₹)</label>
                  <Input
                    type="number"
                    value={filterSpendingMax}
                    onChange={(e) => setFilterSpendingMax(e.target.value)}
                    placeholder="Unlimited"
                    min="0"
                    step="0.01"
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
                  Showing {filteredCustomers.length} of {customers.length} customers
                </div>
              </div>
      </Card>
          )}
        </div>

      {/* Customers Table */}
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold dark:text-white">
              All Customers ({filteredCustomers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-w-full">
              {filteredCustomers.length === 0 && !loading ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No customers found</p>
                  {customers.length > 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Try adjusting your filters</p>
                  )}
              </div>
            ) : (
              <Table
                  data={filteredCustomers}
                columns={customerColumns}
                emptyMessage="No customers found"
                loading={loading}
              />
            )}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalCustomers}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Customer Details Modal */}
      <Modal
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title={`Customer Details - ${selectedCustomer?.name}`}
        size="lg"
      >
        {selectedCustomer && (
          <div className="space-y-6">
            {/* Customer Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Customer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
                  <p className="font-medium dark:text-gray-200">{selectedCustomer.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                  <p className="font-medium dark:text-gray-200">{selectedCustomer.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                  <p className="font-medium dark:text-gray-200">{selectedCustomer.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Member Since</p>
                  <p className="font-medium dark:text-gray-200">{new Date(selectedCustomer.createdAt).toLocaleDateString()}</p>
                </div>
                {selectedCustomer.address && (
                  <>
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Saved Address</p>
                      <p className="font-medium dark:text-gray-200">
                        {[selectedCustomer.address.street, selectedCustomer.address.city, selectedCustomer.address.state, selectedCustomer.address.zip_code, selectedCustomer.address.country]
                          .filter(Boolean)
                          .join(', ') || 'N/A'}
                      </p>
                    </div>
                    {selectedCustomer.address.location &&
                      typeof selectedCustomer.address.location.lat === 'number' &&
                      typeof selectedCustomer.address.location.lng === 'number' && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Saved Map Location</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedCustomer.address.location.lat.toFixed(4)}, {selectedCustomer.address.location.lng.toFixed(4)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Use in maps: https://maps.google.com/?q={selectedCustomer.address.location.lat},{selectedCustomer.address.location.lng}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Order Statistics */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Order Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedCustomer.totalOrders}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{selectedCustomer.totalSpent.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Average Order</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ₹{selectedCustomer.totalOrders > 0 ? (selectedCustomer.totalSpent / selectedCustomer.totalOrders).toFixed(2) : '0.00'}
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Recent Orders</h3>
              {selectedCustomer.totalOrders > 0 ? (
                <div className="space-y-3">
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-2xl">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium dark:text-gray-200">Total Orders: {selectedCustomer.totalOrders}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Last Order: {selectedCustomer.lastOrderDate ? new Date(selectedCustomer.lastOrderDate).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium dark:text-gray-200">₹{selectedCustomer.totalSpent.toFixed(2)}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Spent</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-2xl text-center">
                  <p className="text-gray-500 dark:text-gray-400">No orders yet</p>
                </div>
              )}
            </div>
          </div>
        )}
        <ModalFooter>
          <Button onClick={() => setSelectedCustomer(null)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>

      {/* Edit Customer Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCustomer(null);
          resetForm();
        }}
        title={`Edit Customer - ${selectedCustomer?.name}`}
        size="lg"
      >
        <div className="space-y-6">
          {/* Basic Information Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Name <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Email <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Phone <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Address Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Street Address</label>
                <Input
                  value={formData.address?.street || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    address: { ...formData.address, street: e.target.value }
                  })}
                  placeholder="Enter street address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">City</label>
                <Input
                  value={formData.address?.city || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    address: { ...formData.address, city: e.target.value }
                  })}
                  placeholder="Enter city"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">State</label>
                <Input
                  value={formData.address?.state || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    address: { ...formData.address, state: e.target.value }
                  })}
                  placeholder="Enter state"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">ZIP Code</label>
                <Input
                  value={formData.address?.zip_code || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    address: { ...formData.address, zip_code: e.target.value }
                  })}
                  placeholder="Enter ZIP code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Country</label>
                <Input
                  value={formData.address?.country || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    address: { ...formData.address, country: e.target.value }
                  })}
                  placeholder="Enter country"
                />
              </div>
            </div>
          </div>
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => {
            setShowEditModal(false);
            setSelectedCustomer(null);
            resetForm();
          }}>
            Cancel
          </Button>
          <Button onClick={handleEditCustomer} disabled={loading || !formData.name || !formData.email || !formData.phone}>
            {loading ? 'Updating...' : 'Update Customer'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Customer Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setCustomerToDelete(null);
        }}
        title="Delete Customer"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete customer <strong className="dark:text-white">{customerToDelete?.name}</strong>?
          </p>
          <p className="text-sm text-red-600 dark:text-red-400">
            This action cannot be undone. If the customer has existing orders, deletion will be prevented.
          </p>
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => {
            setShowDeleteModal(false);
            setCustomerToDelete(null);
          }}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteCustomer} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete Customer'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};
