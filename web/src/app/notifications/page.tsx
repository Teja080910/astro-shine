'use client';

import { useState, useEffect } from 'react';
import { formatDate } from '@/lib/utils';
import { AdminLayout } from '@/components/AdminLayout';
import { GradientButton, CustomModal } from '@/components/UIComponents';
import { api } from '@/lib/api';
import type { Notification } from '@astro-shine/shared-types';

const audienceOptions = [
  { value: 'all_users', label: 'All Users' },
  { value: 'all_astrologers', label: 'All Astrologers' },
  { value: 'both', label: 'Both Users & Astrologers' },
];

const typeStyles: Record<string, { bg: string; text: string }> = {
  system: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3B82F6' },
  promotional: { bg: 'rgba(168, 85, 247, 0.15)', text: '#A855F7' },
  transactional: { bg: 'rgba(34, 197, 94, 0.15)', text: '#22C55E' },
  reminder: { bg: 'rgba(234, 179, 8, 0.15)', text: '#EAB308' },
};

export default function NotificationsPage() {
  const [data, setData] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [composing, setComposing] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', type: 'system', targetAudience: 'all_users' });
  const [formError, setFormError] = useState('');

  const fetchAll = () => {
    api.get<Notification[]>('/notifications')
      .then(setData)
      .catch((e) => setError(e.message || 'Failed to load notifications'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const sendNotification = async () => {
    if (!form.title.trim()) { setFormError('Title is required'); return; }
    if (!form.body.trim()) { setFormError('Body is required'); return; }
    setFormError('');
    try {
      await api.post<any>('/notifications', form);
      setComposing(false);
      setForm({ title: '', body: '', type: 'system', targetAudience: 'all_users' });
      fetchAll();
    } catch (e: any) {
      setFormError(e.message || 'Failed to send notification');
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Notifications</h1>
        <button onClick={() => { setComposing(true); setFormError(''); }} className="gradient-btn">Compose</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64" style={{ color: 'var(--text-secondary)' }}>Loading notifications...</div>
      ) : error ? (
        <div className="rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#EF4444' }}>{error}</div>
      ) : (
        <div className="glass-card p-6">
          {data.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No notifications sent yet.</p> :
            data.slice(0, 50).map(n => {
              const ts = typeStyles[n.type] || typeStyles.system;
              return (
                <div key={n.id} className="border-b py-3 last:border-0" style={{ borderColor: 'var(--divider)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: ts.bg, color: ts.text }}>{n.type}</span>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{n.title}</p>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{n.body}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{formatDate(n.createdAt)}</span>
                    {n.userId && <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>→ User → {(n as any).targetName || 'Unknown'}</span>}
                    {n.astrologerId && <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>→ Astrologer → {(n as any).targetName || 'Unknown'}</span>}
                    {!n.userId && !n.astrologerId && <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>→ (no target)</span>}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      <CustomModal open={composing} onClose={() => setComposing(false)} title="Compose Notification">
        <div className="space-y-4">
          {formError && <div className="text-sm font-medium" style={{ color: '#EF4444' }}>{formError}</div>}
          <div><label className="text-sm block mb-1" style={{ color: 'var(--text-secondary)' }}>Title *</label><input className="input-field" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
          <div><label className="text-sm block mb-1" style={{ color: 'var(--text-secondary)' }}>Body *</label><textarea className="input-field h-24" value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} /></div>
          <div><label className="text-sm block mb-1" style={{ color: 'var(--text-secondary)' }}>Type</label><select className="input-field" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="system">System</option><option value="promotional">Promotional</option><option value="transactional">Transactional</option><option value="reminder">Reminder</option></select></div>
          <div>
            <label className="text-sm block mb-1" style={{ color: 'var(--text-secondary)' }}>Send To</label>
            <div className="flex flex-col gap-2">
              {audienceOptions.map(o => (
                <label key={o.value} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="targetAudience" value={o.value} checked={form.targetAudience === o.value} onChange={e => setForm({ ...form, targetAudience: e.target.value })} className="accent-amber-500" />
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{o.label}</span>
                </label>
              ))}
            </div>
          </div>
          <GradientButton onClick={sendNotification}>Send</GradientButton>
        </div>
      </CustomModal>
    </AdminLayout>
  );
}
