'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Table, Badge, GradientButton, CustomModal } from '@/components/UIComponents';
import { api } from '@/lib/api';
import type { Astrologer } from '@astro-shine/shared-types';

export default function AstrologersPage() {
  const [data, setData] = useState<Astrologer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Astrologer | null>(null);
  const [verify, setVerify] = useState<Astrologer | null>(null);
  const [chatPrice, setChatPrice] = useState('');
  const [audioPrice, setAudioPrice] = useState('');
  const [videoPrice, setVideoPrice] = useState('');
  const [rejectionNote, setRejectionNote] = useState('');

  useEffect(() => { api.get<Astrologer[]>('/astrologers').then(setData).finally(() => setLoading(false)); }, []);

  const handleVerify = async (id: string, status: 'approved' | 'rejected') => {
    await api.post<any>(`/astrologers/${id}/verify`, { status, note: rejectionNote });
    setData(data.map(a => a.id === id ? { ...a, verificationStatus: status, verificationNote: rejectionNote } : a));
    setVerify(null);
    setRejectionNote('');
  };

  const handleToggleActive = async (astrologer: Astrologer) => {
    const updated = await api.put<Astrologer>(`/astrologers/${astrologer.id}`, { isActive: !astrologer.isActive });
    setData(data.map(a => a.id === astrologer.id ? updated : a));
    if (selected?.id === astrologer.id) setSelected(updated);
  };

  const handleSavePrices = async (id: string) => {
    const comm = await api.get<any>(`/commissions/by-astrologer/${id}`).catch(() => null);
    if (comm === null) {
      alert('Failed to fetch commission rules. Please try again.'); return;
    }
    const minCap = comm?.minCap ? parseFloat(comm.minCap) : 0;
    const maxCap = comm?.maxCap ? parseFloat(comm.maxCap) : 0;
    const vals = [chatPrice, audioPrice, videoPrice].map(v => parseFloat(v) || 0);
    if (minCap > 0 && vals.some(v => v < minCap)) {
      alert(`Prices cannot be below minCap of ₹${minCap}`); return;
    }
    if (maxCap > 0 && vals.some(v => v > maxCap)) {
      alert(`Prices cannot exceed maxCap of ₹${maxCap}`); return;
    }
    const updated = await api.put<Astrologer>(`/astrologers/${id}`, {
      chatPricePerMin: chatPrice,
      audioCallPricePerMin: audioPrice,
      videoCallPricePerMin: videoPrice,
    });
    setData(data.map(a => a.id === id ? updated : a));
    if (selected?.id === id) setSelected(updated);
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-text-primary">Astrologers</h1>
        <span className="text-text-secondary">{data.length} total</span>
      </div>
      <Table headers={['Name', 'Email', 'Specialization', 'Chat/min', 'Audio/min', 'Video/min', 'Status', '']} emptyMessage="No astrologers found">
        {data.map(a => (
          <tr key={a.id} className="border-b border-divider hover:bg-surface-light/50">
            <td className="px-4 py-3 text-text-primary font-medium">{a.name}</td>
            <td className="px-4 py-3 text-text-secondary">{a.email}</td>
            <td className="px-4 py-3 text-text-secondary">{a.specialization?.slice(0, 2).join(', ') || '-'}</td>
            <td className="px-4 py-3 text-text-secondary">₹{(a as any).chatPricePerMin || a.pricePerMin}</td>
            <td className="px-4 py-3 text-text-secondary">₹{(a as any).audioCallPricePerMin || a.pricePerMin}</td>
            <td className="px-4 py-3 text-text-secondary">₹{(a as any).videoCallPricePerMin || a.pricePerMin}</td>
            <td className="px-4 py-3">
              {a.verificationStatus === 'approved' && <Badge variant="success">Verified</Badge>}
              {a.verificationStatus === 'pending' && <Badge variant="warning">Pending</Badge>}
              {a.verificationStatus === 'rejected' && <Badge variant="danger">Rejected</Badge>}
            </td>
            <td className="px-4 py-3 flex gap-2">
              <button
                onClick={() => {
                  setSelected(a);
                  setChatPrice((a as any).chatPricePerMin || a.pricePerMin);
                  setAudioPrice((a as any).audioCallPricePerMin || a.pricePerMin);
                  setVideoPrice((a as any).videoCallPricePerMin || a.pricePerMin);
                }}
                className="text-primary-light hover:underline text-sm font-medium"
              >
                View
              </button>
              {a.verificationStatus === 'pending' && (
                <button onClick={() => setVerify(a)} className="text-amber-400 hover:underline text-sm font-medium">Review</button>
              )}
            </td>
          </tr>
        ))}
      </Table>

      {/* Details & Pricing Management Modal */}
      <CustomModal open={!!selected} onClose={() => setSelected(null)} title="Astrologer Details">
        {selected && (
          <div className="space-y-4 text-text-secondary text-sm">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-text-primary">{selected.name}</h3>
                <p className="text-xs text-text-muted">{selected.id}</p>
              </div>
              <Badge variant={selected.isActive ? 'success' : 'danger'}>
                {selected.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            
            <p><span className="font-medium text-text-primary">Email:</span> {selected.email}</p>
            <p><span className="font-medium text-text-primary">Phone:</span> {selected.phone || '-'}</p>
            <p><span className="font-medium text-text-primary">Experience:</span> {selected.experience} years</p>
            <p><span className="font-medium text-text-primary">Specialization:</span> {selected.specialization?.join(', ') || '-'}</p>
            <p><span className="font-medium text-text-primary">Languages:</span> {selected.languages?.join(', ') || '-'}</p>
            <p><span className="font-medium text-text-primary">Skills:</span> {selected.skills?.join(', ') || '-'}</p>
            <p><span className="font-medium text-text-primary">Rating:</span> {Number(selected.rating).toFixed(2)} ({selected.totalReviews} reviews)</p>
            <p><span className="font-medium text-text-primary">Total Earnings:</span> ₹{selected.totalEarnings}</p>
            <p><span className="font-medium text-text-primary">Bio:</span> {selected.bio || '-'}</p>

            <div className="border-t border-divider pt-4 mt-2">
              <label className="block text-text-primary font-medium mb-2">Pricing (₹/min)</label>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-text-muted mb-1">Chat</label>
                  <input type="number" value={chatPrice} onChange={(e) => setChatPrice(e.target.value)}
                    className="input-field py-2 px-3 text-sm w-full" placeholder="Chat" />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">Audio Call</label>
                  <input type="number" value={audioPrice} onChange={(e) => setAudioPrice(e.target.value)}
                    className="input-field py-2 px-3 text-sm w-full" placeholder="Audio" />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">Video Call</label>
                  <input type="number" value={videoPrice} onChange={(e) => setVideoPrice(e.target.value)}
                    className="input-field py-2 px-3 text-sm w-full" placeholder="Video" />
                </div>
              </div>
              <button onClick={() => handleSavePrices(selected.id)}
                className="gradient-btn py-2 px-4 text-sm font-bold" style={{ borderRadius: '16px' }}>
                Save Prices
              </button>
            </div>

            <div className="flex gap-3 border-t border-divider pt-4 mt-4">
              <GradientButton
                variant={selected.isActive ? 'danger' : undefined}
                onClick={() => handleToggleActive(selected)}
              >
                {selected.isActive ? 'Deactivate' : 'Activate'}
              </GradientButton>
              <GradientButton onClick={() => setSelected(null)}>Close</GradientButton>
            </div>
          </div>
        )}
      </CustomModal>

      {/* Verification Review Modal */}
      <CustomModal open={!!verify} onClose={() => setVerify(null)} title="Verify Astrologer Request">
        {verify && (
          <div className="space-y-4 text-text-secondary text-sm">
            <p><span className="font-medium text-text-primary">Name:</span> {verify.name}</p>
            <p><span className="font-medium text-text-primary">Specialization:</span> {verify.specialization?.join(', ')}</p>
            <p><span className="font-medium text-text-primary">Experience:</span> {verify.experience} years</p>
            {verify.verificationDoc && verify.verificationDoc.length > 0 && (
              <div>
                <span className="font-medium text-text-primary block mb-1">Documents:</span>
                <ul className="list-disc pl-5 space-y-1">
                  {verify.verificationDoc.map((doc, idx) => (
                    <li key={idx}>
                      <a href={doc} target="_blank" rel="noreferrer" className="text-primary-light hover:underline">
                        Document #{idx + 1}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="space-y-1">
              <label className="block text-text-primary font-medium">Verification Note / Reason</label>
              <textarea
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                className="input-field h-20 text-sm"
                placeholder="Explain approval decision or rejection reasons here..."
              />
            </div>

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

