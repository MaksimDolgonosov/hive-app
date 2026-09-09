import { vars } from 'nativewind';

import { HiveThemes, type AppColorScheme } from '@/src/theme/tokens';

function hexToRgbChannels(hex: string): string {
  const normalized = hex.replace('#', '');
  const value =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => `${char}${char}`)
          .join('')
      : normalized.slice(0, 6);
  const numeric = Number.parseInt(value, 16);

  return `${(numeric >> 16) & 255} ${(numeric >> 8) & 255} ${numeric & 255}`;
}

function createThemeVars(scheme: AppColorScheme) {
  const palette = HiveThemes[scheme];

  return vars({
    '--hive-bg': hexToRgbChannels(palette.bg),
    '--hive-primary': hexToRgbChannels(palette.accent),
    '--hive-accent': hexToRgbChannels(palette.accent),
    '--hive-foreground': hexToRgbChannels(palette.text),
    '--hive-muted': hexToRgbChannels(palette.textMuted),
    '--hive-dim': hexToRgbChannels(palette.textDim),
    '--hive-surface': hexToRgbChannels(palette.surface),
    '--hive-surface2': hexToRgbChannels(palette.surface2),
    '--hive-input-bg': hexToRgbChannels(palette.inputBg),
    '--hive-signal': hexToRgbChannels(palette.signal),
    '--hive-danger': hexToRgbChannels(palette.danger),
    '--hive-on-accent': hexToRgbChannels(palette.textOnAccent),
    '--hive-stroke': palette.stroke,
  });
}

export const HIVE_NATIVEWIND_VARS: Record<AppColorScheme, ReturnType<typeof vars>> = {
  dark: createThemeVars('dark'),
  light: createThemeVars('light'),
};
