import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfileAboutCard } from '@/src/components/profile/ProfileAboutCard';
import { ProfileHeaderCard } from '@/src/components/profile/ProfileHeaderCard';
import { PublicProfileSkeleton } from '@/src/components/profile/PublicProfileSkeleton';
import { ProfileRecentPhotos } from '@/src/components/profile/ProfileRecentPhotos';
import { usePublicProfile } from '@/src/hooks/usePublicProfile';
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

export default function PublicUserProfileScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const userId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : null;
  const { data, isLoading, isError } = usePublicProfile(userId);

  const showSkeleton = isLoading && !data;
  const showError = isError && !data;

  const subtitle = useMemo(() => {
    if (!data?.user.createdAt) {
      return '';
    }

    const date = formatMemberDate(
      data.user.createdAt,
      i18n.language === 'ru' ? 'ru-RU' : 'en-US',
    );
    return t('profile.memberSince', { date });
  }, [data?.user.createdAt, i18n.language, t]);

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.dismissAll();
  }

  if (!userId) {
    return (
      <View className="flex-1 items-center justify-center bg-hive-bg px-8">
        <Text className="text-center font-inter text-base text-hive-foreground">
          {t('userProfile.notFound')}
        </Text>
        <Pressable
          accessibilityRole="button"
          className="mt-6 rounded-hive-md bg-hive-primary px-6 py-3"
          onPress={handleBack}
        >
          <Text className="font-inter text-base font-bold text-white">{t('userProfile.back')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#FFF8ED', '#FFE8B8', '#FFD54F44']} locations={[0, 0.5, 1]} style={{ flex: 1 }}>
      <View className="absolute left-0 right-0 z-10 px-4" style={{ top: insets.top + 8 }}>
        <Pressable
          accessibilityLabel={t('userProfile.back')}
          accessibilityRole="button"
          className="h-10 w-10 items-center justify-center rounded-full bg-hive-surface/95"
          onPress={handleBack}
        >
          <ChevronLeft color="#2C1810" size={24} />
        </Pressable>
      </View>

      {showError ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center font-inter text-base text-hive-foreground">
            {t('userProfile.notFound')}
          </Text>
          <Pressable
            accessibilityRole="button"
            className="mt-6 rounded-hive-md bg-hive-primary px-6 py-3"
            onPress={handleBack}
          >
            <Text className="font-inter text-base font-bold text-white">{t('userProfile.back')}</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + 56,
            paddingBottom: insets.bottom + 24,
            paddingHorizontal: 20,
            gap: 16,
          }}
          showsVerticalScrollIndicator={false}
        >
          {showSkeleton || !data ? (
            <PublicProfileSkeleton />
          ) : (
            <>
              <ProfileHeaderCard stats={data.stats ?? EMPTY_STATS} subtitle={subtitle} user={data.user} />

              <ProfileAboutCard
                emptyBioKey="userProfile.aboutEmpty"
                emptySocialKey="userProfile.socialEmpty"
                user={data.user}
              />

              <ProfileRecentPhotos photoUrls={data.recentPhotos} />
            </>
          )}
        </ScrollView>
      )}
    </LinearGradient>
  );
}
