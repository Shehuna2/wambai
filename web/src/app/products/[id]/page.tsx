"use client";

import { useEffect, useState } from "react";
import { addToCart, getProduct } from "@/lib/api";
import type { Product } from "@/lib/types";

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState("1");
  const [message, setMessage] = useState("");

  useEffect(() => {
    getProduct(params.id).then((p) => {
      setProduct(p);
      setQty(p.min_order_qty);
    });
  }, [params.id]);

  async function onAdd() {
    if (!product) return;
    setMessage("");
    try {
      await addToCart({ product_id: product.id, qty });
      setMessage("Added to cart");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  if (!product) return <p>Loading...</p>;

  return (
    <section className="space-y-4">
      <div className="wb-shell p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-green-700">{product.category}</p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-900">{product.title}</h1>
        <p className="mt-2 text-sm text-gray-600">{product.description || "No description provided."}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full bg-green-100 px-3 py-1 font-semibold text-green-700">Unit: {product.unit}</span>
          <span className="rounded-full bg-green-50 px-3 py-1 font-semibold text-green-700">{product.currency} {product.price_cents}</span>
        </div>
      </div>
      <div className="wb-shell flex flex-wrap items-center gap-2 p-4">
        <label className="text-sm font-medium">Qty</label>
        <input className="w-32 rounded-full border border-green-200 bg-white px-4 py-2" value={qty} onChange={(e) => setQty(e.target.value)} />
        <button className="wb-btn" onClick={onAdd}>
          Add to cart
        </button>
      </div>
      {message && <p>{message}</p>}
    </section>
  );
}
