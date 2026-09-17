'use client';

import { useState, useEffect } from 'react';
import { formatDate } from '@/lib/utils';
import { AdminLayout } from '@/components/AdminLayout';
import { Table, Badge, GradientButton, CustomModal } from '@/components/UIComponents';
import { api } from '@/lib/api';

export default function VideosPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('');
  const [duration, setDuration] = useState('');

  useEffect(() => {
    api.get<any[]>('/videos')
      .then(setData)
      .catch((e) => setError(e.message || 'Failed to load videos'))
      .finally(() => setLoading(false));
  }, []);

  const openForm = (v: any) => {
    setSelected(v);
    setShowForm(true);
    setTitle(v?.title || '');
    setDescription(v?.description || '');
    setUrl(v?.url || '');
    setCategory(v?.category || '');
    setDuration(String(v?.duration ?? ''));
  };

  const closeForm = () => {
    setShowForm(false);
    setSelected(null);
  };

  const handleSave = async () => {
    if (!title.trim() || !url.trim()) return;
    const payload = { title, description, url, category, duration: duration ? parseInt(duration) : null };
    try {
      if (selected?.id) {
        const updated = await api.put(`/videos/${selected.id}`, payload);
        setData(data.map(v => v.id === selected.id ? updated : v));
      } else {
        const created = await api.post('/videos', payload);
        setData([...data, created]);
      }
      closeForm();
    } catch (e: any) { alert(e.message || 'Failed to save'); }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-text-primary">Videos</h1>
        <button onClick={() => openForm(null)} className="gradient-btn">Add Video</button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-64 text-text-secondary">Loading videos...</div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-800 text-red-400 rounded-lg px-4 py-3 text-sm">{error}</div>
      ) : (
        <Table headers={['Title', 'Category', 'Duration', 'Status', 'Date', '']} emptyMessage="No videos found">
          {data.map((v: any) => (
            <tr key={v.id} className="border-b border-divider hover:bg-surface-light/50">
              <td className="px-4 py-3 text-text-primary font-medium max-w-xs truncate">{v.title}</td>
              <td className="px-4 py-3 text-text-secondary">{v.category || '-'}</td>
              <td className="px-4 py-3 text-text-secondary">{v.duration ? `${Math.floor(v.duration / 60)}:${String(v.duration % 60).padStart(2, '0')}` : '-'}</td>
              <td className="px-4 py-3">{v.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="danger">Inactive</Badge>}</td>
              <td className="px-4 py-3 text-text-muted text-sm">{formatDate(v.createdAt)}</td>
              <td className="px-4 py-3"><button onClick={() => openForm(v)} className="text-primary-light hover:underline text-sm font-medium">Edit</button></td>
            </tr>
          ))}
        </Table>
      )}

      <CustomModal open={showForm} onClose={closeForm} title={selected?.id ? 'Edit Video' : 'Add Video'}>
        <div className="space-y-4 text-text-secondary text-sm p-2">
          <div><label className="block text-text-primary font-medium mb-1">Title</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input-field text-sm" /></div>
          <div><label className="block text-text-primary font-medium mb-1">Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-field h-20 text-sm" /></div>
          <div><label className="block text-text-primary font-medium mb-1">URL</label><input type="text" value={url} onChange={(e) => setUrl(e.target.value)} className="input-field text-sm" placeholder="https://..." /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-text-primary font-medium mb-1">Category</label><input type="text" value={category} onChange={(e) => setCategory(e.target.value)} className="input-field text-sm" /></div>
            <div><label className="block text-text-primary font-medium mb-1">Duration (sec)</label><input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="input-field text-sm" /></div>
          </div>
          <div className="flex gap-3 pt-3 border-t border-divider">
            <GradientButton onClick={handleSave}>Save</GradientButton>
            <GradientButton onClick={closeForm}>Cancel</GradientButton>
          </div>
        </div>
      </CustomModal>
    </AdminLayout>
  );
}
