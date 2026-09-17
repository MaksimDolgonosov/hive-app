import { useQuery } from '@tanstack/react-query';

import * as campaignsApi from '@/src/api/campaigns';
import type { GeoPoint } from '@/src/types';
import { roundCoord } from '@/src/utils/geo';

const STALE_TIME_MS = 60_000;

export function useActiveCampaigns(coords: GeoPoint | null) {
  const lat = coords ? roundCoord(coords.lat) : null;
  const lng = coords ? roundCoord(coords.lng) : null;

  return useQuery({
    queryKey: ['campaigns', lat, lng],
    queryFn: () => campaignsApi.getActive({ lat: lat!, lng: lng! }),
    enabled: lat !== null && lng !== null,
    staleTime: STALE_TIME_MS,
  });
}
