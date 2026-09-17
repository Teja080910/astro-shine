'use client';

import { useState, useEffect } from 'react';
import { formatDate } from '@/lib/utils';
import { AdminLayout } from '@/components/AdminLayout';
import { Table, Badge, GradientButton, CustomModal } from '@/components/UIComponents';
import { api } from '@/lib/api';
import { Search } from 'lucide-react';
import type { User } from '@astro-shine/shared-types';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => { api.get<User[]>('/users').then(setUsers).catch((e) => setError(e.message || 'Failed to load users')).finally(() => setLoading(false)); }, []);

  const filtered = users.filter(u => {
    if (statusFilter !== 'all' && u.isActive !== (statusFilter === 'active')) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.phone?.toLowerCase().includes(q);
  });

  const handleToggleActive = async (user: User) => {
    const updated = await api.put<User>(`/users/${user.id}`, { isActive: !user.isActive });
    setUsers(users.map(u => u.id === user.id ? updated : u));
    setSelected(null);
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-text-primary">Users</h1>
        <span className="text-text-secondary">{filtered.length} of {users.length} total</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="input-field pl-10 pr-4 py-3 text-sm w-full"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'inactive'] as const).map(s => (
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

      <Table headers={['Name', 'Email', 'Phone', 'Status', 'Joined', '']} emptyMessage="No users found">
        {loading ? (
          <tr><td colSpan={6} className="px-4 py-12 text-center text-text-secondary">Loading users...</td></tr>
        ) : error ? (
          <tr><td colSpan={6} className="px-4 py-3 text-center text-red-400">{error}</td></tr>
        ) : (
          filtered.map(u => (
          <tr key={u.id} className="border-b border-divider hover:bg-surface-light/50">
            <td className="px-4 py-3 text-text-primary font-medium">{u.name}</td>
            <td className="px-4 py-3 text-text-secondary">{u.email}</td>
            <td className="px-4 py-3 text-text-secondary">{u.phone || '-'}</td>
            <td className="px-4 py-3">{u.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="danger">Inactive</Badge>}</td>
            <td className="px-4 py-3 text-text-muted text-sm">{formatDate(u.createdAt)}</td>
            <td className="px-4 py-3"><button onClick={() => setSelected(u)} className="text-primary-light hover:underline text-sm">View</button></td>
          </tr>
          )))}
      </Table>

      <CustomModal open={!!selected} onClose={() => setSelected(null)} title="User Details">
        {selected && (
          <div className="space-y-3 text-text-secondary">
            <p><span className="font-medium text-text-primary">ID:</span> {selected.id}</p>
            <p><span className="font-medium text-text-primary">Name:</span> {selected.name}</p>
            <p><span className="font-medium text-text-primary">Email:</span> {selected.email}</p>
            <p><span className="font-medium text-text-primary">Phone:</span> {selected.phone || '-'}</p>
            <p><span className="font-medium text-text-primary">Status:</span> {selected.isActive ? 'Active' : 'Inactive'}</p>
            <p><span className="font-medium text-text-primary">Joined:</span> {formatDate(selected.createdAt)}</p>
            <div className="flex gap-3 mt-6">
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
    </AdminLayout>
  );
}
