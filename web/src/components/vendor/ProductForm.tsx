"use client";

import { FormEvent, useState } from "react";

import type { Product } from "@/lib/types";

type ProductFormValue = {
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

export function ProductForm({
  initial,
  onSubmit,
  submitLabel,
  error,
}: {
  initial?: Product;
  onSubmit: (value: Omit<ProductFormValue, "image_urls"> & { image_urls: string[] }) => Promise<void>;
  submitLabel: string;
  error: string;
}) {
  const [form, setForm] = useState<ProductFormValue>({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    category: initial?.category ?? "other",
    unit: initial?.unit ?? "piece",
    price_minor: initial?.price_cents ?? 0,
    currency: initial?.currency ?? "NGN",
    stock_qty: initial?.stock_qty ?? "0.000",
    min_order_qty: initial?.min_order_qty ?? "1.000",
    qty_step: initial?.qty_step ?? "1.000",
    image_urls: initial?.image_urls?.join(",") ?? "",
    is_active: initial?.is_active ?? true,
  });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        ...form,
        image_urls: form.image_urls
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded border bg-white p-4">
      <input className="w-full rounded border p-2" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
      <textarea className="w-full rounded border p-2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <div className="grid gap-2 md:grid-cols-2">
        <select className="rounded border p-2" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          <option value="clothing">Clothing</option>
          <option value="wool">Wool</option>
          <option value="fabric">Fabric</option>
          <option value="other">Other</option>
        </select>
        <select className="rounded border p-2" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
          <option value="piece">Piece</option>
          <option value="yard">Yard</option>
          <option value="meter">Meter</option>
          <option value="kg">Kg</option>
          <option value="bundle">Bundle</option>
        </select>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <input className="rounded border p-2" type="number" placeholder="Price (minor)" value={form.price_minor} onChange={(e) => setForm({ ...form, price_minor: Number(e.target.value) })} required />
        <input className="rounded border p-2" placeholder="Currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} required />
      </div>
      <div className="grid gap-2 md:grid-cols-3">
        <input className="rounded border p-2" placeholder="Stock qty" value={form.stock_qty} onChange={(e) => setForm({ ...form, stock_qty: e.target.value })} required />
        <input className="rounded border p-2" placeholder="Min order qty" value={form.min_order_qty} onChange={(e) => setForm({ ...form, min_order_qty: e.target.value })} required />
        <input className="rounded border p-2" placeholder="Qty step" value={form.qty_step} onChange={(e) => setForm({ ...form, qty_step: e.target.value })} required />
      </div>
      <input className="w-full rounded border p-2" placeholder="Image URLs (comma separated)" value={form.image_urls} onChange={(e) => setForm({ ...form, image_urls: e.target.value })} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
        Active
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button className="rounded bg-blue-700 px-4 py-2 text-white" type="submit" disabled={submitting}>
        {submitting ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
