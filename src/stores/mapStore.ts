import { create } from 'zustand';

import type { MapRegion, UUID } from '@/src/types';

export interface MapFocusTarget {
  lat: number;
  lng: number;
  stingId: UUID | null;
  hiveId: UUID | null;
}

interface MapState {
  region: MapRegion | null;
  selectedStingId: UUID | null;
  selectedHiveId: UUID | null;
  pendingMapFocus: MapFocusTarget | null;
  pendingSavedRegion: MapRegion | null;
  setRegion: (region: MapRegion) => void;
  setSelectedStingId: (id: UUID | null) => void;
  setSelectedHiveId: (id: UUID | null) => void;
  requestMapFocus: (target: MapFocusTarget) => void;
  clearPendingMapFocus: () => void;
  requestSavedRegionFocus: (region: MapRegion) => void;
  clearPendingSavedRegion: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  region: null,
  selectedStingId: null,
  selectedHiveId: null,
  pendingMapFocus: null,
  pendingSavedRegion: null,
  setRegion: (region) => set({ region }),
  setSelectedStingId: (selectedStingId) => set({ selectedStingId }),
  setSelectedHiveId: (selectedHiveId) => set({ selectedHiveId }),
  requestMapFocus: (pendingMapFocus) => set({ pendingMapFocus }),
  clearPendingMapFocus: () => set({ pendingMapFocus: null }),
  requestSavedRegionFocus: (pendingSavedRegion) =>
    set({ pendingSavedRegion, region: pendingSavedRegion }),
  clearPendingSavedRegion: () => set({ pendingSavedRegion: null }),
}));
