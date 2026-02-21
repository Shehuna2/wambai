"use client";

import { create } from "zustand";

import type { User } from "./types";

type Store = {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
};

export const useAppStore = create<Store>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    set({ user: null });
  },
}));
