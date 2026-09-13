import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AppColorScheme } from '@/src/theme/tokens';

const PUBLISH_BUZZ_STORAGE_KEY = '@hive/publishBuzzEnabled';
const COLOR_SCHEME_STORAGE_KEY = '@hive/colorScheme';

export async function loadPublishBuzzEnabled(): Promise<boolean | null> {
  const value = await AsyncStorage.getItem(PUBLISH_BUZZ_STORAGE_KEY);
  if (value === null) {
    return null;
  }

  return value === 'true';
}

export async function savePublishBuzzEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(PUBLISH_BUZZ_STORAGE_KEY, enabled ? 'true' : 'false');
}

export async function loadColorScheme(): Promise<AppColorScheme | null> {
  const value = await AsyncStorage.getItem(COLOR_SCHEME_STORAGE_KEY);
  if (value === 'light' || value === 'dark') {
    return value;
  }

  return null;
}

export async function saveColorScheme(scheme: AppColorScheme): Promise<void> {
  await AsyncStorage.setItem(COLOR_SCHEME_STORAGE_KEY, scheme);
}
