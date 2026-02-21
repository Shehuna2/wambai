export type WalletBalance = {
  currency: string;
  available_cents: number;
};

export type UserProfile = {
  full_name: string;
  avatar_url: string;
  default_currency: string;
  created_at: string;
  updated_at: string;
};

export type User = {
  id: number;
  email: string;
  phone?: string | null;
  is_vendor: boolean;
  is_buyer: boolean;
  created_at: string;
  profile: UserProfile;
  wallet_balances: WalletBalance[];
};

export type Shop = {
  id: number;
  owner: number;
  name: string;
  description: string;
  logo_url: string;
  location: string;
  is_active: boolean;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: number;
  shop: number;
  title: string;
  description: string;
  category: string;
  currency: string;
  unit: string;
  price_cents: number;
  stock_qty: string;
  min_order_qty: string;
  qty_step: string;
  image_urls: string[];
  is_active: boolean;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
};

export type CartItem = {
  id: number;
  qty: string;
  product: {
    id: number;
    title: string;
    price_cents: number;
    currency: string;
    qty_step: string;
  };
};

export type CartGroup = {
  shop: {
    id: number;
    name: string;
    location: string;
  };
  items: CartItem[];
};

export type CartResponse = {
  cart: {
    id: number;
    items: Array<{ id: number; product: number; qty: string }>;
  };
  grouped_by_shop: Record<string, CartGroup>;
};

export type Order = {
  id: number;
  status: string;
  payment_method: string;
  total_ngn_cents: number;
  created_at: string;
};

export type VendorOrderItem = {
  id: number;
  product_snapshot: {
    title?: string;
    unit?: string;
    [key: string]: unknown;
  };
  qty: string;
  line_total_ngn_cents: number;
};

export type VendorOrder = {
  id: number;
  order: number;
  shop: number;
  shop_name: string;
  subtotal_ngn_cents: number;
  status: "NEW" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  order_created_at?: string;
  items: VendorOrderItem[];
};
