"use client";

import Link from "next/link";
import { useEffect } from "react";

import { me } from "@/lib/api";
import { useAppStore } from "@/lib/store";

export function Header() {
  const { user, setUser, logout } = useAppStore();

  useEffect(() => {
    if (!localStorage.getItem("access_token")) return;
    me().then(setUser).catch(() => logout());
  }, [logout, setUser]);

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex gap-3 text-sm">
          <Link href="/">Home</Link>
          <Link href="/shops">Shops</Link>
          {user?.is_vendor ? <Link href="/vendor">Vendor</Link> : null}
        </div>
        <div className="flex gap-3 text-sm">
          {user ? (
            <>
              <span>{user.email}</span>
              <button onClick={logout} className="rounded bg-slate-900 px-2 py-1 text-white">Logout</button>
            </>
          ) : (
            <Link href="/login">Login</Link>
          )}
        </div>
      </div>
    </header>
  );
}
