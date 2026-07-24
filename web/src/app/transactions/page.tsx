'use client';

import { useState, useEffect } from 'react';
import { formatDate } from '@/lib/utils';
import { AdminLayout } from '@/components/AdminLayout';
import { Table, Badge } from '@/components/UIComponents';
import { api } from '@/lib/api';
import type { Transaction } from '@astro-shine/shared-types';

export default function TransactionsPage() {
  const [data, setData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Transaction[]>('/transactions')
      .then(setData)
      .catch((e) => setError(e.message || 'Failed to load transactions'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-text-primary">Transactions</h1>
        <span className="text-text-secondary">{data.length} total</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-text-secondary">Loading transactions...</div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-800 text-red-400 rounded-lg px-4 py-3 text-sm">{error}</div>
      ) : (
        <Table headers={['Type', 'Category', 'User', 'Astrologer', 'Amount', 'Fee', 'Net', 'Status', 'Date']} emptyMessage="No transactions found">
          {data.map((t: any) => (
            <tr key={t.id} className="border-b border-divider hover:bg-surface-light/50">
              <td className="px-4 py-3 text-text-secondary">{t.type}</td>
              <td className="px-4 py-3 text-text-secondary">{t.category?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</td>
              <td className="px-4 py-3 text-text-secondary">{(t as any).userName || t.userId?.slice(0, 8) || '-'}</td>
              <td className="px-4 py-3 text-text-secondary">{(t as any).astrologerName || t.astrologerId?.slice(0, 8) || '-'}</td>
              <td className="px-4 py-3 text-text-primary">₹{t.amount}</td>
              <td className="px-4 py-3 text-text-secondary">₹{t.fee}</td>
              <td className="px-4 py-3 text-text-primary">₹{t.netAmount}</td>
              <td className="px-4 py-3">{t.status === 'success' ? <Badge variant="success">Success</Badge> : t.status === 'failed' ? <Badge variant="danger">Failed</Badge> : <Badge variant="warning">Pending</Badge>}</td>
              <td className="px-4 py-3 text-text-muted text-sm">{formatDate(t.createdAt)}</td>
            </tr>
          ))}
        </Table>
      )}
    </AdminLayout>
  );
}
