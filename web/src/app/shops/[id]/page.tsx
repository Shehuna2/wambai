// web/src/app/shops/[id]/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getShop, listProducts } from "@/lib/api";
import type { Product, Shop } from "@/lib/types";

const CATEGORIES = ["", "clothing", "wool", "fabric", "other"] as const;
const SORTS = ["newest", "price_asc", "price_desc"] as const;

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function titleCase(s: string) {
  if (!s) return s;
  return s[0].toUpperCase() + s.slice(1);
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "W";
  const b = parts[1]?.[0] ?? "";
  return (a + b).toUpperCase();
}

function currencyMinorDigits(currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).resolvedOptions()
      .maximumFractionDigits;
  } catch {
    return 2;
  }
}

function minorToMajor(currency: string, minor: number) {
  const digits = currencyMinorDigits(currency);
  return minor / Math.pow(10, digits);
}

function formatMoneyFromMinor(currency: string, minor: number, opts?: { compact?: boolean }) {
  const major = minorToMajor(currency, minor);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      notation: opts?.compact ? "compact" : "standard",
      compactDisplay: "short",
      maximumFractionDigits: currencyMinorDigits(currency),
    }).format(major);
  } catch {
    return `${currency} ${major.toFixed(2)}`;
  }
}

export default function ShopDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialQ = searchParams.get("q") ?? "";
  const initialCategory = searchParams.get("category") ?? "";
  const initialSort = (searchParams.get("sort") ?? "newest") as (typeof SORTS)[number];

  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState(initialQ);
  const [debouncedQ, setDebouncedQ] = useState(initialQ);
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState(initialSort);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQ(q), 300);
    return () => window.clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    setError("");
    setLoading(true);

    Promise.all([
      getShop(params.id),
      listProducts({
        shop: params.id,
        q: debouncedQ || undefined,
        category: category || undefined,
      }),
    ])
      .then(([shopData, productData]) => {
        setShop(shopData);
        setProducts(productData);
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [params.id, debouncedQ, category]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams.toString());
    if (q) next.set("q", q);
    else next.delete("q");

    if (category) next.set("category", category);
    else next.delete("category");

    if (sort && sort !== "newest") next.set("sort", sort);
    else next.delete("sort");

    const nextQuery = next.toString();
    const currentQuery = searchParams.toString();
    if (nextQuery !== currentQuery) {
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
    }
  }, [q, category, sort, pathname, router, searchParams]);

  const sortedProducts = useMemo(() => {
    const cloned = [...products];
    if (sort === "price_asc") cloned.sort((a, b) => a.price_cents - b.price_cents);
    else if (sort === "price_desc") cloned.sort((a, b) => b.price_cents - a.price_cents);
    else cloned.sort((a, b) => b.id - a.id);
    return cloned;
  }, [products, sort]);

  return (
    <section className="space-y-5 pb-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/shops" className="font-semibold text-slate-700 no-underline hover:text-slate-900">
          Shops
        </Link>
        <span className="text-slate-400">/</span>
        <span className="font-semibold text-slate-900">{shop?.name ?? "Shop"}</span>
      </div>

      {/* Header */}
      <div className="wb-shell p-6">
        {loading && !shop ? (
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-3xl bg-slate-100" />
            <div className="flex-1">
              <div className="h-4 w-52 rounded bg-slate-100" />
              <div className="mt-3 h-3 w-72 rounded bg-slate-100" />
              <div className="mt-5 h-8 w-28 rounded-full bg-slate-100" />
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl border border-green-200 bg-green-50 text-base font-extrabold text-green-800">
                  {initials(shop?.name ?? "Wambai")}
                </div>

                <div>
                  <div className="wb-pill">
                    <span className="h-2 w-2 rounded-full bg-green-700" />
                    <p className="text-xs font-extrabold uppercase tracking-wide text-green-800">Vendor store</p>
                  </div>

                  <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
                    {shop?.name}
                  </h1>
                  <p className="mt-1 text-sm text-slate-600">
                    {shop?.location || "Location not specified"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-800">
                  Open
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                  {loading ? "Loading…" : `${sortedProducts.length} products`}
                </span>
              </div>
            </div>

            {error && (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                <p className="text-sm font-semibold text-rose-700">{error}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Filters */}
      <div className="wb-shell p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <label className="flex-1">
            <span className="mb-1 block text-xs font-extrabold uppercase tracking-wide text-slate-700">
              Search this shop
            </span>
            <input
              className="wb-input"
              placeholder="Search products…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>

          <label className="md:w-64">
            <span className="mb-1 block text-xs font-extrabold uppercase tracking-wide text-slate-700">
              Category
            </span>
            <select className="wb-input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((option) => (
                <option key={option || "all"} value={option}>
                  {option ? titleCase(option) : "All categories"}
                </option>
              ))}
            </select>
          </label>

          <label className="md:w-64">
            <span className="mb-1 block text-xs font-extrabold uppercase tracking-wide text-slate-700">
              Sort
            </span>
            <select
              className="wb-input"
              value={sort}
              onChange={(e) => setSort(e.target.value as (typeof SORTS)[number])}
            >
              {SORTS.map((option) => (
                <option key={option} value={option}>
                  {option === "newest"
                    ? "Newest"
                    : option === "price_asc"
                      ? "Price: low to high"
                      : "Price: high to low"}
                </option>
              ))}
            </select>
          </label>

          <button
            className="wb-btn-outline md:self-end"
            onClick={() => {
              setQ("");
              setCategory("");
              setSort("newest");
            }}
            type="button"
            disabled={!q && !category && sort === "newest"}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-lg font-extrabold text-slate-900">Catalog</h2>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
            Major units
          </span>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {loading &&
            Array.from({ length: 9 }).map((_, i) => (
              <li key={i} className="wb-shell p-5">
                <div className="h-3 w-20 rounded bg-slate-100" />
                <div className="mt-3 h-4 w-40 rounded bg-slate-100" />
                <div className="mt-2 h-3 w-28 rounded bg-slate-100" />
                <div className="mt-5 h-10 w-full rounded-2xl bg-slate-100" />
              </li>
            ))}

          {!loading &&
            sortedProducts.map((product) => (
              <li key={product.id} className="wb-shell overflow-hidden">
                <Link href={`/products/${product.id}`} className="block no-underline">
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full border border-green-200 bg-green-50 px-2 py-1 text-[10px] font-extrabold uppercase text-green-800">
                        {product.category}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-extrabold uppercase text-slate-700">
                        {product.unit}
                      </span>
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm font-bold leading-5 text-slate-900">
                      {product.title}
                    </p>

                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <p className="text-xs font-semibold text-slate-600">Price</p>
                      <p className="mt-1 text-base font-extrabold tracking-tight text-slate-900">
                        {formatMoneyFromMinor(product.currency, product.price_cents, { compact: true })}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        Exact:{" "}
                        <span className="font-semibold text-slate-900">
                          {formatMoneyFromMinor(product.currency, product.price_cents)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700">Open</span>
                      <span className="rounded-full bg-green-700 px-3 py-1 text-xs font-extrabold text-white">
                        View
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}

          {!loading && !error && sortedProducts.length === 0 && (
            <li className="wb-shell p-6 sm:col-span-2 lg:col-span-3">
              <p className="text-sm font-extrabold text-slate-900">No products found</p>
              <p className="mt-1 text-sm text-slate-600">Try a different search term or clear your filters.</p>
              <div className="mt-4">
                <button
                  className="wb-btn-outline"
                  type="button"
                  onClick={() => {
                    setQ("");
                    setCategory("");
                    setSort("newest");
                  }}
                >
                  Clear filters
                </button>
              </div>
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}