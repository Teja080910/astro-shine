'use client';

import { useState, useEffect } from 'react';
import { formatDate } from '@/lib/utils';
import { AdminLayout } from '@/components/AdminLayout';
import { Table, Badge, GradientButton, CustomModal } from '@/components/UIComponents';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export default function SupportPage() {
  const { admin } = useAuthStore();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [reply, setReply] = useState('');
  const [replies, setReplies] = useState<any[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api.get<any[]>('/support/tickets')
      .then(setTickets)
      .catch((e) => setError(e.message || 'Failed to load tickets'))
      .finally(() => setLoading(false));
  }, []);

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
      await api.post(`/support/tickets/${selected.id}/replies`, { senderId: admin?.id || 'system', senderRole: 'admin', message: reply });
      const r = await api.get<any[]>(`/support/tickets/${selected.id}/replies`);
      setReplies(r);
      setReply('');
    } catch (e: any) { alert(e.message || 'Failed to send reply'); }
    finally { setSending(false); }
  };

  const handleResolve = async (id: string) => {
    try {
      await api.put(`/support/tickets/${id}/resolve`, {});
      setTickets(tickets.map(t => t.id === id ? { ...t, status: 'resolved' } : t));
    } catch (e: any) { alert(e.message || 'Failed to resolve'); }
  };

  const handleAssign = async (id: string) => {
    try {
      await api.put(`/support/tickets/${id}/assign`, { adminId: admin?.id || 'system' });
      setTickets(tickets.map(t => t.id === id ? { ...t, assignedTo: admin?.id || 'system' } : t));
    } catch (e: any) { alert(e.message || 'Failed to assign'); }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-text-primary">Support Tickets</h1>
        <span className="text-text-secondary">{tickets.length} total</span>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-64 text-text-secondary">Loading tickets...</div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-800 text-red-400 rounded-lg px-4 py-3 text-sm">{error}</div>
      ) : (
        <Table headers={['Subject', 'User', 'Status', 'Priority', 'Assigned', 'Date', '']} emptyMessage="No support tickets found">
          {tickets.map((t: any) => (
            <tr key={t.id} className="border-b border-divider hover:bg-surface-light/50">
              <td className="px-4 py-3 text-text-primary font-medium max-w-xs truncate">{t.subject}</td>
              <td className="px-4 py-3 text-text-secondary">{t.userName || t.userId?.slice(0, 8) || t.astrologerId?.slice(0, 8) || '-'}</td>
              <td className="px-4 py-3">{t.status === 'resolved' ? <Badge variant="success">Resolved</Badge> : t.status === 'open' ? <Badge variant="warning">Open</Badge> : <Badge variant="info">{t.status}</Badge>}</td>
              <td className="px-4 py-3"><Badge variant={t.priority === 'high' ? 'danger' : t.priority === 'medium' ? 'warning' : 'info'}>{t.priority}</Badge></td>
              <td className="px-4 py-3 text-text-secondary">{t.assignedTo?.slice(0, 8) || 'Unassigned'}</td>
              <td className="px-4 py-3 text-text-muted text-sm">{formatDate(t.createdAt)}</td>
              <td className="px-4 py-3 flex gap-2">
                <button onClick={() => openTicket(t)} className="text-primary-light hover:underline text-sm font-medium">View</button>
                {t.status !== 'resolved' && <><button onClick={() => handleAssign(t.id)} className="text-accent-gold hover:underline text-sm font-medium">Assign</button><button onClick={() => handleResolve(t.id)} className="text-success hover:underline text-sm font-medium">Resolve</button></>}
              </td>
            </tr>
          ))}
        </Table>
      )}

      <CustomModal open={!!selected} onClose={() => setSelected(null)} title={selected?.subject}>
        <div className="space-y-4 text-sm p-2 max-h-96 overflow-y-auto">
          <div className="bg-surface-light rounded-xl p-4">
            <p className="text-text-primary font-medium mb-1">Message:</p>
            <p className="text-text-secondary">{selected?.message}</p>
            <p className="text-text-muted text-xs mt-2">{formatDate(selected?.createdAt)}</p>
          </div>
          {replies.map((r: any) => (
            <div key={r.id} className={`rounded-xl p-4 ${r.senderRole === 'admin' ? 'bg-primary/10 ml-8' : 'bg-surface-light mr-8'}`}>
              <p className="text-text-secondary text-xs mb-1">{r.senderRole === 'admin' ? 'Admin' : 'User'}</p>
              <p className="text-text-primary">{r.message}</p>
              <p className="text-text-muted text-xs mt-1">{formatDate(r.createdAt)}</p>
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
