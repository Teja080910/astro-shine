'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { SearchInput } from '@/components/SearchInput';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { Pagination, unwrapList } from '@/components/Pagination';
import { Table, GradientButton, CustomModal } from '@/components/UIComponents';
import { api } from '@/lib/api';
import { formatAmount, formatDate, sumAmounts } from '@/lib/utils';

export default function WalletPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [adminWallet, setAdminWallet] = useState<any>(null);
  const [search, setSearch] = useState('');
  // Commit the query as the user types instead of requiring Enter.
  const typedSearch = useDebouncedValue(search, 300);

  // Reset to the first page whenever the query changes.
  useEffect(() => {
    setPage(1);
  }, [typedSearch]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState<{ balance: number; totalAdded: number; totalDeducted: number } | null>(null);
  // Date range scoping, requested by admins. Filters wallets by created_at.
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [dateError, setDateError] = useState('');

  const fetchWallets = useCallback(() => {
    setLoading(true);
    setError('');
    setDateError('');
    if (fromDate && toDate && fromDate > toDate) {
      setDateError('The start date must be on or before the end date.');
      setLoading(false);
      return;
    }
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (typedSearch) params.set('q', typedSearch);
    if (fromDate) params.set('from', fromDate);
    if (toDate) params.set('to', toDate);
    Promise.all([
      api.get<any>(`/wallet/all?${params.toString()}`),
      api.get<any>('/wallet').catch(() => null),
    ]).then(([walletRes, mine]) => {
      const wallets = unwrapList<any>(walletRes);
      setSummary(Array.isArray(walletRes) ? null : (walletRes?.summary ?? null));
      setData(wallets.data);
      setTotal(wallets.total);
      setTotalPages(wallets.totalPages);
      setAdminWallet(mine && mine.adminId ? mine : null);
    }).catch(() => { setError('Failed to load wallet data'); })
      .finally(() => setLoading(false));
  }, [page, limit, typedSearch, fromDate, toDate]);

  useEffect(() => { fetchWallets(); }, [fetchWallets]);

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) return;
    setWithdrawing(true);
    try {
      await api.post('/withdrawals/admin', { amount });
      setWithdrawModal(false);
      setWithdrawAmount('');
      fetchWallets();
    } catch (e: any) {
      setWithdrawError(e.message || 'Withdrawal failed');
    } finally {
      setWithdrawing(false);
    }
  };

  const totalBalance = summary ? summary.balance : sumAmounts(data.map((w: any) => w.balance));
  const totalAdded = summary ? summary.totalAdded : sumAmounts(data.map((w: any) => w.totalAdded));
  const totalDeducted = summary ? summary.totalDeducted : sumAmounts(data.map((w: any) => w.totalDeducted));

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-text-primary">Wallets</h1>
        <div className="flex items-center gap-3">
          <span className="text-text-secondary">{data.length} of {total} wallets</span>
          {adminWallet && Number(adminWallet.balance) > 0 && (
            <GradientButton onClick={() => setWithdrawModal(true)}>Withdraw from Admin</GradientButton>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by owner or type..."
          />
        <div className="flex items-center gap-2">
          <label htmlFor="wallet-from" className="text-xs font-bold text-text-muted uppercase tracking-wider">From</label>
          <input
            id="wallet-from"
            type="date"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
            className="input-field text-sm py-2 w-auto"
          />
          <label htmlFor="wallet-to" className="text-xs font-bold text-text-muted uppercase tracking-wider">To</label>
          <input
            id="wallet-to"
            type="date"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setPage(1); }}
            className="input-field text-sm py-2 w-auto"
          />
          {(fromDate || toDate) && (
            <button
              type="button"
              onClick={() => { setFromDate(''); setToDate(''); setPage(1); }}
              className="text-xs font-bold text-primary-light hover:underline px-2"
            >
              Clear
            </button>
          )}
        </div>
      </div>
      {dateError && (
        <div className="mb-4 text-xs text-danger">{dateError}</div>
      )}

      {loading ? (
        <div className="glass-card p-6 text-center text-text-secondary">Loading wallets...</div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-800 text-red-400 rounded-lg px-4 py-3 text-sm mb-4">{error}</div>
      ) : (
        <>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-surface-light rounded-2xl p-4 border border-divider">
          <p className="text-text-muted text-sm">Total Balance</p>
          <p className="text-2xl font-bold text-text-primary">₹{formatAmount(totalBalance)}</p>
        </div>
        <div className="bg-surface-light rounded-2xl p-4 border border-divider">
          <p className="text-text-muted text-sm">Total Added</p>
          <p className="text-2xl font-bold text-success">+₹{formatAmount(totalAdded)}</p>
        </div>
        <div className="bg-surface-light rounded-2xl p-4 border border-divider">
          <p className="text-text-muted text-sm">Total Deducted</p>
          <p className="text-2xl font-bold text-danger">-₹{formatAmount(totalDeducted)}</p>
        </div>
      </div>

      <Table headers={['Owner', 'Type', 'Balance', 'Total Added', 'Total Deducted', 'Created']} emptyMessage="No wallets found for this date range">
        {data.map((w: any) => (
          <tr key={w.id} className="border-b border-divider hover:bg-surface-light/50">
            <td className="px-4 py-3 text-text-primary font-medium">{w.ownerName}</td>
            <td className="px-4 py-3 text-text-secondary">{w.ownerType}</td>
            <td className="px-4 py-3 text-text-primary font-medium">₹{formatAmount(w.balance)}</td>
            <td className="px-4 py-3 text-success">+₹{formatAmount(w.totalAdded)}</td>
            <td className="px-4 py-3 text-danger">-₹{formatAmount(w.totalDeducted)}</td>
            <td className="px-4 py-3 text-text-muted text-sm">{w.createdAt ? formatDate(w.createdAt) : '-'}</td>
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

      <CustomModal open={withdrawModal} onClose={() => { setWithdrawModal(false); setWithdrawError(''); }} title="Withdraw from Admin Wallet">
        <div className="space-y-3 text-text-secondary p-2">
          {withdrawError && (
            <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg px-4 py-2">{withdrawError}</div>
          )}
          <p>Available balance: <span className="font-bold text-text-primary">₹{formatAmount(adminWallet?.balance)}</span></p>
          <div>
            <label className="block text-text-primary text-sm font-medium mb-1">Amount (₹)</label>
            <input type="number" value={withdrawAmount} onChange={e => { setWithdrawAmount(e.target.value); setWithdrawError(''); }}
              className="input-field w-full" placeholder="Enter amount" max={adminWallet?.balance} />
          </div>
          <div className="flex gap-3 mt-4">
            <GradientButton onClick={handleWithdraw} disabled={withdrawing || !withdrawAmount}>
              {withdrawing ? 'Processing...' : 'Withdraw'}
            </GradientButton>
            <GradientButton variant="danger" onClick={() => { setWithdrawModal(false); setWithdrawError(''); }}>Cancel</GradientButton>
          </div>
        </div>
      </CustomModal>
    </AdminLayout>
  );
}
