import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';

const DEVICE_ID_KEY = '@hive/deviceId';

let cachedDeviceId: string | null = null;

/**
 * Стабильный идентификатор установки: нужен для регистрации push-устройства
 * (§G10) и для идентификации событий аналитики до авторизации (§G12).
 */
export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) {
    return cachedDeviceId;
  }

  const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (stored) {
    cachedDeviceId = stored;
    return stored;
  }

  const created = randomUUID();
  await AsyncStorage.setItem(DEVICE_ID_KEY, created);
  cachedDeviceId = created;

  return created;
}
