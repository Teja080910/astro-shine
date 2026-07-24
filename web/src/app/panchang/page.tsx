'use client';

import { useState, useEffect } from 'react';
import { formatDate } from '@/lib/utils';
import { AdminLayout } from '@/components/AdminLayout';
import { Table, Badge, CustomModal, GradientButton, DatePicker, TimePicker } from '@/components/UIComponents';
import { api } from '@/lib/api';
import type { PanchangRecord } from '@astro-shine/shared-types';

export default function PanchangPage() {
  const [data, setData] = useState<PanchangRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PanchangRecord | null>(null);

  // Form states
  const [date, setDate] = useState('');
  const [tithi, setTithi] = useState('');
  const [nakshatra, setNakshatra] = useState('');
  const [yoga, setYoga] = useState('');
  const [karana, setKarana] = useState('');
  const [sunrise, setSunrise] = useState('');
  const [sunset, setSunset] = useState('');
  const [moonrise, setMoonrise] = useState('');
  const [moonset, setMoonset] = useState('');
  const [rahuStart, setRahuStart] = useState('');
  const [rahuEnd, setRahuEnd] = useState('');

  useEffect(() => {
    fetchPanchangs();
  }, []);

  const fetchPanchangs = () => {
    setLoading(true);
    api.get<PanchangRecord[]>('/panchang')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const openForm = (p: PanchangRecord) => {
    setSelected(p);
    const formattedDate = p.date ? new Date(p.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    setDate(formattedDate);
    setTithi(p.tithi || '');
    setNakshatra(p.nakshatra || '');
    setYoga(p.yoga || '');
    setKarana(p.karana || '');
    setSunrise(p.sunrise || '');
    setSunset(p.sunset || '');
    setMoonrise(p.moonrise || '');
    setMoonset(p.moonset || '');
    setRahuStart(p.rahuKaal?.start || '');
    setRahuEnd(p.rahuKaal?.end || '');
  };

  const handleSave = async () => {
    if (!date) { alert('Date is required'); return; }
    const payload = {
      date,
      tithi: tithi || null,
      nakshatra: nakshatra || null,
      yoga: yoga || null,
      karana: karana || null,
      sunrise: sunrise || null,
      sunset: sunset || null,
      moonrise: moonrise || null,
      moonset: moonset || null,
      rahuKaal: (rahuStart || rahuEnd) ? { start: rahuStart, end: rahuEnd } : null,
      data: selected?.data || {},
    };

    try {
      if (selected?.id) {
        const updated = await api.put<PanchangRecord>(`/panchang/${selected.id}`, payload);
        setData(data.map(p => p.id === selected.id ? updated : p));
      } else {
        const created = await api.post<PanchangRecord>('/panchang', payload);
        setData([...data, created]);
      }
      setSelected(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this panchang record?')) return;
    try {
      await api.del(`/panchang/${id}`);
      setData(data.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-text-primary">Panchang</h1>
        <button onClick={() => openForm({} as PanchangRecord)} className="gradient-btn">Add Panchang</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-text-secondary">Loading Panchang records...</div>
      ) : (
        <Table headers={['Date', 'Tithi', 'Nakshatra', 'Yoga', 'Karana', 'Sunrise', 'Sunset', '']} emptyMessage="No Panchang records found">
          {data.map(p => (
            <tr key={p.id} className="border-b border-divider hover:bg-surface-light/50">
              <td className="px-4 py-3 text-text-primary font-bold">{formatDate(p.date)}</td>
              <td className="px-4 py-3 text-text-secondary">{p.tithi || '-'}</td>
              <td className="px-4 py-3 text-text-secondary">{p.nakshatra || '-'}</td>
              <td className="px-4 py-3 text-text-secondary">{p.yoga || '-'}</td>
              <td className="px-4 py-3 text-text-secondary">{p.karana || '-'}</td>
              <td className="px-4 py-3 text-text-secondary text-sm">{p.sunrise || '-'}</td>
              <td className="px-4 py-3 text-text-secondary text-sm">{p.sunset || '-'}</td>
              <td className="px-4 py-3 flex gap-2">
                <button
                  onClick={() => openForm(p)}
                  className="text-primary-light hover:underline text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="text-red-400 hover:underline text-sm font-medium"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {/* Add/Edit Panchang Modal */}
      <CustomModal open={!!selected} onClose={() => setSelected(null)} title={selected?.id ? 'Edit Panchang' : 'Add Panchang'}>
        <div className="space-y-4 text-text-secondary text-sm">
          <div>
            <label className="block text-text-primary font-medium mb-1">Date</label>
            <DatePicker
              value={date}
              onChange={setDate}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-text-primary font-medium mb-1">Tithi</label>
              <input
                type="text"
                value={tithi}
                onChange={(e) => setTithi(e.target.value)}
                className="input-field text-sm"
                placeholder="e.g. Pratipada"
              />
            </div>
            <div>
              <label className="block text-text-primary font-medium mb-1">Nakshatra</label>
              <input
                type="text"
                value={nakshatra}
                onChange={(e) => setNakshatra(e.target.value)}
                className="input-field text-sm"
                placeholder="e.g. Ashwini"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-text-primary font-medium mb-1">Yoga</label>
              <input
                type="text"
                value={yoga}
                onChange={(e) => setYoga(e.target.value)}
                className="input-field text-sm"
                placeholder="e.g. Vishkumbha"
              />
            </div>
            <div>
              <label className="block text-text-primary font-medium mb-1">Karana</label>
              <input
                type="text"
                value={karana}
                onChange={(e) => setKarana(e.target.value)}
                className="input-field text-sm"
                placeholder="e.g. Bava"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="block text-text-primary font-medium text-[11px] mb-1">Sunrise</label>
              <TimePicker value={sunrise} onChange={setSunrise} />
            </div>
            <div>
              <label className="block text-text-primary font-medium text-[11px] mb-1">Sunset</label>
              <TimePicker value={sunset} onChange={setSunset} />
            </div>
            <div>
              <label className="block text-text-primary font-medium text-[11px] mb-1">Moonrise</label>
              <TimePicker value={moonrise} onChange={setMoonrise} />
            </div>
            <div>
              <label className="block text-text-primary font-medium text-[11px] mb-1">Moonset</label>
              <TimePicker value={moonset} onChange={setMoonset} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-text-primary font-medium mb-1">Rahu Kaal Start</label>
              <TimePicker value={rahuStart} onChange={setRahuStart} />
            </div>
            <div>
              <label className="block text-text-primary font-medium mb-1">Rahu Kaal End</label>
              <TimePicker value={rahuEnd} onChange={setRahuEnd} />
            </div>
          </div>

          <div className="flex gap-3 pt-3 border-t border-divider">
            <GradientButton onClick={handleSave}>Save</GradientButton>
            <GradientButton onClick={() => setSelected(null)}>Cancel</GradientButton>
          </div>
        </div>
      </CustomModal>
    </AdminLayout>
  );
}
