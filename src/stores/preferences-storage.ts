import AsyncStorage from '@react-native-async-storage/async-storage';

const PUBLISH_BUZZ_STORAGE_KEY = '@hive/publishBuzzEnabled';

export async function loadPublishBuzzEnabled(): Promise<boolean | null> {
  const value = await AsyncStorage.getItem(PUBLISH_BUZZ_STORAGE_KEY);
  if (value === null) {
    return null;
  }

  return value === 'true';
}

export async function savePublishBuzzEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(PUBLISH_BUZZ_STORAGE_KEY, enabled ? 'true' : 'false');
}
