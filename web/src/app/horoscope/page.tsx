'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { GradientButton, DatePicker, Badge } from '@/components/UIComponents';
import { api } from '@/lib/api';

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

export default function HoroscopePage() {
  const [sign, setSign] = useState('Aries');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchHoroscope = useCallback(async () => {
    if (!sign || !date) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.get<any>(
        `/horoscope?sign=${encodeURIComponent(sign)}&date=${date}`,
      );
      setRecord(data);
    } catch (e: any) {
      setRecord(null);
      setError(e.message || 'Failed to fetch horoscope');
    } finally {
      setLoading(false);
    }
  }, [sign, date]);

  useEffect(() => {
    fetchHoroscope();
  }, [fetchHoroscope]);

  const sections = [
    { label: 'General', value: record?.prediction },
    { label: 'Love', value: record?.lovePrediction },
    { label: 'Career', value: record?.careerPrediction },
    { label: 'Finance', value: record?.financePrediction },
    { label: 'Health', value: record?.healthPrediction },
  ].filter((s) => s.value);

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-extrabold text-text-primary">Horoscope</h1>
        <GradientButton onClick={fetchHoroscope}>Refresh</GradientButton>
      </div>
      <p className="text-text-muted text-sm mb-6">
        Horoscope data is fetched automatically from the configured astrology API and cached
        per sign and date. No manual entry is required.
      </p>

      <div className="glass-card-solid p-6 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[200px]">
            <label className="text-text-secondary text-sm block mb-1">Zodiac Sign</label>
            <select
              value={sign}
              onChange={(e) => setSign(e.target.value)}
              className="input-field text-sm"
            >
              {ZODIAC_SIGNS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[200px]">
            <label className="text-text-secondary text-sm block mb-1">Date</label>
            <DatePicker value={date} onChange={setDate} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-text-secondary">Fetching from API...</div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-800 text-red-400 rounded-lg px-4 py-3 text-sm">{error}</div>
      ) : record ? (
        <div className="glass-card-solid p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-text-primary">
              {record.zodiacSign} · {record.date ? String(record.date).split('T')[0] : ''}
            </h2>
            <div className="flex gap-2">
              {record.luckyNumber != null && <Badge variant="info">Lucky No. {record.luckyNumber}</Badge>}
              {record.luckyColor && <Badge variant="success">Lucky Color {record.luckyColor}</Badge>}
              {record.mood && <Badge variant="warning">Mood {record.mood}</Badge>}
            </div>
          </div>

          {sections.length === 0 ? (
            <p className="text-text-secondary text-sm">No prediction text available for this date.</p>
          ) : (
            <div className="space-y-4">
              {sections.map((s) => (
                <div key={s.label}>
                  <p className="text-primary-light text-xs font-bold uppercase tracking-wide mb-1">{s.label}</p>
                  <p className="text-text-secondary text-sm leading-relaxed">{s.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="glass-card-solid p-8 text-center text-text-secondary text-sm">
          No horoscope data available.
        </div>
      )}
    </AdminLayout>
  );
}
