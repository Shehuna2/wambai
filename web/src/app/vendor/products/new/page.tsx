"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ProductForm } from "@/components/vendor/ProductForm";
import { createProduct, getMyShop } from "@/lib/api";

export default function NewVendorProductPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  return <ProductForm error={error} onSubmit={async (payload) => {
    try {
      const shop = await getMyShop();
      await createProduct({ ...payload, shop: shop.id });
      router.push("/vendor/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }} />;
}
