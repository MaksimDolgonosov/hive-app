import { useFocusEffect } from '@react-navigation/native';
import { router, type Href } from 'expo-router';
import {
  Award,
  Bookmark,
  Heart,
  Hexagon,
  Image as ImageIcon,
  LogOut,
  Settings,
  SlidersHorizontal,
  Store,
  UserPlus,
} from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfileAboutCard } from '@/src/components/profile/ProfileAboutCard';
import { ProfileEditModal } from '@/src/components/profile/ProfileEditModal';
import { ProfileHeaderCard } from '@/src/components/profile/ProfileHeaderCard';
import { ProfileMenuRow } from '@/src/components/profile/ProfileMenuRow';
import { ProfileRecentPhotos } from '@/src/components/profile/ProfileRecentPhotos';
import { ProfileSkeleton } from '@/src/components/profile/ProfileSkeleton';
import { getGlassTabBarInset } from '@/src/components/ui/GlassTabBar';
import { ScreenBackground } from '@/src/components/ui/ScreenBackground';
import { useHiveTheme } from '@/src/hooks/useHiveTheme';
import { useProfileOverview } from '@/src/hooks/useProfileOverview';
import { useAuthStore } from '@/src/stores/authStore';
import { useSavedMapPlacesStore } from '@/src/stores/savedMapPlacesStore';
import type { ProfileStats } from '@/src/types';

const EMPTY_STATS: ProfileStats = {
  photos: 0,
  hives: 0,
  likes: 0,
  awards: 0,
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
            onPress={() => router.push('/settings' as Href)}
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
            badge={stats.awards ? stats.awards : undefined}
            icon={Award}
            label={t('profile.menuAwards')}
            onPress={() => router.push('/(modals)/profile/awards' as Href)}
          />
          <ProfileMenuRow
            icon={UserPlus}
            label={t('profile.menuInvites')}
            onPress={() => router.push('/(modals)/profile/invites' as Href)}
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
            icon={Store}
            label={t('partner.menuApply')}
            onPress={() => router.push('/(modals)/partner/places' as Href)}
          />
          <ProfileMenuRow
            icon={Settings}
            label={t('profile.menuSettings')}
            onPress={() => router.push('/settings' as Href)}
          />
          <ProfileMenuRow
            icon={LogOut}
            label={t('profile.menuLogout')}
            showDivider={false}
            onPress={() => void handleLogout()}
          />
        </View>
      </ScrollView>

      <ProfileEditModal
        user={user}
        visible={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
      />
    </ScreenBackground>
  );
}
