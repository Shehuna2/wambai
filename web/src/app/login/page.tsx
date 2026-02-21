"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const { setTokens, refreshMe } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const data = await login({ email, password });
      setTokens(data.access, data.refresh);
      await refreshMe();
      router.push("/shops");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-3">
      <h1 className="text-xl font-semibold">Login</h1>
      <input className="w-full rounded border p-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input
        className="w-full rounded border p-2"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="rounded bg-blue-600 px-4 py-2 text-white">Login</button>
    </form>
  );
}
