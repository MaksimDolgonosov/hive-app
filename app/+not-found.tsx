import { router, type Href } from 'expo-router';
import { Hexagon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthButton } from '@/src/components/auth/AuthButton';
import { ScreenBackground } from '@/src/components/ui/ScreenBackground';

export default function NotFoundScreen() {
  const { t } = useTranslation();

  function handleGoHome() {
    router.replace('/(tabs)' as Href);
  }

  return (
    <ScreenBackground>
      <SafeAreaView className="flex-1">
        <View className="flex-1 items-center justify-center px-8">
          <View
            className="mb-6 h-[88px] w-[88px] items-center justify-center rounded-full bg-hive-primary"
            style={{
              shadowColor: '#FFB800',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.33,
              shadowRadius: 24,
              elevation: 8,
            }}
          >
            <Hexagon color="#0B0A08" fill="#0B0A08" size={44} strokeWidth={0} />
          </View>

          <Text className="font-inter text-[28px] font-bold text-hive-foreground">
            {t('notFound.title')}
          </Text>
          <Text className="mt-3 max-w-[300px] text-center font-inter text-[15px] leading-[22px] text-hive-muted">
            {t('notFound.message')}
          </Text>

          <View className="mt-8 w-full max-w-[320px]">
            <AuthButton title={t('notFound.goHome')} onPress={handleGoHome} />
          </View>
        </View>
      </SafeAreaView>
    </ScreenBackground>
  );
}
