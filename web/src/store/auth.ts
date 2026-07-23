import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';

interface AdminUser {
  id: string; name: string; email: string; role: string;
}

interface AuthStore {
  token: string | null;
  admin: AdminUser | null;
  loading: boolean;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setHydrated: () => void;
}

const setCookie = (token: string | null) => {
  if (typeof document === 'undefined') return;
  if (token) {
    document.cookie = `admin-token=${token}; path=/; SameSite=Lax`;
  } else {
    document.cookie = 'admin-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
  }
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      admin: null,
      loading: true,
      hydrated: false,

      login: async (email: string, password: string) => {
        const res = await api.post<{ token: string; user: AdminUser }>('/auth/login', { email, password });
        api.setToken(res.token);
        setCookie(res.token);
        set({ token: res.token, admin: res.user, loading: false });
      },

      logout: () => {
        api.setToken(null);
        setCookie(null);
        set({ token: null, admin: null, loading: false });
      },

      setHydrated: () => set({ hydrated: true, loading: false }),
    }),
    {
      name: 'admin-auth',
      partialize: (state) => ({ token: state.token, admin: state.admin }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (state.token) {
            api.setToken(state.token);
            setCookie(state.token);
          } else {
            setCookie(null);
          }
          state.setHydrated();
        }
      },
    },
  ),
);
