import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';

import { saveLastKnownLocation } from '@/src/stores/last-location-storage';
import { useLocationStore } from '@/src/stores/locationStore';

export type LocationStatus = 'idle' | 'loading' | 'granted' | 'denied' | 'undetermined';

const LOW_ACCURACY_THRESHOLD_M = 50;
const SAVE_LOCATION_DEBOUNCE_MS = 5_000;
const SAVE_LOCATION_MAX_ACCURACY_M = 200;

function shouldPersistCoords(coords: Location.LocationObjectCoords): boolean {
  if (coords.accuracy == null || !Number.isFinite(coords.accuracy)) {
    return true;
  }

  return coords.accuracy <= SAVE_LOCATION_MAX_ACCURACY_M;
}

export function useLocation() {
  const [coords, setCoords] = useState<Location.LocationObjectCoords | null>(null);
  const [status, setStatus] = useState<LocationStatus>('idle');
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setStoredCoords = useLocationStore((state) => state.setCoords);
  const setStoredStatus = useLocationStore((state) => state.setStatus);
  const setLastKnownCoords = useLocationStore((state) => state.setLastKnownCoords);

  const syncStatus = useCallback(
    (nextStatus: LocationStatus) => {
      setStatus(nextStatus);
      setStoredStatus(nextStatus);
    },
    [setStoredStatus],
  );

  const persistCoords = useCallback(
    (nextCoords: Location.LocationObjectCoords) => {
      if (!shouldPersistCoords(nextCoords)) {
        return;
      }

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(() => {
        saveTimerRef.current = null;
        const snapshot = {
          latitude: nextCoords.latitude,
          longitude: nextCoords.longitude,
        };
        setLastKnownCoords(snapshot);
        void saveLastKnownLocation({
          lat: nextCoords.latitude,
          lng: nextCoords.longitude,
          updatedAt: Date.now(),
        });
      }, SAVE_LOCATION_DEBOUNCE_MS);
    },
    [setLastKnownCoords],
  );

  const syncCoords = useCallback(
    (nextCoords: Location.LocationObjectCoords | null) => {
      setCoords(nextCoords);
      setStoredCoords(nextCoords);

      if (nextCoords) {
        persistCoords(nextCoords);
      }
    },
    [persistCoords, setStoredCoords],
  );

  const stopWatching = useCallback(() => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
  }, []);

  const startWatching = useCallback(async () => {
    stopWatching();
    syncStatus('granted');

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      syncCoords(location.coords);
    } catch {
      // watchPositionAsync may still deliver a fix
    }

    subscriptionRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 10,
      },
      (location) => {
        syncCoords(location.coords);
      },
    );
  }, [stopWatching, syncCoords, syncStatus]);

  const requestPermission = useCallback(async () => {
    syncStatus('loading');

    const { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
    if (permissionStatus !== Location.PermissionStatus.GRANTED) {
      syncStatus('denied');
      syncCoords(null);
      return;
    }

    await startWatching();
  }, [startWatching, syncCoords, syncStatus]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      syncStatus('loading');

      const { status: permissionStatus } = await Location.getForegroundPermissionsAsync();
      if (cancelled) {
        return;
      }

      if (permissionStatus === Location.PermissionStatus.GRANTED) {
        await startWatching();
        return;
      }

      stopWatching();
      syncCoords(null);

      if (permissionStatus === Location.PermissionStatus.DENIED) {
        syncStatus('denied');
        return;
      }

      syncStatus('undetermined');
    }

    void init();

    return () => {
      cancelled = true;
      stopWatching();

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [startWatching, stopWatching, syncCoords, syncStatus]);

  const accuracy = coords?.accuracy ?? null;
  const isLowAccuracy = accuracy !== null && accuracy > LOW_ACCURACY_THRESHOLD_M;

  return { coords, accuracy, status, isLowAccuracy, requestPermission };
}
