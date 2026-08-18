import Constants from 'expo-constants';
import { Platform } from 'react-native';

type AppExtra = {
  apiUrl: string;
  wsUrl: string;
};

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

function getExtra(): AppExtra {
  const extra = readExtra();

  if (!extra?.apiUrl || !extra?.wsUrl) {
    throw new Error('API_URL and WS_URL must be defined in app.config.ts extra');
  }

  const apiUrl = adaptUrlForPlatform(extra.apiUrl);
  const wsUrl = adaptUrlForPlatform(extra.wsUrl);

  if (__DEV__) {
    console.log('[env]', { apiUrl, wsUrl, platform: Platform.OS });
  }

  return { apiUrl, wsUrl };
}

export const env = getExtra();
