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
      .then(([shopData, productData]) => {
        setShop(shopData);
        setProducts(productData);
      })
      .catch((e) => setError((e as Error).message));
  }, [params.id]);

  return (
    <section className="space-y-3">
      {shop && <h1 className="text-xl font-semibold">{shop.name}</h1>}
      {error && <p className="text-red-600">{error}</p>}
      <ul className="space-y-2">
        {products.map((product) => (
          <li key={product.id} className="rounded border bg-white p-3">
            <Link href={`/products/${product.id}`} className="font-medium">
              {product.title}
            </Link>
            <p>{product.currency} {product.price_cents}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
