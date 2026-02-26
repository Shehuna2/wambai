"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listShops } from "@/lib/api";
import type { Shop } from "@/lib/types";

export default function ShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    listShops().then(setShops).catch((e) => setError((e as Error).message));
  }, []);

  return (
    <section className="space-y-4">
      <div className="wb-shell p-5">
        <h1 className="text-2xl font-extrabold text-slate-900">Shops</h1>
        <p className="mt-1 text-sm text-gray-600">Browse approved Wambai vendor stores by location and open their live product catalogs.</p>
      </div>
      {error && <p className="text-red-600">{error}</p>}
      <ul className="grid gap-3 md:grid-cols-2">
        {shops.map((shop) => (
          <li key={shop.id} className="wb-shell p-4">
            <Link href={`/shops/${shop.id}`} className="block space-y-2 no-underline">
              <p className="text-lg font-semibold text-slate-900">{shop.name}</p>
              <p className="text-sm text-gray-600">{shop.location || "Location not specified"}</p>
              <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">Open shop</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
