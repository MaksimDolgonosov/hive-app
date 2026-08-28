import { create } from 'zustand';

import { loadPublishBuzzEnabled, savePublishBuzzEnabled } from './preferences-storage';

interface PreferencesState {
  publishBuzzEnabled: boolean;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  setPublishBuzzEnabled: (enabled: boolean) => Promise<void>;
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  publishBuzzEnabled: true,
  isHydrated: false,

  hydrate: async () => {
    if (get().isHydrated) {
      return;
    }

    const stored = await loadPublishBuzzEnabled();
    set({
      publishBuzzEnabled: stored ?? true,
      isHydrated: true,
    });
  },

  setPublishBuzzEnabled: async (enabled) => {
    set({ publishBuzzEnabled: enabled });
    await savePublishBuzzEnabled(enabled);
  },
}));

export function isPublishBuzzEnabled(): boolean {
  return usePreferencesStore.getState().publishBuzzEnabled;
}
