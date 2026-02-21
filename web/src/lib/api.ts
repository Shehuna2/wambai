import type { CartResponse, Order, Product, Shop, User, VendorOrder, WalletResponse } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000/api";

type ApiOptions = RequestInit & { auth?: boolean };

async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  headers.set("Content-Type", "application/json");

  if (options.auth !== false && typeof window !== "undefined") {
    const access = localStorage.getItem("access_token");
    if (access) headers.set("Authorization", `Bearer ${access}`);
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const data = await response.json();
      message = data.detail || JSON.stringify(data);
    } catch {
      // noop
    }
    throw new Error(message);
  }
  if (response.status === 204) return {} as T;
  return response.json() as Promise<T>;
}

export const register = (payload: { email: string; phone?: string; password: string; is_vendor?: boolean }) =>
  api<{ access: string; refresh: string; user: User }>("/auth/register/", { method: "POST", auth: false, body: JSON.stringify(payload) });

export const login = (payload: { email: string; password: string }) =>
  api<{ access: string; refresh: string }>("/auth/login/", { method: "POST", auth: false, body: JSON.stringify(payload) });

export const me = () => api<User>("/auth/me/");
export const listShops = () => api<Shop[]>("/shops/");
export const getShop = (id: number | string) => api<Shop>(`/shops/${id}/`);
export const listProducts = (params: { shop?: string; category?: string; q?: string } = {}) => {
  const q = new URLSearchParams();
  if (params.shop) q.set("shop", params.shop);
  if (params.category) q.set("category", params.category);
  if (params.q) q.set("search", params.q);
  return api<Product[]>(`/products/${q.toString() ? `?${q.toString()}` : ""}`);
};
export const getProduct = (id: number | string) => api<Product>(`/products/${id}/`);
export const getCart = () => api<CartResponse>("/cart/");
export const addToCart = (payload: { product_id: number; qty: string }) =>
  api("/cart/items/", { method: "POST", body: JSON.stringify({ product: payload.product_id, qty: payload.qty }) });
export const updateCartItem = (id: number | string, payload: { qty: string }) =>
  api(`/cart/items/${id}/`, { method: "PATCH", body: JSON.stringify(payload) });
export const deleteCartItem = (id: number | string) => api(`/cart/items/${id}/`, { method: "DELETE" });
export const getWallet = () => api<WalletResponse>("/wallet/");
export const topupInit = (payload: { currency: string; amount_minor: number }) =>
  api<{ reference: string; checkout_url: string }>("/wallet/topup/init/", {
    method: "POST",
    body: JSON.stringify({ currency: payload.currency, amount_cents: payload.amount_minor }),
  });
export const checkout = (payload: { payment_method: string; wallet_currency?: string }) =>
  api<Order>("/checkout/", { method: "POST", body: JSON.stringify(payload) });

export const getMyShop = async () => {
  const shops = await listShops();
  return shops[0] ?? null;
};

export const upsertMyShop = async (payload: { name: string; description: string; location: string; logo_url: string; is_active?: boolean }) => {
  const existing = await getMyShop();
  if (existing) {
    return api<Shop>(`/shops/${existing.id}/`, { method: "PATCH", body: JSON.stringify(payload) });
  }
  return api<Shop>("/shops/", { method: "POST", body: JSON.stringify(payload) });
};

export const listMyProducts = () => api<Product[]>("/products/");
export const createProduct = async (payload: {
  title: string;
  description: string;
  category: string;
  unit: string;
  price_minor: number;
  currency: string;
  stock_qty: string;
  min_order_qty: string;
  qty_step: string;
  image_urls: string[];
  is_active: boolean;
}) => {
  const shop = await getMyShop();
  if (!shop) throw new Error("Create your shop first");
  return api<Product>("/products/", { method: "POST", body: JSON.stringify({ ...payload, shop: shop.id, price_cents: payload.price_minor }) });
};

export const getMyProduct = (id: number | string) => api<Product>(`/products/${id}/`);
export const updateMyProduct = (
  id: number | string,
  payload: Partial<{
    title: string;
    description: string;
    category: string;
    unit: string;
    price_minor: number;
    currency: string;
    stock_qty: string;
    min_order_qty: string;
    qty_step: string;
    image_urls: string[];
    is_active: boolean;
  }>
) => {
  const body = { ...payload, price_cents: payload.price_minor };
  return api<Product>(`/products/${id}/`, { method: "PATCH", body: JSON.stringify(body) });
};

export const listVendorOrders = () => api<VendorOrder[]>("/vendor/orders/");
export const getVendorOrder = (id: number | string) => api<VendorOrder>(`/vendor/orders/${id}/`);
export const updateVendorOrderStatus = (id: number | string, status: VendorOrder["status"]) =>
  api<VendorOrder>(`/vendor/orders/${id}/`, { method: "PATCH", body: JSON.stringify({ status }) });
