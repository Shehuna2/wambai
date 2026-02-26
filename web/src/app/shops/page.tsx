// web/src/app/shops/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { listShops } from "@/lib/api";
import type { Shop } from "@/lib/types";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "W";
  const b = parts[1]?.[0] ?? "";
  return (a + b).toUpperCase();
}

export default function ShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    listShops()
      .then((data) => setShops(data))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return shops;

    return shops.filter((s) => {
      const name = (s.name ?? "").toLowerCase();
      const loc = (s.location ?? "").toLowerCase();
      return name.includes(needle) || loc.includes(needle);
    });
  }, [shops, q]);

  return (
    <section className="space-y-5 pb-10">
      {/* Header */}
      <div className="wb-shell p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="wb-pill">
              <span className="h-2 w-2 rounded-full bg-green-700" />
              <p className="text-xs font-extrabold uppercase tracking-wide text-green-800">
                Approved Vendors
              </p>
            </div>

            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Shops
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Browse verified Wambai vendor stores by location and open their live product catalogs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
              {loading ? "Loading…" : `${filtered.length} shops`}
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-end">
          <label className="flex-1">
            <span className="mb-1 block text-xs font-extrabold uppercase tracking-wide text-slate-700">
              Search
            </span>
            <input
              className="wb-input"
              placeholder="Search by shop name or location…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>

          <button className="wb-btn-outline md:self-end" type="button" onClick={() => setQ("")} disabled={!q}>
            Clear
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
            <p className="text-sm font-semibold text-rose-700">{error}</p>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-lg font-extrabold text-slate-900">Browse</h2>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
            {q ? "Filtered" : "All"}
          </span>
        </div>

        <ul className="grid gap-3 md:grid-cols-2">
          {loading &&
            Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="wb-shell p-5">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-slate-100" />
                  <div className="flex-1">
                    <div className="h-3 w-40 rounded bg-slate-100" />
                    <div className="mt-3 h-3 w-56 rounded bg-slate-100" />
                    <div className="mt-5 h-7 w-24 rounded-full bg-slate-100" />
                  </div>
                </div>
              </li>
            ))}

          {!loading &&
            filtered.map((shop) => (
              <li key={shop.id} className="wb-shell overflow-hidden">
                <Link href={`/shops/${shop.id}`} className="block no-underline">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-green-200 bg-green-50 text-sm font-extrabold text-green-800">
                          {initials(shop.name)}
                        </div>

                        <div>
                          <p className="text-base font-extrabold leading-6 text-slate-900">{shop.name}</p>
                          <p className="mt-1 text-sm text-slate-600">
                            {shop.location || "Location not specified"}
                          </p>
                        </div>
                      </div>

                      <span className="rounded-full border border-green-200 bg-green-50 px-2 py-1 text-[10px] font-extrabold uppercase text-green-800">
                        Open
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold text-slate-700">View catalog</p>
                      <span className="rounded-full bg-green-700 px-3 py-1 text-xs font-extrabold text-white">
                        Open shop
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 bg-white px-5 py-3">
                    <p className="text-xs text-slate-600">
                      Tap to explore products and pricing.
                    </p>
                  </div>
                </Link>
              </li>
            ))}

          {!loading && !error && filtered.length === 0 && (
            <li className="wb-shell p-6 md:col-span-2">
              <p className="text-sm font-extrabold text-slate-900">No shops found</p>
              <p className="mt-1 text-sm text-slate-600">Try a different search term or clear the filter.</p>
              <div className="mt-4">
                <button className="wb-btn-outline" type="button" onClick={() => setQ("")}>
                  Clear search
                </button>
              </div>
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}