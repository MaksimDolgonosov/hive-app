import { useFocusEffect } from '@react-navigation/native';
import { router, type Href } from 'expo-router';
import {
  Bookmark,
  Heart,
  Hexagon,
  Image as ImageIcon,
  LogOut,
  Settings,
  SlidersHorizontal,
} from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfileAboutCard } from '@/src/components/profile/ProfileAboutCard';
import { PublishBuzzSetting } from '@/src/components/profile/PublishBuzzSetting';
import { ProfileEditModal } from '@/src/components/profile/ProfileEditModal';
import { ProfileHeaderCard } from '@/src/components/profile/ProfileHeaderCard';
import { ProfileMenuRow } from '@/src/components/profile/ProfileMenuRow';
import { ProfileRecentPhotos } from '@/src/components/profile/ProfileRecentPhotos';
import { ProfileSettingsModal } from '@/src/components/profile/ProfileSettingsModal';
import { ProfileSkeleton } from '@/src/components/profile/ProfileSkeleton';
import { getGlassTabBarInset } from '@/src/components/ui/GlassTabBar';
import { LanguageSelect } from '@/src/components/ui/LanguageSelect';
import { ScreenBackground } from '@/src/components/ui/ScreenBackground';
import { ThemeSelect } from '@/src/components/ui/ThemeSelect';
import { useHiveTheme } from '@/src/hooks/useHiveTheme';
import { useProfileOverview } from '@/src/hooks/useProfileOverview';
import { useAuthStore } from '@/src/stores/authStore';
import { useSavedMapPlacesStore } from '@/src/stores/savedMapPlacesStore';
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
  const theme = useHiveTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  const {
    data: profileOverview,
    isLoading: isOverviewLoading,
    refetch: refetchProfileOverview,
  } = useProfileOverview(user !== null);

  const showSkeleton = !user || (isOverviewLoading && !profileOverview);

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
  const savedPlacesCount = useSavedMapPlacesStore((state) => state.places.length);

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

  if (showSkeleton) {
    return (
      <ScreenBackground>
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + 8,
            paddingBottom: getGlassTabBarInset(insets.bottom) + 16,
            paddingHorizontal: 20,
            gap: 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Text className="font-display text-[28px] font-bold text-hive-foreground">
            {t('tabs.profile')}
          </Text>
          <ProfileSkeleton />
        </ScrollView>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: getGlassTabBarInset(insets.bottom) + 16,
          paddingHorizontal: 20,
          gap: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between">
          <Text className="font-display text-[28px] font-bold text-hive-foreground">
            {t('tabs.profile')}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('profile.menuSettings')}
            className="h-10 w-10 items-center justify-center rounded-full border border-hive-stroke bg-hive-surface"
            onPress={() => setSettingsOpen(true)}
          >
            <SlidersHorizontal color={theme.textMuted} size={18} strokeWidth={2} />
          </Pressable>
        </View>

        <ProfileHeaderCard editableAvatar stats={stats} subtitle={subtitle} user={user} />

        <ProfileAboutCard user={user} onEdit={() => setEditProfileOpen(true)} />

        <ProfileRecentPhotos
          photoUrls={recentPhotos}
          onViewAll={() => router.push('/(modals)/profile/photos' as Href)}
        />

        <View>
          <ProfileMenuRow
            badge={stats.photos > 0 ? stats.photos : undefined}
            icon={ImageIcon}
            label={t('profile.menuPhotos')}
            onPress={() => router.push('/(modals)/profile/photos' as Href)}
          />
          <ProfileMenuRow
            badge={stats.hives > 0 ? stats.hives : undefined}
            icon={Hexagon}
            label={t('profile.menuHives')}
            onPress={() => router.push('/(modals)/profile/hives' as Href)}
          />
          <ProfileMenuRow
            badge={savedPlacesCount > 0 ? savedPlacesCount : undefined}
            icon={Bookmark}
            label={t('profile.menuSavedPlaces')}
            onPress={() => router.push('/(modals)/profile/saved-places' as Href)}
          />
          <ProfileMenuRow
            icon={Heart}
            label={t('profile.menuFavorites')}
            onPress={() => router.push('/(modals)/profile/favorites' as Href)}
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
            tone="danger"
            onPress={() => void handleLogout()}
          />
        </View>
      </ScrollView>

      <ProfileSettingsModal visible={settingsOpen} onClose={() => setSettingsOpen(false)}>
        {(requestClose) => (
          <>
            <View className="mb-4 h-1 w-10 self-center rounded-full bg-hive-primary/30" />
            <Text className="mb-4 text-center font-inter text-lg font-semibold text-hive-foreground">
              {t('profile.menuSettings')}
            </Text>
            <LanguageSelect />
            <ThemeSelect className="mt-4" />
            <PublishBuzzSetting className="mt-4" />
            <Pressable
              accessibilityRole="button"
              className="mt-6 items-center rounded-full bg-hive-primary py-3"
              onPress={requestClose}
            >
              <Text className="font-inter text-base font-semibold text-hive-on-accent">
                {t('profile.closeSettings')}
              </Text>
            </Pressable>
          </>
        )}
      </ProfileSettingsModal>

      <ProfileEditModal
        user={user}
        visible={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
      />
    </ScreenBackground>
  );
}
