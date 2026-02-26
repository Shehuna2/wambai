// app/(whatever)/wallet/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { getWallet, topupInit } from "@/lib/api";
import type { WalletResponse } from "@/lib/types";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function formatMinor(n: number) {
  if (!Number.isFinite(n)) return "0";
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n);
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function safeNumber(s: string) {
  const v = Number(s);
  return Number.isFinite(v) ? v : 0;
}

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [currency, setCurrency] = useState("NGN");
  const [amountMinor, setAmountMinor] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [topupLoading, setTopupLoading] = useState(false);

  const quickAmounts = useMemo(() => [1000, 5000, 10000, 50000], []);
  const supportedCurrencies = useMemo(() => ["NGN", "XOF", "XAF", "GHS", "USD", "GBP", "EUR"], []);

  async function load() {
    setMessage("");
    setLoading(true);
    try {
      setWallet(await getWallet());
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onTopup() {
    setMessage("");
    const amount = safeNumber(amountMinor);
    if (!amount || amount < 1) {
      setMessage("Enter a valid amount in minor units.");
      return;
    }

    setTopupLoading(true);
    try {
      const data = await topupInit({ currency, amount_minor: amount });
      window.open(data.checkout_url, "_blank", "noopener,noreferrer");
      setMessage(`Topup initialized: ${data.reference}`);
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setTopupLoading(false);
    }
  }

  return (
    <section className="space-y-5">
      {/* Header */}
      <div className="wb-shell p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-white px-3 py-1">
              <span className="h-2 w-2 rounded-full bg-green-600" />
              <p className="text-xs font-semibold uppercase tracking-wide text-green-700">Wambai Wallet</p>
            </div>

            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Top up, track, and pay securely.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Multi-currency wallet experience with clean balances, recent activity, and fast top-ups — all in one place.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              className={cx("wb-btn-outline", loading && "pointer-events-none opacity-60")}
              onClick={load}
              aria-busy={loading}
            >
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>

        {/* Status message */}
        {message && (
          <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3">
            <p className="text-sm font-medium text-slate-900">Status</p>
            <p className="mt-1 text-sm text-slate-700">{message}</p>
          </div>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        {/* Main column */}
        <div className="space-y-5 lg:col-span-8">
          {/* Balances */}
          <div className="wb-shell p-5">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Wallet balances</h2>
                <p className="mt-1 text-xs text-slate-600">Displayed in minor units.</p>
              </div>
              <div className="hidden sm:block">
                <span className="rounded-full border border-green-200 bg-white px-3 py-1 text-xs font-semibold text-green-700">
                  Live snapshot
                </span>
              </div>
            </div>

            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {(wallet?.balances ?? []).map((b) => (
                <li
                  key={b.currency}
                  className="group rounded-2xl border border-green-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-green-700">{b.currency}</p>
                      <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
                        {formatMinor(b.available_cents)}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">Available (minor)</p>
                    </div>
                    <div className="mt-1 h-9 w-9 rounded-2xl border border-green-200 bg-green-50 p-2">
                      <div className="h-full w-full rounded-xl bg-green-600 opacity-90" />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                    <p className="text-xs font-medium text-slate-700">Currency</p>
                    <p className="text-xs font-semibold text-slate-900">{b.currency}</p>
                  </div>
                </li>
              ))}

              {!loading && !(wallet?.balances ?? []).length && (
                <li className="rounded-2xl border border-slate-200 bg-white p-5 sm:col-span-2 xl:col-span-3">
                  <p className="text-sm font-semibold text-slate-900">No balances yet</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Once you top up, your balances will appear here.
                  </p>
                </li>
              )}

              {loading && (
                <>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <li key={i} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="h-3 w-16 rounded bg-slate-100" />
                      <div className="mt-3 h-7 w-32 rounded bg-slate-100" />
                      <div className="mt-2 h-3 w-24 rounded bg-slate-100" />
                      <div className="mt-4 h-9 w-full rounded-2xl bg-slate-100" />
                    </li>
                  ))}
                </>
              )}
            </ul>
          </div>

          {/* Recent transactions */}
          <div className="wb-shell p-5">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Recent transactions</h2>
                <p className="mt-1 text-xs text-slate-600">Latest activity across all currencies.</p>
              </div>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                {(wallet?.recent_ledger ?? []).length} total
              </span>
            </div>

            <div className="space-y-2">
              {(wallet?.recent_ledger ?? []).slice(0, 12).map((entry) => {
                const isCredit = entry.amount_cents >= 0;
                return (
                  <div
                    key={entry.reference}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cx(
                          "mt-0.5 h-10 w-10 rounded-2xl border p-2",
                          isCredit ? "border-green-200 bg-green-50" : "border-slate-200 bg-slate-50"
                        )}
                        aria-hidden="true"
                      >
                        <div
                          className={cx(
                            "h-full w-full rounded-xl",
                            isCredit ? "bg-green-600" : "bg-slate-400"
                          )}
                        />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-slate-900">{entry.type}</p>
                        <p className="mt-0.5 text-xs text-slate-600">
                          {entry.currency} • {formatDateTime(entry.created_at)}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">Ref: {entry.reference}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-center">
                      <p
                        className={cx(
                          "text-sm font-extrabold tracking-tight",
                          isCredit ? "text-green-700" : "text-rose-600"
                        )}
                      >
                        {isCredit ? "+" : ""}
                        {formatMinor(entry.amount_cents)}
                      </p>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                        {entry.status}
                      </span>
                    </div>
                  </div>
                );
              })}

              {!loading && !wallet?.recent_ledger?.length && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-sm font-semibold text-slate-900">No transaction history yet</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Your most recent ledger entries will show up here after your first top-up or payment.
                  </p>
                </div>
              )}

              {loading && (
                <>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-2xl bg-slate-100" />
                          <div>
                            <div className="h-3 w-28 rounded bg-slate-100" />
                            <div className="mt-2 h-3 w-44 rounded bg-slate-100" />
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="h-3 w-20 rounded bg-slate-100" />
                          <div className="mt-2 h-3 w-16 rounded bg-slate-100" />
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Side column */}
        <div className="space-y-5 lg:col-span-4">
          {/* Top up */}
          <div className="wb-shell p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Top up wallet</h2>
                <p className="mt-1 text-xs text-slate-600">Initialize checkout for selected currency and amount.</p>
              </div>
              <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                Secure checkout
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-700">Currency</span>
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-sm outline-none transition focus:border-green-300 focus:ring-2 focus:ring-green-100"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  {supportedCurrencies.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-700">Amount (minor units)</span>
                <input
                  inputMode="numeric"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-sm outline-none transition focus:border-green-300 focus:ring-2 focus:ring-green-100"
                  placeholder="e.g. 5000"
                  value={amountMinor}
                  onChange={(e) => setAmountMinor(e.target.value)}
                />
              </label>

              <div>
                <p className="mb-2 text-xs font-semibold text-slate-700">Quick amounts</p>
                <div className="grid grid-cols-2 gap-2">
                  {quickAmounts.map((amt) => (
                    <button
                      key={amt}
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm transition hover:border-green-200 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-100"
                      onClick={() => setAmountMinor(String(amt))}
                      type="button"
                    >
                      {amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <button
                className={cx(
                  "wb-btn w-full",
                  (topupLoading || loading) && "pointer-events-none opacity-70"
                )}
                onClick={onTopup}
                aria-busy={topupLoading}
              >
                {topupLoading ? "Initializing…" : "Top up"}
              </button>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold text-slate-700">Heads up</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Amounts are submitted in <span className="font-semibold text-slate-900">minor units</span>. Make sure
                  you’re using the right scale for the selected currency.
                </p>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="wb-shell p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-green-700">Wallet Tips</h3>
              <span className="h-2 w-2 rounded-full bg-green-600" aria-hidden="true" />
            </div>

            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                Use <span className="font-semibold text-slate-900">NGN</span> for instant wallet checkout where possible.
              </li>
              <li className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                Non-NGN wallet checkout remains pending until conversion webhook success.
              </li>
              <li className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                All balances are stored and displayed in minor units.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}