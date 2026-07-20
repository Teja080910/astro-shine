import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { radii } from '../theme';
import { useAuth } from '../../context/AuthContext';

interface Props { children: React.ReactNode; style?: ViewStyle; noPadding?: boolean; }

export function GlassCard({ children, style, noPadding }: Props) {
  const { theme } = useAuth();
  const isDark = theme === 'dark';
  const cardBg = isDark ? '#1F2937' : '#FFFBEB';
  const cardBorder = isDark ? 'rgba(245, 158, 11, 0.25)' : '#FDE68A';

  return (
    <View style={[styles.card, !noPadding && styles.padding, { backgroundColor: cardBg, borderColor: cardBorder }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  padding: { padding: 16 },
});
