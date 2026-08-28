import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_KNOWN_LOCATION_KEY = '@hive/lastKnownLocation';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export type SavedLocation = {
  lat: number;
  lng: number;
  updatedAt: number;
};

export async function loadLastKnownLocation(): Promise<SavedLocation | null> {
  const raw = await AsyncStorage.getItem(LAST_KNOWN_LOCATION_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as SavedLocation;
    if (
      typeof parsed.lat !== 'number' ||
      typeof parsed.lng !== 'number' ||
      typeof parsed.updatedAt !== 'number'
    ) {
      return null;
    }

    if (Date.now() - parsed.updatedAt > MAX_AGE_MS) {
      await AsyncStorage.removeItem(LAST_KNOWN_LOCATION_KEY);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function saveLastKnownLocation(location: SavedLocation): Promise<void> {
  await AsyncStorage.setItem(LAST_KNOWN_LOCATION_KEY, JSON.stringify(location));
}
