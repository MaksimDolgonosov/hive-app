import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthButton } from '@/src/components/auth/AuthButton';
import { ScreenBackground } from '@/src/components/ui/ScreenBackground';
import { useLocation } from '@/src/hooks/useLocation';
import { useZoneStatus } from '@/src/hooks/useZoneStatus';
import { usePreferencesStore } from '@/src/stores/preferencesStore';
import { formatTtl } from '@/src/utils/ttl';

export default function FirstCaptureScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { coords } = useLocation();
  const zone = useZoneStatus(coords ? { lat: coords.latitude, lng: coords.longitude } : null);
  const setHasPublishedFirstSting = usePreferencesStore((state) => state.setHasPublishedFirstSting);

  async function dismiss() {
    await setHasPublishedFirstSting(true);
    router.replace('/(tabs)' as Href);
  }

  async function openCamera() {
    await setHasPublishedFirstSting(true);
    router.replace('/(modals)/camera' as Href);
  }

  return (
    <ScreenBackground>
      <View
        className="flex-1 justify-end px-6"
        style={{ paddingBottom: insets.bottom + 24, paddingTop: insets.top + 24 }}
      >
        <Text className="font-display text-[28px] font-bold text-hive-foreground">
          {t('growth.firstCaptureTitle')}
        </Text>
        <Text className="mt-3 font-inter text-[15px] text-hive-muted">
          {t('growth.firstCaptureDescription')}
        </Text>
        <Text className="mt-4 font-inter text-sm font-semibold text-hive-primary">
          {zone.data
            ? t('growth.firstCaptureTtl', { ttl: formatTtl(zone.data.ttlSec) })
            : t('growth.emptyTtlPending')}
        </Text>

        <View className="mt-10 gap-3">
          <AuthButton title={t('growth.firstCaptureAction')} onPress={() => void openCamera()} />
          <Pressable
            accessibilityRole="button"
            className="h-12 items-center justify-center"
            onPress={() => void dismiss()}
          >
            <Text className="font-inter text-sm font-semibold text-hive-muted">
              {t('growth.firstCaptureLater')}
            </Text>
          </Pressable>
        </View>
      </View>
    </ScreenBackground>
  );
}
