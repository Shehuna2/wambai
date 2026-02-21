export type User = { id: number; email: string; is_vendor: boolean; is_buyer: boolean };

export type Shop = {
  id: number;
  owner: number;
  name: string;
  description: string;
  location: string;
  logo_url: string;
  is_active: boolean;
  is_approved: boolean;
};

export type Product = {
  id: number;
  shop: number;
  title: string;
  description: string;
  category: string;
  unit: string;
  price_cents: number;
  currency: string;
  stock_qty: string;
  min_order_qty: string;
  qty_step: string;
  image_urls: string[];
  is_active: boolean;
  is_approved: boolean;
};

export type VendorOrderItem = { id: number; qty: string; line_total_ngn_cents: number; product_snapshot: { title?: string } };

export type VendorOrder = {
  id: number;
  order: number;
  shop: number;
  shop_name: string;
  subtotal_ngn_cents: number;
  status: "NEW" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  order_created_at: string;
  items: VendorOrderItem[];
};
