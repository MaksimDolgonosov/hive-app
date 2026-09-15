import { Appearance } from 'react-native';
import { create } from 'zustand';

import type { AppColorScheme } from '@/src/theme/tokens';
import {
  applyAppIcon,
  canChangeAppIcon,
  getPlatformDefaultAppIcon,
  readNativeAppIcon,
  type AppIconId,
} from '@/src/utils/app-icon';

import {
  loadAppIcon,
  loadColorScheme,
  loadPublishBuzzEnabled,
  saveAppIcon,
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
  appIcon: AppIconId;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  setPublishBuzzEnabled: (enabled: boolean) => Promise<void>;
  setColorScheme: (scheme: AppColorScheme) => Promise<void>;
  setAppIcon: (icon: AppIconId) => Promise<boolean>;
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  publishBuzzEnabled: true,
  colorScheme: DEFAULT_COLOR_SCHEME,
  appIcon: getPlatformDefaultAppIcon(),
  isHydrated: false,

  hydrate: async () => {
    if (get().isHydrated) {
      return;
    }

    const [storedBuzz, storedScheme, storedIcon] = await Promise.all([
      loadPublishBuzzEnabled(),
      loadColorScheme(),
      loadAppIcon(),
    ]);
    const colorScheme = storedScheme ?? DEFAULT_COLOR_SCHEME;
    applyNativeColorScheme(colorScheme);

    const nativeIcon = readNativeAppIcon();
    let appIcon = storedIcon ?? nativeIcon ?? getPlatformDefaultAppIcon();

    if (storedIcon && canChangeAppIcon() && nativeIcon !== storedIcon) {
      try {
        await applyAppIcon(storedIcon);
        appIcon = storedIcon;
      } catch {
        appIcon = nativeIcon ?? storedIcon;
      }
    }

    set({
      publishBuzzEnabled: storedBuzz ?? true,
      colorScheme,
      appIcon,
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

  setAppIcon: async (icon) => {
    const appliedNatively = canChangeAppIcon();

    if (appliedNatively) {
      await applyAppIcon(icon);
    }

    set({ appIcon: icon });
    await saveAppIcon(icon);
    return appliedNatively;
  },
}));

export function isPublishBuzzEnabled(): boolean {
  return usePreferencesStore.getState().publishBuzzEnabled;
}
