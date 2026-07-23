'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { GradientButton, CustomModal } from '@/components/UIComponents';
import { api } from '@/lib/api';
import type { Blog } from '@astro-shine/shared-types';

export default function BlogsPage() {
  const [data, setData] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Blog | null>(null);
  const [form, setForm] = useState({ title: '', slug: '', content: '', status: 'draft' as string, tags: '' });
  const [formError, setFormError] = useState('');

  const fetchBlogs = () => {
    api.get<Blog[]>('/blogs')
      .then(setData)
      .catch((e) => setError(e.message || 'Failed to load blogs'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBlogs(); }, []);

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

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-text-primary">Blogs</h1>
        <button onClick={() => { setEditing({} as Blog); setFormError(''); }} className="gradient-btn">New Blog</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-text-secondary">Loading blogs...</div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-800 text-red-400 rounded-lg px-4 py-3 text-sm">{error}</div>
      ) : (
        <div className="grid gap-4">
          {data.map(b => (
            <div key={b.id} className="glass-card-solid p-4 flex justify-between items-center">
              <div><p className="text-text-primary font-medium">{b.title}</p><p className="text-text-muted text-sm">{b.slug} · {b.status}</p></div>
              <button onClick={() => { setEditing(b); setFormError(''); setForm({ title: b.title, slug: b.slug, content: b.content, status: b.status, tags: (b.tags || []).join(', ') }); }} className="text-primary-light hover:underline text-sm">Edit</button>
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
    </AdminLayout>
  );
}
