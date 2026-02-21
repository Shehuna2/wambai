"use client";

import { useEffect, useState } from "react";
import { getMyProduct, updateMyProduct } from "@/lib/api";
import VendorProductForm, { toFormState } from "@/components/vendor/VendorProductForm";

export default function EditVendorProductPage({ params }: { params: { id: string } }) {
  const [form, setForm] = useState(toFormState());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyProduct(params.id).then((p) => setForm(toFormState(p))).catch((e) => setError((e as Error).message)).finally(() => setLoading(false));
  }, [params.id]);

  async function submit() {
    setSaving(true);
    setError("");
    try {
      await updateMyProduct(params.id, {
        title: form.title,
        description: form.description,
        category: form.category,
        unit: form.unit,
        price_minor: form.price_minor,
        currency: form.currency,
        stock_qty: form.stock_qty,
        min_order_qty: form.min_order_qty,
        qty_step: form.qty_step,
        image_urls: form.image_urls.split(",").map((x) => x.trim()).filter(Boolean),
        is_active: form.is_active,
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">Edit product</h1>
      {error && <p className="text-red-600">{error}</p>}
      <VendorProductForm value={form} onChange={setForm} onSubmit={submit} loading={saving} actionLabel="Save changes" />
    </div>
  );
}
