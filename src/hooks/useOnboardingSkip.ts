import { router, type Href, useSegments } from 'expo-router';
import { useCallback } from 'react';

import { useAuthStore } from '@/src/stores/authStore';

type OnboardingSegment =
  | 'welcome'
  | 'step1'
  | 'step2'
  | 'step3'
  | 'location-permission'
  | 'camera-permission';

function getOnboardingSegment(segments: string[]): OnboardingSegment | null {
  const onboardingIndex = segments.indexOf('(onboarding)');
  if (onboardingIndex === -1) {
    return null;
  }

  const screen = segments[onboardingIndex + 1];
  if (
    screen === 'welcome' ||
    screen === 'step1' ||
    screen === 'step2' ||
    screen === 'step3' ||
    screen === 'location-permission' ||
    screen === 'camera-permission'
  ) {
    return screen;
  }

  return null;
}

export function useOnboardingSkip() {
  const completeOnboarding = useAuthStore((state) => state.completeOnboarding);
  const segments = useSegments();

  return useCallback(async () => {
    const screen = getOnboardingSegment(segments as string[]);

    if (screen === 'camera-permission') {
      await completeOnboarding();
      router.replace('/(auth)/login' as Href);
      return;
    }

    if (screen === 'location-permission') {
      router.replace('/(onboarding)/camera-permission' as Href);
      return;
    }

    router.replace('/(onboarding)/location-permission' as Href);
  }, [completeOnboarding, segments]);
}
