"use client";

import { FormEvent, useEffect, useState } from "react";

import { getVendorOrder, updateVendorOrderStatus } from "@/lib/api";
import type { VendorOrder } from "@/lib/types";

const STATUSES: VendorOrder["status"][] = ["NEW", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

export default function VendorOrderDetailPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<VendorOrder | null>(null);
  const [status, setStatus] = useState<VendorOrder["status"]>("NEW");
  const [message, setMessage] = useState("");

  useEffect(() => {
    getVendorOrder(params.id).then((o) => { setOrder(o); setStatus(o.status); }).catch((err) => setMessage(err.message));
  }, [params.id]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!order) return;
    const updated = await updateVendorOrderStatus(String(order.id), status);
    setOrder(updated);
    setMessage("Updated");
  };

  if (!order) return <p>{message || "Loading"}</p>;

  return (
    <div className="space-y-3">
      <div className="rounded border bg-white p-4 text-sm"><p>Order #{order.order}</p><p>Shop: {order.shop_name}</p><p>Subtotal: {order.subtotal_ngn_cents}</p></div>
      <div className="rounded border bg-white p-4">{order.items.map((item) => <div key={item.id} className="border-b py-2 text-sm">{item.product_snapshot?.title} • Qty {item.qty} • {item.line_total_ngn_cents}</div>)}</div>
      <form onSubmit={submit} className="rounded border bg-white p-4"><select className="rounded border p-2" value={status} onChange={(e) => setStatus(e.target.value as VendorOrder["status"])}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select><button className="ml-2 rounded bg-blue-700 px-3 py-2 text-white">Save</button></form>
      {message ? <p>{message}</p> : null}
    </div>
  );
}
