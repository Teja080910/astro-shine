import { MD3DarkTheme, MD3LightTheme, configureFonts } from 'react-native-paper';

export const colors = {
  primary: '#6D28D9',
  primaryLight: '#9333EA',
  primaryDark: '#5B21B6',
  secondary: '#7C3AED',
  accentGold: '#F59E0B',
  success: '#22C55E',
  warning: '#F97316',
  danger: '#EF4444',
  background: '#09090B',
  surface: '#111827',
  surfaceLight: '#1F2937',
  card: 'rgba(255,255,255,0.08)',
  cardBorder: 'rgba(255,255,255,0.12)',
  textPrimary: '#FFFFFF',
  textSecondary: '#B6B6C2',
  textMuted: '#71717A',
  divider: 'rgba(255,255,255,0.08)',
  glassBg: 'rgba(17, 24, 39, 0.7)',
  gradientStart: '#6D28D9',
  gradientMid: '#9333EA',
  gradientEnd: '#A855F7',
  overlay: 'rgba(0,0,0,0.6)',
  white: '#FFFFFF',
  black: '#000000',
};

export const radii = {
  button: 18,
  card: 24,
  bottomSheet: 28,
  input: 16,
  avatar: 999,
  modal: 20,
  chip: 12,
  tab: 14,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  button: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  floating: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
};

export const typography = {
  hero: { fontSize: 36, fontWeight: '800' as const, letterSpacing: -0.5, color: colors.textPrimary },
  pageTitle: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.3, color: colors.textPrimary },
  sectionTitle: { fontSize: 20, fontWeight: '600' as const, color: colors.textPrimary },
  cardTitle: { fontSize: 16, fontWeight: '600' as const, color: colors.textPrimary },
  body: { fontSize: 14, fontWeight: '400' as const, color: colors.textSecondary, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400' as const, color: colors.textMuted },
  price: { fontSize: 18, fontWeight: '700' as const, color: colors.accentGold },
  label: { fontSize: 13, fontWeight: '500' as const, color: colors.textSecondary },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primary,
    primaryContainer: colors.primaryDark,
    secondary: colors.secondary,
    background: colors.background,
    surface: colors.surface,
    surfaceVariant: colors.surfaceLight,
    error: colors.danger,
    onPrimary: colors.white,
    onBackground: colors.textPrimary,
    onSurface: colors.textSecondary,
    outline: colors.cardBorder,
    outlineVariant: colors.divider,
  },
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    primaryContainer: colors.primaryLight,
    secondary: colors.secondary,
    background: '#FAFAFA',
    surface: '#FFFFFF',
    surfaceVariant: '#F3F4F6',
    error: colors.danger,
    onPrimary: colors.white,
    onBackground: '#111827',
    onSurface: '#6B7280',
    outline: '#E5E7EB',
    outlineVariant: '#F3F4F6',
  },
};
