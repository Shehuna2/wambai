"use client";

import { useEffect, useMemo, useState } from "react";

import { checkout, deleteCartItem, getCart, updateCartItem } from "@/lib/api";
import type { CartGroup } from "@/lib/types";

export default function CartPage() {
  const [groups, setGroups] = useState<Record<string, CartGroup>>({});
  const [message, setMessage] = useState("");

  const refresh = () => {
    getCart()
      .then((data) => setGroups(data.grouped_by_shop))
      .catch((err) => setMessage(err.message));
  };

  useEffect(() => {
    refresh();
  }, []);

  const total = useMemo(() => {
    return Object.values(groups).flatMap((g) => g.items).reduce((sum, item) => sum + item.product.price_cents * Number(item.qty), 0);
  }, [groups]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Cart</h1>
      {Object.values(groups).map((group) => (
        <div key={group.shop.id} className="rounded border bg-white p-4">
          <h2 className="font-semibold">{group.shop.name}</h2>
          <div className="space-y-2">
            {group.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 border-b py-2">
                <div>
                  <p>{item.product.title}</p>
                  <p className="text-sm text-slate-600">
                    {item.product.currency} {item.product.price_cents / 100}
                  </p>
                </div>
                <input
                  className="w-24 rounded border p-1"
                  defaultValue={item.qty}
                  onBlur={async (e) => {
                    try {
                      await updateCartItem(item.id, { qty: e.target.value });
                      refresh();
                    } catch (err) {
                      setMessage(err instanceof Error ? err.message : "Update failed");
                    }
                  }}
                />
                <button
                  className="rounded bg-red-600 px-3 py-1 text-white"
                  onClick={async () => {
                    try {
                      await deleteCartItem(item.id);
                      refresh();
                    } catch (err) {
                      setMessage(err instanceof Error ? err.message : "Delete failed");
                    }
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
      <p className="font-semibold">Estimated total: NGN {total / 100}</p>
      <button
        className="rounded bg-green-700 px-4 py-2 text-white"
        onClick={async () => {
          try {
            const result = await checkout({ payment_method: "WALLET", wallet_currency: "NGN" });
            setMessage(`Checkout response: ${JSON.stringify(result)}`);
            refresh();
          } catch (err) {
            setMessage(err instanceof Error ? err.message : "Checkout failed");
          }
        }}
      >
        Checkout (Wallet NGN)
      </button>
      {message ? <p className="text-sm">{message}</p> : null}
    </div>
  );
}
