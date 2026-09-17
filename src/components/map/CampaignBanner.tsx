import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { useCountdown } from '@/src/hooks/useCountdown';
import type { Campaign } from '@/src/types';
import { trackEvent } from '@/src/utils/analytics-queue';

type CampaignBannerProps = {
  campaign: Campaign;
  onPress: () => void;
};

export function CampaignBanner({ campaign, onPress }: CampaignBannerProps) {
  const { t } = useTranslation();
  const countdown = useCountdown(campaign.endsAt);
  const title = campaign.kind === 'event' ? t('campaign.event') : t('campaign.hiveHour');

  useEffect(() => {
    trackEvent('campaign_banner_shown', { props: { kind: campaign.kind } });
  }, [campaign.id, campaign.kind]);

  if (countdown.isExpired) {
    return null;
  }

  return (
    <Pressable
      accessibilityRole="button"
      className="rounded-hive-md bg-hive-primary px-4 py-3 shadow-sm"
      onPress={onPress}
    >
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Text className="font-display text-[15px] font-bold text-hive-on-accent">{title}</Text>
          <Text className="mt-0.5 font-inter text-xs text-hive-on-accent/80">
            {t('campaign.ttlBonus')}
          </Text>
        </View>
        <View className="items-end">
          <Text className="font-inter text-[10px] font-semibold uppercase text-hive-on-accent/70">
            {t('campaign.endsIn')}
          </Text>
          <Text className="font-display text-[15px] font-bold text-hive-on-accent">
            {countdown.remainingLabel}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export function pickSoonestCampaign(campaigns: Campaign[] | undefined): Campaign | null {
  if (!campaigns?.length) {
    return null;
  }

  return [...campaigns].sort(
    (left, right) => new Date(left.endsAt).getTime() - new Date(right.endsAt).getTime(),
  )[0];
}
