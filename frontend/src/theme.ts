import { Platform } from 'react-native';

export const COLORS = {
  bgMain: '#0D1117',
  bgCard: '#161B22',
  accentPrimary: '#00FF66',
  accentSecondary: '#00E5FF',
  accentDanger: '#FF3366',
  accentWarning: '#FFD700',
  textPrimary: '#FFFFFF',
  textSecondary: '#8B949E',
  border: '#30363D',
  gridLines: '#21262D',
};

export const FONTS = {
  mono: Platform.select({ ios: 'Menlo', default: 'monospace' }) as string,
};
