import * as Location from 'expo-location';

const LAST_KNOWN_TIMEOUT_MS = 2_000;
const CURRENT_POSITION_TIMEOUT_MS = 5_000;
const RUSSIA_ISO_CODE = 'RU';
const RUSSIA_COUNTRY_NAMES = new Set(['russia', 'российская федерация', 'россия']);

type SessionCoords = {
  latitude: number;
  longitude: number;
};

let sessionResolved = false;
let resolveInFlight: Promise<void> | null = null;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Location request timed out')), ms);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export function isInstagramAllowedForCountry(
  isoCountryCode?: string | null,
  country?: string | null,
): boolean | null {
  if (isoCountryCode) {
    return isoCountryCode.toUpperCase() !== RUSSIA_ISO_CODE;
  }

  if (country) {
    return !RUSSIA_COUNTRY_NAMES.has(country.trim().toLowerCase());
  }

  return null;
}

export async function fetchSessionCoords(): Promise<SessionCoords | null> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== Location.PermissionStatus.GRANTED) {
      return null;
    }
  } catch {
    return null;
  }

  try {
    const lastKnown = await withTimeout(
      Location.getLastKnownPositionAsync({
        maxAge: 24 * 60 * 60 * 1000,
      }),
      LAST_KNOWN_TIMEOUT_MS,
    );

    if (lastKnown) {
      return {
        latitude: lastKnown.coords.latitude,
        longitude: lastKnown.coords.longitude,
      };
    }
  } catch {
    // try a fresh fix
  }

  try {
    const current = await withTimeout(
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Lowest,
      }),
      CURRENT_POSITION_TIMEOUT_MS,
    );

    return {
      latitude: current.coords.latitude,
      longitude: current.coords.longitude,
    };
  } catch {
    return null;
  }
}

export async function resolveInstagramAllowedFromCoords(
  latitude: number,
  longitude: number,
): Promise<boolean | null> {
  try {
    const places = await Location.reverseGeocodeAsync({ latitude, longitude });
    const place = places[0];

    if (!place) {
      return null;
    }

    return isInstagramAllowedForCountry(place.isoCountryCode, place.country);
  } catch {
    return null;
  }
}

export async function applyInstagramVisibilityFromCoords(
  latitude: number,
  longitude: number,
  persist: (allowed: boolean) => Promise<void>,
): Promise<void> {
  if (sessionResolved) {
    return;
  }

  if (resolveInFlight) {
    await resolveInFlight;

    if (sessionResolved) {
      return;
    }
  }

  const task = (async () => {
    const allowed = await resolveInstagramAllowedFromCoords(latitude, longitude);

    if (allowed === null) {
      return;
    }

    sessionResolved = true;
    await persist(allowed);
  })();

  resolveInFlight = task;

  try {
    await task;
  } finally {
    if (resolveInFlight === task) {
      resolveInFlight = null;
    }
  }
}
