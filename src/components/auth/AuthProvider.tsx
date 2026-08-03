import { useEffect, type ReactNode } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useAuthStore } from '@/src/stores/authStore';

export function AuthProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
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
    return (
      <View className="flex-1 items-center justify-center bg-hive-bg">
        <ActivityIndicator color="#F5A623" size="large" />
        <Text className="mt-3 font-inter text-sm text-hive-muted">{t('common.loading')}</Text>
      </View>
    );
  }

  return children;
}
