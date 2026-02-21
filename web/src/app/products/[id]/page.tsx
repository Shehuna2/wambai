"use client";

import { useEffect, useState } from "react";

import { addToCart, getProduct } from "@/lib/api";
import type { Product } from "@/lib/types";

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState("1");
  const [message, setMessage] = useState("");

  useEffect(() => {
    getProduct(params.id)
      .then((data) => {
        setProduct(data);
        setQty(data.min_order_qty);
      })
      .catch((err) => setMessage(err.message));
  }, [params.id]);

  if (!product) return <p>{message || "Loading..."}</p>;

  return (
    <div className="mx-auto max-w-xl space-y-4 rounded bg-white p-4 shadow">
      <h1 className="text-2xl font-bold">{product.title}</h1>
      <p>{product.description}</p>
      <p>
        {product.currency} {product.price_cents / 100}
      </p>
      <p className="text-sm">Min qty: {product.min_order_qty}, Step: {product.qty_step}</p>
      <input className="w-full rounded border p-2" value={qty} onChange={(e) => setQty(e.target.value)} />
      <button
        className="rounded bg-blue-700 px-4 py-2 text-white"
        onClick={async () => {
          setMessage("");
          try {
            await addToCart({ product_id: product.id, qty });
            setMessage("Added to cart");
          } catch (err) {
            setMessage(err instanceof Error ? err.message : "Could not add to cart");
          }
        }}
      >
        Add to Cart
      </button>
      {message ? <p className="text-sm">{message}</p> : null}
    </div>
  );
}
