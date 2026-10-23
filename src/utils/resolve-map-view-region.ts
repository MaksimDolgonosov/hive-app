import type { RefObject } from 'react';
import type { YandexMapViewRef } from 'expo-yandex-mapkit';

import type { MapRegion } from '@/src/types';
import { visibleRegionToMapRegion } from '@/src/utils/map';

export async function resolveMapViewRegion(
  mapRef: RefObject<YandexMapViewRef | null>,
  fallback: MapRegion | null,
): Promise<MapRegion | null> {
  const map = mapRef.current;
  if (!map) {
    return fallback;
  }

  try {
    const [region, camera] = await Promise.all([map.getVisibleRegion(), map.getCameraPosition()]);
    if (region && camera) {
      return visibleRegionToMapRegion(camera, [
        region.topLeft,
        region.topRight,
        region.bottomLeft,
        region.bottomRight,
      ]);
    }
  } catch {
    // fall through to the last JS snapshot
  }

  return fallback;
}
