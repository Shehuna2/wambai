"use client";

import { useEffect, useState } from "react";
import { getVendorOrder, updateVendorOrderStatus } from "@/lib/api";
import type { VendorOrder } from "@/lib/types";

const statuses: VendorOrder["status"][] = ["NEW", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

export default function VendorOrderDetailPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<VendorOrder | null>(null);
  const [status, setStatus] = useState<VendorOrder["status"]>("NEW");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getVendorOrder(params.id)
      .then((data) => {
        setOrder(data);
        setStatus(data.status);
      })
      .catch((e) => setMessage((e as Error).message))
      .finally(() => setLoading(false));
  }, [params.id]);

  async function submit() {
    setSaving(true);
    setMessage("");
    try {
      const updated = await updateVendorOrderStatus(params.id, status);
      setOrder(updated);
      setMessage("Status updated");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Loading...</p>;
  if (!order) return <p>{message || "Order not found"}</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Vendor order #{order.id}</h1>
      <div className="rounded border bg-white p-4 text-sm">
        <p>Order ref: {order.order}</p>
        <p>Buyer: {order.buyer_email ?? "-"}</p>
        <p>Shop: {order.shop_name ?? order.shop}</p>
        <p>Subtotal (NGN minor): {order.subtotal_ngn_cents}</p>
      </div>
      <div className="rounded border bg-white p-4">
        <h2 className="mb-2 font-medium">Items</h2>
        <ul className="space-y-2 text-sm">
          {(order.items ?? []).map((item) => (
            <li key={item.id} className="rounded border p-2">
              <p>{item.product_snapshot?.title ?? "Item"}</p>
              <p>Qty: {item.qty}</p>
              <p>Line total: {item.line_total_ngn_cents}</p>
            </li>
          ))}
          {!(order.items ?? []).length && <li>No item details available.</li>}
        </ul>
      </div>
      <div className="flex items-center gap-2">
        <select className="rounded border p-2" value={status} onChange={(e) => setStatus(e.target.value as VendorOrder["status"])}>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button disabled={saving} onClick={submit} className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50">{saving ? "Saving..." : "Update status"}</button>
      </div>
      {message && <p>{message}</p>}
    </div>
  );
}
