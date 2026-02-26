"use client";

import { useEffect, useState } from "react";

import { listWalletAdjustmentsAudit, listWebhookEventsAudit } from "@/lib/api";
import type { WalletAdjustmentAudit, WebhookEventAudit } from "@/lib/types";

export default function AuditPage() {
  const [adjustments, setAdjustments] = useState<WalletAdjustmentAudit[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookEventAudit[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([listWalletAdjustmentsAudit(), listWebhookEventsAudit()])
      .then(([a, w]) => {
        setAdjustments(a);
        setWebhooks(w);
      })
      .catch((e) => setError((e as Error).message));
  }, []);

  return (
    <section className="space-y-4">
      <div className="wb-shell p-5">
        <h1 className="text-2xl font-extrabold text-slate-900">Audit Logs</h1>
      </div>
      {error && <p>{error}</p>}

      <div className="space-y-2">
        <h2 className="text-lg font-medium">Wallet adjustments</h2>
        <div className="wb-shell overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b bg-green-50 text-left">
              <tr>
                <th className="p-2">Reference</th>
                <th>User</th>
                <th>Amount</th>
                <th>Reason</th>
                <th>Admin</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {adjustments.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="p-2">{row.reference}</td>
                  <td>{row.wallet_user_email}</td>
                  <td>{row.currency} {row.amount_cents}</td>
                  <td>{row.reason}</td>
                  <td>{row.created_by_email}</td>
                  <td>{new Date(row.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-medium">Webhook events</h2>
        <div className="wb-shell overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b bg-green-50 text-left">
              <tr>
                <th className="p-2">Provider</th>
                <th>Event ID</th>
                <th>Received</th>
                <th>Payload</th>
              </tr>
            </thead>
            <tbody>
              {webhooks.map((row) => (
                <tr key={row.id} className="border-t align-top">
                  <td className="p-2">{row.provider}</td>
                  <td>{row.event_id}</td>
                  <td>{new Date(row.received_at).toLocaleString()}</td>
                  <td className="max-w-md whitespace-pre-wrap break-all p-2 text-xs">
                    {JSON.stringify(row.payload)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
