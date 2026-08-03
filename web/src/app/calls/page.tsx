'use client';

import { useState, useEffect } from 'react';
import { formatDate } from '@/lib/utils';
import { AdminLayout } from '@/components/AdminLayout';
import { Table, Badge } from '@/components/UIComponents';
import { api } from '@/lib/api';

export default function CallsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<any[]>('/calls')
      .then(setData)
      .catch((e) => setError(e.message || 'Failed to load calls'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-text-primary">Call Logs</h1>
        <span className="text-text-secondary">{data.length} total</span>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-64 text-text-secondary">Loading calls...</div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-800 text-red-400 rounded-lg px-4 py-3 text-sm">{error}</div>
      ) : (
        <Table headers={['Type', 'User', 'Astrologer', 'Status', 'Duration', 'Cost', 'Date']} emptyMessage="No call logs found">
          {data.map((c: any) => (
            <tr key={c.id} className="border-b border-divider hover:bg-surface-light/50">
              <td className="px-4 py-3"><Badge variant={c.type === 'video' ? 'info' : 'success'}>{c.type}</Badge></td>
              <td className="px-4 py-3 text-text-secondary">{c.userName || c.userId?.slice(0, 8) || '-'}</td>
              <td className="px-4 py-3 text-text-secondary">{c.astrologerName || c.astrologerId?.slice(0, 8) || '-'}</td>
              <td className="px-4 py-3">{c.status === 'completed' ? <Badge variant="success">Completed</Badge> : c.status === 'ongoing' ? <Badge variant="warning">Ongoing</Badge> : c.status === 'missed' ? <Badge variant="danger">Missed</Badge> : <Badge variant="info">{c.status}</Badge>}</td>
              <td className="px-4 py-3 text-text-secondary">{c.duration ? `${Math.floor(c.duration / 60)}m ${c.duration % 60}s` : '-'}</td>
              <td className="px-4 py-3 text-text-primary">₹{c.cost || '0'}</td>
              <td className="px-4 py-3 text-text-muted text-sm">{formatDate(c.createdAt)}</td>
            </tr>
          ))}
        </Table>
      )}
    </AdminLayout>
  );
}
