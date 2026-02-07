// Role-based access control middleware

// Check if user has required role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

// Check if user is super admin
const requireSuperAdmin = requireRole('super_admin');

// Check if user is admin, staff, or super admin
const requireStaff = requireRole(['admin', 'staff', 'super_admin']);

// Check if user can manage banners (super admin only)
const canManageBanners = requireRole('super_admin');

// Check if user can manage categories (super admin and admin)
const canManageCategories = requireRole(['super_admin', 'admin']);

// Check if user can manage settings (admin and super admin only)
const canManageSettings = requireRole(['admin', 'super_admin']);

// Check if user can manage users (super admin only)
const canManageUsers = requireRole('super_admin');

// Check if user can view orders (admin, staff, super admin, bakery production, and delivery boy)
const canViewOrders = requireRole(['admin', 'staff', 'super_admin', 'bakery_production', 'delivery_boy']);

// Check if user can manage orders (admin, staff, super admin, bakery production, and delivery boy)
const canManageOrders = requireRole(['admin', 'staff', 'super_admin', 'bakery_production', 'delivery_boy']);

// Check if user can view customers (admin, staff and super admin)
const canViewCustomers = requireRole(['admin', 'staff', 'super_admin']);

// Check if user can manage customers (admin, staff and super admin)
const canManageCustomers = requireRole(['admin', 'staff', 'super_admin']);

// Check if user can manage products (admin, staff, super admin, and bakery production)
const canManageProducts = requireRole(['admin', 'staff', 'super_admin', 'bakery_production']);

// Check if user can view payments (admin, staff and super admin)
const canViewPayments = requireRole(['admin', 'staff', 'super_admin']);

module.exports = {
  requireRole,
  requireSuperAdmin,
  requireStaff,
  canManageBanners,
  canManageCategories,
  canManageSettings,
  canManageUsers,
  canViewOrders,
  canManageOrders,
  canViewCustomers,
  canManageCustomers,
  canManageProducts,
  canViewPayments
};
