'use client';

import { useState, useEffect } from 'react';
import { formatDate } from '@/lib/utils';
import { AdminLayout } from '@/components/AdminLayout';
import { Table, Badge, GradientButton, CustomModal } from '@/components/UIComponents';
import { api } from '@/lib/api';
import type { Review } from '@astro-shine/shared-types';

export default function ReviewsPage() {
  const [data, setData] = useState<Review[]>([]);

  useEffect(() => { api.get<Review[]>('/reviews').then(setData).catch(() => {}); }, []);

  const toggleVisibility = async (id: string, visible: boolean) => {
    await api.put<any>(`/reviews/${id}/visibility`, { isVisible: visible });
    setData(data.map(r => r.id === id ? { ...r, isVisible: visible } : r));
  };

  return (
    <AdminLayout>
      <h1 className="text-3xl font-extrabold text-text-primary mb-6">Reviews</h1>
      <Table headers={['User', 'Astrologer', 'Rating', 'Comment', 'Visible', 'Date', '']} emptyMessage="No reviews found">
        {data.map(r => (
          <tr key={r.id} className="border-b border-divider hover:bg-surface-light/50">
            <td className="px-4 py-3 text-text-primary">{(r as any).userName || r.userId?.slice(0, 8) + '...'}</td>
            <td className="px-4 py-3 text-text-primary">{(r as any).astrologerName || r.astrologerId?.slice(0, 8) + '...'}</td>
            <td className="px-4 py-3 text-text-primary">{'⭐'.repeat(r.rating)} {r.rating}/5</td>
            <td className="px-4 py-3 text-text-secondary max-w-xs truncate">{r.comment || '-'}</td>
            <td className="px-4 py-3">{r.isVisible ? <Badge variant="success">Visible</Badge> : <Badge variant="warning">Hidden</Badge>}</td>
            <td className="px-4 py-3 text-text-muted text-sm">{formatDate(r.createdAt)}</td>
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
