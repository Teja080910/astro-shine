'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { GradientButton, CustomModal } from '@/components/UIComponents';
import { api } from '@/lib/api';
import type { DynamicLink } from '@astro-shine/shared-types';

export default function DynamicLinksPage() {
  const [data, setData] = useState<DynamicLink[]>([]);
  const [editing, setEditing] = useState<Partial<DynamicLink> | null>(null);

  useEffect(() => { api.get<DynamicLink[]>('/dynamic-links/admin').then(setData).catch(() => {}); }, []);

  const save = async () => {
    if (editing?.id) {
      await api.put<any>(`/dynamic-links/${editing.id}`, editing);
    } else {
      await api.post<any>('/dynamic-links', editing);
    }
    setEditing(null);
    api.get<DynamicLink[]>('/dynamic-links/admin').then(setData);
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-text-primary">Dynamic Links</h1>
        <button onClick={() => setEditing({ pageName: '', url: '' })} className="gradient-btn">Add Link</button>
      </div>
      <div className="grid gap-4">
        {data.map(l => (
          <div key={l.id} className="glass-card-solid p-4 flex justify-between items-center">
            <div><p className="text-text-primary font-medium">{l.pageName}</p><a href={l.url} target="_blank" className="text-primary-light text-sm hover:underline">{l.url}</a></div>
            <button onClick={() => setEditing(l)} className="text-primary-light hover:underline text-sm">Edit</button>
          </div>
        ))}
      </div>

      <CustomModal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit Link' : 'Add Link'}>
        <div className="space-y-4">
          <div><label className="text-text-secondary text-sm block mb-1">Page Name</label><input className="input-field" value={editing?.pageName || ''} onChange={e => setEditing({ ...editing, pageName: e.target.value })} /></div>
          <div><label className="text-text-secondary text-sm block mb-1">URL</label><input className="input-field" value={editing?.url || ''} onChange={e => setEditing({ ...editing, url: e.target.value })} /></div>
          <GradientButton onClick={save}>Save</GradientButton>
        </div>
      </CustomModal>
    </AdminLayout>
  );
}
