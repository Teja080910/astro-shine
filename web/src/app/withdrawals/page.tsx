'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDate } from '@/lib/utils';
import { AdminLayout } from '@/components/AdminLayout';
import { Table, Badge, GradientButton, CustomModal } from '@/components/UIComponents';
import { SearchInput } from '@/components/SearchInput';
import { Pagination, unwrapList } from '@/components/Pagination';
import { api } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { useAuthStore } from '@/store/auth';

function WithdrawalsContent() {
  const { admin } = useAuthStore();
  const [data, setData] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [actionError, setActionError] = useState('');
  const [acting, setActing] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const refresh = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (debouncedSearch) params.set('q', debouncedSearch);
    api.get<any>(`/withdrawals?${params.toString()}`).then((res) => {
      const { data, total, totalPages } = unwrapList<any>(res);
      setData(data);
      setTotal(total);
      setTotalPages(totalPages);
    });
  }, [page, limit, debouncedSearch]);

  useEffect(() => { refresh(); }, [refresh]);

  useSocket({
    'withdrawal:new': useCallback(() => { refresh(); }, [refresh]),
    'withdrawal:updated': useCallback(() => { refresh(); }, [refresh]),
  });

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    if (acting) return;
    setActing(true);
    setActionError('');
    try {
      const adminId = admin?.id || 'system';
      await api.put<any>(`/withdrawals/${id}/${action === 'approve' ? 'approve' : 'reject'}`, { adminId });
      refresh();
      setSelected(null);
    } catch (e: any) {
      setActionError(e.message || `Failed to ${action} withdrawal`);
      refresh();
    } finally {
      setActing(false);
    }
  };

  return (
    <>
      <h1 className="text-3xl font-extrabold text-text-primary mb-6">Withdrawals</h1>
      <div className="mb-6">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by requester, status, payout or amount..." onEnter={(v) => { setDebouncedSearch(v); setPage(1); }} />
      </div>
      <Table headers={['Requester', 'Type', 'Amount', 'Status', 'Payout', 'Date', '']} emptyMessage="No withdrawals found">
        {data.map((w: any) => (
          <tr key={w.id} className="border-b border-divider hover:bg-surface-light/50">
            <td className="px-4 py-3 text-text-primary">{w.astrologerName || w.adminName || w.astrologerId?.slice(0, 8) || 'Admin'}</td>
            <td className="px-4 py-3 text-text-secondary">{w.adminId ? 'Admin' : 'Astrologer'}</td>
            <td className="px-4 py-3 text-text-primary">₹{w.amount}</td>
            <td className="px-4 py-3">
              {w.status === 'completed' && <Badge variant="success">Completed</Badge>}
              {w.status === 'approved' && <Badge variant="success">Approved</Badge>}
              {w.status === 'pending' && <Badge variant="warning">Pending</Badge>}
              {w.status === 'rejected' && <Badge variant="danger">Rejected</Badge>}
            </td>
            <td className="px-4 py-3">
              <div className="flex flex-col gap-0.5 max-w-[200px]">
                {(() => {
                  const isUpi = w.bankAccount?.method === 'upi' || !!w.bankAccount?.vpa;
                  const via = isUpi
                    ? `UPI · ${w.bankAccount?.vpa || '-'}`
                    : w.bankAccount?.accountNumber
                      ? `Bank · ${w.bankAccount.accountNumber}`
                      : null;
                  return via ? (
                    <span className="text-xs text-text-secondary font-mono truncate" title={via}>{via}</span>
                  ) : (
                    <span className="text-xs text-text-muted">No destination</span>
                  );
                })()}
                {w.payoutId ? (
                  <>
                    <span className={`text-xs font-semibold capitalize ${
                      w.payoutStatus === 'processed' || w.payoutStatus === 'completed'
                        ? 'text-success'
                        : w.payoutStatus === 'failed' || w.payoutStatus === 'reversed' || w.payoutStatus === 'cancelled'
                          ? 'text-danger'
                          : 'text-warning'
                    }`}>{w.payoutStatus || 'queued'}</span>
                    {w.payoutUtr && <span className="text-[11px] text-text-muted">UTR: {w.payoutUtr}</span>}
                  </>
                ) : (
                  <span className="text-[11px] text-text-muted">
                    {w.status === 'pending' ? 'Awaiting approval' : 'No payout initiated'}
                  </span>
                )}
              </div>
            </td>
            <td className="px-4 py-3 text-text-muted text-sm">{formatDate(w.createdAt)}</td>
            <td className="px-4 py-3">
              {w.status === 'pending' && (
                <button onClick={() => setSelected(w)} className="text-primary-light hover:underline text-sm">Review</button>
              )}
            </td>
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

      <CustomModal open={!!selected} onClose={() => { setSelected(null); setActionError(''); }} title="Process Withdrawal">
        {selected && (
          <div className="space-y-3 text-text-secondary">
            {actionError && (
              <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg px-4 py-2">{actionError}</div>
            )}
            <p><span className="font-medium text-text-primary">Astrologer:</span> {selected.astrologerName}</p>
            <p><span className="font-medium text-text-primary">Amount:</span> ₹{selected.amount}</p>
            {selected.bankAccount?.method === 'upi' || selected.bankAccount?.vpa ? (
              <p><span className="font-medium text-text-primary">Payout via:</span> UPI — <span className="font-mono">{selected.bankAccount?.vpa || '-'}</span></p>
            ) : selected.bankAccount?.accountNumber ? (
              <p><span className="font-medium text-text-primary">Payout via:</span> Bank — <span className="font-mono">{selected.bankAccount.accountNumber}</span> ({selected.bankAccount.ifsc || '-'})</p>
            ) : null}
            {selected.payoutId && (
              <>
                <p><span className="font-medium text-text-primary">Payout Status:</span> <span className="capitalize">{selected.payoutStatus || 'queued'}</span></p>
                {selected.payoutUtr && <p><span className="font-medium text-text-primary">UTR:</span> {selected.payoutUtr}</p>}
              </>
            )}
            <div className="flex gap-3 mt-4">
              <GradientButton onClick={() => handleAction(selected.id, 'approve')} disabled={acting}>
                {acting ? 'Processing...' : 'Approve'}
              </GradientButton>
              <GradientButton variant="danger" onClick={() => handleAction(selected.id, 'reject')} disabled={acting}>
                Reject
              </GradientButton>
            </div>
          </div>
        )}
      </CustomModal>
    </>
  );
}

export default function WithdrawalsPage() {
  return (
    <AdminLayout>
      <WithdrawalsContent />
    </AdminLayout>
  );
}
