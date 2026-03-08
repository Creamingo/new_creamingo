export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'super_admin' | 'admin' | 'staff' | 'bakery_production' | 'delivery_boy';
  is_active: boolean;
  last_login?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
  // Delivery boy specific fields
  owned_bike?: boolean;
  driving_license_number?: string;
  contact_number?: string;
}

export interface Product {
  id: string | number;
  name: string;
  description: string;
  base_price: number;
  base_weight: string;
  discount_percent: number;
  discounted_price: number;
  category_id: number; // Legacy field for backward compatibility
  subcategory_id?: number; // Legacy field for backward compatibility
  category_name?: string; // Legacy field for backward compatibility
  subcategory_name?: string; // Legacy field for backward compatibility
  // New multi-category fields
  categories?: ProductCategory[];
  subcategories?: ProductSubcategory[];
  flavors?: ProductSubcategory[];
  primary_category_id?: number;
  primary_subcategory_id?: number;
  // Flavor selection fields
  available_flavor_ids?: number[];
  primary_flavor_id?: number;
  image_url: string;
  image?: string; // For backward compatibility
  stock?: number;
  is_active: boolean;
  is_featured: boolean;
  is_top_product: boolean;
  is_bestseller: boolean;
  is_eggless?: boolean;
  is_new_launch?: boolean;
  is_trending?: boolean;
  short_description?: string;
  shape?: string;
  country_of_origin?: string;
  preparation_time?: number;
  preparation_time_hours?: number;
  serving_size?: string;
  serving_size_description?: string;
  care_storage?: string;
  delivery_guidelines?: string;
  rating?: number;
  review_count?: number;
  meta_title?: string;
  meta_description?: string;
  tags?: string;
  variants?: ProductVariant[];
  gallery_images?: string[];
  created_at: string;
  updated_at: string;
  createdAt?: string; // For backward compatibility
  updatedAt?: string; // For backward compatibility
  // Legacy fields for backward compatibility
  category?: string;
  subcategory?: string;
  status?: 'active' | 'inactive';
  isTopProduct?: boolean;
  isBestseller?: boolean;
}

export interface ProductCategory {
  id: number;
  name: string;
  description?: string;
  image_url: string;
  is_primary: boolean;
  display_order: number;
}

export interface ProductSubcategory {
  id: number;
  name: string;
  description?: string;
  image_url: string;
  category_id: number;
  is_primary: boolean;
  display_order: number;
}

export interface ProductVariant {
  id: string | number;
  product_id?: number;
  name: string;
  weight: string;
  price: number;
  discount_percent: number;
  discounted_price: number;
  stock_quantity: number;
  stock?: number; // For backward compatibility
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string | number;
  name: string;
  description?: string;
  image_url: string;
  display_name?: string | null; // Added display name field
  image?: string; // For backward compatibility
  is_active: boolean;
  status?: 'active' | 'inactive'; // For backward compatibility
  subcategories?: Subcategory[];
  order_index?: number; // For category ordering
  created_at: string;
  updated_at: string;
  createdAt?: string; // For backward compatibility
}

export interface Subcategory {
  id: string | number;
  name: string;
  description?: string;
  image_url: string;
  image?: string; // For backward compatibility
  is_active: boolean;
  status?: 'active' | 'inactive'; // For backward compatibility
  category_id: number;
  categoryId?: string | number; // For backward compatibility
  is_primary?: boolean; // For flavor selection
  order_index?: number; // For subcategory ordering
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  deliveryAddress: string;
  deliveryDate: string;
  deliveryTime: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  weight?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  createdAt: string;
  // Optional structured address from backend (JSON)
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
    landmark?: string | null;
    location?: {
      lat?: number;
      lng?: number;
      accuracy?: number | null;
      source?: string | null;
    } | null;
  };
}

export interface Banner {
  id: number;
  title: string;
  subtitle: string;
  button_text: string;
  button_url: string;
  image_url: string;
  image_url_mobile?: string | null;
  is_active: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  type: 'kids' | 'trending' | 'seasonal' | 'custom';
  products: string[];
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  method: 'card' | 'cash' | 'upi' | 'wallet';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalOrders: number;
  totalSales: number;
  totalCustomers: number;
  totalProducts: number;
  ordersToday: number;
  salesToday: number;
  newCustomersToday: number;
  lowStockProducts: number;
}

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  render?: (value: any, item: any) => React.ReactNode;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

// Re-export add-on types
export * from './addOn';
