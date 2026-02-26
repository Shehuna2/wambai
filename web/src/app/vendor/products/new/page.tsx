"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProduct, uploadImages } from "@/lib/api";
import VendorProductForm, { toFormState } from "@/components/vendor/VendorProductForm";

export default function NewVendorProductPage() {
  const router = useRouter();
  const [form, setForm] = useState(toFormState());
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload(files: File[]) {
    if (!files.length) return;
    setUploading(true);
    setError("");
    try {
      const urls = await uploadImages(files);
      setForm((prev) => ({ ...prev, image_urls: [...prev.image_urls, ...urls] }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

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
        image_urls: form.image_urls,
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
      <h1 className="text-2xl font-extrabold text-slate-900">New product</h1>
      {error && <p className="text-red-600">{error}</p>}
      <VendorProductForm
        value={form}
        onChange={setForm}
        onSubmit={submit}
        onUpload={handleUpload}
        loading={loading}
        uploading={uploading}
        actionLabel="Create product"
      />
    </div>
  );
}
