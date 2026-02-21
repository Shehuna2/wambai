"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { login } from "@/lib/api";
import { useAppStore } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const { setTokens, refreshMe } = useAppStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const data = await login({ email, password });
      setTokens(data.access, data.refresh);
      await refreshMe();
      router.push("/shops");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-3 rounded bg-white p-4 shadow">
      <h1 className="text-xl font-semibold">Login</h1>
      <input className="w-full rounded border p-2" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input className="w-full rounded border p-2" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button className="w-full rounded bg-blue-700 p-2 text-white" type="submit">
        Login
      </button>
    </form>
  );
}
