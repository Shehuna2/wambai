"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ProductForm } from "@/components/vendor/ProductForm";
import { getMyProduct, updateMyProduct } from "@/lib/api";
import type { Product } from "@/lib/types";

export default function EditVendorProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyProduct(params.id).then(setProduct).catch((err) => setError(err.message));
  }, [params.id]);

  if (!product) return <p>{error || "Loading..."}</p>;

  return <ProductForm initial={product} error={error} onSubmit={async (payload) => {
    try {
      await updateMyProduct(params.id, payload);
      router.push("/vendor/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }} />;
}
