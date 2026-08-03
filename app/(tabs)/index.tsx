import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { LanguageSwitcher } from '@/src/components/ui/LanguageSwitcher';
import { useAuthStore } from '@/src/stores/authStore';

export default function HomeScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  async function handleLogout() {
    await logout();
    router.replace('/(auth)/login');
  }

  return (
    <View className="flex-1 items-center justify-center bg-hive-bg px-6">
      <LanguageSwitcher className="absolute right-6 top-16" />

      <Text className="font-inter text-3xl font-bold text-hive-foreground">Hive</Text>
      <Text className="mt-2 text-center font-inter text-base text-hive-muted">
        {t('home.greeting', { name: user?.username ?? t('common.guest') })}
      </Text>
      <Text className="mt-1 text-center font-inter text-sm text-hive-muted">
        {t('home.authWorks')}
      </Text>

      <Pressable
        accessibilityRole="button"
        className="mt-8 rounded-hive-md bg-hive-primary px-6 py-3"
        onPress={handleLogout}
      >
        <Text className="font-inter text-base font-bold text-white">{t('home.logout')}</Text>
      </Pressable>
    </View>
  );
}
