'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Table, Badge, GradientButton, CustomModal } from '@/components/UIComponents';
import { api } from '@/lib/api';
import type { User } from '@astro-shine/shared-types';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<User | null>(null);

  useEffect(() => { api.get<User[]>('/users').then(setUsers).finally(() => setLoading(false)); }, []);

  const handleToggleActive = async (user: User) => {
    const updated = await api.put<User>(`/users/${user.id}`, { isActive: !user.isActive });
    setUsers(users.map(u => u.id === user.id ? updated : u));
    setSelected(null);
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-text-primary">Users</h1>
        <span className="text-text-secondary">{users.length} total</span>
      </div>
      <Table headers={['Name', 'Email', 'Phone', 'Status', 'Joined', '']}>
        {users.map(u => (
          <tr key={u.id} className="border-b border-divider hover:bg-surface-light/50">
            <td className="px-4 py-3 text-text-primary font-medium">{u.name}</td>
            <td className="px-4 py-3 text-text-secondary">{u.email}</td>
            <td className="px-4 py-3 text-text-secondary">{u.phone || '-'}</td>
            <td className="px-4 py-3">{u.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="danger">Inactive</Badge>}</td>
            <td className="px-4 py-3 text-text-muted text-sm">{new Date(u.createdAt).toLocaleDateString()}</td>
            <td className="px-4 py-3"><button onClick={() => setSelected(u)} className="text-primary-light hover:underline text-sm">View</button></td>
          </tr>
        ))}
      </Table>

      <CustomModal open={!!selected} onClose={() => setSelected(null)} title="User Details">
        {selected && (
          <div className="space-y-3 text-text-secondary">
            <p><span className="font-medium text-text-primary">ID:</span> {selected.id}</p>
            <p><span className="font-medium text-text-primary">Name:</span> {selected.name}</p>
            <p><span className="font-medium text-text-primary">Email:</span> {selected.email}</p>
            <p><span className="font-medium text-text-primary">Phone:</span> {selected.phone || '-'}</p>
            <p><span className="font-medium text-text-primary">Status:</span> {selected.isActive ? 'Active' : 'Inactive'}</p>
            <p><span className="font-medium text-text-primary">Joined:</span> {new Date(selected.createdAt).toLocaleString()}</p>
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
