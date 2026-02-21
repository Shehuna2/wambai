"use client";

import { create } from "zustand";
import { me } from "@/lib/api";
import type { User } from "@/lib/types";

type Mode = "BUYER" | "VENDOR";

type AuthState = {
  user: User | null;
  mode: Mode;
  accessToken: string | null;
  refreshToken: string | null;
  setTokens: (access: string, refresh: string) => void;
  setMode: (mode: Mode) => void;
  logout: () => void;
  refreshMe: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  mode: typeof window !== "undefined" ? ((localStorage.getItem("mode") as Mode) ?? "BUYER") : "BUYER",
  accessToken: typeof window !== "undefined" ? localStorage.getItem("access_token") : null,
  refreshToken: typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null,
  setTokens: (access, refresh) => {
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    set({ accessToken: access, refreshToken: refresh });
  },
  setMode: (mode) => {
    localStorage.setItem("mode", mode);
    set({ mode });
  },
  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    set({ user: null, accessToken: null, refreshToken: null, mode: "BUYER" });
  },
  refreshMe: async () => {
    try {
      const user = await me();
      set({ user });
    } catch {
      set({ user: null });
    }
  },
}));
