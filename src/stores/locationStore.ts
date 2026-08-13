import * as Location from 'expo-location';
import { create } from 'zustand';

import type { LocationStatus } from '@/src/hooks/useLocation';

interface LocationState {
  coords: Location.LocationObjectCoords | null;
  status: LocationStatus;
  setCoords: (coords: Location.LocationObjectCoords | null) => void;
  setStatus: (status: LocationStatus) => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  coords: null,
  status: 'idle',
  setCoords: (coords) => set({ coords }),
  setStatus: (status) => set({ status }),
}));
