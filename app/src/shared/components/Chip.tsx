import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { colors, radii } from '../theme';
import { useAuth } from '../../context/AuthContext';

interface Props { label: string; selected?: boolean; onPress?: () => void; color?: string; style?: any; }

export function Chip({ label, selected, onPress, color, style }: Props) {
  const { theme } = useAuth();
  const isDark = theme === 'dark';

  const dynamicChipStyle = selected
    ? { borderColor: colors.primary, backgroundColor: colors.primary + '20' }
    : { 
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', 
        backgroundColor: isDark ? '#1E293B' : '#E2E8F0' 
      };

  const dynamicLabelStyle = selected
    ? { color: colors.primaryLight }
    : { color: colors.textSecondary };

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
    paddingVertical: 7,
    borderRadius: radii.chip,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  label: { fontSize: 13, fontWeight: '500' },
});
