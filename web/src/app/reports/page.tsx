'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDate } from '@/lib/utils';
import { AdminLayout } from '@/components/AdminLayout';
import { useAuthStore } from '@/store/auth';
import { Table, Badge } from '@/components/UIComponents';
import { api } from '@/lib/api';
import type { Report } from '@astro-shine/shared-types';

export default function ReportsPage() {
  const [data, setData] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { admin } = useAuthStore();

  const fetchReports = useCallback(() => {
    api.get<Report[]>('/reports')
      .then(setData)
      .catch((e) => setError(e.message || 'Failed to load reports'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const resolve = async (id: string) => {
    try {
      const adminId = admin?.id;
      if (!adminId) { alert('Admin ID not available'); return; }
      await api.put<any>(`/reports/${id}/resolve`, { adminId });
      setData(data.map(r => r.id === id ? { ...r, status: 'reviewed' } : r));
    } catch (e: any) {
      alert(e.message || 'Failed to resolve report');
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-text-primary">Reports</h1>
        <span className="text-text-secondary">{data.length} total</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-text-secondary">Loading reports...</div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-800 text-red-400 rounded-lg px-4 py-3 text-sm">{error}</div>
      ) : (
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
      )}
    </AdminLayout>
  );
}
