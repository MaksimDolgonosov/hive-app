import { Appearance } from 'react-native';
import { create } from 'zustand';

import type { AppColorScheme } from '@/src/theme/tokens';

import {
  loadColorScheme,
  loadPublishBuzzEnabled,
  saveColorScheme,
  savePublishBuzzEnabled,
} from './preferences-storage';

const DEFAULT_COLOR_SCHEME: AppColorScheme = 'dark';

function applyNativeColorScheme(scheme: AppColorScheme) {
  Appearance.setColorScheme(scheme);
}

interface PreferencesState {
  publishBuzzEnabled: boolean;
  colorScheme: AppColorScheme;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  setPublishBuzzEnabled: (enabled: boolean) => Promise<void>;
  setColorScheme: (scheme: AppColorScheme) => Promise<void>;
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  publishBuzzEnabled: true,
  colorScheme: DEFAULT_COLOR_SCHEME,
  isHydrated: false,

  hydrate: async () => {
    if (get().isHydrated) {
      return;
    }

    const [storedBuzz, storedScheme] = await Promise.all([
      loadPublishBuzzEnabled(),
      loadColorScheme(),
    ]);
    const colorScheme = storedScheme ?? DEFAULT_COLOR_SCHEME;
    applyNativeColorScheme(colorScheme);

    set({
      publishBuzzEnabled: storedBuzz ?? true,
      colorScheme,
      isHydrated: true,
    });
  },

  setPublishBuzzEnabled: async (enabled) => {
    set({ publishBuzzEnabled: enabled });
    await savePublishBuzzEnabled(enabled);
  },

  setColorScheme: async (scheme) => {
    applyNativeColorScheme(scheme);
    set({ colorScheme: scheme });
    await saveColorScheme(scheme);
  },
}));

export function isPublishBuzzEnabled(): boolean {
  return usePreferencesStore.getState().publishBuzzEnabled;
}
