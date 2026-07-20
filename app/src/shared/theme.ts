import { MD3DarkTheme, MD3LightTheme, configureFonts } from 'react-native-paper';

let activeTheme = 'dark';

export const setThemeState = (theme: 'light' | 'dark') => {
  activeTheme = theme;
};

export const getCurrentTheme = () => activeTheme;

export const colors = {
  primary: '#7F1D1D',
  primaryLight: '#D97706',
  primaryDark: '#990000',
  secondary: '#EA580C',
  accentGold: '#F59E0B',
  success: '#22C55E',
  warning: '#F97316',
  danger: '#DC2626',
  white: '#FFFFFF',
  black: '#000000',

  get background() { return activeTheme === 'dark' ? '#09090B' : '#FCFAF2'; },
  get surface() { return activeTheme === 'dark' ? '#111827' : '#FFFFFF'; },
  get surfaceLight() { return activeTheme === 'dark' ? '#1F2937' : '#FFFBEB'; },
  get card() { return activeTheme === 'dark' ? 'rgba(255,255,255,0.08)' : '#FFFBEB'; },
  get cardBorder() { return activeTheme === 'dark' ? 'rgba(255,255,255,0.12)' : '#FDE68A'; },
  get textPrimary() { return activeTheme === 'dark' ? '#FFFFFF' : '#7F1D1D'; },
  get textSecondary() { return activeTheme === 'dark' ? '#B6B6C2' : '#374151'; },
  get textMuted() { return activeTheme === 'dark' ? '#71717A' : '#6B7280'; },
  get divider() { return activeTheme === 'dark' ? 'rgba(255,255,255,0.08)' : '#FDE68A'; },
  get inputBorder() { return activeTheme === 'dark' ? 'rgba(255,255,255,0.12)' : '#FCD34D'; },
  get glassBg() { return activeTheme === 'dark' ? 'rgba(17, 24, 39, 0.45)' : 'rgba(255, 255, 255, 0.95)'; },
  gradientStart: '#7F1D1D',
  gradientMid: '#B91C1C',
  gradientEnd: '#D97706',
  overlay: 'rgba(0,0,0,0.6)',
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
  get card() {
    return activeTheme === 'dark' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.05,
      shadowRadius: 16,
      elevation: 4,
    } : {};
  },
  get button() {
    return activeTheme === 'dark' ? {
      shadowColor: '#7F1D1D',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 3,
    } : {};
  },
  get floating() {
    return activeTheme === 'dark' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 5,
    } : {};
  },
};

export const typography = {
  get hero() { return { fontSize: 36, fontWeight: '800' as const, letterSpacing: -0.5, color: colors.textPrimary }; },
  get pageTitle() { return { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.3, color: colors.textPrimary }; },
  get sectionTitle() { return { fontSize: 20, fontWeight: '600' as const, color: colors.textPrimary }; },
  get cardTitle() { return { fontSize: 16, fontWeight: '600' as const, color: colors.textPrimary }; },
  get body() { return { fontSize: 14, fontWeight: '400' as const, color: colors.textSecondary, lineHeight: 20 }; },
  get caption() { return { fontSize: 12, fontWeight: '400' as const, color: colors.textMuted }; },
  price: { fontSize: 18, fontWeight: '700' as const, color: colors.accentGold },
  get label() { return { fontSize: 13, fontWeight: '500' as const, color: colors.textSecondary }; },
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
    background: '#FCFAF2',
    surface: '#FFFFFF',
    surfaceVariant: '#FFFBEB',
    error: colors.danger,
    onPrimary: colors.white,
    onBackground: '#7F1D1D',
    onSurface: '#374151',
    outline: '#FDE68A',
    outlineVariant: '#FCD34D',
  },
};
