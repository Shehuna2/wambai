import type {
  CartResponse,
  CheckoutInit,
  Order,
  Product,
  Shop,
  User,
  VendorOrder,
  WalletAdjustmentAudit,
  WalletResponse,
  WebhookEventAudit,
} from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000/api";

type ApiOptions = RequestInit & { auth?: boolean; isFormData?: boolean };

async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers ?? {});

  if (!options.isFormData) {
    headers.set("Content-Type", "application/json");
  }

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
  api<Order | CheckoutInit>("/checkout/", { method: "POST", body: JSON.stringify(payload) });
export const listOrders = () => api<Order[]>("/orders/");
export const getOrder = (id: number | string) => api<Order>(`/orders/${id}/`);

export const getMyShop = async () => {
  try {
    return await api<Shop>("/vendor/shop/");
  } catch {
    return null;
  }
};

export const upsertMyShop = async (payload: { name?: string; description?: string; location?: string; logo_url?: string; is_active?: boolean }) => {
  const existing = await getMyShop();
  if (existing) {
    return api<Shop>("/vendor/shop/", { method: "PATCH", body: JSON.stringify(payload) });
  }
  return api<Shop>("/vendor/shop/", { method: "POST", body: JSON.stringify(payload) });
};

export const listMyProducts = () => api<Product[]>("/vendor/products/");
export const createProduct = (payload: {
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

export const getMyProduct = (id: number | string) => api<Product>(`/vendor/products/${id}/`);
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
  return api<Product>(`/vendor/products/${id}/`, { method: "PATCH", body: JSON.stringify(body) });
};

export const uploadImages = async (files: File[]): Promise<string[]> => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  const response = await api<{ urls: string[] }>("/uploads/images/", {
    method: "POST",
    body: formData,
    isFormData: true,
  });
  return response.urls;
};

export const listVendorOrders = () => api<VendorOrder[]>("/vendor/orders/");
export const getVendorOrder = (id: number | string) => api<VendorOrder>(`/vendor/orders/${id}/`);
export const updateVendorOrderStatus = (id: number | string, status: VendorOrder["status"]) =>
  api<VendorOrder>(`/vendor/orders/${id}/`, { method: "PATCH", body: JSON.stringify({ status }) });

export const listWalletAdjustmentsAudit = () => api<WalletAdjustmentAudit[]>("/admin/audit/wallet-adjustments/");
export const listWebhookEventsAudit = () => api<WebhookEventAudit[]>("/admin/audit/webhooks/");
