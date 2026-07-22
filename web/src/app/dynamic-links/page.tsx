'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { GradientButton, CustomModal } from '@/components/UIComponents';
import { api } from '@/lib/api';
import type { DynamicLink } from '@astro-shine/shared-types';

export default function DynamicLinksPage() {
  const [data, setData] = useState<DynamicLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Partial<DynamicLink> | null>(null);
  const [formError, setFormError] = useState('');

  const fetchLinks = () => {
    api.get<DynamicLink[]>('/dynamic-links/admin')
      .then(setData)
      .catch((e) => setError(e.message || 'Failed to load links'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLinks(); }, []);

  const save = async () => {
    if (!editing?.pageName?.trim()) { setFormError('Page name is required'); return; }
    if (!editing?.url?.trim()) { setFormError('URL is required'); return; }
    if (!editing.url.match(/^https?:\/\/.+/)) { setFormError('URL must be a valid URL starting with http:// or https://'); return; }
    setFormError('');
    try {
      if (editing?.id) {
        await api.put<any>(`/dynamic-links/${editing.id}`, editing);
      } else {
        await api.post<any>('/dynamic-links', editing);
      }
      setEditing(null);
      fetchLinks();
    } catch (e: any) {
      setFormError(e.message || 'Failed to save link');
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-text-primary">Dynamic Links</h1>
        <button onClick={() => { setEditing({ pageName: '', url: '' }); setFormError(''); }} className="gradient-btn">Add Link</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-text-secondary">Loading links...</div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-800 text-red-400 rounded-lg px-4 py-3 text-sm">{error}</div>
      ) : (
        <div className="grid gap-4">
          {data.map(l => (
            <div key={l.id} className="glass-card-solid p-4 flex justify-between items-center">
              <div><p className="text-text-primary font-medium">{l.pageName}</p><a href={l.url} target="_blank" rel="noopener noreferrer" className="text-primary-light text-sm hover:underline">{l.url}</a></div>
              <button onClick={() => { setEditing(l); setFormError(''); }} className="text-primary-light hover:underline text-sm">Edit</button>
            </div>
          ))}
        </div>
      )}

      <CustomModal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit Link' : 'Add Link'}>
        <div className="space-y-4">
          {formError && <div className="text-sm text-red-400 font-medium">{formError}</div>}
          <div><label className="text-text-secondary text-sm block mb-1">Page Name *</label><input className="input-field" value={editing?.pageName || ''} onChange={e => setEditing({ ...editing, pageName: e.target.value })} /></div>
          <div><label className="text-text-secondary text-sm block mb-1">URL *</label><input className="input-field" value={editing?.url || ''} onChange={e => setEditing({ ...editing, url: e.target.value })} placeholder="https://..." /></div>
          <GradientButton onClick={save}>Save</GradientButton>
        </div>
      </CustomModal>
    </AdminLayout>
  );
}
