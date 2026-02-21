"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProduct } from "@/lib/api";
import VendorProductForm, { toFormState } from "@/components/vendor/VendorProductForm";

export default function NewVendorProductPage() {
  const router = useRouter();
  const [form, setForm] = useState(toFormState());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setLoading(true);
    setError("");
    try {
      await createProduct({
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
      router.push("/vendor/products");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">New product</h1>
      {error && <p className="text-red-600">{error}</p>}
      <VendorProductForm value={form} onChange={setForm} onSubmit={submit} loading={loading} actionLabel="Create product" />
    </div>
  );
}
