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
    listVendorOrders()
      .then((data) => {
        setOrders(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading orders...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Vendor Orders</h1>
      {error ? <p className="text-red-600">{error}</p> : null}
      <div className="overflow-auto rounded border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-2 text-left">Order ID</th>
              <th className="p-2 text-left">Shop</th>
              <th className="p-2 text-left">Subtotal (NGN)</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Created</th>
              <th className="p-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t">
                <td className="p-2">#{order.order}</td>
                <td className="p-2">{order.shop_name || order.shop}</td>
                <td className="p-2">{order.subtotal_ngn_cents}</td>
                <td className="p-2">{order.status}</td>
                <td className="p-2">{order.order_created_at ? new Date(order.order_created_at).toLocaleString() : "-"}</td>
                <td className="p-2">
                  <Link href={`/vendor/orders/${order.id}`}>View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
