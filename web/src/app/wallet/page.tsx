// web/src/app/wallet/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { getWallet, topupInit } from "@/lib/api";
import type { WalletResponse } from "@/lib/types";

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

function formatMoneyFromMinor(
  currency: string,
  minor: number,
  opts?: { compact?: boolean; sign?: "auto" | "always" | "never" }
) {
  const major = minorToMajor(currency, minor);

  const signDisplay =
    opts?.sign === "always" ? "always" : opts?.sign === "never" ? "never" : "auto";

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      notation: opts?.compact ? "compact" : "standard",
      compactDisplay: "short",
      maximumFractionDigits: currencyMinorDigits(currency),
      signDisplay,
    }).format(major);
  } catch {
    const digits = currencyMinorDigits(currency);
    const n = major.toFixed(digits);
    return signDisplay === "never" ? `${currency} ${n}` : `${currency} ${major < 0 ? "-" : ""}${n}`;
  }
}

function humanizeDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  const now = Date.now();
  const diffMs = d.getTime() - now;
  const abs = Math.abs(diffMs);

  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  let rel: string;
  if (abs < hour) rel = rtf.format(Math.round(diffMs / minute), "minute");
  else if (abs < day) rel = rtf.format(Math.round(diffMs / hour), "hour");
  else rel = rtf.format(Math.round(diffMs / day), "day");

  const absolute = d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${rel} • ${absolute}`;
}

function safeInt(s: string) {
  const v = Number(s);
  if (!Number.isFinite(v)) return 0;
  return Math.trunc(v);
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
    const amount = safeInt(amountMinor);
    if (amount < 1) {
      setMessage("Enter a valid amount.");
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
      <div className="wb-shell p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="wb-pill">
              <span className="h-2 w-2 rounded-full bg-green-700" />
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--wb-green-700)" }}>
                Wambai Wallet
              </p>
            </div>

            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Top up, track, and pay securely.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Multi-currency wallet with human-friendly balances and activity.
            </p>
          </div>

          <button className="wb-btn-outline" onClick={load} aria-busy={loading} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {message && (
          <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Status</p>
            <p className="mt-1 text-sm text-slate-700">{message}</p>
          </div>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-8">
          <div className="wb-shell p-5">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Wallet balances</h2>
                <p className="mt-1 text-xs text-slate-600">Major units, compact + exact.</p>
              </div>
              <span className="hidden rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 sm:inline-flex">
                Live snapshot
              </span>
            </div>

            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {(wallet?.balances ?? []).map((b) => (
                <li
                  key={b.currency}
                  className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--wb-green-700)" }}>
                        {b.currency}
                      </p>
                      <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
                        {formatMoneyFromMinor(b.currency, b.available_cents, { compact: true })}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        Exact:{" "}
                        <span className="font-semibold text-slate-900">
                          {formatMoneyFromMinor(b.currency, b.available_cents)}
                        </span>
                      </p>
                    </div>

                    <div className="mt-1 h-9 w-9 rounded-2xl border border-green-200 bg-green-50 p-2">
                      <div className="h-full w-full rounded-xl bg-green-700 opacity-90" />
                    </div>
                  </div>
                </li>
              ))}

              {!loading && !(wallet?.balances ?? []).length && (
                <li className="rounded-2xl border border-slate-200 bg-white p-5 sm:col-span-2 xl:col-span-3">
                  <p className="text-sm font-semibold text-slate-900">No balances yet</p>
                  <p className="mt-1 text-sm text-slate-600">Top up to see balances.</p>
                </li>
              )}
            </ul>
          </div>

          <div className="wb-shell p-5">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Recent transactions</h2>
                <p className="mt-1 text-xs text-slate-600">Humanized time + major-unit amounts.</p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
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
                        <div className={cx("h-full w-full rounded-xl", isCredit ? "bg-green-700" : "bg-slate-400")} />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-slate-900">{entry.type}</p>
                        <p className="mt-0.5 text-xs text-slate-600">
                          {entry.currency} • {humanizeDateTime(entry.created_at)}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">Ref: {entry.reference}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-center">
                      <p className={cx("text-sm font-extrabold tracking-tight", isCredit ? "text-green-800" : "text-rose-600")}>
                        {formatMoneyFromMinor(entry.currency, entry.amount_cents, { compact: true, sign: "always" })}
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
                  <p className="mt-1 text-sm text-slate-600">Activity will appear here after your first top-up/payment.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-5 lg:col-span-4">
          <div className="wb-shell p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Top up wallet</h2>
                <p className="mt-1 text-xs text-slate-600">
                  Enter minor units (API), we’ll preview the major-unit value.
                </p>
              </div>
              <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold" style={{ color: "var(--wb-green-700)" }}>
                Secure
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-700">Currency</span>
                <select className="wb-input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
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
                  className="wb-input"
                  placeholder="e.g. 5000"
                  value={amountMinor}
                  onChange={(e) => setAmountMinor(e.target.value)}
                />
              </label>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold text-slate-700">Preview (major units)</p>
                <p className="mt-1 text-sm font-extrabold tracking-tight text-slate-900">
                  {formatMoneyFromMinor(currency, safeInt(amountMinor) || 0, { compact: false, sign: "never" })}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold text-slate-700">Quick amounts</p>
                <div className="grid grid-cols-2 gap-2">
                  {quickAmounts.map((amt) => (
                    <button
                      key={amt}
                      className="wb-btn-outline px-3 py-2 text-xs"
                      onClick={() => setAmountMinor(String(amt))}
                      type="button"
                    >
                      {formatMoneyFromMinor(currency, amt, { compact: true, sign: "never" })}
                    </button>
                  ))}
                </div>
              </div>

              <button className="wb-btn w-full" onClick={onTopup} aria-busy={topupLoading} disabled={topupLoading || loading}>
                {topupLoading ? "Initializing…" : "Top up"}
              </button>
            </div>
          </div>

          <div className="wb-shell p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold uppercase tracking-wide" style={{ color: "var(--wb-green-700)" }}>
                Wallet Tips
              </h3>
              <span className="h-2 w-2 rounded-full bg-green-700" aria-hidden="true" />
            </div>

            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                Use <span className="font-semibold text-slate-900">NGN</span> for instant wallet checkout where possible.
              </li>
              <li className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                Non-NGN wallet checkout remains pending until conversion webhook success.
              </li>
              <li className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                Stored in minor units, displayed in major units (human-friendly).
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
