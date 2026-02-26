"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { listProducts } from "@/lib/api";
import type { Product } from "@/lib/types";

const CATEGORIES = ["", "clothing", "wool", "fabric", "other"] as const;
const SORTS = ["newest", "price_asc", "price_desc"] as const;

export default function HomePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const initialCategory = searchParams.get("category") ?? "";
  const initialSort = searchParams.get("sort") ?? "newest";

  const [products, setProducts] = useState<Product[]>([]);
  const [message, setMessage] = useState("");
  const [q, setQ] = useState(initialQ);
  const [debouncedQ, setDebouncedQ] = useState(initialQ);
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState(initialSort);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQ(q), 300);
    return () => window.clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    setMessage("");
    listProducts({ q: debouncedQ || undefined, category: category || undefined })
      .then((data) => setProducts(data))
      .catch(() => setMessage("Unable to load products right now."));
  }, [debouncedQ, category]);

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
    <section className="space-y-5 pb-8">
      <div className="grid gap-4 lg:grid-cols-12">
        <aside className="wb-shell lg:col-span-3">
          <div className="border-b border-green-100 p-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-green-700">Shop by Category</h2>
          </div>
          <div className="space-y-2 p-4">
            <button className="wb-btn-outline w-full" onClick={() => setCategory("clothing")}>Clothing</button>
            <button className="wb-btn-outline w-full" onClick={() => setCategory("wool")}>Wool</button>
            <button className="wb-btn-outline w-full" onClick={() => setCategory("fabric")}>Fabric</button>
            <button className="wb-btn-outline w-full" onClick={() => setCategory("other")}>Other</button>
            <button className="wb-btn-outline w-full" onClick={() => setCategory("")}>All Products</button>
          </div>
        </aside>

        <div className="space-y-4 lg:col-span-9">
          <div className="wb-shell overflow-hidden p-6 md:p-8">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <p className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green-700">
                  Wambai Marketplace
                </p>
                <h1 className="text-3xl font-extrabold leading-tight text-slate-900 md:text-4xl">
                  Fresh marketplace grid for trusted African fashion supply.
                </h1>
                <p className="text-sm text-gray-600">
                  Discover approved shops, compare product units, and checkout with wallet or gateway flow.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link href="/shops" className="wb-btn no-underline">Browse Shops</Link>
                  <Link href="/orders" className="wb-btn-outline no-underline">Track Orders</Link>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
                  <p className="text-xs font-semibold uppercase text-green-700">Verified vendors</p>
                  <p className="mt-2 text-2xl font-extrabold text-slate-900">KYC-ready</p>
                </div>
                <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
                  <p className="text-xs font-semibold uppercase text-green-700">Smart cart</p>
                  <p className="mt-2 text-2xl font-extrabold text-slate-900">Step-safe qty</p>
                </div>
                <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
                  <p className="text-xs font-semibold uppercase text-green-700">Wallet checkout</p>
                  <p className="mt-2 text-2xl font-extrabold text-slate-900">Multi-currency</p>
                </div>
                <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
                  <p className="text-xs font-semibold uppercase text-green-700">Order tracking</p>
                  <p className="mt-2 text-2xl font-extrabold text-slate-900">Buyer + vendor</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="wb-shell p-4">
              <p className="text-sm font-semibold text-slate-900">Fast Dispatch</p>
              <p className="text-xs text-gray-600">Vendors update order status in real time.</p>
            </div>
            <div className="wb-shell p-4">
              <p className="text-sm font-semibold text-slate-900">Secure Payments</p>
              <p className="text-xs text-gray-600">Wallet and Fincra checkout integration support.</p>
            </div>
            <div className="wb-shell p-4">
              <p className="text-sm font-semibold text-slate-900">Decimal-safe Units</p>
              <p className="text-xs text-gray-600">Support for yard, meter, kg and piece rules.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="wb-shell flex flex-wrap items-center gap-2 p-4">
        <input
          className="min-w-64 flex-1 rounded-full border border-green-200 bg-white px-4 py-2"
          placeholder="Search products..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="rounded-full border border-green-200 bg-white px-4 py-2" value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((option) => (
            <option key={option || "all"} value={option}>
              {option ? option[0].toUpperCase() + option.slice(1) : "All categories"}
            </option>
          ))}
        </select>
        <select className="rounded-full border border-green-200 bg-white px-4 py-2" value={sort} onChange={(e) => setSort(e.target.value)}>
          {SORTS.map((option) => (
            <option key={option} value={option}>
              {option === "newest" ? "Newest" : option === "price_asc" ? "Price: low to high" : "Price: high to low"}
            </option>
          ))}
        </select>
        <button
          className="wb-btn-outline"
          onClick={() => {
            setQ("");
            setCategory("");
            setSort("newest");
          }}
        >
          Clear
        </button>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-bold text-slate-800">Featured Grid Products</h2>
        {message && <p className="text-sm text-red-600">{message}</p>}
        {!message && sortedProducts.length === 0 && <p className="text-sm text-gray-500">No products found.</p>}
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {sortedProducts.map((product) => (
            <li key={product.id} className="wb-shell overflow-hidden p-4">
              <Link href={`/products/${product.id}`} className="block space-y-2 no-underline">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-green-700">{product.category}</p>
                  <span className="rounded-full bg-green-100 px-2 py-1 text-[10px] font-semibold uppercase text-green-700">Hot</span>
                </div>
                <p className="font-semibold text-slate-900">{product.title}</p>
                <p className="text-sm text-gray-600">Unit: {product.unit}</p>
                <div className="flex items-center justify-between">
                  <p className="text-base font-bold text-green-700">{product.currency} {product.price_cents}</p>
                  <span className="rounded-full bg-green-600 px-2 py-1 text-xs font-semibold text-white">Open</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
