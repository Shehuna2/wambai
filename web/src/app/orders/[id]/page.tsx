"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { getOrder } from "@/lib/api";
import type { Order } from "@/lib/types";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!params?.id) return;
    getOrder(params.id)
      .then((data) => setOrder(data))
      .catch((e) => setMessage((e as Error).message));
  }, [params?.id]);

  if (message) return <p>{message}</p>;
  if (!order) return <p>Loading...</p>;

  return (
    <section className="space-y-4">
      <div className="wb-shell p-5">
        <h1 className="text-2xl font-extrabold text-slate-900">Order #{order.id}</h1>
      </div>
      <div className="wb-shell p-4 text-sm">
        <p>Status: {order.status}</p>
        <p>Payment method: {order.payment_method}</p>
        <p>Total (NGN minor): {order.total_ngn_cents}</p>
        <p>Created: {new Date(order.created_at).toLocaleString()}</p>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-medium">Vendor splits</h2>
        {!order.vendor_orders?.length && <p className="text-sm text-gray-500">No vendor order lines yet.</p>}
        {(order.vendor_orders ?? []).map((vo) => (
          <div key={vo.id} className="wb-shell p-4">
            <p className="font-medium">{vo.shop_name ?? `Shop #${vo.shop}`}</p>
            <p className="text-sm">Status: {vo.status}</p>
            <p className="text-sm">Subtotal (NGN minor): {vo.subtotal_ngn_cents}</p>
            <ul className="mt-2 space-y-2 text-sm">
              {(vo.items ?? []).map((item) => (
                <li key={item.id} className="rounded-xl border border-green-100 p-2">
                  <p>{item.product_snapshot?.title ?? "Item"}</p>
                  <p>Qty: {item.qty}</p>
                  <p>Line total (NGN minor): {item.line_total_ngn_cents}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
