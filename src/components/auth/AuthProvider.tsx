import { useEffect, type ReactNode } from 'react';
import { useRouter, useSegments } from 'expo-router';

import { LoadingScreen } from '@/src/components/ui/LoadingScreen';
import { useAuthStore } from '@/src/stores/authStore';

export function AuthProvider({ children }: { children: ReactNode }) {
  const status = useAuthStore((state) => state.status);
  const hydrateAuth = useAuthStore((state) => state.hydrate);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    void hydrateAuth();
  }, [hydrateAuth]);

  useEffect(() => {
    if (status === 'idle') {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';

    if (status === 'unauthenticated' && !inAuthGroup) {
      router.replace('/(auth)/login');
      return;
    }

    if (status === 'authenticated' && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [router, segments, status]);

  if (status === 'idle') {
    return <LoadingScreen />;
  }

  return children;
}
