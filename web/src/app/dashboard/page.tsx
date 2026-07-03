'use client';

import { AdminLayout } from '@/components/AdminLayout';
import { Users, Star, DollarSign, Phone } from 'lucide-react';

function StatCard({ label, value, iconName, color }: { label: string; value: string; iconName: string; color: string }) {
  const icons: Record<string, any> = { Users, Star, DollarSign, Phone };
  const Icon = icons[iconName];
  return (
    <div className="stat-card">
      <Icon size={28} color={color} />
      <p className="text-2xl font-bold text-text-primary mt-2">{value}</p>
      <p className="text-sm text-text-secondary">{label}</p>
    </div>
  );
}

export default function DashboardPage() {
  const stats = [
    { label: 'Total Users', value: '--', iconName: 'Users', color: '#9333EA' },
    { label: 'Astrologers', value: '--', iconName: 'Star', color: '#F59E0B' },
    { label: 'Revenue', value: '--', iconName: 'DollarSign', color: '#22C55E' },
    { label: 'Active Calls', value: '--', iconName: 'Phone', color: '#F97316' },
  ];

  return (
    <AdminLayout>
      <h1 className="text-3xl font-extrabold text-text-primary mb-8">Dashboard</h1>
      <div className="grid grid-cols-4 gap-6 mb-8">
        {stats.map(s => <StatCard key={s.label} {...s} />)}
      </div>
      <div className="glass-card p-6 mb-6">
        <h2 className="text-xl font-bold text-text-primary mb-4">Quick Overview</h2>
        <p className="text-text-secondary">Admin dashboard with real-time charts and statistics will appear here.</p>
      </div>
    </AdminLayout>
  );
}
