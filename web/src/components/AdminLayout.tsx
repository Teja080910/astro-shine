'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Star, Receipt, ArrowDownUp, Percent, MessageSquare, AlertTriangle, Bell, Key, Link2, Globe, FileText, Newspaper, Package, Sparkles, Calendar, Sun, Moon, Clock, Wallet, LogOut, Gift } from 'lucide-react';
import { AuthProvider, useAuth } from '@/context/AuthContext';

const menuItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/users', icon: Users, label: 'Users' },
  { href: '/astrologers', icon: Star, label: 'Astrologers' },
  { href: '/wallet', icon: Wallet, label: 'Wallets' },
  { href: '/orders', icon: Package, label: 'Orders' },
  { href: '/transactions', icon: Receipt, label: 'Transactions' },
  { href: '/withdrawals', icon: ArrowDownUp, label: 'Withdrawals' },
  { href: '/donations', icon: Gift, label: 'Donations' },
  { href: '/commissions', icon: Percent, label: 'Commissions' },
  { href: '/horoscope', icon: Sparkles, label: 'Horoscopes' },
  { href: '/panchang', icon: Calendar, label: 'Panchang' },
  { href: '/muhurat', icon: Clock, label: 'Muhurat' },
  { href: '/muhurat/categories', icon: Calendar, label: 'Muhurat Categories' },
  { href: '/reviews', icon: MessageSquare, label: 'Reviews' },
  { href: '/reports', icon: AlertTriangle, label: 'Reports' },
  { href: '/notifications', icon: Bell, label: 'Notifications' },
  { href: '/blogs', icon: FileText, label: 'Blogs' },
  { href: '/news', icon: Newspaper, label: 'News' },
  { href: '/api-keys', icon: Key, label: 'API Keys' },
  { href: '/dynamic-links', icon: Link2, label: 'Links' },
  { href: '/website-content', icon: Globe, label: 'Website' },
];

function Sidebar() {
  const pathname = usePathname();
  const [theme, setTheme] = React.useState<'dark' | 'light'>('dark');
  const { admin, logout } = useAuth();

  useEffect(() => {
    const saved = localStorage.getItem('admin-theme') as 'dark' | 'light';
    if (saved) { setTheme(saved); document.documentElement.setAttribute('data-theme', saved); }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('admin-theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <aside className="w-64 h-screen bg-surface border-r border-divider fixed left-0 top-0 flex flex-col p-4">
      <div className="flex justify-between items-center px-2 py-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary to-primary-light" />
          <span className="text-lg font-bold text-text-primary font-sans">Astro Shine</span>
        </div>
        <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-surface-light text-text-secondary hover:text-text-primary transition-colors">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto">
        {menuItems.map(item => {
          const active = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link key={item.href} href={item.href} className={`sidebar-link ${active ? 'active' : ''}`}>
              <item.icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-divider pt-4 mt-4 space-y-2">
        <div className="px-3 text-sm text-text-muted">{admin?.name || 'Admin'}</div>
        <button onClick={logout} className="sidebar-link w-full text-left">
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !token) {
      router.push('/login');
    }
  }, [token, loading, router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-text-muted">Loading...</p></div>;
  if (!token) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-64 flex-1 p-8">{children}</main>
    </div>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ProtectedLayout>{children}</ProtectedLayout>
    </AuthProvider>
  );
}
