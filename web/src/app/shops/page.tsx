"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { listShops } from "@/lib/api";
import type { Shop } from "@/lib/types";

export default function ShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  useEffect(() => {
    listShops().then(setShops).catch(() => setShops([]));
  }, []);

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {shops.map((shop) => (
        <Link key={shop.id} href={`/shops/${shop.id}`} className="rounded border bg-white p-4">
          <h2 className="font-semibold">{shop.name}</h2>
          <p className="text-sm">{shop.location}</p>
          <p className="text-xs">{shop.is_active ? "Active" : "Paused"}</p>
        </Link>
      ))}
    </div>
  );
}
