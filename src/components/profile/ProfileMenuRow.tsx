import type { LucideIcon } from 'lucide-react-native';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { useHiveTheme } from '@/src/hooks/useHiveTheme';

type ProfileMenuRowProps = {
  icon: LucideIcon;
  label: string;
  badge?: string | number;
  showDivider?: boolean;
  tone?: 'default' | 'danger';
  onPress?: () => void;
};

export function ProfileMenuRow({
  icon: Icon,
  label,
  badge,
  showDivider = true,
  tone = 'default',
  onPress,
}: ProfileMenuRowProps) {
  const theme = useHiveTheme();
  const isDanger = tone === 'danger';
  const iconColor = isDanger ? theme.danger : theme.accent;
  const labelClass = isDanger ? 'text-hive-danger' : 'text-hive-foreground';

  return (
    <Pressable
      accessibilityRole="button"
      className={`h-[52px] flex-row items-center justify-between ${showDivider ? 'border-b border-hive-stroke' : ''}`}
      onPress={onPress}
    >
      <View className="flex-row items-center gap-3.5">
        <Icon color={iconColor} size={18} strokeWidth={2} />
        <Text className={`font-inter text-[15px] font-medium ${labelClass}`}>{label}</Text>
      </View>

      <View className="flex-row items-center gap-2">
        {badge !== undefined && (
          <Text className="font-inter text-[14px] font-semibold text-hive-dim">{badge}</Text>
        )}
        <ChevronRight color={theme.textDim} size={16} strokeWidth={2} />
      </View>
    </Pressable>
  );
}
