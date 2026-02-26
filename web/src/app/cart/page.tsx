"use client";

import { useEffect, useState } from "react";
import { checkout, deleteCartItem, getCart, updateCartItem } from "@/lib/api";
import type { CartResponse } from "@/lib/types";

const SCALE = 1000n;

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

export default function CartPage() {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [status, setStatus] = useState("");
  const [method, setMethod] = useState<"WALLET" | "FINCRA">("WALLET");
  const [walletCurrency, setWalletCurrency] = useState("NGN");
  const [qtyDrafts, setQtyDrafts] = useState<Record<number, string>>({});
  const [qtyErrors, setQtyErrors] = useState<Record<number, string>>({});

  async function load() {
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
    await deleteCartItem(itemId);
    await load();
  }

  async function onCheckout() {
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
    }
  }

  return (
    <section className="space-y-4">
      <div className="wb-shell p-5">
        <h1 className="text-2xl font-extrabold text-slate-900">Cart</h1>
        <p className="mt-1 text-sm text-gray-600">Review grouped items, adjust quantity safely, and complete checkout.</p>
      </div>
      {status && <p>{status}</p>}
      {cart &&
        Object.values(cart.grouped_by_shop).map((group) => (
          <div key={group.shop.id} className="wb-shell p-4">
            <h2 className="font-semibold text-slate-900">{group.shop.name}</h2>
            <ul className="space-y-2">
              {group.items.map((item) => (
                <li key={item.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-64">{item.product.title}</span>
                    <input
                      className="w-24 rounded-full border border-green-200 bg-white px-3 py-1"
                      value={qtyDrafts[item.id] ?? item.qty}
                      onChange={(e) => {
                        const nextQty = e.target.value;
                        setQtyDrafts((prev) => ({ ...prev, [item.id]: nextQty }));
                        setQtyErrors((prev) => ({ ...prev, [item.id]: validateQty(nextQty, item.product.qty_step) }));
                      }}
                      onBlur={() => onUpdate(item.id)}
                    />
                    <button className="wb-btn-outline px-3 py-1" onClick={() => onDelete(item.id)}>
                      Remove
                    </button>
                  </div>
                  {!!qtyErrors[item.id] && <p className="text-xs text-red-600">{qtyErrors[item.id]}</p>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      <div className="wb-shell flex flex-wrap items-center gap-2 p-4">
        <label className="text-sm">Method</label>
        <select
          className="rounded-full border border-green-200 bg-white px-4 py-2"
          value={method}
          onChange={(e) => setMethod(e.target.value as "WALLET" | "FINCRA")}
        >
          <option value="WALLET">WALLET</option>
          <option value="FINCRA">FINCRA</option>
        </select>
        {method === "WALLET" && (
          <>
            <label className="text-sm">Wallet currency</label>
            <select
              className="rounded-full border border-green-200 bg-white px-4 py-2"
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
          </>
        )}
        <button className="wb-btn" onClick={onCheckout}>
          Checkout
        </button>
      </div>
    </section>
  );
}
