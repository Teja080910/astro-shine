'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { GradientButton, CustomModal } from '@/components/UIComponents';
import { api } from '@/lib/api';
import type { ApiKey } from '@astro-shine/shared-types';

export default function ApiKeysPage() {
  const [data, setData] = useState<ApiKey[]>([]);
  const [editing, setEditing] = useState<Partial<ApiKey> | null>(null);

  useEffect(() => { api.get<ApiKey[]>('/api-keys').then(setData).catch(() => {}); }, []);

  const save = async () => {
    if (editing?.id) {
      await api.put<any>(`/api-keys/${editing.id}`, editing);
    } else {
      await api.post<any>('/api-keys', editing);
    }
    setEditing(null);
    api.get<ApiKey[]>('/api-keys').then(setData);
  };

  const maskKey = (key: string) => key ? key.slice(0, 6) + '...' + key.slice(-4) : '';

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-text-primary">API Keys</h1>
        <button onClick={() => setEditing({ provider: '', keyName: '', apiKey: '' })} className="gradient-btn">Add Key</button>
      </div>
      <div className="space-y-3">
        {data.map(k => (
          <div key={k.id} className="glass-card-solid p-4 flex justify-between items-center">
            <div><p className="text-text-primary font-medium">{k.provider} · {k.keyName}</p><p className="text-text-muted text-sm font-mono">{maskKey(k.apiKey)}</p></div>
            <button onClick={() => setEditing(k)} className="text-primary-light hover:underline text-sm">Edit</button>
          </div>
        ))}
      </div>

      <CustomModal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit API Key' : 'Add API Key'}>
        <div className="space-y-4">
          <div><label className="text-text-secondary text-sm block mb-1">Provider</label><input className="input-field" value={editing?.provider || ''} onChange={e => setEditing({ ...editing, provider: e.target.value })} /></div>
          <div><label className="text-text-secondary text-sm block mb-1">Key Name</label><input className="input-field" value={editing?.keyName || ''} onChange={e => setEditing({ ...editing, keyName: e.target.value })} /></div>
          <div><label className="text-text-secondary text-sm block mb-1">API Key</label><input className="input-field" value={editing?.apiKey || ''} onChange={e => setEditing({ ...editing, apiKey: e.target.value })} type="password" /></div>
          <GradientButton onClick={save}>Save</GradientButton>
        </div>
      </CustomModal>
    </AdminLayout>
  );
}
