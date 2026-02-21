"use client";

import { useEffect, useState } from "react";

import { getMyShop, listMyProducts, listVendorOrders } from "@/lib/api";

export default function VendorDashboardPage() {
  const [shopStatus, setShopStatus] = useState("Not created");
  const [productApproved, setProductApproved] = useState(0);
  const [productPending, setProductPending] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    getMyShop()
      .then((shop) => setShopStatus(shop ? (shop.is_approved ? "Approved" : "Pending") : "Not created"))
      .catch(() => setShopStatus("Not created"));

    listMyProducts()
      .then((products) => {
        setProductApproved(products.filter((product) => product.is_approved).length);
        setProductPending(products.filter((product) => !product.is_approved).length);
      })
      .catch(() => {
        setProductApproved(0);
        setProductPending(0);
      });

    listVendorOrders()
      .then((orders) => {
        const counts: Record<string, number> = { NEW: 0, PROCESSING: 0, SHIPPED: 0, DELIVERED: 0 };
        for (const order of orders) {
          counts[order.status] = (counts[order.status] ?? 0) + 1;
        }
        setStatusCounts(counts);
      })
      .catch(() => setStatusCounts({}));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Vendor Dashboard</h1>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded border bg-white p-4">
          <p className="text-sm text-slate-600">Shop status</p>
          <p className="text-xl font-semibold">{shopStatus}</p>
        </div>
        <div className="rounded border bg-white p-4">
          <p className="text-sm text-slate-600">Products</p>
          <p className="text-xl font-semibold">
            {productApproved} approved / {productPending} pending
          </p>
        </div>
        <div className="rounded border bg-white p-4">
          <p className="text-sm text-slate-600">Vendor orders</p>
          <p className="text-xs">NEW {statusCounts.NEW ?? 0}</p>
          <p className="text-xs">PROCESSING {statusCounts.PROCESSING ?? 0}</p>
          <p className="text-xs">SHIPPED {statusCounts.SHIPPED ?? 0}</p>
          <p className="text-xs">DELIVERED {statusCounts.DELIVERED ?? 0}</p>
        </div>
      </div>
    </div>
  );
}
