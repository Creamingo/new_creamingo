import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  MapPin, 
  Phone, 
  Camera, 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  Navigation,
  User,
  Package,
  Calendar,
  AlertCircle,
  Star
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { deliveryService, DeliveryOrder, DeliveryStats } from '../services/deliveryService';


// Mock data for delivery orders
const mockOrders: DeliveryOrder[] = [
  {
    id: '1',
    orderNumber: 'ORD-001',
    customerName: 'John Doe',
    customerPhone: '+1234567890',
    customerAddress: '123 Main St, Downtown, City 12345',
    deliveryDate: '2024-01-15',
    deliveryTime: '14:00',
    items: ['Chocolate Cake x1 (2kg)', 'Cupcakes (6 pcs) x1 (500g)'],
    total: 45.99,
    status: 'assigned',
    specialInstructions: 'Ring doorbell twice, leave at door if no answer',
    coordinates: { lat: 40.7128, lng: -74.0060 },
    priority: 'high',
    paymentStatus: 'paid'
  },
  {
    id: '2',
    orderNumber: 'ORD-002',
    customerName: 'Jane Smith',
    customerPhone: '+1234567891',
    customerAddress: '456 Oak Ave, Uptown, City 12346',
    deliveryDate: '2024-01-15',
    deliveryTime: '16:30',
    items: ['Birthday Cake x1 (1.5kg)'],
    total: 32.50,
    status: 'picked_up',
    specialInstructions: 'Call before delivery',
    coordinates: { lat: 40.7589, lng: -73.9851 },
    priority: 'medium',
    paymentStatus: 'paid'
  },
  {
    id: '3',
    orderNumber: 'ORD-003',
    customerName: 'Mike Johnson',
    customerPhone: '+1234567892',
    customerAddress: '789 Pine St, Midtown, City 12347',
    deliveryDate: '2024-01-15',
    deliveryTime: '18:00',
    items: ['Wedding Cake x1 (3kg)'],
    total: 89.99,
    status: 'assigned',
    specialInstructions: 'Fragile - handle with care',
    coordinates: { lat: 40.7505, lng: -73.9934 },
    priority: 'high',
    paymentStatus: 'paid'
  }
];

const DeliveryDashboard: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [todayStats, setTodayStats] = useState<DeliveryStats>({
    totalOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    totalEarnings: 0
  });

  // Get current location and load data
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        
        // Get current location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setCurrentLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude
              });
            },
            (error) => {
              console.error('Error getting location:', error);
            }
          );
        }

        // Load delivery orders and stats
        const [ordersData, statsData] = await Promise.all([
          deliveryService.getDeliveryOrders(user.id),
          deliveryService.getDeliveryStats(user.id, new Date().toISOString().split('T')[0])
        ]);

        setOrders(ordersData);
        setTodayStats(statsData);
      } catch (error) {
        console.error('Error loading delivery data:', error);
        // Fallback to mock data if API fails
        setOrders(mockOrders);
        setTodayStats({
          totalOrders: 8,
          completedOrders: 5,
          pendingOrders: 3,
          totalEarnings: 156.50
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  const handleStatusUpdate = async (orderId: string, newStatus: DeliveryOrder['status']) => {
    try {
      await deliveryService.updateDeliveryStatus(orderId, newStatus, {
        coordinates: currentLocation ? {
          lat: currentLocation.lat,
          lng: currentLocation.lng
        } : undefined
      });

      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));

      // Refresh stats
      if (user?.id) {
        const statsData = await deliveryService.getDeliveryStats(user.id, new Date().toISOString().split('T')[0]);
        setTodayStats(statsData);
      }
    } catch (error) {
      console.error('Error updating delivery status:', error);
      alert('Failed to update delivery status. Please try again.');
    }
  };

  const handleCallCustomer = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const handleTakePhoto = () => {
    // In a real app, this would open the camera
    alert('Camera functionality would be implemented here');
  };

  const handleSync = async () => {
    if (!user?.id) return;

    setIsSyncing(true);
    try {
      const [ordersData, statsData] = await Promise.all([
        deliveryService.getDeliveryOrders(user.id),
        deliveryService.getDeliveryStats(user.id, new Date().toISOString().split('T')[0])
      ]);

      setOrders(ordersData);
      setTodayStats(statsData);
      alert('Orders synced successfully!');
    } catch (error) {
      console.error('Error syncing data:', error);
      alert('Failed to sync orders. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusColor = (status: DeliveryOrder['status']) => {
    switch (status) {
      case 'assigned': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'picked_up': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_transit': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: DeliveryOrder['status']) => {
    switch (status) {
      case 'assigned': return <Clock className="w-4 h-4" />;
      case 'picked_up': return <Package className="w-4 h-4" />;
      case 'in_transit': return <Truck className="w-4 h-4" />;
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: DeliveryOrder['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const assignedOrders = orders.filter(order => order.status === 'assigned');
  const inProgressOrders = orders.filter(order => ['picked_up', 'in_transit'].includes(order.status));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading delivery orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-cyan-100 to-cyan-200 rounded-xl shadow-sm">
                <Truck className="w-8 h-8 text-cyan-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Delivery Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome, {user?.name}</p>
              </div>
            </div>
            <Button
              onClick={handleSync}
              disabled={isSyncing}
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync'}
            </Button>
          </div>

          {/* Location Status */}
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">GPS Location</p>
                  <p className="text-sm text-gray-600">
                    {currentLocation 
                      ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`
                      : 'Getting location...'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${currentLocation ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {currentLocation ? 'Active' : 'Offline'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Today's Stats */}
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Today's Summary</h2>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{todayStats.totalOrders}</p>
                <p className="text-sm text-gray-600">Total Orders</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{todayStats.completedOrders}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{todayStats.pendingOrders}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Star className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">${todayStats.totalEarnings}</p>
                <p className="text-sm text-gray-600">Earnings</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Assigned Orders */}
      {assignedOrders.length > 0 && (
        <div className="px-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">New Assignments</h2>
          <div className="space-y-3">
            {assignedOrders.map((order) => (
              <Card key={order.id} className="p-4 border-l-4 border-l-blue-500">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">#{order.orderNumber}</h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(order.priority)}`}>
                        {order.priority.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{order.customerName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{order.customerAddress}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{deliveryService.formatTime(order.deliveryTime)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${order.total}</p>
                    {currentLocation && order.coordinates && (
                      <>
                        <p className="text-sm text-gray-600">
                          {deliveryService.calculateDistance(
                            currentLocation.lat, 
                            currentLocation.lng, 
                            order.coordinates.lat, 
                            order.coordinates.lng
                          )} km
                        </p>
                        <p className="text-xs text-gray-500">~{Math.round(deliveryService.calculateDistance(
                          currentLocation.lat, 
                          currentLocation.lng, 
                          order.coordinates.lat, 
                          order.coordinates.lng
                        ) * 2)} min</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleCallCustomer(order.customerPhone)}
                    variant="secondary"
                    size="sm"
                    className="flex items-center gap-2 flex-1"
                  >
                    <Phone className="w-4 h-4" />
                    Call
                  </Button>
                  
                  <Button
                    onClick={() => setSelectedOrder(order)}
                    variant="secondary"
                    size="sm"
                    className="flex items-center gap-2 flex-1"
                  >
                    <Navigation className="w-4 h-4" />
                    Navigate
                  </Button>
                  
                  <Button
                    onClick={() => handleStatusUpdate(order.id, 'picked_up')}
                    size="sm"
                    className="flex items-center gap-2 flex-1"
                  >
                    <Package className="w-4 h-4" />
                    Pick Up
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* In Progress Orders */}
      {inProgressOrders.length > 0 && (
        <div className="px-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">In Progress</h2>
          <div className="space-y-3">
            {inProgressOrders.map((order) => (
              <Card key={order.id} className="p-4 border-l-4 border-l-yellow-500">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">#{order.orderNumber}</h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1 capitalize">{order.status.replace('_', ' ')}</span>
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{order.customerName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{order.customerAddress}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${order.total}</p>
                    {currentLocation && order.coordinates && (
                      <p className="text-sm text-gray-600">
                        {deliveryService.calculateDistance(
                          currentLocation.lat, 
                          currentLocation.lng, 
                          order.coordinates.lat, 
                          order.coordinates.lng
                        )} km
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleCallCustomer(order.customerPhone)}
                    variant="secondary"
                    size="sm"
                    className="flex items-center gap-2 flex-1"
                  >
                    <Phone className="w-4 h-4" />
                    Call
                  </Button>
                  
                  {order.status === 'picked_up' && (
                    <Button
                      onClick={() => handleStatusUpdate(order.id, 'in_transit')}
                      size="sm"
                      className="flex items-center gap-2 flex-1"
                    >
                      <Truck className="w-4 h-4" />
                      Start Delivery
                    </Button>
                  )}
                  
                  {order.status === 'in_transit' && (
                    <Button
                      onClick={() => {
                        handleStatusUpdate(order.id, 'delivered');
                        handleTakePhoto();
                      }}
                      size="sm"
                      className="flex items-center gap-2 flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <Camera className="w-4 h-4" />
                      Deliver
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Navigate to Delivery</h3>
              <div className="space-y-4">
                <div>
                  <p className="font-medium text-gray-900">{selectedOrder.customerName}</p>
                  <p className="text-sm text-gray-600">{selectedOrder.customerAddress}</p>
                  {currentLocation && selectedOrder.coordinates && (
                    <p className="text-sm text-gray-500 mt-1">
                      Distance: {deliveryService.calculateDistance(
                        currentLocation.lat, 
                        currentLocation.lng, 
                        selectedOrder.coordinates.lat, 
                        selectedOrder.coordinates.lng
                      )} km • ETA: ~{Math.round(deliveryService.calculateDistance(
                        currentLocation.lat, 
                        currentLocation.lng, 
                        selectedOrder.coordinates.lat, 
                        selectedOrder.coordinates.lng
                      ) * 2)} min
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      window.open(`https://maps.google.com/?q=${selectedOrder.customerAddress}`, '_blank');
                      setSelectedOrder(null);
                    }}
                    className="flex-1"
                  >
                    Open in Maps
                  </Button>
                  <Button
                    onClick={() => setSelectedOrder(null)}
                    variant="secondary"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DeliveryDashboard;
