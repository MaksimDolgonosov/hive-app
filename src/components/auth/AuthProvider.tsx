import { useEffect, type ReactNode } from 'react';
import { useRouter, useSegments, type Href } from 'expo-router';

import { LoadingScreen } from '@/src/components/ui/LoadingScreen';
import { useWebSocketLifecycle } from '@/src/hooks/useWebSocketLifecycle';
import { useAuthStore } from '@/src/stores/authStore';

export function AuthProvider({ children }: { children: ReactNode }) {
  const status = useAuthStore((state) => state.status);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const hasCompletedOnboarding = useAuthStore((state) => state.hasCompletedOnboarding);
  const hydrateAuth = useAuthStore((state) => state.hydrate);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    void hydrateAuth();
  }, [hydrateAuth]);

  useWebSocketLifecycle();

  useEffect(() => {
    if (!isHydrated || status === 'idle') {
      return;
    }

    const rootSegment = segments[0] as string | undefined;
    const inOnboardingGroup = rootSegment === '(onboarding)';
    const inAuthGroup = rootSegment === '(auth)';

    if (!hasCompletedOnboarding) {
      if (!inOnboardingGroup) {
        router.replace('/(onboarding)/welcome' as Href);
      }
      return;
    }

    if (inOnboardingGroup) {
      if (status === 'authenticated') {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
      return;
    }

    if (status === 'unauthenticated' && !inAuthGroup) {
      router.replace('/(auth)/login');
      return;
    }

    if (status === 'authenticated' && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [hasCompletedOnboarding, isHydrated, router, segments, status]);

  if (!isHydrated || status === 'idle') {
    return <LoadingScreen />;
  }

  return children;
}
