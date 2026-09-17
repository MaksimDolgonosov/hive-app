import { useRef } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { useHiveTheme } from '@/src/hooks/useHiveTheme';

type SettingsToggleRowProps = {
  icon: LucideIcon;
  label: string;
  hint?: string;
  value: boolean;
  onToggle: (next: boolean) => void;
  showDivider?: boolean;
};

const TOGGLE_LOCK_MS = 400;

export function SettingsToggleRow({
  icon: Icon,
  label,
  hint,
  value,
  onToggle,
  showDivider = true,
}: SettingsToggleRowProps) {
  const theme = useHiveTheme();
  const lockedUntilRef = useRef(0);

  function emit(next: boolean) {
    const now = Date.now();
    if (now < lockedUntilRef.current || next === value) {
      return;
    }

    lockedUntilRef.current = now + TOGGLE_LOCK_MS;
    onToggle(next);
  }

  return (
    <View className={showDivider ? 'border-b border-hive-stroke' : undefined}>
      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
        className="h-[52px] flex-row items-center justify-between"
        onPress={() => emit(!value)}
      >
        <View className="min-w-0 flex-1 flex-row items-center gap-3.5 pr-3">
          <Icon color={theme.accent} size={18} strokeWidth={2} />
          <Text className="flex-shrink font-inter text-[15px] font-medium text-hive-foreground">
            {label}
          </Text>
        </View>

        <View collapsable={false} pointerEvents="none">
          <Switch
            accessibilityElementsHidden
            accessibilityLabel={label}
            importantForAccessibility="no"
            ios_backgroundColor={theme.surface2}
            thumbColor="#FFFFFF"
            trackColor={{ false: theme.surface2, true: theme.accent }}
            value={value}
          />
        </View>
      </Pressable>
      {hint ? (
        <Text className="-mt-1 mb-3 pl-[34px] font-inter text-[12px] text-hive-muted">{hint}</Text>
      ) : null}
    </View>
  );
}
