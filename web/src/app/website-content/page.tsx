'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { GradientButton, CustomModal } from '@/components/UIComponents';
import type { WebsiteContent } from '@astro-shine/shared-types';

export default function WebsiteContentPage() {
  const [data, setData] = useState<WebsiteContent[]>([]);
  const [editing, setEditing] = useState<{ section: string; content: string }>({ section: '', content: '' });

  useEffect(() => { fetch('http://localhost:3067/api/v1/website-content/admin').then(r => r.json()).then(setData).catch(() => {}); }, []);

  const save = async () => {
    let parsed: any = editing.content;
    try { parsed = JSON.parse(editing.content); } catch {}
    await fetch(`http://localhost:3067/api/v1/website-content/section/${editing.section}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: parsed }) });
    setEditing({ section: '', content: '' });
    fetch('http://localhost:3067/api/v1/website-content/admin').then(r => r.json()).then(setData);
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-text-primary">Website Content</h1>
        <button onClick={() => setEditing({ section: '', content: '' })} className="gradient-btn">Add Section</button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {data.map(w => (
          <div key={w.id} className="glass-card-solid p-4 cursor-pointer hover:bg-surface-light/50" onClick={() => setEditing({ section: w.section, content: JSON.stringify(w.content, null, 2) })}>
            <p className="text-text-primary font-medium">{w.section}</p>
            <p className="text-text-muted text-sm truncate">{JSON.stringify(w.content)}</p>
          </div>
        ))}
      </div>

      <CustomModal open={!!editing.section || editing.section === ''} onClose={() => setEditing({ section: '', content: '' })} title="Edit Section">
        <div className="space-y-4">
          <div><label className="text-text-secondary text-sm block mb-1">Section</label><input className="input-field" value={editing.section} onChange={e => setEditing({ ...editing, section: e.target.value })} /></div>
          <div><label className="text-text-secondary text-sm block mb-1">Content (JSON)</label><textarea className="input-field h-32 font-mono text-sm" value={editing.content} onChange={e => setEditing({ ...editing, content: e.target.value })} /></div>
          <GradientButton onClick={save}>Save</GradientButton>
        </div>
      </CustomModal>
    </AdminLayout>
  );
}
