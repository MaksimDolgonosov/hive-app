import AsyncStorage from '@react-native-async-storage/async-storage';

import type { HiveMapType } from '@/src/types';

const MAP_TYPE_STORAGE_KEY = '@hive/mapType';

export async function loadMapType(): Promise<HiveMapType> {
  const value = await AsyncStorage.getItem(MAP_TYPE_STORAGE_KEY);
  return value === 'satellite' ? 'satellite' : 'standard';
}

export async function saveMapType(mapType: HiveMapType): Promise<void> {
  await AsyncStorage.setItem(MAP_TYPE_STORAGE_KEY, mapType);
}
