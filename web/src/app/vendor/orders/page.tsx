"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listVendorOrders } from "@/lib/api";
import type { VendorOrder } from "@/lib/types";

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listVendorOrders().then(setOrders).catch((e) => setError((e as Error).message)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">Vendor orders</h1>
      {error && <p className="text-red-600">{error}</p>}
      {loading ? <p>Loading...</p> : (
        <div className="overflow-x-auto rounded border bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50"><tr><th className="p-2 text-left">Order ID</th><th>Shop</th><th>Subtotal</th><th>Status</th><th>Created</th><th></th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t"><td className="p-2">{o.order}</td><td>{o.shop_name ?? o.shop}</td><td>{o.subtotal_ngn_cents}</td><td>{o.status}</td><td>{o.order_created_at ?? "-"}</td><td><Link href={`/vendor/orders/${o.id}`}>View</Link></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
