'use client';

import { useState, useEffect } from 'react';
import { formatDate } from '@/lib/utils';
import { AdminLayout } from '@/components/AdminLayout';
import { Table, Badge } from '@/components/UIComponents';
import { api } from '@/lib/api';
import { Users, Star, DollarSign, Phone, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

function StatCard({ label, value, iconName, color }: { label: string; value: string | number; iconName: string; color: string }) {
  const icons: Record<string, any> = { Users, Star, DollarSign, Phone };
  const Icon = icons[iconName];
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-card-border p-6 bg-surface/40 backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:border-primary/20 group">
      {/* Dynamic color glow element */}
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full filter blur-[40px] opacity-10 transition-opacity duration-300 group-hover:opacity-20 pointer-events-none" style={{ backgroundColor: color }} />
      
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{label}</span>
          <span className="text-3xl font-black text-text-primary mt-2 tracking-tight">{value}</span>
        </div>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-300 group-hover:scale-110" style={{ backgroundColor: `${color}15`, borderColor: `${color}30` }}>
          <Icon size={22} color={color} />
        </div>
      </div>
    </div>
  );
}

interface DashboardStats {
  totalUsers: number;
  totalAstrologers: number;
  totalRevenue: number;
  activeCalls: number;
  recentTransactions: any[];
  pendingWithdrawals: any[];
  pendingAstrologers: any[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<DashboardStats>('/admins/dashboard-stats')
      .then(setStats)
      .catch((e) => setError(e.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const cardData = [
    { label: 'Total Users', value: stats?.totalUsers ?? 0, iconName: 'Users', color: '#8B5CF6' },
    { label: 'Astrologers', value: stats?.totalAstrologers ?? 0, iconName: 'Star', color: '#F59E0B' },
    { label: 'Revenue', value: `₹${stats?.totalRevenue ?? 0}`, iconName: 'DollarSign', color: '#10B981' },
    { label: 'Active Calls', value: stats?.activeCalls ?? 0, iconName: 'Phone', color: '#F97316' },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-text-secondary text-sm font-semibold tracking-wider animate-pulse">Fetching metrics...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="bg-danger/10 border border-danger/20 text-danger rounded-2xl px-6 py-4 text-sm font-medium">{error}</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-[28px] border border-card-border p-8 bg-gradient-to-r from-primary/10 to-accent-gold/5 backdrop-blur-md mb-8">
        <div className="relative z-10">
          <h2 className="text-2xl font-black text-text-primary tracking-tight">Overview Dashboard</h2>
          <p className="text-text-secondary text-sm mt-1 max-w-lg font-medium">Real-time metrics, astrologer verification requests, transaction histories, and active operations.</p>
        </div>
      </div>
      
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cardData.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Main Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* Pending Astrologers Verification */}
        <div className="rounded-[28px] border border-card-border bg-surface/40 backdrop-blur-md p-6 flex flex-col shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-bold text-text-primary tracking-tight">Astrologers Awaiting Verification</h2>
            <Link href="/astrologers" className="text-xs font-bold text-accent-gold hover:text-primary-light transition-all flex items-center gap-1.5 uppercase tracking-wider">
              View All <ArrowUpRight size={14} />
            </Link>
          </div>
          {stats?.pendingAstrologers && stats.pendingAstrologers.length > 0 ? (
            <Table headers={['Name', 'Experience', 'Status']}>
              {stats.pendingAstrologers.map(a => (
                <tr key={a.id} className="border-b border-divider hover:bg-surface-light/30 transition-colors">
                  <td className="px-4 py-3.5 text-text-primary font-bold text-xs">{a.name}</td>
                  <td className="px-4 py-3.5 text-text-secondary text-xs font-medium">{a.experience} yrs</td>
                  <td className="px-4 py-3.5"><Badge variant="warning">Pending</Badge></td>
                </tr>
              ))}
            </Table>
          ) : (
            <div className="flex-1 flex items-center justify-center py-10">
              <p className="text-text-muted text-xs font-semibold">No pending verification requests</p>
            </div>
          )}
        </div>

        {/* Pending Withdrawals */}
        <div className="rounded-[28px] border border-card-border bg-surface/40 backdrop-blur-md p-6 flex flex-col shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-bold text-text-primary tracking-tight">Pending Withdrawals</h2>
            <Link href="/withdrawals" className="text-xs font-bold text-accent-gold hover:text-primary-light transition-all flex items-center gap-1.5 uppercase tracking-wider">
              View All <ArrowUpRight size={14} />
            </Link>
          </div>
          {stats?.pendingWithdrawals && stats.pendingWithdrawals.length > 0 ? (
            <Table headers={['Astrologer', 'Amount', 'Status']}>
              {stats.pendingWithdrawals.map(w => (
                <tr key={w.id} className="border-b border-divider hover:bg-surface-light/30 transition-colors">
                  <td className="px-4 py-3.5 text-text-secondary font-semibold text-xs">{w.astrologerName || w.astrologerId?.slice(0, 8) + '...'}</td>
                  <td className="px-4 py-3.5 text-text-primary font-bold text-xs">₹{w.amount}</td>
                  <td className="px-4 py-3.5"><Badge variant="warning">Pending</Badge></td>
                </tr>
              ))}
            </Table>
          ) : (
            <div className="flex-1 flex items-center justify-center py-10">
              <p className="text-text-muted text-xs font-semibold">No pending withdrawal requests</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="rounded-[28px] border border-card-border bg-surface/40 backdrop-blur-md p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-base font-bold text-text-primary tracking-tight">Recent Transactions</h2>
          <Link href="/transactions" className="text-xs font-bold text-accent-gold hover:text-primary-light transition-all flex items-center gap-1.5 uppercase tracking-wider">
            View All <ArrowUpRight size={14} />
          </Link>
        </div>
        {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
          <Table headers={['Category', 'Amount', 'Status', 'Date']}>
            {stats.recentTransactions.map(t => (
              <tr key={t.id} className="border-b border-divider hover:bg-surface-light/30 transition-colors">
                <td className="px-4 py-3.5 text-text-secondary font-bold text-xs">{t.category?.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3.5 text-text-primary font-black text-xs">₹{t.amount}</td>
                <td className="px-4 py-3.5">
                  {t.status === 'success' ? <Badge variant="success">Success</Badge> : t.status === 'failed' ? <Badge variant="danger">Failed</Badge> : <Badge variant="warning">Pending</Badge>}
                </td>
                <td className="px-4 py-3.5 text-text-muted text-[11px] font-semibold">{formatDate(t.createdAt)}</td>
              </tr>
            ))}
          </Table>
        ) : (
          <div className="flex items-center justify-center py-10">
            <p className="text-text-muted text-xs font-semibold">No recent transactions found</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
