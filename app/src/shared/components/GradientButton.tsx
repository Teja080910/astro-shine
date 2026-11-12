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
  variant?: 'primary' | 'secondary' | 'danger' | 'gold' | 'outline' | 'solid';
}

export function GradientButton({ title, onPress, style, disabled, small, variant = 'primary' }: Props) {
  const gradients: Record<string, string[]> = {
    primary: [colors.gradientStart, colors.gradientMid, colors.gradientEnd],
    secondary: [colors.surfaceLight, colors.surface],
    danger: [colors.danger, '#C21415'],
    gold: [colors.accentGold, '#EE7B10'],
    outline: ['transparent', 'transparent'],
  };

  // Flat brand orange, no gradient. Matches the Chat / Call / Video buttons on
  // the astrologer cards so primary actions do not fade to amber on the right.
  if (variant === 'solid') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
        style={[
          styles.wrapper,
          small && styles.small,
          styles.solidButton,
          disabled && styles.disabled,
          style,
        ]}
      >
        <Text style={[styles.text, small && styles.smallText]} numberOfLines={1}>
          {title}
        </Text>
      </TouchableOpacity>
    );
  }

  if (variant === 'outline') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
        style={[
          styles.wrapper,
          small && styles.small,
          styles.outlineButton,
          { borderColor: colors.inputBorder },
          disabled && styles.disabled,
          style,
        ]}
      >
        <Text style={[styles.outlineText, small && styles.smallText]} numberOfLines={1}>
          {title}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.8} style={[styles.wrapper, small && styles.small, style]}>
      <LinearGradient
        colors={gradients[variant] as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.button, small && styles.smallButton, shadows.button, disabled && styles.disabled]}
      >
        <Text style={[styles.text, small && styles.smallText]} numberOfLines={1}>{title}</Text>
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
  outlineButton: {
    flex: 1,
    borderRadius: radii.button,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
  },
  outlineText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  solidButton: {
    flex: 1,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: colors.tabActive,
    shadowColor: colors.tabActive,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
});
