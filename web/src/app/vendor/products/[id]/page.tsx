"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ProductForm } from "@/components/vendor/ProductForm";
import { getMyProduct, updateMyProduct } from "@/lib/api";
import type { Product } from "@/lib/types";

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyProduct(params.id)
      .then(setProduct)
      .catch((err) => setError(err.message));
  }, [params.id]);

  if (!product) return <p>{error || "Loading product..."}</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Edit Product</h1>
      <ProductForm
        initial={product}
        submitLabel="Save changes"
        error={error}
        onSubmit={async (values) => {
          setError("");
          try {
            await updateMyProduct(params.id, values);
            router.push("/vendor/products");
          } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update product");
          }
        }}
      />
    </div>
  );
}
