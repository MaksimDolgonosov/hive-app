import { create } from 'zustand';

import type { LocationStatus } from '@/src/hooks/useLocation';

export type LastKnownCoords = {
  latitude: number;
  longitude: number;
};

interface LocationState {
  coords: import('expo-location').LocationObjectCoords | null;
  lastKnownCoords: LastKnownCoords | null;
  status: LocationStatus;
  setCoords: (coords: import('expo-location').LocationObjectCoords | null) => void;
  setLastKnownCoords: (coords: LastKnownCoords | null) => void;
  setStatus: (status: LocationStatus) => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  coords: null,
  lastKnownCoords: null,
  status: 'idle',
  setCoords: (coords) => set({ coords }),
  setLastKnownCoords: (lastKnownCoords) => set({ lastKnownCoords }),
  setStatus: (status) => set({ status }),
}));
