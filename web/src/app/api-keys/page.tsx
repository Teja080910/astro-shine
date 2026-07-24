'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { GradientButton, CustomModal } from '@/components/UIComponents';
import { api } from '@/lib/api';
import type { ApiKey } from '@astro-shine/shared-types';

export default function ApiKeysPage() {
  const [data, setData] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Partial<ApiKey> | null>(null);
  const [formError, setFormError] = useState('');

  const fetchKeys = () => {
    api.get<ApiKey[]>('/api-keys')
      .then(setData)
      .catch((e) => setError(e.message || 'Failed to load API keys'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchKeys(); }, []);

  const save = async () => {
    if (!editing?.provider?.trim()) { setFormError('Provider is required'); return; }
    if (!editing?.keyName?.trim()) { setFormError('Key name is required'); return; }
    if (!editing?.apiKey?.trim()) { setFormError('API key is required'); return; }
    setFormError('');
    try {
      if (editing?.id) {
        await api.put<any>(`/api-keys/${editing.id}`, editing);
      } else {
        await api.post<any>('/api-keys', editing);
      }
      setEditing(null);
      fetchKeys();
    } catch (e: any) {
      setFormError(e.message || 'Failed to save API key');
    }
  };

  const maskKey = (key: string) => key ? key.slice(0, 6) + '...' + key.slice(-4) : '';

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-text-primary">API Keys</h1>
        <button onClick={() => { setEditing({ provider: '', keyName: '', apiKey: '' }); setFormError(''); }} className="gradient-btn">Add Key</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-text-secondary">Loading API keys...</div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-800 text-red-400 rounded-lg px-4 py-3 text-sm">{error}</div>
      ) : (
        <div className="space-y-3">
          {data.map(k => (
            <div key={k.id} className="glass-card-solid p-4 flex justify-between items-center">
              <div><p className="text-text-primary font-medium">{k.provider} · {k.keyName}</p><p className="text-text-muted text-sm font-mono">{maskKey(k.apiKey)}</p></div>
              <button onClick={() => { setEditing(k); setFormError(''); }} className="text-primary-light hover:underline text-sm">Edit</button>
            </div>
          ))}
        </div>
      )}

      <CustomModal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit API Key' : 'Add API Key'}>
        <div className="space-y-4">
          {formError && <div className="text-sm text-red-400 font-medium">{formError}</div>}
          <div><label className="text-text-secondary text-sm block mb-1">Provider *</label><input className="input-field" value={editing?.provider || ''} onChange={e => setEditing({ ...editing, provider: e.target.value })} /></div>
          <div><label className="text-text-secondary text-sm block mb-1">Key Name *</label><input className="input-field" value={editing?.keyName || ''} onChange={e => setEditing({ ...editing, keyName: e.target.value })} /></div>
          <div><label className="text-text-secondary text-sm block mb-1">API Key *</label><input className="input-field" value={editing?.apiKey || ''} onChange={e => setEditing({ ...editing, apiKey: e.target.value })} type="password" /></div>
          <GradientButton onClick={save}>Save</GradientButton>
        </div>
      </CustomModal>
    </AdminLayout>
  );
}
