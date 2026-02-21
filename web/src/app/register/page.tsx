"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { register } from "@/lib/api";
import { useAppStore } from "@/lib/store";

export default function RegisterPage() {
  const router = useRouter();
  const { setTokens, refreshMe } = useAppStore();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isVendor, setIsVendor] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const data = await register({ email, phone: phone || undefined, password, is_vendor: isVendor });
      setTokens(data.access, data.refresh);
      await refreshMe();
      router.push("/shops");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    }
  };

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-3 rounded bg-white p-4 shadow">
      <h1 className="text-xl font-semibold">Register</h1>
      <input className="w-full rounded border p-2" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input className="w-full rounded border p-2" placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <input className="w-full rounded border p-2" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isVendor} onChange={(e) => setIsVendor(e.target.checked)} />
        Register as vendor
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button className="w-full rounded bg-blue-700 p-2 text-white" type="submit">
        Create account
      </button>
    </form>
  );
}
