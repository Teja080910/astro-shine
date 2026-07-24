'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { GradientButton, CustomModal, Table, Badge, DatePicker, TimePicker } from '@/components/UIComponents';
import { api } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import type { MuhuratItem, MuhuratCategory } from '@astro-shine/shared-types';

export default function MuhuratEntriesPage() {
  const [data, setData] = useState<MuhuratItem[]>([]);
  const [categories, setCategories] = useState<MuhuratCategory[]>([]);
  const [editing, setEditing] = useState<MuhuratItem | null>(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [form, setForm] = useState({
    name: '',
    categoryId: '',
    date: '',
    time: '',
    description: '',
    isActive: true,
  });
  const [error, setError] = useState('');

  const fetchData = useCallback(() => {
    api.get<MuhuratCategory[]>('/muhurat-categories/admin')
      .then(setCategories)
      .catch(console.error);

    api.get<MuhuratItem[]>('/muhurat/admin')
      .then(setData)
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useSocket({
    'muhurat:created': useCallback((newEntry: MuhuratItem) => {
      setData((prev) => {
        if (prev.some((e) => e.id === newEntry.id)) return prev;
        return [...prev, newEntry];
      });
    }, []),
    'muhurat:updated': useCallback((updatedEntry: MuhuratItem) => {
      setData((prev) => prev.map((e) => (e.id === updatedEntry.id ? updatedEntry : e)));
    }, []),
    'muhurat:deleted': useCallback((del: { id: string }) => {
      setData((prev) => prev.filter((e) => e.id !== del.id));
    }, []),
  });

  const startEdit = (entry: MuhuratItem) => {
    setEditing(entry);
    setForm({
      name: entry.name,
      categoryId: entry.categoryId,
      date: entry.date,
      time: entry.time,
      description: entry.description || '',
      isActive: entry.isActive,
    });
    setError('');
  };

  const startNew = () => {
    setEditing({} as MuhuratItem);
    setForm({
      name: '',
      categoryId: categories.find((c) => c.isActive)?.id || '',
      date: '',
      time: '',
      description: '',
      isActive: true,
    });
    setError('');
  };

  const save = async () => {
    if (!form.name.trim()) return setError('Name is required');
    if (!form.categoryId) return setError('Category is required');
    if (!form.date) return setError('Date is required');
    if (!form.time) return setError('Time is required');

    setError('');
    try {
      if (editing?.id) {
        await api.put(`/muhurat/${editing.id}`, form);
      } else {
        await api.post('/muhurat', form);
      }
      setEditing(null);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  const deleteEntry = async (id: string) => {
    if (confirm('Are you sure you want to delete this auspicious timing?')) {
      try {
        await api.del(`/muhurat/${id}`);
      } catch (err: any) {
        alert(err.message || 'Failed to delete');
      }
    }
  };

  const filteredData = selectedFilter === 'all'
    ? data
    : data.filter((e) => e.categoryId === selectedFilter);

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-text-primary">Muhurat Timings</h1>
        <div className="flex items-center gap-4">
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="input-field max-w-[220px]"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button onClick={startNew} className="gradient-btn shrink-0">New Muhurat</button>
        </div>
      </div>

      <div className="glass-card-solid p-6">
        <Table headers={['Name', 'Category', 'Date', 'Time', 'Creator', 'Status', 'Actions']}>
          {filteredData.map((entry) => (
            <tr key={entry.id} className="border-b border-divider hover:bg-surface-light/30">
              <td className="px-4 py-3 font-medium text-text-primary">{entry.name}</td>
              <td className="px-4 py-3 text-text-secondary">{entry.categoryName || 'Unknown'}</td>
              <td className="px-4 py-3 text-text-secondary">{entry.date}</td>
              <td className="px-4 py-3 text-text-secondary">{entry.time}</td>
              <td className="px-4 py-3 text-text-secondary font-medium">{entry.createdByName || 'System'}</td>
              <td className="px-4 py-3">
                <Badge variant={entry.isActive ? 'success' : 'danger'}>
                  {entry.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </td>
              <td className="px-4 py-3 space-x-3">
                <button
                  onClick={() => startEdit(entry)}
                  className="text-primary-light hover:underline text-sm font-semibold"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteEntry(entry.id)}
                  className="text-red-500 hover:underline text-sm font-semibold"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </Table>
      </div>

      <CustomModal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit Muhurat' : 'New Muhurat'}>
        <div className="space-y-4 mt-2 max-h-[75vh] overflow-y-auto pr-1 scrollbar-thin">
          {error && <div className="text-sm text-red-500 font-semibold">{error}</div>}
          
          <div>
            <label className="text-text-secondary text-sm block mb-1">Name</label>
            <input
              className="input-field"
              placeholder="e.g. Vivah Muhurat"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label className="text-text-secondary text-sm block mb-1">Category</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="input-field"
            >
              <option value="" disabled>Select a category</option>
              {categories.filter(c => c.isActive || c.id === form.categoryId).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-text-secondary text-sm block mb-1">Date</label>
              <DatePicker
                value={form.date}
                onChange={(date) => setForm({ ...form, date })}
                placeholder="YYYY-MM-DD"
              />
            </div>
            <div>
              <label className="text-text-secondary text-sm block mb-1">Time</label>
              <TimePicker
                value={form.time}
                onChange={(time) => setForm({ ...form, time })}
                placeholder="HH:MM AM/PM"
              />
            </div>
          </div>

          <div>
            <label className="text-text-secondary text-sm block mb-1">Description</label>
            <textarea
              className="input-field h-24 pt-2"
              placeholder="Auspicious details..."
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
              Active Muhurat
            </label>
          </div>

          <div className="pt-2">
            <GradientButton onClick={save}>Save Muhurat</GradientButton>
          </div>
        </div>
      </CustomModal>
    </AdminLayout>
  );
}
