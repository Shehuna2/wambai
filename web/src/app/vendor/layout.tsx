"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getMyShop, me } from "@/lib/api";
import { useAppStore } from "@/lib/store";

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser } = useAppStore();
  const [shopApproved, setShopApproved] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/login");
      return;
    }
    me().then((u) => {
      setUser(u);
      if (!u.is_vendor) return;
      getMyShop().then((s) => setShopApproved(s.is_approved)).catch(() => setShopApproved(null));
    }).catch(() => router.replace("/login"));
  }, [router, setUser]);

  if (!user) return <p>Loading...</p>;
  if (!user.is_vendor) return <p className="rounded bg-red-50 p-4 text-red-700">Access denied</p>;

  return (
    <div className="grid gap-6 md:grid-cols-[220px_1fr]">
      <aside className="rounded border bg-white p-4">
        <nav className="space-y-2 text-sm">
          <Link href="/vendor" className={pathname === "/vendor" ? "font-bold" : ""}>Dashboard</Link><br />
          <Link href="/vendor/shop" className={pathname.startsWith("/vendor/shop") ? "font-bold" : ""}>Shop</Link><br />
          <Link href="/vendor/products" className={pathname.startsWith("/vendor/products") ? "font-bold" : ""}>Products</Link><br />
          <Link href="/vendor/orders" className={pathname.startsWith("/vendor/orders") ? "font-bold" : ""}>Orders</Link>
        </nav>
      </aside>
      <section className="space-y-4">
        <span className={`inline-block rounded px-2 py-1 text-xs ${shopApproved ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
          Shop: {shopApproved === null ? "Not created" : shopApproved ? "Approved" : "Pending"}
        </span>
        {children}
      </section>
    </div>
  );
}
