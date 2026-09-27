'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDate } from '@/lib/utils';
import { AdminLayout } from '@/components/AdminLayout';
import { Table, Badge } from '@/components/UIComponents';
import { SearchInput } from '@/components/SearchInput';
import { Pagination, unwrapList } from '@/components/Pagination';
import { api } from '@/lib/api';
import type { Review } from '@astro-shine/shared-types';

export default function ReviewsPage() {
  const [data, setData] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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

  const fetchReviews = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());
    api.get<any>(`/reviews?${params.toString()}`)
      .then((res) => {
        const { data, total, totalPages } = unwrapList<Review>(res);
        setData(data);
        setTotal(total);
        setTotalPages(totalPages);
      })
      .catch((e) => setError(e.message || 'Failed to load reviews'))
      .finally(() => setLoading(false));
  }, [page, limit, debouncedSearch]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const toggleVisibility = async (id: string, visible: boolean) => {
    try {
      await api.put<any>(`/reviews/${id}/visibility`, { isVisible: visible });
      fetchReviews();
    } catch (e: any) {
      alert(e.message || 'Failed to update visibility');
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-text-primary">Reviews</h1>
        <span className="text-text-secondary">{total} total</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchInput value={search} onChange={setSearch} placeholder="Search reviews by comment or rating..." />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-text-secondary">Loading reviews...</div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-800 text-red-400 rounded-lg px-4 py-3 text-sm">{error}</div>
      ) : (
        <Table headers={['User', 'Astrologer', 'Rating', 'Comment', 'Date']} emptyMessage="No reviews found">
          {data.map(r => (
            <tr key={r.id} className="border-b border-divider hover:bg-surface-light/50">
              <td className="px-4 py-3 text-text-primary">{(r as any).userName || r.userId?.slice(0, 8) + '...'}</td>
              <td className="px-4 py-3 text-text-primary">{(r as any).astrologerName || r.astrologerId?.slice(0, 8) + '...'}</td>
              <td className="px-4 py-3 text-text-primary">{'⭐'.repeat(r.rating)} {r.rating}/5</td>
              <td className="px-4 py-3 text-text-secondary max-w-xs truncate">{r.comment || '-'}</td>
              <td className="px-4 py-3 text-text-muted text-sm">{formatDate(r.createdAt)}</td>
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
