"use client";

import { FormEvent, useEffect, useState } from "react";

import { getMyShop, upsertMyShop } from "@/lib/api";

export default function VendorShopPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [status, setStatus] = useState("Not created");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getMyShop()
      .then((shop) => {
        if (!shop) {
          setLoading(false);
          return;
        }
        setName(shop.name);
        setDescription(shop.description);
        setLocation(shop.location);
        setLogoUrl(shop.logo_url);
        setStatus(shop.is_approved ? "Approved" : "Pending approval");
        setLoading(false);
      })
      .catch((err) => {
        setMessage(err.message);
        setLoading(false);
      });
  }, []);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    try {
      const shop = await upsertMyShop({ name, description, location, logo_url: logoUrl });
      setStatus(shop.is_approved ? "Approved" : "Pending approval");
      setMessage("Shop saved");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to save shop");
    }
  };

  if (loading) return <p>Loading shop...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My Shop</h1>
      <span className={`inline-block rounded px-2 py-1 text-xs ${status === "Approved" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
        {status}
      </span>

      <form onSubmit={onSubmit} className="space-y-3 rounded border bg-white p-4">
        <input className="w-full rounded border p-2" placeholder="Shop name" value={name} onChange={(e) => setName(e.target.value)} required />
        <textarea className="w-full rounded border p-2" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <input className="w-full rounded border p-2" placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
        <input className="w-full rounded border p-2" placeholder="Logo URL" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
        <button className="rounded bg-blue-700 px-4 py-2 text-white" type="submit">
          Save shop
        </button>
      </form>
      {message ? <p className="text-sm">{message}</p> : null}
    </div>
  );
}
