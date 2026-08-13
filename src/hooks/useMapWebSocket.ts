import { useEffect } from 'react';

import { websocket } from '@/src/api/websocket';
import type { MapBounds } from '@/src/types';

export function useMapWebSocket(bounds: MapBounds | null): void {
  useEffect(() => {
    websocket.setRegionSubscription(bounds);

    return () => {
      websocket.setRegionSubscription(null);
    };
  }, [bounds?.swLat, bounds?.swLng, bounds?.neLat, bounds?.neLng]);
}
