import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Wallet, 
  TrendingUp, 
  Gift, 
  Ticket,
  Crown,
  CreditCard,
  Package,
  Loader2,
  Edit,
  CheckCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { customerService, Customer } from '../services/customerService';
import { useToastContext } from '../contexts/ToastContext';

export const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showError } = useToastContext();
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [walletData, setWalletData] = useState<any>(null);
  const [referralData, setReferralData] = useState<any>(null);
  const [scratchCardData, setScratchCardData] = useState<any>(null);
  const [tierData, setTierData] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const fetchAllData = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setLoadingData(true);
      
      // Fetch all data in parallel
      const [customerRes, walletRes, referralRes, scratchCardRes, tierRes, ordersRes] = await Promise.all([
        customerService.getCustomer(id),
        customerService.getCustomerWalletTransactions(id, 1, 5).catch(() => ({ success: false, data: null })),
        customerService.getCustomerReferrals(id).catch(() => ({ success: false, data: null })),
        customerService.getCustomerScratchCards(id, 1, 5).catch(() => ({ success: false, data: null })),
        customerService.getCustomerTierInfo(id).catch(() => ({ success: false, data: null })),
        customerService.getCustomerOrders(id, 1, 5).catch(() => ({ success: false, data: null }))
      ]);

      if (customerRes.data) {
        setCustomer(customerRes.data);
      }
      if (walletRes.data) setWalletData(walletRes.data);
      if (referralRes.data) setReferralData(referralRes.data);
      if (scratchCardRes.data) setScratchCardData(scratchCardRes.data);
      if (tierRes.data) setTierData(tierRes.data);
      if (ordersRes.data) setOrders(ordersRes.data || []);
    } catch (error) {
      console.error('Error fetching customer data:', error);
      showError('Failed to fetch customer data');
    } finally {
      setLoading(false);
      setLoadingData(false);
    }
  }, [id, showError]);

  useEffect(() => {
    if (id) {
      fetchAllData();
    }
  }, [id, fetchAllData]);

  if (loading && !customer) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">Customer not found</p>
            <Button onClick={() => navigate('/customers')} className="mt-4">
              Back to Customers
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { bg: string; text: string } } = {
      delivered: { bg: 'bg-green-100', text: 'text-green-700' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
      confirmed: { bg: 'bg-blue-100', text: 'text-blue-700' },
      preparing: { bg: 'bg-purple-100', text: 'text-purple-700' }
    };
    const config = statusConfig[status.toLowerCase()] || { bg: 'bg-gray-100', text: 'text-gray-700' };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.text}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-4">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => navigate('/customers')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center text-white text-lg font-bold">
              {getInitials(customer.name)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{customer.name}</h1>
              <div className="flex items-center gap-3 text-xs text-gray-600 mt-0.5">
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {customer.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {customer.phone}
                </span>
              </div>
            </div>
          </div>
        </div>
        <Button variant="secondary" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </div>

      {/* Compact Stats Grid - 6 columns */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-4 w-4 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-600">Orders</p>
                <p className="text-lg font-bold text-gray-900">{customer.totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-600">Spent</p>
                <p className="text-lg font-bold text-gray-900">₹{customer.totalSpent.toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Wallet className="h-4 w-4 text-purple-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-600">Wallet</p>
                <p className="text-lg font-bold text-gray-900">
                  {loadingData ? '...' : walletData?.walletBalance ? `₹${walletData.walletBalance.toFixed(0)}` : '₹0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-pink-100 rounded-lg">
                <Gift className="h-4 w-4 text-pink-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-600">Referrals</p>
                <p className="text-lg font-bold text-gray-900">
                  {loadingData ? '...' : referralData?.stats?.totalReferrals || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Ticket className="h-4 w-4 text-yellow-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-600">Scratch Cards</p>
                <p className="text-lg font-bold text-gray-900">
                  {loadingData ? '...' : scratchCardData?.scratchCards?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Crown className="h-4 w-4 text-orange-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-600">Tier</p>
                <p className="text-sm font-bold text-gray-900 truncate">
                  {loadingData ? '...' : tierData?.currentTier?.tier || 'Bronze'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Customer Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="font-medium">{customer.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="font-medium">{customer.phone}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium">{customer.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Member Since</p>
                  <p className="font-medium">{new Date(customer.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium mt-0.5">
                    Active
                  </span>
                </div>
              </div>
              {customer.address && (
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Address</p>
                  <p className="text-sm font-medium">
                    {[
                      customer.address.street,
                      customer.address.city,
                      customer.address.state,
                      customer.address.zip_code
                    ].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Orders</CardTitle>
                {orders.length > 0 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => window.open(`/orders?customer=${id}`, '_blank')}
                    className="text-xs"
                  >
                    View All
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <div className="text-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-gray-400" />
                </div>
              ) : orders.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No orders yet</p>
              ) : (
                <div className="space-y-2">
                  {orders.slice(0, 3).map((order) => (
                    <div key={order.id} className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate">#{order.order_number}</p>
                          <p className="text-xs text-gray-600">
                            {new Date(order.created_at).toLocaleDateString()} • ₹{order.total_amount.toFixed(2)}
                          </p>
                        </div>
                        <div className="ml-2">
                          {getStatusBadge(order.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Wallet Transactions */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Transactions</CardTitle>
                {walletData?.transactions?.length > 0 && (
                  <span className="text-xs text-gray-500">
                    Balance: ₹{walletData.walletBalance.toFixed(2)}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <div className="text-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-gray-400" />
                </div>
              ) : !walletData?.transactions || walletData.transactions.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No transactions</p>
              ) : (
                <div className="space-y-2">
                  {walletData.transactions.slice(0, 3).map((tx: any) => (
                    <div key={tx.id} className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        tx.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {tx.type === 'credit' ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <CreditCard className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{tx.description || tx.transaction_type}</p>
                        <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className={`text-sm font-bold ${
                        tx.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {tx.type === 'credit' ? '+' : '-'}₹{parseFloat(tx.amount).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Referral Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Referral Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingData ? (
                <div className="text-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-gray-400" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Total</p>
                      <p className="text-lg font-bold text-gray-900">{referralData?.stats?.totalReferrals || 0}</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Earned</p>
                      <p className="text-lg font-bold text-gray-900">₹{referralData?.stats?.totalEarned?.toFixed(0) || 0}</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Code</p>
                      <p className="text-sm font-bold text-pink-600 truncate">{referralData?.referralCode || 'N/A'}</p>
                    </div>
                  </div>
                  {referralData?.referrerInfo && (
                    <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs text-gray-500 mb-1">Referred By</p>
                      <p className="text-sm font-medium">{referralData.referrerInfo.name}</p>
                      <p className="text-xs text-gray-600">{referralData.referrerInfo.email}</p>
                    </div>
                  )}
                  {referralData?.referrals && referralData.referrals.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Recent Referrals</p>
                      <div className="space-y-1.5">
                        {referralData.referrals.slice(0, 2).map((ref: any) => (
                          <div key={ref.id} className="p-2 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between">
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium truncate">{ref.referee_name || 'Unknown'}</p>
                                <p className="text-xs text-gray-500 truncate">{ref.referee_email}</p>
                              </div>
                              <div className="text-right ml-2">
                                <p className="text-xs font-bold text-green-600">+₹{ref.referrer_bonus_amount?.toFixed(0) || 0}</p>
                                <p className={`text-xs ${
                                  ref.referrer_bonus_credited ? 'text-green-600' : 'text-yellow-600'
                                }`}>
                                  {ref.referrer_bonus_credited ? '✓' : '⏳'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Tier & Milestones */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Tier & Milestones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingData ? (
                <div className="text-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-gray-400" />
                </div>
              ) : (
                <>
                  {tierData?.currentTier && (
                    <div className="p-2.5 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center gap-2">
                        <Crown className="h-5 w-5 text-yellow-600" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">Current Tier</p>
                          <p className="text-sm font-bold text-gray-900">{tierData.currentTier.name}</p>
                        </div>
                        <p className="text-xs text-gray-600">{tierData.referralCount || 0} refs</p>
                      </div>
                    </div>
                  )}
                  {tierData?.tierProgress && (
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600">Next: {tierData.tierProgress.nextTier?.name}</span>
                        <span className="text-gray-600">{tierData.tierProgress.referralsNeeded} more</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-pink-500 to-rose-500 h-2 rounded-full transition-all"
                          style={{ width: `${tierData.tierProgress.progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {tierData?.milestoneProgress?.milestones && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Milestones</p>
                      <div className="space-y-1">
                        {tierData.milestoneProgress.milestones.slice(0, 3).map((milestone: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-1.5 bg-gray-50 rounded border border-gray-200">
                            <div className="flex items-center gap-2">
                              {milestone.achieved ? (
                                <CheckCircle className="h-3 w-3 text-green-600" />
                              ) : (
                                <Clock className="h-3 w-3 text-gray-400" />
                              )}
                              <span className="text-xs font-medium">{milestone.name}</span>
                            </div>
                            <span className="text-xs text-gray-600">{milestone.target} refs</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Scratch Cards */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent Scratch Cards</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <div className="text-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-gray-400" />
                </div>
              ) : !scratchCardData?.scratchCards || scratchCardData.scratchCards.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No scratch cards</p>
              ) : (
                <div className="space-y-2">
                  {scratchCardData.scratchCards.slice(0, 3).map((card: any) => (
                    <div key={card.id} className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Ticket className="h-4 w-4 text-purple-600" />
                        <div>
                          <p className="text-sm font-semibold">₹{card.amount.toFixed(2)}</p>
                          {card.order_number && (
                            <p className="text-xs text-gray-500">Order #{card.order_number}</p>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        card.status === 'credited' ? 'bg-green-100 text-green-700' :
                        card.status === 'revealed' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {card.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
