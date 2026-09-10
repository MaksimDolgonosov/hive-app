import { router, useLocalSearchParams, type Href } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HiveDetailContent } from '@/src/components/hive/HiveDetailContent';
import { ScreenBackground } from '@/src/components/ui/ScreenBackground';
import { useHiveTheme } from '@/src/hooks/useHiveTheme';

export default function HiveDetailScreen() {
  const { t } = useTranslation();
  const theme = useHiveTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const hiveId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : null;

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(tabs)/' as Href);
  }

  return (
    <ScreenBackground>
      <View
        className="flex-row items-center border-b border-hive-stroke px-4 pb-3"
        style={{ paddingTop: insets.top + 8 }}
      >
        <Pressable
          accessibilityLabel={t('hive.back')}
          accessibilityRole="button"
          className="h-10 w-10 items-center justify-center rounded-full border border-hive-stroke bg-hive-surface"
          onPress={handleBack}
        >
          <ChevronLeft color={theme.text} size={24} />
        </Pressable>
        <Text className="flex-1 text-center font-display text-lg font-bold text-hive-foreground">
          {t('hive.title')}
        </Text>
        <View className="w-10" />
      </View>

      {hiveId ? (
        <HiveDetailContent hiveId={hiveId} />
      ) : (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center font-inter text-base text-hive-foreground">
            {t('hive.notFound')}
          </Text>
          <Pressable
            accessibilityRole="button"
            className="mt-6 rounded-full bg-hive-primary px-6 py-3"
            onPress={handleBack}
          >
            <Text className="font-inter text-base font-bold text-hive-on-accent">
              {t('hive.back')}
            </Text>
          </Pressable>
        </View>
      )}
    </ScreenBackground>
  );
}
