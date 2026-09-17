import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { AuthButton } from '@/src/components/auth/AuthButton';
import { HiveLoader } from '@/src/components/ui/HiveLoader';
import type { Zone } from '@/src/types';

type WaitlistContentProps = {
  zone: Zone;
  joining: boolean;
  joined: boolean;
  onJoin: () => void;
};

export function WaitlistContent({ zone, joining, joined, onJoin }: WaitlistContentProps) {
  const { t } = useTranslation();
  const threshold = zone.threshold ?? 0;
  const currentCount = zone.waitlistCount ?? 0;

  if (joined) {
    return (
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-center font-display text-[22px] font-bold text-hive-foreground">
          {t('invite.waitlistJoinedTitle')}
        </Text>
        <Text className="mt-3 text-center font-inter text-sm text-hive-muted">
          {t('invite.waitlistJoinedMessage')}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center px-8">
      <Text className="text-center font-display text-[22px] font-bold text-hive-foreground">
        {t('invite.waitlistTitle')}
      </Text>
      <Text className="mt-3 text-center font-inter text-sm text-hive-muted">
        {t('invite.waitlistMessage', { threshold, currentCount })}
      </Text>
      <View className="mt-8 w-full">
        {joining ? (
          <View className="h-14 items-center justify-center">
            <HiveLoader size="small" />
          </View>
        ) : (
          <AuthButton title={t('invite.waitlistAction')} onPress={onJoin} showArrow={false} />
        )}
      </View>
    </View>
  );
}
