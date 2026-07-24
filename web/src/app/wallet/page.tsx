'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Table, GradientButton, CustomModal } from '@/components/UIComponents';
import { api } from '@/lib/api';

export default function WalletPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [adminWallet, setAdminWallet] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      api.get<any[]>('/wallet/all'),
      api.get<any[]>('/users').catch(() => []),
      api.get<any[]>('/astrologers').catch(() => []),
      api.get<any[]>('/admins').catch(() => []),
    ]).then(([wallets, users, astros, admins]) => {
      const userMap = Object.fromEntries(users.map((u: any) => [u.id, u.name]));
      const astroMap = Object.fromEntries(astros.map((a: any) => [a.id, a.name]));
      const adminMap = Object.fromEntries(admins.map((a: any) => [a.id, a.name]));
      const enriched = wallets.map((w: any) => ({
        ...w,
        ownerName: w.adminId ? adminMap[w.adminId] || 'Admin' : w.astrologerId ? astroMap[w.astrologerId] : userMap[w.userId] || 'Unknown',
        ownerType: w.adminId ? 'Admin' : w.astrologerId ? 'Astrologer' : 'User',
      }));
      setData(enriched);
      setAdminWallet(enriched.find((w: any) => w.ownerType === 'Admin') || null);
      setLoading(false);
    }).catch(() => { setLoading(false); setWithdrawError('Failed to load wallet data'); });
  }, []);

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) return;
    setWithdrawing(true);
    try {
      await api.post('/withdrawals/admin', { adminId: adminWallet.adminId, amount });
      setWithdrawModal(false);
      setWithdrawAmount('');
      const updated = await api.get<any[]>('/wallet/all');
      const [updatedUsers, updatedAstros, updatedAdmins] = await Promise.all([
        api.get<any[]>('/users').catch(() => []),
        api.get<any[]>('/astrologers').catch(() => []),
        api.get<any[]>('/admins').catch(() => []),
      ]);
      const userMap = Object.fromEntries(updatedUsers.map((u: any) => [u.id, u.name]));
      const astroMap = Object.fromEntries(updatedAstros.map((a: any) => [a.id, a.name]));
      const adminMap = Object.fromEntries(updatedAdmins.map((a: any) => [a.id, a.name]));
      const enriched = updated.map((w: any) => ({
        ...w,
        ownerName: w.adminId ? adminMap[w.adminId] || 'Admin' : w.astrologerId ? astroMap[w.astrologerId] : userMap[w.userId] || 'Unknown',
        ownerType: w.adminId ? 'Admin' : w.astrologerId ? 'Astrologer' : 'User',
      }));
      setData(enriched);
      setAdminWallet(enriched.find((w: any) => w.adminId === adminWallet.adminId) || null);
    } catch (e: any) {
      setWithdrawError(e.message || 'Withdrawal failed');
    } finally {
      setWithdrawing(false);
    }
  };

  const totalBalance = data.reduce((s: number, w: any) => s + Number(w.balance), 0);
  const totalAdded = data.reduce((s: number, w: any) => s + Number(w.totalAdded), 0);
  const totalDeducted = data.reduce((s: number, w: any) => s + Number(w.totalDeducted), 0);

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-text-primary">Wallets</h1>
        <div className="flex items-center gap-3">
          <span className="text-text-secondary">{data.length} wallets</span>
          {adminWallet && Number(adminWallet.balance) > 0 && (
            <GradientButton onClick={() => setWithdrawModal(true)}>Withdraw from Admin</GradientButton>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-surface-light rounded-2xl p-4 border border-divider">
          <p className="text-text-muted text-sm">Total Balance</p>
          <p className="text-2xl font-bold text-text-primary">₹{totalBalance.toFixed(2)}</p>
        </div>
        <div className="bg-surface-light rounded-2xl p-4 border border-divider">
          <p className="text-text-muted text-sm">Total Added</p>
          <p className="text-2xl font-bold text-success">+₹{totalAdded.toFixed(2)}</p>
        </div>
        <div className="bg-surface-light rounded-2xl p-4 border border-divider">
          <p className="text-text-muted text-sm">Total Deducted</p>
          <p className="text-2xl font-bold text-danger">-₹{totalDeducted.toFixed(2)}</p>
        </div>
      </div>

      <Table headers={['Owner', 'Type', 'Balance', 'Total Added', 'Total Deducted']} emptyMessage="No wallets found">
        {data.map((w: any) => (
          <tr key={w.id} className="border-b border-divider hover:bg-surface-light/50">
            <td className="px-4 py-3 text-text-primary font-medium">{w.ownerName}</td>
            <td className="px-4 py-3 text-text-secondary">{w.ownerType}</td>
            <td className="px-4 py-3 text-text-primary font-medium">₹{w.balance}</td>
            <td className="px-4 py-3 text-success">+₹{w.totalAdded}</td>
            <td className="px-4 py-3 text-danger">-₹{w.totalDeducted}</td>
          </tr>
        ))}
      </Table>

      <CustomModal open={withdrawModal} onClose={() => { setWithdrawModal(false); setWithdrawError(''); }} title="Withdraw from Admin Wallet">
        <div className="space-y-3 text-text-secondary p-2">
          {withdrawError && (
            <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg px-4 py-2">{withdrawError}</div>
          )}
          <p>Available balance: <span className="font-bold text-text-primary">₹{adminWallet?.balance || '0'}</span></p>
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
