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

let initPromise: Promise<AppLanguage> | null = null;

export async function initI18n(): Promise<AppLanguage> {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    const language = isAppLanguage(stored) ? stored : resolveDeviceLanguage();

    if (!i18n.isInitialized) {
      await i18n.use(initReactI18next).init({
        resources,
        lng: language,
        fallbackLng: 'ru',
        interpolation: { escapeValue: false },
        compatibilityJSON: 'v4',
      });
    } else {
      await i18n.changeLanguage(language);
    }

    return language;
  })();

  return initPromise;
}

export async function changeAppLanguage(language: AppLanguage): Promise<void> {
  await i18n.changeLanguage(language);
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
}

export default i18n;
