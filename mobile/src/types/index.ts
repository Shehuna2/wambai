export type Mode = 'BUYER' | 'VENDOR';

export type WalletBalance = { currency: string; available_cents: number };
export type UserProfile = {
  full_name: string;
  avatar_url: string;
  default_currency: string;
  created_at: string;
  updated_at: string;
};
export type AuthUser = {
  id: number;
  email: string;
  phone?: string;
  is_vendor: boolean;
  is_buyer: boolean;
  created_at: string;
  profile: UserProfile;
  wallet_balances: WalletBalance[];
};

export type Product = {
  id: number;
  title: string;
  price_cents: number;
  currency: string;
  shop: number;
  qty_step?: string;
};
export type Shop = { id: number; name: string; description: string; location: string };
