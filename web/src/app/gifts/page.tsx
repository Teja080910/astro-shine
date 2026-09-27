'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDate } from '@/lib/utils';
import { AdminLayout } from '@/components/AdminLayout';
import { Table, Badge, CustomModal, GradientButton } from '@/components/UIComponents';
import { SearchInput, matchesSearch } from '@/components/SearchInput';
import { Pagination, unwrapList } from '@/components/Pagination';
import { ImageUpload } from '@/components/ImageUpload';
import { api } from '@/lib/api';
import { imageSrc } from '@/lib/media';
import type { Gift, GiftTransaction } from '@astro-shine/shared-types';

export default function GiftsPage() {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [transactions, setTransactions] = useState<GiftTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'gifts' | 'transactions'>('gifts');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [giftsTotal, setGiftsTotal] = useState(0);
  const [giftsTotalPages, setGiftsTotalPages] = useState(1);
  const [txTotal, setTxTotal] = useState(0);
  const [txTotalPages, setTxTotalPages] = useState(1);

  const [selected, setSelected] = useState<Gift | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Gift | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError('');
    const giftParams = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (debouncedSearch) giftParams.set('q', debouncedSearch);
    const txParams = new URLSearchParams({ page: String(page), limit: String(limit) });
    Promise.all([
      api.get<any>(`/gifts?${giftParams.toString()}`),
      api.get<any>(`/gifts/transactions?${txParams.toString()}`),
    ])
      .then(([gRes, tRes]) => {
        const g = unwrapList<Gift>(gRes);
        const t = unwrapList<GiftTransaction>(tRes);
        setGifts(g.data);
        setGiftsTotal(g.total);
        setGiftsTotalPages(g.totalPages);
        setTransactions(t.data);
        setTxTotal(t.total);
        setTxTotalPages(t.totalPages);
      })
      .catch((e) => setError(e.message || 'Failed to load gifts'))
      .finally(() => setLoading(false));
  }, [page, limit, debouncedSearch]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const changeTab = (next: 'gifts' | 'transactions') => {
    setTab(next);
    setPage(1);
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
        await api.put<Gift>(`/gifts/${selected.id}`, payload);
        closeForm();
        fetchData();
      } else {
        await api.post<Gift>('/gifts', payload);
        closeForm();
        if (page !== 1) setPage(1);
        else fetchData();
      }
    } catch (err) { console.error(err); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.del(`/gifts/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const filteredTransactions = transactions.filter(t => {
    const gift = gifts.find(g => g.id === t.giftId);
    return matchesSearch(
      search,
      (t as any).giftName,
      gift?.name,
      (t as any).senderName,
      t.senderId,
      (t as any).receiverName,
      t.receiverId,
      t.isRedeemed ? 'redeemed' : 'pending'
    );
  });

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-text-primary">Gifts</h1>
        <div className="flex items-center gap-3">
          <div className="flex bg-surface-light rounded-xl p-1 border border-divider">
            <button onClick={() => changeTab('gifts')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === 'gifts' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>Gift Catalog</button>
            <button onClick={() => changeTab('transactions')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === 'transactions' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>Transactions</button>
          </div>
          {tab === 'gifts' && <GradientButton onClick={() => openForm()}>Add Gift</GradientButton>}
        </div>
      </div>

      <div className="mb-6">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={tab === 'gifts' ? 'Search gifts by name...' : 'Search by gift, sender, receiver or status...'}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-text-secondary">Loading gifts...</div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-800 text-red-400 rounded-lg px-4 py-3 text-sm">{error}</div>
      ) : tab === 'gifts' ? (
        <>
          <Table headers={['Name', 'Price', 'Status', 'Created', '']} emptyMessage="No gifts found. Add your first gift!">
            {gifts.map(g => (
              <tr key={g.id} className="border-b border-divider hover:bg-surface-light/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {g.image ? (
                      <img src={imageSrc(g.image)} alt={g.name} className="w-9 h-9 object-cover rounded-lg border border-divider" />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-surface-light border border-divider" />
                    )}
                    <span className="text-text-primary font-bold">{g.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-text-primary font-bold">₹{g.price}</td>
                <td className="px-4 py-3">{g.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="danger">Inactive</Badge>}</td>
                <td className="px-4 py-3 text-text-muted text-sm">{formatDate(g.createdAt)}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => openForm(g)} className="text-primary-light hover:underline text-sm font-medium">Edit</button>
                  <button onClick={() => setDeleteTarget(g)} className="text-red-400 hover:underline text-sm font-medium">Delete</button>
                </td>
              </tr>
            ))}
          </Table>
          <Pagination
            page={page}
            totalPages={giftsTotalPages}
            total={giftsTotal}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(l) => { setLimit(l); setPage(1); }}
          />
        </>
      ) : (
        <>
          <Table headers={['Gift', 'Sender', 'Receiver', 'Status', 'Redeemed At', 'Date']} emptyMessage="No gift transactions yet">
            {filteredTransactions.map(t => {
              const gift = gifts.find(g => g.id === t.giftId);
              const giftName = (t as any).giftName || gift?.name;
              const giftImage = (t as any).giftImage || gift?.image;
              return (
                <tr key={t.id} className="border-b border-divider hover:bg-surface-light/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {giftImage ? (
                        <img src={imageSrc(giftImage)} alt={giftName} className="w-9 h-9 object-cover rounded-lg border border-divider" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-surface-light border border-divider" />
                      )}
                      <span className="text-text-primary font-medium">{giftName || 'Unknown Gift'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-sm">{(t as any).senderName || t.senderId?.slice(0, 8) || '-'}</td>
                  <td className="px-4 py-3 text-text-secondary text-sm">{(t as any).receiverName || t.receiverId?.slice(0, 8) || '-'}</td>
                  <td className="px-4 py-3">{t.isRedeemed ? <Badge variant="success">Redeemed</Badge> : <Badge variant="warning">Pending</Badge>}</td>
                  <td className="px-4 py-3 text-text-muted text-sm">{t.redeemedAt ? formatDate(t.redeemedAt) : '-'}</td>
                  <td className="px-4 py-3 text-text-muted text-sm">{formatDate(t.createdAt)}</td>
                </tr>
              );
            })}
          </Table>
          <Pagination
            page={page}
            totalPages={txTotalPages}
            total={txTotal}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(l) => { setLimit(l); setPage(1); }}
          />
        </>
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
            <label className="block text-text-primary font-medium mb-1">Gift Image</label>
            <ImageUpload
              value={image ? [image] : []}
              onChange={(urls) => setImage(urls[0] || '')}
              hint="Shown on the gift card in the mobile app."
            />
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
