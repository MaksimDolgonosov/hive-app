import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { usePathname, useRouter, useSegments, type Href } from 'expo-router';

import { LoadingScreen } from '@/src/components/ui/LoadingScreen';
import { useProfileOverview } from '@/src/hooks/useProfileOverview';
import { usePushNotificationRouting } from '@/src/hooks/usePushNotificationRouting';
import { usePushNotifications } from '@/src/hooks/usePushNotifications';
import { useResolveInstagramVisibility } from '@/src/hooks/useResolveInstagramVisibility';
import { useWebSocketLifecycle } from '@/src/hooks/useWebSocketLifecycle';
import { useAuthStore } from '@/src/stores/authStore';
import { usePreferencesStore } from '@/src/stores/preferencesStore';
import { setCurrentRoutePath } from '@/src/utils/current-route';
import { isGoogleOAuthCallbackPath } from '@/src/utils/google-oauth-path';
import { getPushPermissionStatus } from '@/src/utils/push-device';

export function AuthProvider({ children }: { children: ReactNode }) {
  const status = useAuthStore((state) => state.status);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const hasCompletedOnboarding = useAuthStore((state) => state.hasCompletedOnboarding);
  const socialAuthPending = useAuthStore((state) => state.socialAuthPending);
  const setSocialAuthPending = useAuthStore((state) => state.setSocialAuthPending);
  const hydrateAuth = useAuthStore((state) => state.hydrate);
  const hasPublishedFirstSting = usePreferencesStore((state) => state.hasPublishedFirstSting);
  const setHasPublishedFirstSting = usePreferencesStore((state) => state.setHasPublishedFirstSting);
  const pushExplainDismissed = usePreferencesStore((state) => state.pushExplainDismissed);
  const pendingPushExplain = usePreferencesStore((state) => state.pendingPushExplain);
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();
  const profileOverview = useProfileOverview(status === 'authenticated');

  useEffect(() => {
    void hydrateAuth();
  }, [hydrateAuth]);

  useEffect(() => {
    setCurrentRoutePath(pathname);
  }, [pathname]);

  useWebSocketLifecycle();
  usePushNotifications();
  usePushNotificationRouting(status === 'authenticated');
  useResolveInstagramVisibility();

  useEffect(() => {
    if (status !== 'authenticated' || hasPublishedFirstSting) {
      return;
    }

    if ((profileOverview.data?.stats.photos ?? 0) > 0) {
      void setHasPublishedFirstSting(true);
    }
  }, [
    hasPublishedFirstSting,
    profileOverview.data?.stats.photos,
    setHasPublishedFirstSting,
    status,
  ]);

  useEffect(() => {
    if (!isHydrated || status === 'idle') {
      return;
    }

    const rootSegment = segments[0] as string | undefined;
    const inOnboardingGroup = rootSegment === '(onboarding)';
    const inAuthGroup = rootSegment === '(auth)';
    const inTabs = rootSegment === '(tabs)';
    const inModals = rootSegment === '(modals)';
    const inSettings = rootSegment === 'settings';
    const isOAuthCallback = isGoogleOAuthCallbackPath(pathname);

    if (!hasCompletedOnboarding) {
      if (!inOnboardingGroup) {
        router.replace('/(onboarding)/welcome' as Href);
      }
      return;
    }

    if (inOnboardingGroup) {
      if (status === 'authenticated') {
        return;
      }

      router.replace('/(auth)/login');
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
      if (!inTabs && !inModals && !inSettings) {
        router.replace('/(tabs)');
        return;
      }

      if (socialAuthPending) {
        setSocialAuthPending(false);
      }

      if (!hasPublishedFirstSting && inTabs) {
        if (profileOverview.isLoading) {
          return;
        }

        if ((profileOverview.data?.stats.photos ?? 0) > 0) {
          return;
        }

        router.replace('/(modals)/first-capture' as Href);
        return;
      }

      if (pendingPushExplain && !pushExplainDismissed && inTabs) {
        void getPushPermissionStatus().then((permission) => {
          if (permission === 'undetermined') {
            router.push('/(modals)/push-permission' as Href);
          }
        });
      }
    }
  }, [
    hasCompletedOnboarding,
    hasPublishedFirstSting,
    isHydrated,
    pathname,
    profileOverview.data?.stats.photos,
    profileOverview.isLoading,
    pendingPushExplain,
    pushExplainDismissed,
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
