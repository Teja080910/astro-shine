'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { GradientButton, CustomModal } from '@/components/UIComponents';
import { SearchInput } from '@/components/SearchInput';
import { Pagination, unwrapList } from '@/components/Pagination';
import { ImageUpload } from '@/components/ImageUpload';
import { imageSrc } from '@/lib/media';
import { api } from '@/lib/api';
import type { NewsItem } from '@astro-shine/shared-types';

export default function NewsPage() {
  const [data, setData] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<NewsItem | null>(null);
  const [form, setForm] = useState({ title: '', content: '', image: '', isActive: true });
  const [formError, setFormError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchNews = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (debouncedSearch) params.set('q', debouncedSearch);
    api.get<any>(`/news/admin?${params.toString()}`)
      .then((res) => {
        const list = unwrapList<NewsItem>(res);
        setData(list.data);
        setTotal(list.total);
        setTotalPages(list.totalPages);
      })
      .catch((e) => setError(e.message || 'Failed to load news'))
      .finally(() => setLoading(false));
  }, [page, limit, debouncedSearch]);

  useEffect(() => { fetchNews(); }, [fetchNews]);

  const save = async () => {
    if (!form.title.trim()) { setFormError('Title is required'); return; }
    if (!form.content.trim()) { setFormError('Content is required'); return; }
    setFormError('');
    try {
      if (editing?.id) { await api.put<any>(`/news/${editing.id}`, form); }
      else { await api.post<any>('/news', form); }
      setEditing(null);
      setForm({ title: '', content: '', image: '', isActive: true });
      fetchNews();
    } catch (e: any) {
      setFormError(e.message || 'Failed to save news');
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-text-primary">News</h1>
        <button onClick={() => { setEditing({} as NewsItem); setFormError(''); setForm({ title: '', content: '', image: '', isActive: true }); }} className="gradient-btn">Add News</button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchInput value={search} onChange={setSearch} placeholder="Search news by title or content..." onEnter={() => { setDebouncedSearch(search); setPage(1); }} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-text-secondary">Loading news...</div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-800 text-red-400 rounded-lg px-4 py-3 text-sm">{error}</div>
      ) : (
        <div className="grid gap-4">
          {data.map(n => (
            <div key={n.id} className="glass-card-solid p-4 flex justify-between items-center">
              <div className="flex items-center gap-4">
                {n.image ? (
                  <img src={imageSrc(n.image)} alt={n.title} className="w-14 h-14 rounded-xl object-cover border border-card-border shrink-0" />
                ) : null}
                <div>
                  <p className="text-text-primary font-medium text-base">{n.title}</p>
                  <p className="text-text-muted text-sm">{n.isActive ? 'Active' : 'Inactive'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => { setEditing(n); setFormError(''); setForm({ title: n.title, content: n.content, image: n.image || '', isActive: n.isActive }); }} className="text-primary-light hover:underline text-sm font-medium">Edit</button>
                <button onClick={async () => { if (confirm('Delete this news item?')) { try { await api.del(`/news/${n.id}`); fetchNews(); } catch (e: any) { setError(e.message || 'Failed to delete news'); } } }} className="text-red-400 hover:underline text-sm font-medium">Delete</button>
              </div>
            </div>
          ))}
          {data.length === 0 && (
            <div className="glass-card-solid p-8 text-center text-text-muted">No news articles found.</div>
          )}
        </div>
      )}
      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={(l) => { setLimit(l); setPage(1); }}
      />

      <CustomModal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit News' : 'Add News'}>
        <div className="space-y-4">
          {formError && <div className="text-sm text-red-400 font-medium">{formError}</div>}
          <div><label className="text-text-secondary text-sm block mb-1">Title *</label><input className="input-field" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="News headline" /></div>
          <div><label className="text-text-secondary text-sm block mb-1">Content *</label><textarea className="input-field h-32" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="News content..." /></div>
          <div>
            <label className="text-text-secondary text-sm block mb-1">Image</label>
            <ImageUpload
              value={form.image ? [form.image] : []}
              onChange={(urls) => setForm({ ...form, image: urls[0] || '' })}
              hint="Upload a cover image for the news article"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="accent-amber-500" />
            <span className="text-sm text-text-primary">Visible in app (active)</span>
          </label>
          <GradientButton onClick={save}>Save</GradientButton>
        </div>
      </CustomModal>
    </AdminLayout>
  );
}
