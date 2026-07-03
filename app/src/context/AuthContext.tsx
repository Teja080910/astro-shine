import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@astro-shine/api-client';
import type { User, Astrologer } from '@astro-shine/shared-types';

export type AppRole = 'user' | 'astrologer' | null;

interface AuthState {
  user: User | null;
  astrologer: Astrologer | null;
  token: string | null;
  role: AppRole;
  loading: boolean;
  loginAsUser: (email: string, password: string) => Promise<void>;
  loginAsAstrologer: (email: string, password: string) => Promise<void>;
  registerUser: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  registerAstrologer: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  loginWithOtp: (phone: string, otp: string, role: AppRole) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: AppRole) => void;
}

const AuthContext = createContext<AuthState>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [astrologer, setAstrologer] = useState<Astrologer | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<AppRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('auth');
        if (stored) {
          const { token: t, user: u, astrologer: a, role: r } = JSON.parse(stored);
          setToken(t); setUser(u); setAstrologer(a); setRole(r); api.setToken(t);
        }
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  const persist = async (t: string, u?: User, a?: Astrologer, r?: AppRole) => {
    const data = { token: t, user: u, astrologer: a, role: r };
    await AsyncStorage.setItem('auth', JSON.stringify(data));
    setToken(t); api.setToken(t);
    if (u) { setUser(u); setRole('user'); }
    if (a) { setAstrologer(a); setRole('astrologer'); }
  };

  const loginAsUser = async (email: string, password: string) => {
    const { token, user: u } = await api.auth.login({ email, password });
    await persist(token, u as User, undefined, 'user');
  };

  const loginAsAstrologer = async (email: string, password: string) => {
    const { token, user: u } = await api.auth.login({ email, password });
    const a = await api.astrologers.list(); // simplified — real impl would fetch astrologer profile
    await persist(token, undefined, a[0], 'astrologer');
  };

  const registerUser = async (name: string, email: string, password: string, phone?: string) => {
    const { token, user: u } = await api.auth.register({ name, email, password, phone });
    await persist(token, u as User, undefined, 'user');
  };

  const registerAstrologer = async (name: string, email: string, password: string, phone?: string) => {
    const { token, user: u } = await api.auth.register({ name, email, password, phone });
    const a = await api.astrologers.create({ name, email, password, phone });
    await persist(token, undefined, a, 'astrologer');
  };

  const loginWithOtp = async (phone: string, otp: string, role: AppRole) => {
    const { token, user: u } = await api.auth.verifyOtp(phone, otp);
    await persist(token, u as User, undefined, role);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('auth');
    setToken(null); setUser(null); setAstrologer(null); setRole(null); api.setToken(null);
  };

  const switchRole = (r: AppRole) => setRole(r);

  return (
    <AuthContext.Provider value={{ user, astrologer, token, role, loading, loginAsUser, loginAsAstrologer, registerUser, registerAstrologer, loginWithOtp, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
