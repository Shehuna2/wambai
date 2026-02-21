"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";

import { uploadImages } from "@/lib/api";
import type { Product } from "@/lib/types";

type ProductInput = {
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
};

export function ProductForm({ initial, onSubmit, error }: { initial?: Product; onSubmit: (payload: ProductInput) => Promise<void>; error: string }) {
  const [form, setForm] = useState<ProductInput>({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    category: initial?.category ?? "other",
    unit: initial?.unit ?? "piece",
    price_minor: initial?.price_cents ?? 0,
    currency: initial?.currency ?? "NGN",
    stock_qty: initial?.stock_qty ?? "0.000",
    min_order_qty: initial?.min_order_qty ?? "1.000",
    qty_step: initial?.qty_step ?? "1.000",
    image_urls: initial?.image_urls ?? [],
    is_active: initial?.is_active ?? true,
  });
  const [uploading, setUploading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded border bg-white p-4">
      <input className="w-full rounded border p-2" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" required />
      <textarea className="w-full rounded border p-2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" />
      <div className="grid gap-2 md:grid-cols-2">
        <select className="rounded border p-2" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          <option value="clothing">Clothing</option><option value="wool">Wool</option><option value="fabric">Fabric</option><option value="other">Other</option>
        </select>
        <select className="rounded border p-2" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
          <option value="piece">Piece</option><option value="yard">Yard</option><option value="meter">Meter</option><option value="kg">Kg</option><option value="bundle">Bundle</option>
        </select>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <input className="rounded border p-2" type="number" value={form.price_minor} onChange={(e) => setForm({ ...form, price_minor: Number(e.target.value) })} placeholder="Price minor" required />
        <input className="rounded border p-2" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} placeholder="Currency" required />
      </div>
      <div className="grid gap-2 md:grid-cols-3">
        <input className="rounded border p-2" value={form.stock_qty} onChange={(e) => setForm({ ...form, stock_qty: e.target.value })} placeholder="Stock qty" required />
        <input className="rounded border p-2" value={form.min_order_qty} onChange={(e) => setForm({ ...form, min_order_qty: e.target.value })} placeholder="Min qty" required />
        <input className="rounded border p-2" value={form.qty_step} onChange={(e) => setForm({ ...form, qty_step: e.target.value })} placeholder="Step" required />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Upload Images</label>
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          if (!files.length) return;
          setUploading(true);
          try {
            const urls = await uploadImages(files);
            setForm((prev) => ({ ...prev, image_urls: [...prev.image_urls, ...urls] }));
          } finally {
            setUploading(false);
          }
        }} />
        {uploading ? <p className="text-xs">Uploading...</p> : null}
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {form.image_urls.map((url) => (
            <div key={url} className="rounded border p-1">
              <Image src={url} alt="product" width={120} height={120} className="h-24 w-full object-cover" unoptimized />
              <button type="button" className="mt-1 w-full rounded bg-red-600 px-2 py-1 text-xs text-white" onClick={() => setForm((prev) => ({ ...prev, image_urls: prev.image_urls.filter((u) => u !== url) }))}>Remove</button>
            </div>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active</label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button className="rounded bg-blue-700 px-4 py-2 text-white" type="submit">Save Product</button>
    </form>
  );
}
