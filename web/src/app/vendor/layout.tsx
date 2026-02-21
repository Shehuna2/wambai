"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getMyShop, listMyProducts } from "@/lib/api";
import { useAppStore } from "@/lib/store";

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, refreshMe } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [shopApproved, setShopApproved] = useState<boolean | null>(null);
  const [approvedProducts, setApprovedProducts] = useState(0);
  const [pendingProducts, setPendingProducts] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    refreshMe()
      .then(() => setLoading(false))
      .catch(() => router.replace("/login"));
  }, [refreshMe, router]);

  useEffect(() => {
    if (!user?.is_vendor) return;

    getMyShop()
      .then((shop) => setShopApproved(shop ? shop.is_approved : null))
      .catch(() => setShopApproved(null));

    listMyProducts()
      .then((products) => {
        setApprovedProducts(products.filter((item) => item.is_approved).length);
        setPendingProducts(products.filter((item) => !item.is_approved).length);
      })
      .catch(() => {
        setApprovedProducts(0);
        setPendingProducts(0);
      });
  }, [user?.is_vendor]);

  if (loading) return <p>Loading vendor dashboard...</p>;
  if (!user?.is_vendor) {
    return <p className="rounded bg-red-50 p-4 text-red-700">Access denied. Vendor account required.</p>;
  }

  const links = [
    { href: "/vendor/shop", label: "Shop" },
    { href: "/vendor/products", label: "Products" },
    { href: "/vendor/orders", label: "Orders" },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-[220px_1fr]">
      <aside className="rounded border bg-white p-4">
        <h2 className="mb-3 font-semibold">Vendor</h2>
        <nav className="space-y-2 text-sm">
          <Link href="/vendor" className={pathname === "/vendor" ? "font-bold" : ""}>
            Dashboard
          </Link>
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={pathname.startsWith(link.href) ? "font-bold" : ""}>
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>

      <section className="space-y-4">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className={`rounded px-2 py-1 ${shopApproved ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
            Shop: {shopApproved === null ? "Not created" : shopApproved ? "Approved" : "Pending approval"}
          </span>
          <span className="rounded bg-slate-100 px-2 py-1 text-slate-700">Products approved: {approvedProducts}</span>
          <span className="rounded bg-slate-100 px-2 py-1 text-slate-700">Products pending: {pendingProducts}</span>
        </div>
        {children}
      </section>
    </div>
  );
}
