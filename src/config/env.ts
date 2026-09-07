import Constants from 'expo-constants';
import { Platform } from 'react-native';

type AppExtra = {
  apiUrl: string;
  wsUrl: string;
  googleWebClientId?: string;
  googleIosClientId?: string;
  googleAndroidClientId?: string;
  googleMapsApiKey?: string;
};

export type EnvConfig = AppExtra;

function readExtra(): Partial<AppExtra> | undefined {
  return (
    Constants.expoConfig?.extra ??
    (Constants.manifest2 as { extra?: Partial<AppExtra> } | null)?.extra ??
    (Constants.manifest as { extra?: Partial<AppExtra> } | null)?.extra
  );
}

/** Android-эмулятор не видит localhost хоста — только 10.0.2.2 */
function adaptUrlForPlatform(url: string): string {
  if (!__DEV__ || Platform.OS !== 'android') {
    return url;
  }

  return url.replace('://localhost', '://10.0.2.2').replace('://127.0.0.1', '://10.0.2.2');
}

function getExtra(): EnvConfig {
  const extra = readExtra();

  if (!extra?.apiUrl || !extra?.wsUrl) {
    throw new Error('API_URL and WS_URL must be defined in app.config.ts extra');
  }

  const apiUrl = adaptUrlForPlatform(extra.apiUrl);
  const wsUrl = adaptUrlForPlatform(extra.wsUrl);
  const googleWebClientId =
    extra.googleWebClientId ?? process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
  const googleIosClientId =
    extra.googleIosClientId ?? process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';
  const googleAndroidClientId =
    extra.googleAndroidClientId ?? process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '';

  const googleMapsApiKey = extra.googleMapsApiKey ?? process.env.GOOGLE_MAPS_API_KEY ?? '';

  if (__DEV__) {
    console.log('[env]', {
      apiUrl,
      wsUrl,
      platform: Platform.OS,
      googleConfigured: Boolean(googleWebClientId),
      googleMapsConfigured: Boolean(googleMapsApiKey),
    });
  }

  return {
    apiUrl,
    wsUrl,
    googleWebClientId,
    googleIosClientId,
    googleAndroidClientId,
    googleMapsApiKey,
  };
}

export const env = getExtra();

/**
 * Maps SDK on Android reads the key from the APK manifest, not from Metro/.env.
 * Enabled after GOOGLE_MAPS_API_KEY was added as an EAS project secret.
 */
const ANDROID_NATIVE_MAPS_KEY_EMBEDDED = true;

export function isGoogleMapsConfigured(): boolean {
  if (Platform.OS !== 'android') {
    return true;
  }

  return ANDROID_NATIVE_MAPS_KEY_EMBEDDED;
}
