export type AppColorScheme = 'dark' | 'light';

export type HivePalette = {
  bg: string;
  surface: string;
  surface2: string;
  glass: string;
  stroke: string;
  strokeStrong: string;
  accent: string;
  accentSoft: string;
  signal: string;
  signalSoft: string;
  text: string;
  textMuted: string;
  textDim: string;
  textOnAccent: string;
  danger: string;
  overlay: string;
  inputBg: string;
  radiusLg: number;
  radiusMd: number;
  radiusPill: number;
  fontDisplay: string;
  fontBody: string;
  fontBodyMedium: string;
  fontBodySemiBold: string;
  fontBodyBold: string;
  gradients: {
    screen: readonly [string, string, string];
    screenLocations: readonly [number, number, number];
    authGlow: readonly [string, string, string];
    photoOverlay: readonly [string, string];
    marker: readonly [string, string];
  };
};

const SHARED = {
  accent: '#FFB800',
  accentSoft: 'rgba(255, 184, 0, 0.15)',
  signal: '#C6F24E',
  signalSoft: 'rgba(198, 242, 78, 0.12)',
  textOnAccent: '#0B0A08',
  danger: '#FF6B5A',
  radiusLg: 28,
  radiusMd: 18,
  radiusPill: 999,
  fontDisplay: 'SpaceGrotesk-Bold',
  fontBody: 'Inter',
  fontBodyMedium: 'Inter-Medium',
  fontBodySemiBold: 'Inter-SemiBold',
  fontBodyBold: 'Inter-Bold',
  gradients: {
    marker: ['#FFB800', '#E5A400'] as const,
    photoOverlay: ['transparent', 'rgba(11, 10, 8, 0.92)'] as const,
  },
} as const;

export const HiveThemes: Record<AppColorScheme, HivePalette> = {
  dark: {
    ...SHARED,
    bg: '#0B0A08',
    surface: '#15130F',
    surface2: '#201C16',
    glass: 'rgba(21, 19, 15, 0.85)',
    stroke: 'rgba(255, 255, 255, 0.08)',
    strokeStrong: 'rgba(255, 255, 255, 0.17)',
    text: '#F6F2EA',
    textMuted: '#9C9287',
    textDim: '#6A6158',
    overlay: 'rgba(11, 10, 8, 0.65)',
    inputBg: '#15130F',
    gradients: {
      ...SHARED.gradients,
      screen: ['#2D2207', '#14100A', '#0B0A08'] as const,
      screenLocations: [0, 0.32, 1] as const,
      authGlow: ['#0B0A08', '#1A140C', '#0B0A08'],
    },
  },
  light: {
    ...SHARED,
    bg: '#FFF8ED',
    surface: '#FFFFFF',
    surface2: '#FFF8ED',
    glass: 'rgba(255, 255, 255, 0.58)',
    stroke: 'rgba(245, 166, 35, 0.2)',
    strokeStrong: 'rgba(255, 255, 255, 0.5)',
    text: '#2C1810',
    textMuted: '#8B7355',
    textDim: '#8B7355',
    overlay: 'rgba(44, 24, 16, 0.35)',
    inputBg: '#FFFFFF',
    gradients: {
      ...SHARED.gradients,
      screen: ['#FFF8ED', '#FFE8B8', '#FFE8B8'] as const,
      screenLocations: [0, 1, 1] as const,
      authGlow: ['#FFF8ED', '#FFE8B8', 'rgba(255, 213, 79, 0.27)'],
    },
  },
};

/** Default (dark) palette for static styles that do not depend on the selected theme. */
export const HiveTheme = HiveThemes.dark;

export const HiveGradients = HiveTheme.gradients;
