import { Appearance } from 'react-native';
import { create } from 'zustand';

import type { AppColorScheme, ThemePreference } from '@/src/theme/tokens';
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
  loadEmptyStateBannerEnabled,
  loadHasPublishedFirstSting,
  loadInstagramLinksAllowed,
  loadPublishBuzzEnabled,
  loadPushExplainDismissed,
  saveAppIcon,
  saveColorScheme,
  saveEchoLayerEnabled,
  saveEmptyStateBannerEnabled,
  saveHasPublishedFirstSting,
  saveInstagramLinksAllowed,
  savePublishBuzzEnabled,
  savePushExplainDismissed,
} from './preferences-storage';

const DEFAULT_THEME_PREFERENCE: ThemePreference = 'light';

function resolveColorScheme(preference: ThemePreference): AppColorScheme {
  if (preference === 'light' || preference === 'dark') {
    return preference;
  }

  return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
}

function applyNativeColorScheme(preference: ThemePreference) {
  Appearance.setColorScheme(preference === 'system' ? null : preference);
}

interface PreferencesState {
  publishBuzzEnabled: boolean;
  /** Показывать слой эха на карте (§G2). Локальная настройка отображения. */
  echoLayerEnabled: boolean;
  /** Показывать плашку пустой зоны («Здесь ещё никто не был»). */
  emptyStateBannerEnabled: boolean;
  /** Пользователь уже публиковал — экран первого снимка больше не нужен (§G6). */
  hasPublishedFirstSting: boolean;
  /** Экран-объяснение пушей уже показывали (§G10). */
  pushExplainDismissed: boolean;
  /** Показать экран пушей сразу после первой публикации. */
  pendingPushExplain: boolean;
  /** Показывать ссылку Instagram. Считается по геолокации при входе в приложение. */
  instagramLinksAllowed: boolean;
  /** Выбор в настройках. system не подменяет colorScheme — палитра всё равно light или dark. */
  themePreference: ThemePreference;
  colorScheme: AppColorScheme;
  appIcon: AppIconId;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  setPublishBuzzEnabled: (enabled: boolean) => Promise<void>;
  setEchoLayerEnabled: (enabled: boolean) => Promise<void>;
  setEmptyStateBannerEnabled: (enabled: boolean) => Promise<void>;
  setHasPublishedFirstSting: (value: boolean) => Promise<void>;
  setPushExplainDismissed: (value: boolean) => Promise<void>;
  setPendingPushExplain: (value: boolean) => void;
  setInstagramLinksAllowed: (allowed: boolean) => Promise<void>;
  setColorScheme: (preference: ThemePreference) => Promise<void>;
  setAppIcon: (icon: AppIconId) => Promise<boolean>;
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  publishBuzzEnabled: true,
  echoLayerEnabled: true,
  emptyStateBannerEnabled: true,
  hasPublishedFirstSting: true,
  pushExplainDismissed: false,
  pendingPushExplain: false,
  instagramLinksAllowed: true,
  themePreference: DEFAULT_THEME_PREFERENCE,
  colorScheme: resolveColorScheme(DEFAULT_THEME_PREFERENCE),
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
      storedEmptyStateBanner,
      storedFirstSting,
      storedPushExplain,
      storedInstagramLinksAllowed,
    ] = await Promise.all([
      loadPublishBuzzEnabled(),
      loadColorScheme(),
      loadAppIcon(),
      loadEchoLayerEnabled(),
      loadEmptyStateBannerEnabled(),
      loadHasPublishedFirstSting(),
      loadPushExplainDismissed(),
      loadInstagramLinksAllowed(),
    ]);
    const themePreference = storedScheme ?? DEFAULT_THEME_PREFERENCE;
    applyNativeColorScheme(themePreference);

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
      emptyStateBannerEnabled: storedEmptyStateBanner ?? true,
      hasPublishedFirstSting: storedFirstSting ?? false,
      pushExplainDismissed: storedPushExplain ?? false,
      instagramLinksAllowed: storedInstagramLinksAllowed ?? true,
      themePreference,
      colorScheme: resolveColorScheme(themePreference),
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

  setEmptyStateBannerEnabled: async (enabled) => {
    set({ emptyStateBannerEnabled: enabled });
    await saveEmptyStateBannerEnabled(enabled);
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

  setColorScheme: async (preference) => {
    applyNativeColorScheme(preference);
    set({ themePreference: preference, colorScheme: resolveColorScheme(preference) });
    await saveColorScheme(preference);
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

Appearance.addChangeListener(({ colorScheme }) => {
  if (usePreferencesStore.getState().themePreference !== 'system') {
    return;
  }

  const next: AppColorScheme = colorScheme === 'dark' ? 'dark' : 'light';
  if (usePreferencesStore.getState().colorScheme === next) {
    return;
  }

  usePreferencesStore.setState({ colorScheme: next });
});
