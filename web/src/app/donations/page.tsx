'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDate } from '@/lib/utils';
import { AdminLayout } from '@/components/AdminLayout';
import { SearchInput } from '@/components/SearchInput';
import { Table, Badge, GradientButton, CustomModal } from '@/components/UIComponents';
import { Pagination, unwrapList } from '@/components/Pagination';
import { api } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { useAuthStore } from '@/store/auth';

function DonationsContent() {
  const { admin } = useAuthStore();
  const [stats, setStats] = useState({ totalReceived: 0, totalWithdrawn: 0, pending: 0 });
  const [logs, setLogs] = useState<any[]>([]);
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawNote, setWithdrawNote] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
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

  const refresh = useCallback(() => {
    setLoading(true);
    setFetchError('');
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (debouncedSearch) params.set('q', debouncedSearch);
    Promise.all([
      api.get<any>('/donations/stats'),
      api.get<any>(`/donations/logs?${params.toString()}`),
    ])
      .then(([s, l]) => {
        setStats(s);
        const { data, total, totalPages } = unwrapList<any>(l);
        setLogs(data);
        setTotal(total);
        setTotalPages(totalPages);
      })
      .catch((e) => setFetchError(e.message || 'Failed to load donation data'))
      .finally(() => setLoading(false));
  }, [page, limit, debouncedSearch]);

  useEffect(() => { refresh(); }, [refresh]);

  useSocket({ 'donation:updated': useCallback(() => { refresh(); }, [refresh]) });

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) return;
    try {
      await api.post('/donations/withdrawn', { adminId: admin?.id || 'system', amount, note: withdrawNote });
      setWithdrawModal(false);
      setWithdrawAmount('');
      setWithdrawNote('');
      setError('');
      refresh();
    } catch (e: any) {
      setError(e.message || 'Withdrawal failed');
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-text-primary">Donations</h1>
        <div className="flex items-center gap-3">
          <span className="text-text-secondary">{logs.length} of {total} entries</span>
          {stats.pending > 0 && (
            <GradientButton onClick={() => setWithdrawModal(true)}>Withdraw</GradientButton>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-text-secondary">Loading donations...</div>
      ) : fetchError ? (
        <div className="bg-red-900/20 border border-red-800 text-red-400 rounded-lg px-4 py-3 text-sm">{fetchError}</div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-surface-light rounded-2xl p-4 border border-divider">
              <p className="text-text-muted text-sm">Total Received</p>
              <p className="text-2xl font-bold text-success">+₹{stats.totalReceived.toFixed(2)}</p>
            </div>
            <div className="bg-surface-light rounded-2xl p-4 border border-divider">
              <p className="text-text-muted text-sm">Total Withdrawn</p>
              <p className="text-2xl font-bold text-danger">-₹{stats.totalWithdrawn.toFixed(2)}</p>
            </div>
            <div className="bg-surface-light rounded-2xl p-4 border border-divider">
              <p className="text-text-muted text-sm">Pending Balance</p>
              <p className="text-2xl font-bold text-text-primary">₹{stats.pending.toFixed(2)}</p>
            </div>
          </div>

          <h2 className="text-xl font-bold text-text-primary mb-4">Donation Logs</h2>
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <SearchInput value={search} onChange={setSearch} placeholder="Search by type, note, amount..." />
          </div>
          <Table headers={['Type', 'Amount', 'Note', 'Date']} emptyMessage="No donation logs found">
            {logs.map((l: any) => (
              <tr key={l.id} className="border-b border-divider hover:bg-surface-light/50">
                <td className="px-4 py-3">
                  {l.type === 'received' ? <Badge variant="success">Received</Badge> : <Badge variant="danger">Withdrawn</Badge>}
                </td>
                <td className="px-4 py-3 text-text-primary font-medium">₹{l.amount}</td>
                <td className="px-4 py-3 text-text-secondary">{l.note || '-'}</td>
                <td className="px-4 py-3 text-text-muted text-sm">{formatDate(l.createdAt)}</td>
              </tr>
            ))}
          </Table>
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

      <CustomModal open={withdrawModal} onClose={() => { setWithdrawModal(false); setError(''); }} title="Withdraw Donation Funds">
        <div className="space-y-3 text-text-secondary p-2">
          {error && <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg px-4 py-2">{error}</div>}
          <p>Available: <span className="font-bold text-text-primary">₹{stats.pending.toFixed(2)}</span></p>
          <div>
            <label className="block text-text-primary text-sm font-medium mb-1">Amount (₹)</label>
            <input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)}
              className="input-field w-full" placeholder="Enter amount" />
          </div>
          <div>
            <label className="block text-text-primary text-sm font-medium mb-1">Note (optional)</label>
            <input type="text" value={withdrawNote} onChange={e => setWithdrawNote(e.target.value)}
              className="input-field w-full" placeholder="Reason for withdrawal" />
          </div>
          <div className="flex gap-3 mt-4">
            <GradientButton onClick={handleWithdraw} disabled={!withdrawAmount}>Withdraw</GradientButton>
            <GradientButton variant="danger" onClick={() => { setWithdrawModal(false); setError(''); }}>Cancel</GradientButton>
          </div>
        </div>
      </CustomModal>
    </>
  );
}

export default function DonationsPage() {
  return (
    <AdminLayout>
      <DonationsContent />
    </AdminLayout>
  );
}
