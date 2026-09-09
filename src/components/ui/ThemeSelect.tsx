import { Moon, Sun } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { useHiveTheme } from '@/src/hooks/useHiveTheme';
import { usePreferencesStore } from '@/src/stores/preferencesStore';
import type { AppColorScheme } from '@/src/theme/tokens';

type ThemeSelectProps = {
  className?: string;
};

const OPTIONS: { value: AppColorScheme; icon: typeof Sun }[] = [
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
];

export function ThemeSelect({ className }: ThemeSelectProps) {
  const { t } = useTranslation();
  const theme = useHiveTheme();
  const colorScheme = usePreferencesStore((state) => state.colorScheme);
  const setColorScheme = usePreferencesStore((state) => state.setColorScheme);

  return (
    <View className={className}>
      <Text className="mb-2 font-inter text-[13px] font-semibold text-hive-foreground">
        {t('theme.label')}
      </Text>

      <View className="flex-row overflow-hidden rounded-hive-md border border-hive-stroke bg-hive-input-bg p-1">
        {OPTIONS.map((option) => {
          const isActive = colorScheme === option.value;
          const Icon = option.icon;

          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              className={`h-11 flex-1 flex-row items-center justify-center gap-2 rounded-[14px] ${
                isActive ? 'bg-hive-primary' : 'bg-transparent'
              }`}
              onPress={() => void setColorScheme(option.value)}
            >
              <Icon
                color={isActive ? theme.textOnAccent : theme.textMuted}
                size={16}
                strokeWidth={2.25}
              />
              <Text
                className={`font-inter text-[14px] font-semibold ${
                  isActive ? 'text-hive-on-accent' : 'text-hive-muted'
                }`}
              >
                {t(`theme.${option.value}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
