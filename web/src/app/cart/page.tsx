// web/src/app/cart/page.tsx
"use client";


import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { checkout,  deleteCartItem, getCart, updateCartItem } from "@/lib/api";
import type { CartResponse } from "@/lib/types";

const SCALE = 1000n;

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/**
 * Quantity parsing/validation (kept identical behavior).
 */
function toMilliUnits(value: string): bigint {
  const cleaned = value.trim();
  if (!cleaned) return 0n;
  const [wholePart = "0", decimalPart = ""] = cleaned.split(".");
  if (!/^-?\d+$/.test(wholePart) || !/^\d*$/.test(decimalPart)) {
    throw new Error("invalid");
  }
  const sign = wholePart.startsWith("-") ? -1n : 1n;
  const whole = BigInt(wholePart || "0");
  const absWhole = whole < 0 ? -whole : whole;
  const decimals = BigInt((decimalPart + "000").slice(0, 3));
  return sign * (absWhole * SCALE + decimals);
}

function validateQty(qty: string, step: string): string {
  try {
    const qtyMilli = toMilliUnits(qty);
    if (qtyMilli <= 0n) return "Quantity must be greater than zero";
    const stepMilli = toMilliUnits(step);
    if (stepMilli <= 0n) return "Invalid step";
    if (qtyMilli % stepMilli !== 0n) return `Quantity must match step ${step}`;
    return "";
  } catch {
    return "Enter a valid quantity";
  }
}

/**
 * Money formatting (major units + humanized).
 * Cart API may not expose price; we guard usage.
 */
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

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "W";
  const b = parts[1]?.[0] ?? "";
  return (a + b).toUpperCase();
}

export default function CartPage() {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const [method, setMethod] = useState<"WALLET" | "FINCRA">("WALLET");
  const [walletCurrency, setWalletCurrency] = useState("NGN");
  const [qtyDrafts, setQtyDrafts] = useState<Record<number, string>>({});
  const [qtyErrors, setQtyErrors] = useState<Record<number, string>>({});

  async function load() {
    setStatus("");
    setLoading(true);
    try {
      const nextCart = await getCart();
      setCart(nextCart);

      const drafts: Record<number, string> = {};
      for (const group of Object.values(nextCart.grouped_by_shop)) {
        for (const item of group.items) drafts[item.id] = item.qty;
      }
      setQtyDrafts(drafts);
      setQtyErrors({});
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function findCartItem(itemId: number) {
    if (!cart) return null;
    for (const group of Object.values(cart.grouped_by_shop)) {
      const found = group.items.find((item) => item.id === itemId);
      if (found) return found;
    }
    return null;
  }

  async function onUpdate(itemId: number) {
    const item = findCartItem(itemId);
    if (!item) return;

    const qty = qtyDrafts[itemId] ?? item.qty;
    const error = validateQty(qty, item.product.qty_step);
    if (error) {
      setQtyErrors((prev) => ({ ...prev, [itemId]: error }));
      return;
    }

    const previousQty = item.qty;

    // optimistic UI
    setCart((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      for (const group of Object.values(next.grouped_by_shop)) {
        const found = group.items.find((i) => i.id === itemId);
        if (found) {
          found.qty = qty;
          break;
        }
      }
      return next;
    });
    setQtyErrors((prev) => ({ ...prev, [itemId]: "" }));

    try {
      await updateCartItem(itemId, { qty });
      await load();
    } catch (e) {
      // rollback
      setCart((prev) => {
        if (!prev) return prev;
        const next = structuredClone(prev);
        for (const group of Object.values(next.grouped_by_shop)) {
          const found = group.items.find((i) => i.id === itemId);
          if (found) {
            found.qty = previousQty;
            break;
          }
        }
        return next;
      });
      setQtyDrafts((prev) => ({ ...prev, [itemId]: previousQty }));
      setStatus((e as Error).message);
    }
  }

  async function onDelete(itemId: number) {
    setStatus("");
    try {
      await deleteCartItem(itemId);
      await load();
    } catch (e) {
      setStatus((e as Error).message);
    }
  }

  async function onCheckout() {
    setStatus("");
    setCheckoutLoading(true);
    try {
      const result = await checkout({
        payment_method: method,
        wallet_currency: method === "WALLET" ? walletCurrency : undefined,
      });

      if ("checkout_url" in result) {
        setStatus(`Order #${result.order_id} initialized. Opening payment checkout.`);
        window.open(result.checkout_url, "_blank", "noopener,noreferrer");
        return;
      }

      setStatus(`Checkout status: ${result.status}`);
      await load();
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setCheckoutLoading(false);
    }
  }

  const groups = useMemo(() => {
    if (!cart) return [];
    return Object.values(cart.grouped_by_shop);
  }, [cart]);

  const totalItems = useMemo(() => {
    let count = 0;
    for (const g of groups) count += g.items.length;
    return count;
  }, [groups]);

  // Best-effort total if product exposes currency + price_cents (guarded).
  const totalsByCurrency = useMemo(() => {
    const acc = new Map<string, number>();
    for (const g of groups) {
      for (const item of g.items) {
        const p: any = item.product as any;
        const currency: string | undefined = p.currency;
        const priceMinor: number | undefined = p.price_cents;
        if (!currency || typeof priceMinor !== "number") continue;

        // qty is string possibly with decimals; approximate total for display by using milli-units -> number major
        // We keep it conservative: if qty has decimals, we still multiply numerically.
        const qtyNum = Number(item.qty);
        const line = priceMinor * (Number.isFinite(qtyNum) ? qtyNum : 0);
        acc.set(currency, (acc.get(currency) ?? 0) + line);
      }
    }
    return Array.from(acc.entries()).map(([currency, minorTotal]) => ({
      currency,
      minorTotal,
    }));
  }, [groups]);

  const isEmpty = !loading && groups.length === 0;

  return (
    <section className="space-y-5 pb-24">
      {/* Header */}
      <div className="wb-shell p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="wb-pill">
              <span className="h-2 w-2 rounded-full bg-green-700" />
              <p className="text-xs font-extrabold uppercase tracking-wide text-green-800">Checkout</p>
            </div>

            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Cart
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Review grouped items, adjust quantity safely, and complete checkout.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
              {loading ? "Loading…" : `${totalItems} items`}
            </span>
            <button className="wb-btn-outline" type="button" onClick={load} disabled={loading}>
              Refresh
            </button>
          </div>
        </div>

        {status && (
          <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Status</p>
            <p className="mt-1 text-sm text-slate-700">{status}</p>
          </div>
        )}
      </div>

      {/* Empty */}
      {isEmpty && (
        <div className="wb-shell p-6">
          <p className="text-sm font-extrabold text-slate-900">Your cart is empty</p>
          <p className="mt-1 text-sm text-slate-600">Browse products and add items to begin checkout.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a className="wb-btn no-underline" href="/">
              Explore marketplace
            </a>
            <a className="wb-btn-outline no-underline" href="/shops">
              Browse shops
            </a>
          </div>
        </div>
      )}

      {/* Groups */}
      <div className="space-y-4">
        {loading &&
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="wb-shell p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-slate-100" />
                  <div>
                    <div className="h-4 w-44 rounded bg-slate-100" />
                    <div className="mt-3 h-3 w-56 rounded bg-slate-100" />
                  </div>
                </div>
                <div className="h-8 w-24 rounded-full bg-slate-100" />
              </div>
              <div className="mt-6 space-y-3">
                {Array.from({ length: 3 }).map((__, j) => (
                  <div key={j} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="h-3 w-40 rounded bg-slate-100" />
                    <div className="mt-3 h-3 w-28 rounded bg-slate-100" />
                  </div>
                ))}
              </div>
            </div>
          ))}

        {!loading &&
          groups.map((group) => (
            <div key={group.shop.id} className="wb-shell overflow-hidden">
              {/* Shop header */}
              <div className="border-b border-slate-200 bg-white p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-green-200 bg-green-50 text-sm font-extrabold text-green-800">
                      {initials(group.shop.name)}
                    </div>
                    <div>
                      <p className="text-base font-extrabold text-slate-900">{group.shop.name}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {group.items.length} item{group.items.length === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>

                  <Link href={`/shops/${group.shop.id}`} className="wb-btn-outline no-underline">
                    View shop
                  </Link>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-3 p-5">
                {group.items.map((item) => {
                  const draft = qtyDrafts[item.id] ?? item.qty;
                  const errorMsg = qtyErrors[item.id] ?? "";
                  const hasError = !!errorMsg;

                  const p: any = item.product as any;
                  const showPrice = typeof p?.price_cents === "number" && typeof p?.currency === "string";

                  return (
                    <div
                      key={item.id}
                      className={cx(
                        "rounded-2xl border bg-white p-4 shadow-sm",
                        hasError ? "border-rose-200" : "border-slate-200"
                      )}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-extrabold text-slate-900">{item.product.title}</p>
                          <p className="mt-1 text-xs text-slate-600">
                            Unit: <span className="font-semibold text-slate-900">{item.product.unit}</span> • Step:{" "}
                            <span className="font-semibold text-slate-900">{item.product.qty_step}</span>
                          </p>

                          {showPrice && (
                            <p className="mt-2 text-sm font-extrabold text-slate-900">
                              {formatMoneyFromMinor(p.currency, p.price_cents, { compact: true })}{" "}
                              <span className="text-xs font-semibold text-slate-600">per unit</span>
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col items-stretch gap-2 sm:items-end">
                          <label className="w-full sm:w-auto">
                            <span className="mb-1 block text-xs font-extrabold uppercase tracking-wide text-slate-700">
                              Quantity
                            </span>
                            <input
                              className={cx(
                                "wb-input w-full sm:w-40",
                                hasError && "border-rose-300 focus:border-rose-300 focus:ring-rose-100"
                              )}
                              value={draft}
                              onChange={(e) => {
                                const nextQty = e.target.value;
                                setQtyDrafts((prev) => ({ ...prev, [item.id]: nextQty }));
                                setQtyErrors((prev) => ({
                                  ...prev,
                                  [item.id]: validateQty(nextQty, item.product.qty_step),
                                }));
                              }}
                              onBlur={() => onUpdate(item.id)}
                            />
                          </label>

                          <div className="flex items-center justify-between gap-2 sm:justify-end">
                            <button
                              className="wb-btn-outline px-3 py-2 text-xs"
                              type="button"
                              onClick={() => onUpdate(item.id)}
                              disabled={!!validateQty(draft, item.product.qty_step)}
                            >
                              Save
                            </button>
                            <button
                              className="wb-btn-outline px-3 py-2 text-xs"
                              type="button"
                              onClick={() => onDelete(item.id)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>

                      {hasError && <p className="mt-2 text-xs font-semibold text-rose-700">{errorMsg}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
      </div>

      {/* Sticky checkout bar */}
      {!isEmpty && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto max-w-6xl px-4 py-4">
            <div className="wb-shell p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div className="flex flex-col gap-3 md:flex-row md:items-end">
                  <label className="md:w-56">
                    <span className="mb-1 block text-xs font-extrabold uppercase tracking-wide text-slate-700">
                      Method
                    </span>
                    <select
                      className="wb-input"
                      value={method}
                      onChange={(e) => setMethod(e.target.value as "WALLET" | "FINCRA")}
                    >
                      <option value="WALLET">WALLET</option>
                      <option value="FINCRA">FINCRA</option>
                    </select>
                  </label>

                  {method === "WALLET" && (
                    <label className="md:w-56">
                      <span className="mb-1 block text-xs font-extrabold uppercase tracking-wide text-slate-700">
                        Wallet currency
                      </span>
                      <select
                        className="wb-input"
                        value={walletCurrency}
                        onChange={(e) => setWalletCurrency(e.target.value)}
                      >
                        <option value="NGN">NGN</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="GHS">GHS</option>
                        <option value="XOF">XOF</option>
                        <option value="XAF">XAF</option>
                      </select>
                    </label>
                  )}

                  <div className="md:pl-2">
                    <p className="text-xs font-extrabold uppercase tracking-wide text-slate-700">Summary</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {totalItems} item{totalItems === 1 ? "" : "s"}
                    </p>
                    {totalsByCurrency.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-2">
                        {totalsByCurrency.map((t) => (
                          <span
                            key={t.currency}
                            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
                          >
                            {formatMoneyFromMinor(t.currency, Math.round(t.minorTotal), { compact: true })}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  className="wb-btn w-full md:w-auto"
                  onClick={onCheckout}
                  disabled={checkoutLoading || loading || totalItems === 0}
                  aria-busy={checkoutLoading}
                >
                  {checkoutLoading ? "Processing…" : "Checkout"}
                </button>
              </div>
            </div>

            <p className="mt-2 text-center text-xs text-slate-500">
              Quantity rules are enforced by product step settings.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}