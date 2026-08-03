'use client';

import { useState, useEffect } from 'react';
import { formatDate } from '@/lib/utils';
import { AdminLayout } from '@/components/AdminLayout';
import { Table, Badge, GradientButton, CustomModal } from '@/components/UIComponents';
import { api } from '@/lib/api';

export default function MandirPoojaPage() {
  const [poojas, setPoojas] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'poojas' | 'bookings'>('poojas');
  const [selected, setSelected] = useState<any>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get<any[]>('/mandir-pooja'),
      api.get<any[]>('/mandir-pooja/bookings/list').catch(() => []),
    ]).then(([p, b]) => { setPoojas(p); setBookings(b); })
      .catch((e) => setError(e.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const openForm = (p: any) => {
    setSelected(p);
    setName(p?.name || '');
    setDescription(p?.description || '');
    setPrice(p?.price || '');
  };

  const handleSave = async () => {
    if (!name.trim() || !price) return;
    const payload = { name, description, price };
    try {
      if (selected?.id) {
        const updated = await api.put(`/mandir-pooja/${selected.id}`, payload);
        setPoojas(poojas.map(p => p.id === selected.id ? updated : p));
      } else {
        const created = await api.post('/mandir-pooja', payload);
        setPoojas([...poojas, created]);
      }
      setSelected(null);
    } catch (e: any) { alert(e.message || 'Failed to save'); }
  };

  const handleUpdateBookingStatus = async (id: string, status: string) => {
    try {
      await api.put(`/mandir-pooja/bookings/${id}/status`, { status });
      setBookings(bookings.map(b => b.id === id ? { ...b, status } : b));
    } catch (e: any) { alert(e.message || 'Failed to update'); }
  };

  if (loading) return <AdminLayout><div className="flex items-center justify-center h-64 text-text-secondary">Loading...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-text-primary">Mandir Pooja</h1>
        <div className="flex gap-2">
          <button onClick={() => setTab('poojas')} className={`px-4 py-2 rounded-xl text-xs font-bold ${tab === 'poojas' ? 'bg-primary text-white' : 'bg-surface-light text-text-secondary'}`}>Poojas</button>
          <button onClick={() => setTab('bookings')} className={`px-4 py-2 rounded-xl text-xs font-bold ${tab === 'bookings' ? 'bg-primary text-white' : 'bg-surface-light text-text-secondary'}`}>Bookings</button>
        </div>
      </div>

      {error && <div className="bg-red-900/20 border border-red-800 text-red-400 rounded-lg px-4 py-3 text-sm mb-4">{error}</div>}

      {tab === 'poojas' ? (
        <>
          <div className="mb-4"><GradientButton onClick={() => openForm(null)}>Add Pooja</GradientButton></div>
          <Table headers={['Name', 'Description', 'Price', 'Status', '']} emptyMessage="No poojas found">
            {poojas.map((p: any) => (
              <tr key={p.id} className="border-b border-divider hover:bg-surface-light/50">
                <td className="px-4 py-3 text-text-primary font-bold">{p.name}</td>
                <td className="px-4 py-3 text-text-secondary text-sm max-w-xs truncate">{p.description || '-'}</td>
                <td className="px-4 py-3 text-text-primary">₹{p.price}</td>
                <td className="px-4 py-3">{p.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="danger">Inactive</Badge>}</td>
                <td className="px-4 py-3"><button onClick={() => openForm(p)} className="text-primary-light hover:underline text-sm font-medium">Edit</button></td>
              </tr>
            ))}
          </Table>
        </>
      ) : (
        <Table headers={['User', 'Pooja', 'Date', 'Amount', 'Status', '']} emptyMessage="No bookings found">
          {bookings.map((b: any) => (
            <tr key={b.id} className="border-b border-divider hover:bg-surface-light/50">
              <td className="px-4 py-3 text-text-secondary">{b.userName || b.userId?.slice(0, 8) || '-'}</td>
              <td className="px-4 py-3 text-text-secondary">{b.poojaName || b.poojaId?.slice(0, 8) || '-'}</td>
              <td className="px-4 py-3 text-text-muted text-sm">{b.bookingDate ? formatDate(b.bookingDate) : '-'}</td>
              <td className="px-4 py-3 text-text-primary">₹{b.amount}</td>
              <td className="px-4 py-3">{b.status === 'confirmed' ? <Badge variant="success">Confirmed</Badge> : b.status === 'cancelled' ? <Badge variant="danger">Cancelled</Badge> : <Badge variant="warning">Pending</Badge>}</td>
              <td className="px-4 py-3 flex gap-2">
                {b.status === 'pending' && <><button onClick={() => handleUpdateBookingStatus(b.id, 'confirmed')} className="text-success hover:underline text-sm font-medium">Confirm</button><button onClick={() => handleUpdateBookingStatus(b.id, 'cancelled')} className="text-red-400 hover:underline text-sm font-medium">Cancel</button></>}
              </td>
            </tr>
          ))}
        </Table>
      )}

      <CustomModal open={!!selected || selected === null} onClose={() => setSelected(undefined)} title={selected?.id ? 'Edit Pooja' : 'Add Pooja'}>
        <div className="space-y-4 text-text-secondary text-sm p-2">
          <div><label className="block text-text-primary font-medium mb-1">Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field text-sm" placeholder="Pooja name" /></div>
          <div><label className="block text-text-primary font-medium mb-1">Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-field h-20 text-sm" placeholder="Description" /></div>
          <div><label className="block text-text-primary font-medium mb-1">Price (₹)</label><input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="input-field text-sm" placeholder="Price" /></div>
          <div className="flex gap-3 pt-3 border-t border-divider">
            <GradientButton onClick={handleSave}>Save</GradientButton>
            <GradientButton onClick={() => setSelected(undefined)}>Cancel</GradientButton>
          </div>
        </div>
      </CustomModal>
    </AdminLayout>
  );
}
