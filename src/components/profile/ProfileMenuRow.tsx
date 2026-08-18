import type { LucideIcon } from 'lucide-react-native';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

type ProfileMenuRowProps = {
  icon: LucideIcon;
  label: string;
  badge?: string | number;
  showDivider?: boolean;
  onPress?: () => void;
};

export function ProfileMenuRow({
  icon: Icon,
  label,
  badge,
  showDivider = true,
  onPress,
}: ProfileMenuRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      className={`h-[52px] flex-row items-center justify-between px-4 ${showDivider ? 'border-b border-[#F5A62322]' : ''}`}
      onPress={onPress}
    >
      <View className="flex-row items-center gap-3">
        <View className="h-8 w-8 items-center justify-center rounded-lg bg-hive-primary/15">
          <Icon color="#F5A623" size={16} strokeWidth={2} />
        </View>
        <Text className="font-inter text-[15px] font-medium text-hive-foreground">{label}</Text>
      </View>

      <View className="flex-row items-center gap-2">
        {badge !== undefined && (
          <Text className="font-inter text-[13px] font-semibold text-hive-primary">{badge}</Text>
        )}
        <ChevronRight color="#8B7355" size={16} strokeWidth={2} />
      </View>
    </Pressable>
  );
}
