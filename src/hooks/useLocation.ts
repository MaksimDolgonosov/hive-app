import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

export type LocationStatus = 'idle' | 'loading' | 'granted' | 'denied';

const LOW_ACCURACY_THRESHOLD_M = 50;

export function useLocation() {
  const [coords, setCoords] = useState<Location.LocationObjectCoords | null>(null);
  const [status, setStatus] = useState<LocationStatus>('idle');

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;

    async function init() {
      setStatus('loading');

      const { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) {
        return;
      }

      if (permissionStatus !== Location.PermissionStatus.GRANTED) {
        setStatus('denied');
        return;
      }

      setStatus('granted');

      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!cancelled) {
          setCoords(location.coords);
        }
      } catch {
        // watchPositionAsync may still deliver a fix
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 10,
        },
        (location) => {
          if (!cancelled) {
            setCoords(location.coords);
          }
        },
      );
    }

    void init();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, []);

  const accuracy = coords?.accuracy ?? null;
  const isLowAccuracy = accuracy !== null && accuracy > LOW_ACCURACY_THRESHOLD_M;

  return { coords, accuracy, status, isLowAccuracy };
}
