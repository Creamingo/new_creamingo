import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Plus, Edit, Eye, EyeOff, User as UserIcon, Shield, Calendar, Users as UsersIcon, UserCheck, UserX, Crown, Settings, ChefHat, Truck, GripVertical, Search, Filter, ChevronDown, RefreshCw, ExternalLink, Grid3x3, List, Download, Phone, FileText, Bike } from 'lucide-react';
import { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import { User } from '../types';
import { getRoleDisplayName, getRoleColor } from '../utils/permissions';
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


interface UserFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'super_admin' | 'admin' | 'staff' | 'bakery_production' | 'delivery_boy';
  is_active: boolean;
  // Delivery boy specific fields
  owned_bike?: boolean;
  driving_license_number?: string;
  contact_number?: string;
}

interface UserFormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
  is_active?: string;
  owned_bike?: string;
  driving_license_number?: string;
  contact_number?: string;
}

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

// Sortable User Row Component
const SortableUserRow: React.FC<{
  user: User;
  index: number;
  onEdit: (user: User) => void;
  onToggleStatus: (user: User) => void;
  currentUserId?: string;
}> = ({ user, index, onEdit, onToggleStatus, currentUserId }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: user.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin': return <Crown className="w-3 h-3" />;
      case 'admin': return <Settings className="w-3 h-3" />;
      case 'staff': return <UserIcon className="w-3 h-3" />;
      case 'bakery_production': return <ChefHat className="w-3 h-3" />;
      case 'delivery_boy': return <Truck className="w-3 h-3" />;
      default: return <Shield className="w-3 h-3" />;
    }
  };

  const getRoleAvatarIcon = (role: string) => {
    switch (role) {
      case 'super_admin': return <Crown className="w-4 h-4 text-white flex-shrink-0" />;
      case 'admin': return <Settings className="w-4 h-4 text-white flex-shrink-0" />;
      case 'staff': return <UserIcon className="w-4 h-4 text-white flex-shrink-0" />;
      case 'bakery_production': return <ChefHat className="w-4 h-4 text-white flex-shrink-0" />;
      case 'delivery_boy': return <Truck className="w-4 h-4 text-white flex-shrink-0" />;
      default: return <Shield className="w-4 h-4 text-white flex-shrink-0" />;
    }
  };

  const getRoleAvatarColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-gradient-to-br from-yellow-500 to-amber-600';
      case 'admin': return 'bg-gradient-to-br from-purple-500 to-violet-600';
      case 'staff': return 'bg-gradient-to-br from-blue-500 to-cyan-600';
      case 'bakery_production': return 'bg-gradient-to-br from-green-500 to-teal-600';
      case 'delivery_boy': return 'bg-gradient-to-br from-red-500 to-pink-600';
      default: return 'bg-gradient-to-br from-gray-500 to-slate-600';
    }
  };

  return (
    <tr 
      ref={setNodeRef} 
      style={style} 
      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
    >
      {/* Order Column */}
      <td className="w-16 px-3 py-3 whitespace-nowrap text-center border-r border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-center gap-1">
          <div
            {...attributes}
            {...listeners}
            className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded cursor-grab active:cursor-grabbing touch-none"
          >
            <GripVertical className="w-3 h-3 text-gray-400 dark:text-gray-500" />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
            #{index + 1}
          </span>
        </div>
      </td>
      
      {/* Name Column */}
      <td className="px-4 py-3 whitespace-nowrap border-r border-gray-100 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 min-w-[2.5rem] min-h-[2.5rem] ${getRoleAvatarColor(user.role)} rounded-lg flex items-center justify-center shadow-sm flex-shrink-0`}>
            {getRoleAvatarIcon(user.role)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-gray-900 dark:text-white truncate">{user.name}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</div>
          </div>
        </div>
      </td>
      
      {/* Role Column */}
      <td className="w-32 px-4 py-3 whitespace-nowrap text-center border-r border-gray-100 dark:border-gray-700">
        <div className="flex justify-center">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getRoleColor(user.role)} shadow-sm border`}>
            {getRoleIcon(user.role)}
            <span className="ml-1">{getRoleDisplayName(user.role)}</span>
          </span>
        </div>
      </td>
      
      {/* Status Column */}
      <td className="w-24 px-4 py-3 whitespace-nowrap text-center border-r border-gray-100 dark:border-gray-700">
        <div className="flex justify-center">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold shadow-sm border ${
            user.is_active 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700' 
              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700'
          }`}>
            {user.is_active ? <UserCheck className="w-3 h-3 mr-1" /> : <UserX className="w-3 h-3 mr-1" />}
            {user.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </td>
      
      {/* Last Login Column */}
      <td className="w-36 px-4 py-3 whitespace-nowrap text-center border-r border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
          <Calendar className="w-4 h-4 mr-1" />
          <span className="truncate">
            {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
          </span>
        </div>
      </td>
      
      {/* Actions Column */}
      <td className="w-24 px-4 py-3 whitespace-nowrap text-center">
        <div className="flex items-center justify-center space-x-1">
          <DashboardTooltip text="Edit User">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onEdit(user)}
              className="h-8 w-8 p-0"
            >
              <Edit className="w-4 h-4" />
            </Button>
          </DashboardTooltip>
          <DashboardTooltip text={user.is_active ? 'Deactivate User' : 'Activate User'}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onToggleStatus(user)}
              className={`h-8 w-8 p-0 ${
                user.is_active 
                  ? 'text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300' 
                  : 'text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300'
              }`}
              disabled={user.id === currentUserId}
            >
              {user.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </DashboardTooltip>
        </div>
      </td>
    </tr>
  );
};

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const [showModalRoleDropdown, setShowModalRoleDropdown] = useState(false);
  const modalRoleDropdownRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'staff',
    is_active: true,
    owned_bike: false,
    driving_license_number: '',
    contact_number: ''
  });
  const [errors, setErrors] = useState<UserFormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user: currentUser } = useAuth();

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

  // Fetch users with loading state
  const fetchUsers = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const response = await userService.getUsers();
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Fetch users without loading state (for background updates)
  const fetchUsersSilently = async () => {
    try {
      const response = await userService.getUsers();
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching users silently:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setShowRoleDropdown(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
      if (modalRoleDropdownRef.current && !modalRoleDropdownRef.current.contains(event.target as Node)) {
        setShowModalRoleDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && user.is_active) ||
        (statusFilter === 'inactive' && !user.is_active);
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: UserFormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!editingUser && !formData.password.trim()) {
      newErrors.password = 'Password is required';
    }

    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Delivery boy specific validation
    if (formData.role === 'delivery_boy') {
      if (formData.owned_bike === undefined || formData.owned_bike === null) {
        newErrors.owned_bike = 'Please specify if the delivery boy owns a bike';
      }
      if (!formData.driving_license_number || !formData.driving_license_number.trim()) {
        newErrors.driving_license_number = 'Driving license number is required';
      }
      if (!formData.contact_number || !formData.contact_number.trim()) {
        newErrors.contact_number = 'Contact number is required';
      } else if (!/^\d{10}$/.test(formData.contact_number.replace(/\D/g, ''))) {
        newErrors.contact_number = 'Contact number must be exactly 10 digits';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        is_active: Boolean(formData.is_active)
      };

      // Only include password if it's provided
      if (formData.password) {
        payload.password = formData.password;
      }

      // Include delivery boy specific fields
      if (formData.role === 'delivery_boy') {
        payload.owned_bike = Boolean(formData.owned_bike);
        payload.driving_license_number = formData.driving_license_number?.trim() || '';
        // Ensure contact number is exactly 10 digits
        payload.contact_number = formData.contact_number?.replace(/\D/g, '').slice(0, 10) || '';
      }

      if (editingUser) {
        const updatedUser = await userService.updateUser(editingUser.id, payload);
        // Update local state immediately
        setUsers(prevUsers => 
          prevUsers.map(u => u.id === editingUser.id ? updatedUser.data : u)
        );
      } else {
        const newUser = await userService.createUser(payload);
        // Add new user to local state
        setUsers(prevUsers => [newUser.data, ...prevUsers]);
      }

      setIsModalOpen(false);
      setEditingUser(null);
      resetForm();
    } catch (error) {
      console.error('Error saving user:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'staff',
      is_active: true,
      owned_bike: false,
      driving_license_number: '',
      contact_number: ''
    });
    setErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowModalRoleDropdown(false);
  };

  // Open modal for adding user
  const handleAddUser = () => {
    setEditingUser(null);
    resetForm();
    setIsModalOpen(true);
  };

  // Open modal for editing user
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    const userWithDeliveryFields = user as any;
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      confirmPassword: '',
      role: user.role,
      is_active: user.is_active,
      owned_bike: userWithDeliveryFields.owned_bike ?? false,
      driving_license_number: userWithDeliveryFields.driving_license_number || '',
      contact_number: userWithDeliveryFields.contact_number || ''
    });
    setErrors({});
    setShowModalRoleDropdown(false);
    setIsModalOpen(true);
  };

  // Toggle user active status
  const handleToggleStatus = async (user: User) => {
    try {
      await userService.toggleUserStatus(user.id, !user.is_active);
      // Update local state immediately for better UX
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === user.id ? { ...u, is_active: !u.is_active } : u
        )
      );
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  // Handle drag end for reordering (respects role hierarchy)
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    
    console.log('Drag end event:', { activeId: active.id, overId: over?.id });

    if (over && active.id !== over.id) {
      const oldIndex = users.findIndex((item) => item.id === active.id);
      const newIndex = users.findIndex((item) => item.id === over.id);

      console.log('Drag indices:', { oldIndex, newIndex });

      if (oldIndex !== -1 && newIndex !== -1) {
        const draggedUser = users[oldIndex];
        const targetUser = users[newIndex];

        // Check if dragging within the same role group
        if (draggedUser.role !== targetUser.role) {
          console.log('Cannot drag across different role groups');
          return; // Prevent cross-role dragging
        }

        // Update local state immediately for better UX
        const newUsers = arrayMove(users, oldIndex, newIndex);
        setUsers(newUsers);

        try {
          // Update order on server (backend will maintain role hierarchy)
          const result = await userService.updateUserOrder([]);
          console.log('Server response:', result);
          
          // Silently refresh users to get the correct order from server (no loading state)
          fetchUsersSilently();
          
        } catch (error) {
          console.error('Error updating user order:', error);
          // Revert local state on error
          setUsers(users);
        }
      }
    }
  }, [users]);


  // Calculate stats
  const userStats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter(u => u.is_active).length,
      inactive: users.filter(u => !u.is_active).length,
      superAdmin: users.filter(u => u.role === 'super_admin').length,
      admin: users.filter(u => u.role === 'admin').length,
      staff: users.filter(u => u.role === 'staff').length,
      bakeryProduction: users.filter(u => u.role === 'bakery_production').length,
      deliveryBoy: users.filter(u => u.role === 'delivery_boy').length
    };
  }, [users]);

  const getRoleFilterLabel = () => {
    const labels: { [key: string]: string } = {
      all: 'All Roles',
      super_admin: 'Super Admin',
      admin: 'Admin',
      staff: 'Staff',
      bakery_production: 'Bakery Production',
      delivery_boy: 'Delivery Boy'
    };
    return labels[roleFilter] || 'All Roles';
  };

  const getStatusFilterLabel = () => {
    const labels: { [key: string]: string } = {
      all: 'All Status',
      active: 'Active',
      inactive: 'Inactive'
    };
    return labels[statusFilter] || 'All Status';
  };

  // Export to CSV
  const handleExport = () => {
    const headers = ['Name', 'Email', 'Role', 'Status', 'Last Login'];
    const rows = filteredUsers.map(user => [
      user.name,
      user.email,
      getRoleDisplayName(user.role),
      user.is_active ? 'Active' : 'Inactive',
      user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="w-full px-3 sm:px-4 lg:px-6">
          <div className="py-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  Manage admin users, roles, and permissions
                </p>
              </div>
              <Button 
                onClick={handleAddUser} 
                className="group relative overflow-hidden bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 hover:from-pink-700 hover:via-rose-700 hover:to-pink-700 text-white font-semibold px-4 sm:px-6 py-2.5 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-pink-500/30 hover:border-pink-400/50 flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <UsersIcon className="w-4 h-4 relative z-10" />
                <Plus className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Add New User</span>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-7">
              <Card>
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none mt-0.5">
                        {userStats.total}
                      </p>
                    </div>
                    <UsersIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Active Users</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400 leading-none mt-0.5">
                        {userStats.active}
                      </p>
                    </div>
                    <UserCheck className="w-4 h-4 text-green-400 dark:text-green-500 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Inactive Users</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400 leading-none mt-0.5">
                        {userStats.inactive}
                      </p>
                    </div>
                    <UserX className="w-4 h-4 text-red-400 dark:text-red-500 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Super Admin</p>
                      <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 leading-none mt-0.5">
                        {userStats.superAdmin}
                      </p>
                    </div>
                    <Crown className="w-4 h-4 text-yellow-400 dark:text-yellow-500 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Admin</p>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 leading-none mt-0.5">
                        {userStats.admin}
                      </p>
                    </div>
                    <Settings className="w-4 h-4 text-purple-400 dark:text-purple-500 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Staff</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 leading-none mt-0.5">
                        {userStats.staff}
                      </p>
                    </div>
                    <UserIcon className="w-4 h-4 text-blue-400 dark:text-blue-500 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-none">Production</p>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 leading-none mt-0.5">
                        {userStats.bakeryProduction + userStats.deliveryBoy}
                      </p>
                    </div>
                    <ChefHat className="w-4 h-4 text-orange-400 dark:text-orange-500 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full px-3 sm:px-4 lg:px-6 py-4">

        {/* Enhanced Filters and Quick Actions */}
        <Card className="mb-4 overflow-visible border border-primary-100/50 dark:border-primary-800/30 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Filters & Actions
              </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <DashboardTooltip text="Refresh Data">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchUsers()}
                  className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </DashboardTooltip>
              <DashboardTooltip text="View Website">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open('/', '_blank')}
                  className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </DashboardTooltip>
              <DashboardTooltip text="Export CSV">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExport}
                  className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </DashboardTooltip>
              <DashboardTooltip text={viewMode === 'table' ? 'Switch to Grid View' : 'Switch to Table View'}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
                  className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                >
                  {viewMode === 'table' ? <Grid3x3 className="h-4 w-4" /> : <List className="h-4 w-4" />}
                </Button>
              </DashboardTooltip>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 md:p-6 overflow-visible">
          <div className="flex flex-col sm:flex-row gap-4 overflow-visible">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 dark:border-gray-600 focus:border-primary-500 dark:focus:border-primary-400"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div className="relative" ref={roleDropdownRef}>
              <DashboardTooltip text="Filter by Role">
                <button
                  onClick={() => {
                    setShowRoleDropdown(!showRoleDropdown);
                    setShowStatusDropdown(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors min-w-[160px] justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    {getRoleFilterLabel()}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-gray-400 dark:text-gray-500 transition-transform ${showRoleDropdown ? 'rotate-180' : ''}`} />
                </button>
              </DashboardTooltip>
              {showRoleDropdown && (
                <div className="absolute z-[100] mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl">
                  {['all', 'super_admin', 'admin', 'staff', 'bakery_production', 'delivery_boy'].map((role) => (
                    <button
                      key={role}
                      onClick={() => {
                        setRoleFilter(role);
                        setShowRoleDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg ${
                        roleFilter === role ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {getRoleFilterLabel() === role.charAt(0).toUpperCase() + role.slice(1) ? '✓ ' : ''}
                      {role === 'all' ? 'All Roles' : getRoleDisplayName(role as any)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Status Filter */}
            <div className="relative" ref={statusDropdownRef}>
              <DashboardTooltip text="Filter by Status">
                <button
                  onClick={() => {
                    setShowStatusDropdown(!showStatusDropdown);
                    setShowRoleDropdown(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors min-w-[140px] justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    {getStatusFilterLabel()}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-gray-400 dark:text-gray-500 transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} />
                </button>
              </DashboardTooltip>
              {showStatusDropdown && (
                <div className="absolute z-[100] mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl">
                  {['all', 'active', 'inactive'].map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setStatusFilter(status);
                        setShowStatusDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg ${
                        statusFilter === status ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {getStatusFilterLabel() === status.charAt(0).toUpperCase() + status.slice(1) ? '✓ ' : ''}
                      {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

        {/* Users Table */}
        <Card className="overflow-hidden border border-primary-100/50 dark:border-primary-800/30 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              All Users ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
        <CardContent className="p-0">
          {viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
                    <tr>
                      <th className="w-16 px-3 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700">
                        Order
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700">
                        Name
                      </th>
                      <th className="w-32 px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700">
                        Role
                      </th>
                      <th className="w-24 px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700">
                        Status
                      </th>
                      <th className="w-36 px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700">
                        Last Login
                      </th>
                      <th className="w-24 px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 text-sm font-medium text-gray-900 dark:text-white">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                          Loading...
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      <SortableContext items={filteredUsers.map(u => u.id)} strategy={verticalListSortingStrategy}>
                        {filteredUsers.map((user, index) => (
                          <SortableUserRow
                            key={user.id}
                            user={user}
                            index={index}
                            onEdit={handleEditUser}
                            onToggleStatus={handleToggleStatus}
                            currentUserId={currentUser?.id}
                          />
                        ))}
                      </SortableContext>
                    )}
                  </tbody>
                </table>
              </DndContext>
            </div>
          ) : (
            <div className="p-4 sm:p-5 md:p-6">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <UsersIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No users found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredUsers.map((user) => {
                    const getRoleAvatarColor = (role: string) => {
                      switch (role) {
                        case 'super_admin': return 'bg-gradient-to-br from-yellow-500 to-amber-600';
                        case 'admin': return 'bg-gradient-to-br from-purple-500 to-violet-600';
                        case 'staff': return 'bg-gradient-to-br from-blue-500 to-cyan-600';
                        case 'bakery_production': return 'bg-gradient-to-br from-green-500 to-teal-600';
                        case 'delivery_boy': return 'bg-gradient-to-br from-red-500 to-pink-600';
                        default: return 'bg-gradient-to-br from-gray-500 to-slate-600';
                      }
                    };
                    const getRoleAvatarIcon = (role: string) => {
                      switch (role) {
                        case 'super_admin': return <Crown className="w-4 h-4 text-white flex-shrink-0" />;
                        case 'admin': return <Settings className="w-4 h-4 text-white flex-shrink-0" />;
                        case 'staff': return <UserIcon className="w-4 h-4 text-white flex-shrink-0" />;
                        case 'bakery_production': return <ChefHat className="w-4 h-4 text-white flex-shrink-0" />;
                        case 'delivery_boy': return <Truck className="w-4 h-4 text-white flex-shrink-0" />;
                        default: return <Shield className="w-4 h-4 text-white flex-shrink-0" />;
                      }
                    };
                    return (
                      <Card key={user.id} className="hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 ${getRoleAvatarColor(user.role)} rounded-lg flex items-center justify-center shadow-sm flex-shrink-0`}>
                                  {getRoleAvatarIcon(user.role)}
                                </div>
                                <div>
                                  <div className="font-bold text-sm text-gray-900 dark:text-white">{user.name}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{user.email}</div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getRoleColor(user.role)} shadow-sm border`}>
                                {getRoleDisplayName(user.role)}
                              </span>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold shadow-sm border ${
                                user.is_active 
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700' 
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700'
                              }`}>
                                {user.is_active ? <UserCheck className="w-3 h-3 mr-1" /> : <UserX className="w-3 h-3 mr-1" />}
                                {user.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                              {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never logged in'}
                            </div>
                            <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditUser(user)}
                                className="flex-1"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleStatus(user)}
                                disabled={user.id === currentUser?.id}
                                className={`flex-1 ${
                                  user.is_active 
                                    ? 'text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300' 
                                    : 'text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300'
                                }`}
                              >
                                {user.is_active ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                                {user.is_active ? 'Deactivate' : 'Activate'}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </CardContent>
        </Card>
      </div>

      {/* Add/Edit User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingUser(null);
          resetForm();
        }}
        title={editingUser ? 'Edit User' : 'Add New User'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Role Selection - First Section */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                <Shield className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white">
                  Select Role *
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Choose the user's role to determine their access level
                </p>
              </div>
            </div>
            <div className="relative" ref={modalRoleDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setShowModalRoleDropdown(!showModalRoleDropdown);
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-sm font-semibold text-gray-900 dark:text-white hover:border-primary-500 dark:hover:border-primary-400 hover:shadow-md transition-all duration-200 justify-between group"
              >
                <span className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${
                    formData.role === 'super_admin' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                    formData.role === 'admin' ? 'bg-purple-100 dark:bg-purple-900/30' :
                    formData.role === 'staff' ? 'bg-blue-100 dark:bg-blue-900/30' :
                    formData.role === 'bakery_production' ? 'bg-green-100 dark:bg-green-900/30' :
                    'bg-red-100 dark:bg-red-900/30'
                  }`}>
                    {formData.role === 'super_admin' && <Crown className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />}
                    {formData.role === 'admin' && <Settings className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
                    {formData.role === 'staff' && <UserIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                    {formData.role === 'bakery_production' && <ChefHat className="h-4 w-4 text-green-600 dark:text-green-400" />}
                    {formData.role === 'delivery_boy' && <Truck className="h-4 w-4 text-red-600 dark:text-red-400" />}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-sm dark:text-white">{getRoleDisplayName(formData.role)}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {formData.role === 'super_admin' ? 'Full system access' :
                       formData.role === 'admin' ? 'Management access with limited permissions' :
                       formData.role === 'staff' ? 'General access to orders and products' :
                       formData.role === 'bakery_production' ? 'Production-focused access' :
                       'Mobile delivery interface'}
                    </div>
                  </div>
                </span>
                <ChevronDown className={`h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-all duration-200 ${showModalRoleDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showModalRoleDropdown && (
                <div className="absolute z-[100] mt-3 w-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden">
                  {[
                    { value: 'staff', label: 'Staff', icon: UserIcon, desc: 'General access to orders and products', color: 'blue' },
                    { value: 'admin', label: 'Admin', icon: Settings, desc: 'Management access with limited permissions', color: 'purple' },
                    { value: 'super_admin', label: 'Super Admin', icon: Crown, desc: 'Full system access', color: 'yellow' },
                    { value: 'bakery_production', label: 'Bakery Production', icon: ChefHat, desc: 'Production-focused access', color: 'green' },
                    { value: 'delivery_boy', label: 'Delivery Boy', icon: Truck, desc: 'Mobile delivery interface', color: 'red' }
                  ].map((roleOption) => {
                    const IconComponent = roleOption.icon;
                    const isSelected = formData.role === roleOption.value;
                    return (
                      <button
                        key={roleOption.value}
                        type="button"
                        onClick={() => {
                          setFormData({ 
                            ...formData, 
                            role: roleOption.value as 'super_admin' | 'admin' | 'staff' | 'bakery_production' | 'delivery_boy',
                            // Reset delivery boy fields when changing role
                            owned_bike: roleOption.value === 'delivery_boy' ? formData.owned_bike : false,
                            driving_license_number: roleOption.value === 'delivery_boy' ? formData.driving_license_number : '',
                            contact_number: roleOption.value === 'delivery_boy' ? formData.contact_number : ''
                          });
                          setShowModalRoleDropdown(false);
                        }}
                        className={`w-full text-left px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                          isSelected 
                            ? roleOption.color === 'yellow' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-l-yellow-500 dark:border-l-yellow-400' :
                              roleOption.color === 'purple' ? 'bg-purple-50 dark:bg-purple-900/20 border-l-4 border-l-purple-500 dark:border-l-purple-400' :
                              roleOption.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500 dark:border-l-blue-400' :
                              roleOption.color === 'green' ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-l-green-500 dark:border-l-green-400' :
                              'bg-red-50 dark:bg-red-900/20 border-l-4 border-l-red-500 dark:border-l-red-400'
                            : ''
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2.5 rounded-lg ${
                            roleOption.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                            roleOption.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/30' :
                            roleOption.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30' :
                            roleOption.color === 'green' ? 'bg-green-100 dark:bg-green-900/30' :
                            'bg-red-100 dark:bg-red-900/30'
                          }`}>
                            <IconComponent className={`h-5 w-5 ${
                              roleOption.color === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' :
                              roleOption.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                              roleOption.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                              roleOption.color === 'green' ? 'text-green-600 dark:text-green-400' :
                              'text-red-600 dark:text-red-400'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <div className={`font-semibold ${isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'}`}>
                              {roleOption.label}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{roleOption.desc}</div>
                          </div>
                          {isSelected && (
                            <div className="p-1.5 bg-primary-600 dark:bg-primary-500 rounded-full">
                              <span className="text-white text-xs font-bold">✓</span>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Basic Information Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <UserIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Basic Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  Full Name *
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter full name"
                  error={errors.name}
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                  Email Address *
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address"
                  error={errors.email}
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Password {!editingUser && '*'}
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? 'Leave blank to keep current password' : 'Enter password'}
                    error={errors.password}
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:opacity-70 transition-opacity"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Confirm Password {formData.password && '*'}
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Confirm password"
                    error={errors.confirmPassword}
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:opacity-70 transition-opacity"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Status Section */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <UserCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <label className="block text-base font-bold text-gray-900 dark:text-white">
                  Account Status
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Set whether the user account is active or inactive
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center cursor-pointer group">
                <input
                  type="radio"
                  name="status"
                  checked={formData.is_active}
                  onChange={() => setFormData({ ...formData, is_active: true })}
                  className="h-5 w-5 text-green-600 dark:text-green-400 focus:ring-green-500 dark:focus:ring-green-400 border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <span className="ml-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                  <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <UserCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  Active
                </span>
              </label>
              <label className="flex items-center cursor-pointer group">
                <input
                  type="radio"
                  name="status"
                  checked={!formData.is_active}
                  onChange={() => setFormData({ ...formData, is_active: false })}
                  className="h-5 w-5 text-red-600 dark:text-red-400 focus:ring-red-500 dark:focus:ring-red-400 border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <span className="ml-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                  <div className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <UserX className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </div>
                  Inactive
                </span>
              </label>
            </div>
          </div>

          {/* Delivery Boy Specific Fields */}
          {formData.role === 'delivery_boy' && (
            <div className="bg-gradient-to-br from-red-50 via-orange-50 to-red-50 dark:from-red-900/20 dark:via-orange-900/20 dark:to-red-900/20 rounded-xl p-6 border-2 border-red-200 dark:border-red-800 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl shadow-md">
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Delivery Boy Information</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Additional details required for delivery operations</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Owned Bike */}
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <Bike className="w-5 h-5 text-red-600 dark:text-red-400" />
                    Owned Bike *
                  </label>
                  <div className="flex items-center gap-6 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <label className="flex items-center cursor-pointer group flex-1">
                      <input
                        type="radio"
                        name="owned_bike"
                        checked={formData.owned_bike === true}
                        onChange={() => setFormData({ ...formData, owned_bike: true })}
                        className="h-5 w-5 text-green-600 dark:text-green-400 focus:ring-green-500 dark:focus:ring-green-400 border-gray-300 dark:border-gray-600 cursor-pointer"
                      />
                      <span className="ml-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                        <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                        </div>
                        Yes
                      </span>
                    </label>
                    <label className="flex items-center cursor-pointer group flex-1">
                      <input
                        type="radio"
                        name="owned_bike"
                        checked={formData.owned_bike === false}
                        onChange={() => setFormData({ ...formData, owned_bike: false })}
                        className="h-5 w-5 text-red-600 dark:text-red-400 focus:ring-red-500 dark:focus:ring-red-400 border-gray-300 dark:border-gray-600 cursor-pointer"
                      />
                      <span className="ml-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                        <div className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded-lg">
                          <span className="text-red-600 dark:text-red-400 font-bold">✗</span>
                        </div>
                        No
                      </span>
                    </label>
                  </div>
                  {errors.owned_bike && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                      <span>⚠</span> {errors.owned_bike}
                    </p>
                  )}
                </div>

                {/* Driving License Number */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-red-600 dark:text-red-400" />
                    Driving License Number *
                  </label>
                  <Input
                    type="text"
                    value={formData.driving_license_number || ''}
                    onChange={(e) => setFormData({ ...formData, driving_license_number: e.target.value })}
                    placeholder="Enter driving license number"
                    error={errors.driving_license_number}
                    className="transition-all duration-200 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                {/* Contact Number */}
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-red-600 dark:text-red-400" />
                    Contact Number *
                    <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-2 bg-white dark:bg-gray-800 px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700 dark:text-gray-300">
                      📱 Visible to customers when order is picked up
                    </span>
                  </label>
                  <Input
                    type="tel"
                    value={formData.contact_number || ''}
                    onChange={(e) => {
                      // Only allow digits and limit to 10 digits
                      const digitsOnly = e.target.value.replace(/\D/g, '');
                      const limitedValue = digitsOnly.slice(0, 10);
                      setFormData({ ...formData, contact_number: limitedValue });
                    }}
                    placeholder="Enter 10-digit contact number (e.g., 9876543210)"
                    error={errors.contact_number}
                    maxLength={10}
                    className="transition-all duration-200 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                  {formData.contact_number && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formData.contact_number.length}/10 digits
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                setEditingUser(null);
                resetForm();
              }}
              className="px-8 py-3 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  {editingUser ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  <span>{editingUser ? 'Update User' : 'Create User'}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Users;


