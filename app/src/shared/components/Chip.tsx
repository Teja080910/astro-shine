import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { colors, radii } from '../theme';

interface Props { label: string; selected?: boolean; onPress?: () => void; color?: string; }

export function Chip({ label, selected, onPress, color }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, selected && styles.selected, color ? { backgroundColor: color + '20', borderColor: color } : null]}
    >
      <Text style={[styles.label, selected && styles.selectedLabel, color ? { color } : null]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radii.chip,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surfaceLight,
    marginRight: 8,
    marginBottom: 8,
  },
  selected: { borderColor: colors.primary, backgroundColor: colors.primary + '20' },
  label: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  selectedLabel: { color: colors.primaryLight },
});
