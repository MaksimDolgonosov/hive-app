import * as Location from 'expo-location';

export interface CaptureLocationFallback {
  lat: number;
  lng: number;
  accuracy?: number | null;
}

const CAPTURE_LOCATION_TIMEOUT_MS = 12_000;

function buildLocationFromFallback(fallback: CaptureLocationFallback): Location.LocationObject {
  return {
    coords: {
      latitude: fallback.lat,
      longitude: fallback.lng,
      altitude: null,
      accuracy: fallback.accuracy ?? 500,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    },
    timestamp: Date.now(),
  };
}

async function getCurrentPosition(
  accuracy: Location.LocationAccuracy,
): Promise<Location.LocationObject> {
  return Promise.race([
    Location.getCurrentPositionAsync({ accuracy }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Location timeout')), CAPTURE_LOCATION_TIMEOUT_MS),
    ),
  ]);
}

export async function resolveCaptureLocation(
  fallback?: CaptureLocationFallback,
): Promise<Location.LocationObject> {
  for (const accuracy of [Location.Accuracy.Balanced, Location.Accuracy.Low]) {
    try {
      return await getCurrentPosition(accuracy);
    } catch {
      // try next accuracy level
    }
  }

  const lastKnown = await Location.getLastKnownPositionAsync({
    maxAge: 600_000,
  });

  if (lastKnown) {
    return lastKnown;
  }

  if (fallback) {
    return buildLocationFromFallback(fallback);
  }

  throw new Error('Location unavailable');
}
