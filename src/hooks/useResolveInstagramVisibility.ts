import { useEffect } from 'react';

import { useAuthStore } from '@/src/stores/authStore';
import { useLocationStore } from '@/src/stores/locationStore';
import { usePreferencesStore } from '@/src/stores/preferencesStore';
import {
  applyInstagramVisibilityFromCoords,
  fetchSessionCoords,
} from '@/src/utils/instagram-visibility';

export function useResolveInstagramVisibility(): void {
  const liveCoords = useLocationStore((state) => state.coords);
  const locationStatus = useLocationStore((state) => state.status);
  const hasCompletedOnboarding = useAuthStore((state) => state.hasCompletedOnboarding);
  const setInstagramLinksAllowed = usePreferencesStore((state) => state.setInstagramLinksAllowed);

  useEffect(() => {
    void (async () => {
      const coords = await fetchSessionCoords();
      if (!coords) {
        return;
      }

      await applyInstagramVisibilityFromCoords(
        coords.latitude,
        coords.longitude,
        setInstagramLinksAllowed,
      );
    })();
  }, [hasCompletedOnboarding, locationStatus, setInstagramLinksAllowed]);

  useEffect(() => {
    if (!liveCoords) {
      return;
    }

    void applyInstagramVisibilityFromCoords(
      liveCoords.latitude,
      liveCoords.longitude,
      setInstagramLinksAllowed,
    );
  }, [liveCoords, setInstagramLinksAllowed]);
}
