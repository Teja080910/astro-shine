'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDate } from '@/lib/utils';
import { AdminLayout } from '@/components/AdminLayout';
import { Table, Badge, GradientButton, CustomModal } from '@/components/UIComponents';
import { api } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/context/AuthContext';

function WithdrawalsContent() {
  const { admin } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);

  const refresh = useCallback(() => {
    api.get<any[]>('/withdrawals').then(setData);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useSocket({
    'withdrawal:new': useCallback(() => { refresh(); }, [refresh]),
    'withdrawal:updated': useCallback(() => { refresh(); }, [refresh]),
  });

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    const adminId = admin?.id || 'system';
    await api.put<any>(`/withdrawals/${id}/${action === 'approve' ? 'approve' : 'reject'}`, { adminId });
    refresh();
    setSelected(null);
  };

  return (
    <AdminLayout>
      <h1 className="text-3xl font-extrabold text-text-primary mb-6">Withdrawals</h1>
      <Table headers={['Requester', 'Type', 'Amount', 'Status', 'Date', '']} emptyMessage="No withdrawals found">
        {data.map((w: any) => (
          <tr key={w.id} className="border-b border-divider hover:bg-surface-light/50">
            <td className="px-4 py-3 text-text-primary">{w.astrologerName || w.adminName || w.astrologerId?.slice(0, 8) || 'Admin'}</td>
            <td className="px-4 py-3 text-text-secondary">{w.adminId ? 'Admin' : 'Astrologer'}</td>
            <td className="px-4 py-3 text-text-primary">₹{w.amount}</td>
            <td className="px-4 py-3">
              {w.status === 'approved' && <Badge variant="success">Approved</Badge>}
              {w.status === 'pending' && <Badge variant="warning">Pending</Badge>}
              {w.status === 'rejected' && <Badge variant="danger">Rejected</Badge>}
            </td>
            <td className="px-4 py-3 text-text-muted text-sm">{formatDate(w.createdAt)}</td>
            <td className="px-4 py-3">
              {w.status === 'pending' && !w.adminId && (
                <button onClick={() => setSelected(w)} className="text-primary-light hover:underline text-sm">Review</button>
              )}
            </td>
          </tr>
        ))}
      </Table>

      <CustomModal open={!!selected} onClose={() => setSelected(null)} title="Process Withdrawal">
        {selected && (
          <div className="space-y-3 text-text-secondary">
            <p><span className="font-medium text-text-primary">Astrologer:</span> {selected.astrologerName}</p>
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

export default function WithdrawalsPage() {
  return (
    <AdminLayout>
      <WithdrawalsContent />
    </AdminLayout>
  );
}
