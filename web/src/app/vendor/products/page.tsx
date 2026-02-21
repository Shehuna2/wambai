"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { listMyProducts } from "@/lib/api";
import type { Product } from "@/lib/types";

export default function VendorProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    listMyProducts().then(setProducts).catch(() => setProducts([]));
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex justify-between"><h1 className="text-xl font-semibold">Products</h1><Link href="/vendor/products/new" className="rounded bg-blue-700 px-3 py-2 text-white">New</Link></div>
      <div className="overflow-auto rounded border bg-white">
        <table className="min-w-full text-sm">
          <thead><tr className="bg-slate-100"><th className="p-2 text-left">Title</th><th className="p-2">Price</th><th className="p-2">Stock</th><th className="p-2">Active</th><th className="p-2">Images</th><th className="p-2">Edit</th></tr></thead>
          <tbody>
            {products.map((p) => <tr key={p.id} className="border-t"><td className="p-2">{p.title}</td><td className="p-2">{p.price_cents}</td><td className="p-2">{p.stock_qty}</td><td className="p-2">{p.is_active ? "Yes" : "No"}</td><td className="p-2">{p.image_urls.length}</td><td className="p-2"><Link href={`/vendor/products/${p.id}`}>Edit</Link></td></tr>)}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-600">Product approval is not used; only shop approval + active status controls buyer visibility.</p>
    </div>
  );
}
