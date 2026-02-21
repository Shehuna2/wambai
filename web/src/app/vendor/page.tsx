"use client";

import { useEffect, useMemo, useState } from "react";
import { getMyShop, listMyProducts, listVendorOrders } from "@/lib/api";
import type { Product, Shop, VendorOrder } from "@/lib/types";

export default function VendorHomePage() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getMyShop(), listMyProducts(), listVendorOrders()])
      .then(([s, p, o]) => {
        setShop(s);
        setProducts(p);
        setOrders(o);
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const orderCounts = useMemo(() => {
    const counts: Record<string, number> = { NEW: 0, PROCESSING: 0, SHIPPED: 0, DELIVERED: 0, CANCELLED: 0 };
    orders.forEach((o) => counts[o.status] = (counts[o.status] ?? 0) + 1);
    return counts;
  }, [orders]);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Vendor dashboard</h1>
      {error && <p className="text-red-600">{error}</p>}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded border bg-white p-3">
          <p className="text-sm text-gray-500">Shop status</p>
          <p className="font-medium">{shop ? (shop.is_approved ? "Approved" : "Pending") : "No shop yet"}</p>
        </div>
        <div className="rounded border bg-white p-3">
          <p className="text-sm text-gray-500">Products</p>
          <p className="font-medium">Approved: {products.filter((p) => p.is_approved).length} | Pending: {products.filter((p) => !p.is_approved).length}</p>
        </div>
        <div className="rounded border bg-white p-3">
          <p className="text-sm text-gray-500">Vendor orders</p>
          <p className="font-medium">NEW {orderCounts.NEW} · PROC {orderCounts.PROCESSING} · SHIP {orderCounts.SHIPPED} · DONE {orderCounts.DELIVERED}</p>
        </div>
      </div>
    </div>
  );
}
