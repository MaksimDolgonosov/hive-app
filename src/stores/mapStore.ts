import { create } from 'zustand';

import { loadMapType, saveMapType } from '@/src/stores/map-type-storage';
import type { HiveMapType, MapFilter, MapRegion, UUID } from '@/src/types';

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
  mapFilter: MapFilter;
  pendingCampaignId: UUID | null;
  isMapTypeHydrated: boolean;
  setRegion: (region: MapRegion) => void;
  setSelectedStingId: (id: UUID | null) => void;
  requestMapFocus: (target: MapFocusTarget) => void;
  clearPendingMapFocus: () => void;
  requestSavedRegionFocus: (region: MapRegion) => void;
  clearPendingSavedRegion: () => void;
  setMapFilter: (filter: MapFilter) => void;
  setPendingCampaignId: (id: UUID | null) => void;
  hydrateMapType: () => Promise<void>;
  setMapType: (mapType: HiveMapType) => Promise<void>;
}

export const useMapStore = create<MapState>((set, get) => ({
  region: null,
  selectedStingId: null,
  pendingMapFocus: null,
  pendingSavedRegion: null,
  mapType: 'standard',
  mapFilter: 'all',
  pendingCampaignId: null,
  isMapTypeHydrated: false,
  setRegion: (region) => set({ region }),
  setSelectedStingId: (selectedStingId) => set({ selectedStingId }),
  requestMapFocus: (pendingMapFocus) => set({ pendingMapFocus }),
  clearPendingMapFocus: () => set({ pendingMapFocus: null }),
  requestSavedRegionFocus: (pendingSavedRegion) =>
    set({ pendingSavedRegion, region: pendingSavedRegion }),
  clearPendingSavedRegion: () => set({ pendingSavedRegion: null }),
  setMapFilter: (mapFilter) => set({ mapFilter }),
  setPendingCampaignId: (pendingCampaignId) => set({ pendingCampaignId }),
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
