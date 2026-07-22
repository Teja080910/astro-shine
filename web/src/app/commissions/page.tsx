'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Table, Badge, CustomModal, GradientButton } from '@/components/UIComponents';
import { api } from '@/lib/api';
import type { Commission } from '@astro-shine/shared-types';

export default function CommissionsPage() {
  const [data, setData] = useState<Commission[]>([]);
  const [selected, setSelected] = useState<Commission | null>(null);
  
  // Form fields
  const [astrologerId, setAstrologerId] = useState('');
  const [commissionType, setCommissionType] = useState<'percentage' | 'fixed'>('percentage');
  const [value, setValue] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxCap, setMaxCap] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    api.get<Commission[]>('/commissions')
      .then(setData)
      .catch((e) => console.error('Failed to load commissions:', e));
  }, []);

  const openEdit = (c: Commission) => {
    setSelected(c);
    setAstrologerId(c.astrologerId || '');
    setCommissionType(c.type || 'percentage');
    setValue(c.value || '');
    setMinAmount(c.minAmount || '');
    setMaxCap(c.maxCap || '');
    setIsActive(c.isActive !== undefined ? c.isActive : true);
  };

  const handleSave = async () => {
    if (!astrologerId.trim()) { setFormError('Astrologer ID is required'); return; }
    const numValue = parseFloat(value);
    if (!value || isNaN(numValue) || numValue <= 0) { setFormError('Value must be a positive number'); return; }
    if (commissionType === 'percentage' && numValue > 100) { setFormError('Percentage cannot exceed 100'); return; }
    if (minAmount && (isNaN(parseFloat(minAmount)) || parseFloat(minAmount) < 0)) { setFormError('Min amount must be non-negative'); return; }
    if (maxCap && (isNaN(parseFloat(maxCap)) || parseFloat(maxCap) < 0)) { setFormError('Max cap must be non-negative'); return; }
    setFormError('');

    const payload = {
      astrologerId,
      type: commissionType,
      value,
      minAmount: minAmount || null,
      maxCap: maxCap || null,
      isActive,
    };

    try {
      if (selected?.id) {
        const updated = await api.put<Commission>(`/commissions/${selected.id}`, payload);
        setData(data.map(c => c.id === selected.id ? updated : c));
      } else {
        const created = await api.post<Commission>('/commissions', payload);
        setData([...data, created]);
      }
      setSelected(null);
    } catch (e: any) {
      setFormError(e.message || 'Failed to save commission');
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-text-primary">Commissions</h1>
        <button onClick={() => openEdit({} as Commission)} className="gradient-btn">Add Commission</button>
      </div>
      <Table headers={['Astrologer', 'Type', 'Value', 'Min Amount', 'Max Cap', 'Status', '']} emptyMessage="No commissions found">
        {data.map(c => (
          <tr key={c.id} className="border-b border-divider hover:bg-surface-light/50">
            <td className="px-4 py-3 text-text-primary">{(c as any).astrologerName || c.astrologerId?.slice(0, 12) + '...'}</td>
            <td className="px-4 py-3 text-text-secondary">{c.type}</td>
            <td className="px-4 py-3 text-text-primary">{c.value}{c.type === 'percentage' ? '%' : ''}</td>
            <td className="px-4 py-3 text-text-secondary">{c.minAmount ? `₹${c.minAmount}` : '-'}</td>
            <td className="px-4 py-3 text-text-secondary">{c.maxCap ? `₹${c.maxCap}` : '-'}</td>
            <td className="px-4 py-3">{c.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="danger">Inactive</Badge>}</td>
            <td className="px-4 py-3"><button onClick={() => openEdit(c)} className="text-primary-light hover:underline text-sm font-medium">Edit</button></td>
          </tr>
        ))}
      </Table>

      <CustomModal open={!!selected} onClose={() => setSelected(null)} title={selected?.id ? 'Edit Commission' : 'Add Commission'}>
        <div className="space-y-4 text-text-secondary text-sm">
          {formError && <div className="text-sm text-red-400 font-medium">{formError}</div>}
          <div>
            <label className="block text-text-primary font-medium mb-1">Astrologer ID *</label>
            <input
              type="text"
              disabled={!!selected?.id}
              value={astrologerId}
              onChange={(e) => setAstrologerId(e.target.value)}
              className="input-field disabled:opacity-50 text-sm"
              placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
            />
          </div>
          <div>
            <label className="block text-text-primary font-medium mb-1">Commission Type</label>
            <select
              value={commissionType}
              onChange={(e) => setCommissionType(e.target.value as any)}
              className="input-field text-sm"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed (₹)</option>
            </select>
          </div>
          <div>
            <label className="block text-text-primary font-medium mb-1">Value</label>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="input-field text-sm"
              placeholder="e.g. 10"
            />
          </div>
          <div>
            <label className="block text-text-primary font-medium mb-1">Min Amount (Optional)</label>
            <input
              type="number"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="input-field text-sm"
              placeholder="e.g. 50"
            />
          </div>
          <div>
            <label className="block text-text-primary font-medium mb-1">Max Cap (Optional)</label>
            <input
              type="number"
              value={maxCap}
              onChange={(e) => setMaxCap(e.target.value)}
              className="input-field text-sm"
              placeholder="e.g. 500"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="commission-active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded border-divider bg-surface"
            />
            <label htmlFor="commission-active" className="text-text-primary font-medium">Is Active</label>
          </div>
          
          <div className="flex gap-3 pt-2">
            <GradientButton onClick={handleSave}>Save</GradientButton>
            <GradientButton onClick={() => setSelected(null)}>Cancel</GradientButton>
          </div>
        </div>
      </CustomModal>
    </AdminLayout>
  );
}

