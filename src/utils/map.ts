import type { MapBounds, MapRegion } from '@/src/types';

export function regionToBounds(region: MapRegion): MapBounds {
  const halfLat = region.latitudeDelta / 2;
  const halfLng = region.longitudeDelta / 2;

  return {
    swLat: region.latitude - halfLat,
    swLng: region.longitude - halfLng,
    neLat: region.latitude + halfLat,
    neLng: region.longitude + halfLng,
  };
}

export const DEFAULT_MAP_REGION: MapRegion = {
  latitude: 55.7558,
  longitude: 37.6173,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};
