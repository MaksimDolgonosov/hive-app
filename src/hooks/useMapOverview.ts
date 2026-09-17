import { keepPreviousData, useQuery } from '@tanstack/react-query';

import * as mapApi from '@/src/api/map';
import type { MapBounds } from '@/src/types';
import { regionZoom } from '@/src/utils/map';

const STALE_TIME_MS = 60_000;

export function useMapOverview(
  bounds: MapBounds | null,
  latitudeDelta: number | null,
  enabled: boolean,
) {
  const zoom = latitudeDelta != null ? regionZoom(latitudeDelta) : 0;

  return useQuery({
    queryKey: bounds
      ? ['map-overview', bounds.swLat, bounds.swLng, bounds.neLat, bounds.neLng, zoom]
      : ['map-overview', 'idle'],
    queryFn: () => mapApi.getOverview(bounds!, zoom),
    enabled: enabled && bounds !== null,
    staleTime: STALE_TIME_MS,
    placeholderData: keepPreviousData,
  });
}
