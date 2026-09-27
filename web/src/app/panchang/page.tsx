'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { GradientButton, DatePicker } from '@/components/UIComponents';
import { api } from '@/lib/api';

function to12h(value?: string | null): string {
  if (!value) return '-';
  const parts = String(value).split(':');
  const hour = parseInt(parts[0], 10);
  if (isNaN(hour)) return String(value);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${display}:${parts[1] || '00'} ${ampm}`;
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-divider last:border-0">
      <span className="text-text-secondary text-sm">{label}</span>
      <span className="text-text-primary text-sm font-semibold">{value || '-'}</span>
    </div>
  );
}

export default function PanchangPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchPanchang = useCallback(async () => {
    if (!date) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.get<any>(`/panchang?date=${date}`);
      setRecord(data);
    } catch (e: any) {
      setRecord(null);
      setError(e.message || 'Failed to fetch panchang');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchPanchang();
  }, [fetchPanchang]);

  const abhijit = record?.data?.abhijitMuhurta;

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-extrabold text-text-primary">Panchang</h1>
        <GradientButton onClick={fetchPanchang}>Refresh</GradientButton>
      </div>
      <p className="text-text-muted text-sm mb-6">
        Panchang is calculated automatically from the configured astrology API for the selected
        date and cached. No manual entry is required.
      </p>

      <div className="glass-card-solid p-6 mb-6">
        <div className="max-w-[240px]">
          <label className="text-text-secondary text-sm block mb-1">Date</label>
          <DatePicker value={date} onChange={setDate} />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-text-secondary">Fetching from API...</div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-800 text-red-400 rounded-lg px-4 py-3 text-sm">{error}</div>
      ) : record ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="glass-card-solid p-6">
            <h2 className="text-lg font-bold text-text-primary mb-3">Panchang Elements</h2>
            <Row label="Tithi" value={record.tithi} />
            <Row label="Nakshatra" value={record.nakshatra} />
            <Row label="Yoga" value={record.yoga} />
            <Row label="Karana" value={record.karana} />
          </div>

          <div className="glass-card-solid p-6">
            <h2 className="text-lg font-bold text-text-primary mb-3">Sun & Moon</h2>
            <Row label="Sunrise" value={to12h(record.sunrise)} />
            <Row label="Sunset" value={to12h(record.sunset)} />
            <Row label="Moonrise" value={to12h(record.moonrise)} />
            <Row label="Moonset" value={to12h(record.moonset)} />
          </div>

          <div className="glass-card-solid p-6 md:col-span-2">
            <h2 className="text-lg font-bold text-text-primary mb-3">Auspicious / Inauspicious Timings</h2>
            <Row
              label="Rahu Kaal"
              value={record.rahuKaal ? `${to12h(record.rahuKaal.start)} - ${to12h(record.rahuKaal.end)}` : '-'}
            />
            <Row
              label="Abhijit Muhurat"
              value={abhijit ? `${to12h(abhijit.start)} - ${to12h(abhijit.end)}` : '-'}
            />
          </div>
        </div>
      ) : (
        <div className="glass-card-solid p-8 text-center text-text-secondary text-sm">
          No panchang data available.
        </div>
      )}
    </AdminLayout>
  );
}
