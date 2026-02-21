"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getShop, listProducts } from "@/lib/api";
import type { Product, Shop } from "@/lib/types";

export default function ShopDetailPage({ params }: { params: { id: string } }) {
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getShop(params.id), listProducts({ shop: params.id })])
      .then(([shopData, productsData]) => {
        setShop(shopData);
        setProducts(productsData);
      })
      .catch((err) => setError(err.message));
  }, [params.id]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!shop) return <p>Loading...</p>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{shop.name}</h1>
        <p className="text-slate-600">{shop.location}</p>
        <p>{shop.description}</p>
      </div>
      <h2 className="text-xl font-semibold">Products</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {products.map((product) => (
          <Link key={product.id} href={`/products/${product.id}`} className="rounded border bg-white p-4">
            <h3 className="font-semibold">{product.title}</h3>
            <p className="text-sm text-slate-600">{product.category}</p>
            <p>
              {product.currency} {product.price_cents / 100}
            </p>
            <p className="text-sm">Min qty: {product.min_order_qty}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
