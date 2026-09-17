import { useQuery } from '@tanstack/react-query';

import * as zonesApi from '@/src/api/zones';
import type { GeoPoint } from '@/src/types';
import { roundCoord } from '@/src/utils/geo';

const ZONE_STALE_TIME_MS = 5 * 60_000;

/**
 * Статус зоны и её фактический TTL (§G1). Координаты в ключе округляются,
 * иначе каждое дрожание GPS создаёт новую запись в кэше.
 */
export function useZoneStatus(coords: GeoPoint | null) {
  const lat = coords ? roundCoord(coords.lat) : null;
  const lng = coords ? roundCoord(coords.lng) : null;

  return useQuery({
    queryKey: ['zone', lat, lng],
    queryFn: () => zonesApi.getCurrentZone({ lat: lat!, lng: lng! }),
    enabled: lat !== null && lng !== null,
    staleTime: ZONE_STALE_TIME_MS,
  });
}
