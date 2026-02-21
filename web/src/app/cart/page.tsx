"use client";

import { useEffect, useState } from "react";
import { checkout, deleteCartItem, getCart, updateCartItem } from "@/lib/api";
import type { CartResponse } from "@/lib/types";

export default function CartPage() {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [status, setStatus] = useState("");

  async function load() {
    try {
      setCart(await getCart());
    } catch (e) {
      setStatus((e as Error).message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onUpdate(itemId: number, qty: string) {
    await updateCartItem(itemId, { qty });
    await load();
  }

  async function onDelete(itemId: number) {
    await deleteCartItem(itemId);
    await load();
  }

  async function onCheckout() {
    try {
      const order = await checkout({ payment_method: "WALLET", wallet_currency: "NGN" });
      setStatus(`Checkout status: ${order.status}`);
      await load();
    } catch (e) {
      setStatus((e as Error).message);
    }
  }

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">Cart</h1>
      {status && <p>{status}</p>}
      {cart &&
        Object.values(cart.grouped_by_shop).map((group) => (
          <div key={group.shop.id} className="rounded border bg-white p-3">
            <h2 className="font-medium">{group.shop.name}</h2>
            <ul className="space-y-2">
              {group.items.map((item) => (
                <li key={item.id} className="flex items-center gap-2">
                  <span className="w-64">{item.product.title}</span>
                  <input
                    className="w-24 rounded border p-1"
                    defaultValue={item.qty}
                    onBlur={(e) => onUpdate(item.id, e.target.value)}
                  />
                  <button className="rounded border px-2 py-1" onClick={() => onDelete(item.id)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      <button className="rounded bg-green-600 px-4 py-2 text-white" onClick={onCheckout}>
        Checkout (Wallet NGN)
      </button>
    </section>
  );
}
