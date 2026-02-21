"use client";

import type { Product } from "@/lib/types";

type ProductFormState = {
  title: string;
  description: string;
  category: string;
  unit: string;
  price_minor: number;
  currency: string;
  stock_qty: string;
  min_order_qty: string;
  qty_step: string;
  image_urls: string;
  is_active: boolean;
};

export function toFormState(product?: Product): ProductFormState {
  return {
    title: product?.title ?? "",
    description: product?.description ?? "",
    category: product?.category ?? "other",
    unit: product?.unit ?? "piece",
    price_minor: product?.price_cents ?? 0,
    currency: product?.currency ?? "NGN",
    stock_qty: product?.stock_qty ?? "0.000",
    min_order_qty: product?.min_order_qty ?? "1.000",
    qty_step: product?.qty_step ?? "1.000",
    image_urls: product?.image_urls?.join(",") ?? "",
    is_active: product?.is_active ?? true,
  };
}

export default function VendorProductForm({
  value,
  onChange,
  onSubmit,
  loading,
  actionLabel,
}: {
  value: ProductFormState;
  onChange: (next: ProductFormState) => void;
  onSubmit: () => void;
  loading: boolean;
  actionLabel: string;
}) {
  return (
    <div className="space-y-3 rounded border bg-white p-4">
      <input className="w-full rounded border p-2" placeholder="Title" value={value.title} onChange={(e) => onChange({ ...value, title: e.target.value })} />
      <textarea className="w-full rounded border p-2" placeholder="Description" value={value.description} onChange={(e) => onChange({ ...value, description: e.target.value })} />
      <div className="grid grid-cols-2 gap-3">
        <select className="rounded border p-2" value={value.category} onChange={(e) => onChange({ ...value, category: e.target.value })}>
          {[
            { v: "clothing", l: "Clothing" },
            { v: "wool", l: "Wool" },
            { v: "fabric", l: "Fabric" },
            { v: "other", l: "Other" },
          ].map((c) => (
            <option key={c.v} value={c.v}>{c.l}</option>
          ))}
        </select>
        <select className="rounded border p-2" value={value.unit} onChange={(e) => onChange({ ...value, unit: e.target.value })}>
          {["piece", "yard", "meter", "kg", "bundle"].map((unit) => (
            <option key={unit} value={unit}>{unit}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input className="rounded border p-2" type="number" placeholder="price_minor" value={value.price_minor} onChange={(e) => onChange({ ...value, price_minor: Number(e.target.value) })} />
        <input className="rounded border p-2" placeholder="currency" value={value.currency} onChange={(e) => onChange({ ...value, currency: e.target.value.toUpperCase() })} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <input className="rounded border p-2" placeholder="stock_qty" value={value.stock_qty} onChange={(e) => onChange({ ...value, stock_qty: e.target.value })} />
        <input className="rounded border p-2" placeholder="min_order_qty" value={value.min_order_qty} onChange={(e) => onChange({ ...value, min_order_qty: e.target.value })} />
        <input className="rounded border p-2" placeholder="qty_step" value={value.qty_step} onChange={(e) => onChange({ ...value, qty_step: e.target.value })} />
      </div>
      <input className="w-full rounded border p-2" placeholder="image_urls (comma separated)" value={value.image_urls} onChange={(e) => onChange({ ...value, image_urls: e.target.value })} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={value.is_active} onChange={(e) => onChange({ ...value, is_active: e.target.checked })} />
        Active
      </label>
      <button disabled={loading} onClick={onSubmit} className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50">{loading ? "Saving..." : actionLabel}</button>
    </div>
  );
}
