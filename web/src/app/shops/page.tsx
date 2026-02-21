"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { listShops } from "@/lib/api";
import type { Shop } from "@/lib/types";

export default function ShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    listShops().then(setShops).catch((err) => setError(err.message));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Shops</h1>
      {error ? <p className="text-red-600">{error}</p> : null}
      <div className="grid gap-3 md:grid-cols-2">
        {shops.map((shop) => (
          <Link key={shop.id} href={`/shops/${shop.id}`} className="rounded border bg-white p-4 shadow-sm">
            <h2 className="font-semibold">{shop.name}</h2>
            <p className="text-sm text-slate-600">{shop.location}</p>
            <p className="text-sm text-slate-700 line-clamp-2">{shop.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
