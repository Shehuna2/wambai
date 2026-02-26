// web/src/app/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { listProducts } from "@/lib/api";
import type { Product } from "@/lib/types";

const CATEGORIES = ["", "clothing", "wool", "fabric", "other"] as const;
const SORTS = ["newest", "price_asc", "price_desc"] as const;

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
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

function titleCase(s: string) {
  if (!s) return s;
  return s[0].toUpperCase() + s.slice(1);
}

type HeroSlide = {
  src: string;
  alt: string;
  eyebrow: string;
  headline: string;
  sub: string;
};

function HeroSlider() {
  const slides: HeroSlide[] = useMemo(
    () => [
      {
        src: "https://images.unsplash.com/photo-1520975693411-6c2a5f4b39b8?auto=format&fit=crop&w=1600&q=80",
        alt: "Tailor measuring fabric",
        eyebrow: "Verified supply",
        headline: "Shop trusted vendors",
        sub: "Approved shops, clear units, consistent quality.",
      },
      {
        src: "https://images.unsplash.com/photo-1520975867597-0f1ed8a5a1a8?auto=format&fit=crop&w=1600&q=80",
        alt: "Colorful fabric rolls",
        eyebrow: "Unit-safe buying",
        headline: "Fabric, wool, clothing",
        sub: "Built for yard, meter, kg and piece rules.",
      },
      {
        src: "https://images.unsplash.com/photo-1520975914594-6e79d62a2e8f?auto=format&fit=crop&w=1600&q=80",
        alt: "Fashion items laid out",
        eyebrow: "Checkout ready",
        headline: "Wallet + gateway",
        sub: "Fast payment flows across supported currencies.",
      },
      {
        src: "https://images.unsplash.com/photo-1520975607364-4d8d2f8e4f2e?auto=format&fit=crop&w=1600&q=80",
        alt: "Packing items for shipping",
        eyebrow: "Track everything",
        headline: "Orders, status, dispatch",
        sub: "Buyer + vendor visibility from payment to delivery.",
      },
    ],
    []
  );

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<number | null>(null);

  const active = slides[index];

  function go(next: number) {
    setIndex((prev) => {
      const n = (prev + next) % slides.length;
      return n < 0 ? n + slides.length : n;
    });
  }

  useEffect(() => {
    if (paused) return;
    timerRef.current = window.setInterval(() => go(1), 5000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Marketplace highlights"
    >
      {/* Image */}
      <div className="relative aspect-[16/11] w-full bg-slate-100">
        <img
          key={active.src}
          src={active.src}
          alt={active.alt}
          className="h-full w-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        {/* No gradients: use solid overlays */}
        <div className="absolute inset-0 bg-black/35" />
        <div className="absolute left-0 top-0 m-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/35 px-3 py-1">
          <span className="h-2 w-2 rounded-full bg-green-400" />
          <p className="text-xs font-extrabold uppercase tracking-wide text-white">{active.eyebrow}</p>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5">
          <p className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
            {active.headline}
          </p>
          <p className="mt-1 text-sm text-white/85">{active.sub}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-1">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              className={cx(
                "h-2.5 w-2.5 rounded-full border",
                i === index ? "border-green-700 bg-green-700" : "border-slate-300 bg-white"
              )}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button type="button" className="wb-btn-outline px-3 py-2 text-xs" onClick={() => go(-1)}>
            Prev
          </button>
          <button type="button" className="wb-btn-outline px-3 py-2 text-xs" onClick={() => go(1)}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialQ = searchParams.get("q") ?? "";
  const initialCategory = searchParams.get("category") ?? "";
  const initialSort = (searchParams.get("sort") ?? "newest") as (typeof SORTS)[number];

  const [products, setProducts] = useState<Product[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
    listProducts({ q: debouncedQ || undefined, category: category || undefined })
      .then((data) => setProducts(data))
      .catch(() => setMessage("Unable to load products right now."))
      .finally(() => setLoading(false));
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

  const activeCategoryLabel = useMemo(() => {
    if (!category) return "All products";
    return titleCase(category);
  }, [category]);

  return (
    <section className="space-y-6 pb-10">
      <div className="grid gap-5 lg:grid-cols-12">
        {/* Sidebar */}
        <aside className="wb-shell lg:col-span-3">
          <div className="border-b border-slate-200 p-5">
            <div className="wb-pill">
              <span className="h-2 w-2 rounded-full bg-green-700" />
              <h2 className="text-xs font-extrabold uppercase tracking-wide text-green-800">
                Shop by Category
              </h2>
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-900">{activeCategoryLabel}</p>
            <p className="mt-1 text-xs text-slate-600">Filter the marketplace grid.</p>
          </div>

          <div className="space-y-2 p-5">
            {[
              { key: "", label: "All products" },
              { key: "clothing", label: "Clothing" },
              { key: "wool", label: "Wool" },
              { key: "fabric", label: "Fabric" },
              { key: "other", label: "Other" },
            ].map((item) => {
              const active = category === item.key;
              return (
                <button
                  key={item.key || "all"}
                  className={cx("w-full justify-between", active ? "wb-btn" : "wb-btn-outline")}
                  onClick={() => setCategory(item.key)}
                  type="button"
                >
                  <span>{item.label}</span>
                  <span
                    className={cx(
                      "ml-2 rounded-full px-2 py-0.5 text-[11px] font-extrabold",
                      active ? "bg-white/15 text-white" : "bg-slate-100 text-slate-700"
                    )}
                  >
                    {active ? "Active" : "View"}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main */}
        <div className="space-y-5 lg:col-span-9">
          <div className="wb-shell overflow-hidden p-6 md:p-8">
            <div className="grid gap-7 md:grid-cols-2">
              <div className="space-y-4">
                <div className="wb-pill">
                  <span className="h-2 w-2 rounded-full bg-green-700" />
                  <p className="text-xs font-extrabold uppercase tracking-wide text-green-800">
                    Wambai Marketplace
                  </p>
                </div>

                <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-4xl">
                  Trusted African fashion supply—clean discovery, clear pricing, fast checkout.
                </h1>

                <p className="text-sm leading-6 text-slate-600">
                  Browse approved shops, compare unit-based products, and pay using wallet or gateway flow—built for
                  buyers and vendors.
                </p>

                <div className="flex flex-wrap gap-2">
                  <Link href="/shops" className="wb-btn no-underline">
                    Browse Shops
                  </Link>
                  <Link href="/orders" className="wb-btn-outline no-underline">
                    Track Orders
                  </Link>
                </div>

                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {[
                    { k: "Verified vendors", v: "KYC-ready" },
                    { k: "Smart cart", v: "Unit-safe" },
                    { k: "Wallet checkout", v: "Multi-currency" },
                  ].map((x) => (
                    <div key={x.k} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-extrabold uppercase tracking-wide text-slate-700">{x.k}</p>
                      <p className="mt-2 text-lg font-extrabold text-slate-900">{x.v}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* NEW: Hero slider */}
              <HeroSlider />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {[
              { title: "Fast Dispatch", desc: "Vendors update order status in real time." },
              { title: "Secure Payments", desc: "Wallet and gateway checkout integration." },
              { title: "Decimal-safe Units", desc: "Built for yard, meter, kg and piece rules." },
            ].map((x) => (
              <div key={x.title} className="wb-shell p-5">
                <p className="text-sm font-bold text-slate-900">{x.title}</p>
                <p className="mt-1 text-sm text-slate-600">{x.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search / filters */}
      <div className="wb-shell p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <label className="flex-1">
            <span className="mb-1 block text-xs font-extrabold uppercase tracking-wide text-slate-700">Search</span>
            <input className="wb-input" placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>

          <label className="md:w-64">
            <span className="mb-1 block text-xs font-extrabold uppercase tracking-wide text-slate-700">Category</span>
            <select className="wb-input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((option) => (
                <option key={option || "all"} value={option}>
                  {option ? titleCase(option) : "All categories"}
                </option>
              ))}
            </select>
          </label>

          <label className="md:w-64">
            <span className="mb-1 block text-xs font-extrabold uppercase tracking-wide text-slate-700">Sort</span>
            <select className="wb-input" value={sort} onChange={(e) => setSort(e.target.value as (typeof SORTS)[number])}>
              {SORTS.map((option) => (
                <option key={option} value={option}>
                  {option === "newest" ? "Newest" : option === "price_asc" ? "Price: low to high" : "Price: high to low"}
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
          >
            Clear
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Featured Grid Products</h2>
            <p className="mt-1 text-sm text-slate-600">
              Prices shown in <span className="font-semibold text-slate-900">major units</span>.
            </p>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
            {sortedProducts.length} results
          </span>
        </div>

        {message && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
            <p className="text-sm font-semibold text-rose-700">{message}</p>
          </div>
        )}

        {!message && !loading && sortedProducts.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6">
            <p className="text-sm font-semibold text-slate-900">No products found</p>
            <p className="mt-1 text-sm text-slate-600">Try a different search term or category.</p>
          </div>
        )}

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {loading &&
            Array.from({ length: 8 }).map((_, i) => (
              <li key={i} className="wb-shell p-5">
                <div className="h-3 w-20 rounded bg-slate-100" />
                <div className="mt-3 h-4 w-36 rounded bg-slate-100" />
                <div className="mt-2 h-3 w-28 rounded bg-slate-100" />
                <div className="mt-5 h-9 w-full rounded-2xl bg-slate-100" />
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

                    <p className="mt-3 line-clamp-2 text-sm font-bold leading-5 text-slate-900">{product.title}</p>

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
                      <span className="rounded-full bg-green-700 px-3 py-1 text-xs font-extrabold text-white">View</span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
        </ul>
      </div>
    </section>
  );
}