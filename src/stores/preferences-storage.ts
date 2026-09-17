import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AppColorScheme } from '@/src/theme/tokens';
import type { AppIconId } from '@/src/utils/app-icon';

const PUBLISH_BUZZ_STORAGE_KEY = '@hive/publishBuzzEnabled';
const COLOR_SCHEME_STORAGE_KEY = '@hive/colorScheme';
const APP_ICON_STORAGE_KEY = '@hive/appIcon';
const ECHO_LAYER_STORAGE_KEY = '@hive/echoLayerEnabled';
const EMPTY_STATE_BANNER_STORAGE_KEY = '@hive/emptyStateBannerEnabled';
const FIRST_STING_STORAGE_KEY = '@hive/hasPublishedFirstSting';
const PUSH_EXPLAIN_STORAGE_KEY = '@hive/pushExplainDismissed';
const INSTAGRAM_LINKS_ALLOWED_KEY = '@hive/instagramLinksAllowed';

async function loadBoolean(key: string): Promise<boolean | null> {
  const value = await AsyncStorage.getItem(key);
  if (value === null) {
    return null;
  }

  return value === 'true';
}

async function saveBoolean(key: string, value: boolean): Promise<void> {
  await AsyncStorage.setItem(key, value ? 'true' : 'false');
}

export function loadPublishBuzzEnabled(): Promise<boolean | null> {
  return loadBoolean(PUBLISH_BUZZ_STORAGE_KEY);
}

export function savePublishBuzzEnabled(enabled: boolean): Promise<void> {
  return saveBoolean(PUBLISH_BUZZ_STORAGE_KEY, enabled);
}

/** Локальный тумблер отображения слоя эха (§G2) — не путать с серверным `allowEcho`. */
export function loadEchoLayerEnabled(): Promise<boolean | null> {
  return loadBoolean(ECHO_LAYER_STORAGE_KEY);
}

export function saveEchoLayerEnabled(enabled: boolean): Promise<void> {
  return saveBoolean(ECHO_LAYER_STORAGE_KEY, enabled);
}

/** Локальный тумблер плашки пустой зоны («Здесь ещё никто не был»). */
export function loadEmptyStateBannerEnabled(): Promise<boolean | null> {
  return loadBoolean(EMPTY_STATE_BANNER_STORAGE_KEY);
}

export function saveEmptyStateBannerEnabled(enabled: boolean): Promise<void> {
  return saveBoolean(EMPTY_STATE_BANNER_STORAGE_KEY, enabled);
}

/** UX-подсказка для экрана первого снимка (§G6), а не состояние аккаунта. */
export function loadHasPublishedFirstSting(): Promise<boolean | null> {
  return loadBoolean(FIRST_STING_STORAGE_KEY);
}

export function saveHasPublishedFirstSting(value: boolean): Promise<void> {
  return saveBoolean(FIRST_STING_STORAGE_KEY, value);
}

export function loadPushExplainDismissed(): Promise<boolean | null> {
  return loadBoolean(PUSH_EXPLAIN_STORAGE_KEY);
}

export function savePushExplainDismissed(value: boolean): Promise<void> {
  return saveBoolean(PUSH_EXPLAIN_STORAGE_KEY, value);
}

/** Показывать Instagram в профиле. Пересчитывается по геолокации при входе. */
export function loadInstagramLinksAllowed(): Promise<boolean | null> {
  return loadBoolean(INSTAGRAM_LINKS_ALLOWED_KEY);
}

export function saveInstagramLinksAllowed(value: boolean): Promise<void> {
  return saveBoolean(INSTAGRAM_LINKS_ALLOWED_KEY, value);
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
