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
    <section className="space-y-3">
      <h1 className="text-xl font-semibold">{product.title}</h1>
      <p>{product.description}</p>
      <p>Price: {product.currency} {product.price_cents}</p>
      <div className="flex items-center gap-2">
        <label>Qty</label>
        <input className="w-32 rounded border p-2" value={qty} onChange={(e) => setQty(e.target.value)} />
        <button className="rounded bg-blue-600 px-4 py-2 text-white" onClick={onAdd}>
          Add to Cart
        </button>
      </div>
      {message && <p>{message}</p>}
    </section>
  );
}
