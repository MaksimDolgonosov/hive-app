import { keepPreviousData, useQuery } from '@tanstack/react-query';

import * as stingsApi from '@/src/api/stings';
import type { MapBounds } from '@/src/types';

const STALE_TIME_MS = 30_000;

// Соты (§G13) запрашиваются всегда: иначе их жала пропадут из stings[] и с карты.
const INCLUDE_SEEDS = true;

function boundsQueryKey(bounds: MapBounds) {
  // Префикс ['stings', …] обязателен для префиксного матчинга в stings-query-cache (WS).
  // includeSeeds — в конце ключа (§G3/§G13).
  return ['stings', bounds.swLat, bounds.swLng, bounds.neLat, bounds.neLng, INCLUDE_SEEDS] as const;
}

export function useStingsNearby(bounds: MapBounds | null) {
  return useQuery({
    queryKey: bounds ? boundsQueryKey(bounds) : ['stings', 'idle'],
    queryFn: () => stingsApi.getNearby(bounds!, { includeSeeds: INCLUDE_SEEDS }),
    enabled: bounds !== null,
    staleTime: STALE_TIME_MS,
    placeholderData: keepPreviousData,
  });
}
