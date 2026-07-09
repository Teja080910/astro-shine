import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors, radii, typography } from '../theme';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  value: string;
  onChange: (time: string) => void;
  label?: string;
}

export function TimePicker({ value, onChange, label }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState(parseInt(value?.split(':')[0] || '9'));
  const [selectedMin, setSelectedMin] = useState(parseInt(value?.split(':')[1] || '0'));

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const mins = [0, 15, 30, 45];

  const formatTime = (h: number, m: number) =>
    `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

  const handleConfirm = () => {
    onChange(formatTime(selectedHour, selectedMin));
    setOpen(false);
  };

  return (
    <View>
      {label && <Text style={[typography.label, { marginBottom: 4, color: colors.textSecondary }]}>{label}</Text>}
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={[styles.display, { backgroundColor: colors.surfaceLight, borderColor: colors.cardBorder }]}
      >
        <Ionicons name="time-outline" size={18} color={colors.textMuted} />
        <Text style={[typography.body, { color: colors.textPrimary, marginLeft: 6 }]}>{value || 'Select time'}</Text>
      </TouchableOpacity>

      {open && (
        <View style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <View style={{ flexDirection: 'row', height: 160 }}>
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {hours.map(h => (
                <TouchableOpacity
                  key={h}
                  onPress={() => setSelectedHour(h)}
                  style={[styles.option, selectedHour === h && { backgroundColor: colors.primary + '20' }]}
                >
                  <Text style={[typography.body, { color: selectedHour === h ? colors.primaryLight : colors.textPrimary }]}>
                    {String(h).padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={{ alignSelf: 'center', color: colors.textPrimary, fontSize: 18, paddingHorizontal: 4 }}>:</Text>
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {mins.map(m => (
                <TouchableOpacity
                  key={m}
                  onPress={() => setSelectedMin(m)}
                  style={[styles.option, selectedMin === m && { backgroundColor: colors.primary + '20' }]}
                >
                  <Text style={[typography.body, { color: selectedMin === m ? colors.primaryLight : colors.textPrimary }]}>
                    {String(m).padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, padding: 8, borderTopWidth: 1, borderTopColor: colors.divider }}>
            <TouchableOpacity onPress={() => setOpen(false)} style={{ flex: 1, height: 40, borderRadius: radii.button, borderWidth: 1, borderColor: colors.cardBorder, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={[typography.caption, { color: colors.textSecondary, fontWeight: '600' }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm} style={{ flex: 1, height: 40, borderRadius: radii.button, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={[typography.caption, { color: colors.white, fontWeight: '700' }]}>Set</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  display: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.input,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 48,
  },
  dropdown: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    zIndex: 100,
    borderRadius: radii.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  option: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
});
