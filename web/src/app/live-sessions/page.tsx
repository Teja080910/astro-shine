'use client';

import { useState, useEffect } from 'react';
import { formatDate } from '@/lib/utils';
import { AdminLayout } from '@/components/AdminLayout';
import { Table, Badge, GradientButton, CustomModal } from '@/components/UIComponents';
import { api } from '@/lib/api';

export default function LiveSessionsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    api.get<any[]>('/live-sessions')
      .then(setData)
      .catch((e) => setError(e.message || 'Failed to load live sessions'))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdateStatus = async () => {
    if (!selected || !status) return;
    try {
      await api.put(`/live-sessions/${selected.id}/status`, { status });
      setData(data.map(s => s.id === selected.id ? { ...s, status } : s));
      setSelected(null);
      setStatus('');
    } catch (e: any) {
      alert(e.message || 'Failed to update status');
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-text-primary">Live Sessions</h1>
        <span className="text-text-secondary">{data.length} total</span>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-64 text-text-secondary">Loading live sessions...</div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-800 text-red-400 rounded-lg px-4 py-3 text-sm">{error}</div>
      ) : (
        <Table headers={['Title', 'Astrologer', 'Status', 'Viewers', 'Date']} emptyMessage="No live sessions found">
          {data.map((s: any) => (
            <tr key={s.id} className="border-b border-divider hover:bg-surface-light/50">
              <td className="px-4 py-3 text-text-primary font-medium">{s.title || 'Untitled'}</td>
              <td className="px-4 py-3 text-text-secondary">{s.astrologerName || s.astrologerId?.slice(0, 8) || '-'}</td>
              <td className="px-4 py-3">{s.status === 'live' ? <Badge variant="success">Live</Badge> : s.status === 'scheduled' ? <Badge variant="warning">Scheduled</Badge> : <Badge variant="info">{s.status}</Badge>}</td>
              <td className="px-4 py-3 text-text-secondary">{s.viewerCount || 0}</td>
              <td className="px-4 py-3 text-text-muted text-sm">{formatDate(s.createdAt)}</td>
            </tr>
          ))}
        </Table>
      )}
    </AdminLayout>
  );
}
