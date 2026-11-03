import { MD3DarkTheme, MD3LightTheme, configureFonts } from 'react-native-paper';

let activeTheme = 'light';

export const setThemeState = (theme: 'light' | 'dark') => {
  activeTheme = theme;
};

export const getCurrentTheme = () => activeTheme;

export const colors = {
  primary: '#EE7B10',
  primaryLight: '#F59E0B',
  primaryDark: '#C2640A',
  secondary: '#EE7B10',
  accentGold: '#F59E0B',
  maroon: '#8D0B0C',
  sacredRed: '#C21415',
  success: '#23A867',
  warning: '#F97316',
  danger: '#C21415',
  info: '#3188FB',
  white: '#FFFFFF',
  black: '#000000',

  get background() { return activeTheme === 'dark' ? '#09090B' : '#FEFDF9'; },
  get surface() { return activeTheme === 'dark' ? '#111827' : '#FFFCF5'; },
  get surfaceLight() { return activeTheme === 'dark' ? '#1F2937' : '#FEF8EA'; },
  get card() { return activeTheme === 'dark' ? '#1F2937' : '#FFFCF5'; },
  get cardBorder() { return activeTheme === 'dark' ? 'rgba(245, 158, 11, 0.25)' : '#F6EDC4'; },
  get textPrimary() { return activeTheme === 'dark' ? '#F9FAFB' : '#8D0B0C'; },
  get textSecondary() { return activeTheme === 'dark' ? '#E5E7EB' : '#45484F'; },
  get textMuted() { return activeTheme === 'dark' ? '#9CA3AF' : '#8B8B8D'; },
  get divider() { return activeTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#F6EDC4'; },
  get inputBorder() { return activeTheme === 'dark' ? 'rgba(245, 158, 11, 0.3)' : '#F2DFAE'; },
  get glassBg() { return activeTheme === 'dark' ? 'rgba(17, 24, 39, 0.85)' : 'rgba(255, 252, 245, 0.95)'; },
  gradientStart: '#EE7B10',
  gradientMid: '#F59E0B',
  gradientEnd: '#FBBF24',
  overlay: 'rgba(0,0,0,0.6)',
};

export const radii = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  card: 24,
  button: 24,
  bottomSheet: 28,
  input: 20,
  chip: 20,
  full: 999,
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
    } : {
      shadowColor: '#EE7B10',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 2,
    };
  },
  get button() {
    return activeTheme === 'dark' ? {
      shadowColor: '#EE7B10',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 3,
    } : {
      shadowColor: '#EE7B10',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 2,
    };
  },
  get floating() {
    return activeTheme === 'dark' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 5,
    } : {
      shadowColor: '#EE7B10',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 10,
      elevation: 4,
    };
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
    background: '#FEFDF9',
    surface: '#FFFFFF',
    surfaceVariant: '#FEF8EA',
    error: colors.danger,
    onPrimary: colors.white,
    onBackground: '#8D0B0C',
    onSurface: '#45484F',
    outline: '#F6EDC4',
    outlineVariant: '#F2DFAE',
  },
};
