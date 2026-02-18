import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { api } from '../api/client';
import { clearToken, readToken, saveMode, saveToken, readMode } from '../storage/local';
import { Mode } from '../types';

type AuthState = {
  token: string | null;
  mode: Mode;
  loading: boolean;
  setMode: (mode: Mode) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [mode, setModeState] = useState<Mode>('BUYER');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [storedToken, storedMode] = await Promise.all([readToken(), readMode()]);
      if (storedToken) setToken(storedToken);
      if (storedMode === 'BUYER' || storedMode === 'VENDOR') setModeState(storedMode);
      setLoading(false);
    })();
  }, []);

  const value = useMemo<AuthState>(() => ({
    token,
    mode,
    loading,
    setMode: async next => {
      setModeState(next);
      await saveMode(next);
    },
    login: async (email, password) => {
      const { data } = await api.post('/auth/login/', { email, password });
      setToken(data.access);
      await saveToken(data.access);
    },
    logout: async () => {
      setToken(null);
      await clearToken();
    }
  }), [loading, mode, token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
