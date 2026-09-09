import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import { Linking, Pressable, Text } from 'react-native';

import { LoadingScreen } from '@/src/components/ui/LoadingScreen';
import { ScreenBackground } from '@/src/components/ui/ScreenBackground';
import type { LocationStatus } from '@/src/hooks/useLocation';

type LocationAccessGateProps = {
  status: LocationStatus;
  deniedMessageKey?: 'map' | 'nearby';
  bottomInset?: number;
  onRequestPermission: () => void;
};

export function LocationAccessGate({
  status,
  deniedMessageKey = 'map',
  bottomInset = 0,
  onRequestPermission,
}: LocationAccessGateProps): ReactNode | null {
  const { t } = useTranslation();

  if (status === 'loading' || status === 'idle') {
    return <LoadingScreen bottomOffset={bottomInset} />;
  }

  if (status === 'undetermined') {
    return (
      <ScreenBackground
        className="items-center justify-center px-8"
        style={{ paddingBottom: bottomInset }}
      >
        <Text className="text-center font-inter text-lg font-semibold text-hive-foreground">
          {t('onboarding.locationTitle')}
        </Text>
        <Text className="mt-2 text-center font-inter text-sm text-hive-muted">
          {t('onboarding.locationDescription')}
        </Text>
        <Pressable
          accessibilityRole="button"
          className="mt-6 rounded-full bg-hive-primary px-6 py-3"
          onPress={onRequestPermission}
        >
          <Text className="font-inter text-base font-bold text-hive-on-accent">
            {t('onboarding.allowLocation')}
          </Text>
        </Pressable>
      </ScreenBackground>
    );
  }

  if (status === 'denied') {
    return (
      <ScreenBackground
        className="items-center justify-center px-8"
        style={{ paddingBottom: bottomInset }}
      >
        <Text className="text-center font-inter text-lg font-semibold text-hive-foreground">
          {t('map.locationDeniedTitle')}
        </Text>
        <Text className="mt-2 text-center font-inter text-sm text-hive-muted">
          {t(`${deniedMessageKey}.locationDeniedMessage`)}
        </Text>
        <Pressable
          accessibilityRole="button"
          className="mt-6 rounded-full bg-hive-primary px-6 py-3"
          onPress={() => void Linking.openSettings()}
        >
          <Text className="font-inter text-base font-bold text-hive-on-accent">{t('map.openSettings')}</Text>
        </Pressable>
      </ScreenBackground>
    );
  }

  return null;
}
