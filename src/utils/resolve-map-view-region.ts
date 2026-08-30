import type { RefObject } from 'react';
import type MapView from 'react-native-maps';

import type { MapRegion } from '@/src/types';
import { USER_MAP_REGION_DELTA } from '@/src/utils/map';

type MapBoundary = {
  northEast: { latitude: number; longitude: number };
  southWest: { latitude: number; longitude: number };
};

type MapCamera = {
  center: { latitude: number; longitude: number };
  zoom?: number;
  altitude?: number;
};

type MapViewWithNativeReaders = {
  getMapBoundaries?: () => Promise<MapBoundary>;
  getCamera?: () => Promise<MapCamera>;
};

function boundsToRegion(bounds: MapBoundary): MapRegion {
  const latitude = (bounds.northEast.latitude + bounds.southWest.latitude) / 2;
  const longitude = (bounds.northEast.longitude + bounds.southWest.longitude) / 2;
  const latitudeDelta = Math.abs(bounds.northEast.latitude - bounds.southWest.latitude);
  const longitudeDelta = Math.abs(bounds.northEast.longitude - bounds.southWest.longitude);

  return {
    latitude,
    longitude,
    latitudeDelta: Math.max(latitudeDelta, 0.0005),
    longitudeDelta: Math.max(longitudeDelta, 0.0005),
  };
}

function zoomToLatitudeDelta(zoom: number): number {
  return 360 / 2 ** zoom;
}

export async function resolveMapViewRegion(
  mapRef: RefObject<MapView | null>,
  fallback: MapRegion | null,
): Promise<MapRegion | null> {
  const map = mapRef.current as MapViewWithNativeReaders | null;
  if (!map) {
    return fallback;
  }

  if (typeof map.getMapBoundaries === 'function') {
    try {
      const bounds = await map.getMapBoundaries();
      if (bounds?.northEast && bounds?.southWest) {
        return boundsToRegion(bounds);
      }
    } catch {
      // try next native reader
    }
  }

  if (typeof map.getCamera === 'function') {
    try {
      const camera = await map.getCamera();
      if (camera?.center) {
        const delta =
          camera.zoom != null
            ? zoomToLatitudeDelta(camera.zoom)
            : (fallback?.latitudeDelta ?? USER_MAP_REGION_DELTA);

        return {
          latitude: camera.center.latitude,
          longitude: camera.center.longitude,
          latitudeDelta: delta,
          longitudeDelta: delta,
        };
      }
    } catch {
      // fall through to JS snapshot
    }
  }

  return fallback;
}
