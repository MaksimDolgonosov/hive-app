import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthButton } from '@/src/components/auth/AuthButton';
import { LanguageSwitcher } from '@/src/components/ui/LanguageSwitcher';
import { getGlassTabBarInset } from '@/src/components/ui/GlassTabBar';
import { useAuthStore } from '@/src/stores/authStore';

function getInitials(username: string): string {
  return username
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function formatMemberDate(isoDate: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(isoDate));
}

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const memberSince = useMemo(() => {
    if (!user?.createdAt) {
      return null;
    }

    return formatMemberDate(user.createdAt, i18n.language === 'ru' ? 'ru-RU' : 'en-US');
  }, [i18n.language, user?.createdAt]);

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <View
      className="flex-1 bg-hive-bg px-6"
      style={{
        paddingTop: insets.top + 24,
        paddingBottom: getGlassTabBarInset(insets.bottom) + 16,
      }}
    >
      <Text className="font-inter text-2xl font-bold text-hive-foreground">{t('tabs.profile')}</Text>

      {user && (
        <View className="mt-6 flex-row items-center gap-4">
          {user.avatarUrl ? (
            <Image
              source={{ uri: user.avatarUrl }}
              style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#E8E0D4' }}
            />
          ) : (
            <View className="h-16 w-16 items-center justify-center rounded-full bg-hive-primary/15">
              <Text className="font-inter text-xl font-bold text-hive-primary">
                {getInitials(user.username) || '?'}
              </Text>
            </View>
          )}

          <View className="flex-1">
            <Text className="font-inter text-lg font-semibold text-hive-foreground">
              {user.username}
            </Text>
            {memberSince && (
              <Text className="mt-1 font-inter text-sm text-hive-muted">
                {t('profile.memberSince', { date: memberSince })}
              </Text>
            )}
          </View>
        </View>
      )}

      <LanguageSwitcher className="mt-10" />

      <View className="mt-auto">
        <AuthButton
          loading={isLoggingOut}
          title={t('home.logout')}
          onPress={() => void handleLogout()}
        />
      </View>
    </View>
  );
}
