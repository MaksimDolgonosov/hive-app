import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Hexagon, Image as ImageIcon, LogOut, Settings } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfileAboutCard } from '@/src/components/profile/ProfileAboutCard';
import { ProfileEditModal } from '@/src/components/profile/ProfileEditModal';
import { ProfileGlassCard } from '@/src/components/profile/ProfileGlassCard';
import { ProfileHeaderCard } from '@/src/components/profile/ProfileHeaderCard';
import { ProfileMenuRow } from '@/src/components/profile/ProfileMenuRow';
import { ProfileRecentPhotos } from '@/src/components/profile/ProfileRecentPhotos';
import { getGlassTabBarInset } from '@/src/components/ui/GlassTabBar';
import { LanguageSelect } from '@/src/components/ui/LanguageSelect';
import { useProfileOverview } from '@/src/hooks/useProfileOverview';
import { useAuthStore } from '@/src/stores/authStore';
import type { ProfileStats } from '@/src/types';

const EMPTY_STATS: ProfileStats = {
  photos: 0,
  hives: 0,
  likes: 0,
};

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
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  const { data: profileOverview, refetch: refetchProfileOverview } = useProfileOverview(
    user !== null,
  );

  useFocusEffect(
    useCallback(() => {
      void refreshUser();
      void refetchProfileOverview();
    }, [refetchProfileOverview, refreshUser]),
  );

  const subtitle = useMemo(() => {
    if (!user?.createdAt) {
      return '';
    }

    const date = formatMemberDate(user.createdAt, i18n.language === 'ru' ? 'ru-RU' : 'en-US');
    return t('profile.memberSince', { date });
  }, [i18n.language, t, user?.createdAt]);

  const stats = profileOverview?.stats ?? EMPTY_STATS;
  const recentPhotos = profileOverview?.recentPhotos ?? [];

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

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center bg-hive-bg">
        <Text className="font-inter text-sm text-hive-muted">{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#FFF8ED', '#FFE8B8', '#FFD54F44']}
      locations={[0, 0.5, 1]}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: getGlassTabBarInset(insets.bottom) + 16,
          paddingHorizontal: 20,
          gap: 10,
        }}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeaderCard editableAvatar stats={stats} subtitle={subtitle} user={user} />

        <ProfileAboutCard user={user} onEdit={() => setEditProfileOpen(true)} />

        <ProfileGlassCard>
          <ProfileMenuRow
            badge={stats.photos > 0 ? stats.photos : undefined}
            icon={ImageIcon}
            label={t('profile.menuPhotos')}
            onPress={() => undefined}
          />
          <ProfileMenuRow
            badge={stats.hives > 0 ? stats.hives : undefined}
            icon={Hexagon}
            label={t('profile.menuHives')}
            onPress={() => undefined}
          />
          <ProfileMenuRow
            icon={Heart}
            label={t('profile.menuFavorites')}
            onPress={() => undefined}
          />
          <ProfileMenuRow
            icon={Settings}
            label={t('profile.menuSettings')}
            onPress={() => setSettingsOpen(true)}
          />
          <ProfileMenuRow
            icon={LogOut}
            label={t('profile.menuLogout')}
            showDivider={false}
            onPress={() => void handleLogout()}
          />
        </ProfileGlassCard>

        <ProfileRecentPhotos photoUrls={recentPhotos} />
      </ScrollView>

      <Modal
        animationType="slide"
        transparent
        visible={settingsOpen}
        onRequestClose={() => setSettingsOpen(false)}
      >
        <Pressable
          accessibilityRole="button"
          className="flex-1 justify-end bg-black/40"
          onPress={() => setSettingsOpen(false)}
        >
          <Pressable
            className="rounded-t-[20px] bg-hive-bg px-5 pt-4"
            style={{ paddingBottom: insets.bottom + 20 }}
            onPress={(event) => event.stopPropagation()}
          >
            <View className="mb-4 h-1 w-10 self-center rounded-full bg-hive-primary/30" />
            <Text className="mb-4 text-center font-inter text-lg font-semibold text-hive-foreground">
              {t('profile.menuSettings')}
            </Text>
            <LanguageSelect />
            <Pressable
              accessibilityRole="button"
              className="mt-6 items-center rounded-hive-md bg-hive-primary py-3"
              onPress={() => setSettingsOpen(false)}
            >
              <Text className="font-inter text-base font-semibold text-white">
                {t('profile.closeSettings')}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <ProfileEditModal
        user={user}
        visible={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
      />
    </LinearGradient>
  );
}
