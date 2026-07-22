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
    <div className="stat-card">
      <Icon size={28} color={color} />
      <p className="text-2xl font-bold text-text-primary mt-2">{value}</p>
      <p className="text-sm text-text-secondary">{label}</p>
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
    { label: 'Total Users', value: stats?.totalUsers ?? 0, iconName: 'Users', color: '#9333EA' },
    { label: 'Astrologers', value: stats?.totalAstrologers ?? 0, iconName: 'Star', color: '#F59E0B' },
    { label: 'Revenue', value: `₹${stats?.totalRevenue ?? 0}`, iconName: 'DollarSign', color: '#22C55E' },
    { label: 'Active Calls', value: stats?.activeCalls ?? 0, iconName: 'Phone', color: '#F97316' },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64 text-text-secondary">Loading dashboard stats...</div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="bg-red-900/20 border border-red-800 text-red-400 rounded-lg px-4 py-3 text-sm">{error}</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <h1 className="text-3xl font-extrabold text-text-primary mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {cardData.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Pending Astrologers Verification */}
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-text-primary">Astrologers Awaiting Verification</h2>
            <Link href="/astrologers" className="text-sm text-primary-light hover:underline flex items-center gap-1">
              View All <ArrowUpRight size={14} />
            </Link>
          </div>
          {stats?.pendingAstrologers && stats.pendingAstrologers.length > 0 ? (
            <Table headers={['Name', 'Experience', 'Status']}>
              {stats.pendingAstrologers.map(a => (
                <tr key={a.id} className="border-b border-divider hover:bg-surface-light/50">
                  <td className="px-4 py-3 text-text-primary font-medium">{a.name}</td>
                  <td className="px-4 py-3 text-text-secondary">{a.experience} yrs</td>
                  <td className="px-4 py-3"><Badge variant="warning">Pending</Badge></td>
                </tr>
              ))}
            </Table>
          ) : (
            <p className="text-text-secondary text-sm">No pending verification requests.</p>
          )}
        </div>

        {/* Pending Withdrawals */}
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-text-primary">Pending Withdrawal Requests</h2>
            <Link href="/withdrawals" className="text-sm text-primary-light hover:underline flex items-center gap-1">
              View All <ArrowUpRight size={14} />
            </Link>
          </div>
          {stats?.pendingWithdrawals && stats.pendingWithdrawals.length > 0 ? (
            <Table headers={['Astrologer', 'Amount', 'Status']}>
              {stats.pendingWithdrawals.map(w => (
                <tr key={w.id} className="border-b border-divider hover:bg-surface-light/50">
                  <td className="px-4 py-3 text-text-secondary">{w.astrologerName || w.astrologerId?.slice(0, 8) + '...'}</td>
                  <td className="px-4 py-3 text-text-primary">₹{w.amount}</td>
                  <td className="px-4 py-3"><Badge variant="warning">Pending</Badge></td>
                </tr>
              ))}
            </Table>
          ) : (
            <p className="text-text-secondary text-sm">No pending withdrawal requests.</p>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="glass-card p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-text-primary">Recent Transactions</h2>
          <Link href="/transactions" className="text-sm text-primary-light hover:underline flex items-center gap-1">
            View All <ArrowUpRight size={14} />
          </Link>
        </div>
        {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
          <Table headers={['Category', 'Amount', 'Status', 'Date']}>
            {stats.recentTransactions.map(t => (
              <tr key={t.id} className="border-b border-divider hover:bg-surface-light/50">
                <td className="px-4 py-3 text-text-secondary font-medium">{t.category?.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3 text-text-primary font-medium">₹{t.amount}</td>
                <td className="px-4 py-3">
                  {t.status === 'success' ? <Badge variant="success">Success</Badge> : t.status === 'failed' ? <Badge variant="danger">Failed</Badge> : <Badge variant="warning">Pending</Badge>}
                </td>
                <td className="px-4 py-3 text-text-muted text-sm">{formatDate(t.createdAt)}</td>
              </tr>
            ))}
          </Table>
        ) : (
          <p className="text-text-secondary text-sm">No recent transactions found.</p>
        )}
      </div>
    </AdminLayout>
  );
}

