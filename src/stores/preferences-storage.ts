import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AppColorScheme } from '@/src/theme/tokens';
import type { AppIconId } from '@/src/utils/app-icon';

const PUBLISH_BUZZ_STORAGE_KEY = '@hive/publishBuzzEnabled';
const COLOR_SCHEME_STORAGE_KEY = '@hive/colorScheme';
const APP_ICON_STORAGE_KEY = '@hive/appIcon';

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

export async function loadAppIcon(): Promise<AppIconId | null> {
  const value = await AsyncStorage.getItem(APP_ICON_STORAGE_KEY);
  if (value === 'light' || value === 'dark') {
    return value;
  }

  return null;
}

export async function saveAppIcon(icon: AppIconId): Promise<void> {
  await AsyncStorage.setItem(APP_ICON_STORAGE_KEY, icon);
}
