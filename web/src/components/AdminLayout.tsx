'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Star, Receipt, ArrowDownUp, Percent, MessageSquare, AlertTriangle, Bell, Key, Link2, Globe, FileText, Newspaper, Package, Sparkles, Calendar } from 'lucide-react';

const menuItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/users', icon: Users, label: 'Users' },
  { href: '/astrologers', icon: Star, label: 'Astrologers' },
  { href: '/orders', icon: Package, label: 'Orders' },
  { href: '/transactions', icon: Receipt, label: 'Transactions' },
  { href: '/withdrawals', icon: ArrowDownUp, label: 'Withdrawals' },
  { href: '/commissions', icon: Percent, label: 'Commissions' },
  { href: '/horoscope', icon: Sparkles, label: 'Horoscopes' },
  { href: '/panchang', icon: Calendar, label: 'Panchang' },
  { href: '/reviews', icon: MessageSquare, label: 'Reviews' },
  { href: '/reports', icon: AlertTriangle, label: 'Reports' },
  { href: '/notifications', icon: Bell, label: 'Notifications' },
  { href: '/blogs', icon: FileText, label: 'Blogs' },
  { href: '/news', icon: Newspaper, label: 'News' },
  { href: '/api-keys', icon: Key, label: 'API Keys' },
  { href: '/dynamic-links', icon: Link2, label: 'Links' },
  { href: '/website-content', icon: Globe, label: 'Website' },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 h-screen bg-surface border-r border-divider fixed left-0 top-0 flex flex-col p-4">
      <div className="flex items-center gap-3 px-2 py-4 mb-6">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary to-primary-light" />
        <span className="text-lg font-bold text-text-primary">Astro Shine</span>
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
    </aside>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-64 flex-1 p-8">{children}</main>
    </div>
  );
}
