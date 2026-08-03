import { getLocales } from 'expo-localization';

export const SUPPORTED_LANGUAGES = ['ru', 'en'] as const;

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_STORAGE_KEY = 'hive_language';

export function isAppLanguage(value: string | null | undefined): value is AppLanguage {
  return value === 'ru' || value === 'en';
}

export function resolveDeviceLanguage(): AppLanguage {
  const code = getLocales()[0]?.languageCode;
  return code === 'ru' ? 'ru' : 'en';
}
