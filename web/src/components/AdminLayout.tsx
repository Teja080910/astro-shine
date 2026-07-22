'use client';

import { useAuthStore } from '@/store/auth';
import { AlertTriangle, ArrowDownUp, Bell, Calendar, Clock, FileText, Gift, Globe, Key, LayoutDashboard, Link2, LogOut, MessageSquare, Moon, Newspaper, Package, Percent, Receipt, Sparkles, Star, Sun, Users, Wallet } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect } from 'react';
import logoImg from '../assets/logo.png';

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
  const { admin, logout } = useAuthStore();
  const navRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedScroll = sessionStorage.getItem('sidebar-scroll');
    if (savedScroll && navRef.current) {
      navRef.current.scrollTop = parseInt(savedScroll, 10);
    } else if (navRef.current) {
      const activeLink = navRef.current.querySelector('.sidebar-link.active');
      if (activeLink) {
        activeLink.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [pathname]);

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
    <aside className="fixed left-5 top-5 bottom-5 w-64 bg-surface/50 border border-card-border backdrop-blur-xl rounded-[28px] flex flex-col p-5 shadow-xl shadow-black/5 z-20 transition-all duration-300">
      <div className="flex justify-between items-center px-2 py-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center bg-gradient-to-tr from-primary/10 to-accent-gold/10 rounded-xl border border-card-border p-1">
            <Image src={logoImg} alt="Astro Shine Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-black text-text-primary leading-tight font-sans tracking-tight">ASTRO SHINE</span>
            <span className="text-[10px] font-bold text-accent-gold tracking-widest uppercase">Admin</span>
          </div>
        </div>
        <button onClick={toggleTheme} className="p-2 rounded-xl bg-surface-light/40 border border-card-border hover:bg-surface-light text-text-secondary hover:text-text-primary transition-all duration-200 hover:scale-105">
          {theme === 'dark' ? <Sun size={16} className="text-accent-gold" /> : <Moon size={16} className="text-primary" />}
        </button>
      </div>
      
      <nav 
        ref={navRef}
        onScroll={(e) => {
          sessionStorage.setItem('sidebar-scroll', e.currentTarget.scrollTop.toString());
        }}
        className="flex-1 space-y-1 overflow-y-auto pr-1 scrollbar-thin"
      >
        {menuItems.map(item => {
          const active = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link key={item.href} href={item.href} className={`sidebar-link ${active ? 'active' : ''}`}>
              <item.icon size={16} className={active ? "text-accent-gold" : "text-text-secondary"} />
              <span className="font-semibold text-xs tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="border-t border-divider pt-4 mt-4 space-y-2">
        <div className="flex items-center gap-3 px-3 py-2 bg-surface-light/30 border border-card-border rounded-2xl">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent-gold flex items-center justify-center text-white font-bold text-sm shadow-sm">
            {admin?.name?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-bold text-text-primary truncate">{admin?.name || 'Admin'}</span>
            <span className="text-[9px] text-text-muted truncate">{admin?.email || 'admin@astroshine.com'}</span>
          </div>
        </div>
        <button onClick={logout} className="sidebar-link w-full text-left hover:bg-danger/10 hover:text-danger active:scale-95">
          <LogOut size={16} className="text-danger" />
          <span className="font-bold text-xs tracking-wide">Logout</span>
        </button>
      </div>
    </aside>
  );
}

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { token, hydrated } = useAuthStore();
  const pathname = usePathname();

  const pageTitle = React.useMemo(() => {
    if (pathname === '/dashboard') return 'Dashboard';
    const match = menuItems.find(item => pathname === item.href || pathname?.startsWith(item.href + '/'));
    return match ? match.label : 'Admin';
  }, [pathname]);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-text-secondary text-sm font-semibold tracking-wider animate-pulse">Loading Astro Shine...</p>
        </div>
      </div>
    );
  }
  
  if (!token) return null;

  return (
    <div className="flex min-h-screen bg-background relative overflow-hidden transition-colors duration-300">
      {/* Glow Blobs */}
      <div className="absolute top-[-10%] left-[5%] w-[45%] h-[45%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[5%] w-[45%] h-[45%] rounded-full bg-accent-gold/5 blur-[120px] pointer-events-none" />

      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="pl-[290px] pr-8 py-6 w-full flex flex-col min-h-screen z-10">
        {/* Modern Page Header */}
        <header className="flex justify-between items-center mb-8 bg-surface/30 backdrop-blur-md border border-card-border px-6 py-4 rounded-[20px] shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Astro Shine</span>
            <span className="text-text-muted text-xs">/</span>
            <span className="text-xs font-bold text-accent-gold bg-accent-gold/10 px-2.5 py-1 rounded-lg uppercase tracking-wider">{pageTitle}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs font-bold text-text-primary">System Live</p>
              <p className="text-[10px] text-text-muted font-medium">Operations Center</p>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-success animate-ping" />
          </div>
        </header>

        {/* Content Children */}
        <main className="flex-1 flex flex-col">{children}</main>
      </div>
    </div>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedLayout>{children}</ProtectedLayout>
  );
}
