import { Switch, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { ProfileMenuRow } from '@/src/components/profile/ProfileMenuRow';
import { useHiveTheme } from '@/src/hooks/useHiveTheme';

type SettingsToggleRowProps = {
  icon: LucideIcon;
  label: string;
  hint?: string;
  value: boolean;
  onToggle: () => void;
  showDivider?: boolean;
};

export function SettingsToggleRow({
  icon,
  label,
  hint,
  value,
  onToggle,
  showDivider = true,
}: SettingsToggleRowProps) {
  const theme = useHiveTheme();

  return (
    <View className={showDivider ? 'border-b border-hive-stroke' : undefined}>
      <ProfileMenuRow
        accessory={
          <Switch
            accessibilityLabel={label}
            ios_backgroundColor={theme.surface2}
            pointerEvents="none"
            thumbColor="#FFFFFF"
            trackColor={{ false: theme.surface2, true: theme.accent }}
            value={value}
          />
        }
        icon={icon}
        label={label}
        showChevron={false}
        showDivider={false}
        onPress={onToggle}
      />
      {hint ? (
        <Text className="-mt-1 mb-3 pl-[34px] font-inter text-[12px] text-hive-muted">{hint}</Text>
      ) : null}
    </View>
  );
}
