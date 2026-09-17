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
  loadEchoLayerEnabled,
  loadHasPublishedFirstSting,
  loadInstagramLinksAllowed,
  loadPublishBuzzEnabled,
  loadPushExplainDismissed,
  saveAppIcon,
  saveColorScheme,
  saveEchoLayerEnabled,
  saveHasPublishedFirstSting,
  saveInstagramLinksAllowed,
  savePublishBuzzEnabled,
  savePushExplainDismissed,
} from './preferences-storage';

const DEFAULT_COLOR_SCHEME: AppColorScheme = 'light';

function applyNativeColorScheme(scheme: AppColorScheme) {
  Appearance.setColorScheme(scheme);
}

interface PreferencesState {
  publishBuzzEnabled: boolean;
  /** Показывать слой эха на карте (§G2). Локальная настройка отображения. */
  echoLayerEnabled: boolean;
  /** Пользователь уже публиковал — экран первого снимка больше не нужен (§G6). */
  hasPublishedFirstSting: boolean;
  /** Экран-объяснение пушей уже показывали (§G10). */
  pushExplainDismissed: boolean;
  /** Показать экран пушей сразу после первой публикации. */
  pendingPushExplain: boolean;
  /** Показывать ссылку Instagram. Считается по геолокации при входе в приложение. */
  instagramLinksAllowed: boolean;
  colorScheme: AppColorScheme;
  appIcon: AppIconId;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  setPublishBuzzEnabled: (enabled: boolean) => Promise<void>;
  setEchoLayerEnabled: (enabled: boolean) => Promise<void>;
  setHasPublishedFirstSting: (value: boolean) => Promise<void>;
  setPushExplainDismissed: (value: boolean) => Promise<void>;
  setPendingPushExplain: (value: boolean) => void;
  setInstagramLinksAllowed: (allowed: boolean) => Promise<void>;
  setColorScheme: (scheme: AppColorScheme) => Promise<void>;
  setAppIcon: (icon: AppIconId) => Promise<boolean>;
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  publishBuzzEnabled: true,
  echoLayerEnabled: true,
  hasPublishedFirstSting: true,
  pushExplainDismissed: false,
  pendingPushExplain: false,
  instagramLinksAllowed: true,
  colorScheme: DEFAULT_COLOR_SCHEME,
  appIcon: getPlatformDefaultAppIcon(),
  isHydrated: false,

  hydrate: async () => {
    if (get().isHydrated) {
      return;
    }

    const [
      storedBuzz,
      storedScheme,
      storedIcon,
      storedEcho,
      storedFirstSting,
      storedPushExplain,
      storedInstagramLinksAllowed,
    ] = await Promise.all([
      loadPublishBuzzEnabled(),
      loadColorScheme(),
      loadAppIcon(),
      loadEchoLayerEnabled(),
      loadHasPublishedFirstSting(),
      loadPushExplainDismissed(),
      loadInstagramLinksAllowed(),
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
      echoLayerEnabled: storedEcho ?? true,
      hasPublishedFirstSting: storedFirstSting ?? false,
      pushExplainDismissed: storedPushExplain ?? false,
      instagramLinksAllowed: storedInstagramLinksAllowed ?? true,
      colorScheme,
      appIcon,
      isHydrated: true,
    });
  },

  setPublishBuzzEnabled: async (enabled) => {
    set({ publishBuzzEnabled: enabled });
    await savePublishBuzzEnabled(enabled);
  },

  setEchoLayerEnabled: async (enabled) => {
    set({ echoLayerEnabled: enabled });
    await saveEchoLayerEnabled(enabled);
  },

  setHasPublishedFirstSting: async (value) => {
    set({ hasPublishedFirstSting: value });
    await saveHasPublishedFirstSting(value);
  },

  setPushExplainDismissed: async (value) => {
    set({ pushExplainDismissed: value, pendingPushExplain: false });
    await savePushExplainDismissed(value);
  },

  setPendingPushExplain: (pendingPushExplain) => {
    set({ pendingPushExplain });
  },

  setInstagramLinksAllowed: async (allowed) => {
    if (get().instagramLinksAllowed === allowed) {
      return;
    }

    set({ instagramLinksAllowed: allowed });
    await saveInstagramLinksAllowed(allowed);
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
