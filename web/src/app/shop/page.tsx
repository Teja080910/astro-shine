'use client';

import { useState, useEffect } from 'react';
import { formatDate } from '@/lib/utils';
import { AdminLayout } from '@/components/AdminLayout';
import { Table, Badge, GradientButton, CustomModal } from '@/components/UIComponents';
import { api } from '@/lib/api';

export default function ShopPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [comparePrice, setComparePrice] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('0');

  useEffect(() => {
    api.get<any[]>('/shop')
      .then(setData)
      .catch((e) => setError(e.message || 'Failed to load products'))
      .finally(() => setLoading(false));
  }, []);

  const openForm = (p: any) => {
    setSelected(p);
    setName(p?.name || '');
    setDescription(p?.description || '');
    setPrice(p?.price || '');
    setComparePrice(p?.comparePrice || '');
    setCategory(p?.category || '');
    setStock(String(p?.stock ?? 0));
  };

  const handleSave = async () => {
    if (!name.trim() || !price) return;
    const payload = { name, description, price, comparePrice: comparePrice || null, category, stock: parseInt(stock) || 0 };
    try {
      if (selected?.id) {
        const updated = await api.put(`/shop/${selected.id}`, payload);
        setData(data.map(p => p.id === selected.id ? updated : p));
      } else {
        const created = await api.post('/shop', payload);
        setData([...data, created]);
      }
      setSelected(null);
    } catch (e: any) { alert(e.message || 'Failed to save'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.del(`/shop/${id}`);
      setData(data.filter(p => p.id !== id));
    } catch (e: any) { alert(e.message || 'Failed to delete'); }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-text-primary">Shop Products</h1>
        <button onClick={() => openForm(null)} className="gradient-btn">Add Product</button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-64 text-text-secondary">Loading products...</div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-800 text-red-400 rounded-lg px-4 py-3 text-sm">{error}</div>
      ) : (
        <Table headers={['Name', 'Category', 'Price', 'Compare', 'Stock', 'Status', '']} emptyMessage="No products found">
          {data.map((p: any) => (
            <tr key={p.id} className="border-b border-divider hover:bg-surface-light/50">
              <td className="px-4 py-3 text-text-primary font-bold">{p.name}</td>
              <td className="px-4 py-3 text-text-secondary">{p.category || '-'}</td>
              <td className="px-4 py-3 text-text-primary">₹{p.price}</td>
              <td className="px-4 py-3 text-text-muted">{p.comparePrice ? `₹${p.comparePrice}` : '-'}</td>
              <td className="px-4 py-3 text-text-secondary">{p.stock}</td>
              <td className="px-4 py-3">{p.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="danger">Inactive</Badge>}</td>
              <td className="px-4 py-3 flex gap-2">
                <button onClick={() => openForm(p)} className="text-primary-light hover:underline text-sm font-medium">Edit</button>
                <button onClick={() => handleDelete(p.id)} className="text-red-400 hover:underline text-sm font-medium">Delete</button>
              </td>
            </tr>
          ))}
        </Table>
      )}

      <CustomModal open={!!selected || selected === null} onClose={() => setSelected(undefined)} title={selected?.id ? 'Edit Product' : 'Add Product'}>
        <div className="space-y-4 text-text-secondary text-sm p-2">
          <div><label className="block text-text-primary font-medium mb-1">Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field text-sm" /></div>
          <div><label className="block text-text-primary font-medium mb-1">Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-field h-20 text-sm" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-text-primary font-medium mb-1">Price (₹)</label><input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="input-field text-sm" /></div>
            <div><label className="block text-text-primary font-medium mb-1">Compare Price</label><input type="number" value={comparePrice} onChange={(e) => setComparePrice(e.target.value)} className="input-field text-sm" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-text-primary font-medium mb-1">Category</label><input type="text" value={category} onChange={(e) => setCategory(e.target.value)} className="input-field text-sm" /></div>
            <div><label className="block text-text-primary font-medium mb-1">Stock</label><input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="input-field text-sm" /></div>
          </div>
          <div className="flex gap-3 pt-3 border-t border-divider">
            <GradientButton onClick={handleSave}>Save</GradientButton>
            <GradientButton onClick={() => setSelected(null)}>Cancel</GradientButton>
          </div>
        </div>
      </CustomModal>
    </AdminLayout>
  );
}
