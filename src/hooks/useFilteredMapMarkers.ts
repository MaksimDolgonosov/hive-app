import { useEffect, useMemo, useState } from 'react';

import type { Hive, MapFilter, PlaceSummary, Sting, StingsNearbyResponse } from '@/src/types';
import { isActiveHive } from '@/src/utils/hive';
import { isExpiringSting, isFreshSting } from '@/src/utils/sting-lifetime';

const TICK_MS = 60_000;

export function useFilteredMapMarkers(
  data: StingsNearbyResponse | undefined,
  filter: MapFilter,
): { stings: Sting[]; hives: Hive[]; places: PlaceSummary[] } {
  const needsTicker = filter === 'fresh' || filter === 'expiring';
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!needsTicker) {
      return undefined;
    }

    const timer = setInterval(() => {
      setNow(Date.now());
    }, TICK_MS);

    return () => clearInterval(timer);
  }, [needsTicker]);

  return useMemo(() => {
    const stings = data?.stings ?? [];
    const hives = data?.hives ?? [];
    const places = data?.places ?? [];

    switch (filter) {
      case 'hives':
        return { stings: [], hives: hives.filter((hive) => isActiveHive(hive)), places: [] };
      case 'fresh':
        return {
          stings: stings.filter((sting) => isFreshSting(sting, now)),
          hives: [],
          places: [],
        };
      case 'expiring':
        return {
          stings: stings.filter((sting) => isExpiringSting(sting, now)),
          hives: [],
          places: [],
        };
      default:
        return { stings, hives, places };
    }
  }, [data, filter, now]);
}
