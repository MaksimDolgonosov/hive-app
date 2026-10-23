import { useCallback, useEffect, useRef, useState } from 'react';

const SNAPSHOT_SETTLE_MS = 400;

/**
 * Держим tracksViewChanges, пока иконка маркера дорисуется, затем выключаем.
 * Иначе MapKit переснимает пин на каждый кадр.
 */
export function useMapMarkerTracking(resetKey: string | number) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleSettle = useCallback(() => {
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current);
    }

    setTracksViewChanges(true);
    settleTimerRef.current = setTimeout(() => {
      setTracksViewChanges(false);
      settleTimerRef.current = null;
    }, SNAPSHOT_SETTLE_MS);
  }, []);

  useEffect(() => {
    scheduleSettle();
    return () => {
      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current);
      }
    };
  }, [resetKey, scheduleSettle]);

  return {
    tracksViewChanges,
    handleLayout: scheduleSettle,
  };
}
