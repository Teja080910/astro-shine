import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Pressable } from 'react-native';
import { colors, radii, typography } from '../theme';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  value: string;
  onChange: (time: string) => void;
  label?: string;
}

function to12(h: number): { display: number; period: 'AM' | 'PM' } {
  if (h === 0) return { display: 12, period: 'AM' };
  if (h < 12) return { display: h, period: 'AM' };
  if (h === 12) return { display: 12, period: 'PM' };
  return { display: h - 12, period: 'PM' };
}

function to24(display: number, period: 'AM' | 'PM'): number {
  if (period === 'AM') return display === 12 ? 0 : display;
  return display === 12 ? 12 : display + 12;
}

export function TimePicker({ value, onChange, label }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState(9);
  const [selectedMin, setSelectedMin] = useState(0);
  const hourScrollRef = useRef<ScrollView>(null);
  const minScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (value) {
      const h = parseInt(value.split(':')[0]);
      const m = parseInt(value.split(':')[1]);
      if (!isNaN(h)) setSelectedHour(h);
      if (!isNaN(m)) setSelectedMin(m);
    }
  }, [value]);

  const hours12 = useMemo(() => {
    const arr: { display: number; period: 'AM' | 'PM' }[] = [];
    for (let h = 0; h < 24; h++) arr.push(to12(h));
    return arr;
  }, []);

  const mins = [0, 15, 30, 45];

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        const idx = hours12.findIndex(h => to24(h.display, h.period) === selectedHour);
        if (idx >= 0) hourScrollRef.current?.scrollTo({ y: idx * 36 - 72, animated: false });
        minScrollRef.current?.scrollTo({ y: (mins.indexOf(selectedMin) * 36) - 72, animated: false });
      }, 100);
    }
  }, [open]);

  const formatTime = (h: number, m: number) =>
    `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

  const handleConfirm = () => {
    onChange(formatTime(selectedHour, selectedMin));
    setOpen(false);
  };

  const displayValue = value ? (() => {
    const h = parseInt(value.split(':')[0]);
    const m = value.split(':')[1];
    const t = to12(h);
    return `${t.display}:${m} ${t.period}`;
  })() : 'Select time';

  return (
    <View>
      {label && <Text style={[typography.label, { marginBottom: 4, color: colors.textSecondary }]}>{label}</Text>}
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={[styles.display, { backgroundColor: colors.surfaceLight, borderColor: colors.cardBorder }]}
      >
        <Ionicons name="time-outline" size={18} color={colors.textMuted} />
        <Text style={[typography.body, { color: colors.textPrimary, marginLeft: 6 }]}>{displayValue}</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <Text style={[typography.sectionTitle, { textAlign: 'center', marginBottom: 12, color: colors.textPrimary }]}>Select Time</Text>
            <View style={{ flexDirection: 'row', height: 200 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.colLabel, { color: colors.textMuted }]}>Hour</Text>
                <ScrollView ref={hourScrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 72 }}>
                  {hours12.map((h, i) => {
                    const h24 = to24(h.display, h.period);
                    return (
                      <TouchableOpacity key={i} onPress={() => setSelectedHour(h24)}
                        style={[styles.option, selectedHour === h24 && { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[typography.body, { color: selectedHour === h24 ? colors.primaryLight : colors.textPrimary, fontWeight: selectedHour === h24 ? '700' : '400' }]}>
                          {h.display} {h.period}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
              <View style={{ justifyContent: 'center', paddingHorizontal: 4 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '700' }}>:</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.colLabel, { color: colors.textMuted }]}>Min</Text>
                <ScrollView ref={minScrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 72 }}>
                  {mins.map(m => (
                    <TouchableOpacity key={m} onPress={() => setSelectedMin(m)}
                      style={[styles.option, selectedMin === m && { backgroundColor: colors.primary + '20' }]}>
                      <Text style={[typography.body, { color: selectedMin === m ? colors.primaryLight : colors.textPrimary, fontWeight: selectedMin === m ? '700' : '400' }]}>
                        {String(m).padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <TouchableOpacity onPress={() => setOpen(false)} style={[styles.actionBtn, { borderColor: colors.cardBorder, borderWidth: 1 }]}>
                <Text style={[typography.caption, { color: colors.textSecondary, fontWeight: '600' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleConfirm} style={[styles.actionBtn, { backgroundColor: colors.primary }]}>
                <Text style={[typography.caption, { color: colors.white, fontWeight: '700' }]}>Set</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  sheet: { width: '100%', maxWidth: 300, borderRadius: radii.card, borderWidth: 1, padding: 20 },
  display: { flexDirection: 'row', alignItems: 'center', borderRadius: radii.input, borderWidth: 1, paddingHorizontal: 14, height: 48 },
  colLabel: { textAlign: 'center', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  option: { paddingVertical: 8, paddingHorizontal: 16, alignItems: 'center', borderRadius: 8, marginHorizontal: 4 },
  actionBtn: { flex: 1, height: 44, borderRadius: radii.button, justifyContent: 'center', alignItems: 'center' },
});
