import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { colors, radii } from '../theme';

interface Props { label: string; selected?: boolean; onPress?: () => void; color?: string; style?: any; }

export function Chip({ label, selected, onPress, color, style }: Props) {
  const dynamicChipStyle = selected
    ? { borderColor: colors.primary, backgroundColor: colors.primary + '20' }
    : {
        borderColor: colors.chipBorder,
        backgroundColor: colors.chipBg,
      };

  const dynamicLabelStyle = selected
    ? { color: colors.accentGold, fontWeight: '700' as const }
    : { color: colors.textBody };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, dynamicChipStyle, color ? { backgroundColor: color + '20', borderColor: color } : null, style]}
    >
      <Text style={[styles.label, dynamicLabelStyle, color ? { color } : null]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radii.chip,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  label: { fontSize: 13, fontWeight: '500' },
});
