import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii, shadows } from '../theme';

interface Props {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  disabled?: boolean;
  small?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'gold';
}

export function GradientButton({ title, onPress, style, disabled, small, variant = 'primary' }: Props) {
  const gradients: Record<string, string[]> = {
    primary: [colors.gradientStart, colors.gradientMid, colors.gradientEnd],
    secondary: [colors.surfaceLight, colors.surface],
    danger: [colors.danger, '#DC2626'],
    gold: [colors.accentGold, '#D97706'],
  };

  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.8} style={[styles.wrapper, small && styles.small, style]}>
      <LinearGradient
        colors={gradients[variant]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.button, small && styles.smallButton, shadows.button, disabled && styles.disabled]}
      >
        <Text style={[styles.text, small && styles.smallText]}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%', height: 54 },
  small: { width: 'auto', height: 40 },
  button: {
    flex: 1,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  smallButton: { paddingHorizontal: 16 },
  text: { color: colors.white, fontSize: 16, fontWeight: '700' },
  smallText: { fontSize: 14 },
  disabled: { opacity: 0.5 },
});
