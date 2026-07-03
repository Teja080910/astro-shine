'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Table, Badge, GradientButton, CustomModal } from '@/components/UIComponents';
import type { Astrologer } from '@astro-shine/shared-types';

export default function AstrologersPage() {
  const [data, setData] = useState<Astrologer[]>([]);
  const [loading, setLoading] = useState(true);
  const [verify, setVerify] = useState<Astrologer | null>(null);

  useEffect(() => { fetch('http://localhost:3067/api/v1/astrologers').then(r => r.json()).then(setData).finally(() => setLoading(false)); }, []);

  const handleVerify = async (id: string, status: 'approved' | 'rejected') => {
    await fetch(`http://localhost:3067/api/v1/astrologers/${id}/verify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    setData(data.map(a => a.id === id ? { ...a, verificationStatus: status } : a));
    setVerify(null);
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-text-primary">Astrologers</h1>
        <span className="text-text-secondary">{data.length} total</span>
      </div>
      <Table headers={['Name', 'Email', 'Specialization', 'Price/min', 'Rating', 'Status', '']}>
        {data.map(a => (
          <tr key={a.id} className="border-b border-divider hover:bg-surface-light/50">
            <td className="px-4 py-3 text-text-primary font-medium">{a.name}</td>
            <td className="px-4 py-3 text-text-secondary">{a.email}</td>
            <td className="px-4 py-3 text-text-secondary">{a.specialization?.slice(0, 2).join(', ') || '-'}</td>
            <td className="px-4 py-3 text-text-secondary">₹{a.pricePerMin}</td>
            <td className="px-4 py-3 text-text-secondary">{parseFloat(a.rating).toFixed(1)}</td>
            <td className="px-4 py-3">
              {a.verificationStatus === 'approved' && <Badge variant="success">Verified</Badge>}
              {a.verificationStatus === 'pending' && <Badge variant="warning">Pending</Badge>}
              {a.verificationStatus === 'rejected' && <Badge variant="danger">Rejected</Badge>}
            </td>
            <td className="px-4 py-3">
              {a.verificationStatus === 'pending' && (
                <button onClick={() => setVerify(a)} className="text-primary-light hover:underline text-sm">Review</button>
              )}
            </td>
          </tr>
        ))}
      </Table>

      <CustomModal open={!!verify} onClose={() => setVerify(null)} title="Verify Astrologer">
        {verify && (
          <div className="space-y-3 text-text-secondary">
            <p><span className="font-medium text-text-primary">Name:</span> {verify.name}</p>
            <p><span className="font-medium text-text-primary">Specialization:</span> {verify.specialization?.join(', ')}</p>
            <p><span className="font-medium text-text-primary">Experience:</span> {verify.experience} years</p>
            <div className="flex gap-3 mt-4">
              <GradientButton onClick={() => handleVerify(verify.id, 'approved')}>Approve</GradientButton>
              <GradientButton variant="danger" onClick={() => handleVerify(verify.id, 'rejected')}>Reject</GradientButton>
            </div>
          </div>
        )}
      </CustomModal>
    </AdminLayout>
  );
}
