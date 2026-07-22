'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

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
    const cookieToken = document.cookie.split('; ').find(row => row.startsWith('admin-token='))?.split('=')[1];
    if (cookieToken) {
      try {
        const payload = JSON.parse(atob(cookieToken.split('.')[1]));
        if (payload.exp * 1000 > Date.now()) {
          setToken(cookieToken);
          setAdmin({ id: payload.sub, name: '', email: '', role: payload.role });
          api.setToken(cookieToken);
        } else {
          document.cookie = 'admin-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
        }
      } catch {}
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{ token: string; user: AdminUser }>('/auth/login', { email, password });
    setToken(res.token);
    setAdmin(res.user);
    api.setToken(res.token);
    document.cookie = `admin-token=${res.token}; path=/; SameSite=Lax; Secure`;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setAdmin(null);
    api.setToken(null);
    document.cookie = 'admin-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
  }, []);

  return (
    <AuthContext.Provider value={{ token, admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
