import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../shared/api-client";
import { setThemeState } from "../shared/theme";
import type { User, Astrologer } from "../shared/types";

export type AppRole = "user" | "astrologer" | "admin" | null;

interface AuthState {
  user: User | null;
  astrologer: Astrologer | null;
  token: string | null;
  role: AppRole;
  loading: boolean;
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => Promise<void>;
  loginAsUser: (email: string, password: string) => Promise<void>;
  loginAsAstrologer: (email: string, password: string) => Promise<void>;
  registerUser: (
    name: string,
    email: string,
    password: string,
    phone?: string,
  ) => Promise<void>;
  registerAstrologer: (
    name: string,
    email: string,
    password: string,
    phone?: string,
  ) => Promise<void>;
  loginWithOtp: (identifier: string, otp: string, role: AppRole, type?: 'phone' | 'email') => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: AppRole) => void;
  updateUser: (u: User | Astrologer) => Promise<void>;
}

const AuthContext = createContext<AuthState>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [astrologer, setAstrologer] = useState<Astrologer | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<AppRole>(null);
  const [theme, setThemeVal] = useState<"light" | "dark">("dark");
  const [loading, setLoading] = useState(true);

  const systemScheme = useColorScheme();

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem("auth");
        if (stored) {
          const {
            token: t,
            user: u,
            astrologer: a,
            role: r,
          } = JSON.parse(stored);
          setToken(t);
          setUser(u);
          setAstrologer(a);
          setRole(r);
          api.setToken(t);
        }
        const storedTheme = await AsyncStorage.getItem("theme_preference");
        if (storedTheme === "light" || storedTheme === "dark") {
          setThemeVal(storedTheme);
          setThemeState(storedTheme);
        } else if (systemScheme) {
          setThemeVal(systemScheme);
          setThemeState(systemScheme);
        }
      } catch {
        console.log('Failed to restore auth state');
      } finally {
        setLoading(false);
      }
    })();
  }, [systemScheme]);

  const setTheme = async (t: "light" | "dark") => {
    setThemeVal(t);
    setThemeState(t);
    try {
      await AsyncStorage.setItem("theme_preference", t);
    } catch { console.log('Failed to persist theme preference'); }
  };

  const persist = async (t: string, u?: User, a?: Astrologer, r?: AppRole) => {
    const data = { token: t, user: u, astrologer: a, role: r };
    await AsyncStorage.setItem("auth", JSON.stringify(data));
    setToken(t);
    api.setToken(t);
    if (u) {
      setUser(u);
      setRole(r || "user");
    }
    if (a) {
      setAstrologer(a);
      setRole("astrologer");
    }
  };

  const loginAsUser = async (email: string, password: string) => {
    const { token, user: u } = await api.auth.login({ email, password });
    const resolvedRole: AppRole =
      (u as any).role === "astrologer" ? "astrologer" : "user";
    if (resolvedRole === "astrologer") {
      await persist(token, undefined, u as any, "astrologer");
    } else {
      await persist(token, u as User, undefined, "user");
    }
  };

  const loginAsAstrologer = async (email: string, password: string) => {
    const { token, user: u } = await api.auth.login({ email, password });
    await persist(token, undefined, u as any, "astrologer");
  };

  const registerUser = async (
    name: string,
    email: string,
    password: string,
    phone?: string,
  ) => {
    const { token, user: u } = await api.auth.register({
      name,
      email,
      password,
      phone,
    });
    await persist(token, u as User, undefined, "user");
  };

  const registerAstrologer = async (
    name: string,
    email: string,
    password: string,
    phone?: string,
  ) => {
    const { token, user: u } = await api.auth.register({
      name,
      email,
      password,
      phone,
    });
    const a = await api.astrologers.create({ name, email, password, phone });
    await persist(token, undefined, a, "astrologer");
  };

  const loginWithOtp = async (identifier: string, otp: string, role: AppRole, type: 'phone' | 'email' = 'phone') => {
    const { token, user: u } = type === 'email'
      ? await api.auth.verifyEmailOtp(identifier, otp)
      : await api.auth.phoneLogin(identifier);
    await persist(token, u as User, undefined, role);
  };

  const logout = async () => {
    await AsyncStorage.removeItem("auth");
    setToken(null);
    setUser(null);
    setAstrologer(null);
    setRole(null);
    api.setToken(null);
  };

  const switchRole = (r: AppRole) => setRole(r);

  const updateUser = async (u: User | Astrologer) => {
    if (role === "astrologer") {
      setAstrologer(u as Astrologer);
    } else {
      setUser(u as User);
    }
    try {
      const stored = await AsyncStorage.getItem("auth");
      if (stored) {
        const data = JSON.parse(stored);
        if (role === "astrologer") {
          data.astrologer = u;
        } else {
          data.user = u;
        }
        await AsyncStorage.setItem("auth", JSON.stringify(data));
      }
    } catch { console.log('Failed to persist auth update'); }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        astrologer,
        token,
        role,
        theme,
        setTheme,
        loading,
        loginAsUser,
        loginAsAstrologer,
        registerUser,
        registerAstrologer,
        loginWithOtp,
        logout,
        switchRole,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
