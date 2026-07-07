import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { colors, radii } from '../theme';

interface Props { label: string; selected?: boolean; onPress?: () => void; color?: string; }

export function Chip({ label, selected, onPress, color }: Props) {
  const dynamicChipStyle = selected
    ? { borderColor: colors.primary, backgroundColor: colors.primary + '20' }
    : { borderColor: colors.cardBorder, backgroundColor: colors.surfaceLight };

  const dynamicLabelStyle = selected
    ? { color: colors.primaryLight }
    : { color: colors.textSecondary };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, dynamicChipStyle, color ? { backgroundColor: color + '20', borderColor: color } : null]}
    >
      <Text style={[styles.label, dynamicLabelStyle, color ? { color } : null]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radii.chip,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  label: { fontSize: 13, fontWeight: '500' },
});
