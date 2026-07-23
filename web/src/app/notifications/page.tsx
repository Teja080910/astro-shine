'use client';

import { useState, useEffect } from 'react';
import { formatDate } from '@/lib/utils';
import { AdminLayout } from '@/components/AdminLayout';
import { GradientButton, CustomModal } from '@/components/UIComponents';
import { api } from '@/lib/api';
import type { Notification } from '@astro-shine/shared-types';

export default function NotificationsPage() {
  const [data, setData] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [composing, setComposing] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', type: 'system' });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    api.get<Notification[]>('/notifications')
      .then(setData)
      .catch((e) => setError(e.message || 'Failed to load notifications'))
      .finally(() => setLoading(false));
  }, []);

  const sendNotification = async () => {
    if (!form.title.trim()) { setFormError('Title is required'); return; }
    if (!form.body.trim()) { setFormError('Body is required'); return; }
    setFormError('');
    try {
      await api.post<any>('/notifications', form);
      setComposing(false);
      setForm({ title: '', body: '', type: 'system' });
      const updated = await api.get<Notification[]>('/notifications');
      setData(updated);
    } catch (e: any) {
      setFormError(e.message || 'Failed to send notification');
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-text-primary">Notifications</h1>
        <button onClick={() => { setComposing(true); setFormError(''); }} className="gradient-btn">Compose</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-text-secondary">Loading notifications...</div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-800 text-red-400 rounded-lg px-4 py-3 text-sm">{error}</div>
      ) : (
        <div className="glass-card p-6">
          {data.length === 0 ? <p className="text-text-secondary">No notifications sent yet.</p> :
            data.slice(0, 50).map(n => (
              <div key={n.id} className="border-b border-divider py-3 last:border-0">
                <p className="text-text-primary font-medium">{n.title}</p>
                <p className="text-text-secondary text-sm">{n.body}</p>
                <span className="text-text-muted text-xs">{formatDate(n.createdAt)}</span>
              </div>
            ))}
        </div>
      )}

      <CustomModal open={composing} onClose={() => setComposing(false)} title="Compose Notification">
        <div className="space-y-4">
          {formError && <div className="text-sm text-red-400 font-medium">{formError}</div>}
          <div><label className="text-text-secondary text-sm block mb-1">Title *</label><input className="input-field" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
          <div><label className="text-text-secondary text-sm block mb-1">Body *</label><textarea className="input-field h-24" value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} /></div>
          <div><label className="text-text-secondary text-sm block mb-1">Type</label><select className="input-field" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="system">System</option><option value="promotional">Promotional</option><option value="transactional">Transactional</option><option value="reminder">Reminder</option></select></div>
          <GradientButton onClick={sendNotification}>Send</GradientButton>
        </div>
      </CustomModal>
    </AdminLayout>
  );
}
