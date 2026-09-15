import { requireOptionalNativeModule } from 'expo-modules-core';

export type AppIconId = 'light' | 'dark';

type AlternateAppIconsModule = {
  supportsAlternateIcons: boolean;
  setAlternateAppIcon: (name: string | null) => Promise<string | null>;
  getAppIconName: () => string | null;
};

const LIGHT_NATIVE_NAME = 'Light';

function getNativeModule(): AlternateAppIconsModule | null {
  return requireOptionalNativeModule<AlternateAppIconsModule>('ExpoAlternateAppIcons');
}

export function getPlatformDefaultAppIcon(): AppIconId {
  return 'dark';
}

export function canChangeAppIcon(): boolean {
  return Boolean(getNativeModule()?.supportsAlternateIcons);
}

export function readNativeAppIcon(): AppIconId | null {
  const name = getNativeModule()?.getAppIconName?.();
  if (name === LIGHT_NATIVE_NAME) {
    return 'light';
  }
  if (name === 'Dark') {
    return 'dark';
  }
  return null;
}

export function toNativeIconName(id: AppIconId): string | null {
  return id === 'light' ? LIGHT_NATIVE_NAME : null;
}

export async function applyAppIcon(id: AppIconId): Promise<void> {
  const native = getNativeModule();
  if (!native?.supportsAlternateIcons) {
    throw new Error('APP_ICON_UNAVAILABLE');
  }

  await native.setAlternateAppIcon(toNativeIconName(id));
}
