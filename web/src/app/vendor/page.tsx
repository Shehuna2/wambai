"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/store";

export default function VendorPage() {
  const { user, refreshMe, accessToken } = useAuthStore();

  useEffect(() => {
    if (accessToken && !user) refreshMe();
  }, [accessToken, user, refreshMe]);

  if (!user?.is_vendor) {
    return <p className="text-red-600">Access denied. Vendor account required.</p>;
  }

  return <h1 className="text-xl font-semibold">Vendor dashboard coming next</h1>;
}
