import { create } from 'zustand';

import { changeAppLanguage, initI18n } from '@/src/i18n';
import { AppLanguage, resolveDeviceLanguage } from '@/src/i18n/languages';

interface LocaleState {
  language: AppLanguage;
  isReady: boolean;
  hydrate: () => Promise<void>;
  setLanguage: (language: AppLanguage) => Promise<void>;
}

export const useLocaleStore = create<LocaleState>((set) => ({
  language: resolveDeviceLanguage(),
  isReady: false,

  hydrate: async () => {
    const language = await initI18n();
    set({ language, isReady: true });
  },

  setLanguage: async (language) => {
    await changeAppLanguage(language);
    set({ language });
  },
}));
