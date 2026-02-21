"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { login, me } from "@/lib/api";
import { useAppStore } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAppStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const tokens = await login({ email, password });
      localStorage.setItem("access_token", tokens.access);
      localStorage.setItem("refresh_token", tokens.refresh);
      const user = await me();
      setUser(user);
      router.push(user.is_vendor ? "/vendor" : "/shops");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-md space-y-3 rounded border bg-white p-4">
      <input className="w-full rounded border p-2" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input className="w-full rounded border p-2" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button className="rounded bg-blue-700 px-4 py-2 text-white" type="submit">Login</button>
    </form>
  );
}
