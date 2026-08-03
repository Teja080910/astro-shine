'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Table, Badge, GradientButton, CustomModal } from '@/components/UIComponents';
import { api } from '@/lib/api';

export default function SettingsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    api.get<any[]>('/settings')
      .then(setData)
      .catch((e) => setError(e.message || 'Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const openForm = (s: any) => {
    setSelected(s);
    setKey(s?.key || '');
    setValue(typeof s?.value === 'object' ? JSON.stringify(s.value) : String(s?.value ?? ''));
    setDescription(s?.description || '');
  };

  const handleSave = async () => {
    if (!key.trim()) return;
    let parsedValue: any = value;
    try { parsedValue = JSON.parse(value); } catch {}
    try {
      if (selected?.id) {
        await api.post(`/settings/${key}`, { value: parsedValue });
      } else {
        await api.post(`/settings/${key}`, { value: parsedValue });
      }
      const updated = await api.get<any[]>('/settings');
      setData(updated);
      setSelected(null);
    } catch (e: any) { alert(e.message || 'Failed to save'); }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-text-primary">App Settings</h1>
        <button onClick={() => openForm(null)} className="gradient-btn">Add Setting</button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-64 text-text-secondary">Loading settings...</div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-800 text-red-400 rounded-lg px-4 py-3 text-sm">{error}</div>
      ) : (
        <Table headers={['Key', 'Value', 'Description', '']} emptyMessage="No settings found">
          {data.map((s: any) => (
            <tr key={s.id} className="border-b border-divider hover:bg-surface-light/50">
              <td className="px-4 py-3 text-text-primary font-mono font-bold text-sm">{s.key}</td>
              <td className="px-4 py-3 text-text-secondary text-sm max-w-xs truncate font-mono">{typeof s.value === 'object' ? JSON.stringify(s.value) : String(s.value)}</td>
              <td className="px-4 py-3 text-text-muted text-sm">{s.description || '-'}</td>
              <td className="px-4 py-3"><button onClick={() => openForm(s)} className="text-primary-light hover:underline text-sm font-medium">Edit</button></td>
            </tr>
          ))}
        </Table>
      )}

      <CustomModal open={!!selected || selected === null} onClose={() => setSelected(undefined)} title={selected?.id ? 'Edit Setting' : 'Add Setting'}>
        <div className="space-y-4 text-text-secondary text-sm p-2">
          <div><label className="block text-text-primary font-medium mb-1">Key</label><input type="text" value={key} onChange={(e) => setKey(e.target.value)} className="input-field text-sm font-mono" /></div>
          <div><label className="block text-text-primary font-medium mb-1">Value</label><textarea value={value} onChange={(e) => setValue(e.target.value)} className="input-field h-20 text-sm font-mono" placeholder="String, number, or JSON" /></div>
          <div><label className="block text-text-primary font-medium mb-1">Description</label><input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="input-field text-sm" /></div>
          <div className="flex gap-3 pt-3 border-t border-divider">
            <GradientButton onClick={handleSave}>Save</GradientButton>
            <GradientButton onClick={() => setSelected(null)}>Cancel</GradientButton>
          </div>
        </div>
      </CustomModal>
    </AdminLayout>
  );
}
