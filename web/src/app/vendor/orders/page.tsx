"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { listVendorOrders } from "@/lib/api";
import type { VendorOrder } from "@/lib/types";

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState<VendorOrder[]>([]);

  useEffect(() => {
    listVendorOrders().then(setOrders).catch(() => setOrders([]));
  }, []);

  return (
    <div className="overflow-auto rounded border bg-white">
      <table className="min-w-full text-sm">
        <thead><tr className="bg-slate-100"><th className="p-2 text-left">Order</th><th className="p-2">Shop</th><th className="p-2">Subtotal</th><th className="p-2">Status</th><th className="p-2">Action</th></tr></thead>
        <tbody>{orders.map((o) => <tr key={o.id} className="border-t"><td className="p-2">#{o.order}</td><td className="p-2">{o.shop_name}</td><td className="p-2">{o.subtotal_ngn_cents}</td><td className="p-2">{o.status}</td><td className="p-2"><Link href={`/vendor/orders/${o.id}`}>View</Link></td></tr>)}</tbody>
      </table>
    </div>
  );
}
