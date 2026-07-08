'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Table, Badge } from '@/components/UIComponents';
import { api } from '@/lib/api';
import type { Transaction } from '@astro-shine/shared-types';

export default function TransactionsPage() {
  const [data, setData] = useState<Transaction[]>([]);
  useEffect(() => { api.get<Transaction[]>('/transactions').then(setData); }, []);

  return (
    <AdminLayout>
      <h1 className="text-3xl font-extrabold text-text-primary mb-6">Transactions</h1>
      <Table headers={['Type', 'Category', 'Amount', 'Fee', 'Net', 'Status', 'Date']}>
        {data.map(t => (
          <tr key={t.id} className="border-b border-divider hover:bg-surface-light/50">
            <td className="px-4 py-3 text-text-secondary">{t.type}</td>
            <td className="px-4 py-3 text-text-secondary">{t.category?.replace(/_/g, ' ')}</td>
            <td className="px-4 py-3 text-text-primary">₹{t.amount}</td>
            <td className="px-4 py-3 text-text-secondary">₹{t.fee}</td>
            <td className="px-4 py-3 text-text-primary">₹{t.netAmount}</td>
            <td className="px-4 py-3">{t.status === 'success' ? <Badge variant="success">Success</Badge> : t.status === 'failed' ? <Badge variant="danger">Failed</Badge> : <Badge variant="warning">Pending</Badge>}</td>
            <td className="px-4 py-3 text-text-muted text-sm">{new Date(t.createdAt).toLocaleDateString()}</td>
          </tr>
        ))}
      </Table>
    </AdminLayout>
  );
}
