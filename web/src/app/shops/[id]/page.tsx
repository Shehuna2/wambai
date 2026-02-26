"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getShop, listProducts } from "@/lib/api";
import type { Product, Shop } from "@/lib/types";

const CATEGORIES = ["", "clothing", "wool", "fabric", "other"] as const;
const SORTS = ["newest", "price_asc", "price_desc"] as const;

export default function ShopDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const initialCategory = searchParams.get("category") ?? "";
  const initialSort = searchParams.get("sort") ?? "newest";

  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");
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
      .catch((e) => setError((e as Error).message));
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
    <section className="space-y-4">
      {shop && (
        <div className="wb-shell p-5">
          <h1 className="text-2xl font-extrabold text-slate-900">{shop.name}</h1>
          <p className="mt-1 text-sm text-gray-600">{shop.location || "Location not specified"}</p>
        </div>
      )}
      {error && <p className="text-red-600">{error}</p>}
      <div className="wb-shell flex flex-wrap items-center gap-2 p-4">
        <input
          className="min-w-64 flex-1 rounded-full border border-green-200 bg-white px-4 py-2"
          placeholder="Search this shop..."
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
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sortedProducts.map((product) => (
          <li key={product.id} className="wb-shell p-4">
            <Link href={`/products/${product.id}`} className="block space-y-2 no-underline">
              <p className="text-xs font-semibold uppercase tracking-wide text-green-700">{product.category}</p>
              <p className="font-semibold text-slate-900">{product.title}</p>
              <p className="text-sm text-gray-600">Unit: {product.unit}</p>
              <p className="text-base font-bold text-green-700">{product.currency} {product.price_cents}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
