import AsyncStorage from '@react-native-async-storage/async-storage';

import type { SavedMapPlace } from '@/src/types';

const SAVED_MAP_PLACES_KEY = '@hive/savedMapPlaces';

export async function loadSavedMapPlaces(): Promise<SavedMapPlace[]> {
  const raw = await AsyncStorage.getItem(SAVED_MAP_PLACES_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isSavedMapPlace);
  } catch {
    return [];
  }
}

export async function saveSavedMapPlaces(places: SavedMapPlace[]): Promise<void> {
  await AsyncStorage.setItem(SAVED_MAP_PLACES_KEY, JSON.stringify(places));
}

function isSavedMapPlace(value: unknown): value is SavedMapPlace {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const place = value as Partial<SavedMapPlace>;
  const region = place.region;

  return (
    typeof place.id === 'string' &&
    typeof place.name === 'string' &&
    typeof place.createdAt === 'string' &&
    region !== null &&
    typeof region === 'object' &&
    typeof region.latitude === 'number' &&
    typeof region.longitude === 'number' &&
    typeof region.latitudeDelta === 'number' &&
    typeof region.longitudeDelta === 'number'
  );
}
