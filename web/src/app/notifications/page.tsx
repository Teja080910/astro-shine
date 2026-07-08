'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { GradientButton, CustomModal } from '@/components/UIComponents';
import { api } from '@/lib/api';
import type { Notification } from '@astro-shine/shared-types';

export default function NotificationsPage() {
  const [data, setData] = useState<Notification[]>([]);
  const [composing, setComposing] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', type: 'system' });

  useEffect(() => { api.get<Notification[]>('/notifications').then(setData).catch(() => {}); }, []);

  const sendNotification = async () => {
    await api.post<any>('/notifications', form);
    setComposing(false);
    setForm({ title: '', body: '', type: 'system' });
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-text-primary">Notifications</h1>
        <button onClick={() => setComposing(true)} className="gradient-btn">Compose</button>
      </div>
      <div className="glass-card p-6">
        {data.length === 0 ? <p className="text-text-secondary">No notifications sent yet.</p> :
          data.slice(0, 10).map(n => (
            <div key={n.id} className="border-b border-divider py-3 last:border-0">
              <p className="text-text-primary font-medium">{n.title}</p>
              <p className="text-text-secondary text-sm">{n.body}</p>
              <span className="text-text-muted text-xs">{new Date(n.createdAt).toLocaleString()}</span>
            </div>
          ))}
      </div>

      <CustomModal open={composing} onClose={() => setComposing(false)} title="Compose Notification">
        <div className="space-y-4">
          <div><label className="text-text-secondary text-sm block mb-1">Title</label><input className="input-field" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
          <div><label className="text-text-secondary text-sm block mb-1">Body</label><textarea className="input-field h-24" value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} /></div>
          <div><label className="text-text-secondary text-sm block mb-1">Type</label><select className="input-field" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="system">System</option><option value="promotional">Promotional</option><option value="transactional">Transactional</option><option value="reminder">Reminder</option></select></div>
          <GradientButton onClick={sendNotification}>Send</GradientButton>
        </div>
      </CustomModal>
    </AdminLayout>
  );
}
