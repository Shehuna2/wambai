export type Mode = 'BUYER' | 'VENDOR';

export type WalletBalance = { currency: string; available_cents: number };
export type Product = {
  id: number;
  title: string;
  price_cents: number;
  currency: string;
  shop: number;
  qty_step?: string;
};
export type Shop = { id: number; name: string; description: string; location: string };
