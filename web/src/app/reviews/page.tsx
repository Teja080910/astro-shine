'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Table, Badge, GradientButton, CustomModal } from '@/components/UIComponents';
import type { Review } from '@astro-shine/shared-types';

export default function ReviewsPage() {
  const [data, setData] = useState<Review[]>([]);

  useEffect(() => { fetch('http://localhost:3067/api/v1/reviews').then(r => r.json()).then(setData).catch(() => {}); }, []);

  const toggleVisibility = async (id: string, visible: boolean) => {
    await fetch(`http://localhost:3067/api/v1/reviews/${id}/visibility`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isVisible: visible }) });
    setData(data.map(r => r.id === id ? { ...r, isVisible: visible } : r));
  };

  return (
    <AdminLayout>
      <h1 className="text-3xl font-extrabold text-text-primary mb-6">Reviews</h1>
      <Table headers={['User', 'Astrologer', 'Rating', 'Comment', 'Visible', 'Date', '']}>
        {data.map(r => (
          <tr key={r.id} className="border-b border-divider hover:bg-surface-light/50">
            <td className="px-4 py-3 text-text-primary">{r.userId?.slice(0, 8)}...</td>
            <td className="px-4 py-3 text-text-primary">{r.astrologerId?.slice(0, 8)}...</td>
            <td className="px-4 py-3 text-text-primary">{'⭐'.repeat(r.rating)} {r.rating}/5</td>
            <td className="px-4 py-3 text-text-secondary max-w-xs truncate">{r.comment || '-'}</td>
            <td className="px-4 py-3">{r.isVisible ? <Badge variant="success">Visible</Badge> : <Badge variant="warning">Hidden</Badge>}</td>
            <td className="px-4 py-3 text-text-muted text-sm">{new Date(r.createdAt).toLocaleDateString()}</td>
            <td className="px-4 py-3">
              <button onClick={() => toggleVisibility(r.id, !r.isVisible)} className="text-primary-light hover:underline text-sm">
                {r.isVisible ? 'Hide' : 'Show'}
              </button>
            </td>
          </tr>
        ))}
      </Table>
    </AdminLayout>
  );
}
