import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import {
  AppLanguage,
  isAppLanguage,
  LANGUAGE_STORAGE_KEY,
  resolveDeviceLanguage,
} from '@/src/i18n/languages';
import { en } from '@/src/i18n/locales/en';
import { ru } from '@/src/i18n/locales/ru';

const resources = {
  ru: { translation: ru },
  en: { translation: en },
};

function syncResourceBundles(): void {
  Object.entries(resources).forEach(([lng, bundle]) => {
    i18n.addResourceBundle(lng, 'translation', bundle.translation, true, true);
  });
}

let initPromise: Promise<AppLanguage> | null = null;

export async function initI18n(): Promise<AppLanguage> {
  const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  const language = isAppLanguage(stored) ? stored : resolveDeviceLanguage();

  if (!i18n.isInitialized) {
    if (!initPromise) {
      initPromise = i18n
        .use(initReactI18next)
        .init({
          resources,
          lng: language,
          fallbackLng: 'ru',
          interpolation: { escapeValue: false },
          compatibilityJSON: 'v4',
          react: { useSuspense: false },
        })
        .then(() => language);
    }

    return initPromise;
  }

  syncResourceBundles();

  if (i18n.language !== language) {
    await i18n.changeLanguage(language);
  } else {
    i18n.emit('languageChanged', language);
  }

  return language;
}

export async function changeAppLanguage(language: AppLanguage): Promise<void> {
  syncResourceBundles();
  await i18n.changeLanguage(language);
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
}

// Fast Refresh: модуль перезагружается, а singleton i18n — нет; подтягиваем новые ключи.
if (i18n.isInitialized) {
  syncResourceBundles();
  i18n.emit('languageChanged', i18n.language);
}

export default i18n;
