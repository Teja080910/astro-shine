'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDate } from '@/lib/utils';
import { AdminLayout } from '@/components/AdminLayout';
import { useAuthStore } from '@/store/auth';
import { Table, Badge } from '@/components/UIComponents';
import { SearchInput } from '@/components/SearchInput';
import { Pagination, unwrapList } from '@/components/Pagination';
import { api } from '@/lib/api';
import type { Report } from '@astro-shine/shared-types';

export default function ReportsPage() {
  const [data, setData] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const { admin } = useAuthStore();

  const fetchReports = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());
    api.get<any>(`/reports?${params.toString()}`)
      .then((res) => {
        const { data, total, totalPages } = unwrapList<Report>(res);
        setData(data);
        setTotal(total);
        setTotalPages(totalPages);
      })
      .catch((e) => setError(e.message || 'Failed to load reports'))
      .finally(() => setLoading(false));
  }, [page, limit, debouncedSearch]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const resolve = async (id: string) => {
    try {
      const adminId = admin?.id;
      if (!adminId) { alert('Admin ID not available'); return; }
      await api.put<any>(`/reports/${id}/resolve`, { adminId });
      fetchReports();
    } catch (e: any) {
      alert(e.message || 'Failed to resolve report');
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-text-primary">Reports</h1>
        <span className="text-text-secondary">{total} total</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchInput value={search} onChange={setSearch} placeholder="Search reports by reason or status..." onEnter={() => { setDebouncedSearch(search); setPage(1); }} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-text-secondary">Loading reports...</div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-800 text-red-400 rounded-lg px-4 py-3 text-sm">{error}</div>
      ) : (
        <Table headers={['Reporter', 'Reported Target', 'Reason', 'Description', 'Status', 'Date', '']} emptyMessage="No reports found">
          {data.map(r => (
            <tr key={r.id} className="border-b border-divider hover:bg-surface-light/50">
              <td className="px-4 py-3 text-text-primary">
                <div className="font-medium">{r.reporterName || 'Unknown'}</div>
                <div className="text-xs text-text-muted capitalize">{r.reporterRole} ({r.reporterId?.slice(0, 8)}...)</div>
              </td>
              <td className="px-4 py-3 text-text-primary">
                {r.reportedAstrologerName ? (
                  <div>
                    <span className="font-medium text-amber-400">Astro: </span>
                    <span className="font-medium">{r.reportedAstrologerName}</span>
                  </div>
                ) : r.reportedUserName ? (
                  <div>
                    <span className="font-medium text-blue-400">User: </span>
                    <span>{r.reportedUserName}</span>
                  </div>
                ) : r.reportedAstrologerId ? (
                  <div>Astro: {r.reportedAstrologerId?.slice(0, 8)}...</div>
                ) : (
                  <div>User: {r.reportedUserId?.slice(0, 8) || 'N/A'}...</div>
                )}
              </td>
              <td className="px-4 py-3 text-text-secondary capitalize">{r.reason?.replace(/_/g, ' ')}</td>
              <td className="px-4 py-3 text-text-muted text-sm max-w-xs truncate">{r.description || '—'}</td>
              <td className="px-4 py-3">{r.status === 'reviewed' ? <Badge variant="success">Reviewed</Badge> : <Badge variant="warning">Pending</Badge>}</td>
              <td className="px-4 py-3 text-text-muted text-sm">{formatDate(r.createdAt)}</td>
              <td className="px-4 py-3">{r.status !== 'reviewed' && <button onClick={() => resolve(r.id)} className="text-primary-light hover:underline text-sm font-medium">Resolve</button>}</td>
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
