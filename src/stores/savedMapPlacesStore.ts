import * as Crypto from 'expo-crypto';
import { create } from 'zustand';

import {
  loadSavedMapPlaces,
  saveSavedMapPlaces,
} from '@/src/stores/saved-map-places-storage';
import type { MapRegion, SavedMapPlace } from '@/src/types';
import { SAVED_MAP_PLACES_MAX } from '@/src/types';

interface SavedMapPlacesState {
  places: SavedMapPlace[];
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  addPlace: (input: { name: string; region: MapRegion }) => Promise<SavedMapPlace | null>;
  removePlace: (id: string) => Promise<void>;
}

export const useSavedMapPlacesStore = create<SavedMapPlacesState>((set, get) => ({
  places: [],
  isHydrated: false,

  hydrate: async () => {
    const places = await loadSavedMapPlaces();
    set({ places, isHydrated: true });
  },

  addPlace: async ({ name, region }) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return null;
    }

    const currentPlaces = get().places;
    if (currentPlaces.length >= SAVED_MAP_PLACES_MAX) {
      return null;
    }

    const place: SavedMapPlace = {
      id: Crypto.randomUUID(),
      name: trimmedName,
      region,
      createdAt: new Date().toISOString(),
    };

    const nextPlaces = [place, ...currentPlaces];
    await saveSavedMapPlaces(nextPlaces);
    set({ places: nextPlaces });
    return place;
  },

  removePlace: async (id) => {
    const nextPlaces = get().places.filter((place) => place.id !== id);
    await saveSavedMapPlaces(nextPlaces);
    set({ places: nextPlaces });
  },
}));
