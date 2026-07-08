'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { GradientButton, CustomModal } from '@/components/UIComponents';
import { api } from '@/lib/api';
import type { NewsItem } from '@astro-shine/shared-types';

export default function NewsPage() {
  const [data, setData] = useState<NewsItem[]>([]);
  const [editing, setEditing] = useState<NewsItem | null>(null);
  const [form, setForm] = useState({ title: '', content: '', image: '' });

  useEffect(() => { api.get<NewsItem[]>('/news/admin').then(setData).catch(() => {}); }, []);

  const save = async () => {
    if (editing?.id) { await api.put<any>(`/news/${editing.id}`, form); }
    else { await api.post<any>('/news', form); }
    setEditing(null);
    setForm({ title: '', content: '', image: '' });
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-text-primary">News</h1>
        <button onClick={() => setEditing({} as NewsItem)} className="gradient-btn">Add News</button>
      </div>
      <div className="grid gap-4">
        {data.map(n => (
          <div key={n.id} className="glass-card-solid p-4 flex justify-between items-center">
            <div><p className="text-text-primary font-medium">{n.title}</p><p className="text-text-muted text-sm">{n.isActive ? 'Active' : 'Inactive'}</p></div>
            <button onClick={() => { setEditing(n); setForm({ title: n.title, content: n.content, image: n.image || '' }); }} className="text-primary-light hover:underline text-sm">Edit</button>
          </div>
        ))}
      </div>

      <CustomModal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit News' : 'Add News'}>
        <div className="space-y-4">
          <div><label className="text-text-secondary text-sm block mb-1">Title</label><input className="input-field" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
          <div><label className="text-text-secondary text-sm block mb-1">Content</label><textarea className="input-field h-32" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} /></div>
          <div><label className="text-text-secondary text-sm block mb-1">Image URL</label><input className="input-field" value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} /></div>
          <GradientButton onClick={save}>Save</GradientButton>
        </div>
      </CustomModal>
    </AdminLayout>
  );
}
