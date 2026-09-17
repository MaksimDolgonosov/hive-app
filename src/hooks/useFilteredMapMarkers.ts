import { useEffect, useMemo, useState } from 'react';

import type { Hive, MapFilter, Sting, StingsNearbyResponse } from '@/src/types';
import { isActiveHive } from '@/src/utils/hive';
import { isExpiringSting, isFreshSting } from '@/src/utils/sting-lifetime';

const TICK_MS = 60_000;

export function useFilteredMapMarkers(
  data: StingsNearbyResponse | undefined,
  filter: MapFilter,
): { stings: Sting[]; hives: Hive[] } {
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

    switch (filter) {
      case 'hives':
        return { stings: [], hives: hives.filter((hive) => isActiveHive(hive)) };
      case 'fresh':
        return {
          stings: stings.filter((sting) => isFreshSting(sting, now)),
          hives: [],
        };
      case 'expiring':
        return {
          stings: stings.filter((sting) => isExpiringSting(sting, now)),
          hives: [],
        };
      default:
        return { stings, hives };
    }
  }, [data, filter, now]);
}
