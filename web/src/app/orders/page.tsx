"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { listOrders } from "@/lib/api";
import type { Order } from "@/lib/types";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    listOrders()
      .then((data) => setOrders(data))
      .catch((e) => setMessage((e as Error).message));
  }, []);

  return (
    <section className="space-y-4">
      <div className="wb-shell p-5">
        <h1 className="text-2xl font-extrabold text-slate-900">My orders</h1>
        <p className="mt-1 text-sm text-gray-600">Track all buyer orders, payment method, and live status updates.</p>
      </div>
      {message && <p>{message}</p>}
      {!message && !orders.length && <p className="text-sm text-gray-500">No orders yet.</p>}
      {!!orders.length && (
        <div className="wb-shell overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-green-50">
              <tr className="border-b text-left">
                <th className="p-2">ID</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Total (NGN minor)</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t">
                  <td className="p-2">#{order.id}</td>
                  <td>{order.status}</td>
                  <td>{order.payment_method}</td>
                  <td>{order.total_ngn_cents}</td>
                  <td>{new Date(order.created_at).toLocaleString()}</td>
                  <td>
                    <Link href={`/orders/${order.id}`}>View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
