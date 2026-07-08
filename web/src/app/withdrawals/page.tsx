'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Table, Badge, GradientButton, CustomModal } from '@/components/UIComponents';
import { api } from '@/lib/api';
import type { WithdrawalRequest } from '@astro-shine/shared-types';

export default function WithdrawalsPage() {
  const [data, setData] = useState<WithdrawalRequest[]>([]);
  const [selected, setSelected] = useState<WithdrawalRequest | null>(null);

  useEffect(() => { api.get<WithdrawalRequest[]>('/withdrawals').then(setData); }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    await api.put<any>(`/withdrawals/${id}/${action === 'approve' ? 'approve' : 'reject'}`, { adminId: 'system' });
    setData(data.map(w => w.id === id ? { ...w, status: action === 'approve' ? 'approved' : 'rejected' } : w));
    setSelected(null);
  };

  return (
    <AdminLayout>
      <h1 className="text-3xl font-extrabold text-text-primary mb-6">Withdrawals</h1>
      <Table headers={['Astrologer', 'Amount', 'Status', 'Date', '']}>
        {data.map(w => (
          <tr key={w.id} className="border-b border-divider hover:bg-surface-light/50">
            <td className="px-4 py-3 text-text-primary">{w.astrologerId?.slice(0, 8)}...</td>
            <td className="px-4 py-3 text-text-primary">₹{w.amount}</td>
            <td className="px-4 py-3">
              {w.status === 'approved' && <Badge variant="success">Approved</Badge>}
              {w.status === 'pending' && <Badge variant="warning">Pending</Badge>}
              {w.status === 'rejected' && <Badge variant="danger">Rejected</Badge>}
            </td>
            <td className="px-4 py-3 text-text-muted text-sm">{new Date(w.createdAt).toLocaleDateString()}</td>
            <td className="px-4 py-3">
              {w.status === 'pending' && <button onClick={() => setSelected(w)} className="text-primary-light hover:underline text-sm">Review</button>}
            </td>
          </tr>
        ))}
      </Table>

      <CustomModal open={!!selected} onClose={() => setSelected(null)} title="Process Withdrawal">
        {selected && (
          <div className="space-y-3 text-text-secondary">
            <p><span className="font-medium text-text-primary">Amount:</span> ₹{selected.amount}</p>
            <div className="flex gap-3 mt-4">
              <GradientButton onClick={() => handleAction(selected.id, 'approve')}>Approve</GradientButton>
              <GradientButton variant="danger" onClick={() => handleAction(selected.id, 'reject')}>Reject</GradientButton>
            </div>
          </div>
        )}
      </CustomModal>
    </AdminLayout>
  );
}
