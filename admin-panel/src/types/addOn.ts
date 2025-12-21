export interface AddOnCategory {
  id: number;
  name: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AddOnProduct {
  id: number;
  category_id: number;
  name: string;
  description?: string;
  price: number;
  discount_percentage?: number;
  discounted_price?: number;
  image_url?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  category_name?: string;
}

export interface ComboSelection {
  id: number;
  cart_item_id?: number;
  add_on_product_id: number;
  quantity: number;
  created_at: string;
  product_name?: string;
  price?: number;
  image_url?: string;
  category_name?: string;
  total_price?: number;
}

export interface CreateAddOnCategoryData {
  name: string;
  display_order?: number;
}

export interface UpdateAddOnCategoryData {
  name?: string;
  display_order?: number;
  is_active?: boolean;
}

export interface CreateAddOnProductData {
  category_id: number;
  name: string;
  description?: string;
  price: number;
  discount_percentage?: number;
  discounted_price?: number;
  image_url?: string;
  display_order?: number;
}

export interface UpdateAddOnProductData {
  category_id?: number;
  name?: string;
  description?: string;
  price?: number;
  discount_percentage?: number;
  discounted_price?: number;
  image_url?: string;
  display_order?: number;
  is_active?: boolean;
}

export interface ComboSummary {
  selections: ComboSelection[];
  totalPrice: number;
  itemCount: number;
}
