"use client";

import { FormEvent, useEffect, useState } from "react";

import { createMyShop, getMyShop, updateMyShop } from "@/lib/api";

export default function VendorShopPage() {
  const [exists, setExists] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [status, setStatus] = useState("Not created");
  const [message, setMessage] = useState("");

  useEffect(() => {
    getMyShop().then((s) => {
      setExists(true);
      setName(s.name);
      setDescription(s.description);
      setLocation(s.location);
      setLogoUrl(s.logo_url);
      setIsActive(s.is_active);
      setStatus(s.is_approved ? "Approved" : "Pending approval");
    }).catch(() => setExists(false));
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const payload = { name, description, location, logo_url: logoUrl, is_active: isActive };
    try {
      const shop = exists ? await updateMyShop(payload) : await createMyShop(payload);
      setExists(true);
      setStatus(shop.is_approved ? "Approved" : "Pending approval");
      setMessage("Shop saved");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed");
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm">Status: {status}</p>
      <form onSubmit={submit} className="space-y-2 rounded border bg-white p-4">
        <input className="w-full rounded border p-2" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required />
        <textarea className="w-full rounded border p-2" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
        <input className="w-full rounded border p-2" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" />
        <input className="w-full rounded border p-2" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="Logo URL" />
        <label className="flex gap-2 text-sm"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Shop active</label>
        <button className="rounded bg-blue-700 px-4 py-2 text-white" type="submit">Save Shop</button>
      </form>
      {message ? <p>{message}</p> : null}
    </div>
  );
}
