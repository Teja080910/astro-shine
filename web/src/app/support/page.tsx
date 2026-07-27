'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDate } from '@/lib/utils';
import { AdminLayout } from '@/components/AdminLayout';
import { Table, Badge, GradientButton, CustomModal } from '@/components/UIComponents';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useSocket } from '@/hooks/useSocket';
import { X } from 'lucide-react';

const STATUS_COLORS: Record<string, 'warning' | 'info' | 'success'> = { open: 'warning', in_progress: 'info', resolved: 'success', closed: 'success' };
const PRIORITY_COLORS: Record<string, 'info' | 'warning' | 'danger'> = { low: 'info', normal: 'warning', high: 'danger', urgent: 'danger' };

function statusColor(s: string): 'warning' | 'info' | 'success' { return STATUS_COLORS[s] || 'info'; }
function priorityColor(p: string): 'info' | 'warning' | 'danger' { return PRIORITY_COLORS[p] || 'info'; }

export default function SupportPage() {
  const { admin } = useAuthStore();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [reply, setReply] = useState('');
  const [replies, setReplies] = useState<any[]>([]);
  const [sending, setSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [userMap, setUserMap] = useState<Record<string, string>>({});

  useEffect(() => {
    api.get<any[]>('/users').catch(() => []).then((users) => {
      const uMap: Record<string, string> = {};
      users.forEach((u: any) => { uMap[u.id] = u.name || u.email; });
      setUserMap(uMap);
    });
  }, []);

  const loadTickets = useCallback(async (status?: string) => {
    try {
      const data = await api.get<any[]>(`/support/admin/tickets${status ? `?status=${status}` : ''}`);
      setTickets(data);
    } catch (e: any) { setError(e.message || 'Failed to load tickets'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadTickets(statusFilter); }, [statusFilter, loadTickets]);

  useSocket({
    'support:ticket-updated': () => { loadTickets(statusFilter); },
    'support:reply-added': () => { if (selected) openTicket(selected); },
  });

  const openTicket = async (t: any) => {
    setSelected(t);
    try {
      const r = await api.get<any[]>(`/support/tickets/${t.id}/replies`);
      setReplies(r);
    } catch { setReplies([]); }
    setReply('');
  };

  const handleReply = async () => {
    if (!reply.trim() || !selected) return;
    setSending(true);
    try {
      await api.post(`/support/tickets/${selected.id}/replies`, { message: reply });
      const r = await api.get<any[]>(`/support/tickets/${selected.id}/replies`);
      setReplies(r);
      setReply('');
    } catch (e: any) { alert(e.message || 'Failed to send reply'); }
    finally { setSending(false); }
  };

  const handleStatus = async (id: string, status: string) => {
    try {
      await api.put(`/support/tickets/${id}/status`, { status });
      setSelected((prev: any) => prev?.id === id ? { ...prev, status } : prev);
      loadTickets(statusFilter);
    } catch (e: any) { alert(e.message || 'Failed to update status'); }
  };

  const handlePriority = async (id: string, priority: string) => {
    try {
      await api.put(`/support/tickets/${id}/priority`, { priority });
      setSelected((prev: any) => prev?.id === id ? { ...prev, priority } : prev);
      loadTickets(statusFilter);
    } catch (e: any) { alert(e.message || 'Failed to update priority'); }
  };

  const filters = [
    { value: '', label: 'All' },
    { value: 'open', label: 'Open' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' },
  ];

  const getUserName = (t: any) => userMap[t.userId] || t.userId?.slice(0, 8) || '-';

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-text-primary">Support Tickets</h1>
        <span className="text-text-secondary">{tickets.length} total</span>
      </div>

      <div className="flex gap-2 mb-4">
        {filters.map(f => (
          <button key={f.value} onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === f.value ? 'bg-accent-gold text-white' : 'bg-surface-light text-text-secondary hover:bg-surface-light/80'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-text-secondary">Loading tickets...</div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-800 text-red-400 rounded-lg px-4 py-3 text-sm">{error}</div>
      ) : (
        <Table headers={['Subject', 'User', 'Status', 'Priority', 'Date']} emptyMessage="No support tickets found">
          {tickets.map((t: any) => (
            <tr key={t.id} className="border-b border-divider hover:bg-surface-light/50 cursor-pointer" onClick={() => openTicket(t)}>
              <td className="px-4 py-3 text-text-primary font-medium max-w-xs truncate">{t.subject}</td>
              <td className="px-4 py-3 text-text-secondary">{getUserName(t)}</td>
              <td className="px-4 py-3"><Badge variant={statusColor(t.status)}>{t.status === 'in_progress' ? 'In Progress' : t.status?.charAt(0).toUpperCase() + t.status?.slice(1)}</Badge></td>
              <td className="px-4 py-3"><Badge variant={priorityColor(t.priority)}>{t.priority?.toUpperCase()}</Badge></td>
              <td className="px-4 py-3 text-text-muted text-sm">{formatDate(t.createdAt)}</td>
            </tr>
          ))}
        </Table>
      )}

      <CustomModal open={!!selected} onClose={() => setSelected(null)} title={selected?.subject}>
        <div className="space-y-4 text-sm max-h-96 overflow-y-auto">
          <div className="bg-surface-light rounded-xl p-4">
            <div className="flex gap-2 mb-2">
              <Badge variant={statusColor(selected?.status)}>{selected?.status === 'in_progress' ? 'In Progress' : selected?.status?.charAt(0).toUpperCase() + selected?.status?.slice(1)}</Badge>
              <Badge variant={priorityColor(selected?.priority)}>{selected?.priority?.toUpperCase()}</Badge>
            </div>
            <p className="text-text-primary font-medium mb-1">Message:</p>
            <p className="text-text-secondary">{selected?.message}</p>
            <p className="text-text-muted text-xs mt-2">{formatDate(selected?.createdAt)}</p>
          </div>

          {/* Admin Actions */}
          <div className="bg-surface-light rounded-xl p-4">
            <p className="text-text-secondary text-xs font-semibold mb-2">Admin Actions</p>
            <div className="flex gap-2 mb-2 flex-wrap">
              {['open', 'in_progress', 'resolved', 'closed'].map(s => (
                <button key={s} onClick={() => handleStatus(selected?.id, s)}
                  className={`px-2 py-1 rounded text-xs font-semibold ${selected?.status === s ? 'bg-accent-gold text-white' : 'bg-surface text-text-secondary'}`}>
                  {s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              {['low', 'normal', 'high', 'urgent'].map(p => (
                <button key={p} onClick={() => handlePriority(selected?.id, p)}
                  className={`px-2 py-1 rounded text-xs font-semibold ${selected?.priority === p ? 'bg-accent-gold text-white' : 'bg-surface text-text-secondary'}`}>
                  {p.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {replies.map((r: any) => (
            <div key={r.id} className={`rounded-xl p-4 ${r.senderRole === 'admin' ? 'bg-primary/10 ml-8' : 'bg-surface-light mr-8'}`}>
              <p className="text-text-secondary text-xs mb-1">{r.senderRole === 'admin' ? 'Admin' : 'User'} · {formatDate(r.createdAt)}</p>
              <p className="text-text-primary">{r.message}</p>
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <input type="text" value={reply} onChange={(e) => setReply(e.target.value)} className="input-field flex-1 text-sm" placeholder="Type a reply..." />
            <GradientButton onClick={handleReply} disabled={sending || !reply.trim()}>{sending ? 'Sending...' : 'Send'}</GradientButton>
          </div>
        </div>
      </CustomModal>
    </AdminLayout>
  );
}
