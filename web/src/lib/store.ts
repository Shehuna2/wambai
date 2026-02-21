"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { me } from "./api";
import type { User } from "./types";

type Mode = "BUYER" | "VENDOR";

type AppState = {
  user: User | null;
  mode: Mode;
  accessToken: string | null;
  refreshToken: string | null;
  setMode: (mode: Mode) => void;
  setTokens: (access: string, refresh: string) => void;
  logout: () => void;
  refreshMe: () => Promise<void>;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      mode: "BUYER",
      accessToken: null,
      refreshToken: null,
      setMode: (mode) => set({ mode }),
      setTokens: (access, refresh) => {
        localStorage.setItem("access_token", access);
        localStorage.setItem("refresh_token", refresh);
        set({ accessToken: access, refreshToken: refresh });
      },
      logout: () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        set({ user: null, accessToken: null, refreshToken: null, mode: "BUYER" });
      },
      refreshMe: async () => {
        const user = await me();
        set({ user });
      },
    }),
    {
      name: "wambai-web-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        mode: state.mode,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
