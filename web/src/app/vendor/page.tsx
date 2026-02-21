"use client";

import { useEffect } from "react";

import { useAppStore } from "@/lib/store";

export default function VendorPage() {
  const { user, refreshMe, logout } = useAppStore();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token && !user) {
      refreshMe().catch(() => logout());
    }
  }, [logout, refreshMe, user]);

  if (!user?.is_vendor) {
    return <p className="rounded bg-red-50 p-4 text-red-700">Access denied. Vendor account required.</p>;
  }

  return <p className="rounded bg-white p-4 shadow">Vendor dashboard coming next.</p>;
}
