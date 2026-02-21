"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAuthStore } from "@/lib/store";

export default function Header() {
  const { user, mode, setMode, logout, refreshMe, accessToken } = useAuthStore();

  useEffect(() => {
    if (accessToken && !user) {
      refreshMe();
    }
  }, [accessToken, user, refreshMe]);

  return (
    <header className="border-b bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <Link href="/">Home</Link>
          <Link href="/shops">Shops</Link>
          <Link href="/cart">Cart</Link>
          <Link href="/wallet">Wallet</Link>
          {user?.is_vendor && <Link href="/vendor">Vendor</Link>}
        </div>
        <div className="flex items-center gap-3 text-sm">
          <select
            className="rounded border p-1"
            value={mode}
            onChange={(e) => setMode(e.target.value as "BUYER" | "VENDOR")}
            disabled={!user?.is_vendor && mode === "BUYER" ? false : !user?.is_vendor}
          >
            <option value="BUYER">Buyer</option>
            <option value="VENDOR" disabled={!user?.is_vendor}>
              Vendor
            </option>
          </select>

          {user ? (
            <>
              <span>{user.email}</span>
              <button className="rounded border px-2 py-1" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login">Login</Link>
              <Link href="/register">Register</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
