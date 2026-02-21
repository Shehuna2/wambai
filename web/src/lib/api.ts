import type { CartResponse, Order, Product, Shop, User, VendorOrder } from "./types";

type RequestOptions = RequestInit & { auth?: boolean };

type ProductPayload = {
  shop: number;
  title: string;
  description: string;
  category: string;
  unit: string;
  price_minor: number;
  currency?: string;
  stock_qty: string;
  min_order_qty: string;
  qty_step: string;
  image_urls: string[];
  is_active?: boolean;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000/api";

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  headers.set("Content-Type", "application/json");

  if (options.auth !== false) {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const bodyText = await response.text();
  const data = bodyText ? JSON.parse(bodyText) : null;

  if (!response.ok) {
    let detail = data?.detail ?? data?.non_field_errors?.[0];
    if (!detail && data && typeof data === "object") {
      const firstValue = Object.values(data)[0];
      detail = Array.isArray(firstValue) ? firstValue[0] : firstValue;
    }
    throw new Error(String(detail ?? "Request failed"));
  }

  return data as T;
}

function toBackendProductPayload(payload: ProductPayload) {
  return {
    ...payload,
    currency: payload.currency ?? "NGN",
    price_cents: payload.price_minor,
  };
}

export function register(payload: { email: string; phone?: string; password: string; is_vendor?: boolean }) {
  return request<{ access: string; refresh: string; user: User }>("/auth/register/", {
    method: "POST",
    auth: false,
    body: JSON.stringify(payload),
  });
}

export function login(payload: { email: string; password: string }) {
  return request<{ access: string; refresh: string }>("/auth/login/", {
    method: "POST",
    auth: false,
    body: JSON.stringify(payload),
  });
}

export function me() {
  return request<User>("/auth/me/");
}

export function listShops() {
  return request<Shop[]>("/shops/");
}

export function getShop(id: string | number) {
  return request<Shop>(`/shops/${id}/`);
}

export function listProducts(params?: { shop?: string; category?: string; q?: string }) {
  const search = new URLSearchParams();
  if (params?.shop) search.set("shop", params.shop);
  if (params?.category) search.set("category", params.category);
  if (params?.q) search.set("search", params.q);
  const qs = search.toString();
  return request<Product[]>(`/products/${qs ? `?${qs}` : ""}`);
}

export function getProduct(id: string | number) {
  return request<Product>(`/products/${id}/`);
}

export function getCart() {
  return request<CartResponse>("/cart/");
}

export function addToCart(payload: { product_id: number; qty: string }) {
  return request("/cart/items/", {
    method: "POST",
    body: JSON.stringify({ product: payload.product_id, qty: payload.qty }),
  });
}

export function updateCartItem(id: number, payload: { qty: string }) {
  return request(`/cart/items/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteCartItem(id: number) {
  return request(`/cart/items/${id}/`, {
    method: "DELETE",
  });
}

export function getWallet() {
  return request<{ balances: Array<{ currency: string; available_cents: number }>; recent_ledger: unknown[] }>("/wallet/");
}

export function topupInit(payload: { currency: string; amount_minor: number }) {
  return request<{ reference: string; checkout_url: string }>("/wallet/topup/init/", {
    method: "POST",
    body: JSON.stringify({ currency: payload.currency, amount_cents: payload.amount_minor }),
  });
}

export function checkout(payload: { payment_method: string; wallet_currency?: string }) {
  return request<Order | { order_id: number; checkout_url: string }>("/checkout/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getMyShop() {
  const shops = await request<Shop[]>("/shops/");
  return shops[0] ?? null;
}

export async function upsertMyShop(payload: { name: string; description: string; location: string; logo_url: string }) {
  const existing = await getMyShop();
  if (existing) {
    return request<Shop>(`/shops/${existing.id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  return request<Shop>("/shops/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listMyProducts() {
  return request<Product[]>("/products/");
}

export function createProduct(payload: ProductPayload) {
  return request<Product>("/products/", {
    method: "POST",
    body: JSON.stringify(toBackendProductPayload(payload)),
  });
}

export function getMyProduct(id: number | string) {
  return request<Product>(`/products/${id}/`);
}

export function updateMyProduct(id: number | string, payload: Partial<ProductPayload>) {
  return request<Product>(`/products/${id}/`, {
    method: "PATCH",
    body: JSON.stringify({
      ...payload,
      ...(payload.price_minor !== undefined ? { price_cents: payload.price_minor } : {}),
      currency: payload.currency ?? "NGN",
    }),
  });
}

export function listVendorOrders() {
  return request<VendorOrder[]>("/vendor/orders/");
}

export function getVendorOrder(id: number | string) {
  return request<VendorOrder>(`/vendor/orders/${id}/`);
}

export function updateVendorOrderStatus(id: number | string, status: VendorOrder["status"]) {
  return request<VendorOrder>(`/vendor/orders/${id}/`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
