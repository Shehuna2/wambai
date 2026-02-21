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
    <section className="space-y-3">
      <h1 className="text-xl font-semibold">Shops</h1>
      {error && <p className="text-red-600">{error}</p>}
      <ul className="space-y-2">
        {shops.map((shop) => (
          <li key={shop.id} className="rounded border bg-white p-3">
            <Link href={`/shops/${shop.id}`} className="font-medium">
              {shop.name}
            </Link>
            <p className="text-sm text-gray-600">{shop.location}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
