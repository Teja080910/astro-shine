'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api } from '@/lib/api';

interface AdminUser {
  id: string; name: string; email: string; role: string;
}

interface AuthState {
  token: string | null;
  admin: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('admin-token');
    const savedAdmin = localStorage.getItem('admin-user');
    if (saved && savedAdmin) {
      setToken(saved);
      setAdmin(JSON.parse(savedAdmin));
      api.setToken(saved);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{ token: string; user: AdminUser }>('/auth/login', { email, password });
    setToken(res.token);
    setAdmin(res.user);
    api.setToken(res.token);
    localStorage.setItem('admin-token', res.token);
    localStorage.setItem('admin-user', JSON.stringify(res.user));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setAdmin(null);
    api.setToken(null);
    localStorage.removeItem('admin-token');
    localStorage.removeItem('admin-user');
  }, []);

  return (
    <AuthContext.Provider value={{ token, admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
