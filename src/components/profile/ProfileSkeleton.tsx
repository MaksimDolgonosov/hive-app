import { View } from 'react-native';

import { ProfileGlassCard } from '@/src/components/profile/ProfileGlassCard';
import { SkeletonBlock } from '@/src/components/ui/SkeletonBlock';

function StatSkeleton() {
  return (
    <View className="items-center gap-1.5">
      <SkeletonBlock borderRadius={6} height={20} width={28} />
      <SkeletonBlock borderRadius={4} height={12} width={48} />
    </View>
  );
}

function MenuRowSkeleton({ showDivider = true }: { showDivider?: boolean }) {
  return (
    <View
      className={`h-[52px] flex-row items-center justify-between px-4 ${showDivider ? 'border-b border-[#F5A62322]' : ''}`}
    >
      <View className="flex-row items-center gap-3">
        <SkeletonBlock borderRadius={8} height={32} width={32} />
        <SkeletonBlock borderRadius={4} height={15} width={120} />
      </View>
      <SkeletonBlock borderRadius={4} height={16} width={16} />
    </View>
  );
}

export function ProfileSkeleton() {
  return (
    <>
      <ProfileGlassCard>
        <View className="items-center gap-4 px-6 py-6">
          <SkeletonBlock borderRadius={44} height={88} width={88} />

          <View className="items-center gap-2">
            <SkeletonBlock borderRadius={6} height={22} width={140} />
            <SkeletonBlock borderRadius={4} height={14} width={180} />
          </View>

          <View className="w-full flex-row justify-around border-t border-[#F5A62322] pt-3">
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </View>
        </View>
      </ProfileGlassCard>

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

      <ProfileGlassCard>
        <MenuRowSkeleton />
        <MenuRowSkeleton />
        <MenuRowSkeleton />
        <MenuRowSkeleton />
        <MenuRowSkeleton showDivider={false} />
      </ProfileGlassCard>

      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <SkeletonBlock borderRadius={6} height={20} width={140} />
          <SkeletonBlock borderRadius={6} height={14} width={72} />
        </View>

        <View className="flex-row gap-2">
          <SkeletonBlock borderRadius={12} height={90} width={90} />
          <SkeletonBlock borderRadius={12} height={90} width={90} />
          <SkeletonBlock borderRadius={12} height={90} width={90} />
          <SkeletonBlock borderRadius={12} height={90} width={90} />
        </View>
      </View>
    </>
  );
}
