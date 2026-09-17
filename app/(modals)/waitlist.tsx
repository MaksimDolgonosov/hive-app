import { useState } from 'react';

import { WaitlistContent } from '@/src/components/growth/WaitlistContent';
import { HiveLoader } from '@/src/components/ui/HiveLoader';
import { ScreenBackground } from '@/src/components/ui/ScreenBackground';
import * as zonesApi from '@/src/api/zones';
import { useLocation } from '@/src/hooks/useLocation';
import { useZoneStatus } from '@/src/hooks/useZoneStatus';
import { useAuthStore } from '@/src/stores/authStore';
import { getApiErrorCode } from '@/src/utils/api-error';
import { trackEvent } from '@/src/utils/analytics-queue';
import { showApiErrorToast } from '@/src/utils/show-toast';

export default function WaitlistScreen() {
  const { coords } = useLocation();
  const user = useAuthStore((state) => state.user);
  const zoneQuery = useZoneStatus(coords ? { lat: coords.latitude, lng: coords.longitude } : null);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);

  const zone = zoneQuery.data;

  async function handleJoin() {
    if (!coords || joining) {
      return;
    }

    setJoining(true);
    try {
      await zonesApi.joinWaitlist({
        lat: coords.latitude,
        lng: coords.longitude,
        email: user?.email ?? undefined,
      });
      setJoined(true);
      trackEvent('waitlist_submitted', { zoneId: zone?.id });
    } catch (error) {
      if (getApiErrorCode(error) === 'WAITLIST_ALREADY_JOINED') {
        setJoined(true);
        return;
      }

      if (getApiErrorCode(error) === 'FEATURE_DISABLED') {
        return;
      }

      showApiErrorToast(error);
    } finally {
      setJoining(false);
    }
  }

  if (!zone) {
    return (
      <ScreenBackground className="items-center justify-center">
        <HiveLoader size="large" />
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <WaitlistContent
        joining={joining}
        joined={joined}
        zone={zone}
        onJoin={() => void handleJoin()}
      />
    </ScreenBackground>
  );
}
