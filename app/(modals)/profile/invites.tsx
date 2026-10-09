import { router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, Share, Text, View } from 'react-native';

import { inviteShareUrl } from '@/legal/public-site';
import { AuthButton } from '@/src/components/auth/AuthButton';
import { ProfileCollectionLayout } from '@/src/components/profile/ProfileCollectionLayout';
import { HiveLoader } from '@/src/components/ui/HiveLoader';
import { useCreateInvite, useMyInvites } from '@/src/hooks/useInvites';
import { showInfoToast } from '@/src/stores/toastStore';
import { getApiErrorCode, getApiErrorRetryAfterSec } from '@/src/utils/api-error';
import { copyToClipboard } from '@/src/utils/clipboard';
import { pickActiveInvite } from '@/src/utils/invite-code';
import { showApiErrorToast } from '@/src/utils/show-toast';

export default function InvitesScreen() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useMyInvites();
  const createInvite = useCreateInvite();
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null);

  const activeInvite = useMemo(() => pickActiveInvite(data?.invites ?? []), [data?.invites]);
  const hasStaleInvite = !activeInvite && (data?.invites.length ?? 0) > 0;
  const isQuotaExhausted = data?.usesLeft === 0;
  const isRateBlocked = blockedUntil != null && Date.now() < blockedUntil;

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(tabs)/profile' as Href);
  }

  async function handleCreate() {
    if (createInvite.isPending || isRateBlocked) {
      return;
    }

    try {
      await createInvite.mutateAsync();
    } catch (error) {
      if (getApiErrorCode(error) === 'RATE_LIMITED') {
        const retryAfterSec = getApiErrorRetryAfterSec(error) ?? 60;
        setBlockedUntil(Date.now() + retryAfterSec * 1000);
      }
      showApiErrorToast(error);
    }
  }

  async function handleCopy() {
    if (!activeInvite) {
      return;
    }

    const copied = await copyToClipboard(inviteShareUrl(activeInvite.code));
    if (copied) {
      showInfoToast({ message: t('invite.copied') });
      return;
    }

    await handleShare();
  }

  async function handleShare() {
    if (!activeInvite) {
      return;
    }

    const url = inviteShareUrl(activeInvite.code);
    const text = `${t('invite.shareMessage')}\n${t('invite.shareCode', { code: activeInvite.code })}`;
    try {
      // iOS добавляет `url` к `message` сам, Android поле `url` игнорирует.
      await Share.share(
        Platform.OS === 'ios' ? { message: text, url } : { message: `${text}\n${url}` },
      );
    } catch {
      // Cancel in the system sheet is not an error.
    }
  }

  return (
    <ProfileCollectionLayout title={t('invite.title')} onBack={handleBack}>
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <HiveLoader size={88} strokeWidth={3} />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center font-inter text-base text-hive-foreground">
            {t('invite.loadError')}
          </Text>
          <Pressable
            accessibilityRole="button"
            className="mt-4 rounded-full bg-hive-primary px-5 py-2.5"
            onPress={() => void refetch()}
          >
            <Text className="font-inter-semibold text-sm text-hive-on-accent">
              {t('profile.collections.retry')}
            </Text>
          </Pressable>
        </View>
      ) : (
        <View className="flex-1 px-5" style={{ paddingBottom: 24 }}>
          <Text className="mt-4 font-inter text-sm text-hive-muted">{t('invite.subtitle')}</Text>

          {activeInvite ? (
            <View className="mt-8 items-center rounded-3xl border border-hive-stroke bg-hive-surface px-5 py-8">
              <Text className="font-inter-semibold text-xs uppercase tracking-[1px] text-hive-muted">
                {t('invite.codeLabel')}
              </Text>
              <Text className="mt-3 font-display text-[34px] tracking-[4px] text-hive-foreground">
                {activeInvite.code}
              </Text>
              <Text className="mt-2 text-center font-inter text-xs text-hive-dim">
                {t('invite.bonusHint')}
              </Text>
            </View>
          ) : (
            <View className="mt-16 items-center px-4">
              <Text className="text-center font-inter-semibold text-base text-hive-foreground">
                {isQuotaExhausted
                  ? t('invite.limitTitle')
                  : hasStaleInvite
                    ? t('invite.expiredTitle')
                    : t('invite.emptyTitle')}
              </Text>
              <Text className="mt-2 text-center font-inter text-sm text-hive-muted">
                {isQuotaExhausted
                  ? t('invite.limitMessage')
                  : hasStaleInvite
                    ? t('invite.expiredMessage')
                    : t('invite.emptyMessage')}
              </Text>
            </View>
          )}

          {data ? (
            <View className="mt-5 flex-row justify-center gap-4">
              <Text className="font-inter text-sm text-hive-muted">
                {t('invite.acceptedCount', { count: data.acceptedCount })}
              </Text>
              <Text className="font-inter text-sm text-hive-muted">
                {t('invite.usesLeft', { count: data.usesLeft })}
              </Text>
            </View>
          ) : null}

          <View className="mt-auto gap-3">
            {activeInvite ? (
              <>
                <AuthButton
                  title={t('invite.copy')}
                  onPress={() => void handleCopy()}
                  showArrow={false}
                />
                <Pressable
                  accessibilityRole="button"
                  className="h-14 items-center justify-center rounded-full border border-hive-stroke"
                  onPress={() => void handleShare()}
                >
                  <Text className="font-inter-bold text-base text-hive-foreground">
                    {t('invite.share')}
                  </Text>
                </Pressable>
              </>
            ) : (
              <AuthButton
                disabled={isRateBlocked || isQuotaExhausted}
                loading={createInvite.isPending}
                title={t('invite.create')}
                onPress={() => void handleCreate()}
                showArrow={false}
              />
            )}
          </View>
        </View>
      )}
    </ProfileCollectionLayout>
  );
}
