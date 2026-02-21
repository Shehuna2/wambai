"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getMyShop, listMyProducts } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

const nav = [
  { href: "/vendor/shop", label: "Shop" },
  { href: "/vendor/products", label: "Products" },
  { href: "/vendor/orders", label: "Orders" },
];

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { accessToken, user, refreshMe } = useAuthStore();
  const [shopApproved, setShopApproved] = useState<boolean | null>(null);
  const [pendingProducts, setPendingProducts] = useState(0);

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
      return;
    }
    if (!user) refreshMe();
  }, [accessToken, refreshMe, router, user]);

  useEffect(() => {
    if (user?.is_vendor) {
      Promise.all([getMyShop(), listMyProducts()]).then(([shop, products]) => {
        setShopApproved(shop ? shop.is_approved : null);
        setPendingProducts(products.filter((p) => !p.is_approved).length);
      }).catch(() => {
        setShopApproved(null);
        setPendingProducts(0);
      });
    }
  }, [user]);

  if (!accessToken) return <p>Redirecting...</p>;
  if (!user) return <p>Loading vendor dashboard...</p>;
  if (!user.is_vendor) return <p className="text-red-600">Access denied. Vendor account required.</p>;

  return (
    <div className="grid grid-cols-12 gap-4">
      <aside className="col-span-3 rounded border bg-white p-3">
        <h2 className="mb-2 font-semibold">Vendor</h2>
        <nav className="space-y-2">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className={`block rounded px-2 py-1 ${pathname === item.href ? "bg-blue-100" : ""}`}>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <section className="col-span-9 space-y-3">
        <div className="flex gap-2 text-sm">
          <span className={`rounded px-2 py-1 ${shopApproved ? "bg-green-100" : "bg-yellow-100"}`}>
            Shop: {shopApproved === null ? "Not created" : shopApproved ? "Approved" : "Pending"}
          </span>
          <span className={`rounded px-2 py-1 ${pendingProducts ? "bg-yellow-100" : "bg-green-100"}`}>
            Pending products: {pendingProducts}
          </span>
        </div>
        {children}
      </section>
    </div>
  );
}
