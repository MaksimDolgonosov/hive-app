import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import type { ProfileStats, User } from '@/src/types';

import { ProfileAvatar } from './ProfileAvatar';

type ProfileHeaderCardProps = {
  user: User;
  subtitle: string;
  stats: ProfileStats;
  editableAvatar?: boolean;
};

function StatItem({ value, label }: { value: number; label: string }) {
  return (
    <View className="flex-1 items-center gap-0.5">
      <Text className="font-display text-2xl font-bold text-hive-foreground">{value}</Text>
      <Text className="font-inter text-[10px] font-semibold uppercase tracking-[0.8px] text-hive-dim">
        {label}
      </Text>
    </View>
  );
}

export function ProfileHeaderCard({
  user,
  subtitle,
  stats,
  editableAvatar = false,
}: ProfileHeaderCardProps) {
  const { t } = useTranslation();

  return (
    <View className="gap-6">
      <View className="flex-row items-center gap-4">
        <ProfileAvatar
          avatarUrl={user.avatarUrl}
          editable={editableAvatar}
          size={72}
          username={user.username}
        />

        <View className="flex-1 gap-1">
          <Text className="font-display text-[20px] font-bold text-hive-foreground">
            {user.username}
          </Text>
          <Text className="font-inter text-[13px] text-hive-muted">{subtitle}</Text>
        </View>
      </View>

      <View className="flex-row items-center">
        <StatItem label={t('profile.statsPhotos')} value={stats.photos} />
        <View className="h-10 w-px bg-hive-stroke" />
        <StatItem label={t('profile.statsHives')} value={stats.hives} />
        <View className="h-10 w-px bg-hive-stroke" />
        <StatItem label={t('profile.statsLikes')} value={stats.likes} />
      </View>
    </View>
  );
}
