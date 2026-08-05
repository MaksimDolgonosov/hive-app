import { useQuery } from '@tanstack/react-query';

import * as stingsApi from '@/src/api/stings';
import type { MapBounds } from '@/src/types';

const STALE_TIME_MS = 30_000;

function boundsQueryKey(bounds: MapBounds) {
  return ['stings', bounds.swLat, bounds.swLng, bounds.neLat, bounds.neLng] as const;
}

export function useStingsNearby(bounds: MapBounds | null) {
  return useQuery({
    queryKey: bounds ? boundsQueryKey(bounds) : ['stings', 'idle'],
    queryFn: () => stingsApi.getNearby(bounds!),
    enabled: bounds !== null,
    staleTime: STALE_TIME_MS,
  });
}
