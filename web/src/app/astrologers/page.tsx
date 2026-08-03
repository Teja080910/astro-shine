'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Table, Badge, GradientButton, CustomModal } from '@/components/UIComponents';
import { api } from '@/lib/api';
import { FileText, ExternalLink, Search, Shield, CheckCircle, XCircle } from 'lucide-react';
import type { Astrologer } from '@astro-shine/shared-types';

export default function AstrologersPage() {
  const [data, setData] = useState<Astrologer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Astrologer | null>(null);
  const [verify, setVerify] = useState<Astrologer | null>(null);
  const [chatPrice, setChatPrice] = useState('');
  const [audioPrice, setAudioPrice] = useState('');
  const [videoPrice, setVideoPrice] = useState('');
  const [rejectionNote, setRejectionNote] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => { api.get<Astrologer[]>('/astrologers').then(setData).catch((e) => setError(e.message || 'Failed to load astrologers')).finally(() => setLoading(false)); }, []);

  const handleVerify = async (id: string, status: 'approved' | 'rejected') => {
    await api.post<any>(`/astrologers/${id}/verify`, { status, note: rejectionNote });
    setData(data.map(a => a.userId === id ? { ...a, verificationStatus: status, verificationNote: rejectionNote } : a));
    setVerify(null);
    setRejectionNote('');
  };

  const handleToggleActive = async (astrologer: Astrologer) => {
    const updated = await api.put<Astrologer>(`/astrologers/${astrologer.userId}`, { isActive: !(astrologer as any).isActive });
    setData(data.map(a => a.userId === astrologer.userId ? updated : a));
    if (selected?.userId === astrologer.userId) setSelected(updated);
  };

  const handleSavePrices = async (id: string) => {
    const comm = await api.get<any>(`/commissions/by-astrologer/${id}`).catch(() => null);
    if (comm) {
      const minCap = comm?.minCap ? parseFloat(comm.minCap) : 0;
      const maxCap = comm?.maxCap ? parseFloat(comm.maxCap) : 0;
      const vals = [chatPrice, audioPrice, videoPrice].map(v => parseFloat(v) || 0);
      if (minCap > 0 && vals.some(v => v < minCap)) {
        alert(`Prices cannot be below minCap of ₹${minCap}`); return;
      }
      if (maxCap > 0 && vals.some(v => v > maxCap)) {
        alert(`Prices cannot exceed maxCap of ₹${maxCap}`); return;
      }
    }
    const updated = await api.put<Astrologer>(`/astrologers/${id}`, {
      chatPricePerMin: chatPrice,
      audioCallPricePerMin: audioPrice,
      videoCallPricePerMin: videoPrice,
    });
    setData(data.map(a => a.userId === id ? updated : a));
    if (selected?.userId === id) setSelected(updated);
  };

  const pending = data.filter(a => a.verificationStatus === 'pending');
  const approved = data.filter(a => a.verificationStatus === 'approved');
  const rejected = data.filter(a => a.verificationStatus === 'rejected');

  const filtered = data.filter(a => {
    if (statusFilter !== 'all' && a.verificationStatus !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return a.name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q) || a.specialization?.some(s => s.toLowerCase().includes(q));
  });

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary">Astrologers</h1>
          <p className="text-sm text-text-secondary mt-1">Manage astrologer profiles, pricing, and KYC verification</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-xs font-bold text-amber-400">{pending.length} Pending</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-xs font-bold text-green-400">{approved.length} Approved</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-xs font-bold text-red-400">{rejected.length} Rejected</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or specialization..."
            className="input-field pl-10 pr-4 py-3 text-sm w-full"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                statusFilter === s
                  ? 'bg-primary/20 border-primary/40 text-primary-light'
                  : 'bg-surface-light/30 border-card-border text-text-secondary hover:text-text-primary'
              }`}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <Table headers={['Astrologer', 'Specialization', 'Pricing', 'KYC Status', 'Actions']} emptyMessage="No astrologers found">
        {loading ? (
          <tr><td colSpan={5} className="px-4 py-12 text-center text-text-secondary">Loading astrologers...</td></tr>
        ) : error ? (
          <tr><td colSpan={5} className="px-4 py-3 text-center text-red-400">{error}</td></tr>
        ) : (
          filtered.map(a => (
          <tr key={a.userId || a.id} className="border-b border-divider hover:bg-surface-light/50 transition-colors">
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-accent-gold/20 flex items-center justify-center text-xs font-bold text-primary-light border border-card-border shrink-0">
                  {a.name?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-text-primary truncate">{a.name}</p>
                  <p className="text-xs text-text-muted truncate">{a.email}</p>
                </div>
              </div>
            </td>
            <td className="px-4 py-3">
              <p className="text-xs font-semibold text-text-secondary">{a.specialization?.slice(0, 2).join(', ') || '-'}</p>
              <p className="text-[10px] text-text-muted mt-0.5">{a.experience} yrs exp</p>
            </td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-surface-light/40 border border-card-border text-text-secondary">C ₹{(a as any).chatPricePerMin || a.pricePerMin}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-surface-light/40 border border-card-border text-text-secondary">A ₹{(a as any).audioCallPricePerMin || a.pricePerMin}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-surface-light/40 border border-card-border text-text-secondary">V ₹{(a as any).videoCallPricePerMin || a.pricePerMin}</span>
              </div>
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                {a.verificationStatus === 'approved' && <Badge variant="success">Verified</Badge>}
                {a.verificationStatus === 'pending' && <Badge variant="warning">Pending</Badge>}
                {a.verificationStatus === 'rejected' && <Badge variant="danger">Rejected</Badge>}
                {a.verificationNote && a.verificationStatus === 'rejected' && (
                  <span className="text-[10px] text-text-muted max-w-[120px] truncate" title={a.verificationNote}>
                    {a.verificationNote}
                  </span>
                )}
              </div>
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelected(a);
                    setChatPrice((a as any).chatPricePerMin || a.pricePerMin);
                    setAudioPrice((a as any).audioCallPricePerMin || a.pricePerMin);
                    setVideoPrice((a as any).videoCallPricePerMin || a.pricePerMin);
                  }}
                  className="text-primary-light hover:underline text-xs font-bold"
                >
                  View
                </button>
                {a.verificationStatus === 'pending' && (
                  <button
                    onClick={() => { setVerify(a); setRejectionNote(''); }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 text-[10px] font-bold transition-all"
                  >
                    <Shield size={12} />
                    Review
                  </button>
                )}
              </div>
            </td>
          </tr>
          ))
        )}
      </Table>

      {/* Details & Pricing Management Modal */}
      <CustomModal open={!!selected} onClose={() => setSelected(null)} title="Astrologer Details">
        {selected && (
          <div className="space-y-4 text-text-secondary text-sm">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-text-primary">{selected.name}</h3>
                <p className="text-xs text-text-muted">{selected.userId}</p>
              </div>
              <div className="flex items-center gap-2">
                {selected.verificationStatus === 'approved' && <Badge variant="success">Verified</Badge>}
                {selected.verificationStatus === 'pending' && <Badge variant="warning">Pending</Badge>}
                {selected.verificationStatus === 'rejected' && <Badge variant="danger">Rejected</Badge>}
              </div>
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

            {selected.verificationNote && (
              <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20">
                <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">Rejection Note</p>
                <p className="text-xs text-text-secondary">{selected.verificationNote}</p>
              </div>
            )}

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
              <button onClick={() => handleSavePrices(selected.userId)}
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

      {/* KYC Verification Review Modal */}
      <CustomModal open={!!verify} onClose={() => setVerify(null)} title="Review KYC Documents">
        {verify && (
          <div className="space-y-5 text-sm">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-light/40 border border-card-border">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent-gold/20 flex items-center justify-center text-lg font-bold text-primary-light border border-card-border shrink-0">
                {verify.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-text-primary truncate">{verify.name}</h3>
                <p className="text-xs text-text-muted truncate">{verify.email}</p>
              </div>
              <Badge variant="warning">Pending</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-surface-light/20 border border-card-border">
              <div>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Specialization</p>
                <p className="text-xs font-semibold text-text-primary">{verify.specialization?.join(', ') || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Experience</p>
                <p className="text-xs font-semibold text-text-primary">{verify.experience} years</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Languages</p>
                <p className="text-xs font-semibold text-text-primary">{verify.languages?.join(', ') || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Skills</p>
                <p className="text-xs font-semibold text-text-primary">{verify.skills?.join(', ') || '-'}</p>
              </div>
            </div>

            {verify.verificationDoc && verify.verificationDoc.length > 0 && (
              <div>
                <p className="text-xs font-bold text-text-primary mb-3 flex items-center gap-2">
                  <FileText size={14} className="text-primary-light" />
                  Uploaded Documents ({verify.verificationDoc.length})
                </p>
                <div className="space-y-2">
                  {verify.verificationDoc.map((doc, idx) => (
                    <a
                      key={idx}
                      href={doc}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl bg-surface-light/30 border border-card-border hover:bg-surface-light/60 transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <FileText size={16} className="text-primary-light" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-text-primary truncate">
                            {doc.split('/').pop() || `Document ${idx + 1}`}
                          </p>
                          <p className="text-[10px] text-text-muted">Click to view</p>
                        </div>
                      </div>
                      <ExternalLink size={14} className="text-text-muted group-hover:text-primary-light transition-colors shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-primary">Verification Note</label>
              <textarea
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                className="input-field h-24 text-sm resize-none"
                placeholder="Add a note about your decision (required for rejection)..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <GradientButton
                onClick={() => handleVerify(verify.userId, 'approved')}
                className="flex-1"
              >
                <CheckCircle size={16} />
                Approve
              </GradientButton>
              <GradientButton
                variant="danger"
                onClick={() => handleVerify(verify.userId, 'rejected')}
                className="flex-1"
              >
                <XCircle size={16} />
                Reject
              </GradientButton>
            </div>
          </div>
        )}
      </CustomModal>
    </AdminLayout>
  );
}
