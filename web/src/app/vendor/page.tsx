"use client";

import { useEffect, useState } from "react";

import { getMyShop, listMyProducts, listVendorOrders } from "@/lib/api";

export default function VendorHome() {
  const [shop, setShop] = useState("Not created");
  const [approved, setApproved] = useState(0);
  const [pending, setPending] = useState(0);
  const [orders, setOrders] = useState(0);

  useEffect(() => {
    getMyShop().then((s) => setShop(s.is_approved ? "Approved" : "Pending")).catch(() => setShop("Not created"));
    listMyProducts().then((ps) => {
      setApproved(ps.filter((p) => p.is_active).length);
      setPending(ps.filter((p) => !p.is_active).length);
    });
    listVendorOrders().then((os) => setOrders(os.length));
  }, []);

  return <div className="grid gap-3 md:grid-cols-3"><div className="rounded bg-white p-4">Shop {shop}</div><div className="rounded bg-white p-4">Products active {approved} / paused {pending}</div><div className="rounded bg-white p-4">Orders {orders}</div></div>;
}
