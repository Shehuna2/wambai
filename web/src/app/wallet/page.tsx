"use client";

import { useEffect, useState } from "react";
import { getWallet, topupInit } from "@/lib/api";
import type { WalletResponse } from "@/lib/types";

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [currency, setCurrency] = useState("NGN");
  const [amountMinor, setAmountMinor] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    try {
      setWallet(await getWallet());
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onTopup() {
    setMessage("");
    try {
      const data = await topupInit({ currency, amount_minor: Number(amountMinor) });
      window.open(data.checkout_url, "_blank", "noopener,noreferrer");
      setMessage(`Topup initialized: ${data.reference}`);
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">Wallet</h1>
      <button className="rounded border px-3 py-1" onClick={load}>Refresh</button>
      <ul className="space-y-1">
        {wallet?.balances.map((b) => (
          <li key={b.currency}>{b.currency}: {b.available_cents}</li>
        ))}
      </ul>
      <div className="flex items-center gap-2">
        <select className="rounded border p-2" value={currency} onChange={(e) => setCurrency(e.target.value)}>
          {["NGN", "XOF", "XAF", "GHS", "USD", "GBP", "EUR"].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input
          className="rounded border p-2"
          placeholder="amount_minor"
          value={amountMinor}
          onChange={(e) => setAmountMinor(e.target.value)}
        />
        <button className="rounded bg-blue-600 px-3 py-2 text-white" onClick={onTopup}>Topup Init</button>
      </div>
      {message && <p>{message}</p>}
    </section>
  );
}
