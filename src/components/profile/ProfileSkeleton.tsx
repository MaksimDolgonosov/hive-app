import { View } from 'react-native';

import { ProfileGlassCard } from '@/src/components/profile/ProfileGlassCard';
import { SkeletonBlock } from '@/src/components/ui/SkeletonBlock';

function StatSkeleton() {
  return (
    <View className="flex-1 items-center gap-1.5">
      <SkeletonBlock borderRadius={6} height={24} width={36} />
      <SkeletonBlock borderRadius={4} height={10} width={56} />
    </View>
  );
}

function MenuRowSkeleton({ showDivider = true }: { showDivider?: boolean }) {
  return (
    <View
      className={`h-[52px] flex-row items-center justify-between ${showDivider ? 'border-b border-hive-stroke' : ''}`}
    >
      <View className="flex-row items-center gap-3.5">
        <SkeletonBlock borderRadius={8} height={18} width={18} />
        <SkeletonBlock borderRadius={4} height={15} width={120} />
      </View>
      <SkeletonBlock borderRadius={4} height={16} width={16} />
    </View>
  );
}

export function ProfileSkeleton() {
  return (
    <>
      <View className="gap-6">
        <View className="flex-row items-center gap-4">
          <SkeletonBlock borderRadius={36} height={72} width={72} />
          <View className="flex-1 gap-2">
            <SkeletonBlock borderRadius={6} height={20} width={160} />
            <SkeletonBlock borderRadius={4} height={14} width={140} />
          </View>
        </View>

        <View className="flex-row items-center">
          <StatSkeleton />
          <View className="h-10 w-px bg-hive-stroke" />
          <StatSkeleton />
          <View className="h-10 w-px bg-hive-stroke" />
          <StatSkeleton />
        </View>
      </View>

      <ProfileGlassCard>
        <View className="gap-4 px-5 py-5">
          <View className="flex-row items-center justify-between">
            <SkeletonBlock borderRadius={6} height={18} width={120} />
            <SkeletonBlock borderRadius={4} height={16} width={16} />
          </View>
          <SkeletonBlock borderRadius={6} height={14} width="100%" />
          <SkeletonBlock borderRadius={6} height={14} width="88%" />
          <SkeletonBlock borderRadius={6} height={14} width="72%" />
        </View>
      </ProfileGlassCard>

      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <SkeletonBlock borderRadius={6} height={16} width={140} />
          <SkeletonBlock borderRadius={6} height={14} width={72} />
        </View>
        <View className="flex-row gap-2">
          <SkeletonBlock borderRadius={16} height={96} width={96} />
          <SkeletonBlock borderRadius={16} height={96} width={96} />
          <SkeletonBlock borderRadius={16} height={96} width={96} />
        </View>
      </View>

      <View>
        <MenuRowSkeleton />
        <MenuRowSkeleton />
        <MenuRowSkeleton />
        <MenuRowSkeleton />
        <MenuRowSkeleton showDivider={false} />
      </View>
    </>
  );
}
