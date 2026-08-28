import { useEffect } from 'react';

import { loadLastKnownLocation } from '@/src/stores/last-location-storage';
import { useLocationStore } from '@/src/stores/locationStore';
import { useMapStore } from '@/src/stores/mapStore';
import { coordsToUserMapRegion } from '@/src/utils/map';

export function useHydrateLastKnownLocation(): void {
  useEffect(() => {
    void (async () => {
      const saved = await loadLastKnownLocation();
      if (!saved) {
        return;
      }

      const lastKnownCoords = {
        latitude: saved.lat,
        longitude: saved.lng,
      };

      useLocationStore.getState().setLastKnownCoords(lastKnownCoords);

      if (!useMapStore.getState().region) {
        useMapStore.getState().setRegion(coordsToUserMapRegion(saved.lat, saved.lng));
      }
    })();
  }, []);
}
