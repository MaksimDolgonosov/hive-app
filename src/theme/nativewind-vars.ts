import { vars } from 'nativewind';

import { HiveThemes, type AppColorScheme } from '@/src/theme/tokens';

function colorToRgbChannels(color: string): string {
  const trimmed = color.trim();
  const hex = trimmed.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);

  if (hex) {
    const raw = hex[1];
    const value =
      raw.length === 3
        ? raw
            .split('')
            .map((char) => `${char}${char}`)
            .join('')
        : raw;
    const numeric = Number.parseInt(value, 16);

    return `${(numeric >> 16) & 255} ${(numeric >> 8) & 255} ${numeric & 255}`;
  }

  const rgb = trimmed.match(
    /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*[\d.]+)?\s*\)$/i,
  );

  if (rgb) {
    return `${rgb[1]} ${rgb[2]} ${rgb[3]}`;
  }

  if (__DEV__) {
    console.warn(`[nativewind-vars] Unsupported color: ${color}`);
  }

  return '0 0 0';
}

function createThemeVars(scheme: AppColorScheme) {
  const palette = HiveThemes[scheme];

  return vars({
    '--hive-bg': colorToRgbChannels(palette.bg),
    '--hive-primary': colorToRgbChannels(palette.accent),
    '--hive-accent': colorToRgbChannels(palette.accent),
    '--hive-foreground': colorToRgbChannels(palette.text),
    '--hive-muted': colorToRgbChannels(palette.textMuted),
    '--hive-dim': colorToRgbChannels(palette.textDim),
    '--hive-surface': colorToRgbChannels(palette.surface),
    '--hive-surface2': colorToRgbChannels(palette.surface2),
    '--hive-input-bg': colorToRgbChannels(palette.inputBg),
    '--hive-signal': colorToRgbChannels(palette.signal),
    '--hive-danger': colorToRgbChannels(palette.danger),
    '--hive-on-accent': colorToRgbChannels(palette.textOnAccent),
    '--hive-stroke': palette.stroke,
  });
}

export const HIVE_NATIVEWIND_VARS: Record<AppColorScheme, ReturnType<typeof vars>> = {
  dark: createThemeVars('dark'),
  light: createThemeVars('light'),
};
