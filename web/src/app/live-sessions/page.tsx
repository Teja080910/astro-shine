'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDate } from '@/lib/utils';
import { AdminLayout } from '@/components/AdminLayout';
import { Table, Badge, GradientButton, CustomModal } from '@/components/UIComponents';
import { SearchInput } from '@/components/SearchInput';
import { Pagination, unwrapList } from '@/components/Pagination';
import { api } from '@/lib/api';

export default function LiveSessionsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadSessions = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());
    try {
      const res = await api.get<any>(`/live-sessions?${params.toString()}`);
      const { data, total, totalPages } = unwrapList<any>(res);
      setData(data);
      setTotal(total);
      setTotalPages(totalPages);
    } catch (e: any) {
      setError(e.message || 'Failed to load live sessions');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const handleUpdateStatus = async () => {
    if (!selected || !status) return;
    try {
      await api.put(`/live-sessions/${selected.id}/status`, { status });
      setSelected(null);
      setStatus('');
      loadSessions();
    } catch (e: any) {
      alert(e.message || 'Failed to update status');
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-text-primary">Live Sessions</h1>
        <span className="text-text-secondary">{total} total</span>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-64 text-text-secondary">Loading live sessions...</div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-800 text-red-400 rounded-lg px-4 py-3 text-sm">{error}</div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <SearchInput value={search} onChange={setSearch} placeholder="Search by title, astrologer or status..." />
          </div>
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
          <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} onLimitChange={(l) => { setLimit(l); setPage(1); }} />
        </>
      )}
    </AdminLayout>
  );
}
