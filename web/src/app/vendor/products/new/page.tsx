"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createProduct, getMyShop } from "@/lib/api";
import { ProductForm } from "@/components/vendor/ProductForm";

export default function NewProductPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Create Product</h1>
      <ProductForm
        submitLabel="Create product"
        error={error}
        onSubmit={async (values) => {
          setError("");
          try {
            const shop = await getMyShop();
            if (!shop) {
              setError("Create your shop first.");
              return;
            }

            await createProduct({
              shop: shop.id,
              title: values.title,
              description: values.description,
              category: values.category,
              unit: values.unit,
              price_minor: values.price_minor,
              currency: values.currency,
              stock_qty: values.stock_qty,
              min_order_qty: values.min_order_qty,
              qty_step: values.qty_step,
              image_urls: values.image_urls,
              is_active: values.is_active,
            });
            router.push("/vendor/products");
          } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create product");
          }
        }}
      />
    </div>
  );
}
