import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme';

interface Props { icon?: React.ReactNode; title: string; subtitle?: string; style?: ViewStyle; }

export function EmptyState({ icon, title, subtitle, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      {subtitle && <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 64 },
  icon: { marginBottom: 16, opacity: 0.6 },
  title: { fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
