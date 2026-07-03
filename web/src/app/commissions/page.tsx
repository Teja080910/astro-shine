'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Table, Badge, CustomModal, GradientButton } from '@/components/UIComponents';
import type { Commission } from '@astro-shine/shared-types';

export default function CommissionsPage() {
  const [data, setData] = useState<Commission[]>([]);
  const [selected, setSelected] = useState<Commission | null>(null);

  useEffect(() => { fetch('http://localhost:3067/api/v1/commissions').then(r => r.json()).then(setData).catch(() => {}); }, []);

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-text-primary">Commissions</h1>
        <button onClick={() => setSelected({} as Commission)} className="gradient-btn">Add Commission</button>
      </div>
      <Table headers={['Astrologer ID', 'Type', 'Value', 'Status', '']}>
        {data.map(c => (
          <tr key={c.id} className="border-b border-divider hover:bg-surface-light/50">
            <td className="px-4 py-3 text-text-primary">{c.astrologerId?.slice(0, 12)}...</td>
            <td className="px-4 py-3 text-text-secondary">{c.type}</td>
            <td className="px-4 py-3 text-text-primary">{c.value}{c.type === 'percentage' ? '%' : ''}</td>
            <td className="px-4 py-3">{c.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="danger">Inactive</Badge>}</td>
            <td className="px-4 py-3"><button onClick={() => setSelected(c)} className="text-primary-light hover:underline text-sm">Edit</button></td>
          </tr>
        ))}
      </Table>

      <CustomModal open={!!selected} onClose={() => setSelected(null)} title="Edit Commission">
        <div className="space-y-3 text-text-secondary">
          <p><span className="font-medium text-text-primary">Astrologer ID:</span> {selected?.astrologerId}</p>
          <p><span className="font-medium text-text-primary">Type:</span> {selected?.type}</p>
          <p><span className="font-medium text-text-primary">Value:</span> {selected?.value}</p>
          <GradientButton>Save</GradientButton>
        </div>
      </CustomModal>
    </AdminLayout>
  );
}
