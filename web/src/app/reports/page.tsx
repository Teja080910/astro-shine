'use client';

import { useState, useEffect } from 'react';
import { formatDate } from '@/lib/utils';
import { AdminLayout } from '@/components/AdminLayout';
import { Table, Badge, GradientButton } from '@/components/UIComponents';
import { api } from '@/lib/api';
import type { Report } from '@astro-shine/shared-types';

export default function ReportsPage() {
  const [data, setData] = useState<Report[]>([]);
  useEffect(() => { api.get<Report[]>('/reports').then(setData).catch(() => {}); }, []);

  const resolve = async (id: string) => {
    await api.put<any>(`/reports/${id}/resolve`, { adminId: 'admin' });
    setData(data.map(r => r.id === id ? { ...r, status: 'reviewed' } : r));
  };

  return (
    <AdminLayout>
      <h1 className="text-3xl font-extrabold text-text-primary mb-6">Reports</h1>
      <Table headers={['Reporter', 'Reported', 'Reason', 'Status', 'Date', '']} emptyMessage="No reports found">
        {data.map(r => (
          <tr key={r.id} className="border-b border-divider hover:bg-surface-light/50">
            <td className="px-4 py-3 text-text-primary">{r.reporterRole} ({r.reporterId?.slice(0, 6)}...)</td>
            <td className="px-4 py-3 text-text-primary">{r.reportedUserId ? `User: ${r.reportedUserId.slice(0, 6)}` : `Astro: ${r.reportedAstrologerId?.slice(0, 6)}`}...</td>
            <td className="px-4 py-3 text-text-secondary">{r.reason}</td>
            <td className="px-4 py-3">{r.status === 'reviewed' ? <Badge variant="success">Reviewed</Badge> : <Badge variant="warning">Pending</Badge>}</td>
            <td className="px-4 py-3 text-text-muted text-sm">{formatDate(r.createdAt)}</td>
            <td className="px-4 py-3">{r.status !== 'reviewed' && <button onClick={() => resolve(r.id)} className="text-primary-light hover:underline text-sm">Resolve</button>}</td>
          </tr>
        ))}
      </Table>
    </AdminLayout>
  );
}
