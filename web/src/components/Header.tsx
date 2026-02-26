"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAuthStore } from "@/lib/store";
import ThemeToggle from "@/components/ThemeToggle";

export default function Header() {
  const { user, mode, setMode, logout, refreshMe, accessToken } = useAuthStore();

  useEffect(() => {
    if (accessToken && !user) {
      refreshMe();
    }
  }, [accessToken, user, refreshMe]);

  return (
    <header className="sticky top-0 z-40 border-b border-green-100 bg-white/95 backdrop-blur">
      <div className="border-b border-green-100 bg-green-600 text-xs text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between p-2">
          <p>Wambai Marketplace: trusted shops, tracked orders, wallet checkout.</p>
          <ThemeToggle />
        </div>
      </div>
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-5">
          <Link href="/" className="no-underline">
            <span className="rounded-full bg-green-600 px-4 py-2 text-lg font-extrabold text-white">WAMBAI</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
            <Link href="/" className="no-underline">Home</Link>
            <Link href="/shops" className="no-underline">Shops</Link>
            <Link href="/cart" className="no-underline">Cart</Link>
            <Link href="/orders" className="no-underline">Orders</Link>
            <Link href="/wallet" className="no-underline">Wallet</Link>
            {user?.is_staff && <Link href="/admin/audit" className="no-underline">Audit</Link>}
            {user?.is_vendor && <Link href="/vendor" className="no-underline">Vendor</Link>}
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <select
            className="rounded-full border border-green-200 bg-white px-3 py-2"
            value={mode}
            onChange={(e) => setMode(e.target.value as "BUYER" | "VENDOR")}
            disabled={!user?.is_vendor}
          >
            <option value="BUYER">Buyer</option>
            <option value="VENDOR" disabled={!user?.is_vendor}>Vendor</option>
          </select>
          {user ? (
            <>
              <span className="rounded-full bg-green-50 px-3 py-2 text-green-800">{user.email}</span>
              <button className="wb-btn-outline" onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <Link href="/login" className="wb-btn-outline no-underline">Login</Link>
              <Link href="/register" className="wb-btn no-underline">Register</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
