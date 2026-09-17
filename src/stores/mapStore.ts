import { create } from 'zustand';

import { loadMapType, saveMapType } from '@/src/stores/map-type-storage';
import type { HiveMapType, MapRegion, UUID } from '@/src/types';

export interface MapFocusTarget {
  lat: number;
  lng: number;
  stingId: UUID | null;
  hiveId: UUID | null;
}

interface MapState {
  region: MapRegion | null;
  selectedStingId: UUID | null;
  pendingMapFocus: MapFocusTarget | null;
  pendingSavedRegion: MapRegion | null;
  mapType: HiveMapType;
  isMapTypeHydrated: boolean;
  setRegion: (region: MapRegion) => void;
  setSelectedStingId: (id: UUID | null) => void;
  requestMapFocus: (target: MapFocusTarget) => void;
  clearPendingMapFocus: () => void;
  requestSavedRegionFocus: (region: MapRegion) => void;
  clearPendingSavedRegion: () => void;
  hydrateMapType: () => Promise<void>;
  setMapType: (mapType: HiveMapType) => Promise<void>;
}

export const useMapStore = create<MapState>((set, get) => ({
  region: null,
  selectedStingId: null,
  pendingMapFocus: null,
  pendingSavedRegion: null,
  mapType: 'standard',
  isMapTypeHydrated: false,
  setRegion: (region) => set({ region }),
  setSelectedStingId: (selectedStingId) => set({ selectedStingId }),
  requestMapFocus: (pendingMapFocus) => set({ pendingMapFocus }),
  clearPendingMapFocus: () => set({ pendingMapFocus: null }),
  requestSavedRegionFocus: (pendingSavedRegion) =>
    set({ pendingSavedRegion, region: pendingSavedRegion }),
  clearPendingSavedRegion: () => set({ pendingSavedRegion: null }),
  hydrateMapType: async () => {
    if (get().isMapTypeHydrated) {
      return;
    }

    const mapType = await loadMapType();
    set({ mapType, isMapTypeHydrated: true });
  },
  setMapType: async (mapType) => {
    set({ mapType });
    await saveMapType(mapType);
  },
}));
