import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Eye, CreditCard, DollarSign, CheckCircle, XCircle, Clock, RefreshCw, Download, Calendar, FileText, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table, Pagination } from '../components/ui/Table';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { Payment, TableColumn } from '../types';
import paymentService, { PaymentStats } from '../services/paymentService';
import { useToastContext } from '../contexts/ToastContext';

const getStatusBadge = (status: string) => {
  const statusConfig = {
    pending: { 
      color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700', 
      icon: Clock 
    },
    completed: { 
      color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700', 
      icon: CheckCircle 
    },
    failed: { 
      color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700', 
      icon: XCircle 
    },
    refunded: { 
      color: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-600', 
      icon: DollarSign 
    }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${config.color}`}>
      <Icon className="h-3 w-3" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const getMethodBadge = (method: string) => {
  const methodConfig = {
    card: { color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700', label: 'Card', icon: CreditCard },
    upi: { color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700', label: 'UPI', icon: CreditCard },
    wallet: { color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-700', label: 'Wallet', icon: CreditCard },
    cash: { color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700', label: 'Cash', icon: DollarSign }
  };

  const config = methodConfig[method as keyof typeof methodConfig] || methodConfig.card;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${config.color}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
};

export const Payments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'completed' | 'failed' | 'refunded' | 'all'>('all');
  const [methodFilter, setMethodFilter] = useState<'card' | 'cash' | 'upi' | 'wallet' | 'all'>('all');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [filterAmountMin, setFilterAmountMin] = useState<string>('');
  const [filterAmountMax, setFilterAmountMax] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [totalPayments, setTotalPayments] = useState(0);
  const itemsPerPage = 10;
  const { showError } = useToastContext();

  // Fetch payments from API
  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentService.getPayments({
        page: currentPage,
        limit: itemsPerPage,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        method: methodFilter !== 'all' ? methodFilter : undefined,
        date_from: filterDateFrom || undefined,
        date_to: filterDateTo || undefined,
        amount_min: filterAmountMin ? parseFloat(filterAmountMin) : undefined,
        amount_max: filterAmountMax ? parseFloat(filterAmountMax) : undefined,
        sort_by: 'created_at',
        sort_order: 'DESC'
      });

      if (response.success && response.data) {
        setPayments(response.data);
        setTotalPayments(response.pagination?.total || response.data.length);
      } else {
        showError(response.message || 'Failed to fetch payments');
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      showError('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  // Fetch payment statistics
  const fetchPaymentStats = async () => {
    try {
      const response = await paymentService.getPaymentStats({
        date_from: filterDateFrom || undefined,
        date_to: filterDateTo || undefined
      });

      if (response.success && response.data) {
        setPaymentStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching payment stats:', error);
      }
    };

  // Load data on component mount and when dependencies change
  useEffect(() => {
    fetchPayments();
    fetchPaymentStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter, methodFilter, filterDateFrom, filterDateTo]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchPayments();
      }
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // Reset filters
  const resetFilters = () => {
    setStatusFilter('all');
    setMethodFilter('all');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterAmountMin('');
    setFilterAmountMax('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Filter payments
  const filteredPayments = useMemo(() => {
    let filtered = payments.filter(payment => {
      const matchesSearch = 
        payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.transactionId?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
      const matchesMethod = methodFilter === 'all' || payment.method === methodFilter;
      
      // Date range filter
      if (filterDateFrom) {
        const fromDate = new Date(filterDateFrom);
        if (new Date(payment.createdAt) < fromDate) return false;
      }
      if (filterDateTo) {
        const toDate = new Date(filterDateTo);
        toDate.setHours(23, 59, 59, 999);
        if (new Date(payment.createdAt) > toDate) return false;
      }

      // Amount range filter
      if (filterAmountMin) {
        const min = parseFloat(filterAmountMin);
        if (payment.amount < min) return false;
      }
      if (filterAmountMax) {
        const max = parseFloat(filterAmountMax);
        if (payment.amount > max) return false;
      }
      
      return matchesSearch && matchesStatus && matchesMethod;
    });

    // Sort by date (newest first)
    filtered.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return filtered;
  }, [payments, searchTerm, statusFilter, methodFilter, filterDateFrom, filterDateTo, filterAmountMin, filterAmountMax]);

  const paginatedPayments = filteredPayments;
  const totalPages = Math.ceil(totalPayments / itemsPerPage);


  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Payment ID', 'Order ID', 'Amount', 'Method', 'Status', 'Transaction ID', 'Date'];
    const rows = filteredPayments.map(payment => [
      payment.id,
      payment.orderId,
      `₹${payment.amount.toFixed(2)}`,
      payment.method,
      payment.status,
      payment.transactionId || 'N/A',
      new Date(payment.createdAt).toLocaleString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `payments-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const paymentColumns: TableColumn[] = [
    { key: 'id', label: 'Payment ID', sortable: true },
    { key: 'orderId', label: 'Order ID', sortable: true },
    { 
      key: 'amount', 
      label: 'Amount', 
      sortable: true, 
      render: (value) => (
        <div className="flex items-center justify-center gap-1">
          <DollarSign className="w-3.5 h-3.5 text-green-500 dark:text-green-400" />
          <span className="font-semibold text-gray-900 dark:text-white">₹{Number(value).toFixed(2)}</span>
        </div>
      ),
      align: 'center',
      width: '120px'
    },
    { 
      key: 'method', 
      label: 'Method', 
      render: (value) => getMethodBadge(value as string)
    },
    { 
      key: 'status', 
      label: 'Status', 
      render: (value) => getStatusBadge(value as string)
    },
    { 
      key: 'transactionId', 
      label: 'Transaction ID', 
      render: (value) => (
        <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
          {value || 'N/A'}
        </span>
      ),
      align: 'left',
      width: '180px'
    },
    { 
      key: 'createdAt', 
      label: 'Date', 
      sortable: true, 
      render: (value) => {
        const date = new Date(value as string);
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
      key: 'actions',
      label: 'Actions',
      align: 'center',
      width: '100px',
      render: (_, item) => (
        <div className="flex items-center justify-center">
            <button 
              onClick={() => setSelectedPayment(item as Payment)}
            className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
            title="View Details"
            >
              <Eye className="h-4 w-4" />
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payments</h1>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Manage payment transactions, refunds, and payment analytics
              </p>
      </div>

            {/* Stats */}
            <div className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              <Card>
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none mt-0.5">
                        ₹{paymentStats?.total_amount?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || 0}
                </p>
              </div>
                    <DollarSign className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

              <Card>
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Completed</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400 leading-none mt-0.5">
                        {paymentStats?.completed_count || 0}
                </p>
                      {(paymentStats?.completed_amount || 0) > 0 && (
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-none mt-0.5">
                          ₹{paymentStats?.completed_amount.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || 0}
                </p>
                      )}
              </div>
                    <CheckCircle className="w-4 h-4 text-green-400 dark:text-green-500 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

              <Card>
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Pending</p>
                      <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 leading-none mt-0.5">
                        {paymentStats?.pending_count || 0}
                </p>
              </div>
                    <Clock className="w-4 h-4 text-yellow-400 dark:text-yellow-500 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

              <Card>
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Failed</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400 leading-none mt-0.5">
                        {paymentStats?.failed_count || 0}
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
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Today's Payments</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 leading-none mt-0.5">
                        {paymentStats?.today_count || 0}
                </p>
                      {(paymentStats?.today_amount || 0) > 0 && (
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-none mt-0.5">
                          ₹{paymentStats?.today_amount.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || 0}
                </p>
                      )}
              </div>
                    <Calendar className="w-4 h-4 text-blue-400 dark:text-blue-500 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

              <Card>
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Total Payments</p>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 leading-none mt-0.5">
                        {paymentStats?.total_payments || 0}
                </p>
              </div>
                    <CreditCard className="w-4 h-4 text-purple-400 dark:text-purple-500 flex-shrink-0" />
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
                placeholder="Search payments by ID, Order ID, or Transaction ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 text-sm h-9"
              />
            </div>
                <Button
                  variant="ghost"
              onClick={() => {
                fetchPayments();
                fetchPaymentStats();
              }}
              disabled={loading}
              className="px-3 py-2 text-xs font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors h-9 dark:text-gray-300"
              title="Refresh data"
                >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
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
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'pending' | 'completed' | 'failed' | 'refunded' | 'all')}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400 focus:border-pink-500 dark:focus:border-pink-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
            </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Payment Method</label>
                  <select
                    value={methodFilter}
                    onChange={(e) => setMethodFilter(e.target.value as 'card' | 'cash' | 'upi' | 'wallet' | 'all')}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400 focus:border-pink-500 dark:focus:border-pink-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Methods</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="wallet">Wallet</option>
                    <option value="cash">Cash</option>
                  </select>
          </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Date (From)</label>
                <Input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    className="text-sm h-9"
                />
              </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Date (To)</label>
                  <Input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    className="text-sm h-9"
                  />
            </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Min Amount (₹)</label>
                  <Input
                    type="number"
                    value={filterAmountMin}
                    onChange={(e) => setFilterAmountMin(e.target.value)}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className="text-sm h-9"
                  />
            </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Max Amount (₹)</label>
                  <Input
                    type="number"
                    value={filterAmountMax}
                    onChange={(e) => setFilterAmountMax(e.target.value)}
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
                  Showing {filteredPayments.length} of {totalPayments} payments
                      </div>
                    </div>
            </Card>
              )}
            </div>

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold dark:text-white">
              All Payments ({totalPayments})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
            <div className="overflow-x-auto max-w-full">
              {filteredPayments.length === 0 && !loading ? (
                <div className="text-center py-12">
                  <CreditCard className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No payments found</p>
                  {totalPayments > 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Try adjusting your filters</p>
                  )}
                </div>
              ) : (
                <Table
                  data={paginatedPayments}
                  columns={paymentColumns}
                  emptyMessage="No payments found"
                  loading={loading}
                  />
              )}
              {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                  totalItems={totalPayments}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                  />
              )}
            </div>
        </CardContent>
      </Card>
      </div>

      {/* Payment Details Modal */}
      <Modal
        isOpen={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
        title={`Payment Details - ${selectedPayment?.id}`}
        size="lg"
      >
        {selectedPayment && (
          <div className="space-y-6">
            {/* Payment Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                Payment Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">Payment ID</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedPayment.id}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">Order ID</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedPayment.orderId}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">Amount</p>
                  <p className="font-bold text-lg text-gray-900 dark:text-white">₹{selectedPayment.amount.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">Payment Method</p>
                  <div className="mt-1">{getMethodBadge(selectedPayment.method)}</div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">Transaction ID</p>
                  <p className="font-mono text-sm text-gray-900 dark:text-white">{selectedPayment.transactionId || 'N/A'}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg md:col-span-2">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">Date & Time</p>
                  <p className="font-medium text-gray-900 dark:text-white">{new Date(selectedPayment.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            {selectedPayment.status === 'completed' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  Actions
                </h3>
                <div className="flex flex-wrap gap-3">
                  <Button variant="secondary">
                    <FileText className="h-4 w-4 mr-2" />
                    Process Refund
                  </Button>
                  <Button variant="secondary">
                    <Download className="h-4 w-4 mr-2" />
                    Download Receipt
                  </Button>
                </div>
              </div>
            )}

            {selectedPayment.status === 'failed' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  Actions
                </h3>
                <div className="flex flex-wrap gap-3">
                  <Button>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry Payment
                  </Button>
                  <Button variant="secondary">
                    Contact Customer
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
        <ModalFooter>
          <Button onClick={() => setSelectedPayment(null)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};
