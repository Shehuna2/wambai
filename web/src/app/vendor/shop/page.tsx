"use client";

import { useEffect, useState } from "react";
import { getMyShop, upsertMyShop } from "@/lib/api";
import type { Shop } from "@/lib/types";

export default function VendorShopPage() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [form, setForm] = useState({ name: "", description: "", location: "", logo_url: "", is_active: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getMyShop().then((s) => {
      if (s) {
        setShop(s);
        setForm({ name: s.name, description: s.description, location: s.location, logo_url: s.logo_url, is_active: s.is_active });
      }
    }).finally(() => setLoading(false));
  }, []);

  async function submit() {
    setSaving(true);
    setMessage("");
    try {
      const saved = await upsertMyShop(form);
      setShop(saved);
      setMessage("Shop saved");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">My shop</h1>
      {shop && <p className="text-sm">Status: <span className={`rounded px-2 py-1 ${shop.is_approved ? "bg-green-100" : "bg-yellow-100"}`}>{shop.is_approved ? "Approved" : "Pending approval"}</span></p>}
      <div className="space-y-2 rounded border bg-white p-4">
        <input className="w-full rounded border p-2" placeholder="Shop name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <textarea className="w-full rounded border p-2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input className="w-full rounded border p-2" placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        <input className="w-full rounded border p-2" placeholder="Logo URL" value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} />
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active</label>
        <button onClick={submit} disabled={saving} className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50">{saving ? "Saving..." : shop ? "Update shop" : "Create shop"}</button>
      </div>
      {message && <p>{message}</p>}
    </div>
  );
}
