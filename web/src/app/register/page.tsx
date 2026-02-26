"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { register } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

export default function RegisterPage() {
  const router = useRouter();
  const { setTokens, refreshMe } = useAuthStore();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isVendor, setIsVendor] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const data = await register({ email, phone: phone || undefined, password, is_vendor: isVendor });
      setTokens(data.access, data.refresh);
      await refreshMe();
      router.push("/shops");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <form onSubmit={onSubmit} className="wb-shell mx-auto max-w-md space-y-3 p-6">
      <h1 className="text-2xl font-extrabold text-slate-900">Register</h1>
      <input className="w-full rounded-full border border-green-200 bg-white px-4 py-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="w-full rounded-full border border-green-200 bg-white px-4 py-2" placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <input
        className="w-full rounded-full border border-green-200 bg-white px-4 py-2"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={isVendor} onChange={(e) => setIsVendor(e.target.checked)} /> Register as vendor
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="wb-btn">Register</button>
    </form>
  );
}
