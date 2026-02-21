"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAppStore } from "@/lib/store";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, mode, setMode, logout, refreshMe } = useAppStore();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token && !user) {
      refreshMe().catch(() => logout());
    }
  }, [logout, refreshMe, user]);

  const nav = [
    { href: "/", label: "Home" },
    { href: "/shops", label: "Shops" },
    { href: "/cart", label: "Cart" },
    { href: "/wallet", label: "Wallet" },
  ];

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-4">
          <span className="text-lg font-semibold text-slate-900">Wambai Web</span>
          <nav className="flex items-center gap-3 text-sm">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className={pathname === item.href ? "font-bold" : ""}>
                {item.label}
              </Link>
            ))}
            {user?.is_vendor ? <Link href="/vendor">Vendor</Link> : null}
          </nav>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <select
            className="rounded border border-slate-300 px-2 py-1"
            value={mode}
            onChange={(e) => {
              const nextMode = e.target.value as "BUYER" | "VENDOR";
              if (nextMode === "VENDOR" && !user?.is_vendor) return;
              setMode(nextMode);
            }}
          >
            <option value="BUYER">Buyer</option>
            <option value="VENDOR" disabled={!user?.is_vendor}>
              Vendor
            </option>
          </select>

          {user ? (
            <>
              <span>{user.email}</span>
              <button
                className="rounded bg-slate-900 px-3 py-1 text-white"
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
              >
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
      </div>
    </header>
  );
}
