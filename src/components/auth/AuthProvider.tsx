import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { usePathname, useRouter, useSegments, type Href } from 'expo-router';

import { LoadingScreen } from '@/src/components/ui/LoadingScreen';
import { useWebSocketLifecycle } from '@/src/hooks/useWebSocketLifecycle';
import { useAuthStore } from '@/src/stores/authStore';
import { isGoogleOAuthCallbackPath } from '@/src/utils/google-oauth-path';

export function AuthProvider({ children }: { children: ReactNode }) {
  const status = useAuthStore((state) => state.status);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const hasCompletedOnboarding = useAuthStore((state) => state.hasCompletedOnboarding);
  const socialAuthPending = useAuthStore((state) => state.socialAuthPending);
  const setSocialAuthPending = useAuthStore((state) => state.setSocialAuthPending);
  const hydrateAuth = useAuthStore((state) => state.hydrate);
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();

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
    const inTabs = rootSegment === '(tabs)';
    const inModals = rootSegment === '(modals)';
    const isOAuthCallback = isGoogleOAuthCallbackPath(pathname);

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
      if (socialAuthPending || isOAuthCallback) {
        return;
      }
      router.replace('/(auth)/login');
      return;
    }

    if (status === 'authenticated') {
      if (!inTabs && !inModals) {
        router.replace('/(tabs)');
        return;
      }

      if (socialAuthPending) {
        setSocialAuthPending(false);
      }
    }
  }, [
    hasCompletedOnboarding,
    isHydrated,
    pathname,
    router,
    segments,
    setSocialAuthPending,
    socialAuthPending,
    status,
  ]);

  if (!isHydrated || status === 'idle') {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.root}>
      {children}
      {socialAuthPending ? (
        <View pointerEvents="auto" style={styles.handoffOverlay}>
          <LoadingScreen />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  handoffOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
});
