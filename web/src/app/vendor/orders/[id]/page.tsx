"use client";

import { FormEvent, useEffect, useState } from "react";

import { getVendorOrder, updateVendorOrderStatus } from "@/lib/api";
import type { VendorOrder } from "@/lib/types";

const STATUS_OPTIONS: VendorOrder["status"][] = ["NEW", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

export default function VendorOrderDetailPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<VendorOrder | null>(null);
  const [status, setStatus] = useState<VendorOrder["status"]>("NEW");
  const [message, setMessage] = useState("");

  useEffect(() => {
    getVendorOrder(params.id)
      .then((data) => {
        setOrder(data);
        setStatus(data.status);
      })
      .catch((err) => setMessage(err.message));
  }, [params.id]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!order) return;
    try {
      const updated = await updateVendorOrderStatus(order.id, status);
      setOrder(updated);
      setMessage("Status updated");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  if (!order) return <p>{message || "Loading order..."}</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Vendor Order #{order.id}</h1>
      <div className="rounded border bg-white p-4 text-sm">
        <p>Order reference: #{order.order}</p>
        <p>Shop: {order.shop_name || order.shop}</p>
        <p>Subtotal (NGN): {order.subtotal_ngn_cents}</p>
      </div>

      <div className="rounded border bg-white p-4">
        <h2 className="mb-2 font-semibold">Items</h2>
        <div className="space-y-2 text-sm">
          {order.items.map((item) => (
            <div key={item.id} className="rounded border p-2">
              <p>Title: {String(item.product_snapshot?.title ?? "-")}</p>
              <p>Qty: {item.qty}</p>
              <p>Line total (NGN): {item.line_total_ngn_cents}</p>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={onSubmit} className="rounded border bg-white p-4">
        <label className="mb-2 block text-sm font-medium">Update status</label>
        <div className="flex items-center gap-2">
          <select className="rounded border p-2" value={status} onChange={(e) => setStatus(e.target.value as VendorOrder["status"])}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <button className="rounded bg-blue-700 px-4 py-2 text-white" type="submit">
            Save
          </button>
        </div>
      </form>

      {message ? <p className="text-sm">{message}</p> : null}
    </div>
  );
}
