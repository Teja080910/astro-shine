'use client';

import { AdminLayout } from '@/components/AdminLayout';

function PlaceholderPage({ title }: { title: string }) {
  return <AdminLayout><h1 className="text-3xl font-extrabold text-text-primary mb-4">{title}</h1><div className="glass-card p-8 text-text-secondary">Management panel coming soon.</div></AdminLayout>;
}

export default function CommissionsPage() { return <PlaceholderPage title="Commissions" />; }

export function Page() { return <PlaceholderPage title="Page" />; }
