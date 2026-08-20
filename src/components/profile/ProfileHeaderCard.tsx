import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import type { ProfileStats, User } from '@/src/types';

import { ProfileAvatar } from './ProfileAvatar';
import { ProfileGlassCard } from './ProfileGlassCard';

type ProfileHeaderCardProps = {
  user: User;
  subtitle: string;
  stats: ProfileStats;
  editableAvatar?: boolean;
};

function StatItem({ value, label }: { value: number; label: string }) {
  return (
    <View className="items-center gap-0.5">
      <Text className="font-inter text-xl font-bold text-hive-primary">{value}</Text>
      <Text className="font-inter text-xs text-hive-muted">{label}</Text>
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
    <ProfileGlassCard>
      <View className="items-center gap-4 px-6 py-6">
        <ProfileAvatar avatarUrl={user.avatarUrl} editable={editableAvatar} username={user.username} />

        <View className="items-center gap-1">
          <Text className="font-inter text-[22px] font-bold text-hive-foreground">
            {user.username}
          </Text>
          <Text className="font-inter text-sm text-hive-muted">{subtitle}</Text>
        </View>

        <View className="w-full flex-row justify-around border-t border-[#F5A62322] pt-3">
          <StatItem label={t('profile.statsPhotos')} value={stats.photos} />
          <StatItem label={t('profile.statsHives')} value={stats.hives} />
          <StatItem label={t('profile.statsLikes')} value={stats.likes} />
        </View>
      </View>
    </ProfileGlassCard>
  );
}
