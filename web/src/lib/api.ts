import type { Product, Shop, User, VendorOrder } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000/api";

type ReqOpts = RequestInit & { auth?: boolean; form?: boolean };

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

async function api<T>(path: string, opts: ReqOpts = {}): Promise<T> {
  const headers = new Headers(opts.headers ?? {});
  if (!opts.form) headers.set("Content-Type", "application/json");
  if (opts.auth !== false) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  const txt = await res.text();
  const data = txt ? JSON.parse(txt) : {};
  if (!res.ok) {
    const detail = data?.detail ?? data?.non_field_errors?.[0] ?? Object.values(data)[0] ?? "Request failed";
    throw new Error(String(Array.isArray(detail) ? detail[0] : detail));
  }
  return data as T;
}

export const login = (payload: { email: string; password: string }) => api<{ access: string; refresh: string }>("/auth/login/", { method: "POST", auth: false, body: JSON.stringify(payload) });
export const me = () => api<User>("/auth/me/");
export const listShops = () => api<Shop[]>("/shops/");
export const getShop = (id: string) => api<Shop>(`/shops/${id}/`);
export const listProducts = (shop?: string) => api<Product[]>(`/products/${shop ? `?shop=${shop}` : ""}`);

export const getMyShop = () => api<Shop>("/vendor/shop/");
export const createMyShop = (payload: Partial<Shop>) => api<Shop>("/vendor/shop/", { method: "POST", body: JSON.stringify(payload) });
export const updateMyShop = (payload: Partial<Shop>) => api<Shop>("/vendor/shop/", { method: "PATCH", body: JSON.stringify(payload) });
export const listMyProducts = () => api<Product[]>("/vendor/products/");
export const createProduct = (payload: {
  shop: number;
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
}) => api<Product>("/vendor/products/", { method: "POST", body: JSON.stringify({ ...payload, price_cents: payload.price_minor }) });
export const getMyProduct = (id: string) => api<Product>(`/vendor/products/${id}/`);
export const updateMyProduct = (id: string, payload: Partial<{ title: string; description: string; category: string; unit: string; price_minor: number; currency: string; stock_qty: string; min_order_qty: string; qty_step: string; image_urls: string[]; is_active: boolean }>) =>
  api<Product>(`/vendor/products/${id}/`, {
    method: "PATCH",
    body: JSON.stringify({ ...payload, ...(payload.price_minor !== undefined ? { price_cents: payload.price_minor } : {}) }),
  });

export const listVendorOrders = () => api<VendorOrder[]>("/vendor/orders/");
export const getVendorOrder = (id: string) => api<VendorOrder>(`/vendor/orders/${id}/`);
export const updateVendorOrderStatus = (id: string, status: VendorOrder["status"]) => api<VendorOrder>(`/vendor/orders/${id}/`, { method: "PATCH", body: JSON.stringify({ status }) });

export async function uploadImages(files: File[]): Promise<string[]> {
  const form = new FormData();
  for (const file of files) form.append("files", file);
  const data = await api<{ urls: string[] }>("/uploads/images/", { method: "POST", body: form, form: true });
  return data.urls;
}
