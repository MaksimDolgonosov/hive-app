import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfileAboutCard } from '@/src/components/profile/ProfileAboutCard';
import { ProfileAvatar } from '@/src/components/profile/ProfileAvatar';
import { ProfileHeaderCard } from '@/src/components/profile/ProfileHeaderCard';
import { PublicProfileSkeleton } from '@/src/components/profile/PublicProfileSkeleton';
import { ProfileRecentPhotos } from '@/src/components/profile/ProfileRecentPhotos';
import { SafetyReportSheet } from '@/src/components/safety/SafetyReportSheet';
import { ScreenBackground } from '@/src/components/ui/ScreenBackground';
import { useHiveTheme } from '@/src/hooks/useHiveTheme';
import { usePublicProfile } from '@/src/hooks/usePublicProfile';
import { useSafetyReport } from '@/src/hooks/useSafetyReport';
import { useAuthStore } from '@/src/stores/authStore';
import type { ProfileStats, User } from '@/src/types';

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
  const theme = useHiveTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const safety = useSafetyReport();
  const [reportOpen, setReportOpen] = useState(false);
  const [reported, setReported] = useState(false);

  const userId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : null;
  const { data, isLoading, isError } = usePublicProfile(userId);

  const showSkeleton = isLoading && !data;
  const showError = isError && !data;
  const isSelf = Boolean(data && currentUserId && data.user.id === currentUserId);
  const isBlocked = data?.blockedByViewer === true;

  const subtitle = useMemo(() => {
    if (!data?.user.createdAt) {
      return '';
    }

    const date = formatMemberDate(data.user.createdAt, i18n.language === 'ru' ? 'ru-RU' : 'en-US');
    return t('profile.memberSince', { date });
  }, [data?.user.createdAt, i18n.language, t]);

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.dismissAll();
  }

  function confirmHide(user: User) {
    Alert.alert(t('safety.hideTitle'), t('safety.hideBody', { username: user.username }), [
      { text: t('safety.hideCancel'), style: 'cancel' },
      {
        text: t('safety.hide'),
        style: 'destructive',
        onPress: () => {
          void safety.hideUser({
            id: user.id,
            username: user.username,
            avatarUrl: user.avatarUrl,
          });
        },
      },
    ]);
  }

  if (!userId) {
    return (
      <ScreenBackground className="items-center justify-center px-8">
        <Text className="text-center font-inter text-base text-hive-foreground">
          {t('userProfile.notFound')}
        </Text>
        <Pressable
          accessibilityRole="button"
          className="mt-6 rounded-full bg-hive-primary px-6 py-3"
          onPress={handleBack}
        >
          <Text className="font-inter text-base font-bold text-hive-on-accent">
            {t('userProfile.back')}
          </Text>
        </Pressable>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <View className="absolute left-0 right-0 z-10 px-4" style={{ top: insets.top + 8 }}>
        <Pressable
          accessibilityLabel={t('userProfile.back')}
          accessibilityRole="button"
          className="h-10 w-10 items-center justify-center rounded-full bg-hive-surface/95"
          onPress={handleBack}
        >
          <ChevronLeft color={theme.text} size={24} />
        </Pressable>
      </View>

      {showError ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center font-inter text-base text-hive-foreground">
            {t('userProfile.notFound')}
          </Text>
          <Pressable
            accessibilityRole="button"
            className="mt-6 rounded-full bg-hive-primary px-6 py-3"
            onPress={handleBack}
          >
            <Text className="font-inter text-base font-bold text-hive-on-accent">
              {t('userProfile.back')}
            </Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + 56,
            paddingBottom: insets.bottom + 24,
            gap: 16,
          }}
          showsVerticalScrollIndicator={false}
        >
          {showSkeleton || !data ? (
            <PublicProfileSkeleton />
          ) : isBlocked ? (
            <BlockedProfileStub
              reported={reported}
              unhiding={safety.hiding}
              user={data.user}
              onReport={() => setReportOpen(true)}
              onUnhide={() => void safety.unhideUser(data.user.id)}
            />
          ) : (
            <>
              <View className="px-5">
                <ProfileHeaderCard
                  stats={data.stats ?? EMPTY_STATS}
                  subtitle={subtitle}
                  user={data.user}
                />
              </View>

              <View className="px-5">
                <ProfileAboutCard
                  emptyBioKey="userProfile.aboutEmpty"
                  emptySocialKey="userProfile.socialEmpty"
                  user={data.user}
                />
              </View>

              <ProfileRecentPhotos layout="grid" photoUrls={data.recentPhotos} />

              {isSelf ? null : (
                <View className="gap-3 px-5 pt-2">
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ disabled: reported }}
                    disabled={reported}
                    onPress={() => setReportOpen(true)}
                  >
                    <Text
                      className="font-inter text-sm text-hive-muted"
                      style={{ opacity: reported ? 0.4 : 1 }}
                    >
                      {t('safety.reportUser')}
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    disabled={safety.hiding}
                    onPress={() => confirmHide(data.user)}
                  >
                    <Text className="font-inter text-sm text-hive-muted">{t('safety.hide')}</Text>
                  </Pressable>
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}

      {data && !isSelf ? (
        <SafetyReportSheet
          submitting={safety.reporting}
          visible={reportOpen}
          onClose={() => {
            if (!safety.reporting) {
              setReportOpen(false);
            }
          }}
          onSubmit={(input) => {
            void safety
              .submitReport({
                target: 'user',
                targetId: data.user.id,
                reason: input.reason,
                comment: input.comment,
                alsoHide: input.alsoHide,
                author: {
                  id: data.user.id,
                  username: data.user.username,
                  avatarUrl: data.user.avatarUrl,
                },
              })
              .then((accepted) => {
                if (!accepted) {
                  return;
                }

                setReported(true);
                setReportOpen(false);
              });
          }}
        />
      ) : null}
    </ScreenBackground>
  );
}

function BlockedProfileStub({
  user,
  reported,
  unhiding,
  onUnhide,
  onReport,
}: {
  user: User;
  reported: boolean;
  unhiding: boolean;
  onUnhide: () => void;
  onReport: () => void;
}) {
  const { t } = useTranslation();

  return (
    <View className="items-center gap-4 px-5 pt-6">
      <ProfileAvatar avatarUrl={user.avatarUrl} size={88} username={user.username} />
      <Text className="font-display text-xl font-bold text-hive-foreground">{user.username}</Text>
      <Text className="text-center font-inter text-sm text-hive-muted">
        {t('safety.hiddenStub')}
      </Text>
      <Pressable
        accessibilityRole="button"
        className="mt-2 rounded-full bg-hive-primary px-6 py-3"
        disabled={unhiding}
        onPress={onUnhide}
      >
        <Text className="font-inter text-base font-bold text-hive-on-accent">
          {t('safety.unhide')}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: reported }}
        disabled={reported}
        onPress={onReport}
      >
        <Text
          className="font-inter text-sm text-hive-muted"
          style={{ opacity: reported ? 0.4 : 1 }}
        >
          {t('safety.reportUser')}
        </Text>
      </Pressable>
    </View>
  );
}
