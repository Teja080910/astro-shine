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

/**
 * Gift notifications are written for the user/astrologer who receives them
 * ("You received..."). In the admin log that copy is confusing, so describe
 * the transfer in the third person using the sender/receiver fields returned
 * by the API. Falls back to the stored body for older notifications.
 */
function adminNotificationText(n: Notification): string | null {
  const data: any = n.data || {};
  const type = typeof data.type === 'string' ? data.type : '';
  if (!type.startsWith('gift_')) return null;

  const targetName = (n as any).targetName as string | undefined;
  const senderName = data.senderName || (n.userId ? targetName : undefined);
  const receiverName =
    data.receiverName || (n.astrologerId ? targetName : undefined);
  const from = senderName || 'A user';
  const to = receiverName || 'an astrologer';
  const amount = data.amount ? `₹${Number(data.amount).toFixed(2)}` : '';
  const gift = data.giftName ? `gift "${data.giftName}"` : '';
  const details = [amount, gift].filter(Boolean).join(' ');
  const item = details ? `a ${details}` : 'a gift';

  switch (type) {
    case 'gift_success':
      return `${from} sent ${item} to ${to} — payment successful.`;
    case 'gift_received':
      return `${to} received ${item} from ${from}.`;
    case 'gift_failed':
      return `${from}'s ${details || 'gift'} to ${to} could not be processed.`;
    case 'gift_initiated':
      return `${from} initiated ${item} to ${to}.`;
    default:
      return null;
  }
}

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
        <SearchInput value={search} onChange={setSearch} placeholder="Search notifications by title, body, or type..." onEnter={(v) => { setDebouncedSearch(v); setPage(1); }} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64" style={{ color: 'var(--text-secondary)' }}>Loading notifications...</div>
      ) : error ? (
        <div className="rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#EF4444' }}>{error}</div>
      ) : (
        <>
          <div className="glass-card p-6">
            {data.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>{debouncedSearch ? 'No notifications match your search.' : 'No notifications sent yet.'}</p> :
              data.map(n => {
                const ts = typeStyles[n.type] || typeStyles.system;
                const adminText = adminNotificationText(n);
                const meta: any = n.data || {};
                const eventStatus = typeof meta.status === 'string' ? meta.status : null;
                const targetRole = meta.audience === 'admin' ? 'admin' : 'user';
                return (
                  <div key={n.id} className="border-b py-3 last:border-0" style={{ borderColor: 'var(--divider)' }}>
                    <div className="flex items-start gap-2 mb-1 min-w-0">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded shrink-0" style={{ backgroundColor: ts.bg, color: ts.text }}>{n.type}</span>
                      <p className="font-medium break-words min-w-0" style={{ color: 'var(--text-primary)' }}>{n.title}</p>
                    </div>
                    <p className="text-sm break-words whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{adminText || n.body}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{formatDate(n.createdAt)}</span>
                      {eventStatus && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(148, 163, 184, 0.15)', color: 'var(--text-secondary)' }}>
                          status: {eventStatus}
                        </span>
                      )}
                      {n.userId && <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>To {targetRole} · {(n as any).targetName || 'Unknown'}</span>}
                      {n.astrologerId && <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>To astrologer · {(n as any).targetName || 'Unknown'}</span>}
                      {!n.userId && !n.astrologerId && <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>To everyone</span>}
                    </div>
                  </div>
                );
              })}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(l) => { setLimit(l); setPage(1); }}
          />
        </>
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
