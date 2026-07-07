import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../shared/api-client';
import type { User, Astrologer } from '../shared/types';

export type AppRole = 'user' | 'astrologer' | 'admin' | null;

interface AuthState {
  user: User | null;
  astrologer: Astrologer | null;
  token: string | null;
  role: AppRole;
  loading: boolean;
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => Promise<void>;
  loginAsUser: (email: string, password: string) => Promise<void>;
  loginAsAstrologer: (email: string, password: string) => Promise<void>;
  registerUser: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  registerAstrologer: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  loginWithOtp: (phone: string, otp: string, role: AppRole) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: AppRole) => void;
  updateUser: (u: any) => Promise<void>;
}

const AuthContext = createContext<AuthState>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [astrologer, setAstrologer] = useState<Astrologer | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<AppRole>(null);
  const [theme, setThemeVal] = useState<'light' | 'dark'>('dark');
  const [loading, setLoading] = useState(true);

  const systemScheme = useColorScheme();

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('auth');
        if (stored) {
          const { token: t, user: u, astrologer: a, role: r } = JSON.parse(stored);
          setToken(t); setUser(u); setAstrologer(a); setRole(r); api.setToken(t);
        }
        const storedTheme = await AsyncStorage.getItem('theme_preference');
        if (storedTheme === 'light' || storedTheme === 'dark') {
          setThemeVal(storedTheme);
        } else if (systemScheme) {
          setThemeVal(systemScheme);
        }
      } catch {} finally { setLoading(false); }
    })();
  }, [systemScheme]);

  const setTheme = async (t: 'light' | 'dark') => {
    setThemeVal(t);
    try {
      await AsyncStorage.setItem('theme_preference', t);
    } catch {}
  };

  const persist = async (t: string, u?: User, a?: Astrologer, r?: AppRole) => {
    const data = { token: t, user: u, astrologer: a, role: r };
    await AsyncStorage.setItem('auth', JSON.stringify(data));
    setToken(t); api.setToken(t);
    if (u) { setUser(u); setRole(r || 'user'); }
    if (a) { setAstrologer(a); setRole('astrologer'); }
  };

  const loginAsUser = async (email: string, password: string) => {
    const { token, user: u } = await api.auth.login({ email, password });
    const resolvedRole = ((u as any).role === 'super_admin' || (u as any).role === 'admin') ? 'admin' : ((u as any).role === 'astrologer' ? 'astrologer' : 'user');
    if (resolvedRole === 'astrologer') {
      await persist(token, undefined, u as any, 'astrologer');
    } else {
      await persist(token, u as User, undefined, resolvedRole as any);
    }
  };

  const loginAsAstrologer = async (email: string, password: string) => {
    const { token, user: u } = await api.auth.login({ email, password });
    await persist(token, undefined, u as any, 'astrologer');
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

  const updateUser = async (u: any) => {
    if (role === 'astrologer') {
      setAstrologer(u);
    } else {
      setUser(u);
    }
    try {
      const stored = await AsyncStorage.getItem('auth');
      if (stored) {
        const data = JSON.parse(stored);
        if (role === 'astrologer') {
          data.astrologer = u;
        } else {
          data.user = u;
        }
        await AsyncStorage.setItem('auth', JSON.stringify(data));
      }
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, astrologer, token, role, theme, setTheme, loading, loginAsUser, loginAsAstrologer, registerUser, registerAstrologer, loginWithOtp, logout, switchRole, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
