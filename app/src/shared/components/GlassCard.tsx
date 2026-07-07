import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { colors, radii, shadows } from '../theme';

interface Props { children: React.ReactNode; style?: ViewStyle; noPadding?: boolean; }

export function GlassCard({ children, style, noPadding }: Props) {
  return (
    <View style={[styles.card, shadows.card, !noPadding && styles.padding, { backgroundColor: colors.card, borderColor: colors.cardBorder }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  padding: { padding: 16 },
});
