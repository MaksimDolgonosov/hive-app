import { useQuery } from '@tanstack/react-query';

import * as stingsApi from '@/src/api/stings';
import type { GeoPoint } from '@/src/types';
import { roundCoord } from '@/src/utils/geo';

const STALE_TIME_MS = 60_000;

/** Ленивый запрос ближайшего жала — только когда видимая область пуста (§G3). */
export function useNearestSting(coords: GeoPoint | null, enabled: boolean) {
  const lat = coords ? roundCoord(coords.lat) : null;
  const lng = coords ? roundCoord(coords.lng) : null;

  return useQuery({
    queryKey: ['sting-nearest', lat, lng],
    queryFn: () => stingsApi.getNearest({ lat: lat!, lng: lng!, limit: 1 }),
    enabled: enabled && lat !== null && lng !== null,
    staleTime: STALE_TIME_MS,
  });
}
