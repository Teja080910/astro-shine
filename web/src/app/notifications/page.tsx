'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDate } from '@/lib/utils';
import { AdminLayout } from '@/components/AdminLayout';
import { GradientButton, CustomModal } from '@/components/UIComponents';
import { SearchInput } from '@/components/SearchInput';
import { Pagination, unwrapList } from '@/components/Pagination';
import { api } from '@/lib/api';
import type { Notification } from '@astro-shine/shared-types';

const audienceOptions = [
  { value: 'all_users', label: 'All Users' },
  { value: 'all_astrologers', label: 'All Astrologers' },
  { value: 'both', label: 'Both Users & Astrologers' },
];

const screenOptions = [
  { value: '', label: '— None —' },
  { value: 'Home', label: 'Home' },
  { value: 'Wallet', label: 'Wallet' },
  { value: 'Astrologers', label: 'Astrologers' },
  { value: 'Muhurat', label: 'Muhurat' },
  { value: 'Chat', label: 'Chat' },
  { value: 'Blogs', label: 'Blogs' },
  { value: 'BlogDetail', label: 'Blog Detail (needs Item ID)' },
  { value: 'News', label: 'News' },
  { value: 'NewsDetail', label: 'News Detail (needs Item ID)' },
  { value: 'Support', label: 'Support' },
  { value: 'TicketDetail', label: 'Support Ticket (needs Item ID)' },
  { value: 'Shop', label: 'Shop' },
  { value: 'Videos', label: 'Videos' },
  { value: 'Panchang', label: 'Panchang' },
  { value: 'OrderHistory', label: 'Order History' },
  { value: 'Donation', label: 'Donation' },
  { value: 'MandirPooja', label: 'Mandir Pooja' },
  { value: 'MandirPoojaDetail', label: 'Pooja Detail (needs Item ID)' },
  { value: 'Gifts', label: 'Gifts' },
  { value: 'AstrologerDetail', label: 'Astrologer Detail (needs Item ID)' },
];

const needsItemId = ['BlogDetail', 'NewsDetail', 'TicketDetail', 'MandirPoojaDetail', 'AstrologerDetail'];

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
  const [form, setForm] = useState({ title: '', body: '', type: 'system', targetAudience: 'all_users', screen: '', itemId: '' });
  const [formError, setFormError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchAll = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (debouncedSearch) params.set('q', debouncedSearch);
    api.get<any>(`/notifications?${params.toString()}`)
      .then((res) => {
        const list = unwrapList<Notification>(res);
        setData(list.data);
        setTotal(list.total);
        setTotalPages(list.totalPages);
      })
      .catch((e) => setError(e.message || 'Failed to load notifications'))
      .finally(() => setLoading(false));
  }, [page, limit, debouncedSearch]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const sendNotification = async () => {
    if (!form.title.trim()) { setFormError('Title is required'); return; }
    if (!form.body.trim()) { setFormError('Body is required'); return; }
    setFormError('');
    try {
      const payload: any = {
        title: form.title,
        body: form.body,
        type: form.type,
        targetAudience: form.targetAudience,
      };
      if (form.screen) {
        payload.data = { screen: form.screen, ...(form.itemId.trim() ? { itemId: form.itemId.trim() } : {}) };
      }
      await api.post<any>('/notifications', payload);
      setComposing(false);
      setForm({ title: '', body: '', type: 'system', targetAudience: 'all_users', screen: '', itemId: '' });
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

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchInput value={search} onChange={setSearch} placeholder="Search notifications by title, body, type, or target..." />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64" style={{ color: 'var(--text-secondary)' }}>Loading notifications...</div>
      ) : error ? (
        <div className="rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#EF4444' }}>{error}</div>
      ) : (
        <div className="glass-card p-6">
          {filtered.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>{data.length === 0 ? 'No notifications sent yet.' : 'No notifications match your search.'}</p> :
            filtered.slice(0, 50).map(n => {
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
          <div><label className="text-sm block mb-1" style={{ color: 'var(--text-secondary)' }}>Opens screen (optional)</label><select className="input-field" value={form.screen} onChange={e => setForm({ ...form, screen: e.target.value, itemId: '' })}>{screenOptions.map(o => (<option key={o.value} value={o.value}>{o.label}</option>))}</select></div>
          {needsItemId.includes(form.screen) && (
            <div><label className="text-sm block mb-1" style={{ color: 'var(--text-secondary)' }}>Item ID (blog / ticket / pooja / astrologer ID)</label><input className="input-field" value={form.itemId} onChange={e => setForm({ ...form, itemId: e.target.value })} /></div>
          )}
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
