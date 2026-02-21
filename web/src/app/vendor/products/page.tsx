"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listMyProducts } from "@/lib/api";
import type { Product } from "@/lib/types";

export default function VendorProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listMyProducts().then(setProducts).catch((e) => setError((e as Error).message)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">My products</h1>
        <Link href="/vendor/products/new" className="rounded bg-blue-600 px-3 py-2 text-white no-underline">New Product</Link>
      </div>
      {error && <p className="text-red-600">{error}</p>}
      {loading ? <p>Loading...</p> : (
        <div className="overflow-x-auto rounded border bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50"><tr><th className="p-2 text-left">Title</th><th>Category</th><th>Unit</th><th>Price</th><th>Stock</th><th>Active</th><th>Approved</th><th></th></tr></thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t"><td className="p-2">{p.title}</td><td>{p.category}</td><td>{p.unit}</td><td>{p.currency} {p.price_cents}</td><td>{p.stock_qty}</td><td>{String(p.is_active)}</td><td>{String(p.is_approved)}</td><td><Link href={`/vendor/products/${p.id}`}>Edit</Link></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
