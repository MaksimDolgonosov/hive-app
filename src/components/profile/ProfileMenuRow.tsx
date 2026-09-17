import type { LucideIcon } from 'lucide-react-native';
import { ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useHiveTheme } from '@/src/hooks/useHiveTheme';

type ProfileMenuRowProps = {
  icon: LucideIcon;
  label: string;
  badge?: string | number;
  accessory?: ReactNode;
  showChevron?: boolean;
  showDivider?: boolean;
  disabled?: boolean;
  tone?: 'default' | 'danger';
  onPress?: () => void;
};

export function ProfileMenuRow({
  icon: Icon,
  label,
  badge,
  accessory,
  showChevron,
  showDivider = true,
  disabled = false,
  tone = 'default',
  onPress,
}: ProfileMenuRowProps) {
  const theme = useHiveTheme();
  const isDanger = tone === 'danger';
  const iconColor = isDanger ? theme.danger : theme.accent;
  const labelClass = isDanger ? 'text-hive-danger' : 'text-hive-foreground';
  const chevronVisible = showChevron ?? (Boolean(onPress) && accessory == null);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      className={`h-[52px] flex-row items-center justify-between ${showDivider ? 'border-b border-hive-stroke' : ''}`}
      disabled={disabled}
      onPress={onPress}
      style={disabled ? { opacity: 0.6 } : undefined}
    >
      <View className="min-w-0 flex-1 flex-row items-center gap-3.5 pr-3">
        <Icon color={iconColor} size={18} strokeWidth={2} />
        <Text className={`flex-shrink font-inter text-[15px] font-medium ${labelClass}`}>
          {label}
        </Text>
      </View>

      <View className="flex-row items-center gap-2">
        {accessory}
        {badge !== undefined && (
          <Text className="font-inter text-[14px] font-semibold text-hive-dim">{badge}</Text>
        )}
        {chevronVisible && <ChevronRight color={theme.textDim} size={16} strokeWidth={2} />}
      </View>
    </Pressable>
  );
}
