'use client';

import { useState, useEffect } from 'react';
import { formatDate } from '@/lib/utils';
import { AdminLayout } from '@/components/AdminLayout';
import { Table, Badge, CustomModal, GradientButton } from '@/components/UIComponents';
import { api } from '@/lib/api';
import type { Gift, GiftTransaction } from '@astro-shine/shared-types';

export default function GiftsPage() {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [transactions, setTransactions] = useState<GiftTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'gifts' | 'transactions'>('gifts');

  const [selected, setSelected] = useState<Gift | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Gift | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = () => {
    setLoading(true);
    setError('');
    Promise.all([
      api.get<Gift[]>('/gifts'),
      api.get<GiftTransaction[]>('/gifts/transactions'),
    ])
      .then(([g, t]) => { setGifts(g); setTransactions(t); })
      .catch((e) => setError(e.message || 'Failed to load gifts'))
      .finally(() => setLoading(false));
  };

  const openForm = (g?: Gift) => {
    setSelected(g || null);
    setShowForm(true);
    setName(g?.name || '');
    setPrice(g?.price || '');
    setImage(g?.image || '');
    setIsActive(g?.isActive ?? true);
  };

  const closeForm = () => {
    setShowForm(false);
    setSelected(null);
  };

  const handleSave = async () => {
    if (!name.trim() || !price.trim()) { alert('Name and price are required'); return; }
    const payload = { name: name.trim(), price, image: image || null, isActive };
    try {
      if (selected?.id) {
        const updated = await api.put<Gift>(`/gifts/${selected.id}`, payload);
        setGifts(gifts.map(g => g.id === selected.id ? updated : g));
      } else {
        const created = await api.post<Gift>('/gifts', payload);
        setGifts([...gifts, created]);
      }
      closeForm();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.del(`/gifts/${deleteTarget.id}`);
      setGifts(gifts.filter(g => g.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) { console.error(err); }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-text-primary">Gifts</h1>
        <div className="flex items-center gap-3">
          <div className="flex bg-surface-light rounded-xl p-1 border border-divider">
            <button onClick={() => setTab('gifts')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === 'gifts' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>Gift Catalog</button>
            <button onClick={() => setTab('transactions')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === 'transactions' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>Transactions</button>
          </div>
          {tab === 'gifts' && <GradientButton onClick={() => openForm()}>Add Gift</GradientButton>}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-text-secondary">Loading gifts...</div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-800 text-red-400 rounded-lg px-4 py-3 text-sm">{error}</div>
      ) : tab === 'gifts' ? (
        <Table headers={['Name', 'Price', 'Image', 'Status', 'Created', '']} emptyMessage="No gifts found. Add your first gift!">
          {gifts.map(g => (
            <tr key={g.id} className="border-b border-divider hover:bg-surface-light/50">
              <td className="px-4 py-3 text-text-primary font-medium">{g.name}</td>
              <td className="px-4 py-3 text-text-primary font-bold">₹{g.price}</td>
              <td className="px-4 py-3 text-text-secondary text-sm">{g.image ? <span className="text-primary-light">Uploaded</span> : '-'}</td>
              <td className="px-4 py-3">{g.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="danger">Inactive</Badge>}</td>
              <td className="px-4 py-3 text-text-muted text-sm">{formatDate(g.createdAt)}</td>
              <td className="px-4 py-3 flex gap-2">
                <button onClick={() => openForm(g)} className="text-primary-light hover:underline text-sm font-medium">Edit</button>
                <button onClick={() => setDeleteTarget(g)} className="text-red-400 hover:underline text-sm font-medium">Delete</button>
              </td>
            </tr>
          ))}
        </Table>
      ) : (
        <Table headers={['Gift', 'Sender', 'Receiver', 'Status', 'Redeemed At', 'Date']} emptyMessage="No gift transactions yet">
          {transactions.map(t => {
            const gift = gifts.find(g => g.id === t.giftId);
            return (
              <tr key={t.id} className="border-b border-divider hover:bg-surface-light/50">
                <td className="px-4 py-3 text-text-primary font-medium">{gift?.name || 'Unknown Gift'}</td>
                <td className="px-4 py-3 text-text-secondary text-sm">{(t as any).senderName || t.senderId?.slice(0, 8) || '-'}</td>
                <td className="px-4 py-3 text-text-secondary text-sm">{(t as any).receiverName || t.receiverId?.slice(0, 8) || '-'}</td>
                <td className="px-4 py-3">{t.isRedeemed ? <Badge variant="success">Redeemed</Badge> : <Badge variant="warning">Pending</Badge>}</td>
                <td className="px-4 py-3 text-text-muted text-sm">{t.redeemedAt ? formatDate(t.redeemedAt) : '-'}</td>
                <td className="px-4 py-3 text-text-muted text-sm">{formatDate(t.createdAt)}</td>
              </tr>
            );
          })}
        </Table>
      )}

      <CustomModal open={showForm} onClose={closeForm} title={selected?.id ? 'Edit Gift' : 'Add Gift'}>
        <div className="space-y-4 text-text-secondary text-sm">
          <div>
            <label className="block text-text-primary font-medium mb-1">Gift Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field text-sm" placeholder="e.g. Silver Coin" />
          </div>
          <div>
            <label className="block text-text-primary font-medium mb-1">Price (₹)</label>
            <input type="text" value={price} onChange={(e) => setPrice(e.target.value)} className="input-field text-sm" placeholder="e.g. 99" />
          </div>
          <div>
            <label className="block text-text-primary font-medium mb-1">Image URL (optional)</label>
            <input type="text" value={image} onChange={(e) => setImage(e.target.value)} className="input-field text-sm" placeholder="https://..." />
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="isActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 rounded border-divider" />
            <label htmlFor="isActive" className="text-text-primary font-medium">Active</label>
          </div>
          <div className="flex gap-3 pt-3 border-t border-divider">
            <GradientButton onClick={handleSave}>Save</GradientButton>
            <GradientButton onClick={closeForm}>Cancel</GradientButton>
          </div>
        </div>
      </CustomModal>

      <CustomModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Gift">
        <div className="space-y-4">
          <p className="text-text-secondary text-sm">Are you sure you want to delete <strong className="text-text-primary">{deleteTarget?.name}</strong>? This action cannot be undone.</p>
          <div className="flex gap-2">
            <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2 rounded-lg border border-divider text-text-secondary text-sm font-semibold">Cancel</button>
            <button onClick={handleDelete} className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold">Delete</button>
          </div>
        </div>
      </CustomModal>
    </AdminLayout>
  );
}
