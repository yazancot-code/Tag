import { useColorScheme } from 'react-native';

export type ThemeColors = {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  accent: string;
  accentLight: string;
  border: string;
  danger: string;
  price: string;
  placeholderBg: string;
  placeholderText: string;
  overlayBg: string;
};

const light: ThemeColors = {
  background: '#f2f2f7',
  surface: '#fff',
  text: '#222',
  textSecondary: '#333',
  textTertiary: '#888',
  accent: '#366092',
  accentLight: '#e8edf3',
  border: '#e0e0e0',
  danger: '#d32f2f',
  price: '#c97b0a',
  placeholderBg: '#e8edf3',
  placeholderText: '#366092',
  overlayBg: '#fff',
};

const dark: ThemeColors = {
  background: '#000',
  surface: '#1c1c1e',
  text: '#fff',
  textSecondary: '#e5e5e7',
  textTertiary: '#98989e',
  accent: '#5a9bd5',
  accentLight: '#2c3e50',
  border: '#38383a',
  danger: '#ff453a',
  price: '#ff9f0a',
  placeholderBg: '#2c3e50',
  placeholderText: '#5a9bd5',
  overlayBg: '#1c1c1e',
};

export function useTheme(): ThemeColors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? dark : light;
}