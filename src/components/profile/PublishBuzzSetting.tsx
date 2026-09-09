import { Vibrate } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Switch, Text, View } from 'react-native';

import { useHiveTheme } from '@/src/hooks/useHiveTheme';
import { usePreferencesStore } from '@/src/stores/preferencesStore';

type PublishBuzzSettingProps = {
  className?: string;
};

export function PublishBuzzSetting({ className }: PublishBuzzSettingProps) {
  const { t } = useTranslation();
  const theme = useHiveTheme();
  const publishBuzzEnabled = usePreferencesStore((state) => state.publishBuzzEnabled);
  const setPublishBuzzEnabled = usePreferencesStore((state) => state.setPublishBuzzEnabled);

  return (
    <View className={className}>
      <Text className="mb-2 font-inter text-[13px] font-semibold text-hive-foreground">
        {t('profile.publishBuzzLabel')}
      </Text>

      <View className="min-h-14 flex-row items-center gap-3 rounded-hive-md border border-hive-stroke bg-hive-input-bg px-3.5 py-3">
        <View className="h-8 w-8 items-center justify-center rounded-lg bg-hive-primary/15">
          <Vibrate color={theme.accent} size={16} strokeWidth={2} />
        </View>

        <View className="flex-1">
          <Text className="mt-0.5 font-inter text-xs text-hive-muted">
            {t('profile.publishBuzzHint')}
          </Text>
        </View>

        <Switch
          accessibilityLabel={t('profile.publishBuzzLabel')}
          trackColor={{ false: theme.surface2, true: theme.accent }}
          thumbColor={'#FFFFFF'}
          ios_backgroundColor={theme.surface2}
          value={publishBuzzEnabled}
          onValueChange={(value) => {
            void setPublishBuzzEnabled(value);
          }}
        />
      </View>
    </View>
  );
}
