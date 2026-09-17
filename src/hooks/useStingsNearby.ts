import { keepPreviousData, useQuery } from '@tanstack/react-query';

import * as stingsApi from '@/src/api/stings';
import type { MapBounds } from '@/src/types';

const STALE_TIME_MS = 30_000;

// Соты (§G13) запрашиваются всегда: иначе их жала пропадут из stings[] и с карты.
const INCLUDE_SEEDS = true;

export type UseStingsNearbyOptions = {
  minResults?: number;
  includeEchoes?: boolean;
  enabled?: boolean;
};

function boundsQueryKey(bounds: MapBounds, minResults: number | undefined, includeEchoes: boolean) {
  // Префикс ['stings', …] обязателен для префиксного матчинга в stings-query-cache (WS).
  // minResults / includeEchoes / includeSeeds — в конце ключа (§G3/§G13).
  return [
    'stings',
    bounds.swLat,
    bounds.swLng,
    bounds.neLat,
    bounds.neLng,
    minResults ?? 0,
    includeEchoes,
    INCLUDE_SEEDS,
  ] as const;
}

export function useStingsNearby(bounds: MapBounds | null, options?: UseStingsNearbyOptions) {
  const minResults = options?.minResults;
  const includeEchoes = options?.includeEchoes ?? false;
  const extraEnabled = options?.enabled ?? true;

  return useQuery({
    queryKey: bounds ? boundsQueryKey(bounds, minResults, includeEchoes) : ['stings', 'idle'],
    queryFn: () =>
      stingsApi.getNearby(bounds!, {
        includeSeeds: INCLUDE_SEEDS,
        includeEchoes,
        minResults,
      }),
    enabled: bounds !== null && extraEnabled,
    staleTime: STALE_TIME_MS,
    placeholderData: keepPreviousData,
  });
}
