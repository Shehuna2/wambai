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
    listMyProducts()
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading products...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Products</h1>
        <Link href="/vendor/products/new" className="rounded bg-blue-700 px-4 py-2 text-white">
          New Product
        </Link>
      </div>
      {error ? <p className="text-red-600">{error}</p> : null}
      <div className="overflow-auto rounded border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-2 text-left">Title</th>
              <th className="p-2 text-left">Category</th>
              <th className="p-2 text-left">Unit</th>
              <th className="p-2 text-left">Price</th>
              <th className="p-2 text-left">Stock</th>
              <th className="p-2 text-left">Active</th>
              <th className="p-2 text-left">Approved</th>
              <th className="p-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-t">
                <td className="p-2">{product.title}</td>
                <td className="p-2">{product.category}</td>
                <td className="p-2">{product.unit}</td>
                <td className="p-2">{product.currency} {product.price_cents}</td>
                <td className="p-2">{product.stock_qty}</td>
                <td className="p-2">{product.is_active ? "Yes" : "No"}</td>
                <td className="p-2">{product.is_approved ? "Approved" : "Pending"}</td>
                <td className="p-2">
                  <Link href={`/vendor/products/${product.id}`}>Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
