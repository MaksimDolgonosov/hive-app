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

/** Не использовать как стартовую камеру: SDK карт часто шлёт этот кадр до GPS. */
export const DEFAULT_MAP_REGION: MapRegion = {
  latitude: 55.7558,
  longitude: 37.6173,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export const FEED_REGION_DELTA = 0.05;
export const USER_MAP_REGION_DELTA = 0.01;

export function isDefaultMapRegion(region: MapRegion): boolean {
  return (
    Math.abs(region.latitude - DEFAULT_MAP_REGION.latitude) < 0.0001 &&
    Math.abs(region.longitude - DEFAULT_MAP_REGION.longitude) < 0.0001
  );
}

export function coordsToFeedBounds(lat: number, lng: number): MapBounds {
  return regionToBounds({
    latitude: lat,
    longitude: lng,
    latitudeDelta: FEED_REGION_DELTA,
    longitudeDelta: FEED_REGION_DELTA,
  });
}

export function coordsToUserMapRegion(
  lat: number,
  lng: number,
  delta: number = USER_MAP_REGION_DELTA,
): MapRegion {
  return {
    latitude: lat,
    longitude: lng,
    latitudeDelta: delta,
    longitudeDelta: delta,
  };
}
