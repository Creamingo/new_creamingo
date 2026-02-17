import { User } from '../types/auth';

// Define permissions for each role
export const ROLE_PERMISSIONS = {
  super_admin: [
    'dashboard.view',
    'banners.view',
    'banners.create',
    'banners.edit',
    'banners.delete',
    'categories.view',
    'categories.create',
    'categories.edit',
    'categories.delete',
    'subcategories.view',
    'subcategories.create',
    'subcategories.edit',
    'subcategories.delete',
    'featured-products.view',
    'featured-products.create',
    'featured-products.edit',
    'featured-products.delete',
    'products.view',
    'products.create',
    'products.edit',
    'products.delete',
    'collections.view',
    'collections.create',
    'collections.edit',
    'collections.delete',
    'orders.view',
    'orders.edit',
    'orders.delete',
    'bakery-production.view',
    'customers.view',
    'customers.edit',
    'customers.delete',
    'payments.view',
    'payments.edit',
    'payments.delete',
    'settings.view',
    'settings.edit',
    'users.view',
    'users.create',
    'users.edit',
    'users.delete'
  ],
  admin: [
    'dashboard.view',
    'banners.view',
    'banners.create',
    'banners.edit',
    'categories.view',
    'categories.create',
    'categories.edit',
    'subcategories.view',
    'subcategories.create',
    'subcategories.edit',
    'featured-products.view',
    'featured-products.create',
    'featured-products.edit',
    'products.view',
    'products.create',
    'products.edit',
    'collections.view',
    'collections.create',
    'collections.edit',
    'orders.view',
    'orders.edit',
    'bakery-production.view',
    'customers.view',
    'customers.edit',
    'payments.view',
    'payments.edit',
    'settings.view',
    'settings.edit'
  ],
  staff: [
    'dashboard.view',
    'products.view',
    'products.create',
    'products.edit',
    'orders.view',
    'orders.edit',
    'customers.view',
    'customers.edit'
  ],
  bakery_production: [
    'dashboard.view',
    'products.view',
    'products.edit',
    'orders.view',
    'orders.edit',
    'bakery-production.view'
  ],
  delivery_boy: [
    'dashboard.view',
    'orders.view',
    'orders.edit'
  ]
};

// Define route permissions
export const ROUTE_PERMISSIONS = {
  '/': ['dashboard.view'],
  '/banners': ['banners.view'],
  '/categories': ['categories.view'],
  '/subcategories': ['subcategories.view'],
  '/featured-products': ['featured-products.view'],
  '/products': ['products.view'],
  '/collections': ['collections.view'],
  '/orders': ['orders.view'],
  '/bakery-production': ['bakery-production.view', 'orders.view', 'orders.edit'],
  '/customers': ['customers.view'],
  '/payments': ['payments.view'],
  '/settings': ['settings.view'],
  '/users': ['users.view'],
  '/chatbot-answers': ['settings.view'],
  '/chat-analytics': ['settings.view']
};

// Define sidebar menu permissions
export const MENU_PERMISSIONS = {
  dashboard: ['dashboard.view'],
  banners: ['banners.view'],
  categories: ['categories.view'],
  subcategories: ['subcategories.view'],
  'featured-products': ['featured-products.view'],
  products: ['products.view'],
  collections: ['collections.view'],
  orders: ['orders.view'],
  'bakery-production': ['bakery-production.view', 'orders.view', 'orders.edit'],
  delivery: ['orders.view'],
  customers: ['customers.view'],
  payments: ['payments.view'],
  settings: ['settings.view'],
  users: ['users.view'],
  'chatbot-answers': ['settings.view'],
  'chat-analytics': ['settings.view'],
  chatbotanswers: ['settings.view'],
  chatanalytics: ['settings.view']
};

/**
 * Check if user has a specific permission
 */
export const hasPermission = (user: User | null, permission: string): boolean => {
  if (!user) return false;
  
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  return userPermissions.includes(permission);
};

/**
 * Check if user has any of the specified permissions
 */
export const hasAnyPermission = (user: User | null, permissions: string[]): boolean => {
  if (!user) return false;
  
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  return permissions.some(permission => userPermissions.includes(permission));
};

/**
 * Check if user has all of the specified permissions
 */
export const hasAllPermissions = (user: User | null, permissions: string[]): boolean => {
  if (!user) return false;
  
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  return permissions.every(permission => userPermissions.includes(permission));
};

/**
 * Check if user can access a specific route
 */
export const canAccessRoute = (user: User | null, route: string): boolean => {
  if (!user) return false;
  
  const requiredPermissions = ROUTE_PERMISSIONS[route as keyof typeof ROUTE_PERMISSIONS];
  if (!requiredPermissions) return true; // Route doesn't require specific permissions
  
  return hasAnyPermission(user, requiredPermissions);
};

/**
 * Check if user can see a menu item
 */
export const canSeeMenuItem = (user: User | null, menuKey: string): boolean => {
  if (!user) return false;
  
  const requiredPermissions = MENU_PERMISSIONS[menuKey as keyof typeof MENU_PERMISSIONS];
  if (!requiredPermissions) return true; // Menu item doesn't require specific permissions
  
  return hasAnyPermission(user, requiredPermissions);
};

/**
 * Get user's role display name
 */
export const getRoleDisplayName = (role: string): string => {
  const roleNames = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    staff: 'Staff',
    bakery_production: 'Bakery Production',
    delivery_boy: 'Delivery Boy'
  };
  
  return roleNames[role as keyof typeof roleNames] || role;
};

/**
 * Get user's role color for badges
 */
export const getRoleColor = (role: string): string => {
  const roleColors = {
    super_admin: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700',
    admin: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700',
    staff: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700',
    bakery_production: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-700',
    delivery_boy: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700'
  };
  
  return roleColors[role as keyof typeof roleColors] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-600';
};
