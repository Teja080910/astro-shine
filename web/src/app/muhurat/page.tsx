'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Table, Badge, GradientButton, DatePicker } from '@/components/UIComponents';
import { SearchInput } from '@/components/SearchInput';
import { Pagination, unwrapList } from '@/components/Pagination';
import { api } from '@/lib/api';

function addDays(base: string, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export default function MuhuratPage() {
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(addDays(today, 6));
  const [data, setData] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    api.get<any[]>('/muhurat-categories').then(setCategories).catch(() => []);
  }, []);

  const fetchMuhurat = useCallback(async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        page: String(page),
        limit: String(limit),
      });
      if (categoryFilter !== 'all') params.set('categoryId', categoryFilter);
      if (debouncedSearch) params.set('q', debouncedSearch);
      const res = await api.get<any>(`/muhurat?${params.toString()}`);
      const { data, total, totalPages } = unwrapList<any>(res);
      setData(data);
      setTotal(total);
      setTotalPages(totalPages);
    } catch (e: any) {
      setData([]);
      setError(e.message || 'Failed to load muhurat timings');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, categoryFilter, debouncedSearch, page, limit]);

  useEffect(() => {
    fetchMuhurat();
  }, [fetchMuhurat]);

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-extrabold text-text-primary">Muhurat Timings</h1>
        <GradientButton onClick={fetchMuhurat}>Refresh</GradientButton>
      </div>
      <p className="text-text-muted text-sm mb-6">
        Auspicious timings are generated automatically from the configured astrology API for the
        selected date range. Astrologers may also publish entries from the mobile app, which appear
        here for reference.
      </p>

      <div className="glass-card-solid p-6 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[180px]">
            <label className="text-text-secondary text-sm block mb-1">From</label>
            <DatePicker value={startDate} onChange={(v) => { setStartDate(v); setPage(1); }} />
          </div>
          <div className="min-w-[180px]">
            <label className="text-text-secondary text-sm block mb-1">To</label>
            <DatePicker value={endDate} onChange={(v) => { setEndDate(v); setPage(1); }} />
          </div>
          <div className="min-w-[220px]">
            <label className="text-text-secondary text-sm block mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="input-field text-sm"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, date or status..." />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-text-secondary">Generating muhurat timings...</div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-800 text-red-400 rounded-lg px-4 py-3 text-sm">{error}</div>
      ) : (
        <div className="glass-card-solid p-6">
          <Table headers={['Name', 'Category', 'Date', 'Time', 'Creator', 'Status']} emptyMessage="No muhurat timings found for this range">
            {data.map((entry) => (
              <tr key={entry.id} className="border-b border-divider hover:bg-surface-light/30">
                <td className="px-4 py-3 font-medium text-text-primary">{entry.name}</td>
                <td className="px-4 py-3 text-text-secondary">{entry.categoryName || 'Unknown'}</td>
                <td className="px-4 py-3 text-text-secondary">{entry.date}</td>
                <td className="px-4 py-3 text-text-secondary">{entry.time}</td>
                <td className="px-4 py-3 text-text-secondary font-medium">{entry.createdByName || 'System'}</td>
                <td className="px-4 py-3">
                  <Badge variant={entry.isActive ? 'success' : 'danger'}>
                    {entry.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
              </tr>
            ))}
          </Table>
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(l) => { setLimit(l); setPage(1); }}
          />
        </div>
      )}
    </AdminLayout>
  );
}
