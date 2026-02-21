"use client";

import { useEffect, useState } from "react";

import { getShop, listProducts } from "@/lib/api";
import type { Product, Shop } from "@/lib/types";

export default function ShopDetail({ params }: { params: { id: string } }) {
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    getShop(params.id).then(setShop).catch(() => setShop(null));
    listProducts(params.id).then(setProducts).catch(() => setProducts([]));
  }, [params.id]);

  if (!shop) return <p>Loading...</p>;
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">{shop.name}</h1>
      <div className="grid gap-2 md:grid-cols-3">
        {products.map((p) => (
          <div key={p.id} className="rounded border bg-white p-3">
            <p>{p.title}</p>
            <p className="text-sm">{p.stock_qty}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
