"use client";

import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import api, { setAuthToken } from './api';

export type User = {
  id: number;
  name: string;
  email: string;
  level?: number;
  xp?: number;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  const refreshUser = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/auth/me');
      const payload = response.data?.user ?? response.data;
      setUser(payload as User);
    } catch (error) {
      console.error('Unable to fetch current user', error);
      setUser(null);
      setAuthToken(null);
    } finally {
      setLoading(false);
      setReady(true);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { token, user: userData } = response.data;
      if (token) {
        setAuthToken(token);
      }
      if (userData) {
        setUser(userData);
      } else {
        await refreshUser();
        return;
      }
    } finally {
      setLoading(false);
      setReady(true);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.post('/api/auth/register', { name, email, password });
      const { token, user: userData } = response.data ?? {};
      if (token) {
        setAuthToken(token);
      }
      if (userData) {
        setUser(userData);
      } else if (token) {
        await refreshUser();
        return;
      } else {
        await login(email, password);
        return;
      }
    } finally {
      setLoading(false);
      setReady(true);
    }
  };

  const logout = () => {
    setUser(null);
    setAuthToken(null);
    setReady(true);
  };

  useEffect(() => {
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (storedToken) {
      setAuthToken(storedToken);
      refreshUser();
    } else {
      setReady(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, ready, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
