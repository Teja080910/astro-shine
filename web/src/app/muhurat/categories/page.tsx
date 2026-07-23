'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { GradientButton, CustomModal, Table, Badge } from '@/components/UIComponents';
import { api } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import type { MuhuratCategory } from '@astro-shine/shared-types';

export default function MuhuratCategoriesPage() {
  const [data, setData] = useState<MuhuratCategory[]>([]);
  const [editing, setEditing] = useState<MuhuratCategory | null>(null);
  const [form, setForm] = useState({ name: '', description: '', isActive: true });
  const [error, setError] = useState('');

  const fetchData = useCallback(() => {
    api.get<MuhuratCategory[]>('/muhurat-categories/admin')
      .then(setData)
      .catch(console.error);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useSocket({
    'muhurat-category:created': useCallback((newCat: MuhuratCategory) => {
      setData((prev) => {
        if (prev.some((c) => c.id === newCat.id)) return prev;
        return [...prev, newCat];
      });
    }, []),
    'muhurat-category:updated': useCallback((updatedCat: MuhuratCategory) => {
      setData((prev) => prev.map((c) => (c.id === updatedCat.id ? updatedCat : c)));
    }, []),
  });

  const startEdit = (cat: MuhuratCategory) => {
    setEditing(cat);
    setForm({
      name: cat.name,
      description: cat.description || '',
      isActive: cat.isActive,
    });
    setError('');
  };

  const startNew = () => {
    setEditing({} as MuhuratCategory);
    setForm({ name: '', description: '', isActive: true });
    setError('');
  };

  const save = async () => {
    if (!form.name.trim()) {
      setError('Category name is required');
      return;
    }
    setError('');
    try {
      if (editing?.id) {
        await api.put(`/muhurat-categories/${editing.id}`, form);
      } else {
        await api.post('/muhurat-categories', form);
      }
      setEditing(null);
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving');
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-text-primary">Muhurat Categories</h1>
        <button onClick={startNew} className="gradient-btn">New Category</button>
      </div>

      <div className="glass-card-solid p-6">
        <Table headers={['Name', 'Description', 'Status', 'Actions']}>
          {data.map((cat) => (
            <tr key={cat.id} className="border-b border-divider hover:bg-surface-light/30">
              <td className="px-4 py-3 font-medium text-text-primary">{cat.name}</td>
              <td className="px-4 py-3 text-text-secondary max-w-xs truncate">{cat.description || 'No description'}</td>
              <td className="px-4 py-3">
                <Badge variant={cat.isActive ? 'success' : 'danger'}>
                  {cat.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => startEdit(cat)}
                  className="text-primary-light hover:underline text-sm font-semibold"
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </Table>
      </div>

      <CustomModal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit Category' : 'New Category'}>
        <div className="space-y-4 mt-2">
          {error && <div className="text-sm text-red-500 font-medium">{error}</div>}
          <div>
            <label className="text-text-secondary text-sm block mb-1">Name</label>
            <input
              className="input-field"
              placeholder="e.g. Marriage Muhurat"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-text-secondary text-sm block mb-1">Description</label>
            <textarea
              className="input-field h-24 pt-2"
              placeholder="Provide a brief description..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="rounded border-card-border bg-surface text-primary focus:ring-primary h-4 w-4 cursor-pointer"
            />
            <label htmlFor="isActive" className="text-text-primary text-sm font-medium cursor-pointer">
              Active Category
            </label>
          </div>
          <div className="pt-2">
            <GradientButton onClick={save}>Save Category</GradientButton>
          </div>
        </div>
      </CustomModal>
    </AdminLayout>
  );
}
