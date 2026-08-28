import { useSegments } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';

import { useMapWebSocket } from '@/src/hooks/useMapWebSocket';
import { useLocationStore } from '@/src/stores/locationStore';
import { useMapStore } from '@/src/stores/mapStore';
import type { MapBounds, MapRegion } from '@/src/types';
import { coordsToFeedBounds, regionToBounds } from '@/src/utils/map';

const REGION_DEBOUNCE_MS = 300;

type ActiveTab = 'map' | 'nearby' | 'profile' | null;

function getActiveTab(segments: string[]): ActiveTab {
  const tabsIndex = segments.indexOf('(tabs)');
  if (tabsIndex === -1) {
    return null;
  }

  const screen = segments[tabsIndex + 1];

  if (screen === 'nearby') {
    return 'nearby';
  }

  if (screen === 'profile') {
    return 'profile';
  }

  if (screen === 'index' || screen === undefined) {
    return 'map';
  }

  return null;
}

function useDebouncedMapBounds(region: MapRegion | null): MapBounds | null {
  const [debouncedBounds, setDebouncedBounds] = useState<MapBounds | null>(null);

  useEffect(() => {
    if (!region) {
      setDebouncedBounds(null);
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedBounds(regionToBounds(region));
    }, REGION_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [region]);

  return debouncedBounds;
}

function useNearbyBounds(): MapBounds | null {
  const region = useMapStore((state) => state.region);
  const coords = useLocationStore((state) => state.coords);
  const lastKnownCoords = useLocationStore((state) => state.lastKnownCoords);
  const locationStatus = useLocationStore((state) => state.status);

  return useMemo(() => {
    if (locationStatus !== 'granted') {
      return null;
    }

    if (region) {
      return regionToBounds(region);
    }

    const effectiveCoords = coords ?? lastKnownCoords;
    if (effectiveCoords) {
      return coordsToFeedBounds(effectiveCoords.latitude, effectiveCoords.longitude);
    }

    return null;
  }, [coords, lastKnownCoords, locationStatus, region]);
}

export function useTabsRegionSubscription(): void {
  const segments = useSegments();
  const region = useMapStore((state) => state.region);
  const debouncedMapBounds = useDebouncedMapBounds(region);
  const nearbyBounds = useNearbyBounds();

  const activeTab = useMemo(() => getActiveTab(segments as string[]), [segments]);

  const subscriptionBounds = useMemo(() => {
    if (activeTab === 'map') {
      return debouncedMapBounds;
    }

    if (activeTab === 'nearby') {
      return nearbyBounds;
    }

    return null;
  }, [activeTab, debouncedMapBounds, nearbyBounds]);

  useMapWebSocket(subscriptionBounds);
}
