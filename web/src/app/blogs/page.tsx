'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { GradientButton, CustomModal, Badge } from '@/components/UIComponents';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useSocket } from '@/hooks/useSocket';
import type { Blog } from '@astro-shine/shared-types';

export default function BlogsPage() {
  const { admin } = useAuthStore();
  const [data, setData] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Blog | null>(null);
  const [form, setForm] = useState({ title: '', slug: '', content: '', status: 'draft' as string, tags: '' });
  const [formError, setFormError] = useState('');
  const [showMine, setShowMine] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Blog | null>(null);

  const fetchBlogs = useCallback(() => {
    const endpoint = showMine ? '/blogs/my' : '/blogs';
    api.get<Blog[]>(endpoint)
      .then(setData)
      .catch((e) => setError(e.message || 'Failed to load blogs'))
      .finally(() => setLoading(false));
  }, [showMine]);

  useEffect(() => { fetchBlogs(); }, [fetchBlogs]);

  useSocket({
    'blog:published': () => { fetchBlogs(); },
    'blog:updated': () => { fetchBlogs(); },
    'blog:deleted': () => { fetchBlogs(); },
  });

  const save = async () => {
    if (!form.title.trim()) { setFormError('Title is required'); return; }
    if (!form.slug.trim()) { setFormError('Slug is required'); return; }
    if (!form.content.trim()) { setFormError('Content is required'); return; }
    setFormError('');
    try {
      const payload = { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) };
      if (editing?.id) { await api.put<any>(`/blogs/${editing.id}`, payload); }
      else { await api.post<any>('/blogs', payload); }
      setEditing(null);
      setForm({ title: '', slug: '', content: '', status: 'draft', tags: '' });
      fetchBlogs();
    } catch (e: any) {
      setFormError(e.message || 'Failed to save blog');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.del(`/blogs/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchBlogs();
    } catch (e: any) { alert(e.message || 'Failed to delete'); }
  };

  const statusBadge = (s: string) => {
    const colors: Record<string, 'success' | 'warning' | 'info'> = { published: 'success', draft: 'warning', archived: 'info' };
    return <Badge variant={colors[s] || 'info'}>{s.charAt(0).toUpperCase() + s.slice(1)}</Badge>;
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-text-primary">Blogs</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowMine(!showMine)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${showMine ? 'bg-accent-gold text-white' : 'bg-surface-light text-text-secondary'}`}>
            {showMine ? 'All Blogs' : 'My Blogs'}
          </button>
          <button onClick={() => { setEditing({} as Blog); setFormError(''); setForm({ title: '', slug: '', content: '', status: 'draft', tags: '' }); }} className="gradient-btn">New Blog</button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-text-secondary">Loading blogs...</div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-800 text-red-400 rounded-lg px-4 py-3 text-sm">{error}</div>
      ) : (
        <div className="grid gap-4">
          {data.map(b => (
            <div key={b.id} className="glass-card-solid p-4 flex justify-between items-center">
              <div>
                <p className="text-text-primary font-medium">{b.title}</p>
                <p className="text-text-muted text-sm">{b.slug} · {statusBadge(b.status)}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditing(b); setFormError(''); setForm({ title: b.title, slug: b.slug, content: b.content, status: b.status, tags: (b.tags || []).join(', ') }); }} className="text-primary-light hover:underline text-sm">Edit</button>
                <button onClick={() => setDeleteTarget(b)} className="text-red-400 hover:underline text-sm">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CustomModal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit Blog' : 'New Blog'}>
        <div className="space-y-4">
          {formError && <div className="text-sm text-red-400 font-medium">{formError}</div>}
          <div><label className="text-text-secondary text-sm block mb-1">Title *</label><input className="input-field" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
          <div><label className="text-text-secondary text-sm block mb-1">Slug *</label><input className="input-field" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} /></div>
          <div><label className="text-text-secondary text-sm block mb-1">Content *</label><textarea className="input-field h-32" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} /></div>
          <div><label className="text-text-secondary text-sm block mb-1">Tags (comma separated)</label><input className="input-field" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} /></div>
          <div><label className="text-text-secondary text-sm block mb-1">Status</label><select className="input-field" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></div>
          <GradientButton onClick={save}>Save</GradientButton>
        </div>
      </CustomModal>

      <CustomModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Blog">
        <div className="space-y-4">
          <p className="text-text-secondary text-sm">Are you sure you want to delete <strong className="text-text-primary">{deleteTarget?.title}</strong>? This action cannot be undone.</p>
          <div className="flex gap-2">
            <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2 rounded-lg border border-divider text-text-secondary text-sm font-semibold">Cancel</button>
            <button onClick={confirmDelete} className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold">Delete</button>
          </div>
        </div>
      </CustomModal>
    </AdminLayout>
  );
}
