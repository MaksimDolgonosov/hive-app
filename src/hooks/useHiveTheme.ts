import { HiveThemes, type AppColorScheme, type HivePalette } from '@/src/theme/tokens';
import { usePreferencesStore } from '@/src/stores/preferencesStore';

export function useAppColorScheme(): AppColorScheme {
  return usePreferencesStore((state) => state.colorScheme);
}

export function useHiveTheme(): HivePalette {
  const colorScheme = useAppColorScheme();
  return HiveThemes[colorScheme];
}
