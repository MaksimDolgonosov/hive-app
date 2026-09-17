import Constants from 'expo-constants';
import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

import * as devicesApi from '@/src/api/devices';
import i18n from '@/src/i18n';
import { isCameraRoute } from '@/src/utils/current-route';
import { getDeviceId } from '@/src/utils/device-id';

const ANDROID_CHANNEL_ID = 'default';

type DeviceModule = typeof import('expo-device');
type NotificationsModule = typeof import('expo-notifications');

export type PushNatives = {
  Device: DeviceModule;
  Notifications: NotificationsModule;
};

let nativesPromise: Promise<PushNatives | null> | null = null;
let handlerInstalled = false;

/**
 * Native-модули пушей нет в старых бинарниках и на web.
 * Не импортируем их на верхнем уровне — иначе падает auth (§G10).
 */
export function getPushNatives(): Promise<PushNatives | null> {
  if (!nativesPromise) {
    nativesPromise = loadPushNatives();
  }

  return nativesPromise;
}

async function loadPushNatives(): Promise<PushNatives | null> {
  if (!requireOptionalNativeModule('ExpoDevice')) {
    return null;
  }

  try {
    const [Device, Notifications] = await Promise.all([
      import('expo-device'),
      import('expo-notifications'),
    ]);
    installNotificationHandler(Notifications);
    return { Device, Notifications };
  } catch {
    return null;
  }
}

function installNotificationHandler(Notifications: NotificationsModule): void {
  if (handlerInstalled) {
    return;
  }

  handlerInstalled = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => {
      const allowBanner = !isCameraRoute();

      return {
        shouldShowBanner: allowBanner,
        shouldShowList: true,
        shouldPlaySound: allowBanner,
        shouldSetBadge: false,
      };
    },
  });
}

function getProjectId(): string | undefined {
  return Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
}

async function ensureAndroidChannel(Notifications: NotificationsModule): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Hive',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FFB800',
  });
}

export type PushRegistrationResult =
  | { status: 'registered' }
  | { status: 'simulator' }
  | { status: 'denied' }
  | { status: 'undetermined' }
  | { status: 'dev-build-required' };

export type PushPermissionStatus = 'granted' | 'denied' | 'undetermined';

/** Выполняет регистрацию токена. Не решает, когда спрашивать разрешение (§G10). */
export async function registerPushDevice(): Promise<PushRegistrationResult> {
  const push = await getPushNatives();
  if (!push) {
    return { status: 'dev-build-required' };
  }

  if (!push.Device.isDevice) {
    return { status: 'simulator' };
  }

  try {
    await ensureAndroidChannel(push.Notifications);

    const current = await push.Notifications.getPermissionsAsync();
    if (current.status !== 'granted') {
      return { status: current.status === 'denied' ? 'denied' : 'undetermined' };
    }

    const projectId = getProjectId();
    const token = await push.Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );

    const deviceId = await getDeviceId();
    await devicesApi.registerDevice({
      expoPushToken: token.data,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
      deviceId,
      locale: i18n.language === 'en' ? 'en' : 'ru',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    return { status: 'registered' };
  } catch {
    return { status: 'dev-build-required' };
  }
}

export async function requestPushPermission(): Promise<PushRegistrationResult> {
  const push = await getPushNatives();
  if (!push) {
    return { status: 'dev-build-required' };
  }

  if (!push.Device.isDevice) {
    return { status: 'simulator' };
  }

  try {
    await ensureAndroidChannel(push.Notifications);
    const current = await push.Notifications.getPermissionsAsync();
    if (current.status !== 'granted') {
      const requested = await push.Notifications.requestPermissionsAsync();
      if (requested.status !== 'granted') {
        return { status: requested.status === 'denied' ? 'denied' : 'undetermined' };
      }
    }

    return registerPushDevice();
  } catch {
    return { status: 'dev-build-required' };
  }
}

export async function unregisterPushDevice(): Promise<void> {
  try {
    const deviceId = await getDeviceId();
    await devicesApi.unregisterDevice(deviceId);
  } catch {
    // Logout must continue even if the server is unreachable.
  }
}

export async function getPushPermissionStatus(): Promise<PushPermissionStatus> {
  const push = await getPushNatives();
  if (!push) {
    return 'undetermined';
  }

  try {
    const current = await push.Notifications.getPermissionsAsync();
    if (current.status === 'granted' || current.status === 'denied') {
      return current.status;
    }

    return 'undetermined';
  } catch {
    return 'undetermined';
  }
}
