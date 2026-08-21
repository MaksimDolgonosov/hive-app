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

export function PublicProfileSkeleton() {
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
          <SkeletonBlock borderRadius={6} height={18} width={120} />
          <SkeletonBlock borderRadius={6} height={14} width="100%" />
          <SkeletonBlock borderRadius={6} height={14} width="88%" />
          <SkeletonBlock borderRadius={6} height={14} width="72%" />
          <View className="flex-row gap-2">
            <SkeletonBlock borderRadius={999} height={32} width={96} />
            <SkeletonBlock borderRadius={999} height={32} width={88} />
          </View>
        </View>
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
