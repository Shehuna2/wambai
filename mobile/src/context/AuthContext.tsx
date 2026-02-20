import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { api } from '../api/client';
import { clearToken, readMode, readToken, saveMode, saveToken } from '../storage/local';
import { AuthUser, Mode } from '../types';

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  mode: Mode;
  loading: boolean;
  setMode: (mode: Mode) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, phone: string, password: string, isVendor: boolean) => Promise<void>;
  refreshMe: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mode, setModeState] = useState<Mode>('BUYER');
  const [loading, setLoading] = useState(true);

  const refreshMe = async () => {
    const { data } = await api.get('/auth/me/');
    setUser(data);
  };

  useEffect(() => {
    (async () => {
      const [storedToken, storedMode] = await Promise.all([readToken(), readMode()]);
      if (storedToken) {
        setToken(storedToken);
        try {
          await refreshMe();
        } catch {
          setToken(null);
          setUser(null);
          await clearToken();
        }
      }
      if (storedMode === 'BUYER' || storedMode === 'VENDOR') setModeState(storedMode);
      setLoading(false);
    })();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      token,
      user,
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
        await refreshMe();
      },
      register: async (email, phone, password, isVendor) => {
        const { data } = await api.post('/auth/register/', {
          email,
          phone,
          password,
          is_vendor: isVendor,
        });
        setToken(data.access);
        await saveToken(data.access);
        if (data.user) setUser(data.user);
        else await refreshMe();
      },
      refreshMe,
      logout: async () => {
        setToken(null);
        setUser(null);
        await clearToken();
      },
    }),
    [loading, mode, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
