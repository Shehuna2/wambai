"use client";

import { useEffect, useState } from "react";

import { getWallet, topupInit } from "@/lib/api";

export default function WalletPage() {
  const [balances, setBalances] = useState<Array<{ currency: string; available_cents: number }>>([]);
  const [currency, setCurrency] = useState("NGN");
  const [amountMinor, setAmountMinor] = useState("10000");
  const [message, setMessage] = useState("");

  const refresh = async () => {
    try {
      const wallet = await getWallet();
      setBalances(wallet.balances);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to load wallet");
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Wallet</h1>
      <button className="rounded border px-3 py-1" onClick={refresh}>
        Refresh
      </button>
      <div className="grid gap-2 md:grid-cols-3">
        {balances.map((balance) => (
          <div key={balance.currency} className="rounded border bg-white p-3">
            <p className="text-sm text-slate-600">{balance.currency}</p>
            <p className="font-semibold">{balance.available_cents}</p>
          </div>
        ))}
      </div>

      <div className="max-w-md space-y-2 rounded bg-white p-4 shadow">
        <h2 className="font-semibold">Top up wallet</h2>
        <select className="w-full rounded border p-2" value={currency} onChange={(e) => setCurrency(e.target.value)}>
          {["NGN", "USD", "GHS", "XOF", "XAF", "GBP", "EUR"].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <input className="w-full rounded border p-2" value={amountMinor} onChange={(e) => setAmountMinor(e.target.value)} />
        <button
          className="rounded bg-blue-700 px-4 py-2 text-white"
          onClick={async () => {
            try {
              const data = await topupInit({ currency, amount_minor: Number(amountMinor) });
              setMessage(`Topup initialized: ${data.reference}`);
              window.open(data.checkout_url, "_blank", "noopener,noreferrer");
            } catch (err) {
              setMessage(err instanceof Error ? err.message : "Topup failed");
            }
          }}
        >
          Init topup
        </button>
      </div>
      {message ? <p className="text-sm">{message}</p> : null}
    </div>
  );
}
