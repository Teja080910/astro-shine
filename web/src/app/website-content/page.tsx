'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { GradientButton, CustomModal } from '@/components/UIComponents';
import { api } from '@/lib/api';
import type { WebsiteContent } from '@astro-shine/shared-types';

export default function WebsiteContentPage() {
  const [data, setData] = useState<WebsiteContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<{ section: string; content: string }>({ section: '', content: '' });
  const [formError, setFormError] = useState('');

  const fetchContent = () => {
    api.get<WebsiteContent[]>('/website-content/admin')
      .then(setData)
      .catch((e) => setError(e.message || 'Failed to load content'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchContent(); }, []);

  const save = async () => {
    if (!editing.section.trim()) { setFormError('Section name is required'); return; }
    let parsed: any = editing.content;
    try { parsed = JSON.parse(editing.content); } catch { setFormError('Content must be valid JSON'); return; }
    setFormError('');
    try {
      await api.post<any>(`/website-content/section/${editing.section}`, { content: parsed });
      setEditing({ section: '', content: '' });
      fetchContent();
    } catch (e: any) {
      setFormError(e.message || 'Failed to save content');
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-text-primary">Website Content</h1>
        <button onClick={() => { setEditing({ section: '', content: '' }); setFormError(''); }} className="gradient-btn">Add Section</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-text-secondary">Loading content...</div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-800 text-red-400 rounded-lg px-4 py-3 text-sm">{error}</div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {data.map(w => (
            <div key={w.id} className="glass-card-solid p-4 cursor-pointer hover:bg-surface-light/50" onClick={() => { setEditing({ section: w.section, content: JSON.stringify(w.content, null, 2) }); setFormError(''); }}>
              <p className="text-text-primary font-medium">{w.section}</p>
              <p className="text-text-muted text-sm truncate">{JSON.stringify(w.content)}</p>
            </div>
          ))}
        </div>
      )}

      <CustomModal open={!!editing.section || editing.section === ''} onClose={() => setEditing({ section: '', content: '' })} title="Edit Section">
        <div className="space-y-4">
          {formError && <div className="text-sm text-red-400 font-medium">{formError}</div>}
          <div><label className="text-text-secondary text-sm block mb-1">Section *</label><input className="input-field" value={editing.section} onChange={e => setEditing({ ...editing, section: e.target.value })} /></div>
          <div><label className="text-text-secondary text-sm block mb-1">Content (JSON) *</label><textarea className="input-field h-32 font-mono text-sm" value={editing.content} onChange={e => setEditing({ ...editing, content: e.target.value })} /></div>
          <GradientButton onClick={save}>Save</GradientButton>
        </div>
      </CustomModal>
    </AdminLayout>
  );
}
