'use client';

import { useState, useEffect } from 'react';
import { formatDate } from '@/lib/utils';
import { AdminLayout } from '@/components/AdminLayout';
import { Table, Badge, CustomModal, GradientButton, DatePicker } from '@/components/UIComponents';
import { api } from '@/lib/api';
import type { HoroscopeRecord } from '@astro-shine/shared-types';

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

export default function HoroscopePage() {
  const [data, setData] = useState<HoroscopeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<HoroscopeRecord | null>(null);

  // Form states
  const [zodiacSign, setZodiacSign] = useState('Aries');
  const [date, setDate] = useState('');
  const [prediction, setPrediction] = useState('');
  const [luckyNumber, setLuckyNumber] = useState('');
  const [luckyColor, setLuckyColor] = useState('');
  const [mood, setMood] = useState('');

  useEffect(() => {
    fetchHoroscopes();
  }, []);

  const fetchHoroscopes = () => {
    setLoading(true);
    api.get<HoroscopeRecord[]>('/horoscope')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const openForm = (h: HoroscopeRecord) => {
    setSelected(h);
    setZodiacSign(h.zodiacSign || 'Aries');
    // Format date string to YYYY-MM-DD for input field
    const formattedDate = h.date ? new Date(h.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    setDate(formattedDate);
    setPrediction(h.prediction || '');
    setLuckyNumber(h.luckyNumber !== undefined ? String(h.luckyNumber) : '');
    setLuckyColor(h.luckyColor || '');
    setMood(h.mood || '');
  };

  const handleSave = async () => {
    if (!prediction.trim()) { alert('Prediction is required'); return; }
    const num = parseInt(luckyNumber);
    if (luckyNumber && (isNaN(num) || num < 1 || num > 99)) { alert('Lucky number must be between 1 and 99'); return; }
    const payload = {
      zodiacSign,
      date,
      prediction,
      luckyNumber: luckyNumber ? Number(luckyNumber) : null,
      luckyColor: luckyColor || null,
      mood: mood || null,
    };

    try {
      if (selected?.id) {
        const updated = await api.put<HoroscopeRecord>(`/horoscope/${selected.id}`, payload);
        setData(data.map(h => h.id === selected.id ? updated : h));
      } else {
        const created = await api.post<HoroscopeRecord>('/horoscope', payload);
        setData([...data, created]);
      }
      setSelected(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this horoscope entry?')) return;
    try {
      await api.del(`/horoscope/${id}`);
      setData(data.filter(h => h.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-text-primary">Horoscopes</h1>
        <button onClick={() => openForm({} as HoroscopeRecord)} className="gradient-btn">Add Horoscope</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-text-secondary">Loading horoscopes...</div>
      ) : (
        <Table headers={['Zodiac Sign', 'Date', 'Prediction', 'Lucky Num', 'Lucky Color', 'Mood', '']} emptyMessage="No horoscope records found">
          {data.map(h => (
            <tr key={h.id} className="border-b border-divider hover:bg-surface-light/50">
              <td className="px-4 py-3 text-text-primary font-bold">{h.zodiacSign}</td>
              <td className="px-4 py-3 text-text-secondary text-sm">{formatDate(h.date)}</td>
              <td className="px-4 py-3 text-text-secondary text-sm max-w-xs truncate">{h.prediction}</td>
              <td className="px-4 py-3 text-text-secondary">{h.luckyNumber ?? '-'}</td>
              <td className="px-4 py-3 text-text-secondary">{h.luckyColor || '-'}</td>
              <td className="px-4 py-3 text-text-secondary">{h.mood || '-'}</td>
              <td className="px-4 py-3 flex gap-2">
                <button
                  onClick={() => openForm(h)}
                  className="text-primary-light hover:underline text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(h.id)}
                  className="text-red-400 hover:underline text-sm font-medium"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {/* Add/Edit Horoscope Modal */}
      <CustomModal open={!!selected} onClose={() => setSelected(null)} title={selected?.id ? 'Edit Horoscope' : 'Add Horoscope'}>
        <div className="space-y-4 text-text-secondary text-sm">
          <div>
            <label className="block text-text-primary font-medium mb-1">Zodiac Sign</label>
            <select
              value={zodiacSign}
              onChange={(e) => setZodiacSign(e.target.value)}
              className="input-field text-sm"
            >
              {ZODIAC_SIGNS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-text-primary font-medium mb-1">Date</label>
            <DatePicker
              value={date}
              onChange={setDate}
            />
          </div>

          <div>
            <label className="block text-text-primary font-medium mb-1">Prediction</label>
            <textarea
              value={prediction}
              onChange={(e) => setPrediction(e.target.value)}
              className="input-field h-24 text-sm"
              placeholder="Enter sign predictions for the day..."
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-text-primary font-medium mb-1">Lucky No.</label>
              <input
                type="number"
                value={luckyNumber}
                onChange={(e) => setLuckyNumber(e.target.value)}
                className="input-field text-sm"
                placeholder="e.g. 7"
              />
            </div>
            <div>
              <label className="block text-text-primary font-medium mb-1">Lucky Color</label>
              <input
                type="text"
                value={luckyColor}
                onChange={(e) => setLuckyColor(e.target.value)}
                className="input-field text-sm"
                placeholder="e.g. Blue"
              />
            </div>
            <div>
              <label className="block text-text-primary font-medium mb-1">Mood</label>
              <input
                type="text"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="input-field text-sm"
                placeholder="e.g. Energetic"
              />
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
