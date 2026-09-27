'use client';

import { useState, useEffect } from 'react';
import { formatDate } from '@/lib/utils';
import { AdminLayout } from '@/components/AdminLayout';
import { Table, Badge } from '@/components/UIComponents';
import { SearchInput } from '@/components/SearchInput';
import { Pagination, unwrapList } from '@/components/Pagination';
import { api } from '@/lib/api';

export default function CallsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());
    setLoading(true);
    api.get<any>(`/calls?${params.toString()}`)
      .then((res) => {
        const { data, total, totalPages } = unwrapList<any>(res);
        setData(data);
        setTotal(total);
        setTotalPages(totalPages);
      })
      .catch((e) => setError(e.message || 'Failed to load calls'))
      .finally(() => setLoading(false));
  }, [page, limit, debouncedSearch]);

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-text-primary">Call Logs</h1>
        <span className="text-text-secondary">{total} total</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by type, status, user or astrologer..." onEnter={() => { setDebouncedSearch(search); setPage(1); }} />
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

      {!loading && !error && total > 0 && (
        <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} onLimitChange={(l) => { setLimit(l); setPage(1); }} />
      )}
    </AdminLayout>
  );
}
