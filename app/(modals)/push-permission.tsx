import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthButton } from '@/src/components/auth/AuthButton';
import { ScreenBackground } from '@/src/components/ui/ScreenBackground';
import { usePreferencesStore } from '@/src/stores/preferencesStore';
import { showInfoToast } from '@/src/stores/toastStore';
import { requestPushPermission } from '@/src/utils/push-device';

export default function PushPermissionScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const setPushExplainDismissed = usePreferencesStore((state) => state.setPushExplainDismissed);

  async function finish() {
    await setPushExplainDismissed(true);
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)' as Href);
  }

  async function allow() {
    if (loading) {
      return;
    }

    setLoading(true);
    try {
      const result = await requestPushPermission();
      if (result.status === 'dev-build-required' && Platform.OS === 'android') {
        showInfoToast({ message: t('push.devBuildRequired') });
      }
    } finally {
      setLoading(false);
      await finish();
    }
  }

  return (
    <ScreenBackground>
      <View
        className="flex-1 justify-end px-6"
        style={{ paddingBottom: insets.bottom + 24, paddingTop: insets.top + 24 }}
      >
        <Text className="font-display text-[28px] font-bold text-hive-foreground">
          {t('push.explainTitle')}
        </Text>
        <Text className="mt-3 font-inter text-[15px] text-hive-muted">
          {t('push.explainDescription')}
        </Text>

        <View className="mt-10 gap-3">
          <AuthButton
            loading={loading}
            title={t('push.allow')}
            onPress={() => void allow()}
            showArrow={false}
          />
          <Pressable
            accessibilityRole="button"
            className="h-12 items-center justify-center"
            onPress={() => void finish()}
          >
            <Text className="font-inter text-sm font-semibold text-hive-muted">
              {t('push.later')}
            </Text>
          </Pressable>
        </View>
      </View>
    </ScreenBackground>
  );
}
