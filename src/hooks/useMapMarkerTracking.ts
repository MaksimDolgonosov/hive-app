import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

const IOS_SNAPSHOT_SETTLE_MS = 400;

/**
 * iOS: отключаем tracksViewChanges после layout для производительности.
 * Android + Expo Go + New Architecture: bitmap обрезается, если выключить раньше времени —
 * на Android всегда держим true (маркеров ульев немного).
 */
export function useMapMarkerTracking(resetKey: string | number) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleIosSettle = useCallback(() => {
    if (Platform.OS === 'android') {
      return;
    }

    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current);
    }

    setTracksViewChanges(true);
    settleTimerRef.current = setTimeout(() => {
      setTracksViewChanges(false);
      settleTimerRef.current = null;
    }, IOS_SNAPSHOT_SETTLE_MS);
  }, []);

  useEffect(() => {
    if (Platform.OS === 'android') {
      setTracksViewChanges(true);
      return undefined;
    }

    scheduleIosSettle();
    return () => {
      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current);
      }
    };
  }, [resetKey, scheduleIosSettle]);

  return {
    tracksViewChanges: Platform.OS === 'android' ? true : tracksViewChanges,
    handleLayout: Platform.OS === 'android' ? undefined : scheduleIosSettle,
  };
}
