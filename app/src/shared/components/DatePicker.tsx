import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { colors, radii, typography } from '../theme';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  value: string;
  onClose: () => void;
  onSelect: (date: string) => void;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function DatePicker({ visible, value, onClose, onSelect }: Props) {
  const today = new Date();
  const initial = value ? new Date(value) : today;
  const [year, setYear] = useState(isNaN(initial.getTime()) ? today.getFullYear() : initial.getFullYear());
  const [month, setMonth] = useState(isNaN(initial.getTime()) ? today.getMonth() : initial.getMonth());
  const [day, setDay] = useState(isNaN(initial.getTime()) ? today.getDate() : initial.getDate());
  const [view, setView] = useState<'calendar' | 'years'>('calendar');

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const years: number[] = [];
  for (let y = today.getFullYear(); y >= 1950; y--) years.push(y);

  const handlePrevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const handleNextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const handleConfirm = () => {
    onSelect(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={styles.overlay}>
        <TouchableOpacity activeOpacity={1} style={[styles.dialog, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <Text style={[typography.sectionTitle, { textAlign: 'center', marginBottom: 12, color: colors.accentGold }]}>Select Date of Birth</Text>

          {view === 'years' ? (
            <>
              <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', paddingVertical: 8 }}>
                  {years.map(y => (
                    <TouchableOpacity key={y} onPress={() => { setYear(y); setView('calendar'); }}
                      style={[styles.yearChip, { backgroundColor: y === year ? colors.primary : colors.surfaceLight, borderColor: y === year ? colors.primaryLight : colors.cardBorder }]}>
                      <Text style={{ color: y === year ? colors.white : colors.textPrimary, fontWeight: '600', fontSize: 13 }}>{y}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <TouchableOpacity onPress={() => setView('calendar')} style={{ alignSelf: 'center', marginTop: 8 }}>
                <Text style={[typography.caption, { color: colors.primaryLight, fontWeight: '600' }]}>Back to Calendar</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={[styles.selectedDisplay, { backgroundColor: colors.surfaceLight }]}>
                <Text style={[typography.cardTitle, { color: colors.textPrimary }]}>{day} {MONTHS[month]} {year}</Text>
              </View>

              <View style={styles.monthNav}>
                <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
                  <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setView('years')}>
                  <Text style={[typography.cardTitle, { color: colors.textPrimary }]}>{MONTHS[month]} {year}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
                  <Ionicons name="chevron-forward" size={20} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <View style={styles.weekRow}>
                {DAY_NAMES.map(d => (
                  <Text key={d} style={[styles.weekDay, { color: colors.textMuted }]}>{d}</Text>
                ))}
              </View>

              <View style={styles.daysGrid}>
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <View key={`empty-${i}`} style={styles.dayCell} />
                ))}
                {days.map(d => (
                  <TouchableOpacity key={d} onPress={() => setDay(d)}
                    style={[styles.dayCell, styles.dayBtn, { backgroundColor: d === day ? colors.primary : 'transparent' }]}>
                    <Text style={[styles.dayText, { color: d === day ? colors.white : colors.textPrimary }]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.actions}>
                <TouchableOpacity onPress={onClose} style={[styles.actionBtn, { borderColor: colors.cardBorder, borderWidth: 1 }]}>
                  <Text style={[typography.caption, { color: colors.textSecondary, fontWeight: '600' }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleConfirm} style={[styles.actionBtn, { backgroundColor: colors.accentGold }]}>
                  <Text style={[typography.caption, { color: colors.white, fontWeight: '700' }]}>Select Date</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  dialog: { width: '100%', maxWidth: 340, borderRadius: radii.card, borderWidth: 1, padding: 16 },
  selectedDisplay: { padding: 10, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  navBtn: { padding: 8 },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  weekDay: { width: '14.28%', textAlign: 'center', fontSize: 12, fontWeight: '600', paddingVertical: 4 },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center' },
  dayBtn: { borderRadius: 20 },
  dayText: { fontSize: 14, fontWeight: '500' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { flex: 1, height: 44, borderRadius: radii.button, justifyContent: 'center', alignItems: 'center' },
  yearChip: { paddingHorizontal: 14, height: 36, borderRadius: 18, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
});
