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
  phone: string;
  is_vendor: boolean;
  is_buyer: boolean;
  created_at: string;
  profile: UserProfile;
  wallet_balances: WalletBalance[];
};

export type Shop = {
  id: number;
  name: string;
  description: string;
  location: string;
  is_active: boolean;
  is_approved: boolean;
};

export type Product = {
  id: number;
  shop: number;
  category: string;
  title: string;
  description: string;
  unit: string;
  price_cents: number;
  currency: string;
  stock_qty: string;
  min_order_qty: string;
  qty_step: string;
  is_active: boolean;
  is_approved: boolean;
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

export type CartResponse = {
  cart: {
    id: number;
    items: { id: number; product: number; qty: string }[];
  };
  grouped_by_shop: Record<string, { shop: { id: number; name: string; location: string }; items: CartItem[] }>;
};

export type Order = {
  id: number;
  buyer: number;
  total_ngn_cents: number;
  status: string;
  payment_method: string;
  created_at: string;
};

export type WalletResponse = {
  balances: WalletBalance[];
  recent_ledger: Array<{
    currency: string;
    amount_cents: number;
    type: string;
    status: string;
    reference: string;
    created_at: string;
  }>;
};
